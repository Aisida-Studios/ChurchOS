// CJS wrapper of the state machine for use in server.js
'use strict'

function createInitialState(sessionId, serviceId, siteId) {
  return {
    sessionId, serviceId, siteId,
    status: 'idle',
    currentItemIndex: 0,
    currentSlideIndex: 0,
    output: { type: 'blank', background: { type: 'solid', color: '#000000' }, transition: 'fade', transitionDuration: 300, timestamp: Date.now() },
    preview: null,
    activeOperators: [],
    aiSuggestions: [],
    transcriptBuffer: '',
    lastUpdated: Date.now(),
    version: 0,
  }
}

function liveSessionReducer(state, action) {
  const ts = Date.now()
  const BLACKOUT = { type: 'blackout', background: { type: 'solid', color: '#000000' }, transition: 'cut', transitionDuration: 0, timestamp: ts }

  switch (action.type) {
    case 'GO_LIVE':      return { ...state, status: 'live', lastUpdated: ts, version: state.version + 1 }
    case 'PAUSE':        return { ...state, status: 'paused', lastUpdated: ts, version: state.version + 1 }
    case 'BLACKOUT':     return { ...state, status: 'blackout', output: BLACKOUT, lastUpdated: ts, version: state.version + 1 }
    case 'CLEAR_BLACKOUT': return { ...state, status: 'live', lastUpdated: ts, version: state.version + 1 }
    case 'NEXT_SLIDE':   return { ...state, currentSlideIndex: state.currentSlideIndex + 1, lastUpdated: ts, version: state.version + 1 }
    case 'PREV_SLIDE':   return { ...state, currentSlideIndex: Math.max(0, state.currentSlideIndex - 1), lastUpdated: ts, version: state.version + 1 }
    case 'JUMP_TO_ITEM': return { ...state, currentItemIndex: action.payload.itemIndex, currentSlideIndex: 0, lastUpdated: ts, version: state.version + 1 }
    case 'JUMP_TO_SLIDE': return { ...state, currentItemIndex: action.payload.itemIndex, currentSlideIndex: action.payload.slideIndex, lastUpdated: ts, version: state.version + 1 }
    case 'SET_PREVIEW':  return { ...state, preview: action.payload.content, lastUpdated: ts }
    case 'SEND_TO_OUTPUT': return { ...state, output: { ...action.payload.content, timestamp: ts }, status: state.status === 'idle' ? 'live' : state.status, lastUpdated: ts, version: state.version + 1 }
    case 'APPROVE_AI_SUGGESTION': return { ...state, aiSuggestions: state.aiSuggestions.map(s => s.id === action.payload.suggestionId ? { ...s, approved: true } : s), lastUpdated: ts }
    case 'DISMISS_AI_SUGGESTION': return { ...state, aiSuggestions: state.aiSuggestions.filter(s => s.id !== action.payload.suggestionId), lastUpdated: ts }
    case 'OPERATOR_JOIN': return { ...state, activeOperators: [...state.activeOperators.filter(o => o.userId !== action.payload.operator.userId), action.payload.operator], lastUpdated: ts }
    case 'OPERATOR_LEAVE': return { ...state, activeOperators: state.activeOperators.filter(o => o.userId !== action.payload.userId), lastUpdated: ts }
    case 'AI_TRANSCRIPT_UPDATE': return { ...state, transcriptBuffer: action.payload.text, aiSuggestions: [...state.aiSuggestions, ...action.payload.suggestions], lastUpdated: ts }
    default: return state
  }
}

module.exports = { createInitialState, liveSessionReducer }
