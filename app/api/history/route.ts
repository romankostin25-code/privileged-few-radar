import { NextRequest, NextResponse } from 'next/server'
import { listDates, getSnapshot } from '@/lib/storage'

// GET /api/history          → { dates: string[] }
// GET /api/history?date=... → { snapshot: DaySnapshot | null }
export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get('date')

    if (date) {
      const snapshot = await getSnapshot(date)
      return NextResponse.json({ snapshot })
    }

    const dates = await listDates()
    return NextResponse.json({ dates })
  } catch (err) {
    console.error('[history]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
