import { NextRequest, NextResponse } from 'next/server'
import { fetchTrends } from '@/lib/fetch-trends'
import { saveSnapshot, todayDate, getLatestSnapshot, getRecentTitles } from '@/lib/storage'
import { sendMorningBrief } from '@/lib/email'

export const maxDuration = 300

const BRIEF_INTERVAL_HOURS = 48

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
    // Vercel Cron can't express "every 48 hours" reliably across month
    // boundaries, so this route is triggered daily but self-throttles:
    // it only actually runs once the last brief is >=48h old.
    const latest = await getLatestSnapshot()
    if (latest?.generatedAt) {
      const hoursSinceLast = (Date.now() - new Date(latest.generatedAt).getTime()) / (1000 * 60 * 60)
      if (hoursSinceLast < BRIEF_INTERVAL_HOURS) {
        console.log(`[cron] skipping — last brief ran ${hoursSinceLast.toFixed(1)}h ago, waiting for ${BRIEF_INTERVAL_HOURS}h`)
        return NextResponse.json({ ok: true, skipped: true, hoursSinceLast: Number(hoursSinceLast.toFixed(1)) })
      }
    }

    const date = todayDate()
    console.log(`[cron] morning-brief starting for ${date}`)

    const avoidTitles = await getRecentTitles()
    const { trends, generatedAt } = await fetchTrends(avoidTitles)
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
