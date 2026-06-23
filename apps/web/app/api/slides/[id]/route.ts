import { NextResponse } from 'next/server'
import { getSlideDeckById, upsertSlideDeck, deleteSlideDeck } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const deck = getSlideDeckById(params.id)
  if (!deck) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(deck)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const deck = upsertSlideDeck({ ...body, id: params.id })
    return NextResponse.json(deck)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  deleteSlideDeck(params.id)
  return NextResponse.json({ ok: true })
}
