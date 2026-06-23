import { NextResponse } from 'next/server'
import { getAllCollections, upsertCollection } from '@/lib/db'

export async function GET() {
  return NextResponse.json(getAllCollections())
}
export async function POST(req: Request) {
  const body = await req.json()
  return NextResponse.json(upsertCollection(body))
}
