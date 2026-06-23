import { create } from 'zustand'
import type { Service, Song, SlideDeck, MediaItem } from '@churchos/shared-types'

interface ServiceStore {
  services: Service[]
  currentService: Service | null
  songs: Song[]
  slideDecks: SlideDeck[]
  mediaItems: MediaItem[]
  isLoading: boolean
  error: string | null

  setServices: (services: Service[]) => void
  setCurrentService: (service: Service | null) => void
  setSongs: (songs: Song[]) => void
  setSlideDecks: (decks: SlideDeck[]) => void
  setMediaItems: (items: MediaItem[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useServiceStore = create<ServiceStore>()((set) => ({
  services: [],
  currentService: null,
  songs: [],
  slideDecks: [],
  mediaItems: [],
  isLoading: false,
  error: null,

  setServices: (services) => set({ services }),
  setCurrentService: (service) => set({ currentService: service }),
  setSongs: (songs) => set({ songs }),
  setSlideDecks: (decks) => set({ slideDecks: decks }),
  setMediaItems: (items) => set({ mediaItems: items }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}))
