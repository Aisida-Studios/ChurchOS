import { NextResponse } from 'next/server'
import { upsertTheme, deleteTheme, setActiveTheme } from '@/lib/db'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json(upsertTheme({ ...await req.json(), id: params.id }))
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  deleteTheme(params.id); return NextResponse.json({ ok: true })
}
export async function PATCH(_: Request, { params }: { params: { id: string } }) {
  setActiveTheme(params.id); return NextResponse.json({ ok: true })
}
