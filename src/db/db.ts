import Dexie, { type EntityTable } from 'dexie'
import type {
  Agenda,
  AgendaVerseLink,
  AppSetting,
  Collection,
  CollectionVerseLink,
  Memorization,
  ReviewEvent,
  Verse,
} from '../domain/models'

/** IndexedDB schema (via Dexie) — the browser-side analog of the SQLDelight schema from the original KMP plan. */
export class NewHeartDB extends Dexie {
  verses!: EntityTable<Verse, 'id'>
  memorizations!: EntityTable<Memorization, 'id'>
  reviewEvents!: EntityTable<ReviewEvent, 'id'>
  agendas!: EntityTable<Agenda, 'id'>
  agendaVerses!: EntityTable<AgendaVerseLink, 'id'>
  collections!: EntityTable<Collection, 'id'>
  collectionVerses!: EntityTable<CollectionVerseLink, 'id'>
  settings!: EntityTable<AppSetting, 'key'>

  constructor() {
    super('new-heart')
    this.version(1).stores({
      verses: '++id, book, translation',
      memorizations: '++id, verseId, status, nextReviewAt',
      reviewEvents: '++id, memorizationId, timestamp',
      agendas: '++id, targetDate',
      agendaVerses: '++id, agendaId, verseId, [agendaId+verseId]',
      collections: '++id, name',
      collectionVerses: '++id, collectionId, verseId, [collectionId+verseId]',
      settings: '&key',
    })
  }
}

export const db = new NewHeartDB()
