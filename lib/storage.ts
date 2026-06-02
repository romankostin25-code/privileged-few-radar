import type { Trend } from '@/types'

export interface DaySnapshot {
  date: string
  trends: Trend[]
  generatedAt: string
}

function isConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

const DATE_KEY = (date: string) => `pf:trends:${date}`
const INDEX_KEY = 'pf:dates'

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

async function getRedis() {
  const { Redis } = await import('@upstash/redis')
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

export async function saveSnapshot(snapshot: DaySnapshot): Promise<void> {
  if (!isConfigured()) {
    console.warn('[storage] Upstash env vars not set — snapshot not saved')
    return
  }
  const redis = await getRedis()
  await Promise.all([
    redis.set(DATE_KEY(snapshot.date), JSON.stringify(snapshot)),
    redis.sadd(INDEX_KEY, snapshot.date),
  ])
  console.log('[storage] saved snapshot for', snapshot.date)
}

export async function getSnapshot(date: string): Promise<DaySnapshot | null> {
  if (!isConfigured()) return null
  try {
    const redis = await getRedis()
    const raw = await redis.get(DATE_KEY(date))
    if (!raw) return null
    return typeof raw === 'string' ? JSON.parse(raw) : raw as DaySnapshot
  } catch (err) {
    console.error('[storage] getSnapshot failed:', err)
    return null
  }
}

export async function listDates(): Promise<string[]> {
  if (!isConfigured()) return []
  try {
    const redis = await getRedis()
    const members = await redis.smembers(INDEX_KEY)
    return (members as string[]).sort((a, b) => b.localeCompare(a))
  } catch (err) {
    console.error('[storage] listDates failed:', err)
    return []
  }
}
