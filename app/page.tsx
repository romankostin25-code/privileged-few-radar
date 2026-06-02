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
  const [error, setError] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const filteredTrends = useMemo(
    () => activeFilter === 'all' ? trends : trends.filter(t => t.category === activeFilter),
    [trends, activeFilter]
  )

  const loadDay = useCallback(async (date: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/history?date=${date}`)
      const data = await res.json()
      if (data.snapshot?.trends) {
        setTrends(data.snapshot.trends)
        setSelectedDate(date)
        setActiveFilter('all')
      } else {
        setTrends([])
        setSelectedDate(date)
      }
    } catch {
      setError('Failed to load this day\'s trends.')
    } finally {
      setLoading(false)
    }
  }, [])

  // On mount: load index then auto-select most recent day
  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(data => {
        const dates: string[] = data.dates ?? []
        setHistoryDates(dates)
        if (dates.length > 0) {
          loadDay(dates[0]) // dates[0] is most recent (sorted newest-first)
        } else {
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
  }, [loadDay])

  // One-time manual seed (used only when KV has no data yet)
  async function seedToday() {
    setSeeding(true)
    setError(null)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const text = await res.text()
      let data: { ok?: boolean; date?: string; error?: string }
      try {
        data = JSON.parse(text)
      } catch {
        // Vercel returns plain text on timeout/infra errors
        if (text.toLowerCase().includes('timeout') || text.toLowerCase().includes('duration')) {
          throw new Error('Function timed out. This app requires Vercel Pro (300s limit) — Hobby plan allows only 10s. Upgrade at vercel.com/upgrade.')
        }
        throw new Error('Server error — check that ANTHROPIC_API_KEY is set in Vercel environment variables.')
      }
      if (!res.ok || data.error) throw new Error(data.error ?? 'Seed failed')
      setHistoryDates([data.date ?? ''])
      if (data.date) loadDay(data.date)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seed failed')
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
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <>
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        {/* Header */}
        <header className="border-b border-[rgba(255,255,255,0.06)] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-end justify-between gap-4 flex-wrap">
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

              {/* Date navigator */}
              {historyDates.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={goPrev}
                    disabled={!hasPrev || loading}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] text-[#6b6560] hover:text-[#d4a574] hover:border-[rgba(212,165,116,0.4)] transition-all disabled:opacity-20 disabled:cursor-not-allowed text-base"
                    title="Older"
                  >
                    ‹
                  </button>

                  <button
                    onClick={() => setCalendarOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(255,255,255,0.1)] text-sm text-[#c8bfb4] hover:border-[rgba(212,165,116,0.4)] hover:text-[#d4a574] transition-all"
                  >
                    <span className="text-[#d4a574] text-xs">📅</span>
                    {selectedDate ? (
                      <span>
                        {isToday ? 'Today' : fmtDateShort(selectedDate)}
                      </span>
                    ) : (
                      <span className="text-[#6b6560]">Select date</span>
                    )}
                  </button>

                  <button
                    onClick={goNext}
                    disabled={!hasNext || loading}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] text-[#6b6560] hover:text-[#d4a574] hover:border-[rgba(212,165,116,0.4)] transition-all disabled:opacity-20 disabled:cursor-not-allowed text-base"
                    title="Newer"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">

          {/* Date label for non-today views */}
          {selectedDate && !isToday && !loading && trends.length > 0 && (
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[rgba(255,255,255,0.05)]" />
              <p
                className="text-sm text-[#6b6560] px-3"
                style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
              >
                {fmtDateLong(selectedDate)}
              </p>
              <div className="h-px flex-1 bg-[rgba(255,255,255,0.05)]" />
            </div>
          )}

          {/* Filter bar */}
          {trends.length > 0 && !loading && (
            <div className="mb-8">
              <FilterBar active={activeFilter} onChange={setActiveFilter} disabled={loading} />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-10 h-10 rounded-full border-2 border-[rgba(212,165,116,0.2)] border-t-[#d4a574] animate-spin" />
              <p
                className="text-xl text-[#d4a574]"
                style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
              >
                Loading...
              </p>
            </div>
          )}

          {/* No data yet state */}
          {!loading && !seeding && historyDates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
              <span className="text-5xl opacity-30">📡</span>
              <p
                className="text-2xl text-[#4a4440]"
                style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
              >
                No briefs yet.
              </p>
              <p className="text-sm text-[#3a3a3a] max-w-sm">
                From tomorrow onwards, trends arrive automatically at 7 AM UTC.
                Generate today's first brief manually to get started.
              </p>
              <button
                onClick={seedToday}
                className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#d4a574] text-[#d4a574] text-sm font-medium hover:bg-[rgba(212,165,116,0.12)] transition-all"
              >
                Generate today's brief
              </button>
            </div>
          )}

          {/* Seeding loader */}
          {seeding && (
            <div className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-10 h-10 rounded-full border-2 border-[rgba(212,165,116,0.2)] border-t-[#d4a574] animate-spin" />
              <p
                className="text-xl text-[#d4a574]"
                style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
              >
                Scanning for today's cultural moments...
              </p>
              <p className="text-sm text-[#6b6560]">This takes 20–40 seconds</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <span className="text-4xl">⚠️</span>
              <p className="text-sm text-[#8a8278]">{error}</p>
              {selectedDate && (
                <button
                  onClick={() => loadDay(selectedDate)}
                  className="px-5 py-2 rounded-full border border-[rgba(212,165,116,0.4)] text-[#d4a574] text-sm hover:bg-[rgba(212,165,116,0.12)] transition-all"
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {/* Empty day — has date but no snapshot */}
          {!loading && !error && selectedDate && trends.length === 0 && historyDates.length > 0 && (
            <div className="text-center py-20">
              <p className="text-[#6b6560] text-sm">No data stored for this day.</p>
            </div>
          )}

          {/* Trends grid */}
          {!loading && trends.length > 0 && (
            <>
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
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[rgba(255,255,255,0.05)]">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4 text-xs text-[#4a4440] flex-wrap">
            <span>
              {trends.length > 0
                ? `${trends.length} trends · ${selectedDate ? fmtDateShort(selectedDate) : ''}`
                : historyDates.length > 0
                ? `${historyDates.length} day${historyDates.length !== 1 ? 's' : ''} archived`
                : 'Awaiting first brief'}
            </span>
            <span className="opacity-50">Privileged Few × Claude AI · 7 AM UTC daily</span>
          </div>
        </footer>
      </div>

      {/* Script modal */}
      <ScriptModal trend={selectedTrend} onClose={() => setSelectedTrend(null)} />

      {/* Calendar modal */}
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
