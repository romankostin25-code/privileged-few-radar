'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Trend } from '@/types'
import FilterBar, { FilterValue } from '@/components/FilterBar'
import TrendCard from '@/components/TrendCard'
import ScriptModal from '@/components/ScriptModal'
import CalendarPicker from '@/components/CalendarPicker'

function fmtDateLong(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function fmtDateShort(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function HomePage() {
  const [trends, setTrends] = useState<Trend[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null)

  const [historyDates, setHistoryDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [seedError, setSeedError] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const filteredTrends = useMemo(
    () => activeFilter === 'all' ? trends : trends.filter(t => t.category === activeFilter),
    [trends, activeFilter]
  )

  const loadDay = useCallback(async (date: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/history?date=${date}`)
      const data = await res.json()
      setTrends(data.snapshot?.trends ?? [])
      setSelectedDate(date)
      setActiveFilter('all')
    } catch {
      setTrends([])
      setSelectedDate(date)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshDates = useCallback(async (): Promise<string[]> => {
    try {
      const res = await fetch('/api/history')
      const data = await res.json()
      const dates: string[] = data.dates ?? []
      setHistoryDates(dates)
      return dates
    } catch {
      return []
    }
  }, [])

  // On mount: load index then auto-select most recent day
  useEffect(() => {
    refreshDates().then(dates => {
      if (dates.length > 0) loadDay(dates[0])
      else setLoading(false)
    })
  }, [refreshDates, loadDay])

  // Manual trigger — works any time, not just on first run
  async function generateBrief() {
    setSeedError(null)
    setSeeding(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 150_000)
    try {
      const res = await fetch('/api/seed', { method: 'POST', signal: controller.signal })
      const text = await res.text()
      let data: { ok?: boolean; date?: string; trends?: import('@/types').Trend[]; generatedAt?: string; error?: string }
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(
          text.toLowerCase().includes('timeout') || text.toLowerCase().includes('duration')
            ? 'Function timed out — check Vercel function logs.'
            : 'Server error — verify ANTHROPIC_API_KEY is set in Vercel env vars.'
        )
      }
      if (!res.ok || data.error) throw new Error(data.error ?? 'Generation failed')
      clearTimeout(timeout)

      // Use trends directly from response — don't wait on Redis
      if (data.trends?.length) {
        setTrends(data.trends)
        setSelectedDate(data.date ?? todayISO())
        setActiveFilter('all')
      }

      // Refresh history index in background so calendar updates
      refreshDates()
    } catch (err) {
      clearTimeout(timeout)
      setSeedError(
        err instanceof Error
          ? (err.name === 'AbortError' ? 'Timed out after 150s — check Vercel logs.' : err.message)
          : 'Generation failed'
      )
    } finally {
      setSeeding(false)
    }
  }

  // Navigate between saved days
  const dateIndex = selectedDate ? historyDates.indexOf(selectedDate) : -1
  const hasPrev = dateIndex < historyDates.length - 1
  const hasNext = dateIndex > 0

  function goPrev() { if (hasPrev) loadDay(historyDates[dateIndex + 1]) }
  function goNext() { if (hasNext) loadDay(historyDates[dateIndex - 1]) }

  const isToday = selectedDate === todayISO()
  const hasData = trends.length > 0
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <>
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        {/* Header */}
        <header className="border-b border-[rgba(255,255,255,0.06)] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Title */}
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#d4a574]">
                  Privileged Few
                </p>
                <h1
                  className="text-3xl text-[#f0ece4] leading-none"
                  style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
                >
                  Daily Trend Radar
                </h1>
                <p className="text-xs text-[#6b6560] mt-1.5">{today}</p>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Date navigator — only when history exists */}
                {historyDates.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goPrev}
                      disabled={!hasPrev || loading || seeding}
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] text-[#6b6560] hover:text-[#d4a574] hover:border-[rgba(212,165,116,0.4)] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Older"
                    >
                      ‹
                    </button>

                    <button
                      onClick={() => setCalendarOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(255,255,255,0.1)] text-sm text-[#c8bfb4] hover:border-[rgba(212,165,116,0.4)] hover:text-[#d4a574] transition-all"
                    >
                      <span className="text-[#d4a574] text-xs">📅</span>
                      <span>{selectedDate ? (isToday ? 'Today' : fmtDateShort(selectedDate)) : 'Select date'}</span>
                    </button>

                    <button
                      onClick={goNext}
                      disabled={!hasNext || loading || seeding}
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] text-[#6b6560] hover:text-[#d4a574] hover:border-[rgba(212,165,116,0.4)] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Newer"
                    >
                      ›
                    </button>
                  </div>
                )}

                {/* Generate brief button — always visible */}
                <button
                  onClick={generateBrief}
                  disabled={seeding || loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#d4a574] text-[#d4a574] text-sm font-medium hover:bg-[rgba(212,165,116,0.12)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {seeding ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-[rgba(212,165,116,0.3)] border-t-[#d4a574] animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>↻ Generate brief</>
                  )}
                </button>
              </div>
            </div>

            {/* Seed error banner */}
            {seedError && (
              <div className="mt-3 px-4 py-2.5 rounded-lg bg-red-950/40 border border-red-900/50 flex items-start justify-between gap-3">
                <p className="text-xs text-red-400 leading-relaxed">{seedError}</p>
                <button onClick={() => setSeedError(null)} className="text-red-600 hover:text-red-400 text-sm shrink-0">×</button>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">

          {/* Date label for past-day views */}
          {selectedDate && !isToday && !loading && hasData && (
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[rgba(255,255,255,0.05)]" />
              <p className="text-sm text-[#6b6560] px-3" style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}>
                {fmtDateLong(selectedDate)}
              </p>
              <div className="h-px flex-1 bg-[rgba(255,255,255,0.05)]" />
            </div>
          )}

          {/* Filter bar */}
          {hasData && !loading && (
            <div className="mb-8">
              <FilterBar active={activeFilter} onChange={setActiveFilter} disabled={loading || seeding} />
            </div>
          )}

          {/* Full-screen scanning overlay — only when no data exists yet */}
          {seeding && !hasData && (
            <div className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-10 h-10 rounded-full border-2 border-[rgba(212,165,116,0.2)] border-t-[#d4a574] animate-spin" />
              <p className="text-xl text-[#d4a574]" style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}>
                Scanning for today's cultural moments...
              </p>
              <p className="text-sm text-[#6b6560]">This takes 20–40 seconds</p>
            </div>
          )}

          {/* Loading */}
          {loading && !seeding && (
            <div className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-10 h-10 rounded-full border-2 border-[rgba(212,165,116,0.2)] border-t-[#d4a574] animate-spin" />
            </div>
          )}

          {/* No data yet */}
          {!loading && !seeding && historyDates.length === 0 && !hasData && (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
              <span className="text-5xl opacity-20">📡</span>
              <p className="text-2xl text-[#4a4440]" style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}>
                No briefs yet.
              </p>
              <p className="text-sm text-[#3a3a3a] max-w-sm">
                Briefs are generated automatically at 7 AM UTC every day. Hit the button above to generate today's now.
              </p>
            </div>
          )}

          {/* Trends grid */}
          {!loading && hasData && (
            <div className={seeding ? 'opacity-40 pointer-events-none' : ''}>
              {filteredTrends.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-[#6b6560] text-sm">No trends in this category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredTrends.map(trend => (
                    <TrendCard key={trend.id} trend={trend} onGenerateScript={setSelectedTrend} />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[rgba(255,255,255,0.05)]">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4 text-xs text-[#4a4440] flex-wrap">
            <span>
              {hasData
                ? `${trends.length} trends · ${selectedDate ? fmtDateShort(selectedDate) : ''}`
                : historyDates.length > 0
                ? `${historyDates.length} day${historyDates.length !== 1 ? 's' : ''} archived`
                : 'Awaiting first brief'}
            </span>
            <span className="opacity-50">Privileged Few × Claude AI · auto 7 AM UTC</span>
          </div>
        </footer>
      </div>

      <ScriptModal trend={selectedTrend} onClose={() => setSelectedTrend(null)} />

      {calendarOpen && (
        <CalendarPicker
          availableDates={historyDates}
          selectedDate={selectedDate}
          onSelect={loadDay}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </>
  )
}
