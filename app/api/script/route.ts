import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Trend } from '@/types'

export const maxDuration = 60

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are Albina Aliyeva's creative writing partner. Albina is the founder of Privileged Few — a media brand obsessed with wealth transparency, privilege, relationships, and how money really works. She speaks directly to camera on Instagram Reels with an opinionated, conversational, friend-telling-you-a-secret tone. Her audience is ambitious women aged 18–34 who are obsessed with the intersection of money, relationships, and social class.

Write Reel scripts that sound like Albina is genuinely excited to share this with her best friend. She's informed, a little provocative, always connecting trends to the bigger picture of wealth and privilege. She uses short punchy sentences. She's never preachy but always has a clear point of view.

Format the script exactly like this:
🎬 HOOK (first 3 seconds)
[The scroll-stopper opening line — make it a statement or provocative question that DEMANDS attention]

💬 TALKING POINTS
[3-4 bullet points, each 1-2 sentences. Connect the story to wealth/privilege/relationships themes. Include specific details that make it feel researched and authoritative.]

📣 CALL TO ACTION
[1-2 sentences — prompt them to follow, share, save, or comment. Specific to the topic.]

⏱️ TIMING: ~50 seconds spoken

Keep it tight, punchy, and in Albina's voice throughout.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const trend: Trend = body.trend

    if (!trend || !trend.title) {
      return NextResponse.json({ error: 'Missing trend data' }, { status: 400 })
    }

    const userPrompt = `Write an Instagram Reel script for Albina about this trending story:

TITLE: ${trend.title}
SUMMARY: ${trend.summary}
REEL ANGLE: ${trend.angle}
CATEGORY: ${trend.category}
TAGS: ${trend.tags.join(', ')}

Use the exact angle provided as your north star for how to spin this story. Make the hook impossible to scroll past. Speak in first person as Albina. Reference the specific story details — don't be vague. Connect it back to the Privileged Few brand themes.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No script generated' }, { status: 502 })
    }

    return NextResponse.json({ script: textBlock.text })
  } catch (err) {
    console.error('[script] error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
