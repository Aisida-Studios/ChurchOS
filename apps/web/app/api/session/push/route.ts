import { NextResponse } from 'next/server'

// POST /api/session/push
// Body: { sessionId: string, action: object }
// Used by pages outside the live control page (e.g. Bible search) to push
// actions into the WebSocket session, which broadcasts to all output screens.
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { sessionId, action } = body

    if (!sessionId || !action) {
      return NextResponse.json(
        { error: 'sessionId and action are required' },
        { status: 400 }
      )
    }

    const sessions = (global as any).__churchos_sessions as
      | Map<string, Set<any>>
      | undefined

    if (!sessions) {
      return NextResponse.json(
        { error: 'Session server not initialised' },
        { status: 503 }
      )
    }

    const clients = sessions.get(sessionId)

    if (!clients || clients.size === 0) {
      // No connected clients yet — not a hard error, caller can retry
      return NextResponse.json({ ok: true, delivered: 0 })
    }

    const message = JSON.stringify({ type: 'ACTION', payload: action })
    let delivered = 0

    for (const ws of clients) {
      if (ws.readyState === 1 /* OPEN */) {
        ws.send(message)
        delivered++
      }
    }

    return NextResponse.json({ ok: true, delivered })
  } catch (err: any) {
    console.error('[session/push] error:', err)
    return NextResponse.json(
      { error: err.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}
