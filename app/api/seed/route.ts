import { NextResponse } from 'next/server'
import { fetchTrends } from '@/lib/fetch-trends'
import { saveSnapshot, todayDate } from '@/lib/storage'

export const maxDuration = 300

// One-shot endpoint to seed today's trends manually.
// No auth — acceptable since triggering costs only one API call.
// After the daily cron is running this endpoint is never needed again.
export async function POST() {
  try {
    const date = todayDate()
    const { trends, generatedAt } = await fetchTrends()

    // Save to Redis — log result so we can see in Vercel logs if it fails
    try {
      await saveSnapshot({ date, trends, generatedAt })
      console.log('[seed] saved to Redis OK for', date)
    } catch (redisErr) {
      console.error('[seed] Redis save FAILED:', redisErr)
      // Continue — still return trends to the requesting user
    }

    return NextResponse.json({ ok: true, date, trends, generatedAt })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
