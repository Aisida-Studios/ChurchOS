import { NextResponse } from 'next/server'
import { getAuditLog, logAudit } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const entity = searchParams.get('entity') || undefined
  const limit = Number(searchParams.get('limit') || 100)
  return NextResponse.json(getAuditLog(limit, entity))
}

export async function POST(req: Request) {
  const { action, entity, entityId, detail } = await req.json()
  logAudit(action, entity, entityId, detail)
  return NextResponse.json({ ok: true })
}
