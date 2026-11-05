# Ideas

A parking lot for features that are **not committed to**. They may never ship.
Nothing here gets implemented, and nothing here is part of the spec.

## How to use

- Add an idea with the next `IDEA-NN` id and today's date. A sentence or two is enough: the problem, and a rough solution if there is one.
- Status: `new` → `exploring` (we're discussing it) → `promoted` (now a feature: link its `F-NNN`) or `rejected` (keep it, and note why).
- **Promoting** an idea means adding a row to [changelog.md](changelog.md), writing `[ ]` criteria in the relevant `features/*.md`, and setting the idea's status to `promoted → F-NNN`.
- Rejected ideas stay in the list, so nobody has the same discussion twice.

## Ideas

### IDEA-01 Reorder songs
**Added:** 2026-11-05 · **Status:** new · **From:** SONG-90
Songs can't be reordered today, apart from deleting and re-adding them. Options: drag and drop, or ↑/↓ buttons in Edit mode.

### IDEA-02 Resume the song after a stinger
**Added:** 2026-11-05 · **Status:** new · **From:** PLAY-90
When a button interrupts a song, play the stinger and then resume the song where it left off. Alternatively, lower the song's volume under the stinger instead of stopping it.

### IDEA-03 Auto-advance toggle per event
**Added:** 2026-11-05 · **Status:** new · **From:** PLAY-91
Some events want silence after each song, others want continuous music. Let the DJ turn auto-advance (PLAY-21) on or off per event.

### IDEA-04 Include MP3s in event export
**Added:** 2026-11-05 · **Status:** new · **From:** EVT-90
Exported events lose their MP3 audio. Options: a zip containing the JSON plus the MP3s, base64 MP3s inside the JSON, or a warning only.

### IDEA-05 Log in from preview and other domains
**Added:** 2026-11-05 · **Status:** new · **From:** ARCH-11
The redirect URI is hardcoded to production, so Spotify login only works on `sportsdj-web.vercel.app` and localhost. On a Vercel preview the verifier is saved on the preview origin but Spotify redirects to production, so the token exchange fails with `code_verifier was incorrect`. Fix: build the redirect URI from `window.location.origin`, and register each domain in the Spotify dashboard (previews need a stable alias). Changes ARCH-11.

### IDEA-06 Configurable tabs on the song list
**Added:** 2026-11-05 · **Status:** exploring · **From:** SONG-01
Split the song list into tabs, one per theme or section (for example "Warm-up", "Rally music", "Breaks", "Finals"). The DJ configures the tabs in Edit mode: add, rename, reorder and delete. Open points: does each song belong to exactly one tab? What happens to the songs when a tab is deleted? Does auto-advance (PLAY-21) stay inside the current tab? Needs a new field on songs and on the event data (ARCH data model, export format).

### IDEA-07 Songs as a grid of small squares
**Added:** 2026-11-05 · **Status:** promoted → F-017 · **From:** SONG-01
Show songs as small tiles in a grid instead of a list, like the occasion buttons. Easier to hit with a thumb and shows more songs at once. Open points: how much of the title fits, and where the play counter (SONG-02) and the "currently playing" state go. Could be a per-event or per-device toggle between list and grid.

### IDEA-08 Flexible app width
**Added:** 2026-11-05 · **Status:** promoted → F-018 · **From:** BTN-01
Drop the fixed width so the app uses the whole screen (tablet, laptop, landscape phone). Open points: how many button columns on wide screens (BTN-01 says 8 from `sm` up), and whether the song list sits beside the buttons on wide screens.

### IDEA-09 Search or filter the song list
**Added:** 2026-11-05 · **Status:** new · **From:** SONG-01
A search box that filters songs by title, for events with 100+ songs (the Beachvolley template has that many). Pairs with IDEA-06 (tabs).

### IDEA-10 Colour or label per song
**Added:** 2026-11-05 · **Status:** new · **From:** SONG-11
Give each song a colour or short tag, so sections can be told apart at a glance. Could replace tabs for simple cases, or complement them (IDEA-06, IDEA-07).

### IDEA-11 Played / not yet played marker
**Added:** 2026-11-05 · **Status:** new · **From:** SONG-02
Show which songs were already played and which were not, in addition to the play counter. Could dim played songs or show a "last played" mark.

### IDEA-12 More visible "now playing" and a larger Stop button
**Added:** 2026-11-05 · **Status:** new · **From:** PLAY-01
For noisy venues and use in sunlight: a large now-playing display (title, progress) and a bigger Stop button.

### IDEA-13 Keep the screen awake during an event
**Added:** 2026-11-05 · **Status:** new · **From:** DEV-01
Use the Screen Wake Lock API so the phone or tablet does not sleep while the DJ is performing. Needs a check of browser and iOS PWA support.

### IDEA-14 MP3 files as songs in the list
**Added:** 2026-11-05 · **Status:** new · **From:** SONG-91
Songs can only be Spotify tracks today, while buttons can also use MP3. Allow MP3 songs too. Interacts with auto-advance (PLAY-21, which skips MP3 songs) and with export (IDEA-04).

*Landscape and tablet layout is covered by IDEA-08. Reordering songs is IDEA-01.*
