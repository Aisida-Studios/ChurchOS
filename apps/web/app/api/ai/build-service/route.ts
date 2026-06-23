import { NextResponse } from 'next/server'
import { callClaudeJSON } from '@/lib/ai/claude'
import { getAllSongs, getAllDecks } from '@/lib/db'

export async function POST(req: Request) {
  const { prompt } = await req.json()
  const songs = getAllSongs()
  const decks = getAllDecks()

  const songList = songs.map((s: any) => `${s.id}: "${s.title}"`).join('\n')
  const deckList = decks.map((d: any) => `${d.id}: "${d.title}"`).join('\n')

  try {
    const result = await callClaudeJSON([{
      role: 'user',
      content: `Build a complete church service order based on this request: "${prompt}"

Available songs:
${songList}

Available slide decks:
${deckList}

Return a JSON service plan:
{
  "title": string,
  "scheduledAt": string (ISO date, next Sunday 10am),
  "items": [{
    "id": string (unique, like "i1"),
    "type": "song"|"slide_deck"|"scripture"|"announcement"|"separator",
    "label": string,
    "reference_id": string|null (use IDs from the lists above for songs/decks),
    "position": number,
    "config": {}
  }]
}
Create 6-10 items in a logical service flow. Only use IDs from the lists above.`
    }], 'You are a church service planner. Return only valid JSON.', 1000)

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
