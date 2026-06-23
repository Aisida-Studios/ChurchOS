import { NextResponse } from 'next/server'
import { callClaudeJSON } from '@/lib/ai/claude'

export async function POST(req: Request) {
  const { prompt, type } = await req.json()

  try {
    const result = await callClaudeJSON([{
      role: 'user',
      content: `Create a church presentation slide for: "${prompt}"
Slide type: ${type || 'announcement'}

Return JSON for a single slide object:
{
  "content": string (main headline, max 8 words),
  "subContent": string (subtitle or details, max 20 words),
  "background": { "type": "gradient", "gradient": { "from": string, "to": string, "angle": number } },
  "typography": {
    "fontFamily": "Georgia, serif",
    "fontSize": 64,
    "fontWeight": 700,
    "color": string (hex),
    "lineHeight": 1.2,
    "letterSpacing": 0,
    "shadow": "0 2px 12px rgba(0,0,0,0.8)",
    "align": "center"
  },
  "layout": "center",
  "transition": "fade",
  "transitionDuration": 500
}
Choose colours appropriate for a church context (deep, reverent tones).`
    }], 'You are a church graphic designer. Return only valid JSON.', 600)

    return NextResponse.json({ slide: result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
