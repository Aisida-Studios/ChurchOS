'use client'
import { useState, useEffect } from 'react'
import { Users, QrCode, Heart, BarChart2, MessageSquare, Plus, Trash2, Loader2 } from 'lucide-react'

export default function CongregationPage() {
  const [services, setServices] = useState<any[]>([])
  const [sessionCode, setSessionCode] = useState<string>('')
  const [sessionId, setSessionId] = useState<string>('')
  const [selectedService, setSelectedService] = useState('')
  const [prayers, setPrayers] = useState<any[]>([])
  const [polls, setPolls] = useState<any[]>([])
  const [tab, setTab] = useState<'session'|'prayers'|'polls'>('session')
  const [newPoll, setNewPoll] = useState({ question:'', options:['',''] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/services').then(r=>r.json()).then(setServices)
  }, [])

  useEffect(() => {
    if (!sessionId) return
    fetch(`/api/congregation/prayer?sessionId=${sessionId}`).then(r=>r.json()).then(setPrayers)
    fetch(`/api/congregation/poll?sessionId=${sessionId}`).then(r=>r.json()).then(setPolls)
  }, [sessionId])

  const createSession = async () => {
    if (!selectedService) return
    setLoading(true)
    const r = await fetch('/api/congregation/session', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ serviceId: selectedService })
    })
    const data = await r.json()
    setSessionCode(data.code); setSessionId(data.id)
    setLoading(false)
  }

  const addPollOption = () => setNewPoll(p => ({ ...p, options: [...p.options, ''] }))
  const updateOption = (i: number, val: string) => setNewPoll(p => ({ ...p, options: p.options.map((o,j) => j===i?val:o) }))

  const createPoll = async () => {
    if (!newPoll.question || !sessionId) return
    await fetch('/api/congregation/poll', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ sessionId, question: newPoll.question, options: newPoll.options.filter(Boolean) })
    })
    setNewPoll({ question:'', options:['',''] })
    fetch(`/api/congregation/poll?sessionId=${sessionId}`).then(r=>r.json()).then(setPolls)
  }

  const congregateUrl = sessionCode
    ? `${typeof window!=='undefined'?window.location.origin:''}/congregate/${sessionCode}`
    : ''

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Users size={18} className="text-[#c8a96e]"/>
        <h1 className="text-xl font-serif text-[#e8d8b8]">Congregation</h1>
      </div>

      <div className="flex gap-1 mb-6 border-b border-[#2a2d38]">
        {([{id:'session',label:'Session'},{id:'prayers',label:'Prayer Requests'},{id:'polls',label:'Polls'}] as const).map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${tab===t.id?'border-[#c8a96e] text-[#c8a96e]':'border-transparent text-[#666] hover:text-[#888]'}`}>
            {t.label} {t.id==='prayers'&&prayers.length>0&&<span className="ml-1 text-xs bg-[#c8a96e]/20 text-[#c8a96e] px-1.5 py-0.5 rounded-full">{prayers.length}</span>}
          </button>
        ))}
      </div>

      {tab==='session' && (
        <div>
          <div className="glass p-4 mb-4">
            <h2 className="text-sm font-medium text-[#e8d8b8] mb-3">Start Congregation Session</h2>
            <div className="flex gap-3 mb-3">
              <select value={selectedService} onChange={e=>setSelectedService(e.target.value)}
                className="flex-1 bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-2 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e]">
                <option value="">Select a service…</option>
                {services.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
              <button onClick={createSession} disabled={loading||!selectedService}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-sm font-medium hover:bg-[#d8b97e] transition-colors disabled:opacity-50">
                {loading?<Loader2 size={13} className="animate-spin"/>:<QrCode size={13}/>}
                {loading?'Creating…':'Create Session'}
              </button>
            </div>

            {sessionCode && (
              <div className="bg-[#0d0f14] rounded-lg p-4 text-center">
                <div className="text-[10px] text-[#555] uppercase tracking-widest mb-2">Congregation Join Code</div>
                <div className="text-4xl font-mono font-bold text-[#c8a96e] tracking-[0.3em] mb-2">{sessionCode}</div>
                <div className="text-xs text-[#555] mb-3">Members visit: <span className="text-[#888]">{typeof window!=='undefined'?window.location.hostname:''}/congregate</span></div>
                <div className="flex gap-2 justify-center">
                  <button onClick={()=>navigator.clipboard.writeText(congregateUrl)}
                    className="text-xs px-3 py-1.5 border border-[#2a2d38] text-[#666] rounded hover:border-[#3a3d48] hover:text-[#888] transition-colors">
                    Copy Link
                  </button>
                  <a href={congregateUrl} target="_blank" rel="noopener"
                    className="text-xs px-3 py-1.5 bg-[#c8a96e]/10 text-[#c8a96e] border border-[#c8a96e]/30 rounded hover:bg-[#c8a96e]/20 transition-colors">
                    Open Page
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="glass p-4 text-sm text-[#666]">
            <h3 className="text-xs text-[#555] uppercase tracking-widest mb-2">How it works</h3>
            <ul className="flex flex-col gap-1.5 text-xs">
              <li className="flex items-start gap-2"><span className="text-[#c8a96e] shrink-0">1.</span>Create a session for your service</li>
              <li className="flex items-start gap-2"><span className="text-[#c8a96e] shrink-0">2.</span>Display the code on screen — congregation open churchos on their phone</li>
              <li className="flex items-start gap-2"><span className="text-[#c8a96e] shrink-0">3.</span>They can follow scripture, submit prayer requests, and respond to polls</li>
              <li className="flex items-start gap-2"><span className="text-[#c8a96e] shrink-0">4.</span>You see all responses here in real time</li>
            </ul>
          </div>
        </div>
      )}

      {tab==='prayers' && (
        <div>
          {!sessionId ? (
            <div className="text-center py-12 text-[#444] text-sm">Create a congregation session first</div>
          ) : prayers.length===0 ? (
            <div className="text-center py-12 text-[#444] text-sm">No prayer requests yet</div>
          ) : (
            <div className="flex flex-col gap-2">
              {prayers.map(p=>(
                <div key={p.id} className="glass p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart size={11} className="text-[#c8a96e] shrink-0"/>
                    <span className="text-xs text-[#e8d8b8] font-medium">{p.name}</span>
                    <span className="text-[10px] text-[#444] ml-auto">{new Date(p.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span>
                    {p.is_public && <span className="text-[10px] bg-green-900/20 text-green-400 px-1.5 py-0.5 rounded">Public</span>}
                  </div>
                  <p className="text-xs text-[#888] leading-relaxed">{p.request}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab==='polls' && (
        <div>
          {!sessionId ? (
            <div className="text-center py-12 text-[#444] text-sm">Create a congregation session first</div>
          ) : (
            <>
              <div className="glass p-4 mb-4">
                <h3 className="text-sm font-medium text-[#e8d8b8] mb-3">Create Poll</h3>
                <input value={newPoll.question} onChange={e=>setNewPoll(p=>({...p,question:e.target.value}))}
                  placeholder="Poll question…"
                  className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-2 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e] mb-2"/>
                {newPoll.options.map((o,i)=>(
                  <input key={i} value={o} onChange={e=>updateOption(i,e.target.value)}
                    placeholder={`Option ${i+1}`}
                    className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-1.5 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e] mb-1.5"/>
                ))}
                <div className="flex gap-2 mt-2">
                  <button onClick={addPollOption} className="text-xs text-[#555] hover:text-[#888] flex items-center gap-1"><Plus size={10}/>Add option</button>
                  <button onClick={createPoll} className="ml-auto text-xs px-3 py-1.5 bg-[#c8a96e] text-[#0d0f14] rounded hover:bg-[#d8b97e] transition-colors">Create Poll</button>
                </div>
              </div>

              {polls.map(poll=>{
                const total = Object.keys(poll.responses||{}).length
                return (
                  <div key={poll.id} className="glass p-4 mb-3">
                    <div className="text-sm text-[#e8d8b8] mb-3">{poll.question}</div>
                    {poll.options?.map((opt:string)=>{
                      const count = Object.values(poll.responses||{}).filter(v=>v===opt).length
                      return (
                        <div key={opt} className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-[#888]">{opt}</span>
                            <span className="text-[#555]">{count} ({total?Math.round(count/total*100):0}%)</span>
                          </div>
                          <div className="h-1.5 bg-[#1a1c24] rounded-full overflow-hidden">
                            <div className="h-full bg-[#c8a96e] rounded-full transition-all" style={{width:`${total?Math.round(count/total*100):0}%`}}/>
                          </div>
                        </div>
                      )
                    })}
                    <div className="text-[10px] text-[#444] mt-2">{total} response{total!==1?'s':''}</div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
