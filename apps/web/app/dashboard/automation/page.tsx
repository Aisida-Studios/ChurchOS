'use client'
import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2, Play, Loader2, Calendar, RefreshCw, Sparkles, Save } from 'lucide-react'

const TRIGGER_TYPES = [
  { id: 'service_start', label: 'Service starts' },
  { id: 'item_change', label: 'Item changes' },
  { id: 'slide_advance', label: 'Slide advances' },
  { id: 'time', label: 'At a specific time' },
  { id: 'manual', label: 'Manual (macro button)' },
]
const ACTION_TYPES = [
  { id: 'blackout', label: 'Blank screen' },
  { id: 'next_slide', label: 'Next slide' },
  { id: 'prev_slide', label: 'Previous slide' },
  { id: 'send_scripture', label: 'Send scripture to output' },
  { id: 'log_song_usage', label: 'Log song usage' },
  { id: 'notify', label: 'Show notification' },
]

interface Workflow {
  id: string; name: string; trigger: string; actions: { type: string; config: any }[]; enabled: boolean
}

export default function AutomationPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [services, setServices] = useState<any[]>([])
  const [tab, setTab] = useState<'workflows'|'recurring'|'build-service'>('workflows')
  const [editing, setEditing] = useState<Workflow|null>(null)
  const [saving, setSaving] = useState(false)

  // Recurring service state
  const [recurForm, setRecurForm] = useState({ templateServiceId:'', count:4, intervalDays:7, startDate:'' })
  const [recurLoading, setRecurLoading] = useState(false)
  const [recurResult, setRecurResult] = useState<any>(null)

  // AI service builder
  const [buildPrompt, setBuildPrompt] = useState('')
  const [buildLoading, setBuildLoading] = useState(false)
  const [buildResult, setBuildResult] = useState<any>(null)
  const [buildSaving, setBuildSaving] = useState(false)

  useEffect(() => {
    // Load workflows from localStorage (no DB table needed - client-side only)
    const saved = localStorage.getItem('churchos_workflows')
    if (saved) setWorkflows(JSON.parse(saved))
    fetch('/api/services').then(r=>r.json()).then(setServices)
  }, [])

  const saveWorkflows = (wfs: Workflow[]) => {
    setWorkflows(wfs)
    localStorage.setItem('churchos_workflows', JSON.stringify(wfs))
  }

  const addWorkflow = () => {
    const wf: Workflow = {
      id: Math.random().toString(36).slice(2), name:'New Workflow',
      trigger:'manual', actions:[{ type:'next_slide', config:{} }], enabled:true
    }
    setEditing(wf)
  }

  const saveWorkflow = () => {
    if (!editing) return
    const exists = workflows.find(w=>w.id===editing.id)
    const next = exists ? workflows.map(w=>w.id===editing.id?editing:w) : [...workflows, editing]
    saveWorkflows(next); setEditing(null)
  }

  const delWorkflow = (id: string) => saveWorkflows(workflows.filter(w=>w.id!==id))

  const toggleWorkflow = (id: string) => {
    saveWorkflows(workflows.map(w=>w.id===id?{...w,enabled:!w.enabled}:w))
  }

  const generateRecurring = async () => {
    if (!recurForm.templateServiceId) return
    setRecurLoading(true); setRecurResult(null)
    try {
      const r = await fetch('/api/ai/recurring', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(recurForm)
      })
      setRecurResult(await r.json())
    } catch (e:any) { setRecurResult({ error: e.message }) }
    setRecurLoading(false)
  }

  const buildService = async () => {
    if (!buildPrompt.trim()) return
    setBuildLoading(true); setBuildResult(null)
    try {
      const r = await fetch('/api/ai/build-service', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt: buildPrompt })
      })
      setBuildResult(await r.json())
    } catch (e:any) { setBuildResult({ error: e.message }) }
    setBuildLoading(false)
  }

  const saveBuildResult = async () => {
    if (!buildResult) return
    setBuildSaving(true)
    await fetch('/api/services', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(buildResult)
    })
    setBuildSaving(false)
    setBuildResult(null); setBuildPrompt('')
    alert('Service created! Find it in Services.')
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Zap size={18} className="text-[#c8a96e]"/>
        <h1 className="text-xl font-serif text-[#e8d8b8]">Automation</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#2a2d38]">
        {([
          {id:'workflows',label:'Workflows'},
          {id:'recurring',label:'Recurring Services'},
          {id:'build-service',label:'AI Service Builder'},
        ] as const).map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${tab===t.id?'border-[#c8a96e] text-[#c8a96e]':'border-transparent text-[#666] hover:text-[#888]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── WORKFLOWS ── */}
      {tab==='workflows' && (
        <div>
          {editing ? (
            <div className="glass p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}
                  className="text-sm font-medium bg-transparent text-[#e8d8b8] outline-none border-b border-[#2a2d38] focus:border-[#c8a96e] px-1"/>
                <div className="flex gap-2">
                  <button onClick={()=>setEditing(null)} className="text-xs text-[#555] hover:text-[#888] px-3 py-1">Cancel</button>
                  <button onClick={saveWorkflow} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#c8a96e] text-[#0d0f14] rounded hover:bg-[#d8b97e] transition-colors">
                    <Save size={11}/>Save
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <label className="text-[10px] text-[#555] uppercase tracking-widest block mb-1">Trigger</label>
                <select value={editing.trigger} onChange={e=>setEditing({...editing,trigger:e.target.value})}
                  className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-1.5 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e]">
                  {TRIGGER_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#555] uppercase tracking-widest block mb-1">Actions</label>
                {editing.actions.map((a,i)=>(
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <select value={a.type}
                      onChange={e=>setEditing({...editing,actions:editing.actions.map((ac,j)=>j===i?{...ac,type:e.target.value}:ac)})}
                      className="flex-1 bg-[#0d0f14] border border-[#2a2d38] rounded px-2 py-1.5 text-xs text-[#e8d8b8] outline-none focus:border-[#c8a96e]">
                      {ACTION_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <button onClick={()=>setEditing({...editing,actions:editing.actions.filter((_,j)=>j!==i)})}
                      className="text-[#444] hover:text-red-400 transition-colors"><Trash2 size={12}/></button>
                  </div>
                ))}
                <button onClick={()=>setEditing({...editing,actions:[...editing.actions,{type:'next_slide',config:{}}]})}
                  className="text-xs text-[#555] hover:text-[#888] flex items-center gap-1 mt-1">
                  <Plus size={10}/>Add action
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-[#666]">{workflows.length} workflow{workflows.length!==1?'s':''}</div>
            <button onClick={addWorkflow}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#c8a96e] text-[#0d0f14] rounded-lg hover:bg-[#d8b97e] transition-colors">
              <Plus size={11}/>New Workflow
            </button>
          </div>

          {workflows.length===0 ? (
            <div className="text-center py-10 text-[#444] text-sm border border-dashed border-[#2a2d38] rounded-lg">
              Workflows let you automate actions triggered by service events.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {workflows.map(wf=>(
                <div key={wf.id} className="glass p-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${wf.enabled?'bg-green-400':'bg-[#444]'}`}/>
                  <div className="flex-1">
                    <div className="text-sm text-[#e8d8b8]">{wf.name}</div>
                    <div className="text-[10px] text-[#555]">
                      {TRIGGER_TYPES.find(t=>t.id===wf.trigger)?.label} → {wf.actions.map(a=>ACTION_TYPES.find(t=>t.id===a.type)?.label).join(', ')}
                    </div>
                  </div>
                  <button onClick={()=>toggleWorkflow(wf.id)}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${wf.enabled?'border-green-700 text-green-400 hover:bg-green-900/20':'border-[#2a2d38] text-[#444] hover:text-[#888]'}`}>
                    {wf.enabled?'On':'Off'}
                  </button>
                  <button onClick={()=>setEditing(wf)} className="text-[#444] hover:text-[#888] p-1 transition-colors">
                    <Zap size={12}/>
                  </button>
                  <button onClick={()=>delWorkflow(wf.id)} className="text-[#444] hover:text-red-400 p-1 transition-colors">
                    <Trash2 size={12}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── RECURRING SERVICES ── */}
      {tab==='recurring' && (
        <div>
          <div className="glass p-4 mb-4">
            <h2 className="text-sm font-medium text-[#e8d8b8] mb-4 flex items-center gap-2">
              <RefreshCw size={13} className="text-[#c8a96e]"/>Generate Recurring Services
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#666] block mb-1">Template Service</label>
                <select value={recurForm.templateServiceId}
                  onChange={e=>setRecurForm(f=>({...f,templateServiceId:e.target.value}))}
                  className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-1.5 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e]">
                  <option value="">Select a service to use as template…</option>
                  {services.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[#666] block mb-1">Number of services</label>
                  <input type="number" min={1} max={52} value={recurForm.count}
                    onChange={e=>setRecurForm(f=>({...f,count:Number(e.target.value)}))}
                    className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-1.5 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e]"/>
                </div>
                <div>
                  <label className="text-xs text-[#666] block mb-1">Interval (days)</label>
                  <input type="number" min={1} max={365} value={recurForm.intervalDays}
                    onChange={e=>setRecurForm(f=>({...f,intervalDays:Number(e.target.value)}))}
                    className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-1.5 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e]"/>
                </div>
                <div>
                  <label className="text-xs text-[#666] block mb-1">Start date</label>
                  <input type="date" value={recurForm.startDate}
                    onChange={e=>setRecurForm(f=>({...f,startDate:e.target.value}))}
                    className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-1.5 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e]"/>
                </div>
              </div>
              <button onClick={generateRecurring} disabled={recurLoading||!recurForm.templateServiceId}
                className="flex items-center justify-center gap-2 py-2 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-sm font-medium hover:bg-[#d8b97e] transition-colors disabled:opacity-50">
                {recurLoading?<Loader2 size={13} className="animate-spin"/>:<Calendar size={13}/>}
                {recurLoading?'Generating…':`Generate ${recurForm.count} Services`}
              </button>
            </div>
          </div>
          {recurResult && (
            <div className={`glass p-4 ${recurResult.error?'border-red-800':''}`}>
              {recurResult.error ? (
                <div className="text-sm text-red-400">{recurResult.error}</div>
              ) : (
                <>
                  <div className="text-sm text-green-400 mb-2">✓ Created {recurResult.created} services</div>
                  <div className="flex flex-col gap-1.5">
                    {recurResult.services?.map((s:any)=>(
                      <div key={s.id} className="text-xs text-[#888]">
                        {s.title}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── AI SERVICE BUILDER ── */}
      {tab==='build-service' && (
        <div>
          <div className="glass p-4 mb-4">
            <h2 className="text-sm font-medium text-[#e8d8b8] mb-1 flex items-center gap-2">
              <Sparkles size={13} className="text-[#c8a96e]"/>AI Service Builder
            </h2>
            <p className="text-xs text-[#555] mb-4">Describe the service you want and AI will build the entire order of service.</p>
            <textarea value={buildPrompt} onChange={e=>setBuildPrompt(e.target.value)} rows={4}
              placeholder="e.g. Sunday morning Christmas service focused on Luke 2, uplifting worship, family-friendly, about 90 minutes"
              className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-2 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e] placeholder-[#444] resize-none mb-3"/>
            <button onClick={buildService} disabled={buildLoading||!buildPrompt.trim()}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-sm font-medium hover:bg-[#d8b97e] transition-colors disabled:opacity-50">
              {buildLoading?<Loader2 size={13} className="animate-spin"/>:<Sparkles size={13}/>}
              {buildLoading?'Building service…':'Build Service with AI'}
            </button>
          </div>

          {buildResult && (
            <div className={`glass p-4 ${buildResult.error?'border-red-800':''}`}>
              {buildResult.error ? (
                <div className="text-sm text-red-400">{buildResult.error}</div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium text-[#e8d8b8]">{buildResult.title}</div>
                      <div className="text-xs text-[#555]">{buildResult.items?.length} items</div>
                    </div>
                    <button onClick={saveBuildResult} disabled={buildSaving}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-xs font-medium hover:bg-[#d8b97e] transition-colors">
                      {buildSaving?<Loader2 size={11} className="animate-spin"/>:<Save size={11}/>}
                      {buildSaving?'Saving…':'Save Service'}
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {buildResult.items?.map((item:any,i:number)=>(
                      <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#1a1c24] last:border-0">
                        <div className="w-1 h-6 rounded-full bg-[#c8a96e] shrink-0"/>
                        <div className="flex-1">
                          <div className="text-xs text-[#e8d8b8]">{item.label}</div>
                          <div className="text-[10px] text-[#444] capitalize">{item.type.replace('_',' ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
