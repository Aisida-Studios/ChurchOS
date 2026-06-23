// ─── Organizations & Auth ───────────────────────────────────────────────────

export type UserRole = 'admin' | 'operator' | 'assistant' | 'viewer'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: 'free' | 'pro' | 'enterprise'
  settings: Record<string, unknown>
  created_at: string
}

export interface Site {
  id: string
  org_id: string
  name: string
  timezone: string
  settings: Record<string, unknown>
}

export interface User {
  id: string
  org_id: string
  email: string
  display_name: string
  role: UserRole
  site_id?: string
  created_at: string
}

// ─── Songs ──────────────────────────────────────────────────────────────────

export type SectionType = 'verse' | 'chorus' | 'bridge' | 'tag' | 'intro' | 'outro' | 'pre-chorus'

export interface SongSection {
  id: string
  type: SectionType
  label: string       // e.g. "Verse 1", "Chorus"
  lines: string[]     // each line of lyrics
}

export interface Song {
  id: string
  org_id: string
  title: string
  author?: string
  ccli_number?: string
  key?: string
  tempo?: number
  tags: string[]
  sections: SongSection[]
  default_arrangement: string[]   // ordered section IDs
  created_at: string
  updated_at: string
}

// ─── Slides ─────────────────────────────────────────────────────────────────

export type SlideType = 'text' | 'image' | 'video' | 'scripture' | 'announcement' | 'blank'
export type BackgroundType = 'solid' | 'gradient' | 'image' | 'video'
export type LayoutType = 'center' | 'bottom-third' | 'top-third' | 'split' | 'full'
export type TransitionType = 'fade' | 'cut' | 'slide-left' | 'slide-right' | 'zoom' | 'blur'

export interface Background {
  type: BackgroundType
  color?: string
  gradient?: { from: string; to: string; angle: number }
  url?: string
  opacity?: number
}

export interface Typography {
  fontFamily: string
  fontSize: number        // px
  fontWeight: number
  color: string
  lineHeight: number
  letterSpacing: number
  shadow?: string         // CSS shadow string
  stroke?: { width: number; color: string }
  align: 'left' | 'center' | 'right'
}

export interface Slide {
  id: string
  type: SlideType
  content: string         // main text / html
  subContent?: string     // secondary text (e.g. scripture reference)
  background: Background
  typography: Typography
  layout: LayoutType
  transition: TransitionType
  transitionDuration: number  // ms
  notes?: string          // operator notes (not shown on output)
}

export interface SlideDeck {
  id: string
  org_id: string
  title: string
  slides: Slide[]
  thumbnail_url?: string
  tags: string[]
  created_at: string
  updated_at: string
}

// ─── Bible ──────────────────────────────────────────────────────────────────

export interface BibleTranslation {
  id: string    // ESV, NIV, KJV, NLT, etc.
  name: string
  language: string
  is_bundled: boolean
}

export interface BibleVerse {
  translation_id: string
  book: string
  chapter: number
  verse: number
  text: string
}

export interface BiblePassage {
  translation_id: string
  book: string
  chapter: number
  verse_start: number
  verse_end: number
  verses: BibleVerse[]
  reference: string       // formatted: "John 3:16-18"
}

// ─── Services ───────────────────────────────────────────────────────────────

export type ServiceItemType = 'song' | 'scripture' | 'slide_deck' | 'media' | 'announcement' | 'separator'
export type ServiceStatus = 'draft' | 'live' | 'archived'

export interface ServiceItem {
  id: string
  type: ServiceItemType
  reference_id?: string   // FK to song, slide_deck, media_item
  label: string
  position: number
  config: Record<string, unknown>
  // resolved data (populated at load time)
  song?: Song
  slideDeck?: SlideDeck
  passage?: BiblePassage
}

export interface Service {
  id: string
  site_id: string
  title: string
  scheduled_at?: string
  status: ServiceStatus
  created_by: string
  items: ServiceItem[]
  created_at: string
  updated_at: string
}

// ─── Media ──────────────────────────────────────────────────────────────────

export type MediaType = 'image' | 'video' | 'audio'

export interface MediaItem {
  id: string
  org_id: string
  name: string
  type: MediaType
  mime_type: string
  url: string
  cdn_url?: string
  size_bytes: number
  duration_seconds?: number
  tags: string[]
  folder_path: string
  metadata: Record<string, unknown>
  created_at: string
}

// ─── Live Session ────────────────────────────────────────────────────────────

export type OutputType = 'slide' | 'lyric' | 'scripture' | 'media' | 'blank' | 'blackout'
export type SessionStatus = 'idle' | 'live' | 'paused' | 'blackout'

export interface OutputContent {
  type: OutputType
  // For lyrics
  lines?: string[]
  songTitle?: string
  sectionLabel?: string
  // For scripture
  reference?: string
  verseText?: string
  translation?: string
  // For slides
  slide?: Slide
  // For media
  mediaUrl?: string
  mediaType?: MediaType
  // Shared
  background: Background
  typography?: Typography
  layout?: LayoutType
  transition: TransitionType
  transitionDuration: number
  timestamp: number
}

export interface ActiveOperator {
  userId: string
  name: string
  role: UserRole
}

export interface AISuggestion {
  id: string
  type: 'verse' | 'theme' | 'keyword'
  reference?: string
  text?: string
  confidence: number
  approved: boolean
}

export interface LiveSessionState {
  sessionId: string
  serviceId: string
  siteId: string
  status: SessionStatus

  currentItemIndex: number
  currentSlideIndex: number

  output: OutputContent
  preview: OutputContent | null

  activeOperators: ActiveOperator[]

  aiSuggestions: AISuggestion[]
  transcriptBuffer: string

  lastUpdated: number
  version: number
}

// ─── Events (State Machine Actions) ─────────────────────────────────────────

export type LiveAction =
  | { type: 'GO_LIVE' }
  | { type: 'PAUSE' }
  | { type: 'BLACKOUT' }
  | { type: 'CLEAR_BLACKOUT' }
  | { type: 'NEXT_SLIDE' }
  | { type: 'PREV_SLIDE' }
  | { type: 'JUMP_TO_ITEM'; payload: { itemIndex: number } }
  | { type: 'JUMP_TO_SLIDE'; payload: { itemIndex: number; slideIndex: number } }
  | { type: 'SET_PREVIEW'; payload: { content: OutputContent } }
  | { type: 'SEND_TO_OUTPUT'; payload: { content: OutputContent } }
  | { type: 'APPROVE_AI_SUGGESTION'; payload: { suggestionId: string } }
  | { type: 'DISMISS_AI_SUGGESTION'; payload: { suggestionId: string } }
  | { type: 'OPERATOR_JOIN'; payload: { operator: ActiveOperator } }
  | { type: 'OPERATOR_LEAVE'; payload: { userId: string } }
  | { type: 'AI_TRANSCRIPT_UPDATE'; payload: { text: string; suggestions: AISuggestion[] } }
