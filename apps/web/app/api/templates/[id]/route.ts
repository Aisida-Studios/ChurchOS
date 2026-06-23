import { NextResponse } from 'next/server'
import { getTemplateById, upsertTemplate, deleteTemplate } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const t = getTemplateById(params.id)
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(t)
}
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  return NextResponse.json(upsertTemplate({ ...body, id: params.id }))
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  deleteTemplate(params.id)
  return NextResponse.json({ ok: true })
}
