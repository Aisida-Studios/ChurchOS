import { NextResponse } from 'next/server'
import { upsertVolunteer, deleteVolunteer } from '@/lib/db'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json(upsertVolunteer({ ...await req.json(), id: params.id }))
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  deleteVolunteer(params.id); return NextResponse.json({ ok: true })
}
