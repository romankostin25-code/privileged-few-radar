import type { Trend } from '@/types'

export interface DaySnapshot {
  date: string        // YYYY-MM-DD
  trends: Trend[]
  generatedAt: string
}

function isConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

function dateKey(date: string) {
  return `pf:trends:${date}`
}

const INDEX_KEY = 'pf:dates'

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function getRedis() {
  const { Redis } = require('@upstash/redis')
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

export async function saveSnapshot(snapshot: DaySnapshot): Promise<void> {
  if (!isConfigured()) return
  const redis = getRedis()
  await Promise.all([
    redis.set(dateKey(snapshot.date), snapshot),
    redis.sadd(INDEX_KEY, snapshot.date),
  ])
}

export async function getSnapshot(date: string): Promise<DaySnapshot | null> {
  if (!isConfigured()) return null
  const redis = getRedis()
  return redis.get(dateKey(date))
}

export async function listDates(): Promise<string[]> {
  if (!isConfigured()) return []
  const redis = getRedis()
  const members: string[] = await redis.smembers(INDEX_KEY)
  return members.sort((a, b) => b.localeCompare(a))
}
