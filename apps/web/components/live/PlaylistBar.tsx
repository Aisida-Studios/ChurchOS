'use client'
import { useLiveStore } from '@/lib/state/live-store'
import { Badge } from '@/components/ui/Badge'
import type { Service } from '@churchos/shared-types'
import { Music, BookOpen, Layout, Image, Megaphone, Minus } from 'lucide-react'
import { clsx } from 'clsx'

const ITEM_ICONS: Record<string, any> = {
  song: Music, scripture: BookOpen, slide_deck: Layout,
  media: Image, announcement: Megaphone, separator: Minus,
}
const ITEM_COLORS: Record<string, string> = {
  song: '#c8a96e', scripture: '#6e9ec8', slide_deck: '#9e6ec8',
  media: '#6ec89e', announcement: '#e8a86e', separator: '#555',
}

interface Props {
  service: Service
  onItemSelect?: (idx: number) => void
}

export function PlaylistBar({ service, onItemSelect }: Props) {
  const state = useLiveStore(s => s.state)
  const currentItemIndex = state?.currentItemIndex ?? 0

  return (
    <div className="flex-1 overflow-y-auto py-1">
      {(service.items ?? []).map((item, idx) => {
        const Icon = ITEM_ICONS[item.type] ?? Layout
        const color = ITEM_COLORS[item.type] ?? '#888'
        const isActive = idx === currentItemIndex

        return (
          <button
            key={item.id}
            onClick={() => onItemSelect?.(idx)}
            className={clsx(
              'w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors border-l-2',
              isActive
                ? 'bg-[#c8a96e]/10 border-[#c8a96e] text-[#e8d8b8]'
                : 'border-transparent text-[#888] hover:bg-[#1a1c24] hover:text-[#c8c0b0]'
            )}
          >
            <Icon size={13} style={{ color: isActive ? color : '#555' }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{item.label}</div>
              <div className="text-[10px] text-[#444] uppercase tracking-wide">{item.type.replace('_', ' ')}</div>
            </div>
            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#c8a96e] live-dot shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}
