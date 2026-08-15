# New Heart

*A Lamp Unto My Feet*

A free, offline-first Scripture memorization app built around **retrieval practice** and **randomized spaced repetition**, not passive re-reading. Built from the spec in [`specs.txt`](./specs.txt).

The app icon is a placeholder (a lamp motif for the tagline, Psalm 119:105) — swap `public/icon.svg` for the real 7r35.com logo once it turns up.

> The goal isn't to complete the app. The goal is to get Scripture into the heart and keep it there.

## What it does (MVP)

- Add verses from a bundled 40-verse starter pack (KJV/WEB) or paste in any verse/translation manually
- **Recite**: hide the verse, attempt recall, reveal it, then self-evaluate — *I Know It* / *I Needed a Little Help* / *Let's Relearn This One* — never "wrong" or "failed"
- A verse becomes **Learned** after three "I Know It" results on three separate days, then moves into long-term **Retention**
- **Randomized scheduling**: review intervals expand over time (1, 3, 7, 14, 30, 60, 90… days) but are jittered ±15-20% so review timing never becomes predictable
- **New / Retention / Relearn** queues, **Agendas** (tie a verse to Awana, church, a sermon, a school assignment), **Collections** (Salvation, Trinity, Family, …), a Home screen with a positive-framed daily view and an occasional **Memory Challenge**
- Self-pacing (Relaxed / Steady / Active / Custom), and a "pause new verses" toggle that keeps retention reviews going without adding more
- Fully offline (installable PWA, IndexedDB storage), no ads, no account, no subscription

See `specs.txt` sections 37-38 for the full MVP/future-features split this build follows.

## Cross-device data

There's no live shared database — that's deliberate (a synced folder with two devices writing to one SQLite/IndexedDB file at once risks corruption). Instead:

- **Settings → Export Data** downloads a full JSON snapshot.
- Drop that file anywhere synced across your devices — a Google Drive, OneDrive, or iCloud Drive folder.
- **Settings → Import Data** on another device merges it in by id — review history is unioned, not overwritten, so importing an older export can never erase newer local progress.

## Bible text

Two public-domain translations are bundled (KJV, WEB) for a small starter pack of well-known verses. **That text was transcribed from AI training knowledge, not copied from a verified source** — KJV wording is extremely stable and high-confidence, WEB is lower-confidence. Spot-check anything you rely on against [ebible.org/web](https://ebible.org/web/) or [biblegateway.com](https://www.biblegateway.com/) before real memorization use. The manual-entry path in Add Verse exists specifically so incorrect bundled text is never a dead end — and works with any translation (ESV, NIV, etc.), since those aren't bundled due to licensing.

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # production build to dist/
npm run preview   # preview the production build
```

## Deployment

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and deploys `dist/` to GitHub Pages on every push to `main`. Enable Pages under Settings → Pages → Source → GitHub Actions on this repo to activate it.

## Architecture

- **Vite + React + TypeScript**, IndexedDB via **Dexie** (+ `dexie-react-hooks` for reactive queries), offline support via **vite-plugin-pwa**.
- `src/scheduling/` — the spaced-repetition engine, behind a `SchedulingAlgorithm` interface so it stays swappable (spec section 35 asks for this explicitly).
- `src/repository/` — the only place that touches the database; components never call Dexie directly.
- `src/export/` — the JSON snapshot export/merge-import logic described above.

## Deferred (spec section 38 — explicitly future work)

Speech recognition/auto-scoring, family profiles, church/group plans, live cloud sync, shared collections, more translations, Heart Review mode, Awana children's games, audio Scripture.
