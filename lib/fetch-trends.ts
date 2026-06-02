import Anthropic from '@anthropic-ai/sdk'
import type { Trend, Category, HeatLevel, Platform } from '@/types'

// Stage 1: research prompt — Claude searches freely, no JSON constraint
const RESEARCH_SYSTEM = `You are a content intelligence researcher for Privileged Few, a media brand run by Albina Aliyeva focused on wealth transparency, rich people lifestyles, privilege, relationships, and social mobility. The audience is ambitious women aged 18–34 interested in luxury, nepo babies, wealth secrets, old vs new money, celebrity relationships, prenups, class dynamics, and billionaire culture.

Search the web and compile a detailed list of the 9 most culturally relevant trending stories from the last 24–72 hours. For each story include: what happened, why people care, which platform it's blowing up on, and a specific content angle for Albina's Instagram Reels.`

const RESEARCH_PROMPT = `Search for what's trending RIGHT NOW in the last 24-72 hours related to: wealth, luxury, celebrity relationships, nepo babies, inheritance drama, old vs new money, prenups, viral money debates, class warfare, billionaire culture, rich people drama, and anything making people argue about privilege and social class.

Find 9 specific viral stories with enough detail to write about each one.`

// Stage 2: formatting prompt — takes research, outputs only JSON
const FORMAT_SYSTEM = `You are a JSON formatter. You receive research notes and convert them into a structured JSON array. Output ONLY the JSON — no prose, no markdown, no explanation.

Each object must have exactly these fields:
- title: string (punchy headline, max 12 words)
- summary: string (exactly 2 sentences)
- angle: string (specific Reel angle for Albina, 1-2 sentences)
- category: exactly one of "wealth" | "relationships" | "class" | "celebrity" | "culture"
- heat: exactly one of "hot" | "warm" | "cool"
- tags: array of 3-5 lowercase keyword strings (no # symbol)
- platform: exactly one of "instagram" | "tiktok" | "twitter" | "youtube" | "news"`

function generateId(): string {
  return `trend_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function isValidCategory(val: string): val is Category {
  return ['wealth', 'relationships', 'class', 'celebrity', 'culture'].includes(val)
}

function isValidHeat(val: string): val is HeatLevel {
  return ['hot', 'warm', 'cool'].includes(val)
}

function isValidPlatform(val: string): val is Platform {
  return ['instagram', 'tiktok', 'twitter', 'youtube', 'news'].includes(val)
}

function sanitizeTrend(raw: Record<string, unknown>, fetchedAt: string): Trend {
  return {
    id: generateId(),
    title: String(raw.title ?? 'Untitled trend'),
    summary: String(raw.summary ?? ''),
    angle: String(raw.angle ?? ''),
    category: isValidCategory(String(raw.category)) ? (raw.category as Category) : 'culture',
    heat: isValidHeat(String(raw.heat)) ? (raw.heat as HeatLevel) : 'warm',
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    platform: isValidPlatform(String(raw.platform)) ? (raw.platform as Platform) : 'news',
    fetchedAt,
  }
}

export async function fetchTrends(): Promise<{ trends: Trend[]; generatedAt: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set in Vercel environment variables.')
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // ── Stage 1: research with web search (Claude writes freely) ──────────────
  console.log('[fetch-trends] stage 1: researching...')
  const researchRes = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    system: RESEARCH_SYSTEM,
    tools: [{ type: 'web_search_20250305' as const, name: 'web_search' }],
    messages: [{ role: 'user', content: RESEARCH_PROMPT }],
  })

  const research = researchRes.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  console.log('[fetch-trends] stage 1 done, research length:', research.length)

  if (!research.trim()) {
    throw new Error('Web search returned no research content.')
  }

  // ── Stage 2: format research into JSON (prefilled response = guaranteed JSON) ──
  console.log('[fetch-trends] stage 2: formatting as JSON...')
  const formatRes = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 6000,
    system: FORMAT_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Convert these 9 trending stories into the JSON array format:\n\n${research}`,
      },
      {
        // Prefill the assistant response with [ so it MUST continue as a JSON array
        role: 'assistant',
        content: '[',
      },
    ],
  })

  const jsonBody = formatRes.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  // Prepend the prefilled '[' back and parse
  const jsonText = '[' + jsonBody

  console.log('[fetch-trends] stage 2 done, json length:', jsonText.length)

  let rawTrends: unknown[]
  try {
    rawTrends = JSON.parse(jsonText)
  } catch (e) {
    throw new Error(`JSON parse failed: ${e}. Content: "${jsonText.slice(0, 300)}"`)
  }

  const fetchedAt = new Date().toISOString()
  return {
    trends: rawTrends
      .slice(0, 9)
      .map((r) => sanitizeTrend(r as Record<string, unknown>, fetchedAt)),
    generatedAt: fetchedAt,
  }
}
