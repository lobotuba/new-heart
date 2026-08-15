import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Agenda, Verse } from '../domain/models'
import { verseReference } from '../domain/models'
import * as repo from '../repository/repository'
import { Badge, Button, Card, EmptyState, ScreenHeader } from './ui'

/** Spec section 5: agendas represent goals, not requirements — a missed target date is never punitive. */
export default function Agendas() {
  const agendas = useLiveQuery(() => repo.allAgendas(), [])
  const verses = useLiveQuery(() => repo.allVerses(), [])
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      <ScreenHeader title="Agendas" subtitle="Scripture tied to Awana, church, Bible study, or anything else on your calendar." />
      <Button className="mb-5" onClick={() => setShowForm((v) => !v)}>
        {showForm ? 'Close' : '+ New Agenda'}
      </Button>
      {showForm && <AgendaForm onDone={() => setShowForm(false)} />}

      {agendas != null && agendas.length === 0 && <EmptyState message="No agendas yet." />}
      <div className="flex flex-col gap-4 mt-2">
        {agendas?.map((a) => <AgendaCard key={a.id} agenda={a} verses={verses ?? []} />)}
      </div>
    </div>
  )
}

function AgendaForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [targetDate, setTargetDate] = useState('')

  async function submit() {
    if (!title.trim()) return
    await repo.addAgenda({ title: title.trim(), startDate: startDate || null, targetDate: targetDate || null, priority: 0 })
    onDone()
  }

  return (
    <Card className="max-w-lg mb-5">
      <input className="w-full rounded-xl border border-slate-200 px-3 py-2 mb-3" placeholder="Title (e.g. Awana Week 4)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="text-xs text-slate-500">
          Start
          <input type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2 mt-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="text-xs text-slate-500">
          Goal
          <input type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2 mt-1" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </label>
      </div>
      <Button onClick={submit}>Create Agenda</Button>
    </Card>
  )
}

function AgendaCard({ agenda, verses }: { agenda: Agenda; verses: Verse[] }) {
  const linked = useLiveQuery(() => repo.versesForAgenda(agenda.id), [agenda.id])
  const [linking, setLinking] = useState(false)
  const [pickId, setPickId] = useState<number | ''>('')

  async function link() {
    if (pickId === '') return
    await repo.linkVerseToAgenda(agenda.id, Number(pickId))
    setLinking(false)
    setPickId('')
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-800">{agenda.title}</p>
          {agenda.targetDate && <Badge tone="amber">Goal: {agenda.targetDate}</Badge>}
        </div>
        <Button variant="ghost" onClick={() => repo.deleteAgenda(agenda.id)}>Remove</Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {linked?.map((v) => (
          <Badge key={v.id} tone="brand">{verseReference(v)}</Badge>
        ))}
        {linked?.length === 0 && <span className="text-sm text-slate-400">No verses linked yet.</span>}
      </div>
      <div className="mt-3">
        {!linking && (
          <Button variant="ghost" onClick={() => setLinking(true)}>+ Link a verse</Button>
        )}
        {linking && (
          <div className="flex gap-2">
            <select className="rounded-xl border border-slate-200 px-3 py-2 flex-1" value={pickId} onChange={(e) => setPickId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Choose a verse…</option>
              {verses.map((v) => (
                <option key={v.id} value={v.id}>{verseReference(v)}</option>
              ))}
            </select>
            <Button onClick={link}>Link</Button>
          </div>
        )}
      </div>
    </Card>
  )
}
