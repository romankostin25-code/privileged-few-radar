'use client'

import { useState, useMemo } from 'react'
import { Trend } from '@/types'
import FilterBar, { FilterValue } from '@/components/FilterBar'
import TrendCard from '@/components/TrendCard'
import ScriptModal from '@/components/ScriptModal'

interface FetchState {
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: string
  generatedAt?: string
}

export default function HomePage() {
  const [trends, setTrends] = useState<Trend[]>([])
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'idle' })
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null)

  const filteredTrends = useMemo(
    () =>
      activeFilter === 'all'
        ? trends
        : trends.filter((t) => t.category === activeFilter),
    [trends, activeFilter]
  )

  async function fetchTrends() {
    setFetchState({ status: 'loading' })
    try {
      const res = await fetch('/api/trends', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Request failed')
      setTrends(data.trends)
      setFetchState({ status: 'success', generatedAt: data.generatedAt })
      setActiveFilter('all')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setFetchState({ status: 'error', error: message })
    }
  }

  const isLoading = fetchState.status === 'loading'
  const isError = fetchState.status === 'error'
  const hasData = fetchState.status === 'success' && trends.length > 0
  const isEmpty = fetchState.status === 'idle'

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <>
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Header */}
        <header className="border-b border-[rgba(255,255,255,0.06)] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p
                className="text-xs font-semibold tracking-[0.2em] uppercase text-[#d4a574] mb-1"
                style={{ letterSpacing: '0.2em' }}
              >
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

            <button
              onClick={fetchTrends}
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
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Filter bar */}
          {(hasData || isError) && (
            <div className="mb-8">
              <FilterBar
                active={activeFilter}
                onChange={setActiveFilter}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-10 h-10 rounded-full border-2 border-[rgba(212,165,116,0.2)] border-t-[#d4a574] animate-spin" />
              <p
                className="text-xl text-[#d4a574]"
                style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
              >
                Scanning for today's cultural moments...
              </p>
              <p className="text-sm text-[#6b6560]">This may take 20–40 seconds</p>
            </div>
          )}

          {/* Empty / idle state */}
          {isEmpty && !isLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
              <span className="text-5xl opacity-30">📡</span>
              <p
                className="text-2xl text-[#4a4440]"
                style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
              >
                Hit{' '}
                <span className="text-[#d4a574]">Refresh feed</span>{' '}
                to pull today's trends.
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
                onClick={fetchTrends}
                className="mt-2 px-5 py-2 rounded-full border border-[rgba(212,165,116,0.4)] text-[#d4a574] text-sm hover:bg-[rgba(212,165,116,0.12)] transition-all"
              >
                Try again
              </button>
            </div>
          )}

          {/* Trends grid */}
          {hasData && !isLoading && (
            <>
              {filteredTrends.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-[#6b6560] text-sm">No trends in this category right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredTrends.map((trend) => (
                    <TrendCard
                      key={trend.id}
                      trend={trend}
                      onGenerateScript={setSelectedTrend}
                    />
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
                  · Last refreshed {new Date(fetchState.generatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </span>
            <span className="opacity-50">Privileged Few × Claude AI</span>
          </div>
        </footer>
      </div>

      {/* Script modal */}
      <ScriptModal
        trend={selectedTrend}
        onClose={() => setSelectedTrend(null)}
      />
    </>
  )
}
