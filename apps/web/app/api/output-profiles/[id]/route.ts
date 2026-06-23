import { NextResponse } from 'next/server'
import { upsertOutputProfile, deleteOutputProfile } from '@/lib/db'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json(upsertOutputProfile({ ...await req.json(), id: params.id }))
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  deleteOutputProfile(params.id)
  return NextResponse.json({ ok: true })
}
