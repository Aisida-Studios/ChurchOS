import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { readFileSync, existsSync } from 'fs'

// GET /api/backup — download full database as JSON
export async function GET() {
  const db = getDb()
  const tables = ['songs','slide_decks','services','service_templates','media_items',
    'themes','volunteers','scripture_collections','output_profiles','song_history',
    'stream_configs','polls','prayer_requests']

  const backup: Record<string, any[]> = {}
  for (const table of tables) {
    try {
      backup[table] = db.prepare(`SELECT * FROM ${table}`).all() as any[]
    } catch {}
  }

  const json = JSON.stringify({ version: 1, exported_at: new Date().toISOString(), data: backup }, null, 2)
  return new Response(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="churchos-backup-${new Date().toISOString().slice(0,10)}.json"`
    }
  })
}

// POST /api/backup — restore from JSON backup
export async function POST(req: Request) {
  try {
    const { data } = await req.json()
    const db = getDb()

    let restored = 0
    for (const [table, rows] of Object.entries(data) as [string, any[]][]) {
      if (!rows?.length) continue
      for (const row of rows) {
        const cols = Object.keys(row)
        const vals = cols.map(() => '?').join(',')
        try {
          db.prepare(`INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${vals})`).run(...Object.values(row))
          restored++
        } catch {}
      }
    }
    return NextResponse.json({ ok: true, restored })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
