'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Slide, SlideDeck, SlideType, TransitionType, LayoutType } from '@churchos/shared-types'
import { Plus, Trash2, Save } from 'lucide-react'
import { clsx } from 'clsx'

const DEFAULT_SLIDE = (): Slide => ({
  id: `slide-${Date.now()}`,
  type: 'text',
  content: 'New Slide',
  subContent: '',
  background: { type: 'solid', color: '#1a1c24' },
  typography: {
    fontFamily: 'Georgia, serif',
    fontSize: 52,
    fontWeight: 700,
    color: '#ffffff',
    lineHeight: 1.3,
    letterSpacing: 0,
    shadow: '0 2px 8px rgba(0,0,0,0.8)',
    align: 'center',
  },
  layout: 'center',
  transition: 'fade',
  transitionDuration: 300,
})

interface SlideEditorProps {
  deck: Partial<SlideDeck>
  onChange: (deck: Partial<SlideDeck>) => void
  onSave: () => void
}

export function SlideEditor({ deck, onChange, onSave }: SlideEditorProps) {
  const slides: Slide[] = deck.slides ?? []
  const [selectedId, setSelectedId] = useState<string | null>(slides[0]?.id ?? null)
  const selected = slides.find(s => s.id === selectedId) ?? null

  const setSlides = (next: Slide[]) => onChange({ ...deck, slides: next })

  const addSlide = () => {
    const s = DEFAULT_SLIDE()
    setSlides([...slides, s])
    setSelectedId(s.id)
  }

  const updateSlide = (id: string, updates: Partial<Slide>) => {
    setSlides(slides.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const removeSlide = (id: string) => {
    const remaining = slides.filter(s => s.id !== id)
    setSlides(remaining)
    setSelectedId(remaining[0]?.id ?? null)
  }

  const SLIDE_TYPES: SlideType[] = ['text', 'scripture', 'announcement', 'image', 'video', 'blank']
  const LAYOUTS: LayoutType[] = ['center', 'bottom-third', 'top-third', 'split']
  const TRANSITIONS: TransitionType[] = ['fade', 'cut', 'slide-left', 'slide-right', 'zoom']

  return (
    <div className="flex h-full min-h-0">
      {/* Filmstrip */}
      <div className="w-40 flex flex-col gap-2 overflow-y-auto p-3 border-r border-[#2a2d38] shrink-0">
        {slides.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => setSelectedId(slide.id)}
            className={clsx(
              'relative rounded border text-left p-1 transition-all',
              selectedId === slide.id ? 'border-[#c8a96e]' : 'border-[#2a2d38] hover:border-[#3a3d4a]'
            )}
          >
            <div
              className="w-full rounded overflow-hidden flex items-center justify-center"
              style={{ aspectRatio: '16/9', backgroundColor: slide.background.color ?? '#000' }}
            >
              <span className="text-white text-[8px] text-center p-1 line-clamp-3 leading-tight">
                {slide.content || '—'}
              </span>
            </div>
            <div className="text-[10px] text-[#666] mt-1 px-0.5 flex justify-between">
              <span>{idx + 1}</span><span className="capitalize">{slide.type}</span>
            </div>
          </button>
        ))}
        <button onClick={addSlide}
          className="border border-dashed border-[#2a2d38] rounded py-3 text-[#444] hover:text-[#888] text-xs flex items-center justify-center gap-1 transition-colors">
          <Plus size={12} /> Add
        </button>
      </div>

      {/* Editor */}
      {selected ? (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-[#e8d8b8]">Edit Slide</div>
            <div className="flex gap-2">
              <Button variant="danger" size="sm" onClick={() => removeSlide(selected.id)}>
                <Trash2 size={13} /> Delete
              </Button>
              <Button variant="primary" size="sm" onClick={onSave}>
                <Save size={13} /> Save Deck
              </Button>
            </div>
          </div>

          {/* Type */}
          <div>
            <div className="text-xs text-[#888] uppercase tracking-widest mb-2">Type</div>
            <div className="flex flex-wrap gap-1.5">
              {SLIDE_TYPES.map(t => (
                <button key={t} onClick={() => updateSlide(selected.id, { type: t })}
                  className={clsx('px-2.5 py-1 rounded text-xs capitalize transition-colors',
                    selected.type === t ? 'bg-[#c8a96e]/20 text-[#c8a96e] border border-[#c8a96e]/40'
                      : 'text-[#666] border border-[#2a2d38] hover:border-[#3a3d4a]')}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="text-xs text-[#888] uppercase tracking-widest mb-2">Content</div>
            <textarea value={selected.content}
              onChange={e => updateSlide(selected.id, { content: e.target.value })}
              className="w-full bg-[#0a0c10] border border-[#2a2d38] rounded p-3 text-sm text-[#c8c0b0] resize-none outline-none focus:border-[#c8a96e] leading-relaxed"
              rows={4} placeholder="Main text…" />
            <textarea value={selected.subContent ?? ''}
              onChange={e => updateSlide(selected.id, { subContent: e.target.value })}
              className="w-full mt-2 bg-[#0a0c10] border border-[#2a2d38] rounded p-3 text-sm text-[#888] resize-none outline-none focus:border-[#c8a96e] leading-relaxed"
              rows={2} placeholder="Sub-text / reference…" />
          </div>

          {/* Background */}
          <div>
            <div className="text-xs text-[#888] uppercase tracking-widest mb-2">Background</div>
            <div className="flex gap-3 items-center">
              <label className="text-xs text-[#666]">Colour</label>
              <input type="color" value={selected.background.color ?? '#000000'}
                onChange={e => updateSlide(selected.id, { background: { ...selected.background, type: 'solid', color: e.target.value } })}
                className="w-10 h-8 rounded cursor-pointer border border-[#2a2d38]" />
              <span className="text-xs text-[#555]">{selected.background.color}</span>
            </div>
          </div>

          {/* Typography */}
          <div>
            <div className="text-xs text-[#888] uppercase tracking-widest mb-2">Typography</div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Font Size (px)" type="number" value={selected.typography.fontSize}
                onChange={e => updateSlide(selected.id, { typography: { ...selected.typography, fontSize: Number(e.target.value) } })} />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#666]">Text Colour</label>
                <input type="color" value={selected.typography.color}
                  onChange={e => updateSlide(selected.id, { typography: { ...selected.typography, color: e.target.value } })}
                  className="w-full h-9 rounded cursor-pointer border border-[#2a2d38]" />
              </div>
              <div>
                <label className="text-xs text-[#666] block mb-1">Align</label>
                <div className="flex gap-1">
                  {(['left','center','right'] as const).map(a => (
                    <button key={a} onClick={() => updateSlide(selected.id, { typography: { ...selected.typography, align: a } })}
                      className={clsx('px-2.5 py-1 rounded text-xs capitalize transition-colors',
                        selected.typography.align === a ? 'bg-[#c8a96e]/20 text-[#c8a96e] border border-[#c8a96e]/40'
                          : 'text-[#666] border border-[#2a2d38]')}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Layout */}
          <div>
            <div className="text-xs text-[#888] uppercase tracking-widest mb-2">Layout</div>
            <div className="flex flex-wrap gap-1.5">
              {LAYOUTS.map(l => (
                <button key={l} onClick={() => updateSlide(selected.id, { layout: l })}
                  className={clsx('px-2.5 py-1 rounded text-xs capitalize transition-colors',
                    selected.layout === l ? 'bg-[#6e9ec8]/20 text-[#6e9ec8] border border-[#6e9ec8]/40'
                      : 'text-[#666] border border-[#2a2d38] hover:border-[#3a3d4a]')}>
                  {l.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Transition */}
          <div>
            <div className="text-xs text-[#888] uppercase tracking-widest mb-2">Transition</div>
            <div className="flex flex-wrap gap-1.5">
              {TRANSITIONS.map(t => (
                <button key={t} onClick={() => updateSlide(selected.id, { transition: t })}
                  className={clsx('px-2.5 py-1 rounded text-xs capitalize transition-colors',
                    selected.transition === t ? 'bg-[#9e6ec8]/20 text-[#9e6ec8] border border-[#9e6ec8]/40'
                      : 'text-[#666] border border-[#2a2d38] hover:border-[#3a3d4a]')}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Deck title */}
          <div className="border-t border-[#2a2d38] pt-4">
            <Input label="Deck Title" value={deck.title ?? ''} onChange={e => onChange({ ...deck, title: e.target.value })} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#444] text-sm flex-col gap-3">
          <span>No slides yet</span>
          <Button variant="secondary" size="sm" onClick={addSlide}><Plus size={13}/> Add First Slide</Button>
        </div>
      )}
    </div>
  )
}
