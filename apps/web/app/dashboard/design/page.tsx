'use client'
import { useState, useEffect } from 'react'
import { Palette, Plus, Trash2, Save, Loader2, Check, Sparkles } from 'lucide-react'

const PRESET_THEMES = [
  {
    name: 'Church Warm',
    config: {
      colors: { bg:'#0d0f14', surface:'#1a1c24', border:'#2a2d38', text:'#e8e0d0', textMuted:'#888880', gold:'#c8a96e', accent:'#7a1f3d' },
      fonts: { heading:'Georgia, serif', body:'system-ui, sans-serif' },
      borderRadius: '8px', slideFont: 'Georgia, serif',
    }
  },
  {
    name: 'Modern Dark',
    config: {
      colors: { bg:'#0a0a0f', surface:'#141420', border:'#202030', text:'#e8e8ff', textMuted:'#7070a0', gold:'#8080ff', accent:'#4040cc' },
      fonts: { heading:'Inter, sans-serif', body:'Inter, sans-serif' },
      borderRadius: '12px', slideFont: 'Inter, sans-serif',
    }
  },
  {
    name: 'Classic Light',
    config: {
      colors: { bg:'#f5f0e8', surface:'#ffffff', border:'#ddd8cc', text:'#2a2018', textMuted:'#888070', gold:'#8b6914', accent:'#6b2a14' },
      fonts: { heading:'Georgia, serif', body:'system-ui, sans-serif' },
      borderRadius: '4px', slideFont: 'Georgia, serif',
    }
  },
  {
    name: 'Ocean',
    config: {
      colors: { bg:'#0a1520', surface:'#0f2030', border:'#1a3045', text:'#d0e8f0', textMuted:'#6090a8', gold:'#40b0d0', accent:'#1060a0' },
      fonts: { heading:'system-ui, sans-serif', body:'system-ui, sans-serif' },
      borderRadius: '10px', slideFont: 'system-ui, sans-serif',
    }
  },
]

const GOOGLE_FONTS = [
  'Georgia, serif', 'Times New Roman, serif', 'Garamond, serif',
  'Inter, sans-serif', 'Roboto, sans-serif', 'Open Sans, sans-serif',
  'Montserrat, sans-serif', 'Playfair Display, serif', 'Lato, sans-serif',
  'Raleway, sans-serif', 'system-ui, sans-serif',
]

