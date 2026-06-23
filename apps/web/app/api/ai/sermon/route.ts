import { NextResponse } from 'next/server'
import { callClaudeJSON } from '@/lib/ai/claude'

export async function POST(req: Request) {
  const { transcript, action } = await req.json()

  const prompts: Record<string, string> = {
    'key-points': `Extract the 3-5 most important key points from this sermon transcript.
Return JSON: { "points": [{ "point": string, "support": string }] }`,

    'discussion-questions': `Generate 5 small group discussion questions based on this sermon.
Return JSON: { "questions": [{ "question": string, "type": "reflection"|"application"|"observation" }] }`,

    'summary': `Write a concise 2-3 paragraph summary of this sermon for the church bulletin.
Return JSON: { "summary": string, "title": string, "theme": string }`,

    'quotes': `Find the 3 most quotable, impactful statements from this sermon.
Return JSON: { "quotes": [{ "quote": string, "context": string }] }`,

    'outline': `Create a structured sermon outline from this transcript.
Return JSON: { "title": string, "mainText": string, "points": [{ "label": string, "content": string, "scriptures": string[] }] }`,
  }

  const prompt = prompts[action]
  if (!prompt) return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  if (!transcript?.trim()) return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })

  try {
    const result = await callClaudeJSON([{
      role: 'user',
      content: `${prompt}\n\nSermon transcript:\n"${transcript.slice(0, 8000)}"`
    }], 'You are a helpful church assistant. Return only valid JSON.', 1000)

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
