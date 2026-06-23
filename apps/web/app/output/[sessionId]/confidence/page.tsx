'use client'
import { useEffect, useState } from 'react'
import { useLiveSession } from '@/hooks/useLiveSession'

export default function ConfidenceMonitorPage({ params }: { params: { sessionId: string } }) {
  const { state } = useLiveSession(params.sessionId)
  const output = state?.output
  const isBlackout = state?.status === 'blackout'

  // Get current + next section
  const currentItem = state?.items?.[state?.currentItemIndex ?? 0]
  const slideIndex = state?.currentSlideIndex ?? 0
  let nextLabel = ''
  if (currentItem?.type === 'song' && currentItem.song) {
    const arr = currentItem.song.default_arrangement || currentItem.song.sections.map((s: any) => s.id)
    const nextSec = currentItem.song.sections.find((s: any) => s.id === arr[slideIndex + 1])
    if (nextSec) nextLabel = nextSec.label
  }

  return (
    <div className="w-screen h-screen bg-[#0a0c10] text-white flex flex-col p-6 font-mono overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 text-xs text-[#555] border-b border-[#1a1c24] pb-3">
        <span>CONFIDENCE MONITOR</span>
        <div className="flex items-center gap-3">
          {state?.status === 'live' && (
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />LIVE
            </span>
          )}
          {isBlackout && <span className="text-yellow-500">BLACKOUT</span>}
          <span>{params.sessionId}</span>
        </div>
      </div>

      {isBlackout ? (
        <div className="flex-1 flex items-center justify-center text-[#333] text-2xl tracking-widest">
          BLACKOUT
        </div>
      ) : output ? (
        <div className="flex-1 flex flex-col">
          {/* Current content - large */}
          <div className="flex-1 flex flex-col justify-center">
            {output.type === 'lyric' && (
              <>
                <div className="text-[10px] text-[#444] uppercase tracking-widest mb-4">
                  {output.songTitle && `${output.songTitle} — `}{output.sectionLabel}
                </div>
                <div className="flex flex-col gap-3">
                  {output.lines?.map((line: string, i: number) => (
                    <div key={i} className="text-3xl font-light text-white leading-relaxed">{line}</div>
                  ))}
                </div>
              </>
            )}
            {output.type === 'scripture' && (
              <>
                <div className="text-[10px] text-[#c8a96e] uppercase tracking-widest mb-4">{output.reference}</div>
                <div className="text-2xl font-light text-white leading-relaxed italic">{output.verseText}</div>
              </>
            )}
            {output.type === 'slide' && (
              <>
                <div className="text-3xl font-medium text-white">{output.slide?.content}</div>
                {output.slide?.subContent && (
                  <div className="text-xl text-[#888] mt-3">{output.slide.subContent}</div>
                )}
              </>
            )}
          </div>

          {/* Next up - dimmed at bottom */}
          {nextLabel && (
            <div className="border-t border-[#1a1c24] pt-4 mt-4">
              <div className="text-[10px] text-[#333] uppercase tracking-widest mb-1">NEXT</div>
              <div className="text-sm text-[#555]">{nextLabel}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#333] tracking-widest">
          STANDING BY
        </div>
      )}

      {/* Slide counter */}
      <div className="mt-4 pt-3 border-t border-[#1a1c24] flex items-center justify-between text-[10px] text-[#333]">
        <span>SLIDE {(state?.currentSlideIndex ?? 0) + 1}</span>
        <span>ITEM {(state?.currentItemIndex ?? 0) + 1} / {state?.items?.length ?? 0}</span>
      </div>
    </div>
  )
}
