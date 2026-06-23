'use client'
import { useState, useRef, useEffect } from 'react'
import { useLiveStore, selectAISuggestions } from '@/lib/state/live-store'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle, XCircle, BookOpen, Mic, MicOff, Loader2,
  FileText, HelpCircle, Quote, List, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { ACTIVE_SESSION_KEY } from '@/lib/state/live-store'

type SermonTab = 'scripture' | 'assistant' | 'planner'
type AssistAction = 'key-points' | 'discussion-questions' | 'summary' | 'quotes' | 'outline'

const ASSIST_ACTIONS: { id: AssistAction; label: string; icon: any }[] = [
  { id: 'key-points', label: 'Key Points', icon: List },
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'quotes', label: 'Notable Quotes', icon: Quote },
  { id: 'discussion-questions', label: 'Discussion Questions', icon: HelpCircle },
  { id: 'outline', label: 'Sermon Outline', icon: List },
]

export function AIAssistPanel() {
  const dispatch = useLiveStore(s => s.dispatch)
  const suggestions = useLiveStore(selectAISuggestions)
  const transcript = useLiveStore(s => s.state?.transcriptBuffer ?? '')
  const [tab, setTab] = useState<SermonTab>('scripture')
  const [listening, setListening] = useState(false)
  const [manualTranscript, setManualTranscript] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [detectedRefs, setDetectedRefs] = useState<any[]>([])
  const [assistResult, setAssistResult] = useState<any>(null)
  const [assistLoading, setAssistLoading] = useState(false)
  const [plannerForm, setPlannerForm] = useState({ theme:'', scriptureText:'', mood:'', occasion:'' })
  const [planResult, setPlanResult] = useState<any>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const recognitionRef = useRef<any>(null)
  const activeSession = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_SESSION_KEY) : null

  const pending = suggestions.filter(s => !s.approved)

  // Web Speech API
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Speech recognition not supported in this browser'); return }
    const rec = new SR()
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-GB'
    rec.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join(' ')
      setManualTranscript(text)
    }
    rec.start(); recognitionRef.current = rec; setListening(true)
  }
  const stopListening = () => {
    recognitionRef.current?.stop(); setListening(false)
  }
  useEffect(() => () => recognitionRef.current?.stop(), [])

  const detectScripture = async () => {
    const text = manualTranscript || transcript
    if (!text.trim()) return
    setDetecting(true)
    try {
      const r = await fetch('/api/ai/detect-scripture', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ transcript: text })
      })
      const refs = await r.json()
      setDetectedRefs(Array.isArray(refs) ? refs : [])
    } catch {}
    setDetecting(false)
  }

  const sendRefToOutput = async (ref: any) => {
    const session = localStorage.getItem(ACTIVE_SESSION_KEY)
    if (!session) return
    const verseRes = await fetch(`/api/bible?ref=${encodeURIComponent(ref.reference)}&t=NKJV`)
    const verseData = await verseRes.json()
    const text = verseData.verses?.map((v:any)=>v.text).join(' ') || ref.context
    await fetch('/api/session/push', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ sessionId: session, action: {
        type:'SEND_TO_OUTPUT', payload:{ content:{
          type:'scripture', reference:ref.reference, verseText:text, translation:'NKJV',
          background:{type:'solid',color:'#0d0f14'}, transition:'fade', transitionDuration:500, timestamp:Date.now()
        }}
      }})
    })
  }

  const runAssist = async (action: AssistAction) => {
    const text = manualTranscript || transcript
    if (!text.trim()) { alert('Paste or record a sermon transcript first'); return }
    setAssistLoading(true); setAssistResult(null)
    try {
      const r = await fetch('/api/ai/sermon', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ transcript: text, action })
      })
      setAssistResult({ action, data: await r.json() })
    } catch (e: any) { setAssistResult({ action, error: e.message }) }
    setAssistLoading(false)
  }

  const runPlan = async () => {
    setPlanLoading(true); setPlanResult(null)
    try {
      const r = await fetch('/api/ai/worship-plan', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(plannerForm)
      })
      setPlanResult(await r.json())
    } catch (e: any) { setPlanResult({ error: (e as any).message }) }
    setPlanLoading(false)
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-[#1a1c24] shrink-0">
        {([{id:'scripture',label:'Scripture'},{id:'assistant',label:'Assist'},{id:'planner',label:'Planner'}] as const).map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`flex-1 py-2 text-[10px] uppercase tracking-widest transition-colors border-b-2 ${tab===t.id?'border-purple-500 text-purple-400':'border-transparent text-[#555] hover:text-[#888]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">

        {/* ── SCRIPTURE DETECTION ── */}
        {tab==='scripture' && (<>
          {/* Mic + transcript */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="text-[10px] text-[#555] uppercase tracking-widest flex-1">Live Transcript</div>
              <button onClick={listening?stopListening:startListening}
                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-colors ${listening?'bg-red-900/30 text-red-400':'bg-[#1a1c24] text-[#666] hover:text-[#888]'}`}>
                {listening?<><MicOff size={9}/>Stop</>:<><Mic size={9}/>Record</>}
              </button>
            </div>
            <textarea value={manualTranscript||transcript}
              onChange={e=>setManualTranscript(e.target.value)}
              placeholder="Paste sermon text or click Record to use your microphone…"
              rows={5}
              className="w-full bg-[#0a0c10] rounded p-2 text-xs text-[#888] border border-[#1a1c24] outline-none focus:border-[#555] resize-none leading-relaxed placeholder-[#333]"/>
            <button onClick={detectScripture} disabled={detecting}
              className="mt-1.5 w-full flex items-center justify-center gap-1.5 py-1.5 bg-purple-900/30 text-purple-400 rounded text-xs hover:bg-purple-900/40 transition-colors disabled:opacity-50">
              {detecting?<Loader2 size={11} className="animate-spin"/>:<Sparkles size={11}/>}
              {detecting?'Detecting…':'Detect Scripture References'}
            </button>
          </div>

          {/* Detected refs */}
          {detectedRefs.length > 0 && (
            <div>
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1.5">{detectedRefs.length} References Found</div>
              {detectedRefs.map((ref,i)=>(
                <div key={i} className="mb-2 p-2.5 rounded border border-purple-900/40 bg-purple-900/10">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={10} className="text-purple-400"/>
                      <span className="text-xs font-medium text-purple-300">{ref.reference}</span>
                    </div>
                    <span className="text-[10px] text-[#555]">{Math.round(ref.confidence*100)}%</span>
                  </div>
                  {ref.context && <p className="text-[10px] text-[#666] mb-1.5 italic line-clamp-2">"{ref.context}"</p>}
                  <button onClick={()=>sendRefToOutput(ref)}
                    className="w-full text-[10px] py-1 bg-purple-900/40 text-purple-300 rounded hover:bg-purple-900/60 transition-colors">
                    Send to Screen
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Manual suggestion queue from live store */}
          {pending.length > 0 && (
            <div>
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1.5 flex items-center gap-1">
                Queued<Badge variant="ai">{pending.length}</Badge>
              </div>
              {pending.map(s=>(
                <div key={s.id} className="mb-2 p-2.5 rounded border border-purple-900/40 bg-purple-900/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-purple-300">{s.reference??s.type}</span>
                    <span className="text-[10px] text-[#555]">{Math.round(s.confidence*100)}%</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="primary" size="sm" className="flex-1 text-[10px]"
                      onClick={()=>dispatch({type:'APPROVE_AI_SUGGESTION',payload:{suggestionId:s.id}})}>
                      <CheckCircle size={10}/>Send
                    </Button>
                    <Button variant="ghost" size="sm"
                      onClick={()=>dispatch({type:'DISMISS_AI_SUGGESTION',payload:{suggestionId:s.id}})}>
                      <XCircle size={10}/>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-[10px] text-[#333] border-t border-[#1a1c24] pt-2">
            AI suggestions never auto-send. You always approve first.
          </div>
        </>)}

        {/* ── SERMON ASSISTANT ── */}
        {tab==='assistant' && (<>
          <div>
            <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1.5">Sermon Text</div>
            <textarea value={manualTranscript||transcript}
              onChange={e=>setManualTranscript(e.target.value)}
              placeholder="Paste or record sermon transcript…" rows={4}
              className="w-full bg-[#0a0c10] rounded p-2 text-xs text-[#888] border border-[#1a1c24] outline-none focus:border-[#555] resize-none leading-relaxed placeholder-[#333]"/>
          </div>
          <div className="flex flex-col gap-1.5">
            {ASSIST_ACTIONS.map(({id,label,icon:Icon})=>(
              <button key={id} onClick={()=>runAssist(id)} disabled={assistLoading}
                className="flex items-center gap-2 px-3 py-2 bg-[#1a1c24] border border-[#2a2d38] rounded text-xs text-[#888] hover:border-[#3a3d48] hover:text-[#e8d8b8] transition-colors disabled:opacity-50">
                <Icon size={11} className="text-purple-400 shrink-0"/>
                {label}
                {assistLoading&&<Loader2 size={10} className="animate-spin ml-auto"/>}
              </button>
            ))}
          </div>

          {assistResult && (
            <div className="glass p-3">
              {assistResult.error ? (
                <div className="text-xs text-red-400">{assistResult.error}</div>
              ) : (
                <AssistResultView result={assistResult}/>
              )}
            </div>
          )}
        </>)}

        {/* ── WORSHIP PLANNER ── */}
        {tab==='planner' && (<>
          <div className="flex flex-col gap-2">
            {[
              {key:'theme',label:'Theme / Topic',ph:'e.g. The Good Shepherd, Grace'},
              {key:'scriptureText',label:'Key Scripture',ph:'e.g. John 10:1-18'},
              {key:'mood',label:'Mood',ph:'e.g. Celebratory, Reflective, Reverent'},
              {key:'occasion',label:'Occasion',ph:'e.g. Sunday morning, Christmas'},
            ].map(({key,label,ph})=>(
              <div key={key}>
                <label className="text-[10px] text-[#555] uppercase tracking-widest block mb-1">{label}</label>
                <input value={(plannerForm as any)[key]} onChange={e=>setPlannerForm(f=>({...f,[key]:e.target.value}))}
                  placeholder={ph}
                  className="w-full bg-[#0a0c10] border border-[#1a1c24] rounded px-2 py-1.5 text-xs text-[#e8d8b8] outline-none focus:border-[#555] placeholder-[#333]"/>
              </div>
            ))}
            <button onClick={runPlan} disabled={planLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-purple-900/30 text-purple-400 rounded text-xs hover:bg-purple-900/40 transition-colors disabled:opacity-50 mt-1">
              {planLoading?<Loader2 size={11} className="animate-spin"/>:<Sparkles size={11}/>}
              {planLoading?'Planning…':'Suggest Worship Set'}
            </button>
          </div>

          {planResult && (
            <div className="glass p-3">
              {planResult.error ? (
                <div className="text-xs text-red-400">{planResult.error}</div>
              ) : planResult.set ? (
                <>
                  <div className="text-[10px] text-[#555] uppercase tracking-widest mb-2">Suggested Set</div>
                  {planResult.set.map((item:any,i:number)=>(
                    <div key={i} className="mb-2 pb-2 border-b border-[#1a1c24] last:border-0">
                      <div className="text-xs text-[#e8d8b8] font-medium">{item.title}</div>
                      <div className="text-[10px] text-purple-400 capitalize mb-0.5">{item.position}</div>
                      <div className="text-[10px] text-[#555]">{item.reason}</div>
                    </div>
                  ))}
                  {planResult.notes && (
                    <div className="text-[10px] text-[#555] border-t border-[#1a1c24] pt-2 mt-1">{planResult.notes}</div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </>)}

      </div>
    </div>
  )
}

function AssistResultView({ result }: { result: any }) {
  const { action, data } = result
  if (!data) return null

  if (action==='key-points' && data.points) return (
    <div>
      <div className="text-[10px] text-[#555] uppercase tracking-widest mb-2">Key Points</div>
      {data.points.map((p:any,i:number)=>(
        <div key={i} className="mb-2">
          <div className="text-xs text-[#e8d8b8] font-medium">{i+1}. {p.point}</div>
          {p.support&&<div className="text-[10px] text-[#555] mt-0.5">{p.support}</div>}
        </div>
      ))}
    </div>
  )

  if (action==='summary' && data.summary) return (
    <div>
      <div className="text-[10px] text-purple-400 uppercase tracking-widest mb-1">{data.title}</div>
      <div className="text-xs text-[#888] leading-relaxed">{data.summary}</div>
      {data.theme&&<div className="text-[10px] text-[#555] mt-2">Theme: {data.theme}</div>}
    </div>
  )

  if (action==='quotes' && data.quotes) return (
    <div>
      <div className="text-[10px] text-[#555] uppercase tracking-widest mb-2">Notable Quotes</div>
      {data.quotes.map((q:any,i:number)=>(
        <div key={i} className="mb-2 pl-2 border-l-2 border-purple-700">
          <div className="text-xs text-[#e8d8b8] italic">"{q.quote}"</div>
          {q.context&&<div className="text-[10px] text-[#444] mt-0.5">{q.context}</div>}
        </div>
      ))}
    </div>
  )

  if (action==='discussion-questions' && data.questions) return (
    <div>
      <div className="text-[10px] text-[#555] uppercase tracking-widest mb-2">Discussion Questions</div>
      {data.questions.map((q:any,i:number)=>(
        <div key={i} className="mb-2">
          <div className="text-xs text-[#e8d8b8]">{i+1}. {q.question}</div>
          <div className="text-[10px] text-purple-400 capitalize">{q.type}</div>
        </div>
      ))}
    </div>
  )

  if (action==='outline' && data.points) return (
    <div>
      <div className="text-xs text-[#c8a96e] font-medium mb-1">{data.title}</div>
      <div className="text-[10px] text-[#555] mb-2">{data.mainText}</div>
      {data.points.map((p:any,i:number)=>(
        <div key={i} className="mb-2">
          <div className="text-xs text-[#e8d8b8]">{p.label}</div>
          <div className="text-[10px] text-[#666]">{p.content}</div>
          {p.scriptures?.length>0&&<div className="text-[10px] text-purple-400">{p.scriptures.join(', ')}</div>}
        </div>
      ))}
    </div>
  )

  return <pre className="text-[10px] text-[#666] overflow-auto">{JSON.stringify(data, null, 2)}</pre>
}
