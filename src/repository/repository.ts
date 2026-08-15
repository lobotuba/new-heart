import { db } from '../db/db'
import { LearningState, ReviewResult, type ExerciseType } from '../domain/enums'
import type { Agenda, Collection, Memorization, MemorizationWithVerse, ReviewEvent, Verse } from '../domain/models'
import { RandomizedExpandingScheduler } from '../scheduling/randomizedExpandingScheduler'
import type { SchedulingAlgorithm } from '../scheduling/schedulingAlgorithm'

/**
 * Single data-access layer for the whole app. All persistence goes through here so
 * components never touch Dexie directly, and so the scheduling engine (spec section 35)
 * stays swappable without touching UI code.
 */
const scheduler: SchedulingAlgorithm = new RandomizedExpandingScheduler()

async function attachVerse(m: Memorization): Promise<MemorizationWithVerse> {
  const verse = await db.verses.get(m.verseId)
  if (!verse) throw new Error(`Verse ${m.verseId} not found for memorization ${m.id}`)
  return { memorization: m, verse }
}

async function attachVerses(list: Memorization[]): Promise<MemorizationWithVerse[]> {
  return Promise.all(list.map(attachVerse))
}

// ---------- Verse ----------

export async function addVerse(verse: Omit<Verse, 'id'>): Promise<number> {
  return db.verses.add(verse)
}

export async function allVerses(): Promise<Verse[]> {
  return db.verses.orderBy('book').toArray()
}

export async function getVerse(id: number): Promise<Verse | undefined> {
  return db.verses.get(id)
}

// ---------- Memorization ----------

/** Adds a verse to the New Queue (spec section 6) without requiring immediate memorization (section 4). */
export async function startMemorizing(verseId: number, nowMs = Date.now()): Promise<number> {
  return db.memorizations.add({
    verseId,
    status: LearningState.Scheduled,
    memoryStrength: 0,
    successStreakDays: [],
    createdAt: nowMs,
    startedAt: null,
    learnedAt: null,
    lastReviewedAt: null,
    nextReviewAt: nowMs,
    targetIntervalDays: 1,
    longestIntervalDays: 0,
  })
}

export async function isVerseBeingMemorized(verseId: number): Promise<boolean> {
  const existing = await db.memorizations.where('verseId').equals(verseId).first()
  return existing != null
}

/** New Queue = not yet reached Learned/Retention (spec sections 6-7). */
export async function newQueue(): Promise<MemorizationWithVerse[]> {
  const rows = await db.memorizations
    .where('status')
    .anyOf(LearningState.Scheduled, LearningState.Learning)
    .toArray()
  return attachVerses(rows)
}

export async function retentionQueue(): Promise<MemorizationWithVerse[]> {
  const rows = await db.memorizations.where('status').equals(LearningState.Retention).toArray()
  return attachVerses(rows)
}

export async function relearnQueue(): Promise<MemorizationWithVerse[]> {
  const rows = await db.memorizations.where('status').equals(LearningState.Relearning).toArray()
  return attachVerses(rows)
}

export async function dueForReview(nowMs = Date.now()): Promise<MemorizationWithVerse[]> {
  const rows = await db.memorizations
    .where('status')
    .anyOf(LearningState.Learning, LearningState.Retention, LearningState.Relearning)
    .and((m) => m.nextReviewAt != null && m.nextReviewAt <= nowMs)
    .toArray()
  return attachVerses(rows)
}

/** Spec section 19 — a random already-learned verse, independent of the schedule. */
export async function randomChallengeVerse(): Promise<MemorizationWithVerse | undefined> {
  const rows = await db.memorizations.where('status').anyOf(LearningState.Learned, LearningState.Retention).toArray()
  if (rows.length === 0) return undefined
  const pick = rows[Math.floor(Math.random() * rows.length)]
  return attachVerse(pick)
}

export async function memorizationDetail(id: number): Promise<MemorizationWithVerse | undefined> {
  const row = await db.memorizations.get(id)
  return row ? attachVerse(row) : undefined
}

