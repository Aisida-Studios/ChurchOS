'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Command, Loader2, Sparkles, X } from 'lucide-react'
import { ACTIVE_SESSION_KEY } from '@/lib/state/live-store'

export function AICommandBar() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Cmd+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); setOpen(o => !o); setResult('')
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])

  const run = async () => {
    if (!input.trim()) return
    setLoading(true); setResult('')
    const sessionId = localStorage.getItem(ACTIVE_SESSION_KEY) || ''
    try {
      const r = await fetch('/api/ai/command', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: input, sessionId })
      })
      const data = await r.json()
      setResult(data.response || 'Done.')

      // Execute the action
      if (data.action === 'NEXT_SLIDE') window.dispatchEvent(new CustomEvent('churchos:action', { detail: { type: 'NEXT_SLIDE' } }))
      else if (data.action === 'PREV_SLIDE') window.dispatchEvent(new CustomEvent('churchos:action', { detail: { type: 'PREV_SLIDE' } }))
      else if (data.action === 'BLACKOUT') window.dispatchEvent(new CustomEvent('churchos:action', { detail: { type: 'BLACKOUT' } }))
      else if (data.action === 'NAVIGATE' && data.payload?.url) { router.push(data.payload.url); setTimeout(() => setOpen(false), 500) }
    } catch (e: any) { setResult('Error: ' + e.message) }
    setLoading(false)
    setInput('')
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      title="AI Command Bar (Ctrl+K)"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2 bg-[#1a1c24] border border-[#2a2d38] rounded-full text-xs text-[#555] hover:border-[#c8a96e] hover:text-[#c8a96e] transition-colors shadow-lg">
      <Sparkles size={12}/> AI <kbd className="text-[9px] bg-[#0d0f14] px-1.5 py-0.5 rounded border border-[#2a2d38]">⌘K</kbd>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="glass border border-[#3a3d48] rounded-xl shadow-2xl overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2d38]">
            <Sparkles size={14} className="text-[#c8a96e] shrink-0"/>
            <input ref={inputRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && run()}
              placeholder="Ask anything… 'go to songs', 'next slide', 'build a Christmas service'…"
              className="flex-1 bg-transparent text-sm text-[#e8d8b8] outline-none placeholder-[#444]"/>
            {loading
              ? <Loader2 size={14} className="animate-spin text-[#555] shrink-0"/>
              : <button onClick={() => setOpen(false)} className="text-[#444] hover:text-[#666] shrink-0"><X size={14}/></button>
            }
          </div>

          {/* Result */}
          {result && (
            <div className="px-4 py-3 text-sm text-[#888] leading-relaxed">
              <Sparkles size={11} className="inline text-[#c8a96e] mr-1.5 mb-0.5"/>
              {result}
            </div>
          )}

          {/* Suggestions */}
          {!result && !loading && (
            <div className="px-4 py-2 pb-3 flex flex-wrap gap-2">
              {['Next slide','Blank screen','Go to songs','Build a worship set','What songs do we have?'].map(s=>(
                <button key={s} onClick={() => { setInput(s); setTimeout(run, 50) }}
                  className="text-xs px-2.5 py-1 border border-[#2a2d38] rounded-full text-[#555] hover:border-[#c8a96e] hover:text-[#c8a96e] transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
