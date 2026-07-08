import type { Trend } from '@/types'

export interface DaySnapshot {
  date: string
  trends: Trend[]
  generatedAt: string
}

const PREFIX = 'pf/trends/'

function isConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function saveSnapshot(snapshot: DaySnapshot): Promise<void> {
  if (!isConfigured()) {
    console.warn('[storage] BLOB_READ_WRITE_TOKEN not set — snapshot not saved')
    return
  }
  const { put } = await import('@vercel/blob')
  await put(`${PREFIX}${snapshot.date}.json`, JSON.stringify(snapshot), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  })
  console.log('[storage] saved blob for', snapshot.date)
}

export async function getSnapshot(date: string): Promise<DaySnapshot | null> {
  if (!isConfigured()) return null
  try {
    const { list } = await import('@vercel/blob')
    const { blobs } = await list({ prefix: `${PREFIX}${date}.json`, limit: 1 })
    if (!blobs.length) return null
    const res = await fetch(blobs[0].url)
    if (!res.ok) return null
    return res.json()
  } catch (err) {
    console.error('[storage] getSnapshot failed:', err)
    return null
  }
}

export async function getLatestSnapshot(): Promise<DaySnapshot | null> {
  const dates = await listDates()
  if (!dates.length) return null
  return getSnapshot(dates[0])
}

export async function listDates(): Promise<string[]> {
  if (!isConfigured()) return []
  try {
    const { list } = await import('@vercel/blob')
    const { blobs } = await list({ prefix: PREFIX })
    return blobs
      .map(b => b.pathname.replace(PREFIX, '').replace('.json', ''))
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort((a, b) => b.localeCompare(a))
  } catch (err) {
    console.error('[storage] listDates failed:', err)
    return []
  }
}
