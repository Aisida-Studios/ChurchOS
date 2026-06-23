import { NextResponse } from 'next/server'
import { addPrayerRequest, getPrayerRequests } from '@/lib/db'
export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get('sessionId') || ''
  return NextResponse.json(getPrayerRequests(sessionId))
}
export async function POST(req: Request) {
  const { sessionId, name, request, isPublic } = await req.json()
  return NextResponse.json(addPrayerRequest(sessionId, name, request, isPublic))
}
