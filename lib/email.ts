import type { Trend } from '@/types'

const HEAT_LABEL: Record<string, string> = {
  hot: '🔥 Breaking',
  warm: '📈 Rising',
  cool: '👁 Watch list',
}

const HEAT_COLOR: Record<string, string> = {
  hot: '#ef4444',
  warm: '#f59e0b',
  cool: '#3b82f6',
}

const CATEGORY_LABEL: Record<string, string> = {
  wealth: 'Wealth & Money',
  relationships: 'Relationships',
  class: 'Class & Privilege',
  celebrity: 'Celebrity Drama',
  culture: 'Culture & Viral',
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high: '🔮 High confidence',
  medium: '🔮 Medium confidence',
  low: '🔮 Early signal',
}

const WINDOW_LABEL: Record<string, string> = {
  '48h': 'Next 48 hours',
  '3-7d': 'Next 3–7 days',
}

function predictedBlock(t: Trend, i: number): string {
  const tags = t.tags
    .map(
      (tag) =>
        `<span style="display:inline-block;font-size:11px;padding:2px 8px;background:rgba(167,139,250,0.1);color:#a78bfa;border-radius:4px;margin:2px 2px 0 0;">#${tag}</span>`
    )
    .join('')

  const evidence = (t.evidence ?? [])
    .map((e) => `<li style="margin-bottom:4px;">${e}</li>`)
    .join('')

  const redditTag = t.platform === 'reddit'
    ? `<span style="display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;background:rgba(255,69,0,0.12);color:#ff4500;border-radius:999px;border:1px solid rgba(255,69,0,0.35);margin-left:6px;">👽 Reddit</span>`
    : ''

  return `
<div style="margin-bottom:24px;padding:20px;background:#1e1a2e;border-radius:12px;border-left:3px solid #a78bfa;">
  <div style="margin-bottom:6px;">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#a78bfa;">${CATEGORY_LABEL[t.category] ?? t.category}</span>${redditTag}
    <span style="font-size:11px;color:#6b6560;">&nbsp;·&nbsp;${CONFIDENCE_LABEL[t.confidence ?? 'medium']}&nbsp;·&nbsp;${WINDOW_LABEL[t.predictedWindow ?? '3-7d']}</span>
  </div>
  <h3 style="margin:0 0 8px;font-size:17px;font-weight:600;color:#f0ece4;line-height:1.3;">${i + 1}. ${t.title}</h3>
  <p style="margin:0 0 12px;font-size:13px;color:#8a8278;line-height:1.65;">${t.summary}</p>
  ${evidence ? `<div style="margin-bottom:12px;"><p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a78bfa;">Signals we're seeing</p><ul style="margin:0;padding-left:18px;font-size:12px;color:#8a8278;line-height:1.6;">${evidence}</ul></div>` : ''}
  ${t.reasoning ? `<div style="margin-bottom:12px;"><p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a78bfa;">Why this will break out</p><p style="margin:0;font-size:12px;color:#8a8278;line-height:1.6;">${t.reasoning}</p></div>` : ''}
  <div style="padding:12px 14px;background:rgba(167,139,250,0.08);border-radius:8px;margin-bottom:12px;">
    <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a78bfa;">Reel angle for Albina</p>
    <p style="margin:0;font-size:13px;color:#c8bfb4;font-style:italic;line-height:1.55;">${t.angle}</p>
  </div>
  <div>${tags}</div>
</div>`
}

function trendBlock(t: Trend, i: number): string {
  const tags = t.tags
    .map(
      (tag) =>
        `<span style="display:inline-block;font-size:11px;padding:2px 8px;background:rgba(255,255,255,0.06);color:#6b6560;border-radius:4px;margin:2px 2px 0 0;">#${tag}</span>`
    )
    .join('')

  const redditTag = t.platform === 'reddit'
    ? `<span style="display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;background:rgba(255,69,0,0.12);color:#ff4500;border-radius:999px;border:1px solid rgba(255,69,0,0.35);margin-left:6px;">👽 Reddit</span>`
    : ''

  return `
<div style="margin-bottom:24px;padding:20px;background:#1e1e1e;border-radius:12px;border-left:3px solid ${HEAT_COLOR[t.heat] ?? '#d4a574'};">
  <div style="margin-bottom:6px;">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#d4a574;">${CATEGORY_LABEL[t.category] ?? t.category}</span>${redditTag}
    <span style="font-size:11px;color:#6b6560;">&nbsp;·&nbsp;${HEAT_LABEL[t.heat] ?? t.heat}</span>
  </div>
  <h3 style="margin:0 0 8px;font-size:17px;font-weight:600;color:#f0ece4;line-height:1.3;">${i + 1}. ${t.title}</h3>
  <p style="margin:0 0 14px;font-size:13px;color:#8a8278;line-height:1.65;">${t.summary}</p>
  <div style="padding:12px 14px;background:rgba(212,165,116,0.08);border-radius:8px;margin-bottom:12px;">
    <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#d4a574;">Reel angle for Albina</p>
    <p style="margin:0;font-size:13px;color:#c8bfb4;font-style:italic;line-height:1.55;">${t.angle}</p>
  </div>
  <div>${tags}</div>
</div>`
}

function buildEmailHtml(trends: Trend[], dateLabel: string): string {
  const current = trends.filter((t) => t.kind !== 'predicted')
  const predicted = trends.filter((t) => t.kind === 'predicted')

  const trendsHtml = current.map((t, i) => trendBlock(t, i)).join('')
  const predictedHtml = predicted.map((t, i) => predictedBlock(t, i)).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>PF Trend Radar — ${dateLabel}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;padding:40px 24px 56px;">

    <!-- Header -->
    <div style="margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.07);">
      <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#d4a574;">Privileged Few</p>
      <h1 style="margin:0 0 4px;font-size:26px;font-weight:700;color:#f0ece4;letter-spacing:-0.01em;">Trend Radar</h1>
      <p style="margin:0;font-size:13px;color:#6b6560;">${dateLabel}</p>
    </div>

    <p style="font-size:14px;color:#8a8278;line-height:1.6;margin:0 0 32px;">
      ${current.length} trending stories — scanned by AI, heat-ranked, with your Reel angle ready to go.
    </p>

    <!-- Trends -->
    ${trendsHtml}

    ${predicted.length > 0 ? `
    <!-- Predicted section -->
    <div style="margin:40px 0 24px;padding-bottom:12px;border-bottom:1px solid rgba(167,139,250,0.15);">
      <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#a78bfa;">Forecast</p>
      <h2 style="margin:0;font-size:20px;font-weight:700;color:#f0ece4;">🔮 Predicted to break out</h2>
      <p style="margin:6px 0 0;font-size:13px;color:#8a8278;">Early signals mined from Reddit and beyond — get ahead of these before they're mainstream.</p>
    </div>
    ${predictedHtml}` : ''}

    <!-- Footer -->
    <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
      <p style="font-size:12px;color:#4a4440;margin:0;">
        Privileged Few Trend Radar · Powered by Claude AI + Web Search<br>
        <span style="color:#333;">You're receiving this because you're on the PF creative team.</span>
      </p>
    </div>

  </div>
</body>
</html>`
}

export async function sendMorningBrief(trends: Trend[], date: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email')
    return
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const dateLabel = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const from = process.env.EMAIL_FROM ?? 'Privileged Few Radar <radar@privilegedfewproduction.com>'
  const to = process.env.EMAIL_TO ?? 'creative@privilegedfewproduction.com'

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `PF Trend Radar — ${dateLabel}`,
    html: buildEmailHtml(trends, dateLabel),
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
}
