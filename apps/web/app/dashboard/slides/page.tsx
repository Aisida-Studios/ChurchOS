'use client'
import { useState, useEffect } from 'react'
import { SlideEditor } from '@/components/slides/SlideEditor'
import { Layout, Plus, Trash2, Loader2, Copy, Sparkles, Upload } from 'lucide-react'

const SLIDE_TEMPLATES = [
  {
    id: 'tpl-title',
    name: 'Title Slide',
    preview: 'Title + subtitle on dark',
    deck: {
      title: 'New Title Deck',
      tags: ['template'],
      slides: [{
        id:'s1', type:'text', content:'Sermon Title', subContent:'Subtitle or scripture reference',
        background:{ type:'gradient', gradient:{ from:'#1a1c24', to:'#0d0f14', angle:135 }},
        typography:{ fontFamily:'Georgia, serif', fontSize:72, fontWeight:700, color:'#c8a96e',
          lineHeight:1.2, letterSpacing:0, shadow:'0 2px 12px rgba(0,0,0,0.8)', align:'center' },
        layout:'center', transition:'fade', transitionDuration:600
      }]
    }
  },
  {
    id: 'tpl-welcome',
    name: 'Welcome',
    preview: 'Welcome screen with notices',
    deck: {
      title: 'Welcome & Notices',
      tags: ['welcome'],
      slides: [
        { id:'s1', type:'announcement', content:'Welcome!', subContent:'We are glad you are here',
          background:{ type:'gradient', gradient:{ from:'#1a1c24', to:'#0d0f14', angle:135 }},
          typography:{ fontFamily:'Georgia, serif', fontSize:72, fontWeight:700, color:'#c8a96e',
            lineHeight:1.2, letterSpacing:0, shadow:'0 2px 12px rgba(0,0,0,0.8)', align:'center' },
          layout:'center', transition:'fade', transitionDuration:500 },
        { id:'s2', type:'announcement', content:'Notices', subContent:'Please silence your mobile phone',
          background:{ type:'solid', color:'#0d0f14' },
          typography:{ fontFamily:'Georgia, serif', fontSize:48, fontWeight:400, color:'#e8e0d0',
            lineHeight:1.4, letterSpacing:0, shadow:'0 1px 6px rgba(0,0,0,0.6)', align:'center' },
          layout:'center', transition:'fade', transitionDuration:400 }
      ]
    }
  },
  {
    id: 'tpl-sermon3',
    name: '3-Point Sermon',
    preview: 'Title + 3 point slides',
    deck: {
      title: 'Sermon: 3 Points',
      tags: ['sermon'],
      slides: [
        { id:'s1', type:'text', content:'Sermon Title', subContent:'Key passage reference',
          background:{ type:'gradient', gradient:{ from:'#1a2a3a', to:'#0d1520', angle:160 }},
          typography:{ fontFamily:'Georgia, serif', fontSize:72, fontWeight:700, color:'#c8e8ff',
            lineHeight:1.2, letterSpacing:0, shadow:'0 2px 12px rgba(0,0,0,0.8)', align:'center' },
          layout:'center', transition:'fade', transitionDuration:600 },
        ...[1,2,3].map(n => ({
          id:`s${n+1}`, type:'text', content:`Point ${n}: Title`, subContent:'Supporting scripture',
          background:{ type:'solid', color:'#111318' },
          typography:{ fontFamily:'Georgia, serif', fontSize:52, fontWeight:400, color:'#e8e0d0',
            lineHeight:1.4, letterSpacing:0, shadow:'0 1px 6px rgba(0,0,0,0.5)', align:'center' },
          layout:'center', transition:'slide-left', transitionDuration:400
        }))
      ]
    }
  },
  {
    id: 'tpl-blank',
    name: 'Blank',
    preview: 'Empty deck to start fresh',
    deck: {
      title: 'New Deck',
      tags: [],
      slides: [{
        id:'s1', type:'blank', content:'', subContent:'',
        background:{ type:'solid', color:'#000000' },
        typography:{ fontFamily:'Georgia, serif', fontSize:48, fontWeight:400, color:'#ffffff',
          lineHeight:1.4, letterSpacing:0, align:'center' },
        layout:'center', transition:'fade', transitionDuration:400
      }]
    }
  },
]

