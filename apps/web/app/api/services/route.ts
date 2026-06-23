import { NextResponse } from 'next/server'
import { getAllServices, upsertService, makeId } from '@/lib/db'

export async function GET() {
  try {
    return NextResponse.json(getAllServices())
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const svc = upsertService({ ...body, id: body.id || makeId() })
    return NextResponse.json(svc, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
