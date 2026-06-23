import { NextResponse } from 'next/server'
import { getAllThemes, upsertTheme } from '@/lib/db'

export async function GET() { return NextResponse.json(getAllThemes()) }
export async function POST(req: Request) { return NextResponse.json(upsertTheme(await req.json())) }
