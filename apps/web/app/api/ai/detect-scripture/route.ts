import { NextResponse } from 'next/server'
import { callClaudeJSON } from '@/lib/ai/claude'

export async function POST(req: Request) {
  const { transcript } = await req.json()
  if (!transcript?.trim()) return NextResponse.json([])

  try {
    const result = await callClaudeJSON([{
      role: 'user',
      content: `Analyse this sermon transcript and identify all Bible scripture references mentioned, including fuzzy or paraphrased ones.

Transcript: "${transcript}"

Return a JSON array (no other text) of objects with:
- reference: string (e.g. "John 3:16" or "Psalm 23:1-6")
- book: string
- chapter: number
- verseStart: number
- verseEnd: number | null
- confidence: number (0-1, how certain you are this is a scripture reference)
- context: string (the words around the reference)

Only include references with confidence > 0.5. Return [] if none found.`
    }], 'You are a biblical scholar expert. Return only valid JSON arrays.', 500)

    return NextResponse.json(Array.isArray(result) ? result : [])
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
