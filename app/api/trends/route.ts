import { NextResponse } from 'next/server'
import { fetchTrends } from '@/lib/fetch-trends'
import { saveSnapshot, todayDate, getRecentTitles } from '@/lib/storage'

export const maxDuration = 120

export async function POST() {
  try {
    const avoidTitles = await getRecentTitles()
    const { trends, generatedAt } = await fetchTrends(avoidTitles)
    const date = todayDate()

    await saveSnapshot({ date, trends, generatedAt })

    return NextResponse.json({ trends, generatedAt, date })
  } catch (err) {
    console.error('[trends]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
