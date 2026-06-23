'use client'
import { useState, useEffect } from 'react'
import { Search, BookOpen, Loader2, Send, Wifi, WifiOff } from 'lucide-react'
import { ACTIVE_SESSION_KEY } from '@/lib/state/live-store'

type Translation = 'NKJV' | 'KJV' | 'NLT' | 'MSG'
const TRANSLATIONS: Translation[] = ['NKJV', 'KJV', 'NLT', 'MSG']
const QUICK_REFS = ['John 3:16', 'Psalm 23:1-6', 'Romans 8:28', 'Philippians 4:13', 'Isaiah 40:31', 'Jeremiah 29:11']

export function BibleSearch() {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'ref' | 'keyword'>('ref')
  const [translation, setTranslation] = useState<Translation>('NKJV')
  const [results, setResults] = useState<any[]>([])
  const [passage, setPassage] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [pushStatus, setPushStatus] = useState('')

  useEffect(() => {
    const check = () => setActiveSession(localStorage.getItem(ACTIVE_SESSION_KEY))
    check()
    const id = setInterval(check, 2000)
    return () => clearInterval(id)
  }, [])

  const search = async () => {
    if (!query.trim()) return
    setLoading(true); setError(''); setResults([]); setPassage(null)
    try {
      const param = mode === 'ref'
        ? `ref=${encodeURIComponent(query)}&t=${translation}`
        : `q=${encodeURIComponent(query)}&t=${translation}`
      const r = await fetch(`/api/bible?${param}`)
      const data = await r.json()
      if (!r.ok) { setError(data.error || 'Not found'); setLoading(false); return }
      if (mode === 'ref') setPassage(data)
      else setResults(data)
    } catch { setError('Search failed') }
    setLoading(false)
  }

  const pushToOutput = async (reference: string, text: string) => {
    if (!activeSession) {
      setPushStatus('No active session — go live first')
      setTimeout(() => setPushStatus(''), 3000)
      return
    }
    const action = {
      type: 'SEND_TO_OUTPUT',
      payload: {
        content: {
          type: 'scripture', reference, verseText: text, translation,
          background: { type: 'solid', color: '#0d0f14' },
          transition: 'fade', transitionDuration: 500, timestamp: Date.now()
        }
      }
    }
    try {
      const r = await fetch('/api/session/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSession, action })
      })
      const data = await r.json()
      setPushStatus(data.delivered === 0 ? 'Sent — no output screens connected yet' : 'Sent to output ✓')
    } catch (e: any) {
      setPushStatus(`Push failed: ${e.message}`)
    }
    setTimeout(() => setPushStatus(''), 3000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-xs px-1">
        {activeSession ? (
          <><Wifi size={12} className="text-green-400" /><span className="text-green-400">Live session active</span><span className="text-[#444] font-mono ml-1">{activeSession}</span></>
        ) : (
          <><WifiOff size={12} className="text-[#555]" /><span className="text-[#555]">No active session — start a service to send to output</span></>
        )}
      </div>

      {pushStatus && (
        <div className={`text-xs px-3 py-2 rounded-lg border ${pushStatus.includes('failed') || pushStatus.includes('No active') ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-green-500/30 text-green-400 bg-green-500/10'}`}>
          {pushStatus}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex rounded-lg overflow-hidden border border-[#2a2d38]">
          <button onClick={() => setMode('ref')} className={`px-3 py-2 text-xs transition-colors ${mode === 'ref' ? 'bg-[#c8a96e] text-[#0d0f14]' : 'text-[#666] hover:text-[#e8d8b8]'}`}>Reference</button>
          <button onClick={() => setMode('keyword')} className={`px-3 py-2 text-xs transition-colors ${mode === 'keyword' ? 'bg-[#c8a96e] text-[#0d0f14]' : 'text-[#666] hover:text-[#e8d8b8]'}`}>Keyword</button>
        </div>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
          placeholder={mode === 'ref' ? 'e.g. John 3:16 or John 3:16-18' : 'e.g. grace, faith, love'}
          className="flex-1 bg-[#1a1c24] border border-[#2a2d38] rounded-lg px-3 py-2 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e] placeholder-[#444]" />
        <button onClick={search} disabled={loading} className="px-3 py-2 bg-[#c8a96e] text-[#0d0f14] rounded-lg hover:bg-[#d8b97e] transition-colors disabled:opacity-50">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-[#555]">Translation:</span>
        <div className="flex gap-1">
          {TRANSLATIONS.map(t => (
            <button key={t} onClick={() => setTranslation(t)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${translation === t ? 'border-[#c8a96e] text-[#c8a96e] bg-[#c8a96e]/10' : 'border-[#2a2d38] text-[#555] hover:border-[#444] hover:text-[#888]'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="text-sm text-red-400 px-1">{error}</div>}

      {passage && (
        <div className="glass p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-[#c8a96e]">{passage.reference} <span className="text-[#555] font-normal text-xs">{translation}</span></div>
            <button onClick={() => pushToOutput(passage.reference, passage.verses.map((v: any) => v.text).join(' '))}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/80 text-white rounded text-xs hover:bg-red-500 transition-colors">
              <Send size={11} /> Send passage
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {passage.verses.map((v: any) => (
              <div key={v.verse} className="flex gap-3 group">
                <span className="text-xs text-[#555] w-5 shrink-0 pt-0.5">{v.verse}</span>
                <p className="text-sm text-[#e8d8b8] leading-relaxed flex-1">{v.text}</p>
                <button onClick={() => pushToOutput(`${v.book} ${v.chapter}:${v.verse}`, v.text)}
                  className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-red-400 transition-colors shrink-0">
                  <Send size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-[#555]">{results.length} results</div>
          {results.map((v, i) => (
            <div key={i} className="glass p-3 flex gap-3 group">
              <BookOpen size={13} className="text-[#c8a96e] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[#c8a96e] mb-1">{v.reference}</div>
                <p className="text-sm text-[#ccc] leading-relaxed">{v.text}</p>
              </div>
              <button onClick={() => pushToOutput(v.reference, v.text)}
                className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-red-400 transition-colors shrink-0">
                <Send size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!passage && results.length === 0 && !loading && (
        <div className="mt-2">
          <div className="text-xs text-[#555] mb-2">Common passages:</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_REFS.map(ref => (
              <button key={ref} onClick={() => { setQuery(ref); setMode('ref') }}
                className="px-2.5 py-1 text-xs border border-[#2a2d38] rounded text-[#666] hover:border-[#c8a96e] hover:text-[#c8a96e] transition-colors">
                {ref}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
