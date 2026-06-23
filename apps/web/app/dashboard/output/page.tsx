'use client'
import { useState, useEffect } from 'react'
import { Monitor, Plus, Trash2, Save, Loader2, ExternalLink, Copy } from 'lucide-react'

const RESOLUTIONS = [
  { label: '1920×1080 (Full HD)', w: 1920, h: 1080 },
  { label: '1280×720 (HD)', w: 1280, h: 720 },
  { label: '2560×1440 (2K)', w: 2560, h: 1440 },
  { label: '3840×2160 (4K)', w: 3840, h: 2160 },
  { label: '1024×768 (XGA)', w: 1024, h: 768 },
]

const DEFAULT_PROFILE = {
  name: 'Main Screen',
  resolution: { w: 1920, h: 1080 },
  screens: [
    { id: 'main', label: 'Main Projector', type: 'main', enabled: true },
  ],
  background: { type: 'solid', color: '#000000' },
  fontScale: 1.0,
  transitionSpeed: 500,
}

interface Profile {
  id: string; name: string; config: any
}

export default function OutputSettingsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [sessionId, setSessionId] = useState('session-svc-1')

  const loadProfiles = () => {
    setLoading(true)
    fetch('/api/output-profiles').then(r => r.json()).then(d => {
      setProfiles(d); setLoading(false)
      if (d.length && !editing) setEditing({ ...d[0], ...d[0].config })
    })
  }
  useEffect(() => { loadProfiles() }, [])

  const addProfile = async () => {
    const r = await fetch('/api/output-profiles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Profile', config: DEFAULT_PROFILE })
    })
    const p = await r.json()
    setProfiles(prev => [...prev, p])
    setEditing({ ...p, ...DEFAULT_PROFILE })
  }

  const saveProfile = async () => {
    if (!editing) return
    setSaving(true)
    const { id, name, ...rest } = editing
    await fetch(`/api/output-profiles/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, config: rest })
    })
    setSaving(false)
    loadProfiles()
  }

  const delProfile = async (id: string) => {
    if (!confirm('Delete profile?')) return
    await fetch(`/api/output-profiles/${id}`, { method: 'DELETE' })
    setEditing(null); loadProfiles()
  }

  const outputUrl = (type: string) => {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return `${base}/output/${sessionId}${type === 'confidence' ? '/confidence' : ''}`
  }

  return (
    <div className="flex h-full">
      {/* Profile list */}
      <div className="w-56 border-r border-[#2a2d38] flex flex-col bg-[#13111e] shrink-0">
        <div className="p-3 border-b border-[#2a2d38] flex items-center justify-between">
          <span className="text-sm font-serif text-[#e8d8b8]">Output Profiles</span>
          <button onClick={addProfile} className="p-1 text-[#666] hover:text-[#c8a96e] transition-colors">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 size={14} className="animate-spin text-[#444]" /></div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-8 text-[10px] text-[#444]">No profiles</div>
          ) : profiles.map(p => (
            <div key={p.id}
              className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-[#1a1c24] group transition-colors ${
                editing?.id === p.id ? 'bg-[#c8a96e]/10 border-l-2 border-l-[#c8a96e]' : 'hover:bg-white/5'
              }`}
              onClick={() => setEditing({ ...p, ...p.config })}>
              <Monitor size={11} className="text-[#666] shrink-0" />
              <span className="text-xs text-[#e8d8b8] flex-1 truncate">{p.name}</span>
              <button onClick={e => { e.stopPropagation(); delProfile(p.id) }}
                className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-red-400 transition-colors">
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Profile editor */}
      {editing ? (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-serif text-[#e8d8b8]">Output Configuration</h2>
              <button onClick={saveProfile} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-sm hover:bg-[#d8b97e] transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Profile name */}
              <div className="glass p-4">
                <label className="text-xs text-[#666] uppercase tracking-widest block mb-2">Profile Name</label>
                <input value={editing.name} onChange={e => setEditing((p: any) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-2 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e]" />
              </div>

              {/* Resolution */}
              <div className="glass p-4">
                <label className="text-xs text-[#666] uppercase tracking-widest block mb-2">Resolution</label>
                <select
                  value={`${editing.resolution?.w}×${editing.resolution?.h}`}
                  onChange={e => {
                    const [w, h] = e.target.value.split('×').map(Number)
                    setEditing((p: any) => ({ ...p, resolution: { w, h } }))
                  }}
                  className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-2 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e]">
                  {RESOLUTIONS.map(r => (
                    <option key={r.label} value={`${r.w}×${r.h}`}>{r.label}</option>
                  ))}
                </select>
                <div className="mt-2 text-[10px] text-[#444]">
                  Current: {editing.resolution?.w ?? 1920} × {editing.resolution?.h ?? 1080}
                </div>
              </div>

              {/* Font scale */}
              <div className="glass p-4">
                <label className="text-xs text-[#666] uppercase tracking-widest block mb-2">
                  Font Scale: {editing.fontScale?.toFixed(1) ?? '1.0'}×
                </label>
                <input type="range" min="0.5" max="2.0" step="0.1"
                  value={editing.fontScale ?? 1.0}
                  onChange={e => setEditing((p: any) => ({ ...p, fontScale: Number(e.target.value) }))}
                  className="w-full" />
                <div className="flex justify-between text-[10px] text-[#444] mt-1">
                  <span>0.5× (small)</span><span>1.0× (normal)</span><span>2.0× (large)</span>
                </div>
              </div>

              {/* Transition speed */}
              <div className="glass p-4">
                <label className="text-xs text-[#666] uppercase tracking-widest block mb-2">
                  Transition Speed: {editing.transitionSpeed ?? 500}ms
                </label>
                <input type="range" min="0" max="2000" step="100"
                  value={editing.transitionSpeed ?? 500}
                  onChange={e => setEditing((p: any) => ({ ...p, transitionSpeed: Number(e.target.value) }))}
                  className="w-full" />
                <div className="flex justify-between text-[10px] text-[#444] mt-1">
                  <span>Instant</span><span>500ms</span><span>2s (slow)</span>
                </div>
              </div>

              {/* Output URLs */}
              <div className="glass p-4">
                <label className="text-xs text-[#666] uppercase tracking-widest block mb-3">Output URLs</label>
                <div className="text-xs text-[#666] mb-2">Session ID:</div>
                <input value={sessionId} onChange={e => setSessionId(e.target.value)}
                  className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-1.5 text-xs text-[#e8d8b8] outline-none focus:border-[#c8a96e] mb-3" />

                {[
                  { label: 'Main Output', type: 'main', desc: 'Full-screen projector' },
                  { label: 'Confidence Monitor', type: 'confidence', desc: 'Stage display for musicians' },
                ].map(({ label, type, desc }) => (
                  <div key={type} className="flex items-center gap-2 py-2 border-t border-[#2a2d38] first:border-t-0">
                    <div className="flex-1">
                      <div className="text-xs text-[#e8d8b8]">{label}</div>
                      <div className="text-[10px] text-[#444] font-mono truncate">{outputUrl(type)}</div>
                      <div className="text-[10px] text-[#555]">{desc}</div>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(outputUrl(type))}
                      className="p-1.5 text-[#444] hover:text-[#888] transition-colors" title="Copy URL">
                      <Copy size={11} />
                    </button>
                    <a href={outputUrl(type)} target="_blank" rel="noopener"
                      className="p-1.5 text-[#444] hover:text-[#c8a96e] transition-colors" title="Open in new tab">
                      <ExternalLink size={11} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#444]">
          Select a profile or create one
        </div>
      )}
    </div>
  )
}
