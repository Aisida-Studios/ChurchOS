import type { BibleVerse, BiblePassage } from '@churchos/shared-types'

// Book name aliases for parsing
const BOOK_ALIASES: Record<string, string> = {
  'gen': 'Genesis', 'genesis': 'Genesis',
  'ex': 'Exodus', 'exo': 'Exodus', 'exodus': 'Exodus',
  'lev': 'Leviticus', 'leviticus': 'Leviticus',
  'num': 'Numbers', 'numbers': 'Numbers',
  'deut': 'Deuteronomy', 'deu': 'Deuteronomy', 'deuteronomy': 'Deuteronomy',
  'josh': 'Joshua', 'joshua': 'Joshua',
  'judg': 'Judges', 'judges': 'Judges',
  'ruth': 'Ruth',
  '1sam': '1 Samuel', '1 sam': '1 Samuel', '1 samuel': '1 Samuel',
  '2sam': '2 Samuel', '2 sam': '2 Samuel', '2 samuel': '2 Samuel',
  '1ki': '1 Kings', '1 kings': '1 Kings',
  '2ki': '2 Kings', '2 kings': '2 Kings',
  '1chr': '1 Chronicles', '1 chronicles': '1 Chronicles',
  '2chr': '2 Chronicles', '2 chronicles': '2 Chronicles',
  'ezr': 'Ezra', 'ezra': 'Ezra',
  'neh': 'Nehemiah', 'nehemiah': 'Nehemiah',
  'est': 'Esther', 'esther': 'Esther',
  'job': 'Job',
  'ps': 'Psalms', 'psa': 'Psalms', 'psalm': 'Psalms', 'psalms': 'Psalms',
  'prov': 'Proverbs', 'pro': 'Proverbs', 'proverbs': 'Proverbs',
  'eccl': 'Ecclesiastes', 'ecc': 'Ecclesiastes', 'ecclesiastes': 'Ecclesiastes',
  'song': 'Song of Solomon', 'sos': 'Song of Solomon', 'sol': 'Song of Solomon',
  'isa': 'Isaiah', 'isaiah': 'Isaiah',
  'jer': 'Jeremiah', 'jeremiah': 'Jeremiah',
  'lam': 'Lamentations', 'lamentations': 'Lamentations',
  'ezek': 'Ezekiel', 'eze': 'Ezekiel', 'ezekiel': 'Ezekiel',
  'dan': 'Daniel', 'daniel': 'Daniel',
  'hos': 'Hosea', 'hosea': 'Hosea',
  'joel': 'Joel',
  'amos': 'Amos',
  'obad': 'Obadiah', 'obadiah': 'Obadiah',
  'jonah': 'Jonah', 'jon': 'Jonah',
  'mic': 'Micah', 'micah': 'Micah',
  'nah': 'Nahum', 'nahum': 'Nahum',
  'hab': 'Habakkuk', 'habakkuk': 'Habakkuk',
  'zeph': 'Zephaniah', 'zephaniah': 'Zephaniah',
  'hag': 'Haggai', 'haggai': 'Haggai',
  'zech': 'Zechariah', 'zec': 'Zechariah', 'zechariah': 'Zechariah',
  'mal': 'Malachi', 'malachi': 'Malachi',
  'matt': 'Matthew', 'mat': 'Matthew', 'matthew': 'Matthew',
  'mk': 'Mark', 'mar': 'Mark', 'mark': 'Mark',
  'lk': 'Luke', 'luk': 'Luke', 'luke': 'Luke',
  'jn': 'John', 'joh': 'John', 'john': 'John',
  'acts': 'Acts',
  'rom': 'Romans', 'romans': 'Romans',
  '1cor': '1 Corinthians', '1 cor': '1 Corinthians', '1 corinthians': '1 Corinthians',
  '2cor': '2 Corinthians', '2 cor': '2 Corinthians', '2 corinthians': '2 Corinthians',
  'gal': 'Galatians', 'galatians': 'Galatians',
  'eph': 'Ephesians', 'ephesians': 'Ephesians',
  'phil': 'Philippians', 'php': 'Philippians', 'philippians': 'Philippians',
  'col': 'Colossians', 'colossians': 'Colossians',
  '1thess': '1 Thessalonians', '1 thess': '1 Thessalonians',
  '2thess': '2 Thessalonians', '2 thess': '2 Thessalonians',
  '1tim': '1 Timothy', '1 tim': '1 Timothy', '1 timothy': '1 Timothy',
  '2tim': '2 Timothy', '2 tim': '2 Timothy', '2 timothy': '2 Timothy',
  'titus': 'Titus', 'tit': 'Titus',
  'phlm': 'Philemon', 'philemon': 'Philemon',
  'heb': 'Hebrews', 'hebrews': 'Hebrews',
  'jas': 'James', 'james': 'James',
  '1pet': '1 Peter', '1 pet': '1 Peter', '1 peter': '1 Peter',
  '2pet': '2 Peter', '2 pet': '2 Peter', '2 peter': '2 Peter',
  '1jn': '1 John', '1 jn': '1 John', '1 john': '1 John',
  '2jn': '2 John', '2 jn': '2 John', '2 john': '2 John',
  '3jn': '3 John', '3 jn': '3 John', '3 john': '3 John',
  'jude': 'Jude',
  'rev': 'Revelation', 'revelation': 'Revelation',
}

