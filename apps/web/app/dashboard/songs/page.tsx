'use client'
import { useState, useEffect, useMemo } from 'react'
import { SongEditor } from '@/components/songs/SongEditor'
import { Music, Plus, Trash2, Loader2, Search, History, ArrowUpDown, Clock } from 'lucide-react'

const KEYS = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B']
const SEMITONE_MAP: Record<string,number> = {
  'C':0,'Db':1,'D':2,'Eb':3,'E':4,'F':5,'F#':6,'G':7,'Ab':8,'A':9,'Bb':10,'B':11,
  'C#':1,'D#':3,'G#':8,'A#':10
}
function transposeKey(key: string, semitones: number): string {
  const base = SEMITONE_MAP[key]
  if (base === undefined) return key
  return KEYS[(base + semitones + 12) % 12]
}
function transposeLyricLine(line: string, semitones: number): string {
  return line.replace(/\b([A-G][#b]?(?:m|maj|min|aug|dim|sus|add)?[0-9]?)\b/g, (match) => {
    const root = match.match(/^[A-G][#b]?/)?.[0]
    if (!root || SEMITONE_MAP[root] === undefined) return match
    const newRoot = transposeKey(root, semitones)
    return match.replace(root, newRoot)
  })
}

export default function SongsPage() {
  const [songs, setSongs] = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [transposeSemitones, setTransposeSemitones] = useState(0)
  const [tab, setTab] = useState<'edit' | 'transpose' | 'history'>('edit')

  const load = () => {
    setLoading(true)
    fetch('/api/songs').then(r => r.json()).then(d => {
      setSongs(d)
      setLoading(false)
      if (d.length && !selected) { setSelected(d[0].id); setEditing(d[0]) }
    })
  }
  useEffect(() => { load() }, [])

  const loadHistory = (songId: string) => {
    fetch(`/api/song-history?songId=${songId}`).then(r => r.json()).then(setHistory)
  }

  const selectSong = (song: any) => {
    setSelected(song.id); setEditing(song); setTransposeSemitones(0)
    loadHistory(song.id)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return songs
    return songs.filter(s =>
      s.title?.toLowerCase().includes(q) ||
      s.author?.toLowerCase().includes(q) ||
      (s.tags || []).some((t: string) => t.toLowerCase().includes(q))
    )
  }, [songs, search])

  const save = async () => {
    if (!editing) return
    await fetch(`/api/songs/${editing.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing)
    })
    load()
  }

  const addSong = async () => {
    const newSong = {
      title: 'New Song', author: '', key: 'C', tempo: 70, tags: [],
      sections: [{ id: 'v1', type: 'verse', label: 'Verse 1', lines: [''] }],
      default_arrangement: ['v1']
    }
    const r = await fetch('/api/songs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSong)
    })
    const s = await r.json()
    setSongs(prev => [...prev, s])
    selectSong(s)
  }

  const deleteSong = async (id: string) => {
    if (!confirm('Delete this song?')) return
    await fetch(`/api/songs/${id}`, { method: 'DELETE' })
    setSelected(null); setEditing(null)
    load()
  }

  const transposedSong = useMemo(() => {
    if (!editing || transposeSemitones === 0) return editing
    return {
      ...editing,
      key: transposeKey(editing.key || 'C', transposeSemitones),
      sections: editing.sections?.map((sec: any) => ({
        ...sec,
        lines: sec.lines?.map((line: string) => transposeLyricLine(line, transposeSemitones))
      }))
    }
  }, [editing, transposeSemitones])

  return (
    <div className="flex h-full">
      {/* Song list */}
      <div className="w-64 border-r border-[#2a2d38] flex flex-col bg-[#13111e] shrink-0">
        <div className="p-3 border-b border-[#2a2d38]">
          <div className="flex items-center gap-2 mb-2">
            <Music size={14} className="text-[#c8a96e]" />
            <span className="text-sm font-serif text-[#e8d8b8]">Songs</span>
            <button onClick={addSong} className="ml-auto p-1 text-[#666] hover:text-[#c8a96e] transition-colors">
              <Plus size={14} />
            </button>
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#444]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search songs…"
              className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-7 py-1.5 text-xs text-[#e8d8b8] outline-none focus:border-[#c8a96e] placeholder-[#444]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-[#444]">
              <Loader2 size={14} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-[#444] text-xs">No songs found</div>
          ) : (
            filtered.map(song => (
              <div key={song.id}
                className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer group border-b border-[#1a1c24] transition-colors ${
                  selected === song.id ? 'bg-[#c8a96e]/10 border-l-2 border-l-[#c8a96e]' : 'hover:bg-white/5'
                }`}
                onClick={() => selectSong(song)}>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#e8d8b8] truncate">{song.title}</div>
                  <div className="text-[10px] text-[#555] truncate">{song.author} {song.key && `· ${song.key}`} {song.tempo && `· ${song.tempo}bpm`}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteSong(song.id) }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-[#444] hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={11} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-[#2a2d38] text-[10px] text-[#444]">
          {filtered.length} / {songs.length} songs
        </div>
      </div>

      {/* Editor area */}
      {editing ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-[#2a2d38] px-4 shrink-0">
            {([
              { id: 'edit', label: 'Edit' },
              { id: 'transpose', label: 'Transpose', icon: ArrowUpDown },
              { id: 'history', label: 'History', icon: Clock },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id as any)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs border-b-2 -mb-px transition-colors ${
                  tab === id ? 'border-[#c8a96e] text-[#c8a96e]' : 'border-transparent text-[#666] hover:text-[#888]'
                }`}>
                {Icon && <Icon size={11} />}{label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {tab === 'edit' && (
              <SongEditor song={editing} onChange={setEditing} onSave={save} />
            )}

            {tab === 'transpose' && (
              <div className="p-6 max-w-xl">
                <h2 className="text-sm font-medium text-[#e8d8b8] mb-4">Key Transposition</h2>
                <div className="glass p-4 mb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-xs text-[#666] mb-1">Original key</div>
                      <div className="text-2xl font-serif text-[#c8a96e]">{editing.key || '—'}</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-xs text-[#666] mb-2">Semitones: {transposeSemitones > 0 ? '+' : ''}{transposeSemitones}</div>
                      <input type="range" min="-6" max="6" value={transposeSemitones}
                        onChange={e => setTransposeSemitones(Number(e.target.value))}
                        className="w-full" />
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-[#666] mb-1">New key</div>
                      <div className="text-2xl font-serif text-[#c8a96e]">
                        {transposeKey(editing.key || 'C', transposeSemitones)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setTransposeSemitones(0)}
                      className="px-3 py-1.5 text-xs border border-[#2a2d38] rounded text-[#666] hover:text-[#888] transition-colors">
                      Reset
                    </button>
                    <button onClick={async () => {
                      const updated = { ...editing, key: transposeKey(editing.key || 'C', transposeSemitones) }
                      setEditing(updated)
                      setTransposeSemitones(0)
                      await fetch(`/api/songs/${editing.id}`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated)
                      })
                      load()
                    }} className="px-3 py-1.5 text-xs bg-[#c8a96e] text-[#0d0f14] rounded hover:bg-[#d8b97e] transition-colors">
                      Save transposed key
                    </button>
                  </div>
                </div>
                <div className="text-xs text-[#666] mb-2">Preview in new key:</div>
                {transposedSong?.sections?.map((sec: any) => (
                  <div key={sec.id} className="glass p-3 mb-2">
                    <div className="text-[10px] text-[#c8a96e] uppercase tracking-widest mb-2">{sec.label}</div>
                    {sec.lines?.map((line: string, i: number) => (
                      <div key={i} className="text-xs text-[#e8d8b8] leading-relaxed">{line}</div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {tab === 'history' && (
              <div className="p-6 max-w-xl">
                <h2 className="text-sm font-medium text-[#e8d8b8] mb-4">Song History</h2>
                {history.length === 0 ? (
                  <div className="text-sm text-[#555]">This song has not been used in any services yet.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {history.map((h: any) => (
                      <div key={h.id} className="glass p-3 flex items-center gap-3">
                        <History size={13} className="text-[#c8a96e] shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs text-[#e8d8b8]">{h.service_title}</div>
                          <div className="text-[10px] text-[#555]">
                            {new Date(h.used_at).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#444]">
          Select a song to edit
        </div>
      )}
    </div>
  )
}
