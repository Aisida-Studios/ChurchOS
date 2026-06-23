'use client'
import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Save, Loader2, Mail, Phone, Calendar, Check, X } from 'lucide-react'

const ROLES = ['Worship Leader','Musician','Sound Tech','Lighting','Camera','Greeter',
  'Children's Ministry','Livestream Tech','Slide Operator','Volunteer Coordinator']
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const STATUS_COLORS: Record<string,string> = { pending:'#888', confirmed:'#4ade80', declined:'#f87171' }

interface Volunteer {
  id: string; name: string; email: string; phone: string
  roles: string[]; availability: Record<string,boolean>; notes: string
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [selected, setSelected] = useState<Volunteer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'roster'|'schedule'>('roster')
  const [services, setServices] = useState<any[]>([])
  const [selectedService, setSelectedService] = useState<string>('')
  const [assignments, setAssignments] = useState<any[]>([])

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/volunteers').then(r=>r.json()),
      fetch('/api/services').then(r=>r.json()),
    ]).then(([vols, svcs]) => {
      setVolunteers(vols); setServices(svcs); setLoading(false)
      if (vols.length && !selected) setSelected(vols[0])
    })
  }
  useEffect(() => { load() }, [])

  const loadAssignments = (serviceId: string) => {
    fetch(`/api/assignments?serviceId=${serviceId}`).then(r=>r.json()).then(setAssignments)
  }
  useEffect(() => { if (selectedService) loadAssignments(selectedService) }, [selectedService])

  const save = async () => {
    if (!selected) return
    setSaving(true)
    const method = selected.id ? 'PUT' : 'POST'
    const url = selected.id ? `/api/volunteers/${selected.id}` : '/api/volunteers'
    await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(selected) })
    setSaving(false); load()
  }

  const del = async (id: string) => {
    if (!confirm('Remove volunteer?')) return
    await fetch(`/api/volunteers/${id}`, { method:'DELETE' })
    setSelected(null); load()
  }

  const addNew = () => setSelected({
    id: '', name:'New Volunteer', email:'', phone:'', roles:[], availability:{}, notes:''
  })

  const toggleRole = (role: string) => {
    if (!selected) return
    const roles = selected.roles.includes(role)
      ? selected.roles.filter(r=>r!==role)
      : [...selected.roles, role]
    setSelected({...selected, roles})
  }

  const toggleDay = (day: string) => {
    if (!selected) return
    setSelected({...selected, availability:{...selected.availability, [day]:!selected.availability[day]}})
  }

  const assign = async (volunteerId: string, role: string) => {
    if (!selectedService) return
    await fetch('/api/assignments', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ service_id:selectedService, volunteer_id:volunteerId, role, status:'pending' })
    })
    loadAssignments(selectedService)
  }

  const updateStatus = async (assignId: string, status: string) => {
    const a = assignments.find(a=>a.id===assignId)
    if (!a) return
    await fetch('/api/assignments', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...a, id:assignId, status })
    })
    loadAssignments(selectedService)
  }

  return (
    <div className="flex h-full">
      {/* Volunteer list */}
      <div className="w-56 border-r border-[#2a2d38] flex flex-col bg-[#13111e] shrink-0">
        <div className="p-3 border-b border-[#2a2d38] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-serif text-[#e8d8b8]">
            <Users size={14} className="text-[#c8a96e]"/>Volunteers
          </div>
          <button onClick={addNew} className="p-1 text-[#666] hover:text-[#c8a96e] transition-colors">
            <Plus size={14}/>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={14} className="animate-spin text-[#444]"/></div>
          ) : volunteers.length === 0 ? (
            <div className="text-center py-8 text-[10px] text-[#444]">No volunteers yet</div>
          ) : volunteers.map(v => (
            <div key={v.id} onClick={() => setSelected(v)}
              className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-[#1a1c24] group transition-colors ${selected?.id===v.id?'bg-[#c8a96e]/10 border-l-2 border-l-[#c8a96e]':'hover:bg-white/5'}`}>
              <div className="w-7 h-7 rounded-full bg-[#c8a96e]/20 flex items-center justify-center text-xs text-[#c8a96e] font-medium shrink-0">
                {v.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[#e8d8b8] truncate">{v.name}</div>
                <div className="text-[10px] text-[#555] truncate">{v.roles?.slice(0,2).join(', ')}</div>
              </div>
              <button onClick={e=>{e.stopPropagation();del(v.id)}}
                className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-red-400 transition-colors">
                <Trash2 size={11}/>
              </button>
            </div>
          ))}
        </div>
        <div className="p-2 border-t border-[#2a2d38] text-[10px] text-[#444]">{volunteers.length} volunteers</div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#2a2d38] px-4 shrink-0">
          {([{id:'roster',label:'Roster'},{id:'schedule',label:'Schedule'}] as const).map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`px-3 py-2.5 text-xs border-b-2 -mb-px transition-colors ${tab===t.id?'border-[#c8a96e] text-[#c8a96e]':'border-transparent text-[#666] hover:text-[#888]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'roster' && selected && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-xl">
              <div className="flex items-center justify-between mb-5">
                <input value={selected.name} onChange={e=>setSelected({...selected,name:e.target.value})}
                  className="text-lg font-serif bg-transparent text-[#e8d8b8] outline-none border-b border-transparent focus:border-[#c8a96e] px-1 flex-1"/>
                <button onClick={save} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-sm hover:bg-[#d8b97e] transition-colors disabled:opacity-50 ml-3">
                  {saving?<Loader2 size={13} className="animate-spin"/>:<Save size={13}/>}
                  {saving?'Saving…':'Save'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="glass p-3">
                  <label className="text-[10px] text-[#555] uppercase tracking-widest flex items-center gap-1 mb-1.5">
                    <Mail size={9}/>Email
                  </label>
                  <input value={selected.email} onChange={e=>setSelected({...selected,email:e.target.value})}
                    className="w-full bg-transparent text-xs text-[#e8d8b8] outline-none"/>
                </div>
                <div className="glass p-3">
                  <label className="text-[10px] text-[#555] uppercase tracking-widest flex items-center gap-1 mb-1.5">
                    <Phone size={9}/>Phone
                  </label>
                  <input value={selected.phone} onChange={e=>setSelected({...selected,phone:e.target.value})}
                    className="w-full bg-transparent text-xs text-[#e8d8b8] outline-none"/>
                </div>
              </div>

              <div className="glass p-4 mb-4">
                <h3 className="text-[10px] text-[#555] uppercase tracking-widest mb-3">Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(role => (
                    <button key={role} onClick={()=>toggleRole(role)}
                      className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                        selected.roles?.includes(role)
                          ? 'border-[#c8a96e] bg-[#c8a96e]/10 text-[#c8a96e]'
                          : 'border-[#2a2d38] text-[#555] hover:border-[#3a3d48] hover:text-[#888]'
                      }`}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass p-4 mb-4">
                <h3 className="text-[10px] text-[#555] uppercase tracking-widest mb-3">Availability</h3>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button key={day} onClick={()=>toggleDay(day)}
                      className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                        selected.availability?.[day]
                          ? 'border-green-700 bg-green-900/20 text-green-400'
                          : 'border-[#2a2d38] text-[#555] hover:border-[#3a3d48] hover:text-[#888]'
                      }`}>
                      {day.slice(0,3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass p-4">
                <h3 className="text-[10px] text-[#555] uppercase tracking-widest mb-2">Notes</h3>
                <textarea value={selected.notes} onChange={e=>setSelected({...selected,notes:e.target.value})}
                  rows={3} placeholder="Any notes about this volunteer…"
                  className="w-full bg-transparent text-xs text-[#e8d8b8] outline-none resize-none placeholder-[#333]"/>
              </div>
            </div>
          </div>
        )}

        {tab === 'schedule' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-5">
                <Calendar size={14} className="text-[#c8a96e]"/>
                <select value={selectedService} onChange={e=>setSelectedService(e.target.value)}
                  className="flex-1 bg-[#1a1c24] border border-[#2a2d38] rounded px-3 py-1.5 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e]">
                  <option value="">Select a service…</option>
                  {services.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>

              {selectedService && (
                <>
                  {/* Assignments */}
                  {assignments.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-xs text-[#666] uppercase tracking-widest mb-2">Assigned</h3>
                      <div className="flex flex-col gap-2">
                        {assignments.map(a => {
                          const vol = volunteers.find(v=>v.id===a.volunteer_id)
                          return (
                            <div key={a.id} className="glass p-3 flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-[#c8a96e]/20 flex items-center justify-center text-[10px] text-[#c8a96e] font-medium shrink-0">
                                {vol?.name?.charAt(0)||'?'}
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-[#e8d8b8]">{vol?.name||'Unknown'}</div>
                                <div className="text-[10px] text-[#555]">{a.role}</div>
                              </div>
                              <div className="flex gap-1">
                                {['confirmed','declined'].map(s=>(
                                  <button key={s} onClick={()=>updateStatus(a.id,s)}
                                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${a.status===s?'bg-white/10 border-white/20 text-white':'border-[#2a2d38] text-[#444] hover:text-[#888]'}`}>
                                    {s}
                                  </button>
                                ))}
                              </div>
                              <div className="w-2 h-2 rounded-full shrink-0" style={{background:STATUS_COLORS[a.status]||'#888'}}/>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add assignment */}
                  <h3 className="text-xs text-[#666] uppercase tracking-widest mb-2">Add Volunteer</h3>
                  <div className="flex flex-col gap-2">
                    {volunteers.map(v => (
                      <div key={v.id} className="glass p-3 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#c8a96e]/20 flex items-center justify-center text-[10px] text-[#c8a96e] font-medium shrink-0">
                          {v.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-[#e8d8b8]">{v.name}</div>
                          <div className="text-[10px] text-[#555]">{v.roles?.slice(0,2).join(', ')}</div>
                        </div>
                        <select defaultValue="" onChange={e=>e.target.value&&assign(v.id,e.target.value)}
                          className="bg-[#0d0f14] border border-[#2a2d38] rounded px-2 py-1 text-xs text-[#888] outline-none focus:border-[#c8a96e]">
                          <option value="">Assign role…</option>
                          {v.roles?.map((r:string)=><option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
