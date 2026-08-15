export type Screen =
  | 'home'
  | 'newQueue'
  | 'retention'
  | 'relearn'
  | 'addVerse'
  | 'agendas'
  | 'collections'
  | 'stats'
  | 'settings'

export const NAV_ITEMS: { screen: Screen; label: string }[] = [
  { screen: 'home', label: 'Home' },
  { screen: 'newQueue', label: 'New' },
  { screen: 'retention', label: 'Retention' },
  { screen: 'relearn', label: 'Relearn' },
  { screen: 'addVerse', label: 'Add Verse' },
  { screen: 'agendas', label: 'Agendas' },
  { screen: 'collections', label: 'Collections' },
  { screen: 'stats', label: 'Stats' },
  { screen: 'settings', label: 'Settings' },
]
