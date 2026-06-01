'use client'

import { useState, useEffect } from 'react'

interface CalendarPickerProps {
  availableDates: string[]   // YYYY-MM-DD, sorted newest-first
  selectedDate: string | null
  onSelect: (date: string) => void
  onClose: () => void
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export default function CalendarPicker({
  availableDates,
  selectedDate,
  onSelect,
  onClose,
}: CalendarPickerProps) {
  const available = new Set(availableDates)
  const todayStr = ymd(new Date())

  // Default to the month of the selected date or today
  const seed = selectedDate ?? todayStr
  const [viewYear, setViewYear] = useState(parseInt(seed.slice(0, 4)))
  const [viewMonth, setViewMonth] = useState(parseInt(seed.slice(5, 7)) - 1) // 0-indexed

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    const now = new Date()
    if (viewYear === now.getFullYear() && viewMonth === now.getMonth()) return
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const isAtCurrentMonth = (() => {
    const now = new Date()
    return viewYear === now.getFullYear() && viewMonth === now.getMonth()
  })()

  // Build the grid: leading empty cells + days of month
  const firstDow = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  function dateStr(day: number): string {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${viewYear}-${m}-${d}`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative bg-[#141414] border border-[rgba(212,165,116,0.2)] rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] text-[#6b6560] hover:text-[#d4a574] hover:border-[rgba(212,165,116,0.4)] transition-all text-sm"
          >
            ‹
          </button>

          <div className="text-center">
            <p
              className="text-base text-[#f0ece4]"
              style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
            >
              {MONTHS[viewMonth]} {viewYear}
            </p>
            <p className="text-[10px] text-[#4a4440] mt-0.5">
              {availableDates.length} day{availableDates.length !== 1 ? 's' : ''} archived
            </p>
          </div>

          <button
            onClick={nextMonth}
            disabled={isAtCurrentMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] text-[#6b6560] hover:text-[#d4a574] hover:border-[rgba(212,165,116,0.4)] transition-all text-sm disabled:opacity-20 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-[#4a4440] py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />

            const iso = dateStr(day)
            const hasData = available.has(iso)
            const isSelected = iso === selectedDate
            const isFuture = iso > todayStr
            const isToday = iso === todayStr

            return (
              <button
                key={iso}
                onClick={() => { if (hasData) { onSelect(iso); onClose() } }}
                disabled={!hasData || isFuture}
                title={hasData ? `Load ${iso}` : undefined}
                className={[
                  'relative flex flex-col items-center justify-center h-9 rounded-lg text-sm transition-all duration-150',
                  isSelected
                    ? 'bg-[#d4a574] text-[#0a0a0a] font-semibold'
                    : hasData
                    ? 'text-[#f0ece4] hover:bg-[rgba(212,165,116,0.15)] cursor-pointer'
                    : isFuture
                    ? 'text-[#2a2a2a] cursor-default'
                    : 'text-[#3a3a3a] cursor-default',
                  isToday && !isSelected ? 'ring-1 ring-[rgba(212,165,116,0.4)]' : '',
                ].join(' ')}
              >
                {day}
                {hasData && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#d4a574]" />
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-5 flex items-center justify-between text-[11px] text-[#4a4440]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4a574] inline-block" />
            Days with trend data
          </span>
          <button
            onClick={onClose}
            className="text-[#6b6560] hover:text-[#f0ece4] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
