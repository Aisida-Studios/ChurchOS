import { NextResponse } from 'next/server'
import { getAllOutputProfiles, upsertOutputProfile } from '@/lib/db'

export async function GET() {
  return NextResponse.json(getAllOutputProfiles())
}
export async function POST(req: Request) {
  return NextResponse.json(upsertOutputProfile(await req.json()))
}
