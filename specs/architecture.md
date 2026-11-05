# SportsDJ Web — Architecture

This document covers **how** the system is built and the technical rules it must keep.
It covers architecture only. Behavior lives in `product.md` and `features/*.md`.

Architectural properties carry `ARCH-NN` IDs. They follow the same rules as feature criteria: stable IDs, and `[x]` / `[ ]` / `[?]` markers.
A change that breaks an `[x]` property needs a spec change first, just like a behavior change.

## System context

```
┌──────────────────────── Browser (desktop / phone / iOS PWA) ────────────────────────┐
│  SportsDJ SPA (React)                                                               │
│   ├─ localStorage  ── events, active event, token, selected device                  │
│   ├─ IndexedDB     ── MP3 blobs                                                     │
│   ├─ <audio>       ── MP3 playback                                                  │
│   └─ Spotify Web Playback SDK (desktop only, sdk.scdn.co)                           │
└───────────┬───────────────────────────────┬─────────────────────────────────────────┘
            │ static files                  │ HTTPS + Bearer token
     ┌──────▼──────┐               ┌────────▼─────────┐        ┌─────────────────────┐
     │   Vercel    │               │  Spotify Accounts │        │ Spotify Web API     │
     │ (static CDN)│               │  (OAuth PKCE)     │        │ /me, /me/player/*,  │
     └─────────────┘               └───────────────────┘        │ /tracks             │
                                                                └──────────┬──────────┘
                                                                           │ Connect
                                                                ┌──────────▼──────────┐
                                                                │ DJ's Spotify device │
                                                                │ (mobile mode)       │
                                                                └─────────────────────┘
```

## Architectural properties

### Deployment & hosting
- [x] **ARCH-01** The app is a static single-page app with **no backend**. Vercel serves the built `dist/` and rewrites every path to `/index.html` (`vercel.json`).
- [x] **ARCH-02** `index.html` is served with `Cache-Control: no-store`, and the hashed files under `/assets/*` are served as `immutable` for one year. This lets an installed iOS PWA pick up a new deploy without stalling.
- [x] **ARCH-03** The app installs as a PWA in standalone mode (`public/manifest.json`). There is no service worker and no offline support.
- [ ] **ARCH-06** *(proposed, F-019)* One serverless function (`api/share`) is the only server-side code. It stores read-only event snapshots and has no accounts, no Spotify data and no part in playback. Everything else stays local (ARCH-01 and ARCH-20 hold for events the user owns).
- [x] **ARCH-04** Development runs on `http://127.0.0.1:5173`. Spotify requires https for redirect URIs except for loopback IP addresses, and browsers treat a loopback address as a secure origin, which the Web Playback SDK needs. (It used `@vitejs/plugin-basic-ssl` over `https://localhost` before 2026-11-05.)

### Security & identity
- [x] **ARCH-10** Authentication is the OAuth 2.0 Authorization Code flow with **PKCE**. The public client id lives in `src/utils/pkce.ts`, and there is no client secret anywhere.
- [x] **ARCH-11** The redirect URIs are fixed: `http://127.0.0.1:5173/callback` in dev (Spotify rejects `localhost` as an insecure redirect URI, so open the dev app at `http://127.0.0.1:5173/`) and `https://sportsdj-web.vercel.app/callback` in prod. Any new domain must also be registered in the Spotify dashboard.
- [x] **ARCH-12** The PKCE code verifier is kept in localStorage, not sessionStorage, because Safari clears sessionStorage during cross-origin redirects.
- [x] **ARCH-13** Spotify credentials (the token and device id) are never stored inside an event and never included in an export.
- [x] **ARCH-14** Every Web API call goes through `apiFetch`. A `401` response clears the token, which sends the DJ back to login.
- [x] **ARCH-15** Requested scopes: `streaming user-read-playback-state user-modify-playback-state user-read-email user-read-private playlist-read-private playlist-read-collaborative`.

### Data & storage
- [x] **ARCH-20** All user data stays on the device. Events are namespaced by Spotify user id: `sportsdj_events_<userId>` and `sportsdj_active_<userId>`. The value `__closed__` means no event is active.
- [x] **ARCH-21** MP3 binaries are stored in IndexedDB, keyed by `AudioSource.fileKey` (`src/utils/mp3Storage.ts`). Events hold only the key.
- [x] **ARCH-22** The export format is the `DJEvent` JSON, unchanged (`*.sportsdj.json`). It doubles as the format for built-in templates (`src/utils/templates.ts`).
- [x] **ARCH-23** Old data still loads: the `SportProfile` alias is kept, and missing optional fields (such as `playCount`) are treated as defaults.
- [ ] **ARCH-24** Stored and imported events carry a schema version and pass through a validation/migration step before use. Today parsing is unchecked (see EVT-40).
- [?] **ARCH-25** localStorage has a limit of about 5 MB per origin. Large song lists or many events can hit it, and `saveEvents` does not handle `QuotaExceededError`.

### Playback
- [x] **ARCH-30** There are two playback back-ends, chosen once at startup by user-agent sniffing (`isMobile` in `useSpotify`):
  - **Desktop:** the Spotify Web Playback SDK, loaded at runtime from `sdk.scdn.co`. The browser itself is the device.
  - **Mobile:** Spotify Connect, which controls a device the DJ chose through `/me/player/*`.
