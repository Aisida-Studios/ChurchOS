import { NextResponse } from 'next/server'
import { getAllStreamConfigs, upsertStreamConfig } from '@/lib/db'
export async function GET() { return NextResponse.json(getAllStreamConfigs()) }
export async function POST(req: Request) { return NextResponse.json(upsertStreamConfig(await req.json())) }
