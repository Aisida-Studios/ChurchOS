import { NextResponse } from 'next/server'
import { upsertCollection, deleteCollection } from '@/lib/db'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json(upsertCollection({ ...await req.json(), id: params.id }))
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  deleteCollection(params.id)
  return NextResponse.json({ ok: true })
}
