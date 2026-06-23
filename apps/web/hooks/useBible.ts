'use client'
import { useState, useCallback, useEffect } from 'react'
import { parseReference, lookupPassage, searchVerses, loadTranslation } from '@churchos/bible-engine'
import type { BiblePassage, BibleVerse } from '@churchos/shared-types'

const DEFAULT_TRANSLATION = 'KJV'

export function useBible(translation = DEFAULT_TRANSLATION) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    loadTranslation(translation).then(() => {
      setIsLoaded(true)
      setIsLoading(false)
    })
  }, [translation])

  const lookup = useCallback((reference: string): BiblePassage | null => {
    const parsed = parseReference(reference)
    if (!parsed) return null
    return lookupPassage(translation, parsed)
  }, [translation])

  const search = useCallback((query: string, limit = 20): BibleVerse[] => {
    return searchVerses(translation, query, limit)
  }, [translation])

  return { lookup, search, isLoaded, isLoading }
}
