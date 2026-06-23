'use client'
import { useState, useEffect } from 'react'
import { BibleSearch } from '@/components/bible/BibleSearch'
import { BookOpen, Heart, Plus, Trash2, Loader2, BookMarked, GitCompare } from 'lucide-react'

interface Collection {
  id: string; name: string; passages: any[]
}

function MultiVersionCompare({ reference }: { reference: string }) {
  const translations = ['NKJV','KJV','NLT','MSG']
  const [results, setResults] = useState<Record<string,any>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!reference) return
    setLoading(true)
    Promise.all(
      translations.map(t =>
        fetch(`/api/bible?ref=${encodeURIComponent(reference)}&t=${t}`).then(r => r.json()).then(d => [t, d])
      )
    ).then(pairs => {
      setResults(Object.fromEntries(pairs))
      setLoading(false)
    })
  }, [reference])

  if (loading) return <div className="flex items-center gap-2 text-[#555] py-4"><Loader2 size={14} className="animate-spin" />Loading translations…</div>

  return (
    <div className="grid grid-cols-2 gap-3">
      {translations.map(t => {
        const data = results[t]
        return (
          <div key={t} className="glass p-3">
            <div className="text-xs text-[#c8a96e] font-medium mb-2">{t}</div>
            {data?.verses?.map((v: any) => (
              <p key={v.verse} className="text-xs text-[#e8d8b8] leading-relaxed mb-1">
                <span className="text-[#555] mr-1">{v.verse}</span>{v.text}
              </p>
            )) ?? <p className="text-xs text-[#555]">Not found</p>}
          </div>
        )
      })}
    </div>
  )
}

export default function BiblePage() {
  const [tab, setTab] = useState<'search' | 'collections' | 'compare'>('search')
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [compareRef, setCompareRef] = useState('John 3:16')

  const loadCollections = () => {
    setLoading(true)
    fetch('/api/collections').then(r => r.json()).then(d => { setCollections(d); setLoading(false) })
  }
  useEffect(() => { if (tab === 'collections') loadCollections() }, [tab])

  const addCollection = async () => {
    if (!newColName.trim()) return
    await fetch('/api/collections', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newColName, passages: [] })
    })
    setNewColName('')
    loadCollections()
  }

  const delCollection = async (id: string) => {
    await fetch(`/api/collections/${id}`, { method: 'DELETE' })
    loadCollections()
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen size={18} className="text-[#c8a96e]" />
        <h1 className="text-xl font-serif text-[#e8d8b8]">Bible</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#2a2d38]">
        {([
          { id: 'search', label: 'Search & Display', icon: BookOpen },
          { id: 'collections', label: 'Collections', icon: Heart },
          { id: 'compare', label: 'Multi-Version', icon: GitCompare },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
              tab === id ? 'border-[#c8a96e] text-[#c8a96e]' : 'border-transparent text-[#666] hover:text-[#888]'
            }`}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {tab === 'search' && <BibleSearch />}

      {tab === 'collections' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <input value={newColName} onChange={e => setNewColName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCollection()}
              placeholder="New collection name…"
              className="flex-1 bg-[#1a1c24] border border-[#2a2d38] rounded-lg px-3 py-2 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e] placeholder-[#444]" />
            <button onClick={addCollection}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-sm hover:bg-[#d8b97e] transition-colors">
              <Plus size={13} /> Add
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-[#555] py-8 justify-center"><Loader2 size={14} className="animate-spin" /></div>
          ) : collections.length === 0 ? (
            <div className="text-center py-12 text-[#555] text-sm">No collections yet. Create one above.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {collections.map(col => (
                <div key={col.id} className="glass p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BookMarked size={14} className="text-[#c8a96e]" />
                      <span className="text-sm font-medium text-[#e8d8b8]">{col.name}</span>
                      <span className="text-xs text-[#555]">{col.passages?.length ?? 0} passages</span>
                    </div>
                    <button onClick={() => delCollection(col.id)}
                      className="text-[#444] hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {col.passages?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {col.passages.map((p: any, i: number) => (
                        <span key={i} className="text-xs bg-[#1a1c24] border border-[#2a2d38] rounded px-2 py-0.5 text-[#888]">
                          {p.reference}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'compare' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <input value={compareRef} onChange={e => setCompareRef(e.target.value)}
              placeholder="e.g. John 3:16 or Romans 8:28"
              className="flex-1 bg-[#1a1c24] border border-[#2a2d38] rounded-lg px-3 py-2 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e] placeholder-[#444]" />
          </div>
          <MultiVersionCompare reference={compareRef} />
        </div>
      )}
    </div>
  )
}
