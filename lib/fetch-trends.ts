import Anthropic from '@anthropic-ai/sdk'
import type { Trend, Category, HeatLevel, Platform, PredictionWindow, Confidence } from '@/types'

const CURRENT_COUNT = 18
const PREDICTED_COUNT = 8

// ─────────────────────────────────────────────────────────────────────────
// CURRENT trends — what's already trending in the last 24-72h
// ─────────────────────────────────────────────────────────────────────────

const CURRENT_RESEARCH_SYSTEM = `You are a content intelligence researcher for Privileged Few, a media brand run by Albina Aliyeva (@aliyevaal / @weareprivilegedfew). The brand focuses on wealth transparency, rich people lifestyles, privilege, relationships, and social mobility. The audience is ambitious women aged 18–34 interested in luxury, nepo babies, wealth secrets, old vs new money, celebrity relationships, prenups, class dynamics, and billionaire culture.

Albina's PRIMARY platform is Instagram Reels — so Instagram-native viral moments are the highest priority. Also cover TikTok, Twitter/X, and news.

Search the web and compile a detailed list of the ${CURRENT_COUNT} most culturally relevant trending stories from the last 24–72 hours. For each story include: what happened, why people care, which platform it originated on, and a specific Reel angle for Albina.`

const CURRENT_RESEARCH_PROMPT = `Run these searches to find today's trending stories:

1. Search "trending Instagram Reels wealth luxury" to find what's going viral on Instagram right now
2. Search "viral Instagram posts rich privilege class" for Instagram-native moments
3. Search "trending now celebrity relationships prenup inheritance drama" for celebrity stories
4. Search "viral wealth gap billionaire controversy" for money debates blowing up on social
5. Search "nepo baby influencer rich drama this week" for influencer/class content

Compile the ${CURRENT_COUNT} most relevant stories across all searches. Prioritise stories that are:
- Already circulating as Instagram Reels or being discussed by Instagram creators
- Getting strong engagement on Instagram, TikTok, or Twitter/X
- Directly related to: wealth, privilege, relationships, class, luxury, celebrity money drama

Include specific details: names, numbers, quotes — enough for Albina to reference in a Reel.`

const CURRENT_FORMAT_SYSTEM = `You are a JSON formatter. You receive research notes and convert them into a structured JSON array. Output ONLY the JSON — no prose, no markdown, no explanation.

Each object must have exactly these fields:
- title: string (punchy headline, max 12 words)
- summary: string (exactly 2 sentences)
- angle: string (specific Reel angle for Albina, 1-2 sentences)
- category: exactly one of "wealth" | "relationships" | "class" | "celebrity" | "culture"
- heat: exactly one of "hot" | "warm" | "cool"
- tags: array of 3-5 lowercase keyword strings (no # symbol)
- platform: exactly one of "instagram_reels" | "instagram" | "tiktok" | "twitter" | "youtube" | "news" — use "instagram_reels" when the story is specifically circulating as Reels content`

// ─────────────────────────────────────────────────────────────────────────
// PREDICTED trends — early signals likely to break out within 48h to a week
// ─────────────────────────────────────────────────────────────────────────

const PREDICTED_RESEARCH_SYSTEM = `You are a trend-forecasting researcher for Privileged Few, a media brand run by Albina Aliyeva (@aliyevaal / @weareprivilegedfew) focused on wealth transparency, privilege, relationships, and social mobility, for an audience of ambitious women aged 18–34.

Your job is NOT to find what's already viral — that is covered elsewhere. Your job is to find EARLY SIGNALS: discussions that are gaining real momentum right now but have not broken into mainstream Instagram/TikTok yet, and to predict which of them will become bigger cultural stories within the next 48 hours to a week.

Reddit is your primary hunting ground — cultural shifts around work, money, class, and gender often surface there weeks before they hit mainstream social feeds. Mine Reddit threads (and secondarily Twitter/X and news) across these seven themes: work & labor, economics & personal finance, privilege, society & culture, wealth, equality, and women's rights.

For every candidate you surface, capture CONCRETE evidence: the subreddit name, the thread title, approximate upvotes/comments and how fast they are climbing, notable quotes, and whether the same theme is independently popping up in multiple threads or communities (a strong signal of a real emerging trend, not a one-off post). Distinguish "early and growing fast" (a good prediction candidate) from "already huge" (that belongs in the current-trends list instead, not here).`

const PREDICTED_RESEARCH_PROMPT = `Run these searches to find early signals before they break out:

1. Search site:reddit.com "antiwork" OR "WorkReform" OR "recruitinghell" for rising discussions about work and labor
2. Search site:reddit.com "personalfinance" OR "economy" OR "inflation" for rising discussions about economics and money
3. Search site:reddit.com "AmItheAsshole" OR "relationship_advice" rich family inheritance privilege for rising discussions about privilege
4. Search site:reddit.com "TrueOffMyChest" OR "unpopularopinion" class wealth society for rising discussions about society and class
5. Search site:reddit.com "FatFIRE" OR "wallstreetbets" wealth drama controversy for rising discussions about wealth
6. Search site:reddit.com "AskWomen" OR "TwoXChromosomes" OR "MensLib" equality gender for rising discussions about equality
7. Search site:reddit.com "AskWomen" OR "women" OR "feminism" women's rights this week for rising discussions about women's rights
8. Search "reddit thread gaining traction" wealth gap OR wage transparency OR "eat the rich" this week for cross-platform corroboration

Compile ${PREDICTED_COUNT} emerging themes — NOT stories that are already mainstream-viral, but ones that show real momentum and could plausibly break out within 48 hours to a week. For each, note: the specific evidence (subreddit + thread + engagement), why you think it will grow, and how soon (48 hours vs. 3-7 days).`

