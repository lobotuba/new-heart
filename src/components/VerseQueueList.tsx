import { useLiveQuery } from 'dexie-react-hooks'
import type { MemorizationWithVerse } from '../domain/models'
import { verseReference } from '../domain/models'
import { strengthLabel } from '../domain/enums'
import { Badge, Button, Card, EmptyState, ScreenHeader } from './ui'

export default function VerseQueueList({
  title,
  subtitle,
  emptyMessage,
  fetcher,
  actionLabel,
  onRecite,
}: {
  title: string
  subtitle: string
  emptyMessage: string
  fetcher: () => Promise<MemorizationWithVerse[]>
  actionLabel: string
  onRecite: (id: number) => void
}) {
  const items = useLiveQuery(fetcher, [fetcher])

  return (
    <div>
      <ScreenHeader title={title} subtitle={subtitle} />
      {items == null && <EmptyState message="Loading…" />}
      {items != null && items.length === 0 && <EmptyState message={emptyMessage} />}
      <div className="flex flex-col gap-3">
        {items?.map((mv) => (
          <Card key={mv.memorization.id} className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">{verseReference(mv.verse)}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge tone="brand">{strengthLabel(mv.memorization.memoryStrength)}</Badge>
                <span className="text-xs text-slate-400">{mv.verse.translation}</span>
              </div>
            </div>
            <Button onClick={() => onRecite(mv.memorization.id)}>{actionLabel}</Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
