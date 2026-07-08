'use client'

import { useState } from 'react'
import { Trend } from '@/types'

interface TrendCardProps {
  trend: Trend
  onGenerateScript: (trend: Trend) => void
}

const HEAT_CONFIG = {
  hot: {
    label: '🔥 Breaking',
    className: 'bg-red-950/60 text-red-400 border border-red-900/50',
    borderColor: '#ef4444',
  },
  warm: {
    label: '📈 Rising',
    className: 'bg-amber-950/60 text-amber-400 border border-amber-900/50',
    borderColor: '#f59e0b',
  },
  cool: {
    label: '👁 Watch list',
    className: 'bg-blue-950/60 text-blue-400 border border-blue-900/50',
    borderColor: '#3b82f6',
  },
}

const CONFIDENCE_CONFIG = {
  high: { label: '🔮 High confidence', className: 'bg-violet-950/60 text-violet-300 border border-violet-800/50' },
  medium: { label: '🔮 Medium confidence', className: 'bg-violet-950/40 text-violet-400 border border-violet-900/50' },
  low: { label: '🔮 Early signal', className: 'bg-violet-950/30 text-violet-500 border border-violet-900/40' },
}

const WINDOW_LABEL: Record<string, string> = {
  '48h': 'Next 48 hours',
  '3-7d': 'Next 3–7 days',
}

const PLATFORM_ICON: Record<string, string> = {
  instagram: '📸',
  tiktok: '🎵',
  twitter: '𝕏',
  youtube: '▶',
  news: '📰',
  instagram_reels: '🎬',
  reddit: '👽',
}

const CATEGORY_LABEL: Record<string, string> = {
  wealth: 'Wealth & Money',
  relationships: 'Relationships',
  class: 'Class & Privilege',
  celebrity: 'Celebrity Drama',
  culture: 'Culture & Viral',
}

function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export default function TrendCard({ trend, onGenerateScript }: TrendCardProps) {
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)

  const isPredicted = trend.kind === 'predicted'
  const heat = HEAT_CONFIG[trend.heat]
  const confidence = CONFIDENCE_CONFIG[trend.confidence ?? 'medium']

  async function handleCopyIdea() {
    const text = `${trend.title}\n\nReel angle: ${trend.angle}`
    await copyToClipboard(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article
      className={`trend-card opacity-0 animate-[fadeIn_0.4s_ease-out_forwards] relative flex flex-col rounded-xl bg-[#1a1a1a] border overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,165,116,0.06)] ${
        isPredicted
          ? 'border-[rgba(167,139,250,0.25)] hover:border-[rgba(167,139,250,0.5)]'
          : 'border-[rgba(255,255,255,0.07)] hover:border-[rgba(212,165,116,0.25)]'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Heat/confidence-coded top border */}
      <div
        className="h-[3px] w-full transition-opacity duration-300"
        style={{
          background: isPredicted ? '#a78bfa' : heat.borderColor,
          opacity: hovered ? 1 : 0,
        }}
      />

      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#d4a574]">
            {CATEGORY_LABEL[trend.category] ?? trend.category}
          </span>
          <span
            className={`shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
              isPredicted ? confidence.className : heat.className
            }`}
          >
            {isPredicted ? confidence.label : heat.label}
          </span>
        </div>

        {isPredicted && trend.predictedWindow && (
          <p className="text-[11px] text-violet-400 -mt-3">
            Predicted to break out: <span className="font-semibold">{WINDOW_LABEL[trend.predictedWindow] ?? trend.predictedWindow}</span>
          </p>
        )}

        {/* Title */}
        <h3
          className="font-serif text-[1.15rem] leading-snug text-[#f0ece4]"
          style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
        >
          {trend.title}
        </h3>

        {/* Summary */}
        <p className="text-sm text-[#8a8278] leading-relaxed">
          {trend.summary}
        </p>

        {/* Evidence — predicted trends only */}
        {isPredicted && trend.evidence && trend.evidence.length > 0 && (
          <div className="rounded-lg bg-[rgba(167,139,250,0.06)] border border-[rgba(167,139,250,0.15)] p-3">
            <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-violet-400 mb-1.5">
              Signals we&apos;re seeing
            </p>
            <ul className="space-y-1">
              {trend.evidence.map((e, i) => (
                <li key={i} className="text-xs text-[#c8bfb4] leading-relaxed">• {e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Reasoning — predicted trends only */}
        {isPredicted && trend.reasoning && (
          <div>
            <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-violet-400 mb-1">
              Why this will break out
            </p>
            <p className="text-xs text-[#8a8278] leading-relaxed">{trend.reasoning}</p>
          </div>
        )}

        {/* Reel angle */}
        <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] flex-1">
          <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#d4a574] mb-1.5">
            Reel angle for Albina
          </p>
          <p
            className="text-sm text-[#c8bfb4] leading-relaxed"
            style={{ fontStyle: 'italic', fontFamily: '"DM Serif Display", Georgia, serif' }}
          >
            {trend.angle}
          </p>
        </div>

        {/* Tags */}
        {trend.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {trend.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.05)] text-[#6b6560] border border-[rgba(255,255,255,0.06)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: platform + actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-xs text-[#6b6560] flex items-center gap-1.5">
            <span>{PLATFORM_ICON[trend.platform] ?? '🌐'}</span>
            <span className="capitalize">{trend.platform.replace('_', ' ')}</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyIdea}
              title="Copy title + angle"
              className="text-[11px] px-2.5 py-1 rounded-md border border-[rgba(212,165,116,0.2)] text-[#8a8278] hover:text-[#d4a574] hover:border-[rgba(212,165,116,0.5)] transition-all duration-200"
            >
              {copied ? '✓ Copied' : 'Copy idea'}
            </button>

            <button
              onClick={() => onGenerateScript(trend)}
              className="text-[11px] px-3 py-1 rounded-md bg-[rgba(212,165,116,0.12)] border border-[rgba(212,165,116,0.3)] text-[#d4a574] hover:bg-[rgba(212,165,116,0.22)] hover:border-[#d4a574] transition-all duration-200 font-medium"
            >
              Generate script ↗
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
