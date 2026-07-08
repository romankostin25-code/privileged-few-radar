# Privileged Few — Trend Radar

A content intelligence dashboard for [@weareprivilegedfew](https://instagram.com/weareprivilegedfew), refreshed every 48 hours. It scans Instagram, TikTok, Twitter/X, and news for trending wealth, celebrity, class, and culture stories, and separately mines Reddit across work, economics, privilege, society, wealth, equality, and women's rights to **predict** which emerging themes will break out within the next 48 hours to a week — so Albina can get ahead of a story before it's mainstream.

## Setup

### 1. Install Node.js

Download and install Node.js (v18 or newer) from [nodejs.org](https://nodejs.org).

### 2. Install dependencies

```bash
npm install
```

### 3. Add your Anthropic API key

Copy the example env file and add your key:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and replace `your_api_key_here` with your actual key from [console.anthropic.com](https://console.anthropic.com).

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How it works

1. Every 48 hours (cron self-throttled, ~7 AM UTC) — or any time via **Generate brief** — the app runs two research pipelines in parallel with Claude Sonnet + web search:
   - **Current**: the 18 most relevant trending stories from the last 24–72 hours (Instagram/TikTok/Twitter/news).
   - **Predicted**: 8 emerging themes mined from Reddit (and beyond) across work & labor, economics, privilege, society, wealth, equality, and women's rights — early signals with concrete evidence (subreddit, thread, engagement) and detailed reasoning for why and when they'll break out (next 48h or 3–7 days).
2. Each **Trend Card** shows a category, heat level (or confidence + break-out window for predictions), summary, and a specific Reel angle. Predicted cards also show the supporting signals and the reasoning behind the forecast.
3. Use the **All / Current / 🔮 Predicted** toggle plus the category **filter pills** to browse.
4. **Copy idea** copies the title + angle to your clipboard in one click.
5. **Generate script ↗** opens a modal and generates a full direct-to-camera Reel script (hook + talking points + CTA, ~50 seconds) for either a current or predicted trend.

## Tech stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **@anthropic-ai/sdk** with `web_search_20250305` tool for real-time trend scanning and Reddit-focused forecasting
- **Vercel Blob** for storing daily snapshots (history/calendar)
- **Resend** for the periodic email digest
- **DM Serif Display + DM Sans** from Google Fonts

## Notes

- The trend scan runs current + predicted research and formatting in parallel and can take roughly 60–100 seconds depending on how many searches the model performs.
- Script generation is faster (typically 5–10 seconds) and does not use web search.
- Snapshots are stored per calendar day in Vercel Blob; the cron route checks the last snapshot's timestamp and only regenerates once 48 hours have passed, so the underlying `vercel.json` schedule can stay a plain daily trigger.
