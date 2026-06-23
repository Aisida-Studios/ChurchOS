import { NextResponse } from 'next/server'
import { getAllTemplates, upsertTemplate } from '@/lib/db'

export async function GET() {
  return NextResponse.json(getAllTemplates())
}
export async function POST(req: Request) {
  const body = await req.json()
  return NextResponse.json(upsertTemplate(body))
}
