'use client'
import { useState } from 'react'
import { Sparkles, Loader2, Plus, Save, Wand2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const SLIDE_TYPES = [
  { id: 'announcement', label: 'Announcement' },
  { id: 'sermon-title', label: 'Sermon Title' },
  { id: 'quote', label: 'Quote / Key Point' },
  { id: 'welcome', label: 'Welcome Screen' },
  { id: 'event', label: 'Church Event' },
]

const EXAMPLES = [
  'Sunday morning welcome screen with warm greeting',
  'Announcement: Youth group meets Friday 7pm in the hall',
  'Sermon title: Walking in the Light — John 8:12',
  'Christmas Eve candlelight service invite',
  'Key point: God is faithful even when we are not',
]

export default function AISlideGeneratorPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [slideType, setSlideType] = useState('announcement')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const generate = async () => {
    if (!prompt.trim()) return
    setLoading(true); setResult(null); setError('')
    try {
      const r = await fetch('/api/ai/generate-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: slideType })
      })
      const data = await r.json()
      if (!r.ok || data.error) throw new Error(data.error || 'Failed')
      setResult(data.slide)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const saveAsDeck = async () => {
    if (!result) return
    setSaving(true)
    const deck = {
      title: result.content || 'AI Generated Slide',
      tags: ['ai-generated'],
      slides: [{ ...result, id: 's1' }]
    }
    const r = await fetch('/api/slides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deck)
    })
    setSaving(false)
    router.push('/dashboard/slides')
  }

  // Render a mini preview of the slide
  const SlidePreview = ({ slide }: { slide: any }) => {
    const bg = slide.background
    let bgStyle: React.CSSProperties = {}
    if (bg?.type === 'gradient' && bg.gradient) {
      bgStyle.background = `linear-gradient(${bg.gradient.angle}deg, ${bg.gradient.from}, ${bg.gradient.to})`
    } else if (bg?.type === 'solid') {
      bgStyle.backgroundColor = bg.color
    } else {
      bgStyle.backgroundColor = '#0d0f14'
    }
    return (
      <div className="w-full rounded-lg overflow-hidden border border-[#2a2d38]" style={{ aspectRatio: '16/9' }}>
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center" style={bgStyle}>
          <div style={{
            fontFamily: slide.typography?.fontFamily || 'Georgia, serif',
            fontSize: `${Math.min((slide.typography?.fontSize || 64) * 0.5, 48)}px`,
            fontWeight: slide.typography?.fontWeight || 700,
            color: slide.typography?.color || '#ffffff',
            lineHeight: slide.typography?.lineHeight || 1.2,
            textShadow: slide.typography?.shadow,
          }}>
            {slide.content}
          </div>
          {slide.subContent && (
            <div style={{
              fontFamily: slide.typography?.fontFamily || 'Georgia, serif',
              fontSize: `${Math.min((slide.typography?.fontSize || 64) * 0.3, 24)}px`,
              color: slide.typography?.color || '#ffffff',
              opacity: 0.7,
              marginTop: '0.5em',
            }}>
              {slide.subContent}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-2">
        <Wand2 size={18} className="text-[#c8a96e]" />
        <h1 className="text-xl font-serif text-[#e8d8b8]">AI Slide Generator</h1>
      </div>
      <p className="text-sm text-[#555] mb-6">Describe what you need and AI will design a presentation slide.</p>

      {/* Form */}
      <div className="glass p-4 mb-4">
        <div className="mb-3">
          <label className="text-xs text-[#666] uppercase tracking-widest block mb-1">Slide Type</label>
          <div className="flex flex-wrap gap-2">
            {SLIDE_TYPES.map(t => (
              <button key={t.id} onClick={() => setSlideType(t.id)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${slideType === t.id ? 'border-[#c8a96e] bg-[#c8a96e]/10 text-[#c8a96e]' : 'border-[#2a2d38] text-[#555] hover:border-[#3a3d48] hover:text-[#888]'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="text-xs text-[#666] uppercase tracking-widest block mb-1">Describe your slide</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && e.metaKey && generate()}
            rows={3} placeholder="e.g. Sunday morning welcome with a warm, inviting message for first-time visitors"
            className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-2 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e] placeholder-[#444] resize-none" />
        </div>

        <button onClick={generate} disabled={loading || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 py-2 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-sm font-medium hover:bg-[#d8b97e] transition-colors disabled:opacity-50">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {loading ? 'Generating…' : 'Generate Slide'}
        </button>
      </div>

      {/* Examples */}
      {!result && !loading && (
        <div className="mb-4">
          <div className="text-xs text-[#444] mb-2">Examples:</div>
          <div className="flex flex-col gap-1.5">
            {EXAMPLES.map(ex => (
              <button key={ex} onClick={() => setPrompt(ex)}
                className="text-left text-xs text-[#555] hover:text-[#888] px-3 py-2 rounded border border-[#1a1c24] hover:border-[#2a2d38] transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass p-3 border-red-800 mb-4">
          <div className="text-sm text-red-400">{error}</div>
          {error.includes('ANTHROPIC_API_KEY') && (
            <div className="text-xs text-[#555] mt-2">
              Add <code className="text-[#c8a96e] bg-[#0d0f14] px-1 rounded">ANTHROPIC_API_KEY=your_key_here</code> to <code className="text-[#c8a96e] bg-[#0d0f14] px-1 rounded">apps/web/.env.local</code> and restart the server.
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="glass p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-[#e8d8b8]">Generated Slide</div>
            <div className="flex gap-2">
              <button onClick={generate}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#2a2d38] text-[#666] rounded-lg hover:border-[#3a3d48] hover:text-[#888] transition-colors">
                <Sparkles size={11} /> Regenerate
              </button>
              <button onClick={saveAsDeck} disabled={saving}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#c8a96e] text-[#0d0f14] rounded-lg hover:bg-[#d8b97e] transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                {saving ? 'Saving…' : 'Save to Slides'}
              </button>
            </div>
          </div>
          <SlidePreview slide={result} />
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="text-[#555]">Headline: <span className="text-[#888]">{result.content}</span></div>
            <div className="text-[#555]">Subtitle: <span className="text-[#888]">{result.subContent || '—'}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
