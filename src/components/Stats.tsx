import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { LearningState, ReviewResult, strengthLabel } from '../domain/enums'
import type { MemorizationWithVerse } from '../domain/models'
import { verseReference } from '../domain/models'
import * as repo from '../repository/repository'
import { Badge, Card, EmptyState, ScreenHeader } from './ui'

function daysAgo(timestamp: number): number {
  return Math.max(0, Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000)))
}

/** Spec section 21: positive-framed retention metrics — never a percentage or grade. */
export default function Stats() {
  const verses = useLiveQuery(() => repo.allVerses(), [])
  const all = useLiveQuery(() => repo.allMemorizationsWithVerse(), [])

  const strong = all?.filter((m) => m.memorization.status === LearningState.Retention || m.memorization.status === LearningState.Learned).length ?? 0
  const learning = all?.filter((m) => m.memorization.status === LearningState.Scheduled || m.memorization.status === LearningState.Learning).length ?? 0
  const relearning = all?.filter((m) => m.memorization.status === LearningState.Relearning).length ?? 0

  return (
    <div>
      <ScreenHeader title="Your Scripture Memory" subtitle="Progress, not grades." />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatTile label="Scriptures" value={verses?.length ?? 0} />
        <StatTile label="Strong" value={strong} tone="brand" />
        <StatTile label="Learning" value={learning} tone="amber" />
        <StatTile label="Relearning" value={relearning} tone="slate" />
      </div>

      {all != null && all.length === 0 && <EmptyState message="Add a verse to start tracking your progress." />}
      <div className="flex flex-col gap-2">
        {all?.map((mv) => <VerseStatRow key={mv.memorization.id} mv={mv} />)}
      </div>
    </div>
  )
}

function StatTile({ label, value, tone = 'slate' }: { label: string; value: number; tone?: 'brand' | 'amber' | 'slate' }) {
  const toneClass = { brand: 'text-brand-600', amber: 'text-amber-600', slate: 'text-slate-700' }[tone]
  return (
    <Card className="text-center py-4">
      <p className={`text-3xl font-bold ${toneClass}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </Card>
  )
}

function VerseStatRow({ mv }: { mv: MemorizationWithVerse }) {
  const [open, setOpen] = useState(false)
  const reviews = useLiveQuery(() => (open ? repo.reviewsFor(mv.memorization.id) : Promise.resolve(undefined)), [open, mv.memorization.id])
  const successfulRecalls = reviews?.filter((r) => r.result === ReviewResult.KnowIt).length

  return (
    <Card className="cursor-pointer">
      <button className="w-full text-left" onClick={() => setOpen((v) => !v)}>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-800">{verseReference(mv.verse)}</p>
          <Badge tone="brand">{strengthLabel(mv.memorization.memoryStrength)}</Badge>
        </div>
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-600 space-y-1">
          <p>Status: {strengthLabel(mv.memorization.memoryStrength)}</p>
          <p>Successful Recalls: {successfulRecalls ?? '…'}</p>
          <p>Longest Interval: {mv.memorization.longestIntervalDays} Days</p>
          {mv.memorization.lastReviewedAt && <p>Last Recall: {daysAgo(mv.memorization.lastReviewedAt)} Days Ago</p>}
        </div>
      )}
    </Card>
  )
}
