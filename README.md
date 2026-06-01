# Privileged Few — Daily Trend Radar

A daily content intelligence dashboard for [@weareprivilegedfew](https://instagram.com/weareprivilegedfew). Scans the web for trending wealth, celebrity, class, and culture stories that Albina can reference in her Instagram Reels to make them feel timely and culturally relevant.

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

1. Click **Refresh feed** — the app calls Claude Sonnet with web search enabled and asks it to find the 9 most relevant trending stories from the last 24–72 hours related to wealth, privilege, relationships, and celebrity drama.
2. Each **Trend Card** shows a category, heat level, 2-sentence summary, and a specific Reel angle tailored to Albina's voice.
3. **Copy idea** copies the title + angle to your clipboard in one click.
4. **Generate script ↗** opens a modal and generates a full direct-to-camera Reel script (hook + talking points + CTA, ~50 seconds).
5. Use the **filter pills** to browse by topic category.

## Tech stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **@anthropic-ai/sdk** with `web_search_20250305` tool for real-time trend scanning
- **DM Serif Display + DM Sans** from Google Fonts

## Notes

- The trend scan uses Claude Sonnet with web search and can take 20–40 seconds depending on how many searches the model performs.
- Script generation is faster (typically 5–10 seconds) and does not use web search.
- No database is used — all state is in-memory/client-side.
- Trends reset on page refresh; click **Refresh feed** again to pull a new batch.
