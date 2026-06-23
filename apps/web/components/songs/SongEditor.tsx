'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { Song, SongSection, SectionType } from '@churchos/shared-types'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { clsx } from 'clsx'

const SECTION_COLOURS: Record<SectionType, string> = {
  verse: '#6e9ec8',
  chorus: '#c8a96e',
  bridge: '#9e6ec8',
  tag: '#6ec88a',
  intro: '#c86e9e',
  outro: '#c86e6e',
  'pre-chorus': '#c8c86e',
}

interface SongEditorProps {
  song: Partial<Song>
  onChange: (song: Partial<Song>) => void
  onSave: () => void
}

export function SongEditor({ song, onChange, onSave }: SongEditorProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const sections = song.sections ?? []

  const addSection = (type: SectionType) => {
    const id = `section-${Date.now()}`
    const label = `${type.charAt(0).toUpperCase() + type.slice(1)} ${sections.filter(s => s.type === type).length + 1}`
    const newSection: SongSection = { id, type, label, lines: [''] }
    onChange({
      ...song,
      sections: [...sections, newSection],
      default_arrangement: [...(song.default_arrangement ?? []), id],
    })
    setExpandedSection(id)
  }

  const updateSection = (id: string, updates: Partial<SongSection>) => {
    onChange({
      ...song,
      sections: sections.map(s => s.id === id ? { ...s, ...updates } : s),
    })
  }

  const removeSection = (id: string) => {
    onChange({
      ...song,
      sections: sections.filter(s => s.id !== id),
      default_arrangement: (song.default_arrangement ?? []).filter(sid => sid !== id),
    })
  }

  const updateLines = (id: string, text: string) => {
    updateSection(id, { lines: text.split('\n') })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Metadata */}
      <div className="glass p-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Song Title"
            value={song.title ?? ''}
            onChange={e => onChange({ ...song, title: e.target.value })}
            placeholder="Amazing Grace"
          />
          <Input
            label="Author"
            value={song.author ?? ''}
            onChange={e => onChange({ ...song, author: e.target.value })}
            placeholder="John Newton"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="CCLI Number"
            value={song.ccli_number ?? ''}
            onChange={e => onChange({ ...song, ccli_number: e.target.value })}
            placeholder="1234567"
          />
          <Input
            label="Key"
            value={song.key ?? ''}
            onChange={e => onChange({ ...song, key: e.target.value })}
            placeholder="G"
          />
          <Input
            label="Tempo (BPM)"
            type="number"
            value={song.tempo ?? ''}
            onChange={e => onChange({ ...song, tempo: Number(e.target.value) })}
            placeholder="80"
          />
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-2">
        {sections.map(section => {
          const color = SECTION_COLOURS[section.type]
          const isExpanded = expandedSection === section.id

          return (
            <div
              key={section.id}
              className="glass overflow-hidden"
              style={{ borderLeft: `3px solid ${color}` }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5"
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
              >
                <GripVertical size={14} className="text-[#444]" />
                <Badge style={{ background: `${color}20`, color, borderColor: `${color}40`, border: '1px solid' }}>
                  {section.type}
                </Badge>
                <input
                  value={section.label}
                  onChange={e => { e.stopPropagation(); updateSection(section.id, { label: e.target.value }) }}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 bg-transparent text-sm text-[#e8e0d0] outline-none"
                />
                <button
                  onClick={e => { e.stopPropagation(); removeSection(section.id) }}
                  className="text-[#444] hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
                {isExpanded ? <ChevronUp size={14} className="text-[#444]" /> : <ChevronDown size={14} className="text-[#444]" />}
              </div>

              {isExpanded && (
                <div className="px-3 pb-3">
                  <textarea
                    value={section.lines.join('\n')}
                    onChange={e => updateLines(section.id, e.target.value)}
                    className="w-full bg-[#0a0c10] border border-[#2a2d38] rounded p-2 text-sm text-[#c8c0b0] leading-relaxed resize-none outline-none focus:border-[#c8a96e] font-mono"
                    rows={Math.max(4, section.lines.length + 1)}
                    placeholder="Enter lyrics here, one line per row…"
                  />
                  <div className="text-[10px] text-[#444] mt-1">Each line = one line on screen</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add section */}
      <div className="flex flex-wrap gap-2">
        {(['verse', 'chorus', 'bridge', 'pre-chorus', 'tag', 'intro', 'outro'] as SectionType[]).map(type => (
          <button
            key={type}
            onClick={() => addSection(type)}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs border border-dashed border-[#2a2d38] text-[#666] hover:text-[#888] hover:border-[#3a3d4a] transition-colors capitalize"
          >
            <Plus size={11} /> {type}
          </button>
        ))}
      </div>

      <Button variant="primary" onClick={onSave} className="self-end">
        Save Song
      </Button>
    </div>
  )
}
