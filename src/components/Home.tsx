import { useLiveQuery } from 'dexie-react-hooks'
import { type Pace, PACE_VERSES_PER_WEEK } from '../domain/enums'
import { verseReference } from '../domain/models'
import * as repo from '../repository/repository'
import { SETTING_KEYS, useSetting } from '../repository/useSetting'
import type { Screen } from './screens'
import { Button, Card, EmptyState, ScreenHeader } from './ui'

export default function Home({ onRecite, onNavigate }: { onRecite: (id: number) => void; onNavigate: (screen: Screen) => void }) {
  const pace = useSetting(SETTING_KEYS.pace, 'steady') as Pace
  const customVpw = Number(useSetting(SETTING_KEYS.customVersesPerWeek, '1')) || 1
  const paused = useSetting(SETTING_KEYS.pauseNewVerses, 'false') === 'true'

  const versesPerWeek = pace === 'custom' ? customVpw : PACE_VERSES_PER_WEEK[pace]
  const dailyNewLimit = paused ? 0 : Math.max(1, Math.ceil(versesPerWeek / 7))

  const newQueue = useLiveQuery(() => repo.newQueue(), [])
  const due = useLiveQuery(() => repo.dueForReview(), [])
  const challenge = useLiveQuery(() => repo.randomChallengeVerse(), [])

  const newToShow = (newQueue ?? []).slice(0, dailyNewLimit)
  const loaded = newQueue != null && due != null

  const nothingToDo = loaded && newToShow.length === 0 && (due?.length ?? 0) === 0 && !challenge

  return (
    <div>
      <ScreenHeader title="Today's Scripture Memory" subtitle="No quotas. No guilt. Just opportunities." />

      {!loaded && <EmptyState message="Loading…" />}

      {nothingToDo && (
        <Card>
          <p className="text-slate-600">Your Scripture is waiting whenever you are.</p>
          <Button className="mt-4" onClick={() => onNavigate('addVerse')}>
            Add a verse
          </Button>
        </Card>
      )}

      {newToShow.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-brand-500 mb-2">New</h2>
          <div className="flex flex-col gap-3">
            {newToShow.map((mv) => (
              <Card key={mv.memorization.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{verseReference(mv.verse)}</p>
                  <p className="text-slate-400 text-sm">Let's learn this one.</p>
                </div>
                <Button onClick={() => onRecite(mv.memorization.id)}>Start</Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {due != null && due.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-brand-500 mb-2">Remember</h2>
          <div className="flex flex-col gap-3">
            {due.map((mv) => (
              <Card key={mv.memorization.id} className="flex items-center justify-between">
                <p className="font-semibold text-slate-800">{verseReference(mv.verse)}</p>
                <Button onClick={() => onRecite(mv.memorization.id)}>🎙 Recite</Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {challenge && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-2">Memory Challenge</h2>
          <Card className="bg-amber-50 border-amber-200">
            <p className="text-slate-600 mb-3">Can you remember a Scripture you've learned previously?</p>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-800">{verseReference(challenge.verse)}</p>
              <Button variant="warm" onClick={() => onRecite(challenge.memorization.id)}>🎙 Recite</Button>
            </div>
          </Card>
        </section>
      )}
    </div>
  )
}
