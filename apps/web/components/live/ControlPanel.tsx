'use client'
import { useCallback, useEffect } from 'react'
import { useLiveStore, selectStatus } from '@/lib/state/live-store'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PlaylistBar } from './PlaylistBar'
import { PreviewWindow } from './PreviewWindow'
import { AIAssistPanel } from './AIAssistPanel'
import type { Service, ServiceItem, OutputContent } from '@churchos/shared-types'
import { ChevronLeft, ChevronRight, Square, Wifi, WifiOff, Mic, ExternalLink } from 'lucide-react'

interface Props { service: Service; sessionId: string }

export function buildOutputForItem(item: ServiceItem | undefined, slideIndex: number): OutputContent | null {
  if (!item) return null
  const darkBg = { type: 'solid' as const, color: '#0d0f14' }
  const typo = {
    fontFamily: 'Georgia, serif', fontSize: 52, fontWeight: 700,
    color: '#ffffff', lineHeight: 1.3, letterSpacing: 0,
    shadow: '0 2px 8px rgba(0,0,0,0.8)', align: 'center' as const
  }

  if (item.type === 'song' && item.song) {
    const arrangement = item.song.default_arrangement?.length
      ? item.song.default_arrangement
      : item.song.sections.map((s: any) => s.id)
    const idx = Math.min(slideIndex, arrangement.length - 1)
    const section = item.song.sections.find((s: any) => s.id === arrangement[idx])
    if (!section) return null
    return {
      type: 'lyric', lines: section.lines, songTitle: item.song.title,
      sectionLabel: section.label, background: darkBg, typography: typo,
      layout: 'center', transition: 'fade', transitionDuration: 400, timestamp: Date.now()
    }
  }

  if (item.type === 'slide_deck' && item.slideDeck) {
    const slides = item.slideDeck.slides ?? []
    const slide = slides[Math.min(slideIndex, slides.length - 1)]
    if (!slide) return null
    return {
      type: 'slide', slide, background: slide.background,
      transition: slide.transition, transitionDuration: slide.transitionDuration, timestamp: Date.now()
    }
  }

  if (item.type === 'scripture') {
    const cfg = item.config as any
    return {
      type: 'scripture', reference: item.label,
      verseText: cfg?.verseText ?? 'Use Bible Search to send a verse directly to output.',
      translation: 'KJV', background: darkBg,
      transition: 'fade', transitionDuration: 500, timestamp: Date.now()
    }
  }

  if (item.type === 'announcement') {
    return {
      type: 'slide',
      slide: { id: item.id, type: 'announcement', content: item.label, subContent: '',
        background: darkBg, typography: typo, layout: 'center', transition: 'fade', transitionDuration: 400 },
      background: darkBg, transition: 'fade', transitionDuration: 400, timestamp: Date.now()
    }
  }

  return null
}