const PREDICTED_FORMAT_SYSTEM = `You are a JSON formatter. You receive trend-forecasting research notes and convert them into a structured JSON array of predicted trends. Output ONLY the JSON — no prose, no markdown, no explanation.

Each object must have exactly these fields:
- title: string (punchy headline naming the emerging theme, max 14 words)
- summary: string (2-3 sentences describing the emerging pattern itself)
- predictedWindow: exactly "48h" or "3-7d" — how soon you expect this to break out
- confidence: exactly "high" | "medium" | "low"
- evidence: array of 3-5 strings — SPECIFIC signals (subreddit name, thread title, approximate upvotes/comments or growth rate, direct quotes). Be concrete, never generic.
- reasoning: string (3-5 sentences) — why this will break out: connect the evidence to a broader pattern, a comparable past moment, or a timing catalyst
- angle: string (2-4 sentences) — a DETAILED Reel angle for Albina: the hook she could open with, the point of view she should take, and how to frame it so she looks ahead of the curve before it's mainstream
- category: exactly one of "wealth" | "relationships" | "class" | "celebrity" | "culture"
- tags: array of 3-5 lowercase keyword strings (no # symbol)
- platform: exactly one of "reddit" | "twitter" | "instagram" | "instagram_reels" | "tiktok" | "news" — wherever the early signal is strongest`

// ─────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────

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
  return ['instagram', 'instagram_reels', 'tiktok', 'twitter', 'youtube', 'news', 'reddit'].includes(val)
}

function isValidWindow(val: string): val is PredictionWindow {
  return ['48h', '3-7d'].includes(val)
}

function isValidConfidence(val: string): val is Confidence {
  return ['high', 'medium', 'low'].includes(val)
}

function sanitizeCurrentTrend(raw: Record<string, unknown>, fetchedAt: string): Trend {
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
    kind: 'current',
  }
}

function sanitizePredictedTrend(raw: Record<string, unknown>, fetchedAt: string): Trend {
  return {
    id: generateId(),
    title: String(raw.title ?? 'Untitled prediction'),
    summary: String(raw.summary ?? ''),
    angle: String(raw.angle ?? ''),
    category: isValidCategory(String(raw.category)) ? (raw.category as Category) : 'culture',
    heat: 'warm',
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    platform: isValidPlatform(String(raw.platform)) ? (raw.platform as Platform) : 'reddit',
    fetchedAt,
    kind: 'predicted',
    predictedWindow: isValidWindow(String(raw.predictedWindow)) ? (raw.predictedWindow as PredictionWindow) : '3-7d',
    confidence: isValidConfidence(String(raw.confidence)) ? (raw.confidence as Confidence) : 'medium',
    evidence: Array.isArray(raw.evidence) ? raw.evidence.map(String) : [],
    reasoning: String(raw.reasoning ?? ''),
  }
}

async function research(client: Anthropic, system: string, prompt: string): Promise<string> {
  const res = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 8000,
    system,
    tools: [{ type: 'web_search_20250305' as const, name: 'web_search' }],
    messages: [{ role: 'user', content: prompt }],
  })

  const text = res.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  if (!text.trim()) {
    throw new Error('Web search returned no research content.')
  }
  return text
}

async function formatAsJson(
  client: Anthropic,
  system: string,
  researchText: string,
  count: number
): Promise<unknown[]> {
  const formatRes = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 9000,
    system,
    messages: [
      { role: 'user', content: `Convert these ${count} trends into the JSON array format:\n\n${researchText}` },
      // Prefill the assistant response with [ so it MUST continue as a JSON array
      { role: 'assistant', content: '[' },
    ],
  })

  const jsonBody = formatRes.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const jsonText = '[' + jsonBody

  try {
    return JSON.parse(jsonText)
  } catch (e) {
    throw new Error(`JSON parse failed: ${e}. Content: "${jsonText.slice(0, 300)}"`)
  }
}

export async function fetchTrends(): Promise<{ trends: Trend[]; generatedAt: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set in Vercel environment variables.')
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  console.log('[fetch-trends] researching current + predicted in parallel...')
  const [currentResearch, predictedResearch] = await Promise.all([
    research(client, CURRENT_RESEARCH_SYSTEM, CURRENT_RESEARCH_PROMPT),
    research(client, PREDICTED_RESEARCH_SYSTEM, PREDICTED_RESEARCH_PROMPT),
  ])
  console.log('[fetch-trends] research done. current:', currentResearch.length, 'predicted:', predictedResearch.length)

  console.log('[fetch-trends] formatting as JSON in parallel...')
  const [rawCurrent, rawPredicted] = await Promise.all([
    formatAsJson(client, CURRENT_FORMAT_SYSTEM, currentResearch, CURRENT_COUNT),
    formatAsJson(client, PREDICTED_FORMAT_SYSTEM, predictedResearch, PREDICTED_COUNT),
  ])
  console.log('[fetch-trends] formatting done. current:', rawCurrent.length, 'predicted:', rawPredicted.length)

  const fetchedAt = new Date().toISOString()
  const trends: Trend[] = [
    ...rawCurrent.slice(0, CURRENT_COUNT).map((r) => sanitizeCurrentTrend(r as Record<string, unknown>, fetchedAt)),
    ...rawPredicted.slice(0, PREDICTED_COUNT).map((r) => sanitizePredictedTrend(r as Record<string, unknown>, fetchedAt)),
  ]

  return { trends, generatedAt: fetchedAt }
}
