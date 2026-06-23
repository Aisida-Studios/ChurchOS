import { NextResponse } from 'next/server'
import { getSongById, upsertSong, deleteSong } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const song = getSongById(params.id)
  if (!song) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(song)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const song = upsertSong({ ...body, id: params.id })
    return NextResponse.json(song)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  deleteSong(params.id)
  return NextResponse.json({ ok: true })
}
