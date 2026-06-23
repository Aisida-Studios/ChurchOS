'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Image, Upload, Folder, Film, Music, FileText, Search, Tag,
  Trash2, FolderPlus, Grid, List, AlertCircle, X, Move } from 'lucide-react'

interface MediaItem {
  id: string; name: string; type: string; mime_type: string
  size_bytes: number; url: string; tags: string[]; folder_path: string; created_at: string
}
interface Folder { id: string; name: string; parent_id?: string }

const ICONS: Record<string,any> = { image: Image, video: Film, audio: Music, document: FileText }
const COLORS: Record<string,string> = { image:'#c8a96e', video:'#9e6ec8', audio:'#6e9ec8', document:'#6ec89e' }

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + 'KB'
  return (bytes/1024/1024).toFixed(1) + 'MB'
}

function findDuplicates(items: MediaItem[]) {
  const seen = new Map<string, MediaItem[]>()
  items.forEach(item => {
    const key = `${item.name}-${item.size_bytes}`
    if (!seen.has(key)) seen.set(key, [])
    seen.get(key)!.push(item)
  })
  return Array.from(seen.values()).filter(group => group.length > 1).flat().map(i => i.id)
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [dragging, setDragging] = useState(false)
  const [search, setSearch] = useState('')
  const [activeFolder, setActiveFolder] = useState('/')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<string>('all')
  const [showDupes, setShowDupes] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [addingFolder, setAddingFolder] = useState(false)
  const [tagInput, setTagInput] = useState<{id:string,val:string}|null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadMedia = () => {
    fetch('/api/media').then(r=>r.json()).then(d => setItems(Array.isArray(d)?d:[]))
    fetch('/api/media-folders').then(r=>r.json()).then(setFolders)
  }
  useEffect(() => { loadMedia() }, [])

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    const newItems: MediaItem[] = Array.from(files).map(f => ({
      id: Math.random().toString(36).slice(2), name: f.name,
      type: f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' :
            f.type.startsWith('image') ? 'image' : 'document',
      mime_type: f.type, size_bytes: f.size,
      url: URL.createObjectURL(f), tags: [], folder_path: activeFolder,
      created_at: new Date().toISOString()
    }))
    // Save to API
    for (const item of newItems) {
      await fetch('/api/media', {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(item)
      })
    }
    setItems(prev => [...prev, ...newItems])
  }

  const deleteItem = async (id: string) => {
    await fetch(`/api/media/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const addTag = async (id: string, tag: string) => {
    const item = items.find(i => i.id === id)
    if (!item || !tag.trim()) return
    const tags = [...new Set([...item.tags, tag.trim()])]
    await fetch(`/api/media/${id}`, {
      method: 'PUT', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ ...item, tags })
    })
    setItems(prev => prev.map(i => i.id === id ? { ...i, tags } : i))
    setTagInput(null)
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    await fetch('/api/media-folders', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name: newFolderName })
    })
    setNewFolderName(''); setAddingFolder(false); loadMedia()
  }

  const dupeIds = useMemo(() => showDupes ? new Set(findDuplicates(items)) : new Set<string>(), [items, showDupes])

  const filtered = useMemo(() => {
    let list = items
    if (activeFolder !== '/') list = list.filter(i => i.folder_path === activeFolder)
    if (filterType !== 'all') list = list.filter(i => i.type === filterType)
    if (search) list = list.filter(i =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    )
    if (showDupes) list = list.filter(i => dupeIds.has(i.id))
    return list
  }, [items, activeFolder, filterType, search, showDupes, dupeIds])

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-48 border-r border-[#2a2d38] flex flex-col bg-[#13111e] shrink-0">
        <div className="p-3 border-b border-[#2a2d38]">
          <div className="flex items-center gap-1.5 text-sm font-serif text-[#e8d8b8]">
            <Image size={14} className="text-[#c8a96e]" />Media
          </div>
        </div>

        {/* Folders */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-[10px] text-[#444] uppercase tracking-widest px-1 mb-1">Folders</div>
          <button onClick={() => setActiveFolder('/')}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${activeFolder === '/' ? 'bg-[#c8a96e]/10 text-[#c8a96e]' : 'text-[#666] hover:bg-white/5 hover:text-[#888]'}`}>
            <Folder size={11} />All Media
          </button>
          {folders.map(f => (
            <button key={f.id} onClick={() => setActiveFolder(f.name)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${activeFolder === f.name ? 'bg-[#c8a96e]/10 text-[#c8a96e]' : 'text-[#666] hover:bg-white/5 hover:text-[#888]'}`}>
              <Folder size={11} />{f.name}
            </button>
          ))}
          {addingFolder ? (
            <div className="flex gap-1 mt-1">
              <input value={newFolderName} onChange={e=>setNewFolderName(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&createFolder()}
                autoFocus className="flex-1 bg-[#0d0f14] border border-[#2a2d38] rounded px-1.5 py-1 text-xs text-[#e8d8b8] outline-none focus:border-[#c8a96e]" />
              <button onClick={createFolder} className="text-[#c8a96e] text-xs px-1">✓</button>
              <button onClick={()=>setAddingFolder(false)} className="text-[#444] text-xs px-1">✗</button>
            </div>
          ) : (
            <button onClick={()=>setAddingFolder(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[#444] hover:text-[#666] transition-colors mt-1">
              <FolderPlus size={11} />New folder
            </button>
          )}

          <div className="text-[10px] text-[#444] uppercase tracking-widest px-1 mt-3 mb-1">Type</div>
          {['all','image','video','audio','document'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs capitalize transition-colors ${filterType === t ? 'bg-[#c8a96e]/10 text-[#c8a96e]' : 'text-[#666] hover:bg-white/5 hover:text-[#888]'}`}>
              {t === 'all' ? <Grid size={11} /> : React.createElement(ICONS[t] || FileText, { size: 11 })}
              {t}
            </button>
          ))}

          <div className="text-[10px] text-[#444] uppercase tracking-widest px-1 mt-3 mb-1">Tools</div>
          <button onClick={() => setShowDupes(!showDupes)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${showDupes ? 'bg-red-900/20 text-red-400' : 'text-[#666] hover:bg-white/5 hover:text-[#888]'}`}>
            <AlertCircle size={11} />Duplicates {showDupes && `(${dupeIds.size})`}
          </button>
        </div>

        <div className="p-2 border-t border-[#2a2d38] text-[10px] text-[#444]">{items.length} items</div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2d38] shrink-0">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#444]" />
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by name or tag…"
              className="w-full bg-[#1a1c24] border border-[#2a2d38] rounded-lg pl-7 pr-3 py-1.5 text-xs text-[#e8d8b8] outline-none focus:border-[#c8a96e] placeholder-[#444]" />
          </div>
          <div className="flex gap-1 border border-[#2a2d38] rounded-lg overflow-hidden">
            <button onClick={() => setView('grid')} className={`p-1.5 transition-colors ${view==='grid'?'bg-[#c8a96e]/20 text-[#c8a96e]':'text-[#444] hover:text-[#888]'}`}><Grid size={13}/></button>
            <button onClick={() => setView('list')} className={`p-1.5 transition-colors ${view==='list'?'bg-[#c8a96e]/20 text-[#c8a96e]':'text-[#444] hover:text-[#888]'}`}><List size={13}/></button>
          </div>
          <button onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-xs font-medium hover:bg-[#d8b97e] transition-colors">
            <Upload size={12} />Upload
          </button>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={e=>handleFiles(e.target.files)} />
        </div>

        {/* Drop zone overlay / main content */}
        <div className="flex-1 overflow-y-auto relative"
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}>

          {dragging && (
            <div className="absolute inset-0 z-10 bg-[#c8a96e]/10 border-2 border-dashed border-[#c8a96e] flex items-center justify-center">
              <div className="text-[#c8a96e] text-lg font-serif">Drop files here</div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#444]">
              <Upload size={32} className="mb-3 opacity-50" />
              <div className="text-sm">Drag files here or click Upload</div>
            </div>
          ) : view === 'grid' ? (
            <div className="p-4 grid grid-cols-4 gap-3">
              {filtered.map(item => {
                const Icon = ICONS[item.type] || FileText
                const color = COLORS[item.type] || '#888'
                const isDupe = dupeIds.has(item.id)
                return (
                  <div key={item.id} className={`glass group relative cursor-pointer hover:border-[#3a3d48] transition-colors ${isDupe ? 'border-red-800' : ''}`}>
                    {/* Thumbnail / icon */}
                    <div className="aspect-video bg-[#0d0f14] rounded-t overflow-hidden flex items-center justify-center">
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      ) : item.type === 'video' ? (
                        <video src={item.url} className="w-full h-full object-cover" />
                      ) : (
                        <Icon size={28} style={{ color }} />
                      )}
                      {isDupe && (
                        <div className="absolute top-1 left-1 bg-red-600/90 text-white text-[9px] px-1.5 py-0.5 rounded">DUPE</div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-2">
                      <div className="text-xs text-[#e8d8b8] truncate" title={item.name}>{item.name}</div>
                      <div className="text-[10px] text-[#444] mt-0.5">{formatSize(item.size_bytes)}</div>
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.tags?.map((t,i) => (
                          <span key={i} className="text-[9px] bg-[#c8a96e]/10 text-[#c8a96e] px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                        {tagInput?.id === item.id ? (
                          <input autoFocus value={tagInput.val} onChange={e=>setTagInput({id:item.id,val:e.target.value})}
                            onKeyDown={e=>e.key==='Enter'&&addTag(item.id,tagInput.val)}
                            onBlur={()=>setTagInput(null)}
                            className="text-[9px] bg-[#0d0f14] border border-[#c8a96e] rounded px-1 w-14 text-[#e8d8b8] outline-none" />
                        ) : (
                          <button onClick={()=>setTagInput({id:item.id,val:''})}
                            className="text-[9px] text-[#444] hover:text-[#c8a96e] transition-colors">
                            <Tag size={9} />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Actions */}
                    <button onClick={()=>deleteItem(item.id)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-600/80 text-white p-1 rounded transition-all">
                      <Trash2 size={10} />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#2a2d38] text-[#555] text-left">
                    <th className="pb-2 pr-4 font-normal">Name</th>
                    <th className="pb-2 pr-4 font-normal">Type</th>
                    <th className="pb-2 pr-4 font-normal">Size</th>
                    <th className="pb-2 pr-4 font-normal">Tags</th>
                    <th className="pb-2 font-normal">Date</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => {
                    const Icon = ICONS[item.type] || FileText
                    const color = COLORS[item.type] || '#888'
                    return (
                      <tr key={item.id} className="border-b border-[#1a1c24] group hover:bg-white/5">
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <Icon size={12} style={{ color }} />
                            <span className="text-[#e8d8b8] truncate max-w-[160px]">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-2 pr-4 capitalize text-[#666]">{item.type}</td>
                        <td className="py-2 pr-4 text-[#666]">{formatSize(item.size_bytes)}</td>
                        <td className="py-2 pr-4">
                          <div className="flex gap-1 flex-wrap">
                            {item.tags?.map((t,i) => (
                              <span key={i} className="bg-[#c8a96e]/10 text-[#c8a96e] px-1.5 py-0.5 rounded text-[9px]">{t}</span>
                            ))}
                            <button onClick={()=>setTagInput({id:item.id,val:''})} className="text-[#444] hover:text-[#c8a96e]"><Tag size={9}/></button>
                          </div>
                        </td>
                        <td className="py-2 text-[#444]">{new Date(item.created_at).toLocaleDateString('en-GB')}</td>
                        <td className="py-2">
                          <button onClick={()=>deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-red-400 transition-colors">
                            <Trash2 size={11}/>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
