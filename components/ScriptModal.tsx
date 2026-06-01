'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trend } from '@/types'

interface ScriptModalProps {
  trend: Trend | null
  onClose: () => void
}

async function fetchScript(trend: Trend): Promise<string> {
  const res = await fetch('/api/script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trend }),
  })

  // Always read as text first — avoids JSON.parse crash on non-JSON error pages
  const text = await res.text()
  let data: { script?: string; error?: string }

  try {
    data = JSON.parse(text)
  } catch {
    // Vercel timeout / HTML error page — surface a readable message
    throw new Error(res.ok ? 'Unexpected server response' : `Server error ${res.status}`)
  }

  if (!res.ok || data.error) throw new Error(data.error ?? 'Script generation failed')
  if (!data.script) throw new Error('No script returned')
  return data.script
}

export default function ScriptModal({ trend, onClose }: ScriptModalProps) {
  const [script, setScript] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const runFetch = useCallback(() => {
    if (!trend) return
    setScript(null)
    setError(null)
    setLoading(true)
    fetchScript(trend)
      .then((s) => setScript(s))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [trend])

  useEffect(() => { runFetch() }, [runFetch])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!trend) return null

  async function handleCopy() {
    if (!script) return
    await navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formattedLines = script
    ? script.split('\n').map((line, i) => {
        const isSection = /^[🎬💬📣⏱️]/.test(line)
        const isEmpty = line.trim() === ''
        return (
          <div
            key={i}
            className={[
              isEmpty ? 'h-3' : '',
              isSection
                ? 'text-[#d4a574] font-semibold text-sm mt-4 mb-1'
                : 'text-[#e0dbd4] leading-relaxed text-sm',
            ].join(' ')}
          >
            {!isEmpty && line}
          </div>
        )
      })
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#141414] border border-[rgba(212,165,116,0.2)] shadow-[0_0_60px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-[rgba(255,255,255,0.07)]">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#d4a574] mb-1">
              Reel Script
            </p>
            <h3
              className="text-lg leading-snug text-[#f0ece4]"
              style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
            >
              {trend.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] text-[#6b6560] hover:text-[#f0ece4] hover:border-[rgba(255,255,255,0.25)] transition-all text-lg"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-[rgba(212,165,116,0.2)] border-t-[#d4a574] animate-spin" />
              <p className="text-sm text-[#8a8278]">Writing Albina's script...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <span className="text-3xl">⚠️</span>
              <p className="text-sm text-[#8a8278]">{error}</p>
              <button
                onClick={runFetch}
                className="px-4 py-1.5 rounded-full text-sm border border-[rgba(212,165,116,0.3)] text-[#d4a574] hover:bg-[rgba(212,165,116,0.12)] transition-all"
              >
                Try again
              </button>
            </div>
          )}

          {script && !loading && <div>{formattedLines}</div>}
        </div>

        {/* Footer */}
        {script && !loading && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-[rgba(255,255,255,0.07)]">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-full text-sm border border-[rgba(255,255,255,0.1)] text-[#8a8278] hover:text-[#f0ece4] hover:border-[rgba(255,255,255,0.2)] transition-all"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className="px-5 py-1.5 rounded-full text-sm bg-[rgba(212,165,116,0.15)] border border-[rgba(212,165,116,0.4)] text-[#d4a574] hover:bg-[rgba(212,165,116,0.25)] transition-all font-medium"
            >
              {copied ? '✓ Copied!' : 'Copy to clipboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