export default function ThemePage() {
  const [themes, setThemes] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/themes').then(r=>r.json()).then(d => {
      setThemes(d); setLoading(false)
      if (d.length && !selected) setSelected(d[0])
    })
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!selected) return
    setSaving(true)
    const method = selected.id ? 'PUT' : 'POST'
    const url = selected.id ? `/api/themes/${selected.id}` : '/api/themes'
    await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(selected) })
    setSaving(false); load()
  }

  const addFromPreset = async (preset: any) => {
    const r = await fetch('/api/themes', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name: preset.name, config: preset.config })
    })
    const t = await r.json()
    setSelected(t); load()
  }

  const activate = async (id: string) => {
    await fetch(`/api/themes/${id}`, { method:'PATCH' }); load()
  }

  const del = async (id: string) => {
    await fetch(`/api/themes/${id}`, { method:'DELETE' })
    setSelected(null); load()
  }

  const updateColor = (key: string, val: string) => {
    setSelected((s: any) => ({ ...s, config: { ...s.config, colors: { ...s.config?.colors, [key]: val } } }))
  }
  const updateFont = (key: string, val: string) => {
    setSelected((s: any) => ({ ...s, config: { ...s.config, fonts: { ...s.config?.fonts, [key]: val } } }))
  }

  return (
    <div className="flex h-full">
      {/* Theme list */}
      <div className="w-56 border-r border-[#2a2d38] flex flex-col bg-[#13111e] shrink-0">
        <div className="p-3 border-b border-[#2a2d38] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-serif text-[#e8d8b8]">
            <Palette size={14} className="text-[#c8a96e]" />Themes
          </div>
          <button onClick={() => setSelected({ name:'New Theme', config:{ colors:{}, fonts:{} } })}
            className="p-1 text-[#666] hover:text-[#c8a96e] transition-colors">
            <Plus size={14}/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Presets */}
          <div className="px-3 pt-3 pb-1">
            <div className="text-[10px] text-[#444] uppercase tracking-widest mb-1">Presets</div>
            {PRESET_THEMES.map(p => (
              <button key={p.name} onClick={() => addFromPreset(p)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded text-xs text-[#666] hover:bg-white/5 hover:text-[#888] transition-colors text-left">
                <Sparkles size={10} className="text-[#c8a96e] shrink-0"/>
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>

          <div className="px-3 pt-2 pb-1 border-t border-[#1a1c24] mt-1">
            <div className="text-[10px] text-[#444] uppercase tracking-widest mb-1">Saved</div>
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 size={13} className="animate-spin text-[#444]"/></div>
            ) : themes.map(t => (
              <div key={t.id}
                onClick={() => setSelected(t)}
                className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer group transition-colors ${selected?.id===t.id ? 'bg-[#c8a96e]/10 text-[#c8a96e]' : 'hover:bg-white/5 text-[#666] hover:text-[#888]'}`}>
                {t.is_active && <Check size={10} className="text-green-400 shrink-0"/>}
                <span className="text-xs truncate flex-1">{t.name}</span>
                <button onClick={e=>{e.stopPropagation();del(t.id)}}
                  className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-red-400 transition-colors">
                  <Trash2 size={10}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor */}
      {selected ? (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-xl">
            <div className="flex items-center justify-between mb-5">
              <input value={selected.name} onChange={e=>setSelected((s:any)=>({...s,name:e.target.value}))}
                className="text-lg font-serif bg-transparent text-[#e8d8b8] outline-none border-b border-transparent focus:border-[#c8a96e] px-1"/>
              <div className="flex gap-2">
                {selected.id && !selected.is_active && (
                  <button onClick={() => activate(selected.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-green-700 text-green-400 rounded-lg text-xs hover:bg-green-900/20 transition-colors">
                    <Check size={11}/> Set Active
                  </button>
                )}
                {selected.is_active && <span className="flex items-center gap-1.5 text-green-400 text-xs"><Check size={11}/>Active</span>}
                <button onClick={save} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-sm hover:bg-[#d8b97e] transition-colors disabled:opacity-50">
                  {saving?<Loader2 size={13} className="animate-spin"/>:<Save size={13}/>}
                  {saving?'Saving…':'Save'}
                </button>
              </div>
            </div>

            {/* Colours */}
            <div className="glass p-4 mb-4">
              <h3 className="text-xs text-[#666] uppercase tracking-widest mb-3">Colour Palette</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['bg','Background'],['surface','Surface'],['border','Border'],
                  ['text','Text'],['textMuted','Text Muted'],['gold','Accent / Gold'],['accent','Highlight'],
                ].map(([key,label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <input type="color" value={selected.config?.colors?.[key]||'#000000'}
                      onChange={e=>updateColor(key,e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border border-[#2a2d38]"/>
                    <div>
                      <div className="text-xs text-[#e8d8b8]">{label}</div>
                      <div className="text-[10px] text-[#555] font-mono">{selected.config?.colors?.[key]||'—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fonts */}
            <div className="glass p-4 mb-4">
              <h3 className="text-xs text-[#666] uppercase tracking-widest mb-3">Typography</h3>
              {[['heading','Heading Font'],['body','Body Font']].map(([key,label]) => (
                <div key={key} className="mb-3">
                  <label className="text-xs text-[#666] block mb-1">{label}</label>
                  <select value={selected.config?.fonts?.[key]||'system-ui, sans-serif'}
                    onChange={e=>updateFont(key,e.target.value)}
                    className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-1.5 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e]">
                    {GOOGLE_FONTS.map(f=><option key={f} value={f}>{f}</option>)}
                  </select>
                  <div className="mt-1 text-sm text-[#888]" style={{fontFamily:selected.config?.fonts?.[key]}}>
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              ))}
            </div>

            {/* Preview swatch */}
            <div className="glass p-4">
              <h3 className="text-xs text-[#666] uppercase tracking-widest mb-3">Preview</h3>
              <div className="rounded-lg p-4" style={{
                background: selected.config?.colors?.bg||'#0d0f14',
                border: `1px solid ${selected.config?.colors?.border||'#2a2d38'}`
              }}>
                <div className="text-sm font-bold mb-1" style={{
                  color: selected.config?.colors?.gold||'#c8a96e',
                  fontFamily: selected.config?.fonts?.heading
                }}>Sunday Morning Service</div>
                <div className="text-xs mb-2" style={{
                  color: selected.config?.colors?.text||'#e8e0d0',
                  fontFamily: selected.config?.fonts?.body
                }}>Songs · Scripture · Sermon</div>
                <div className="inline-block rounded px-2 py-0.5 text-xs" style={{
                  background: selected.config?.colors?.surface||'#1a1c24',
                  color: selected.config?.colors?.textMuted||'#888',
                  borderColor: selected.config?.colors?.border||'#2a2d38', border:'1px solid'
                }}>Draft</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#444]">
          Select a theme or add from a preset
        </div>
      )}
    </div>
  )
}