- [x] **ARCH-31** All Spotify playback state (playing, position, duration) is owned by `useSpotify`. On desktop it comes from SDK events plus a `getCurrentState()` tick. On mobile it comes from polling `/me/player` every 3 s.
- [x] **ARCH-32** MP3 playback uses `HTMLAudioElement` with blob URLs preloaded when the event opens. This avoids async work between the tap and `play()`, which would break iOS autoplay rules.
- [x] **ARCH-33** Fades are done by stepping the volume through the API, with fewer steps on mobile to stay under Spotify's rate limits. App volume is capped at 0.8 (`MAX_VOL`).

### Application structure
- [x] **ARCH-40** Client state uses React hooks only, with no global store:
  - `useSpotify`: auth, player, devices and playback state
  - `useEvents`: the event list, the active event and persistence
  - `App.tsx`: the view switch (login → empty state / Performance / Edit) and the modals
- [x] **ARCH-41** Edit mode works on a **local copy** of the event (`EditView` state). It commits through `onUpdate` only when Save or Done is pressed. Performance mode commits directly (play counts).
- [x] **ARCH-42** Persistence happens as a side effect of `useEvents.setEvents`. Every commit writes the whole event list to localStorage.

### Quality & tooling
- [x] **ARCH-50** Automated checks are the TypeScript strict build (`tsc -b`), ESLint (`npm run lint`) and the Vitest suite (`npm test`, see ARCH-51 and ARCH-52).
- [x] **ARCH-51** Pure logic (URI normalisation, CSV parsing, event import/validation, storage) is moved out of components into `src/utils/` and covered by Vitest. Test names cite criterion IDs.
- [x] **ARCH-52** Every new feature or behaviour change ships with automated tests that cover its acceptance criteria, and test names cite the criterion IDs. Logic goes into `src/utils/` or a hook so it can be tested without Spotify. A criterion that cannot be automated (for example real audio playback) is marked as manually verified in its spec. A change is not done until `npm test`, `npm run lint` and `npm run build` pass.

## Module map

| Path | Responsibility |
|------|----------------|
| `src/main.tsx`, `src/App.tsx` | Bootstrapping, top-level views, menu, New/Open dialogs, Help/About |
| `src/hooks/useSpotify.ts` | OAuth callback handling, SDK/Connect player, play/stop/volume, devices |
| `src/hooks/useEvents.ts` | Event CRUD, active event, export/import |
| `src/components/PerformanceView.tsx` | Button grid, song list, STOP, fades, auto-advance, MP3 playback |
| `src/components/EditView.tsx` | Button and song editing, CSV import, preview / "Set here" |
| `src/components/{OccasionButton,SongRow,StopButton,ProfileBar}.tsx` | Presentational pieces (`ProfileBar` appears unused) |
| `src/utils/pkce.ts` | PKCE helpers, client id, redirect URI, scopes |
| `src/utils/storage.ts`, `src/utils/mp3Storage.ts` | localStorage and IndexedDB access |
| `src/utils/templates.ts` | Built-in event templates |
| `src/types/` | Domain types and Spotify SDK typings |

## Data model

```
DJEvent        { id, name, sport, occasionButtons: OccasionButton[], songs: SongItem[] }
OccasionButton { id, label, colorHex, audioSource?, startOffset }
SongItem       { id, title, audioSource?, order, startOffset, playCount? }
AudioSource    { type: 'spotifyTrack'|'spotifyPlaylist'|'mp3', uri, name, fileKey?, fileName? }
```

Source of truth: `src/types/index.ts`.

## Storage keys

| Data | Where | Key |
|------|-------|-----|
| Events | localStorage | `sportsdj_events_<userId>` |
| Active event id | localStorage | `sportsdj_active_<userId>` |
| Spotify access token | localStorage | `spotify_access_token` |
| PKCE code verifier | localStorage | `spotify_code_verifier` |
| Selected Connect device | localStorage | `spotify_connect_device` |
| MP3 files | IndexedDB | `AudioSource.fileKey` |

## Decision log

Short ADRs. Add new entries at the bottom and never edit an accepted one; supersede it instead.

| # | Decision | Why | Status |
|---|----------|-----|--------|
| AD-1 | No backend, store everything locally | Zero cost and zero ops, and works for a single DJ | Accepted |
| AD-2 | PKCE with no client secret | A secret can't be kept safe in a SPA | Accepted |
| AD-3 | Spotify Connect on mobile instead of the SDK | Mobile browsers don't support the Web Playback SDK | Accepted |
| AD-4 | Playlist import via Exportify CSV | Spotify's dev-mode API restrictions block direct playlist reads | Accepted |
| AD-5 | MP3s in IndexedDB, not localStorage | Binary size; localStorage holds about 5 MB of strings | Accepted |
| AD-6 | A small share endpoint instead of a full backend | Link sharing needs a server, but accounts, sync and hosted MP3s would cost much more to build and run (decided 2026-11-05, see F-019). Amends AD-1 | Proposed |
