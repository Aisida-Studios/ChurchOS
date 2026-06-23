'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Music, BookOpen, Layout, Image, Megaphone, Minus, Plus, Trash2,
  GripVertical, Save, ArrowLeft, Loader2 } from 'lucide-react'

type ItemType = 'song' | 'scripture' | 'slide_deck' | 'media' | 'announcement' | 'separator'

interface ServiceItem {
  id: string; type: ItemType; label: string; reference_id?: string; position: number; config: Record<string,any>
}
interface Song { id: string; title: string; author?: string }
interface Deck { id: string; title: string }

const ITEM_ICONS: Record<ItemType, any> = {
  song: Music, scripture: BookOpen, slide_deck: Layout,
  media: Image, announcement: Megaphone, separator: Minus,
}
const ITEM_COLORS: Record<ItemType, string> = {
  song: '#c8a96e', scripture: '#6e9ec8', slide_deck: '#9e6ec8',
  media: '#6ec89e', announcement: '#e8a86e', separator: '#555',
}

function uid() { return Math.random().toString(36).slice(2,8) }

interface Props { serviceId?: string }

export default function ServiceBuilder({ serviceId }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('New Service')
  const [scheduledAt, setScheduledAt] = useState('')
  const [status, setStatus] = useState<'draft'|'live'|'archived'>('draft')
  const [items, setItems] = useState<ServiceItem[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [decks, setDecks] = useState<Deck[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!serviceId)

  // Drag state
  const dragIdx = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/songs').then(r=>r.json()).then(setSongs)
    fetch('/api/slides').then(r=>r.json()).then(setDecks)
    if (serviceId) {
      fetch(`/api/services/${serviceId}`).then(r=>r.json()).then(svc => {
        setTitle(svc.title)
        setScheduledAt(svc.scheduled_at ? new Date(svc.scheduled_at).toISOString().slice(0,16) : '')
        setStatus(svc.status)
        setItems((svc.items||[]).sort((a:ServiceItem,b:ServiceItem)=>a.position-b.position))
        setLoading(false)
      })
    }
  }, [serviceId])

  // Drag handlers
  const onDragStart = (idx: number) => { dragIdx.current = idx }
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOver(idx)
  }
  const onDrop = (toIdx: number) => {
    const fromIdx = dragIdx.current
    if (fromIdx === null || fromIdx === toIdx) { setDragOver(null); return }
    const next = [...items]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    setItems(next.map((it, i) => ({ ...it, position: i })))
    dragIdx.current = null
    setDragOver(null)
  }
  const onDragEnd = () => { dragIdx.current = null; setDragOver(null) }

  const removeItem = (idx: number) => {
    setItems(items.filter((_,i) => i !== idx).map((it,i) => ({ ...it, position: i })))
  }

  const addItem = (type: ItemType, extra: Partial<ServiceItem> = {}) => {
    const item: ServiceItem = {
      id: 'i' + uid(), type, label: extra.label || type,
      reference_id: extra.reference_id, position: items.length, config: extra.config || {}
    }
    setItems(prev => [...prev, item])
  }

  const updateLabel = (idx: number, label: string) => {
    const next = [...items]; next[idx] = { ...next[idx], label }; setItems(next)
  }

  const save = async () => {
    setSaving(true)
    const body = {
      id: serviceId, title, status,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      items: items.map((it,i) => ({ ...it, position: i }))
    }
    const url = serviceId ? `/api/services/${serviceId}` : '/api/services'
    const method = serviceId ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    router.push('/dashboard/services')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full text-[#555]">
      <Loader2 size={20} className="animate-spin mr-2" /> Loading...
    </div>
  )

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#2a2d38] bg-[#1a1c24] shrink-0">
        <button onClick={() => router.push('/dashboard/services')}
          className="text-[#666] hover:text-[#e8d8b8] transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <input value={title} onChange={e=>setTitle(e.target.value)}
            className="bg-transparent text-lg font-serif text-[#e8d8b8] outline-none border-b border-transparent focus:border-[#c8a96e] px-1 min-w-0 flex-1" />
          <input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)}
            className="bg-[#0d0f14] border border-[#2a2d38] rounded px-2 py-1 text-xs text-[#888] outline-none focus:border-[#c8a96e]" />
          <select value={status} onChange={e=>setStatus(e.target.value as any)}
            className="bg-[#0d0f14] border border-[#2a2d38] rounded px-2 py-1 text-xs text-[#888] outline-none focus:border-[#c8a96e]">
            <option value="draft">Draft</option>
            <option value="live">Live</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-sm font-medium hover:bg-[#d8b97e] transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Order of service */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-xl">
            <h2 className="text-xs text-[#666] uppercase tracking-widest mb-3">Order of Service</h2>

            {items.length === 0 && (
              <div className="text-center py-10 text-[#444] text-sm border border-dashed border-[#2a2d38] rounded-lg">
                Add items from the panel on the right
              </div>
            )}

            <div className="flex flex-col gap-2">
              {items.map((item, idx) => {
                const Icon = ITEM_ICONS[item.type]
                const color = ITEM_COLORS[item.type]
                const isDragTarget = dragOver === idx
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={e => onDragOver(e, idx)}
                    onDrop={() => onDrop(idx)}
                    onDragEnd={onDragEnd}
                    className={`glass flex items-center gap-3 px-3 py-2.5 group cursor-grab active:cursor-grabbing transition-all ${isDragTarget ? 'ring-1 ring-[#c8a96e] scale-[1.01]' : ''}`}
                  >
                    <GripVertical size={14} className="text-[#444] group-hover:text-[#666] shrink-0 transition-colors" />
                    <div className="w-1 h-8 rounded-full shrink-0" style={{ background: color }} />
                    <Icon size={13} className="shrink-0" style={{ color }} />
                    <div className="flex-1 flex flex-col min-w-0">
                      <input value={item.label} onChange={e => updateLabel(idx, e.target.value)}
                        className="bg-transparent text-sm text-[#e8d8b8] outline-none w-full"
                        onMouseDown={e => e.stopPropagation()} />
                      <input value={item.config?.notes || ''} onChange={e => {
                        const next = [...items]; next[idx] = { ...next[idx], config: { ...next[idx].config, notes: e.target.value } }; setItems(next)
                      }} placeholder="Notes (optional)"
                        className="bg-transparent text-xs text-[#555] outline-none w-full placeholder-[#333]"
                        onMouseDown={e => e.stopPropagation()} />
                    </div>
                    <span className="text-[10px] text-[#444] uppercase tracking-wide shrink-0">{item.type.replace('_',' ')}</span>
                    <button onClick={() => removeItem(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#444] hover:text-red-400 transition-colors">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Add items panel */}
        <div className="w-64 border-l border-[#2a2d38] flex flex-col bg-[#1a1c24] shrink-0">
          <div className="px-4 py-3 border-b border-[#2a2d38] text-xs text-[#666] uppercase tracking-widest">Add Items</div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">

            <div>
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1.5 px-1">Songs</div>
              {songs.map(s => (
                <button key={s.id} onClick={() => addItem('song', { label: s.title, reference_id: s.id })}
                  className="w-full text-left px-2.5 py-2 rounded text-xs text-[#888] hover:bg-white/5 hover:text-[#e8d8b8] flex items-center gap-2 transition-colors">
                  <Music size={11} className="text-[#c8a96e] shrink-0" />
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>

            <div className="mt-2">
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1.5 px-1">Slide Decks</div>
              {decks.map(d => (
                <button key={d.id} onClick={() => addItem('slide_deck', { label: d.title, reference_id: d.id })}
                  className="w-full text-left px-2.5 py-2 rounded text-xs text-[#888] hover:bg-white/5 hover:text-[#e8d8b8] flex items-center gap-2 transition-colors">
                  <Layout size={11} className="text-[#9e6ec8] shrink-0" />
                  <span className="truncate">{d.title}</span>
                </button>
              ))}
            </div>

            <div className="mt-2">
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1.5 px-1">Other</div>
              {([
                { type: 'scripture' as ItemType, label: 'Scripture Reading', icon: BookOpen, color: '#6e9ec8' },
                { type: 'announcement' as ItemType, label: 'Announcement', icon: Megaphone, color: '#e8a86e' },
                { type: 'media' as ItemType, label: 'Media Item', icon: Image, color: '#6ec89e' },
                { type: 'separator' as ItemType, label: '— Separator —', icon: Minus, color: '#555' },
              ]).map(({ type, label, icon: Icon, color }) => (
                <button key={type} onClick={() => addItem(type, { label })}
                  className="w-full text-left px-2.5 py-2 rounded text-xs text-[#888] hover:bg-white/5 hover:text-[#e8d8b8] flex items-center gap-2 transition-colors">
                  <Icon size={11} style={{ color }} className="shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
