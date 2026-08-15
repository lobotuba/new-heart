import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BIBLE_TRANSLATIONS, type BibleTranslationCode } from '../domain/enums'
import * as repo from '../repository/repository'
import { SETTING_KEYS, useSetting } from '../repository/useSetting'
import { starterVersePack, starterVerseReference } from '../content/starterVerses'
import { Badge, Button, Card, EmptyState, ScreenHeader } from './ui'

type Tab = 'pack' | 'manual'

export interface ManualPrefill {
  book: string
  chapter: string
  verseStart: string
  verseEnd: string
  translation: string
}

export default function AddVerse() {
  const [tab, setTab] = useState<Tab>('pack')
  const defaultTranslation = useSetting(SETTING_KEYS.translation, 'KJV') as BibleTranslationCode
  const translationInfo = BIBLE_TRANSLATIONS.find((t) => t.code === defaultTranslation) ?? BIBLE_TRANSLATIONS[0]
  const allVerses = useLiveQuery(() => repo.allVerses(), [])
  const [query, setQuery] = useState('')
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const [manualPrefill, setManualPrefill] = useState<ManualPrefill | null>(null)
  const [prefillKey, setPrefillKey] = useState(0)

  const alreadyAdded = new Set((allVerses ?? []).map((v) => `${v.book} ${v.chapter}:${v.verseStart}|${v.translation}`))

  const filtered = starterVersePack.filter((v) => starterVerseReference(v).toLowerCase().includes(query.toLowerCase()))

  async function addFromPack(v: (typeof starterVersePack)[number]) {
    if (!translationInfo.bundledText) {
      // ESV (and any other non-bundled translation) has no text shipped in the app — hand off
      // to Manual Entry pre-filled with the reference, so the user pastes their own verified text.
      setManualPrefill({
        book: v.book,
        chapter: String(v.chapter),
        verseStart: String(v.verseStart),
        verseEnd: String(v.verseEnd),
        translation: defaultTranslation,
      })
      setPrefillKey((k) => k + 1)
      setTab('manual')
      return
    }
    const text = defaultTranslation === 'WEB' ? v.webText : v.kjvText
    const verseId = await repo.addVerse({
      book: v.book,
      chapter: v.chapter,
      verseStart: v.verseStart,
      verseEnd: v.verseEnd,
      translation: defaultTranslation,
      text,
    })
    await repo.startMemorizing(verseId)
    setJustAdded(starterVerseReference(v))
  }

  return (
    <div>
      <ScreenHeader title="Add Scripture" subtitle="Encounter a verse anywhere — add it here, memorize it whenever you're ready." />

      <div className="flex gap-2 mb-5">
        <Button variant={tab === 'pack' ? 'primary' : 'secondary'} onClick={() => setTab('pack')}>
          Starter Pack
        </Button>
        <Button variant={tab === 'manual' ? 'primary' : 'secondary'} onClick={() => setTab('manual')}>
          Manual Entry
        </Button>
      </div>

      {tab === 'pack' && (
        <div>
          {!translationInfo.bundledText && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4">
              {translationInfo.displayName} text isn't bundled in the app (it's not public domain). Picking a verse below
              takes you to Manual Entry with the reference filled in — paste your own text there.
            </p>
          )}
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 mb-4"
            placeholder="Search by reference (e.g. John 3:16)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {justAdded && <p className="text-sm text-brand-600 mb-3">Added {justAdded} — it's in your New Queue.</p>}
          <div className="flex flex-col gap-2 max-h-[28rem] overflow-y-auto">
            {filtered.length === 0 && <EmptyState message="No verses match that search." />}
            {filtered.map((v) => {
              const ref = starterVerseReference(v)
              const added = translationInfo.bundledText && alreadyAdded.has(`${ref}|${defaultTranslation}`)
              return (
                <Card key={ref} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-slate-800">{ref}</p>
                    <Badge tone="slate">{defaultTranslation}</Badge>
                  </div>
                  <Button variant={added ? 'ghost' : 'secondary'} disabled={added} onClick={() => addFromPack(v)}>
                    {added ? 'Added' : translationInfo.bundledText ? 'Add' : 'Use Manual Entry →'}
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'manual' && <ManualEntryForm key={prefillKey} defaultTranslation={defaultTranslation} initial={manualPrefill} />}
    </div>
  )
}

function ManualEntryForm({ defaultTranslation, initial }: { defaultTranslation: BibleTranslationCode; initial: ManualPrefill | null }) {
  const [book, setBook] = useState(initial?.book ?? '')
  const [chapter, setChapter] = useState(initial?.chapter ?? '')
  const [verseStart, setVerseStart] = useState(initial?.verseStart ?? '')
  const [verseEnd, setVerseEnd] = useState(initial?.verseEnd ?? '')
  const [translation, setTranslation] = useState<string>(initial?.translation ?? defaultTranslation)
  const [text, setText] = useState('')
  const [startNow, setStartNow] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  const canSubmit = book.trim() && chapter && verseStart && text.trim()

  async function submit() {
    const vs = Number(verseStart)
    const ve = verseEnd ? Number(verseEnd) : vs
    const verseId = await repo.addVerse({
      book: book.trim(),
      chapter: Number(chapter),
      verseStart: vs,
      verseEnd: ve,
      translation: translation.trim() || 'Custom',
      text: text.trim(),
    })
    if (startNow) await repo.startMemorizing(verseId)
    setMessage(`Added ${book.trim()} ${chapter}:${vs}${ve !== vs ? `-${ve}` : ''}.`)
    setBook('')
    setChapter('')
    setVerseStart('')
    setVerseEnd('')
    setText('')
  }

  return (
    <Card className="max-w-lg">
      {message && <p className="text-sm text-brand-600 mb-3">{message}</p>}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <input className="col-span-3 rounded-xl border border-slate-200 px-3 py-2" placeholder="Book (e.g. Philippians)" value={book} onChange={(e) => setBook(e.target.value)} />
        <input className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Chapter" type="number" value={chapter} onChange={(e) => setChapter(e.target.value)} />
        <input className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Verse start" type="number" value={verseStart} onChange={(e) => setVerseStart(e.target.value)} />
        <input className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Verse end (opt.)" type="number" value={verseEnd} onChange={(e) => setVerseEnd(e.target.value)} />
      </div>
      <input className="w-full rounded-xl border border-slate-200 px-3 py-2 mb-3" placeholder="Translation (e.g. ESV, NIV, KJV)" value={translation} onChange={(e) => setTranslation(e.target.value)} />
      <textarea className="w-full rounded-xl border border-slate-200 px-3 py-2 mb-3 min-h-28" placeholder="Paste the verse text" value={text} onChange={(e) => setText(e.target.value)} />
      <label className="flex items-center gap-2 mb-4 text-sm text-slate-600">
        <input type="checkbox" checked={startNow} onChange={(e) => setStartNow(e.target.checked)} />
        Start memorizing now (otherwise it's just saved to your collection)
      </label>
      <Button disabled={!canSubmit} onClick={submit}>Save Verse</Button>
    </Card>
  )
}