export function ControlPanel({ service, sessionId }: Props) {
  const dispatch = useLiveStore(s => s.dispatch)
  const status = useLiveStore(selectStatus)
  const isConnected = useLiveStore(s => s.isConnected)
  const state = useLiveStore(s => s.state)
  const isBlackout = status === 'blackout'
  const isLive = status === 'live'
  const items = service.items ?? []
  const currentItemIndex = state?.currentItemIndex ?? 0
  const currentSlideIndex = state?.currentSlideIndex ?? 0

  const getMaxSlide = useCallback((itemIdx: number) => {
    const item = items[itemIdx]
    if (!item) return 0
    if (item.type === 'song' && item.song) {
      return (item.song.default_arrangement?.length || item.song.sections.length) - 1
    }
    if (item.type === 'slide_deck' && item.slideDeck) {
      return (item.slideDeck.slides?.length ?? 1) - 1
    }
    return 0
  }, [items])

  const sendSlide = useCallback((itemIdx: number, slideIdx: number) => {
    const content = buildOutputForItem(items[itemIdx], slideIdx)
    if (content) dispatch({ type: 'SEND_TO_OUTPUT', payload: { content } })
  }, [items, dispatch])

  const goLive = useCallback(() => {
    dispatch({ type: 'GO_LIVE' })
    sendSlide(currentItemIndex, currentSlideIndex)
  }, [dispatch, sendSlide, currentItemIndex, currentSlideIndex])

  const nextSlide = useCallback(() => {
    if (currentSlideIndex < getMaxSlide(currentItemIndex)) {
      const next = currentSlideIndex + 1
      dispatch({ type: 'NEXT_SLIDE' })
      sendSlide(currentItemIndex, next)
    } else if (currentItemIndex < items.length - 1) {
      const nextItem = currentItemIndex + 1
      dispatch({ type: 'JUMP_TO_ITEM', payload: { itemIndex: nextItem } })
      sendSlide(nextItem, 0)
    }
  }, [currentItemIndex, currentSlideIndex, items.length, getMaxSlide, dispatch, sendSlide])

  const prevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      const prev = currentSlideIndex - 1
      dispatch({ type: 'PREV_SLIDE' })
      sendSlide(currentItemIndex, prev)
    } else if (currentItemIndex > 0) {
      const prevItem = currentItemIndex - 1
      const prevSlideIdx = getMaxSlide(prevItem)
      dispatch({ type: 'JUMP_TO_ITEM', payload: { itemIndex: prevItem } })
      sendSlide(prevItem, prevSlideIdx)
    }
  }, [currentItemIndex, currentSlideIndex, getMaxSlide, dispatch, sendSlide])

  const resumeFromBlackout = useCallback(() => {
    dispatch({ type: 'CLEAR_BLACKOUT' })
    sendSlide(currentItemIndex, currentSlideIndex)
  }, [dispatch, sendSlide, currentItemIndex, currentSlideIndex])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); nextSlide() }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prevSlide() }
      else if (e.key === 'b' || e.key === 'B') dispatch({ type: 'BLACKOUT' })
      else if (e.key === 'Escape') resumeFromBlackout()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [nextSlide, prevSlide, resumeFromBlackout, dispatch])

  const currentItem = items[currentItemIndex]
  const maxSlide = getMaxSlide(currentItemIndex)
  const slideLabel = currentItem?.type === 'song' && currentItem.song
    ? `${currentSlideIndex + 1} / ${(currentItem.song.default_arrangement?.length || currentItem.song.sections.length)}`
    : currentItem?.type === 'slide_deck' && currentItem.slideDeck
    ? `${currentSlideIndex + 1} / ${currentItem.slideDeck.slides?.length ?? 1}`
    : ''

  return (
    <div className="flex flex-col h-screen bg-[#0d0f14] text-[#e8e0d0]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1c24] border-b border-[#2a2d38] shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-base font-serif text-[#c8a96e]">✝ ChurchOS</div>
          <span className="text-[#2a2d38]">|</span>
          <div className="text-sm text-[#888] truncate max-w-xs">{service.title}</div>
        </div>
        <div className="flex items-center gap-3">
          <a href={`/output/${sessionId}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#555] hover:text-[#c8a96e] transition-colors">
            <ExternalLink size={12} /> Output Screen
          </a>
          {isConnected
            ? <Wifi size={13} className="text-green-400" />
            : <WifiOff size={13} className="text-[#444]" />}
          {isBlackout && <Badge variant="warning">BLACKOUT</Badge>}
          {isLive && !isBlackout && <Badge variant="live">LIVE</Badge>}
          {!isLive && !isBlackout && <Badge>STANDBY</Badge>}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Playlist */}
        <div className="w-60 border-r border-[#2a2d38] flex flex-col min-h-0 shrink-0">
          <div className="px-3 py-2 text-[10px] text-[#555] uppercase tracking-widest border-b border-[#2a2d38]">
            Order of Service
          </div>
          <PlaylistBar service={service} onItemSelect={(idx) => {
            dispatch({ type: 'JUMP_TO_ITEM', payload: { itemIndex: idx } })
            sendSlide(idx, 0)
          }} />
        </div>

        {/* Center */}
        <div className="flex-1 flex flex-col min-h-0">
          <PreviewWindow />
          <div className="p-4 border-t border-[#2a2d38] bg-[#1a1c24] shrink-0">
            {/* Current item info */}
            {currentItem && (
              <div className="text-center mb-3">
                <div className="text-xs text-[#888]">{currentItem.label}</div>
                {slideLabel && <div className="text-[10px] text-[#555]">Slide {slideLabel}</div>}
              </div>
            )}
            {/* Nav buttons */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <button onClick={prevSlide}
                className="flex items-center gap-1 px-4 py-2 text-sm text-[#888] hover:text-[#e8d8b8] rounded-lg hover:bg-white/5 transition-colors">
                <ChevronLeft size={16} /> Prev
              </button>
              {isBlackout ? (
                <Button variant="primary" size="lg" onClick={resumeFromBlackout}>
                  Resume Output
                </Button>
              ) : (
                <Button
                  variant={isLive ? 'live' : 'primary'}
                  size="lg"
                  onClick={isLive ? () => dispatch({ type: 'PAUSE' }) : goLive}
                >
                  {isLive ? '● LIVE' : '▶ Go Live'}
                </Button>
              )}
              <button onClick={nextSlide}
                className="flex items-center gap-1 px-4 py-2 text-sm text-[#888] hover:text-[#e8d8b8] rounded-lg hover:bg-white/5 transition-colors">
                Next <ChevronRight size={16} />
              </button>
            </div>
            {/* Blackout + shortcuts */}
            <div className="flex items-center justify-center gap-3">
              {isBlackout ? (
                <Button variant="primary" size="sm" onClick={resumeFromBlackout}>
                  ▶ Resume
                </Button>
              ) : (
                <Button variant="danger" size="sm" onClick={() => dispatch({ type: 'BLACKOUT' })}>
                  <Square size={11} fill="currentColor" /> Blank Screen
                </Button>
              )}
              <span className="text-[10px] text-[#444]">← → Navigate · B Blank · Esc Resume</span>
            </div>
          </div>
        </div>

        {/* AI Panel */}
        <div className="w-64 border-l border-[#2a2d38] flex flex-col min-h-0 shrink-0">
          <div className="px-3 py-2 text-[10px] text-[#555] uppercase tracking-widest border-b border-[#2a2d38] flex items-center gap-2">
            <Mic size={11} className="text-purple-400" /> AI Sermon Assistant
          </div>
          <AIAssistPanel />
        </div>
      </div>
    </div>
  )
}