export async function allMemorizationsWithVerse(): Promise<MemorizationWithVerse[]> {
  const rows = await db.memorizations.toArray()
  return attachVerses(rows)
}

export async function statusCounts(): Promise<Record<LearningState, number>> {
  const all = await db.memorizations.toArray()
  const counts = Object.fromEntries(Object.values(LearningState).map((s) => [s, 0])) as Record<LearningState, number>
  for (const m of all) counts[m.status]++
  return counts
}

/**
 * Records a self-evaluation (spec section 10) and advances the scheduler (spec sections
 * 3, 13, 35) in one transaction. This is the only write path for a Recite outcome —
 * components never edit scheduling fields directly.
 */
export async function recordReview(
  memorizationId: number,
  result: ReviewResult,
  exerciseType: ExerciseType,
  nowMs = Date.now(),
): Promise<void> {
  await db.transaction('rw', db.memorizations, db.reviewEvents, async () => {
    const current = await db.memorizations.get(memorizationId)
    if (!current) throw new Error(`Memorization ${memorizationId} not found`)
    const update = scheduler.computeNext(current, result, nowMs)
    await db.memorizations.put({ ...current, ...update, id: memorizationId })
    await db.reviewEvents.add({ memorizationId, timestamp: nowMs, result, exerciseType })
  })
}

export async function reviewsFor(memorizationId: number): Promise<ReviewEvent[]> {
  return db.reviewEvents.where('memorizationId').equals(memorizationId).reverse().sortBy('timestamp')
}

// ---------- Agenda ----------

export async function addAgenda(agenda: Omit<Agenda, 'id'>): Promise<number> {
  return db.agendas.add(agenda)
}

export async function allAgendas(): Promise<Agenda[]> {
  const rows = await db.agendas.toArray()
  return rows.sort((a, b) => (a.targetDate ?? '9999-99-99').localeCompare(b.targetDate ?? '9999-99-99'))
}

export async function deleteAgenda(id: number): Promise<void> {
  await db.transaction('rw', db.agendas, db.agendaVerses, async () => {
    await db.agendaVerses.where('agendaId').equals(id).delete()
    await db.agendas.delete(id)
  })
}

export async function linkVerseToAgenda(agendaId: number, verseId: number): Promise<void> {
  const existing = await db.agendaVerses.where({ agendaId, verseId }).first()
  if (!existing) await db.agendaVerses.add({ agendaId, verseId })
}

export async function versesForAgenda(agendaId: number): Promise<Verse[]> {
  const links = await db.agendaVerses.where('agendaId').equals(agendaId).toArray()
  const verses = await Promise.all(links.map((l) => db.verses.get(l.verseId)))
  return verses.filter((v): v is Verse => v != null)
}

// ---------- Collection ----------

export async function addCollection(collection: Omit<Collection, 'id'>): Promise<number> {
  return db.collections.add(collection)
}

export async function allCollections(): Promise<Collection[]> {
  return db.collections.orderBy('name').toArray()
}

export async function deleteCollection(id: number): Promise<void> {
  await db.transaction('rw', db.collections, db.collectionVerses, async () => {
    await db.collectionVerses.where('collectionId').equals(id).delete()
    await db.collections.delete(id)
  })
}

export async function linkVerseToCollection(collectionId: number, verseId: number): Promise<void> {
  const existing = await db.collectionVerses.where({ collectionId, verseId }).first()
  if (!existing) await db.collectionVerses.add({ collectionId, verseId })
}

export async function versesForCollection(collectionId: number): Promise<Verse[]> {
  const links = await db.collectionVerses.where('collectionId').equals(collectionId).toArray()
  const verses = await Promise.all(links.map((l) => db.verses.get(l.verseId)))
  return verses.filter((v): v is Verse => v != null)
}

// ---------- Settings ----------

export async function getSetting(key: string): Promise<string | undefined> {
  const row = await db.settings.get(key)
  return row?.value
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value })
}
