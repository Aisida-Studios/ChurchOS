'use client'
import { useState, useRef } from 'react'
import { Upload, Loader2, FileText, Check, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ExtractedSlide {
  index: number
  title: string
  body: string[]
  notes: string
}

async function extractPptxText(file: File): Promise<ExtractedSlide[]> {
  // Read .pptx as ArrayBuffer (it's a ZIP file)
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)

  // Find all slide XML files by scanning for the pattern
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes)

  // Extract text between XML tags - simple but effective for most PPTX
  const slides: ExtractedSlide[] = []
  const slideMatches = text.matchAll(/<p:sp[\s\S]*?<\/p:sp>/g)

  let currentSlide: ExtractedSlide = { index: 0, title: '', body: [], notes: '' }
  let slideNum = 0

  // Better approach: find slide boundaries using ppt/slides/slide*.xml pattern
  const slidePattern = /ppt\/slides\/slide(\d+)\.xml/g
  const slideXmlBlocks: string[] = []

  // Extract individual slide XML blocks
  let pos = 0
  const slideStarts: number[] = []
  for (let i = 0; i < bytes.length - 4; i++) {
    // Look for "ppt/slides/slide" in the zip central directory
    if (bytes[i] === 0x70 && bytes[i+1] === 0x70 && bytes[i+2] === 0x74) {
      const chunk = text.slice(i, i + 30)
      if (chunk.includes('slides/slide') && chunk.match(/slide\d+/)) {
        slideStarts.push(i)
      }
    }
  }

  // Extract text runs from the full text
  const textRuns = [...text.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => m[1])
  const phTypes = [...text.matchAll(/type="([^"]+)"/g)].map(m => m[1])

  // Group text into slides by finding <p:sp> blocks
  const spBlocks = [...text.matchAll(/<p:sp[\s\S]{0,5000}?<\/p:sp>/g)]

  let slideIndex = 0
  let currentTexts: string[] = []
  let isTitle = false

  for (const block of spBlocks) {
    const blockText = block[0]
    const isTitle = blockText.includes('type="title"') || blockText.includes('type="ctrTitle"')
    const textContent = [...blockText.matchAll(/<a:t>([^<]+)<\/a:t>/g)].map(m => m[1].trim()).filter(Boolean)

    if (textContent.length === 0) continue

    if (isTitle && slides.length > 0 && currentTexts.length === 0) {
      // New slide starting
    }

    if (isTitle) {
      if (currentTexts.length > 0 || slides.length === 0) {
        if (slides.length > 0) {
          slides[slides.length - 1].body = currentTexts
        }
        slideIndex++
        slides.push({ index: slideIndex, title: textContent.join(' '), body: [], notes: '' })
        currentTexts = []
      } else {
        if (slides.length > 0) slides[slides.length - 1].title = textContent.join(' ')
        else slides.push({ index: 1, title: textContent.join(' '), body: [], notes: '' })
      }
    } else {
      currentTexts.push(...textContent)
    }
  }

  if (slides.length > 0 && currentTexts.length > 0) {
    slides[slides.length - 1].body = currentTexts
  }

  // Fallback: if no slides extracted, chunk all text into slides
  if (slides.length === 0 && textRuns.length > 0) {
    const chunkSize = 8
    for (let i = 0; i < textRuns.length; i += chunkSize) {
      const chunk = textRuns.slice(i, i + chunkSize).filter(Boolean)
      if (chunk.length > 0) {
        slides.push({ index: slides.length + 1, title: chunk[0], body: chunk.slice(1), notes: '' })
      }
    }
  }

  return slides.slice(0, 50) // cap at 50 slides
}

function slidesToDeck(slides: ExtractedSlide[], filename: string) {
  return {
    title: filename.replace(/\.pptx?$/i, ''),
    tags: ['imported', 'pptx'],
    slides: slides.map((s, i) => ({
      id: `s${i + 1}`,
      type: 'text' as const,
      content: s.title || `Slide ${s.index}`,
      subContent: s.body.join(' • ').slice(0, 120),
      background: { type: 'solid', color: '#0d0f14' },
      typography: {
        fontFamily: 'Georgia, serif', fontSize: 56, fontWeight: 700,
        color: '#e8e0d0', lineHeight: 1.3, letterSpacing: 0,
        shadow: '0 2px 8px rgba(0,0,0,0.8)', align: 'center'
      },
      layout: 'center',
      transition: 'fade',
      transitionDuration: 400
    }))
  }
}

export default function ImportPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [slides, setSlides] = useState<ExtractedSlide[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editSlides, setEditSlides] = useState<ExtractedSlide[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (f: File) => {
    setFile(f); setLoading(true); setError('')
    try {
      const extracted = await extractPptxText(f)
      setSlides(extracted)
      setEditSlides(extracted.map(s => ({ ...s })))
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const save = async () => {
    if (!file || editSlides.length === 0) return
    setSaving(true)
    const deck = slidesToDeck(editSlides, file.name)
    await fetch('/api/slides', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deck)
    })
    setSaving(false)
    router.push('/dashboard/slides')
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={18} className="text-[#c8a96e]" />
        <h1 className="text-xl font-serif text-[#e8d8b8]">Import PowerPoint</h1>
      </div>
      <p className="text-sm text-[#555] mb-6">Import a .pptx file and convert it to a ChurchOS slide deck.</p>

      {!file ? (
        <div
          className="border-2 border-dashed border-[#2a2d38] rounded-xl p-12 text-center cursor-pointer hover:border-[#c8a96e]/50 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.name.endsWith('.pptx')) handleFile(f) }}>
          <Upload size={32} className="mx-auto mb-3 text-[#444]" />
          <div className="text-sm text-[#666]">Drop a .pptx file here or click to browse</div>
          <div className="text-xs text-[#444] mt-1">PowerPoint 2007+ (.pptx)</div>
          <input ref={fileRef} type="file" accept=".pptx" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-[#555]">
          <Loader2 size={18} className="animate-spin" />
          <span>Extracting slides from {file.name}…</span>
        </div>
      ) : error ? (
        <div className="glass p-4 border-red-800">
          <div className="text-sm text-red-400 mb-2">{error}</div>
          <button onClick={() => { setFile(null); setError('') }} className="text-xs text-[#555] hover:text-[#888]">Try another file</button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-[#e8d8b8]">{file.name}</div>
              <div className="text-xs text-[#555]">{editSlides.length} slides extracted</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setFile(null); setSlides([]); setEditSlides([]) }}
                className="text-xs px-3 py-1.5 border border-[#2a2d38] text-[#666] rounded-lg hover:text-[#888] transition-colors">
                Start over
              </button>
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#c8a96e] text-[#0d0f14] rounded-lg hover:bg-[#d8b97e] transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                {saving ? 'Importing…' : 'Import as Slide Deck'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {editSlides.map((slide, i) => (
              <div key={i} className="glass p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-[#c8a96e] w-6 shrink-0">{slide.index}</span>
                  <input value={slide.title}
                    onChange={e => setEditSlides(s => s.map((sl, j) => j === i ? { ...sl, title: e.target.value } : sl))}
                    className="flex-1 bg-transparent text-sm text-[#e8d8b8] outline-none border-b border-transparent focus:border-[#c8a96e] px-1" />
                  <button onClick={() => setEditSlides(s => s.filter((_, j) => j !== i))}
                    className="text-[#444] hover:text-red-400 transition-colors"><X size={12} /></button>
                </div>
                {slide.body.length > 0 && (
                  <div className="pl-8 text-xs text-[#666] leading-relaxed">{slide.body.join(' • ')}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
