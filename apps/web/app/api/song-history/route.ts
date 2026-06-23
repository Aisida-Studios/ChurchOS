import { NextResponse } from 'next/server'
import { getSongHistory, getAllSongHistory, logSongUsage } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const songId = searchParams.get('songId')
  return NextResponse.json(songId ? getSongHistory(songId) : getAllSongHistory())
}
export async function POST(req: Request) {
  const { songId, serviceId, serviceTitle } = await req.json()
  logSongUsage(songId, serviceId, serviceTitle)
  return NextResponse.json({ ok: true })
}
