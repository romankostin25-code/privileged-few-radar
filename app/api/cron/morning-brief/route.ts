import { NextRequest, NextResponse } from 'next/server'
import { fetchTrends } from '@/lib/fetch-trends'
import { saveSnapshot, todayDate } from '@/lib/storage'
import { sendMorningBrief } from '@/lib/email'

export const maxDuration = 120

export async function GET(req: NextRequest) {
  // Verify the request is from Vercel's cron scheduler
  const authHeader = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const date = todayDate()
    console.log(`[cron] morning-brief starting for ${date}`)

    const { trends, generatedAt } = await fetchTrends()
    await saveSnapshot({ date, trends, generatedAt })
    await sendMorningBrief(trends, date)

    console.log(`[cron] morning-brief done — ${trends.length} trends, email sent`)
    return NextResponse.json({ ok: true, date, count: trends.length })
  } catch (err) {
    console.error('[cron] morning-brief error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
