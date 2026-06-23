import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { LiveSessionState, LiveAction, OutputContent } from '@churchos/shared-types'
import { liveSessionReducer, createInitialState } from '@churchos/state-machine'

export const ACTIVE_SESSION_KEY = 'churchos_active_session'

interface LiveStore {
  state: LiveSessionState | null
  isConnected: boolean
  isSyncing: boolean
  dispatch: (action: LiveAction) => void
  initSession: (sessionId: string, serviceId: string, siteId: string) => void
  setConnected: (connected: boolean) => void
  applyRemoteState: (remoteState: LiveSessionState) => void
}

export const useLiveStore = create<LiveStore>()(
  subscribeWithSelector((set, get) => ({
    state: null,
    isConnected: false,
    isSyncing: false,

    initSession: (sessionId, serviceId, siteId) => {
      set({ state: createInitialState(sessionId, serviceId, siteId) })
      if (typeof window !== 'undefined') {
        localStorage.setItem(ACTIVE_SESSION_KEY, sessionId)
      }
    },

    dispatch: (action: LiveAction) => {
      const { state } = get()
      if (!state) return
      const next = liveSessionReducer(state, action)
      set({ state: next, isSyncing: true })
      window.dispatchEvent(new CustomEvent('churchos:action', { detail: action }))
    },

    setConnected: (connected) => set({ isConnected: connected }),

    applyRemoteState: (remoteState) => {
      const { state } = get()
      if (!state || remoteState.version >= state.version) {
        set({ state: remoteState, isSyncing: false })
      }
    },
  }))
)

export const selectOutput = (store: LiveStore) => store.state?.output ?? null
export const selectStatus = (store: LiveStore) => store.state?.status ?? 'idle'
export const selectCurrentIndexes = (store: LiveStore) => ({
  itemIndex: store.state?.currentItemIndex ?? 0,
  slideIndex: store.state?.currentSlideIndex ?? 0,
})
export const selectAISuggestions = (store: LiveStore) => store.state?.aiSuggestions ?? []
