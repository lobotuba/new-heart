/** Spec section 7 — a verse being *learned* is distinct from a verse being *retained*. Retention, not memorization, is the goal. */
export enum LearningState {
  Interested = 'interested',
  Scheduled = 'scheduled',
  Learning = 'learning',
  Learned = 'learned',
  Retention = 'retention',
  Relearning = 'relearning',
}

/** Spec section 10 — the three self-evaluation outcomes after every retrieval attempt. */
export enum ReviewResult {
  KnowIt = 'know_it',
  NeededHelp = 'needed_help',
  Relearn = 'relearn',
}

/**
 * Spec section 11 — progressive recall exercise levels. Only FullRecitation and
 * FillInTheBlank have Recite-screen implementations in the MVP; the rest are modeled
 * now so the exercise-type column and review history are ready for them later.
 */
export enum ExerciseType {
  Recognition = 'recognition',
  FillInTheBlank = 'fill_in_the_blank',
  PhraseRecall = 'phrase_recall',
  FirstLetter = 'first_letter',
  ReferenceToVerse = 'reference_to_verse',
  VerseToReference = 'verse_to_reference',
  FullRecitation = 'full_recitation',
}

/** Spec section 16 — self-pacing controls how many New verses are surfaced per day. */
export type Pace = 'relaxed' | 'steady' | 'active' | 'custom'

export const PACE_VERSES_PER_WEEK: Record<Pace, number> = {
  relaxed: 0.35, // ~1-2 / month
  steady: 1, // 1 / week
  active: 2.5, // 2-3 / week
  custom: 1,
}

export const PACE_LABELS: Record<Pace, string> = {
  relaxed: 'Relaxed',
  steady: 'Steady',
  active: 'Active',
  custom: 'Custom',
}

/** Spec section 14 — internal strength score, surfaced to users only as a friendly label. */
interface StrengthBand {
  min: number
  max: number
  label: string
}

const STRENGTH_BANDS: StrengthBand[] = [
  { min: 0, max: 20, label: 'Learning' },
  { min: 21, max: 40, label: 'Emerging' },
  { min: 41, max: 60, label: 'Learned' },
  { min: 61, max: 80, label: 'Strong' },
  { min: 81, max: 100, label: 'Very Strong' },
]

export function strengthLabel(strength: number): string {
  const clamped = Math.min(100, Math.max(0, strength))
  return STRENGTH_BANDS.find((band) => clamped >= band.min && clamped <= band.max)?.label ?? 'Learning'
}

export type BibleTranslationCode = 'KJV' | 'WEB'

export const BIBLE_TRANSLATIONS: { code: BibleTranslationCode; displayName: string }[] = [
  { code: 'KJV', displayName: 'King James Version' },
  { code: 'WEB', displayName: 'World English Bible' },
]
