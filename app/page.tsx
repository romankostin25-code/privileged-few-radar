'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Trend } from '@/types'
import FilterBar, { FilterValue } from '@/components/FilterBar'
import TrendCard from '@/components/TrendCard'
import ScriptModal from '@/components/ScriptModal'
import HistoryPanel from '@/components/HistoryPanel'

interface FetchState {
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: string
  generatedAt?: string
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function HomePage() {
  const [trends, setTrends] = useState<Trend[]>([])
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'idle' })
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null)

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyDates, setHistoryDates] = useState<string[]>([])
  const [viewingDate, setViewingDate] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  const filteredTrends = useMemo(
    () => activeFilter === 'all' ? trends : trends.filter((t) => t.category === activeFilter),
    [trends, activeFilter]
  )

  // Load history index + auto-load today's snapshot on mount
  const loadHistoryDates = useCallback(async () => {
    try {
      const res = await fetch('/api/history')
      const data = await res.json()
      if (data.dates) {
        setHistoryDates(data.dates)

        // Auto-load today if we have a cached snapshot and no live data yet
        if (data.dates.includes(todayISO()) && fetchState.status === 'idle') {
          loadDay(todayISO())
        }
      }
    } catch {
      // History unavailable (KV not configured) — silent
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadHistoryDates()
  }, [loadHistoryDates])

  async function loadDay(date: string) {
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/history?date=${date}`)
      const data = await res.json()
      if (data.snapshot) {
        setTrends(data.snapshot.trends)
        setFetchState({ status: 'success', generatedAt: data.snapshot.generatedAt })
        setViewingDate(date)
        setActiveFilter('all')
      }
    } catch {
      // Failed silently — stay on current view
    } finally {
      setHistoryLoading(false)
    }
  }

  async function fetchFreshTrends() {
    setFetchState({ status: 'loading' })
    setViewingDate(null)
    try {
      const res = await fetch('/api/trends', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Request failed')
      setTrends(data.trends)
      setFetchState({ status: 'success', generatedAt: data.generatedAt })
      setViewingDate(data.date ?? todayISO())
      setActiveFilter('all')
      // Refresh history index so new date appears
      const histRes = await fetch('/api/history')
      const histData = await histRes.json()
      if (histData.dates) setHistoryDates(histData.dates)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setFetchState({ status: 'error', error: message })
    }
  }

  const isLoading = fetchState.status === 'loading'
  const isError = fetchState.status === 'error'
  const hasData = fetchState.status === 'success' && trends.length > 0
  const isEmpty = fetchState.status === 'idle'
  const isToday = viewingDate === todayISO()

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <>
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Header */}
        <header className="border-b border-[rgba(255,255,255,0.06)] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-start justify-between gap-4 flex-wrap">
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

            <div className="flex items-center gap-2 flex-wrap">
              {/* History button — only show if there's history */}
              {historyDates.length > 0 && (
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[rgba(255,255,255,0.1)] text-[#8a8278] text-sm hover:border-[rgba(212,165,116,0.3)] hover:text-[#d4a574] transition-all duration-200"
                >
                  <span>◷</span>
                  History
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-[rgba(212,165,116,0.12)] text-[#d4a574] text-[10px] font-semibold">
                    {historyDates.length}
                  </span>
                </button>
              )}

              <button
                onClick={fetchFreshTrends}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#d4a574] text-[#d4a574] text-sm font-medium hover:bg-[rgba(212,165,116,0.12)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-[rgba(212,165,116,0.3)] border-t-[#d4a574] animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <span>↻</span>
                    Refresh feed
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Viewing-date banner when looking at past day */}
          {viewingDate && !isToday && hasData && (
            <div className="mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-[rgba(212,165,116,0.08)] border border-[rgba(212,165,116,0.2)]">
              <p className="text-sm text-[#d4a574]">
                <span className="opacity-60 mr-1">Viewing</span>
                {fmtDate(viewingDate)}
              </p>
              <button
                onClick={fetchFreshTrends}
                className="text-xs px-3 py-1 rounded-full border border-[rgba(212,165,116,0.3)] text-[#d4a574] hover:bg-[rgba(212,165,116,0.15)] transition-all"
              >
                Back to today ↻
              </button>
            </div>
          )}

          {/* Filter bar */}
          {(hasData || isError) && (
            <div className="mb-8">
              <FilterBar active={activeFilter} onChange={setActiveFilter} disabled={isLoading} />
            </div>
          )}

          {/* Loading state */}
          {(isLoading || historyLoading) && (
            <div className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-10 h-10 rounded-full border-2 border-[rgba(212,165,116,0.2)] border-t-[#d4a574] animate-spin" />
              <p
                className="text-xl text-[#d4a574]"
                style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
              >
                {isLoading ? 'Scanning for today\'s cultural moments...' : 'Loading archive...'}
              </p>
              {isLoading && <p className="text-sm text-[#6b6560]">This may take 20–40 seconds</p>}
            </div>
          )}

          {/* Empty / idle state */}
          {isEmpty && !isLoading && !historyLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
              <span className="text-5xl opacity-30">📡</span>
              <p
                className="text-2xl text-[#4a4440]"
                style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
              >
                Hit <span className="text-[#d4a574]">Refresh feed</span> to pull today's trends.
              </p>
              <p className="text-sm text-[#4a4440] max-w-sm">
                We'll search for the 9 most relevant trending stories you can reference in your Reels right now.
              </p>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <span className="text-4xl">⚠️</span>
              <p
                className="text-xl text-[#f0ece4]"
                style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
              >
                Couldn't load trends
              </p>
              <p className="text-sm text-[#8a8278] max-w-md">{fetchState.error}</p>
              <button
                onClick={fetchFreshTrends}
                className="mt-2 px-5 py-2 rounded-full border border-[rgba(212,165,116,0.4)] text-[#d4a574] text-sm hover:bg-[rgba(212,165,116,0.12)] transition-all"
              >
                Try again
              </button>
            </div>
          )}

          {/* Trends grid */}
          {hasData && !isLoading && !historyLoading && (
            <>
              {filteredTrends.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-[#6b6560] text-sm">No trends in this category right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredTrends.map((trend) => (
                    <TrendCard key={trend.id} trend={trend} onGenerateScript={setSelectedTrend} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[rgba(255,255,255,0.05)] mt-auto">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4 text-xs text-[#4a4440] flex-wrap">
            <span>
              {hasData
                ? `${trends.length} trend${trends.length !== 1 ? 's' : ''} loaded`
                : 'No trends loaded'}
              {fetchState.generatedAt && (
                <span className="ml-2 opacity-60">
                  · {viewingDate && !isToday ? `from ${fmtDate(viewingDate)}` : `refreshed ${new Date(fetchState.generatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              )}
            </span>
            <span className="opacity-50">Privileged Few × Claude AI</span>
          </div>
        </footer>
      </div>

      {/* Script modal */}
      <ScriptModal trend={selectedTrend} onClose={() => setSelectedTrend(null)} />

      {/* History drawer */}
      {historyOpen && (
        <HistoryPanel
          dates={historyDates}
          activeDate={viewingDate}
          onSelectDate={loadDay}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </>
  )
}
