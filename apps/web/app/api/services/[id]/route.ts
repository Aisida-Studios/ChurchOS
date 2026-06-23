import { NextResponse } from 'next/server'
import { getServiceById, upsertService, deleteService, getSongById, getSlideDeckById } from '@/lib/db'

function enrichItems(items: any[]): any[] {
  return items.map(item => {
    const enriched = { ...item }
    if (item.type === 'song' && item.reference_id) {
      enriched.song = getSongById(item.reference_id)
    }
    if (item.type === 'slide_deck' && item.reference_id) {
      enriched.slideDeck = getSlideDeckById(item.reference_id)
    }
    return enriched
  })
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const svc = getServiceById(params.id)
  if (!svc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...svc, items: enrichItems(svc.items) })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const svc = upsertService({ ...body, id: params.id })
    return NextResponse.json(svc)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  deleteService(params.id)
  return NextResponse.json({ ok: true })
}
