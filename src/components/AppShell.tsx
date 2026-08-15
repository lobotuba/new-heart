import { useState } from 'react'
import * as repo from '../repository/repository'
import Home from './Home'
import Recite from './Recite'
import AddVerse from './AddVerse'
import VerseQueueList from './VerseQueueList'
import Agendas from './Agendas'
import Collections from './Collections'
import Stats from './Stats'
import Settings from './Settings'
import { NAV_ITEMS, type Screen } from './screens'

export default function AppShell() {
  const [screen, setScreen] = useState<Screen>('home')
  const [reciteId, setReciteId] = useState<number | null>(null)

  function closeRecite() {
    setReciteId(null)
  }

  return (
    <div className="min-h-screen">
      <header className="bg-brand-700 text-white sticky top-0 z-10 shadow">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="leading-tight">
            <span className="font-bold text-lg tracking-tight block">New Heart</span>
            <span className="text-xs text-brand-100 block">A Lamp Unto My Feet</span>
          </div>
        </div>
        <nav className="max-w-4xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.screen}
              onClick={() => setScreen(item.screen)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                screen === item.screen ? 'bg-white text-brand-700' : 'text-brand-100 hover:bg-brand-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {reciteId != null ? (
          <Recite memorizationId={reciteId} onDone={closeRecite} />
        ) : (
          <>
            {screen === 'home' && <Home onRecite={setReciteId} onNavigate={setScreen} />}
            {screen === 'newQueue' && (
              <VerseQueueList
                title="New Queue"
                subtitle="Verses not yet actively being memorized."
                emptyMessage="Nothing here yet — add a verse to get started."
                fetcher={repo.newQueue}
                actionLabel="Let's Learn This"
                onRecite={setReciteId}
              />
            )}
            {screen === 'retention' && (
              <VerseQueueList
                title="Retention"
                subtitle="Scripture you're maintaining and strengthening over time."
                emptyMessage="Verses land here once they're learned."
                fetcher={repo.retentionQueue}
                actionLabel="🎙 Recite"
                onRecite={setReciteId}
              />
            )}
            {screen === 'relearn' && (
              <VerseQueueList
                title="Relearn"
                subtitle="Relearning is a normal part of memory — not a failure."
                emptyMessage="Nothing to relearn right now."
                fetcher={repo.relearnQueue}
                actionLabel="🎙 Recite"
                onRecite={setReciteId}
              />
            )}
            {screen === 'addVerse' && <AddVerse />}
            {screen === 'agendas' && <Agendas />}
            {screen === 'collections' && <Collections />}
            {screen === 'stats' && <Stats />}
            {screen === 'settings' && <Settings />}
          </>
        )}
      </main>
    </div>
  )
}
