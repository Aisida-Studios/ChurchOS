import { NextResponse } from 'next/server'
import { getAllServices, createService } from '@/lib/db'

// POST: generate next N recurring services based on a template service
export async function POST(req: Request) {
  const { templateServiceId, count = 4, intervalDays = 7, startDate } = await req.json()
  const services = getAllServices()
  const template = services.find((s: any) => s.id === templateServiceId)
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const start = startDate ? new Date(startDate) : new Date()
  const created = []

  for (let i = 0; i < count; i++) {
    const date = new Date(start)
    date.setDate(date.getDate() + (i + 1) * intervalDays)

    const newSvc = await createService({
      title: template.title.replace(/\s*\(Copy.*\)$/, '') + ' — ' + date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      scheduled_at: date.toISOString(),
      status: 'draft',
      created_by: 'auto',
      items: (template.items || []).map((it: any) => ({
        ...it, id: 'i' + Math.random().toString(36).slice(2,8)
      }))
    })
    created.push(newSvc)
  }

  return NextResponse.json({ created: created.length, services: created })
}
