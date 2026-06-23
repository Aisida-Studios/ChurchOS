import { NextResponse } from 'next/server'
import { getAllSongs, upsertSong, makeId, now } from '@/lib/db'

export async function GET() {
  try {
    return NextResponse.json(getAllSongs())
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const song = upsertSong({ ...body, id: body.id || makeId() })
    return NextResponse.json(song, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
