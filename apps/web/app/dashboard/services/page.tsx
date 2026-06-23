'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Plus, Play, Pencil, Trash2, Loader2, Copy, LayoutTemplate,
  Clock, ChevronDown, ChevronUp, Music, BookOpen, Layout, Megaphone, Minus } from 'lucide-react'

interface Service {
  id: string; title: string; scheduled_at?: string; status: string; items: any[]
}
interface Template {
  id: string; name: string; description: string; items: any[]
}

const ITEM_ICONS: Record<string, any> = {
  song: Music, scripture: BookOpen, slide_deck: Layout,
  announcement: Megaphone, separator: Minus, media: Layout
}
const ITEM_COLORS: Record<string, string> = {
  song: '#c8a96e', scripture: '#6e9ec8', slide_deck: '#9e6ec8',
  announcement: '#e8a86e', separator: '#555', media: '#6ec89e'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
  })
}

function TimelineView({ items }: { items: any[] }) {
  if (!items?.length) return null
  return (
    <div className="mt-3 pl-4 border-l border-[#2a2d38]">
      {items.map((item, i) => {
        const Icon = ITEM_ICONS[item.type] ?? Music
        const color = ITEM_COLORS[item.type] ?? '#888'
        return (
          <div key={item.id} className="flex items-center gap-2 py-1 group">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
            <Icon size={10} style={{ color }} className="shrink-0" />
            <span className="text-xs text-[#888]">{item.label}</span>
            <span className="text-[10px] text-[#444] ml-auto uppercase tracking-wide">{item.type.replace('_',' ')}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [tab, setTab] = useState<'services' | 'templates'>('services')
  const [savingTemplate, setSavingTemplate] = useState<string | null>(null)
  const [newTmplName, setNewTmplName] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/services').then(r => r.json()),
      fetch('/api/templates').then(r => r.json()),
    ]).then(([svcs, tmpls]) => {
      setServices(svcs); setTemplates(tmpls); setLoading(false)
    })
  }
  useEffect(() => { load() }, [])

  const del = async (id: string) => {
    if (!confirm('Delete this service?')) return
    await fetch(`/api/services/${id}`, { method: 'DELETE' })
    load()
  }

  const clone = async (svc: Service) => {
    const newSvc = {
      title: svc.title + ' (Copy)',
      status: 'draft',
      items: svc.items.map(it => ({ ...it, id: 'i' + Math.random().toString(36).slice(2,8) }))
    }
    await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSvc) })
    load()
  }

  const saveAsTemplate = async (svc: Service) => {
    const name = prompt('Template name:', svc.title)
    if (!name) return
    setSavingTemplate(svc.id)
    await fetch('/api/templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: `From: ${svc.title}`, items: svc.items })
    })
    setSavingTemplate(null)
    load()
  }

  const createFromTemplate = async (tmpl: Template) => {
    const title = prompt('Service title:', `${tmpl.name} - ${new Date().toLocaleDateString('en-GB')}`)
    if (!title) return
    await fetch('/api/services', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, status: 'draft',
        items: tmpl.items.map(it => ({ ...it, id: 'i' + Math.random().toString(36).slice(2,8) }))
      })
    })
    setTab('services'); load()
  }

  const delTemplate = async (id: string) => {
    if (!confirm('Delete template?')) return
    await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-[#c8a96e]" />
          <h1 className="text-xl font-serif text-[#e8d8b8]">Services</h1>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'services' && (
            <Link href="/dashboard/services/new"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-sm font-medium hover:bg-[#d8b97e] transition-colors">
              <Plus size={14} /> New Service
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-[#2a2d38]">
        {(['services', 'templates'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-[#c8a96e] text-[#c8a96e]' : 'border-transparent text-[#666] hover:text-[#888]'
            }`}>
            {t === 'templates' ? <><LayoutTemplate size={12} className="inline mr-1.5 mb-0.5" />Templates</> : t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#555] py-12 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading...
        </div>
      ) : tab === 'services' ? (
        services.length === 0 ? (
          <div className="text-center py-12 text-[#555]">No services yet. Create your first one.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {services.map(svc => (
              <div key={svc.id} className="glass">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#e8d8b8] mb-1">{svc.title}</div>
                    <div className="text-xs text-[#666]">
                      {svc.scheduled_at ? formatDate(svc.scheduled_at) : 'No date set'}
                      {' · '}{svc.items?.length ?? 0} items
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#555] capitalize border border-[#2a2d38] px-2 py-0.5 rounded">{svc.status}</span>
                    <button onClick={() => setExpanded(expanded === svc.id ? null : svc.id)}
                      title="Timeline view"
                      className="p-1.5 text-[#666] hover:text-[#e8d8b8] transition-colors">
                      {expanded === svc.id ? <ChevronUp size={13} /> : <Clock size={13} />}
                    </button>
                    <button onClick={() => clone(svc)} title="Clone service"
                      className="p-1.5 text-[#666] hover:text-[#e8d8b8] transition-colors">
                      <Copy size={13} />
                    </button>
                    <button onClick={() => saveAsTemplate(svc)} title="Save as template"
                      className="p-1.5 text-[#666] hover:text-[#e8d8b8] transition-colors">
                      {savingTemplate === svc.id ? <Loader2 size={13} className="animate-spin" /> : <LayoutTemplate size={13} />}
                    </button>
                    <Link href={`/dashboard/services/${svc.id}/edit`}
                      className="p-1.5 text-[#666] hover:text-[#e8d8b8] transition-colors" title="Edit">
                      <Pencil size={13} />
                    </Link>
                    <button onClick={() => del(svc.id)}
                      className="p-1.5 text-[#666] hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 size={13} />
                    </button>
                    <Link href={`/dashboard/services/${svc.id}/live`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-500 transition-colors">
                      <Play size={11} fill="white" /> Go Live
                    </Link>
                  </div>
                </div>
                {expanded === svc.id && <TimelineView items={svc.items} />}
              </div>
            ))}
          </div>
        )
      ) : (
        <div>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-[#555]">
              No templates yet. Save a service as a template using the <LayoutTemplate size={13} className="inline" /> button.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {templates.map(tmpl => (
                <div key={tmpl.id} className="glass p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#e8d8b8] mb-1">{tmpl.name}</div>
                    <div className="text-xs text-[#666]">{tmpl.description} · {tmpl.items?.length ?? 0} items</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => createFromTemplate(tmpl)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-xs font-medium hover:bg-[#d8b97e] transition-colors">
                      <Plus size={11} /> Use Template
                    </button>
                    <button onClick={() => delTemplate(tmpl.id)}
                      className="p-1.5 text-[#666] hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
