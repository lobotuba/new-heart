import { useRef, useState, type ChangeEvent } from 'react'
import { BIBLE_TRANSLATIONS, PACE_LABELS, type BibleTranslationCode, type Pace } from '../domain/enums'
import * as repo from '../repository/repository'
import { SETTING_KEYS, useSetting } from '../repository/useSetting'
import { downloadExport, importFromFile } from '../export/exportImport'
import { Button, Card, ScreenHeader } from './ui'

const PACES: Pace[] = ['relaxed', 'steady', 'active', 'custom']

export default function Settings() {
  const translation = useSetting(SETTING_KEYS.translation, 'KJV') as BibleTranslationCode
  const pace = useSetting(SETTING_KEYS.pace, 'steady') as Pace
  const customVpw = useSetting(SETTING_KEYS.customVersesPerWeek, '1')
  const paused = useSetting(SETTING_KEYS.pauseNewVerses, 'false') === 'true'

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await importFromFile(file)
      setImportMessage(`Imported ${result.versesImported} verses and ${result.reviewsImported} review events.`)
    } catch (err) {
      setImportMessage(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-lg">
      <ScreenHeader title="Settings" subtitle="Your Scripture memory belongs to you." />

      <Card className="mb-5">
        <h2 className="font-semibold text-slate-800 mb-3">Bible Version</h2>
        <div className="flex gap-2">
          {BIBLE_TRANSLATIONS.map((t) => (
            <Button
              key={t.code}
              variant={translation === t.code ? 'primary' : 'secondary'}
              onClick={() => repo.setSetting(SETTING_KEYS.translation, t.code)}
            >
              {t.code}
            </Button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">Applies to verses added from the Starter Pack.</p>
      </Card>

      <Card className="mb-5">
        <h2 className="font-semibold text-slate-800 mb-3">Pace</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {PACES.map((p) => (
            <Button key={p} variant={pace === p ? 'primary' : 'secondary'} onClick={() => repo.setSetting(SETTING_KEYS.pace, p)}>
              {PACE_LABELS[p]}
            </Button>
          ))}
        </div>
        {pace === 'custom' && (
          <label className="text-sm text-slate-500">
            New verses per week
            <input
              type="number"
              min={0}
              step={0.5}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 mt-1"
              value={customVpw}
              onChange={(e) => repo.setSetting(SETTING_KEYS.customVersesPerWeek, e.target.value)}
            />
          </label>
        )}
        <label className="flex items-center gap-2 mt-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={paused}
            onChange={(e) => repo.setSetting(SETTING_KEYS.pauseNewVerses, e.target.checked ? 'true' : 'false')}
          />
          Pause new verses (keep retention reviews going)
        </label>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-800 mb-2">Your Data</h2>
        <p className="text-sm text-slate-500 mb-4">
          Everything stays on this device. Export a snapshot to back it up or carry it to another device — save the
          file in a folder your cloud drive already syncs (Google Drive, OneDrive, iCloud) and import it there.
          Importing merges with what's already on that device, so it's safe to do in either direction.
        </p>
        <div className="flex gap-2">
          <Button onClick={downloadExport}>Export Data</Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>Import Data</Button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </div>
        {importMessage && <p className="text-sm text-brand-600 mt-3">{importMessage}</p>}
      </Card>
    </div>
  )
}
