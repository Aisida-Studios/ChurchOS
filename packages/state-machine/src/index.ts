import type {
  LiveSessionState, LiveAction, OutputContent,
  Background, TransitionType
} from '@churchos/shared-types'

const BLANK_BG: Background = { type: 'solid', color: '#000000' }
const DEFAULT_TRANSITION: TransitionType = 'fade'

export const BLACKOUT_OUTPUT: OutputContent = {
  type: 'blackout',
  background: BLANK_BG,
  transition: 'cut',
  transitionDuration: 0,
  timestamp: 0,
}

export const BLANK_OUTPUT: OutputContent = {
  type: 'blank',
  background: BLANK_BG,
  transition: DEFAULT_TRANSITION,
  transitionDuration: 300,
  timestamp: 0,
}

export function createInitialState(sessionId: string, serviceId: string, siteId: string): LiveSessionState {
  return {
    sessionId,
    serviceId,
    siteId,
    status: 'idle',
    currentItemIndex: 0,
    currentSlideIndex: 0,
    output: { ...BLANK_OUTPUT, timestamp: Date.now() },
    preview: null,
    activeOperators: [],
    aiSuggestions: [],
    transcriptBuffer: '',
    lastUpdated: Date.now(),
    version: 0,
  }
}

export function liveSessionReducer(state: LiveSessionState, action: LiveAction): LiveSessionState {
  const ts = Date.now()

  switch (action.type) {
    case 'GO_LIVE':
      return { ...state, status: 'live', lastUpdated: ts, version: state.version + 1 }

    case 'PAUSE':
      return { ...state, status: 'paused', lastUpdated: ts, version: state.version + 1 }

    case 'BLACKOUT':
      return {
        ...state,
        status: 'blackout',
        output: { ...BLACKOUT_OUTPUT, timestamp: ts },
        lastUpdated: ts,
        version: state.version + 1,
      }

    case 'CLEAR_BLACKOUT':
      return { ...state, status: 'live', lastUpdated: ts, version: state.version + 1 }

    case 'NEXT_SLIDE':
      return {
        ...state,
        currentSlideIndex: state.currentSlideIndex + 1,
        lastUpdated: ts,
        version: state.version + 1,
      }

    case 'PREV_SLIDE':
      return {
        ...state,
        currentSlideIndex: Math.max(0, state.currentSlideIndex - 1),
        lastUpdated: ts,
        version: state.version + 1,
      }

    case 'JUMP_TO_ITEM':
      return {
        ...state,
        currentItemIndex: action.payload.itemIndex,
        currentSlideIndex: 0,
        lastUpdated: ts,
        version: state.version + 1,
      }

    case 'JUMP_TO_SLIDE':
      return {
        ...state,
        currentItemIndex: action.payload.itemIndex,
        currentSlideIndex: action.payload.slideIndex,
        lastUpdated: ts,
        version: state.version + 1,
      }

    case 'SET_PREVIEW':
      return { ...state, preview: action.payload.content, lastUpdated: ts }

    case 'SEND_TO_OUTPUT':
      return {
        ...state,
        output: { ...action.payload.content, timestamp: ts },
        status: state.status === 'idle' ? 'live' : state.status,
        lastUpdated: ts,
        version: state.version + 1,
      }

    case 'APPROVE_AI_SUGGESTION':
      return {
        ...state,
        aiSuggestions: state.aiSuggestions.map(s =>
          s.id === action.payload.suggestionId ? { ...s, approved: true } : s
        ),
        lastUpdated: ts,
      }

    case 'DISMISS_AI_SUGGESTION':
      return {
        ...state,
        aiSuggestions: state.aiSuggestions.filter(s => s.id !== action.payload.suggestionId),
        lastUpdated: ts,
      }

    case 'OPERATOR_JOIN':
      return {
        ...state,
        activeOperators: [
          ...state.activeOperators.filter(o => o.userId !== action.payload.operator.userId),
          action.payload.operator,
        ],
        lastUpdated: ts,
      }

    case 'OPERATOR_LEAVE':
      return {
        ...state,
        activeOperators: state.activeOperators.filter(o => o.userId !== action.payload.userId),
        lastUpdated: ts,
      }

    case 'AI_TRANSCRIPT_UPDATE':
      return {
        ...state,
        transcriptBuffer: action.payload.text,
        aiSuggestions: [...state.aiSuggestions, ...action.payload.suggestions],
        lastUpdated: ts,
      }

    default:
      return state
  }
}
