'use client'
import { useEffect, useRef, useState } from 'react'
import { useLiveStore } from '@/lib/state/live-store'
import { useLiveSession } from '@/hooks/useLiveSession'
import type { OutputContent, Background } from '@churchos/shared-types'

interface OutputRendererProps { sessionId: string }

const MOTION_BACKGROUNDS: Record<string, string> = {
  'particles': 'https://cdn.pixabay.com/video/2016/03/28/2455-160811752_tiny.mp4',
  'waves': 'https://cdn.pixabay.com/video/2019/07/08/25122-348411945_tiny.mp4',
  'clouds': 'https://cdn.pixabay.com/video/2016/06/26/3888-172341983_tiny.mp4',
}

export function OutputRenderer({ sessionId }: OutputRendererProps) {
  useLiveSession(sessionId)
  const output = useLiveStore(s => s.state?.output)
  const prevOutputRef = useRef<OutputContent | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (!output || !contentRef.current) return
    if (prevOutputRef.current?.timestamp === output.timestamp) return
    const el = contentRef.current
    const duration = output.transitionDuration ?? 300
    if (output.transition === 'cut' || duration === 0) {
      // instant
    } else if (output.transition === 'fade') {
      el.style.opacity = '0'
      el.style.transition = `opacity ${duration}ms ease`
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = '1' }))
    } else if (output.transition === 'slide-left') {
      el.style.transform = 'translateX(100%)'; el.style.transition = 'none'
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = `transform ${duration}ms ease`; el.style.transform = 'translateX(0)'
      }))
    } else if (output.transition === 'zoom') {
      el.style.transform = 'scale(1.05)'; el.style.opacity = '0'; el.style.transition = 'none'
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`
        el.style.transform = 'scale(1)'; el.style.opacity = '1'
      }))
    } else if (output.transition === 'blur') {
      el.style.filter = 'blur(10px)'; el.style.opacity = '0'; el.style.transition = 'none'
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = `filter ${duration}ms ease, opacity ${duration}ms ease`
        el.style.filter = 'blur(0)'; el.style.opacity = '1'
      }))
    }
    prevOutputRef.current = output
  }, [output])

  // Handle audio output
  useEffect(() => {
    if (output?.type === 'media' && output.mediaType === 'audio' && output.mediaUrl && audioRef.current) {
      audioRef.current.src = output.mediaUrl
      audioRef.current.play().catch(() => {})
    }
  }, [output])

  if (!output) return <div className="w-full h-screen bg-black" />
  if (output.type === 'blackout' || output.type === 'blank') return <div className="w-full h-screen bg-black" />

  return (
    <div className="w-full h-screen overflow-hidden relative">
      {/* Background layer */}
      <BackgroundLayer bg={output.background} />

      {/* Content layer */}
      <div ref={contentRef} className="absolute inset-0 z-10">
        {output.type === 'lyric' && <><BackgroundLayer content={output} /><LyricLayer output={output} /></>}
      {output.type === 'video' && <VideoLayer content={output} />}
      {output.type === 'audio' && <><BackgroundLayer content={output} /><AudioLayer content={output} /></>}
      {output.type === 'pdf' && <PDFLayer content={output} />}
        {output.type === 'scripture' && <ScriptureLayer output={output} />}
        {output.type === 'slide' && output.slide && <SlideLayer output={output} />}
        {output.type === 'media' && output.mediaType === 'video' && <VideoLayer output={output} />}
      </div>

      {/* Hidden audio player */}
      <audio ref={audioRef} className="hidden" />
    </div>
  )
}

function BackgroundLayer({ bg }: { bg: Background }) {
  if (!bg) return <div className="absolute inset-0 bg-black" />

  if (bg.type === 'solid') return (
    <div className="absolute inset-0" style={{ backgroundColor: bg.color ?? '#000' }} />
  )
  if (bg.type === 'gradient' && bg.gradient) return (
    <div className="absolute inset-0" style={{
      background: `linear-gradient(${bg.gradient.angle}deg, ${bg.gradient.from}, ${bg.gradient.to})`
    }} />
  )
  if (bg.type === 'image' && bg.url) return (
    <div className="absolute inset-0" style={{
      backgroundImage: `url(${bg.url})`, backgroundSize: 'cover', backgroundPosition: 'center',
      opacity: bg.opacity ?? 1
    }} />
  )
  if (bg.type === 'video' && bg.url) return (
    <video
      className="absolute inset-0 w-full h-full object-cover"
      src={bg.url} autoPlay loop muted playsInline
      style={{ opacity: bg.opacity ?? 1 }}
    />
  )
  return <div className="absolute inset-0 bg-black" />
}

function LyricLayer({ output }: { output: OutputContent }) {
  const lines = output.lines ?? []
  const typo = output.typography
  const layout = output.layout ?? 'center'

  const textStyle: React.CSSProperties = {
    fontFamily: typo?.fontFamily ?? 'Georgia, serif',
    fontSize: `${typo?.fontSize ?? 52}px`,
    fontWeight: typo?.fontWeight ?? 700,
    color: typo?.color ?? '#ffffff',
    lineHeight: typo?.lineHeight ?? 1.3,
    textAlign: (typo?.align ?? 'center') as any,
    textShadow: typo?.shadow ?? '0 2px 8px rgba(0,0,0,0.8)',
  }

  const containerClass = layout === 'bottom-third'
    ? 'absolute bottom-0 left-0 right-0 p-[5%] pb-[8%]'
    : layout === 'top-third'
    ? 'absolute top-0 left-0 right-0 p-[5%] pt-[8%]'
    : 'absolute inset-0 flex flex-col items-center justify-center p-[5%]'

  return (
    <>
      <div className={containerClass}>
        {lines.map((line, i) => <div key={i} style={textStyle}>{line}</div>)}
      </div>
      {(output.songTitle || output.sectionLabel) && (
        <div className="absolute bottom-0 left-0 right-0 px-8 py-4 pointer-events-none">
          <div className="inline-flex flex-col items-start">
            {output.songTitle && (
              <div style={{ fontSize:'18px', color:'rgba(255,255,255,0.7)', fontFamily:'Georgia, serif', textShadow:'0 1px 4px rgba(0,0,0,0.9)' }}>
                {output.songTitle}
              </div>
            )}
            {output.sectionLabel && (
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.15em' }}>
                {output.sectionLabel}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function ScriptureLayer({ output }: { output: OutputContent }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-[8%]">
      <p className="text-white text-center leading-relaxed mb-6 italic"
        style={{ fontSize:'42px', fontWeight:400, textShadow:'0 2px 8px rgba(0,0,0,0.8)', fontFamily:'Georgia, serif' }}>
        {output.verseText}
      </p>
      <div className="tracking-widest" style={{ color:'rgba(200,169,110,0.9)', fontSize:'24px' }}>{output.reference}</div>
      {output.translation && <div className="mt-1" style={{ color:'rgba(255,255,255,0.3)', fontSize:'14px' }}>{output.translation}</div>}
    </div>
  )
}

function SlideLayer({ output }: { output: OutputContent }) {
  const slide = output.slide!
  const typo = slide.typography
  const layout = slide.layout ?? 'center'

  const textStyle: React.CSSProperties = {
    fontFamily: typo?.fontFamily ?? 'Georgia, serif',
    fontSize: `${typo?.fontSize ?? 52}px`,
    fontWeight: typo?.fontWeight ?? 700,
    color: typo?.color ?? '#ffffff',
    lineHeight: typo?.lineHeight ?? 1.3,
    textAlign: (typo?.align ?? 'center') as any,
    textShadow: typo?.shadow,
  }

  if (slide.type === 'image' && slide.imageUrl) return (
    <div className="absolute inset-0 flex items-center justify-center">
      <img src={slide.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
    </div>
  )

  if (slide.type === 'video' && slide.videoUrl) return (
    <video className="absolute inset-0 w-full h-full object-cover" src={slide.videoUrl} autoPlay loop muted playsInline />
  )

  const containerClass = layout === 'bottom-third'
    ? 'absolute bottom-0 left-0 right-0 p-[5%] pb-[8%]'
    : layout === 'top-third'
    ? 'absolute top-0 left-0 right-0 p-[5%] pt-[8%]'
    : 'absolute inset-0 flex flex-col items-center justify-center p-[5%]'

  return (
    <div className={containerClass}>
      {slide.content && <div style={textStyle}>{slide.content}</div>}
      {slide.subContent && (
        <div className="mt-4" style={{ ...textStyle, fontSize:`${(typo?.fontSize ?? 52) * 0.55}px`, fontWeight:400, color:'rgba(255,255,255,0.65)' }}>
          {slide.subContent}
        </div>
      )}
    </div>
  )
}

function VideoLayer({ output }: { output: OutputContent }) {
  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center">
      <video className="max-w-full max-h-full" src={output.mediaUrl} autoPlay controls={false} />
    </div>
  )
}
