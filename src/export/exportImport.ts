import { db } from '../db/db'
import type {
  Agenda,
  AgendaVerseLink,
  Collection,
  CollectionVerseLink,
  Memorization,
  ReviewEvent,
  Verse,
} from '../domain/models'

/**
 * Spec sections 25/28/30 — "your Scripture memory belongs to you". Cross-device data
 * access is file-based rather than a live shared database: exporting a snapshot and
 * importing it elsewhere merges by id (upsert) instead of overwriting, so importing an
 * older export can never destroy newer local progress. Drop the exported file in any
 * user-controlled synced folder (Google Drive, OneDrive, iCloud Drive) to carry it
 * between devices — there's never two live writers to one file, so there's no
 * shared-file corruption risk.
 */
export interface ExportPayload {
  formatVersion: 1
  exportedAt: number
  verses: Verse[]
  memorizations: Memorization[]
  reviewEvents: ReviewEvent[]
  agendas: Agenda[]
  collections: Collection[]
  agendaVerses: AgendaVerseLink[]
  collectionVerses: CollectionVerseLink[]
}

export async function buildExportPayload(): Promise<ExportPayload> {
  const [verses, memorizations, reviewEvents, agendas, collections, agendaVerses, collectionVerses] = await Promise.all([
    db.verses.toArray(),
    db.memorizations.toArray(),
    db.reviewEvents.toArray(),
    db.agendas.toArray(),
    db.collections.toArray(),
    db.agendaVerses.toArray(),
    db.collectionVerses.toArray(),
  ])
  return {
    formatVersion: 1,
    exportedAt: Date.now(),
    verses,
    memorizations,
    reviewEvents,
    agendas,
    collections,
    agendaVerses,
    collectionVerses,
  }
}

/** Triggers a browser download of a full snapshot as a JSON file. */
export async function downloadExport(): Promise<void> {
  const payload = await buildExportPayload()
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const dateStr = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `new-heart-export-${dateStr}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function isExportPayload(value: unknown): value is ExportPayload {
  if (value == null || typeof value !== 'object') return false
  const p = value as Record<string, unknown>
  return Array.isArray(p.verses) && Array.isArray(p.memorizations) && Array.isArray(p.reviewEvents)
}

async function dedupeJoinRows<T extends { id: number }>(
  rows: T[],
  keyOf: (item: T) => string,
  deleteByIds: (ids: number[]) => Promise<unknown>,
): Promise<void> {
  const sorted = [...rows].sort((a, b) => a.id - b.id)
  const seen = new Set<string>()
  const toDelete: number[] = []
  for (const row of sorted) {
    const key = keyOf(row)
    if (seen.has(key)) toDelete.push(row.id)
    else seen.add(key)
  }
  if (toDelete.length > 0) await deleteByIds(toDelete)
}

/** Parses and merges an exported JSON file into the local database, upserting by id. */
export async function importFromFile(file: File): Promise<{ versesImported: number; reviewsImported: number }> {
  const text = await file.text()
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (!isExportPayload(payload)) {
    throw new Error('That file does not look like a VerseMem export.')
  }

  await db.transaction(
    'rw',
    [db.verses, db.memorizations, db.reviewEvents, db.agendas, db.collections, db.agendaVerses, db.collectionVerses],
    async () => {
      if (payload.verses.length) await db.verses.bulkPut(payload.verses)
      if (payload.memorizations.length) await db.memorizations.bulkPut(payload.memorizations)
      if (payload.reviewEvents.length) await db.reviewEvents.bulkPut(payload.reviewEvents)
      if (payload.agendas.length) await db.agendas.bulkPut(payload.agendas)
      if (payload.collections.length) await db.collections.bulkPut(payload.collections)
      if (payload.agendaVerses.length) await db.agendaVerses.bulkPut(payload.agendaVerses)
      if (payload.collectionVerses.length) await db.collectionVerses.bulkPut(payload.collectionVerses)
    },
  )

  await dedupeJoinRows(await db.agendaVerses.toArray(), (l) => `${l.agendaId}:${l.verseId}`, (ids) => db.agendaVerses.bulkDelete(ids))
  await dedupeJoinRows(await db.collectionVerses.toArray(), (l) => `${l.collectionId}:${l.verseId}`, (ids) => db.collectionVerses.bulkDelete(ids))

  return { versesImported: payload.verses.length, reviewsImported: payload.reviewEvents.length }
}
