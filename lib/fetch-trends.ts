import Anthropic from '@anthropic-ai/sdk'
import type { Trend, Category, HeatLevel, Platform } from '@/types'

const SYSTEM_PROMPT = `You are a content intelligence assistant for Privileged Few — a cross-platform media company run by Albina Aliyeva (@aliyevaal / @weareprivilegedfew). The brand is focused on wealth transparency, rich people lifestyles, privilege, relationships, and social mobility. The core audience is ambitious, globally-minded women aged 18–34 interested in: luxury, nepo babies, wealth secrets, old vs new money, celebrity relationships, prenups, how to get rich, class dynamics, and billionaire culture.

Your job is to scan the web and find the 9 most relevant trending stories from the last 24–72 hours that Albina can reference in her Instagram Reels to make them feel timely and culturally relevant.

For each trend, provide:
- title: A punchy, scroll-stopping headline (max 12 words)
- summary: Exactly 2 sentences explaining what happened and why people care
- angle: A specific Reel angle tailored to Albina's voice and the Privileged Few brand — how she can spin this story for her audience (1-2 sentences)
- category: One of exactly these values: "wealth" | "relationships" | "class" | "celebrity" | "culture"
- heat: One of exactly these values: "hot" (breaking/viral right now) | "warm" (rising, building momentum) | "cool" (interesting but slow-burning)
- tags: Array of 3-5 relevant hashtag-style keywords (no # symbol, lowercase)
- platform: Where this is blowing up most — one of: "instagram" | "tiktok" | "twitter" | "youtube" | "news"

Return ONLY a valid JSON array of exactly 9 objects. No markdown, no backticks, no explanatory text before or after. Start your response with [ and end with ].`

const USER_PROMPT = `Search for what's trending RIGHT NOW in the last 24-72 hours related to: wealth, luxury, celebrity relationships, nepo babies, inheritance drama, old vs new money, prenups, viral money debates, class warfare moments, billionaire culture, rich people drama, influencer wealth, and anything making people argue about privilege and social class.

Find the 9 most viral and culturally relevant stories that an Instagram Reels creator focused on wealth and privilege could reference to make her content feel timely. Prioritize stories that are actively being discussed across social media RIGHT NOW.

Return ONLY the JSON array.`

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
    throw new Error('ANTHROPIC_API_KEY is not set. Add it in Vercel → Project Settings → Environment Variables.')
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    tools: [{ type: 'web_search_20250305' as const, name: 'web_search', max_uses: 5 }],
    messages: [{ role: 'user', content: USER_PROMPT }],
  })

  const textContent = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const jsonMatch = textContent.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Model returned no parseable JSON array')

  const rawTrends: unknown[] = JSON.parse(jsonMatch[0])
  const fetchedAt = new Date().toISOString()

  return {
    trends: rawTrends
      .slice(0, 9)
      .map((r) => sanitizeTrend(r as Record<string, unknown>, fetchedAt)),
    generatedAt: fetchedAt,
  }
}
