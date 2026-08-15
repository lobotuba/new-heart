import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

export const SETTING_KEYS = {
  translation: 'translation',
  pace: 'pace',
  customVersesPerWeek: 'customVersesPerWeek',
  pauseNewVerses: 'pauseNewVerses',
} as const

/** Reactive read of a single setting, with a default while it's still loading or unset. */
export function useSetting(key: string, defaultValue: string): string {
  const row = useLiveQuery(() => db.settings.get(key), [key])
  return row?.value ?? defaultValue
}
