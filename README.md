# ✝ ChurchOS — Church Production System

A full-featured local-first church presentation system. Runs entirely on your machine — no cloud account needed.

---

## Quick Start (Linux / Chromebook)

```bash
# 1. Install Node.js 20 (skip if already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Extract and enter the project
unzip churchos-v0.2.0.zip
cd churchos

# 3. Install all dependencies (run once)
npm install

# 4. Start the app
npm run dev

# 5. Open in browser
#    Dashboard:    http://localhost:3000/dashboard
#    Output screen: http://localhost:3000/output/session-svc-1
```

---

## Quick Start (Windows / Mac)

```bash
# Requires Node.js 20+ from https://nodejs.org

# In the extracted churchos folder:
npm install
npm run dev
```

---

## Key URLs

| URL | Purpose |
|-----|---------|
| `http://localhost:3000/dashboard` | Main operator interface |
| `http://localhost:3000/dashboard/services` | Services list |
| `http://localhost:3000/dashboard/services/new` | Create a service |
| `http://localhost:3000/dashboard/services/svc-1/live` | Live control (pre-loaded demo) |
| `http://localhost:3000/output/session-svc-1` | **Fullscreen output — open on projector** |
| `http://localhost:3000/dashboard/songs` | Song editor |
| `http://localhost:3000/dashboard/slides` | Slide deck editor |
| `http://localhost:3000/dashboard/bible` | Bible search (KJV) |
| `http://localhost:3000/dashboard/media` | Media library |

---

## Live Control Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `→` / `↓` / `Space` | Next slide |
| `←` / `↑` | Previous slide |
| `B` | Blackout (instant black screen) |
| `Esc` | Resume from blackout |

---

## How to Run a Service

1. Go to **Services** → click **New Service** or edit an existing one
2. Add songs, slide decks, and scripture items from the right panel
3. Click **Save**
4. Open the **Output Screen** URL on your projector/second monitor
5. Click **Go Live** — the output screen will show your content
6. Use arrow keys or click Prev/Next to navigate

---

## Architecture

```
churchos/
├── apps/web/                   Next.js 14 frontend + API
│   ├── app/
│   │   ├── api/                REST API routes (local SQLite)
│   │   │   ├── songs/          CRUD for songs
│   │   │   ├── services/       CRUD for services (enriches with song/deck data)
│   │   │   ├── slides/         CRUD for slide decks
│   │   │   ├── bible/          KJV Bible search (built-in, no download needed)
│   │   │   └── media/          Media library
│   │   ├── dashboard/          Operator UI pages
│   │   └── output/[sessionId]/ Fullscreen output renderer
│   ├── components/
│   │   ├── live/               ControlPanel, PlaylistBar, PreviewWindow, AIAssistPanel
│   │   ├── output/             OutputRenderer (shown on projector)
│   │   ├── songs/              SongEditor
│   │   ├── slides/             SlideEditor
│   │   ├── services/           ServiceBuilder (drag-and-drop order of service)
│   │   ├── bible/              BibleSearch
│   │   └── ui/                 Button, Badge, Input, Card
│   ├── lib/
│   │   ├── db/                 SQLite database layer (better-sqlite3)
│   │   ├── state/              Zustand stores (live session, service)
│   │   └── state-machine-cjs.js  WebSocket server state machine (CommonJS)
│   ├── hooks/                  useLiveSession, useKeyboardShortcuts, useBible
│   └── server.js               Custom Next.js server with WebSocket built in
├── packages/
│   ├── shared-types/           All TypeScript interfaces
│   ├── state-machine/          Live session reducer (shared client+server)
│   └── bible-engine/           Bible reference parser
└── data/                       Auto-created — SQLite database lives here
```

---

## Data Storage

All data is stored locally in `data/churchos.db` (SQLite). This file is created automatically on first run and seeded with:
- 5 sample songs (Amazing Grace, How Great Thou Art, Blessed Assurance, 10,000 Reasons, Great Is Thy Faithfulness)
- 2 slide decks (Welcome & Announcements, Sermon: The Good Shepherd)
- 2 services (Sunday Morning, Wednesday Prayer)

---

## WebSocket Live Sync

The custom `server.js` runs a WebSocket server alongside Next.js. When you open the output screen on a second monitor, it connects to the same WebSocket session and receives real-time updates. No configuration needed — it all runs on the same port (3000).

**Session ID format:** `session-{serviceId}` — e.g. `session-svc-1`

---

## Adding Supabase (Optional — Cloud Sync)

To enable cloud sync and multi-operator support:

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase/migrations/` in the Supabase SQL editor
3. Create `apps/web/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Re-enable the middleware in `apps/web/middleware.ts`

---

## Building for Desktop (Electron)

```bash
# Windows .exe
npm run build:electron:win

# Mac .dmg  
npm run build:electron:mac
```

GitHub Actions auto-builds on push to `main` (see `.github/workflows/`).

---

## v0.2.0 Changelog

- ✅ Local SQLite database — no Supabase required
- ✅ WebSocket server built into Next.js custom server
- ✅ All pages wired to real data (songs, slides, services, bible)
- ✅ Service builder with drag-and-drop order of service editor
- ✅ Live control wired — output screen receives real content
- ✅ Bible search with send-to-output
- ✅ Song editor saves to database
- ✅ Slide deck editor saves to database
- ✅ Keyboard shortcuts drive real output
- ✅ Media library with drag-and-drop upload
- ✅ Seeded with 5 songs, 2 decks, 2 services

