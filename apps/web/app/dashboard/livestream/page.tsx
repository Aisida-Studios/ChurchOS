'use client'
import { useState, useEffect } from 'react'
import { Radio, Plus, Trash2, Save, Loader2, Eye, EyeOff, Copy } from 'lucide-react'

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', rtmpBase: 'rtmp://a.rtmp.youtube.com/live2', color: '#ff4444' },
  { id: 'facebook', label: 'Facebook', rtmpBase: 'rtmps://live-api-s.facebook.com:443/rtmp', color: '#4488ff' },
  { id: 'custom', label: 'Custom RTMP', rtmpBase: '', color: '#c8a96e' },
]

export default function LivestreamPage() {
  const [configs, setConfigs] = useState<any[]>([])
  const [editing, setEditing] = useState<any|null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/stream-configs').then(r=>r.json()).then(d=>{ setConfigs(d); setLoading(false) })
  }
  useEffect(()=>{ load() },[])

  const save = async () => {
    if (!editing) return
    setSaving(true)
    const method = editing.id ? 'PUT' : 'POST'
    const url = editing.id ? `/api/stream-configs/${editing.id}` : '/api/stream-configs'
    await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(editing) })
    setSaving(false); setEditing(null); load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete?')) return
    await fetch(`/api/stream-configs/${id}`,{method:'DELETE'}); load()
  }

  const platform = PLATFORMS.find(p=>p.id===editing?.platform) || PLATFORMS[2]

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Radio size={18} className="text-[#c8a96e]"/>
        <h1 className="text-xl font-serif text-[#e8d8b8]">Livestream</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#666] uppercase tracking-widest">Streams</span>
            <button onClick={()=>setEditing({name:'New Stream',platform:'youtube',rtmp_url:'',stream_key:'',is_active:false,config:{}})}
              className="p-1 text-[#666] hover:text-[#c8a96e] transition-colors"><Plus size={13}/></button>
          </div>
          {loading ? <div className="flex justify-center py-8"><Loader2 size={13} className="animate-spin text-[#444]"/></div>
          : configs.length===0 ? <div className="text-xs text-[#444] text-center py-8">No streams yet</div>
          : configs.map(c=>{
            const p = PLATFORMS.find(pl=>pl.id===c.platform)
            return (
              <div key={c.id} onClick={()=>setEditing(c)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded cursor-pointer group mb-1 transition-colors border ${editing?.id===c.id?'bg-[#c8a96e]/10 border-[#c8a96e]/30':'hover:bg-white/5 border-transparent'}`}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{background:c.is_active?'#4ade80':'#444'}}/>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[#e8d8b8] truncate">{c.name}</div>
                  <div className="text-[10px]" style={{color:p?.color||'#888'}}>{p?.label||c.platform}</div>
                </div>
                <button onClick={e=>{e.stopPropagation();del(c.id)}} className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-red-400"><Trash2 size={10}/></button>
              </div>
            )
          })}
        </div>

        {editing ? (
          <div className="col-span-2 flex flex-col gap-3">
            <div className="glass p-4">
              <div className="flex items-center justify-between mb-4">
                <input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}
                  className="text-sm bg-transparent text-[#e8d8b8] outline-none border-b border-transparent focus:border-[#c8a96e] px-1 flex-1"/>
                <button onClick={save} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c8a96e] text-[#0d0f14] rounded text-xs hover:bg-[#d8b97e] disabled:opacity-50 ml-3">
                  {saving?<Loader2 size={11} className="animate-spin"/>:<Save size={11}/>}
                  {saving?'Saving…':'Save'}
                </button>
              </div>

              <div className="flex gap-2 mb-3">
                {PLATFORMS.map(p=>(
                  <button key={p.id} onClick={()=>setEditing({...editing,platform:p.id,rtmp_url:p.rtmpBase})}
                    className={`flex-1 py-1.5 text-xs rounded border transition-colors ${editing.platform===p.id?'border-[#c8a96e] bg-[#c8a96e]/10 text-[#c8a96e]':'border-[#2a2d38] text-[#555] hover:border-[#3a3d48]'}`}>
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="mb-3">
                <label className="text-xs text-[#666] block mb-1">RTMP Server</label>
                <input value={editing.rtmp_url||platform.rtmpBase} onChange={e=>setEditing({...editing,rtmp_url:e.target.value})}
                  className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-1.5 text-xs text-[#e8d8b8] outline-none focus:border-[#c8a96e] font-mono"/>
              </div>

              <div className="mb-4">
                <label className="text-xs text-[#666] block mb-1">Stream Key</label>
                <div className="flex gap-2">
                  <input type={showKey?'text':'password'} value={editing.stream_key||''} onChange={e=>setEditing({...editing,stream_key:e.target.value})}
                    placeholder="Paste your stream key"
                    className="flex-1 bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-1.5 text-xs text-[#e8d8b8] outline-none focus:border-[#c8a96e] font-mono"/>
                  <button onClick={()=>setShowKey(!showKey)} className="p-2 text-[#444] hover:text-[#888]">
                    {showKey?<EyeOff size={13}/>:<Eye size={13}/>}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={()=>setEditing({...editing,is_active:!editing.is_active})}
                  className={`relative w-9 h-5 rounded-full transition-colors ${editing.is_active?'bg-green-600':'bg-[#2a2d38]'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${editing.is_active?'left-4':'left-0.5'}`}/>
                </button>
                <span className="text-xs text-[#666]">{editing.is_active?'Active':'Inactive'}</span>
              </div>
            </div>

            <div className="glass p-4 text-xs">
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-2">OBS Setup</div>
              <div className="text-[#666] space-y-1">
                <div>1. OBS → Settings → Stream → Service: Custom</div>
                <div className="flex items-center gap-2">
                  <span>2. Server:</span>
                  <code className="text-[#c8a96e] text-[10px] truncate flex-1">{editing.rtmp_url||platform.rtmpBase||'—'}</code>
                  {(editing.rtmp_url||platform.rtmpBase) && <button onClick={()=>navigator.clipboard.writeText(editing.rtmp_url||platform.rtmpBase)} className="text-[#444] hover:text-[#888]"><Copy size={10}/></button>}
                </div>
                <div>3. Stream Key: use the key above</div>
                <div>4. Add Window Capture → ChurchOS output window</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="col-span-2 flex items-center justify-center text-[#444] text-sm">
            Select a stream or create one
          </div>
        )}
      </div>
    </div>
  )
}