export interface ParsedReference {
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
}

/**
 * Parse a Bible reference string into structured parts.
 * Handles: "John 3:16", "John 3:16-18", "Ps 23", "1 Cor 13:4"
 */
export function parseReference(input: string): ParsedReference | null {
  const cleaned = input.trim()

  // Pattern: "Book Chapter:Verse" or "Book Chapter:Verse-Verse"
  const pattern = /^((?:\d\s+)?[a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(\d+)(?::(\d+)(?:[–\-](\d+))?)?$/
  const match = cleaned.match(pattern)
  if (!match) return null

  const bookRaw = match[1].trim().toLowerCase()
  const chapter = parseInt(match[2])
  const verseStart = match[3] ? parseInt(match[3]) : 1
  const verseEnd = match[4] ? parseInt(match[4]) : verseStart

  const book = BOOK_ALIASES[bookRaw] || null
  if (!book) return null

  return { book, chapter, verseStart, verseEnd }
}

/**
 * Format a parsed reference back to display string
 */
export function formatReference(ref: ParsedReference): string {
  if (ref.verseStart === ref.verseEnd) {
    return `${ref.book} ${ref.chapter}:${ref.verseStart}`
  }
  return `${ref.book} ${ref.chapter}:${ref.verseStart}–${ref.verseEnd}`
}

/**
 * In-memory Bible store for bundled translation
 * In production this is loaded from /public/bibles/kjv.json
 */
type BibleData = Record<string, Record<number, Record<number, string>>>
const bibleCache: Record<string, BibleData> = {}

export async function loadTranslation(translationId: string): Promise<void> {
  if (bibleCache[translationId]) return
  try {
    const res = await fetch(`/bibles/${translationId.toLowerCase()}.json`)
    if (!res.ok) throw new Error(`Failed to load ${translationId}`)
    bibleCache[translationId] = await res.json()
  } catch {
    console.error(`Bible translation ${translationId} not available`)
  }
}

export function lookupPassage(
  translationId: string,
  ref: ParsedReference
): BiblePassage | null {
  const data = bibleCache[translationId]
  if (!data) return null

  const bookData = data[ref.book]
  if (!bookData) return null

  const chapterData = bookData[ref.chapter]
  if (!chapterData) return null

  const verses: BibleVerse[] = []
  for (let v = ref.verseStart; v <= ref.verseEnd; v++) {
    const text = chapterData[v]
    if (text) {
      verses.push({ translation_id: translationId, book: ref.book, chapter: ref.chapter, verse: v, text })
    }
  }

  if (verses.length === 0) return null

  return {
    translation_id: translationId,
    book: ref.book,
    chapter: ref.chapter,
    verse_start: ref.verseStart,
    verse_end: ref.verseEnd,
    verses,
    reference: formatReference(ref),
  }
}

/**
 * Quick search — find verses containing a keyword
 */
export function searchVerses(translationId: string, query: string, limit = 20): BibleVerse[] {
  const data = bibleCache[translationId]
  if (!data) return []

  const q = query.toLowerCase()
  const results: BibleVerse[] = []

  outer: for (const book of Object.keys(data)) {
    for (const chapter of Object.keys(data[book])) {
      for (const verse of Object.keys(data[book][Number(chapter)])) {
        const text = data[book][Number(chapter)][Number(verse)]
        if (text.toLowerCase().includes(q)) {
          results.push({
            translation_id: translationId,
            book,
            chapter: Number(chapter),
            verse: Number(verse),
            text,
          })
          if (results.length >= limit) break outer
        }
      }
    }
  }
  return results
}
