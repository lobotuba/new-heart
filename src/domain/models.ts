import type { ExerciseType, LearningState, ReviewResult } from './enums'

export interface Verse {
  id: number
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
  translation: string
  text: string
}

export function verseReference(v: Pick<Verse, 'book' | 'chapter' | 'verseStart' | 'verseEnd'>): string {
  return v.verseStart === v.verseEnd
    ? `${v.book} ${v.chapter}:${v.verseStart}`
    : `${v.book} ${v.chapter}:${v.verseStart}-${v.verseEnd}`
}

export interface Memorization {
  id: number
  verseId: number
  status: LearningState
  memoryStrength: number
  /** Distinct calendar dates (ISO 'YYYY-MM-DD') a "know it" result landed on — spec section 8's learned criteria. */
  successStreakDays: string[]
  createdAt: number
  startedAt: number | null
  learnedAt: number | null
  lastReviewedAt: number | null
  nextReviewAt: number | null
  targetIntervalDays: number
  longestIntervalDays: number
}

export interface MemorizationWithVerse {
  memorization: Memorization
  verse: Verse
}

export interface ReviewEvent {
  id: number
  memorizationId: number
  timestamp: number
  result: ReviewResult
  exerciseType: ExerciseType
}

export interface Agenda {
  id: number
  title: string
  startDate: string | null
  targetDate: string | null
  priority: number
}

export interface Collection {
  id: number
  name: string
  description: string
}

export interface AgendaVerseLink {
  id: number
  agendaId: number
  verseId: number
}

export interface CollectionVerseLink {
  id: number
  collectionId: number
  verseId: number
}

export interface AppSetting {
  key: string
  value: string
}
