import { NextResponse } from 'next/server'
import { createPoll, getPolls, submitPollResponse } from '@/lib/db'
export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get('sessionId') || ''
  return NextResponse.json(getPolls(sessionId))
}
export async function POST(req: Request) {
  const { sessionId, question, options } = await req.json()
  return NextResponse.json(createPoll(sessionId, question, options))
}
export async function PUT(req: Request) {
  const { pollId, option, userId } = await req.json()
  return NextResponse.json(submitPollResponse(pollId, option, userId))
}
