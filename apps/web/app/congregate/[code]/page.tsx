'use client'
import { useState, useEffect } from 'react'
import { Heart, BarChart2, BookOpen, Loader2, CheckCircle } from 'lucide-react'

export default function CongregatePage({ params }: { params: { code: string } }) {
  const [session, setSession] = useState<any>(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'scripture'|'prayer'|'poll'>('scripture')
  const [prayer, setPrayer] = useState({ name:'', request:'', isPublic:false })
  const [submitted, setSubmitted] = useState(false)
  const [polls, setPolls] = useState<any[]>([])
  const [voted, setVoted] = useState<Record<string,string>>({})
  const [output, setOutput] = useState<any>(null)
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('congregate_uid') || (() => {
    const id = Math.random().toString(36).slice(2); localStorage.setItem('congregate_uid',id); return id
  })()) : ''

  useEffect(() => {
    fetch(`/api/congregation/session?code=${params.code}`)
      .then(r=>r.json()).then(s=>{
        if (s.error) setError('Session not found. Check your code.')
        else {
          setSession(s)
          fetch(`/api/congregation/poll?sessionId=${s.id}`).then(r=>r.json()).then(setPolls)
        }
      })
  }, [params.code])

  const submitPrayer = async () => {
    if (!prayer.request.trim() || !session) return
    await fetch('/api/congregation/prayer', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ sessionId:session.id, ...prayer })
    })
    setSubmitted(true)
  }

  const vote = async (pollId: string, option: string) => {
    await fetch('/api/congregation/poll', {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ pollId, option, userId })
    })
    setVoted(v=>({...v,[pollId]:option}))
    fetch(`/api/congregation/poll?sessionId=${session.id}`).then(r=>r.json()).then(setPolls)
  }

  if (error) return (
    <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-red-400 text-sm mb-2">{error}</div>
        <div className="text-[#444] text-xs">Ask your service leader for the join code</div>
      </div>
    </div>
  )

  if (!session) return (
    <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-[#c8a96e]"/>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white flex flex-col max-w-lg mx-auto">
      <div className="px-4 py-3 border-b border-[#1a1c24] flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
        <span className="text-sm text-[#e8d8b8]">Live Service</span>
        <span className="text-xs text-[#444] ml-auto font-mono">{params.code}</span>
      </div>

      <div className="flex border-b border-[#1a1c24]">
        {([{id:'scripture',icon:BookOpen,label:'Scripture'},{id:'prayer',icon:Heart,label:'Prayer'},{id:'poll',icon:BarChart2,label:'Polls'}] as const).map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 text-[10px] uppercase tracking-widest transition-colors border-b-2 ${tab===t.id?'border-[#c8a96e] text-[#c8a96e]':'border-transparent text-[#555]'}`}>
            <t.icon size={16}/>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {tab==='scripture' && (
          <div className="text-center py-12 text-[#444]">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30"/>
            <div className="text-sm">Scripture will appear here when your leader sends a verse to screen</div>
          </div>
        )}

        {tab==='prayer' && (
          submitted ? (
            <div className="text-center py-12">
              <CheckCircle size={32} className="mx-auto mb-3 text-green-400"/>
              <div className="text-sm text-[#e8d8b8] mb-1">Prayer request submitted</div>
              <div className="text-xs text-[#555]">Your leaders will pray for you</div>
              <button onClick={()=>setSubmitted(false)} className="mt-4 text-xs text-[#666] hover:text-[#888]">Submit another</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-sm text-[#e8d8b8] mb-2">Share a prayer request</div>
              <input value={prayer.name} onChange={e=>setPrayer(p=>({...p,name:e.target.value}))}
                placeholder="Your name (optional)"
                className="w-full bg-[#1a1c24] border border-[#2a2d38] rounded-xl px-4 py-3 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e] placeholder-[#444]"/>
              <textarea value={prayer.request} onChange={e=>setPrayer(p=>({...p,request:e.target.value}))}
                placeholder="Your prayer request…" rows={5}
                className="w-full bg-[#1a1c24] border border-[#2a2d38] rounded-xl px-4 py-3 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e] resize-none placeholder-[#444]"/>
              <label className="flex items-center gap-2 text-xs text-[#666]">
                <input type="checkbox" checked={prayer.isPublic} onChange={e=>setPrayer(p=>({...p,isPublic:e.target.checked}))}
                  className="rounded"/>
                Share with congregation
              </label>
              <button onClick={submitPrayer} disabled={!prayer.request.trim()}
                className="w-full py-3 bg-[#c8a96e] text-[#0d0f14] rounded-xl font-medium text-sm hover:bg-[#d8b97e] transition-colors disabled:opacity-50">
                Submit Prayer Request
              </button>
            </div>
          )
        )}

        {tab==='poll' && (
          polls.length===0 ? (
            <div className="text-center py-12 text-[#444]">
              <BarChart2 size={32} className="mx-auto mb-3 opacity-30"/>
              <div className="text-sm">No polls yet — check back during the service</div>
            </div>
          ) : (
            polls.map(poll=>{
              const myVote = voted[poll.id]
              const total = Object.keys(poll.responses||{}).length
              return (
                <div key={poll.id} className="mb-4 bg-[#1a1c24] rounded-xl p-4">
                  <div className="text-sm text-[#e8d8b8] font-medium mb-3">{poll.question}</div>
                  {poll.options?.map((opt:string)=>{
                    const count = Object.values(poll.responses||{}).filter(v=>v===opt).length
                    const pct = total ? Math.round(count/total*100) : 0
                    return myVote ? (
                      <div key={opt} className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className={myVote===opt?'text-[#c8a96e]':'text-[#888]'}>{opt}</span>
                          <span className="text-[#555]">{pct}%</span>
                        </div>
                        <div className="h-2 bg-[#0d0f14] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:myVote===opt?'#c8a96e':'#2a2d38'}}/>
                        </div>
                      </div>
                    ) : (
                      <button key={opt} onClick={()=>vote(poll.id,opt)}
                        className="w-full text-left mb-2 px-4 py-2.5 rounded-lg border border-[#2a2d38] text-sm text-[#888] hover:border-[#c8a96e] hover:text-[#e8d8b8] transition-colors">
                        {opt}
                      </button>
                    )
                  })}
                  {myVote && <div className="text-[10px] text-[#444] mt-1">{total} vote{total!==1?'s':''} · You voted: {myVote}</div>}
                </div>
              )
            })
          )
        )}
      </div>
    </div>
  )
}
