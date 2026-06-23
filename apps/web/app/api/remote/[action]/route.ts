import { NextResponse } from 'next/server'

// GET /api/remote/[action] — called by Stream Deck / hardware buttons
// No auth (local network only) — add IP whitelist if needed
export async function GET(
  _: Request,
  { params }: { params: { action: string } }
) {
  const sessions = (global as any).__churchos_sessions as Map<string, Set<any>> | undefined
  if (!sessions) return NextResponse.json({ error: 'No server' }, { status: 503 })

  const actionMap: Record<string, object> = {
    'next': { type: 'NEXT_SLIDE' },
    'prev': { type: 'PREV_SLIDE' },
    'blackout': { type: 'BLACKOUT' },
    'resume': { type: 'RESUME' },
  }
  const action = actionMap[params.action]
  if (!action) return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  const message = JSON.stringify({ type: 'ACTION', payload: action })
  let delivered = 0
  for (const clients of sessions.values()) {
    for (const ws of clients) {
      if (ws.readyState === 1) { ws.send(message); delivered++ }
    }
  }
  return NextResponse.json({ ok: true, action: params.action, delivered })
}
