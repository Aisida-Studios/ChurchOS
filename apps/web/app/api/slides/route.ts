import { NextResponse } from 'next/server'
import { getAllSlideDecks, upsertSlideDeck, makeId } from '@/lib/db'

export async function GET() {
  try {
    return NextResponse.json(getAllSlideDecks())
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const deck = upsertSlideDeck({ ...body, id: body.id || makeId() })
    return NextResponse.json(deck, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
