import { NextResponse } from 'next/server'
import { callClaudeJSON } from '@/lib/ai/claude'
import { getAllSongs, getAllDecks, getAllServices } from '@/lib/db'

export async function POST(req: Request) {
  const { command, sessionId } = await req.json()
  const songs = getAllSongs()
  const decks = getAllDecks()
  const services = getAllServices()

  try {
    const result = await callClaudeJSON([{
      role: 'user',
      content: `You control a church presentation system. The operator said: "${command}"

Available songs: ${songs.map((s:any) => `${s.id}: ${s.title}`).join(', ')}
Available decks: ${decks.map((d:any) => `${d.id}: ${d.title}`).join(', ')}
Available services: ${services.map((s:any) => `${s.id}: ${s.title}`).join(', ')}
Active session: ${sessionId || 'none'}

Return a JSON action to perform:
{
  "action": "NEXT_SLIDE"|"PREV_SLIDE"|"BLACKOUT"|"RESUME"|"GO_TO_SONG"|"GO_TO_DECK"|"NAVIGATE"|"NONE",
  "payload": {} | null,
  "response": string (friendly confirmation of what you did or will do)
}

For GO_TO_SONG: payload = { songId: string }
For GO_TO_DECK: payload = { deckId: string }
For NAVIGATE: payload = { url: string } (dashboard routes like /dashboard/songs)
For NONE: just provide a helpful response`
    }], 'You are a voice assistant for church presentation software. Return only valid JSON.', 500)

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
