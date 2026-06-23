import { NextResponse } from 'next/server'
import { upsertStreamConfig, deleteStreamConfig } from '@/lib/db'
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json(upsertStreamConfig({ ...await req.json(), id: params.id }))
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  deleteStreamConfig(params.id); return NextResponse.json({ ok: true })
}
