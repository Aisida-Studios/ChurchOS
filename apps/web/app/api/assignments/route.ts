import { NextResponse } from 'next/server'
import { getAssignmentsForService, upsertAssignment, deleteAssignment } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const serviceId = searchParams.get('serviceId') || ''
  return NextResponse.json(getAssignmentsForService(serviceId))
}
export async function POST(req: Request) { return NextResponse.json(upsertAssignment(await req.json())) }
export async function DELETE(req: Request) {
  const { id } = await req.json(); deleteAssignment(id); return NextResponse.json({ ok: true })
}
