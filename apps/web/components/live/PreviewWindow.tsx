'use client'
import { useLiveStore } from '@/lib/state/live-store'

export function PreviewWindow() {
  const output = useLiveStore(s => s.state?.output)
  const preview = useLiveStore(s => s.state?.preview)
  const status = useLiveStore(s => s.state?.status)
  const currentItem = useLiveStore(s => {
    const st = s.state
    if (!st) return null
    return st.items?.[st.currentItemIndex] ?? null
  })
  const slideIndex = useLiveStore(s => s.state?.currentSlideIndex ?? 0)

  const isBlackout = status === 'blackout'
  const isLive = status === 'live'

  // Build section label for lyrics
  let sectionLabel = ''
  if (currentItem?.type === 'song' && currentItem.song) {
    const arr = currentItem.song.default_arrangement?.length
      ? currentItem.song.default_arrangement
      : currentItem.song.sections.map((s: any) => s.id)
    const sec = currentItem.song.sections.find((s: any) => s.id === arr[slideIndex])
    if (sec) sectionLabel = `${currentItem.song.title} — ${sec.label}`
  } else if (currentItem?.type === 'slide_deck' && currentItem.slideDeck) {
    const slides = currentItem.slideDeck.slides ?? []
    const slide = slides[slideIndex]
    if (slide) sectionLabel = `${currentItem.slideDeck.title} — Slide ${slideIndex + 1}/${slides.length}`
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0c10] p-4 min-h-0">
      <div className="w-full max-w-xl">
        {/* Status row */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] text-[#555] uppercase tracking-widest">Live Output</div>
          {sectionLabel && (
            <div className="text-[10px] text-[#c8a96e] truncate max-w-[60%] text-right">{sectionLabel}</div>
          )}
        </div>

        {/* Main output preview */}
        <div
          className="relative w-full rounded-lg overflow-hidden border border-[#2a2d38]"
          style={{ aspectRatio: '16/9' }}
        >
          {isBlackout ? (
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              <span className="text-[#444] text-sm tracking-widest uppercase">Blackout</span>
            </div>
          ) : output ? (
            <MiniSlidePreview content={output} />
          ) : (
            <div className="absolute inset-0 bg-[#0d0f14] flex items-center justify-center">
              <span className="text-[#333] text-sm">No output</span>
            </div>
          )}
          {isLive && !isBlackout && (
            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-red-600/90 px-1.5 py-0.5 rounded text-[9px] text-white font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />LIVE
            </div>
          )}
        </div>

        {/* Next up preview */}
        {preview && (
          <div className="mt-3">
            <div className="mb-1 text-[10px] text-[#555] uppercase tracking-widest">Next</div>
            <div
              className="relative w-full rounded border border-[#2a2d38] opacity-50"
              style={{ aspectRatio: '16/9' }}
            >
              <MiniSlidePreview content={preview} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MiniSlidePreview({ content }: { content: any }) {
  const bg = content.background
  let bgStyle: React.CSSProperties = {}
  if (bg?.type === 'solid') bgStyle.backgroundColor = bg.color ?? '#000'
  else if (bg?.type === 'gradient' && bg.gradient) {
    bgStyle.background = `linear-gradient(${bg.gradient.angle}deg, ${bg.gradient.from}, ${bg.gradient.to})`
  } else {
    bgStyle.backgroundColor = '#000'
  }

  // Lyrics — render each line
  if (content.type === 'lyric' && Array.isArray(content.lines)) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4" style={bgStyle}>
        {content.lines.map((line: string, i: number) => (
          <p key={i} className="text-white text-center text-xs leading-relaxed">{line}</p>
        ))}
        {content.sectionLabel && (
          <div className="absolute bottom-1.5 right-2 text-[9px] text-white/40">{content.sectionLabel}</div>
        )}
      </div>
    )
  }

  // Scripture
  if (content.type === 'scripture') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4" style={bgStyle}>
        <p className="text-white/90 text-center text-xs leading-relaxed italic line-clamp-4">{content.verseText}</p>
        {content.reference && (
          <div className="absolute bottom-1.5 right-2 text-[9px] text-[#c8a96e]">{content.reference}</div>
        )}
      </div>
    )
  }

  // Slide / announcement
  const text = content.slide?.content ?? content.slide?.subContent ?? ''
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4" style={bgStyle}>
      {text && <p className="text-white text-center text-xs leading-relaxed line-clamp-4">{text}</p>}
    </div>
  )
}
