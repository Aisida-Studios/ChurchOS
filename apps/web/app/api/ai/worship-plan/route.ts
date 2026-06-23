import { NextResponse } from 'next/server'
import { callClaudeJSON } from '@/lib/ai/claude'
import { getAllSongs } from '@/lib/db'

export async function POST(req: Request) {
  const { theme, scriptureText, mood, occasion } = await req.json()
  const songs = getAllSongs()
  const songList = songs.map((s: any) =>
    `${s.id}: "${s.title}" by ${s.author} (key: ${s.key}, tags: ${(s.tags||[]).join(', ')})`
  ).join('\n')

  try {
    const result = await callClaudeJSON([{
      role: 'user',
      content: `You are a worship leader planning a church service.

Service details:
- Theme: ${theme || 'General worship'}
- Scripture: ${scriptureText || 'Not specified'}
- Mood: ${mood || 'Reverent and uplifting'}
- Occasion: ${occasion || 'Regular Sunday service'}

Available songs in our library:
${songList}

Suggest a worship set of 3-5 songs from our library that would fit well together for this service.
Return JSON: {
  "set": [{ "songId": string, "title": string, "reason": string, "position": "opener"|"mid"|"response"|"closer" }],
  "notes": string
}
Only use songIds from the list above.`
    }], 'You are an experienced worship leader. Return only valid JSON.', 800)

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
