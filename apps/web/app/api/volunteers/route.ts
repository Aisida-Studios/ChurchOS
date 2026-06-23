import { NextResponse } from 'next/server'
import { getAllVolunteers, upsertVolunteer } from '@/lib/db'

export async function GET() { return NextResponse.json(getAllVolunteers()) }
export async function POST(req: Request) { return NextResponse.json(upsertVolunteer(await req.json())) }
