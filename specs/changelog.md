# Feature log

One row for every feature. It tracks **what** was added, **when** it was specified, **when** it shipped, and **where** it is specified.
The spec files describe how the app behaves now. This log records how it got there.

## How to use

- When a new feature is described, add a row **at the top** with the next `F-NNN` id. Fill in `Specified` with today's date and set Status to `specified`.
- Status moves `specified` → `in progress` → `shipped`, or → `dropped` (keep the row and give the reason in Notes).
- When it ships, fill in `Shipped` with the date and `Commits`.
- `Spec` lists the criterion IDs the feature added or changed, so the full text is one search away.
- Ideas that are not committed to yet go in [ideas.md](ideas.md), not here. An idea moves into this log once it is promoted.
- Bug fixes are not logged here, unless they add or change a criterion.

## Log

| ID | Feature | Status | Specified | Shipped | Spec | Commits | Notes |
|----|---------|--------|-----------|---------|------|---------|-------|
| F-019 | Share events by link or QR code, through a small server function that stores read-only snapshots | in progress | 2026-11-05 | — | SHARE-01…42, ARCH-06, AD-6 | — | Promoted from IDEA-15 (sharing part). "Middle path": no accounts or sync, local-first. Server part verified on a preview with real Redis (Upstash, store `sportsdj-share`). The UI criteria wait for a manual check |
| F-018 | Flexible app width: full-width layout, song grid with more tiles per row on wide screens | in progress | 2026-11-05 | — | LAY-01, LAY-02, LAY-10, LAY-14, LAY-20, LAY-21 | — | Promoted from IDEA-08. The two-column layout (LAY-11…13) was tried and dropped on 2026-11-05: tiles stay under the buttons. Built, waiting for a manual layout check at phone / tablet / desktop widths |
| F-017 | Songs as a grid of square tiles instead of a list | in progress | 2026-11-05 | — | SONG-01, SONG-02, SONG-20…26, SONG-40 | — | Promoted from IDEA-07. The grid replaces the list. Built; SONG-01 and SONG-20 wait for a manual layout check |
| F-016 | Automated tests (Vitest): pure-logic unit tests, a few UI flow tests, run in the build | shipped | 2026-11-05 | 2026-11-05 | TEST-01…40, ARCH-51 | f7af3a2, 37d61bc, 7d5dff8, e4ae63d, and the commit that flips this row | Vercel build runs `npm test` first (vercel.json). Fixed 2 pre-existing lint errors on the way |
| F-015 | Full Beachvolley template (100+ songs); Volleyball template removed | shipped | — | 2026-04-18 | EVT-03 | 0d45a6b, 4117de8 | |
| F-014 | Song preview in Edit mode, with "Set here" offset picker | shipped | — | 2026-04-18 | SONG-13, SONG-14 | 314b216, d52304a, 44c7438 | |
| F-013 | Mobile support through Spotify Connect, plus auto-fetch of song titles | shipped | — | 2026-04-18 | DEV-01…08, SONG-12, ARCH-30, AD-3 | 3e0ee4e, acd9bd3 | acd9bd3 is the iOS PWA cache-header fix (ARCH-02) |
| F-012 | MP3 files for occasion buttons; fade-out, fade-in and auto-advance | shipped | — | 2026-04-15 | BTN-12, BTN-13, PLAY-04, PLAY-20…23, ARCH-21, ARCH-32, AD-5 | d9ffcd2, 3f77316 | |
| F-011 | New Event dialog with a template dropdown | shipped | — | 2026-04-01 | EVT-01 | c9b6cda | |
| F-010 | Close event, empty state, deleting the last event | shipped | — | 2026-04-01 | EVT-12, EVT-13 | 283553b, 3737551 | |
| F-009 | Play counters + Reset, STOP timer, Space to stop, templates, Help | shipped | — | 2026-03-30 | SONG-02, SONG-03, PLAY-10, PLAY-11, EVT-03 | 1ce9dca | |
| F-008 | About dialog; Spotify connect moved into the menu | shipped | — | 2026-03-29 | AUTH-07 | ed78fbc, 9b556b6 | |
| F-007 | Colour swatches plus a custom colour input | shipped | — | 2026-03-29 | BTN-11 | 7f30203 | |
| F-006 | New events start with 8 grey `NON` buttons | shipped | — | 2026-03-29 | EVT-02 | 60ad010 | |
| F-005 | Up to 5 rows of occasion buttons (+ Row / − Row) | shipped | — | 2026-03-29 | BTN-15 | 161019a | |
| F-004 | Song import via Exportify CSV | shipped | — | 2026-03-29 | SONG-15, SONG-16, AD-4 | 8e38947, 18c5633 | Replaced the direct playlist import and URI bulk paste (107a489, 8c941a8), which Spotify dev-mode limits blocked |
| F-003 | Per-user events, with export / import as JSON | shipped | — | 2026-03-28 | EVT-10, EVT-30…32, ARCH-20, ARCH-22 | 8fc81ec, f8cee6c | |
| F-002 | Hamburger menu merged into the header | shipped | — | 2026-03-28 | AUTH-07 | 2d4d3b3 | |
| F-001 | First app: Spotify PKCE login, Web Playback SDK, occasion buttons, Vercel hosting | shipped | — | 2026-03-28 | AUTH-01…05, PLAY-01, DEV-01, ARCH-01, ARCH-04, ARCH-10 | 4eef75a, b9670ba, fd3bcde, 99545a3 | |

*F-001 to F-015 were rebuilt from git history on 2026-11-05. They were built before specs existed, so `Specified` is empty.*
