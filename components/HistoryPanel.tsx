'use client'

import { useEffect } from 'react'

interface HistoryPanelProps {
  dates: string[]
  activeDate: string | null
  onSelectDate: (date: string) => void
  onClose: () => void
  loading?: boolean
}

function formatDate(iso: string): { label: string; sub: string } {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  if (iso === today) return { label: 'Today', sub: fmtFull(iso) }
  if (iso === yesterday) return { label: 'Yesterday', sub: fmtFull(iso) }

  const d = new Date(iso + 'T12:00:00Z')
  return {
    label: d.toLocaleDateString('en-US', { weekday: 'long' }),
    sub: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }
}

function fmtFull(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function HistoryPanel({
  dates,
  activeDate,
  onSelectDate,
  onClose,
  loading,
}: HistoryPanelProps) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Drawer */}
      <aside className="relative w-full max-w-xs h-full bg-[#111111] border-l border-[rgba(255,255,255,0.07)] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.07)]">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#d4a574]">
              Privileged Few
            </p>
            <h2
              className="text-lg text-[#f0ece4]"
              style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
            >
              Trend History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] text-[#6b6560] hover:text-[#f0ece4] hover:border-[rgba(255,255,255,0.2)] transition-all text-lg"
          >
            ×
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-[rgba(212,165,116,0.2)] border-t-[#d4a574] animate-spin" />
            </div>
          )}

          {!loading && dates.length === 0 && (
            <div className="text-center py-12 px-6">
              <p className="text-sm text-[#4a4440]">No history yet.</p>
              <p className="text-xs text-[#333] mt-1">Saved snapshots will appear here after your first Refresh.</p>
            </div>
          )}

          {!loading && dates.map((date) => {
            const { label, sub } = formatDate(date)
            const isActive = date === activeDate

            return (
              <button
                key={date}
                onClick={() => { onSelectDate(date); onClose() }}
                className={[
                  'w-full text-left px-5 py-3.5 border-b border-[rgba(255,255,255,0.04)] transition-all duration-150',
                  isActive
                    ? 'bg-[rgba(212,165,116,0.1)] border-l-2 border-l-[#d4a574]'
                    : 'hover:bg-[rgba(255,255,255,0.03)]',
                ].join(' ')}
              >
                <p className={`text-sm font-medium ${isActive ? 'text-[#d4a574]' : 'text-[#f0ece4]'}`}>
                  {label}
                </p>
                <p className="text-xs text-[#6b6560] mt-0.5">{sub}</p>
              </button>
            )
          })}
        </div>

        <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.07)]">
          <p className="text-xs text-[#4a4440]">
            {dates.length} day{dates.length !== 1 ? 's' : ''} of history stored
          </p>
        </div>
      </aside>
    </div>
  )
}
