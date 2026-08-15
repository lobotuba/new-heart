import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ExerciseType, LearningState, ReviewResult } from '../domain/enums'
import { verseReference } from '../domain/models'
import * as repo from '../repository/repository'
import { Button, Card } from './ui'

type Phase = 'read' | 'hidden' | 'revealed' | 'result'

const RESULT_COPY: Record<ReviewResult, { heading: string; body: string }> = {
  [ReviewResult.KnowIt]: { heading: "You've got this.", body: "You're making progress." },
  [ReviewResult.NeededHelp]: { heading: 'Not a failure — keep going.', body: "We'll bring this one back around soon." },
  [ReviewResult.Relearn]: { heading: "Let's relearn this one.", body: 'No problem. Every verse takes a few passes.' },
}

/** Masks roughly a third of the words for the Fill-in-the-Blank exercise (spec section 11, level 2). */
function maskText(text: string): string {
  const words = text.split(' ')
  return words
    .map((word, i) => {
      const bare = word.replace(/[.,;:!?"']/g, '')
      if (bare.length > 3 && i % 3 === 1) {
        return '_'.repeat(bare.length) + word.slice(bare.length)
      }
      return word
    })
    .join(' ')
}

export default function Recite({ memorizationId, onDone }: { memorizationId: number; onDone: () => void }) {
  const detail = useLiveQuery(() => repo.memorizationDetail(memorizationId), [memorizationId])
  const reviews = useLiveQuery(() => repo.reviewsFor(memorizationId), [memorizationId])

  const isFirstExposure = reviews != null && reviews.length === 0
  const exerciseType = useMemo<ExerciseType>(() => {
    if (isFirstExposure) return ExerciseType.FullRecitation
    if (detail?.memorization.status === LearningState.Learning) return ExerciseType.FillInTheBlank
    return ExerciseType.FullRecitation
  }, [isFirstExposure, detail?.memorization.status])

  const [phase, setPhase] = useState<Phase | null>(null)
  const [result, setResult] = useState<ReviewResult | null>(null)

  if (!detail || reviews == null) {
    return <Card className="text-center text-slate-400">Loading…</Card>
  }

  const currentPhase = phase ?? (isFirstExposure ? 'read' : 'hidden')
  const { verse } = detail

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
          <Button onClick={() => setPhase('hidden')}>I'm ready to recall →</Button>
        </>
      )}

      {currentPhase === 'hidden' && (
        <>
          {exerciseType === ExerciseType.FillInTheBlank ? (
            <p className="font-serif-scripture text-lg leading-relaxed text-slate-800 mb-6">{maskText(verse.text)}</p>
          ) : (
            <div className="rounded-xl bg-brand-50 text-brand-700 py-10 text-center mb-6">
              🎙 <span className="font-medium">Recite {verseReference(verse)} from memory</span>
            </div>
          )}
          <Button onClick={() => setPhase('revealed')}>Show Answer</Button>
        </>
      )}

      {currentPhase === 'revealed' && (
        <>
          <p className="font-serif-scripture text-lg leading-relaxed text-slate-800 mb-6">{verse.text}</p>
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
