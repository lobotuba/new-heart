import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Collection, Verse } from '../domain/models'
import { verseReference } from '../domain/models'
import * as repo from '../repository/repository'
import { Badge, Button, Card, EmptyState, ScreenHeader } from './ui'

/** Spec section 32: a verse may belong to multiple collections (Salvation, Trinity, Family, Awana, …). */
export default function Collections() {
  const collections = useLiveQuery(() => repo.allCollections(), [])
  const verses = useLiveQuery(() => repo.allVerses(), [])
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      <ScreenHeader title="Collections" subtitle="Group verses by theme — Salvation, Trinity, Family, Awana, Personal Favorites." />
      <Button className="mb-5" onClick={() => setShowForm((v) => !v)}>
        {showForm ? 'Close' : '+ New Collection'}
      </Button>
      {showForm && <CollectionForm onDone={() => setShowForm(false)} />}

      {collections != null && collections.length === 0 && <EmptyState message="No collections yet." />}
      <div className="flex flex-col gap-4 mt-2">
        {collections?.map((c) => <CollectionCard key={c.id} collection={c} verses={verses ?? []} />)}
      </div>
    </div>
  )
}

function CollectionForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  async function submit() {
    if (!name.trim()) return
    await repo.addCollection({ name: name.trim(), description: description.trim() })
    onDone()
  }

  return (
    <Card className="max-w-lg mb-5">
      <input className="w-full rounded-xl border border-slate-200 px-3 py-2 mb-3" placeholder="Name (e.g. Salvation)" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="w-full rounded-xl border border-slate-200 px-3 py-2 mb-4" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Button onClick={submit}>Create Collection</Button>
    </Card>
  )
}

function CollectionCard({ collection, verses }: { collection: Collection; verses: Verse[] }) {
  const linked = useLiveQuery(() => repo.versesForCollection(collection.id), [collection.id])
  const [linking, setLinking] = useState(false)
  const [pickId, setPickId] = useState<number | ''>('')

  async function link() {
    if (pickId === '') return
    await repo.linkVerseToCollection(collection.id, Number(pickId))
    setLinking(false)
    setPickId('')
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-800">{collection.name}</p>
          {collection.description && <p className="text-sm text-slate-500">{collection.description}</p>}
        </div>
        <Button variant="ghost" onClick={() => repo.deleteCollection(collection.id)}>Remove</Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {linked?.map((v) => (
          <Badge key={v.id} tone="brand">{verseReference(v)}</Badge>
        ))}
        {linked?.length === 0 && <span className="text-sm text-slate-400">No verses linked yet.</span>}
      </div>
      <div className="mt-3">
        {!linking && <Button variant="ghost" onClick={() => setLinking(true)}>+ Add a verse</Button>}
        {linking && (
          <div className="flex gap-2">
            <select className="rounded-xl border border-slate-200 px-3 py-2 flex-1" value={pickId} onChange={(e) => setPickId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Choose a verse…</option>
              {verses.map((v) => (
                <option key={v.id} value={v.id}>{verseReference(v)}</option>
              ))}
            </select>
            <Button onClick={link}>Add</Button>
          </div>
        )}
      </div>
    </Card>
  )
}