export default function SlidesPage() {
  const [decks, setDecks] = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'decks' | 'templates'>('decks')

  const load = () => {
    setLoading(true)
    fetch('/api/slides').then(r => r.json()).then(d => {
      setDecks(d); setLoading(false)
      if (d.length && !selected) { setSelected(d[0].id); setEditing(d[0]) }
    })
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!editing) return
    await fetch(`/api/slides/${editing.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing)
    })
    load()
  }

  const addDeck = async (prefill?: any) => {
    const newDeck = prefill || {
      title: 'New Deck', tags: [],
      slides: [{ id:'s1', type:'blank', content:'New Slide', subContent:'',
        background:{ type:'solid', color:'#0d0f14' },
        typography:{ fontFamily:'Georgia, serif', fontSize:52, fontWeight:700, color:'#ffffff',
          lineHeight:1.3, letterSpacing:0, shadow:'0 1px 6px rgba(0,0,0,0.8)', align:'center' },
        layout:'center', transition:'fade', transitionDuration:400 }]
    }
    const r = await fetch('/api/slides', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newDeck)
    })
    const d = await r.json()
    setDecks(prev => [...prev, d])
    setSelected(d.id); setEditing(d); setTab('decks')
  }

  const cloneDeck = async (deck: any) => {
    await addDeck({
      title: deck.title + ' (Copy)',
      tags: deck.tags,
      slides: deck.slides.map((s: any) => ({
        ...s, id: 's' + Math.random().toString(36).slice(2,8)
      }))
    })
  }

  const deleteDeck = async (id: string) => {
    if (!confirm('Delete this deck?')) return
    await fetch(`/api/slides/${id}`, { method: 'DELETE' })
    setSelected(null); setEditing(null); load()
  }

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className="w-64 border-r border-[#2a2d38] flex flex-col bg-[#13111e] shrink-0">
        <div className="p-3 border-b border-[#2a2d38]">
          <div className="flex items-center gap-2 mb-2">
            <Layout size={14} className="text-[#c8a96e]" />
            <span className="text-sm font-serif text-[#e8d8b8]">Slide Decks</span>
            <div className="ml-auto flex gap-1">
              <label title="Import .pptx" className="p-1 text-[#666] hover:text-[#c8a96e] transition-colors cursor-pointer">
                <Upload size={14}/>
                <input type="file" accept=".pptx" className="hidden" onChange={async e => {
                  const file = e.target.files?.[0]; if (!file) return
                  const fd = new FormData(); fd.append('file', file)
                  const r = await fetch('/api/import/pptx', { method:'POST', body:fd })
                  const data = await r.json()
                  if (data.slides) addDeck({ title: file.name.replace('.pptx',''), tags:['imported'], slides: data.slides })
                  else alert(data.error || 'Import failed')
                }}/>
              </label>
              <button onClick={() => addDeck()} className="p-1 text-[#666] hover:text-[#c8a96e] transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div className="flex gap-1">
            {([{id:'decks',label:'Library'},{id:'templates',label:'Templates'}] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 text-xs py-1 rounded transition-colors ${
                  tab === t.id ? 'bg-[#c8a96e]/20 text-[#c8a96e]' : 'text-[#666] hover:text-[#888]'
                }`}>{t.label}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === 'decks' ? (
            loading ? (
              <div className="flex items-center justify-center py-8 text-[#444]"><Loader2 size={14} className="animate-spin" /></div>
            ) : decks.length === 0 ? (
              <div className="text-center py-8 text-[#444] text-xs">No decks yet</div>
            ) : (
              decks.map(deck => (
                <div key={deck.id}
                  className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer group border-b border-[#1a1c24] transition-colors ${
                    selected === deck.id ? 'bg-[#c8a96e]/10 border-l-2 border-l-[#c8a96e]' : 'hover:bg-white/5'
                  }`}
                  onClick={() => { setSelected(deck.id); setEditing(deck) }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[#e8d8b8] truncate">{deck.title}</div>
                    <div className="text-[10px] text-[#555]">{deck.slides?.length ?? 0} slides</div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                    <button onClick={e => { e.stopPropagation(); cloneDeck(deck) }}
                      className="p-0.5 text-[#444] hover:text-[#888] transition-colors"><Copy size={10} /></button>
                    <button onClick={e => { e.stopPropagation(); deleteDeck(deck.id) }}
                      className="p-0.5 text-[#444] hover:text-red-400 transition-colors"><Trash2 size={10} /></button>
                  </div>
                </div>
              ))
            )
          ) : (
            SLIDE_TEMPLATES.map(tmpl => (
              <div key={tmpl.id}
                className="px-3 py-2.5 border-b border-[#1a1c24] cursor-pointer hover:bg-white/5 group"
                onClick={() => addDeck(tmpl.deck)}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Sparkles size={10} className="text-[#c8a96e]" />
                  <div className="text-xs font-medium text-[#e8d8b8]">{tmpl.name}</div>
                </div>
                <div className="text-[10px] text-[#555]">{tmpl.preview}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      {editing ? (
        <div className="flex-1 flex flex-col min-w-0">
          <SlideEditor deck={editing} onChange={setEditing} onSave={save} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#444]">
          Select a deck or create one from a template
        </div>
      )}
    </div>
  )
}
