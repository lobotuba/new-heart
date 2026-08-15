import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ExerciseType, ReviewResult } from '../domain/enums'
import { verseReference } from '../domain/models'
import { PASS_THRESHOLD, recallScore } from '../domain/recallScore'
import * as repo from '../repository/repository'
import { Button, Card } from './ui'

type Phase = 'read' | 'recall' | 'revealed' | 'result'

const RESULT_COPY: Record<ReviewResult, { heading: string; body: string }> = {
  [ReviewResult.KnowIt]: { heading: "You've got this.", body: "You're making progress." },
  [ReviewResult.NeededHelp]: { heading: 'Not a failure — keep going.', body: "We'll bring this one back around soon." },
  [ReviewResult.Relearn]: { heading: "Let's relearn this one.", body: 'No problem. Every verse takes a few passes.' },
}

const MAX_HINT_FRACTION = 0.6

function scoreBand(score: number): { label: string; tone: string } {
  if (score >= PASS_THRESHOLD) return { label: 'Nice recall!', tone: 'text-emerald-600' }
  if (score >= 0.5) return { label: 'Getting there — a bit more to go.', tone: 'text-amber-600' }
  return { label: "Let's build this up more.", tone: 'text-slate-500' }
}

export default function Recite({ memorizationId, onDone }: { memorizationId: number; onDone: () => void }) {
  const detail = useLiveQuery(() => repo.memorizationDetail(memorizationId), [memorizationId])
  const reviews = useLiveQuery(() => repo.reviewsFor(memorizationId), [memorizationId])

  const [phase, setPhase] = useState<Phase | null>(null)
  const [attempt, setAttempt] = useState('')
  const [checkedScore, setCheckedScore] = useState<number | null>(null)
  const [hintWordCount, setHintWordCount] = useState(0)
  const [result, setResult] = useState<ReviewResult | null>(null)

  if (!detail || reviews == null) {
    return <Card className="text-center text-slate-400">Loading…</Card>
  }

  const isFirstExposure = reviews.length === 0
  const exerciseType = ExerciseType.FullRecitation
  const currentPhase = phase ?? (isFirstExposure ? 'read' : 'recall')
  const { verse } = detail
  const verseWords = verse.text.split(' ')
  const maxHintWords = Math.max(1, Math.ceil(verseWords.length * MAX_HINT_FRACTION))

  function checkRecall() {
    const score = recallScore(attempt, verse.text)
    setCheckedScore(score)
    if (score >= PASS_THRESHOLD) setPhase('revealed')
  }

  async function evaluate(chosen: ReviewResult) {
    await repo.recordReview(memorizationId, chosen, exerciseType)
    setResult(chosen)
    setPhase('result')
  }

  return (
    <Card className="max-w-xl mx-auto">
      <p className="text-sm font-semibold text-brand-600 mb-1">{verseReference(verse)}</p>
      <p className="text-xs text-slate-400 mb-4">{verse.translation}</p>

      {currentPhase === 'read' && (
        <>
          <p className="font-serif-scripture text-lg leading-relaxed text-slate-800 mb-6">{verse.text}</p>
          <p className="text-slate-500 text-sm mb-4">Read it over a couple of times, then give recall a try.</p>
          <Button onClick={() => setPhase('recall')}>I'm ready to recall →</Button>
        </>
      )}

      {currentPhase === 'recall' && (
        <>
          {hintWordCount > 0 && (
            <p className="text-sm text-slate-500 mb-3">
              Hint: <span className="font-serif-scripture text-slate-700">{verseWords.slice(0, hintWordCount).join(' ')}…</span>
            </p>
          )}
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 min-h-28 font-serif-scripture text-lg mb-3"
            placeholder="Type what you remember…"
            value={attempt}
            onChange={(e) => {
              setAttempt(e.target.value)
              setCheckedScore(null)
            }}
          />
          {checkedScore != null && checkedScore < PASS_THRESHOLD && (
            <p className={`text-sm mb-3 ${scoreBand(checkedScore).tone}`}>{scoreBand(checkedScore).label}</p>
          )}
          <div className="flex flex-wrap gap-2 mb-2">
            <Button onClick={checkRecall} disabled={attempt.trim().length === 0}>Check My Recall</Button>
            <Button
              variant="secondary"
              disabled={hintWordCount >= maxHintWords}
              onClick={() => setHintWordCount((n) => Math.min(maxHintWords, n + 1))}
            >
              💡 Hint
            </Button>
          </div>
          <button className="text-sm text-slate-400 underline mt-2" onClick={() => setPhase('revealed')}>
            I'd rather just see it
          </button>
        </>
      )}

      {currentPhase === 'revealed' && (
        <>
          {checkedScore != null && (
            <p className={`text-sm font-medium mb-3 ${scoreBand(checkedScore).tone}`}>{scoreBand(checkedScore).label}</p>
          )}
          {attempt.trim().length > 0 && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Your recall</p>
              <p className="text-slate-500">{attempt}</p>
            </div>
          )}
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">The verse</p>
            <p className="font-serif-scripture text-lg leading-relaxed text-slate-800">{verse.text}</p>
          </div>
          <p className="text-slate-500 text-sm mb-4">How did that go?</p>
          <div className="flex flex-col gap-2">
            <Button variant="primary" onClick={() => evaluate(ReviewResult.KnowIt)}>✅ I Know It</Button>
            <Button variant="warm" onClick={() => evaluate(ReviewResult.NeededHelp)}>⚠️ I Needed a Little Help</Button>
            <Button variant="secondary" onClick={() => evaluate(ReviewResult.Relearn)}>🔄 Let's Relearn This One</Button>
          </div>
        </>
      )}

      {currentPhase === 'result' && result && (
        <div className="text-center py-4">
          <p className="text-xl font-bold text-slate-800 mb-2">{RESULT_COPY[result].heading}</p>
          <p className="text-slate-500 mb-6">{RESULT_COPY[result].body}</p>
          <Button onClick={onDone}>Continue</Button>
        </div>
      )}
    </Card>
  )
}
