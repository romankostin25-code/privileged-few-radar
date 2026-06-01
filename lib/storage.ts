import type { Trend } from '@/types'

export interface DaySnapshot {
  date: string        // YYYY-MM-DD
  trends: Trend[]
  generatedAt: string
}

function isConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

function dateKey(date: string) {
  return `pf:trends:${date}`
}

const INDEX_KEY = 'pf:dates'

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

export async function saveSnapshot(snapshot: DaySnapshot): Promise<void> {
  if (!isConfigured()) return
  const { kv } = await import('@vercel/kv')
  await Promise.all([
    kv.set(dateKey(snapshot.date), snapshot),
    kv.sadd(INDEX_KEY, snapshot.date),
  ])
}

export async function getSnapshot(date: string): Promise<DaySnapshot | null> {
  if (!isConfigured()) return null
  const { kv } = await import('@vercel/kv')
  return kv.get<DaySnapshot>(dateKey(date))
}

export async function listDates(): Promise<string[]> {
  if (!isConfigured()) return []
  const { kv } = await import('@vercel/kv')
  const members = await kv.smembers(INDEX_KEY)
  return (members as string[]).sort((a, b) => b.localeCompare(a))
}
