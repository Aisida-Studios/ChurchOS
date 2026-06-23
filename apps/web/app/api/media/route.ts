import { NextResponse } from 'next/server'
import { getAllMedia } from '@/lib/db'

export async function GET() {
  try {
    return NextResponse.json(getAllMedia())
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
