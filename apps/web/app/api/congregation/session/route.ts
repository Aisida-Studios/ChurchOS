import { NextResponse } from 'next/server'
import { createCongregationSession, getCongregationSessionByCode } from '@/lib/db'
export async function POST(req: Request) {
  const { serviceId } = await req.json()
  return NextResponse.json(createCongregationSession(serviceId))
}
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get('code') || ''
  const session = getCongregationSessionByCode(code)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(session)
}
