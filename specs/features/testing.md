# Automated tests

**Area code:** `TEST`  ·  **Status:** implemented

## Why

There are no automated tests, so every change is checked by hand in the running app. Before the song grid, flexible width and tabs (IDEA-06 to IDEA-08) change the UI and the event data, the existing behaviour needs a safety net. It also makes Spotify-independent logic (storage, import, CSV) safe to move around. Implements the open criterion ARCH-51.

## Scope

- In: a test runner and `npm test`; unit tests for pure logic in `src/utils/`; a few component tests for the main flows with Spotify mocked; running the tests with the build checks.
- Out: tests against the real Spotify API or the Web Playback SDK (needs Premium and a browser audio device); visual / screenshot tests; coverage targets.

## Acceptance criteria

### Setup
- [x] **TEST-01** `npm test` runs the whole suite once and exits non-zero if any test fails. `npm run test:watch` runs it in watch mode.
- [x] **TEST-02** Tests run in jsdom, with `localStorage` and `IndexedDB` available (the latter through a fake) and no network access.
- [x] **TEST-03** Test names start with the criterion IDs they verify, for example `test('SONG-15 imports Exportify rows as spotify:track URIs', …)`.
- [x] **TEST-04** CLAUDE.md and `specs/README.md` say how to run the tests and drop the line "There are no automated tests yet".

### Pure logic (extracted from components where needed, ARCH-51)
- [x] **TEST-10** Spotify link and URI normalisation (track, playlist, album; open.spotify.com links and `spotify:` URIs; invalid input) is covered (BTN-12, SONG-11).
- [x] **TEST-11** Exportify CSV parsing is covered, including the three error messages (SONG-15, SONG-16).
- [x] **TEST-12** Event import / export and validation are covered, including a malformed file (EVT-30 to EVT-32).
- [x] **TEST-13** `storage.ts`: load, save, default event, a corrupt value in localStorage, and per-user separation (ARCH-20, ARCH-42).
- [x] **TEST-14** PKCE helpers: the verifier length and alphabet, and the S256 challenge against a known test vector (ARCH-12).
- [x] **TEST-15** Built-in templates are valid events (EVT-03).

### UI flows (React Testing Library, Spotify mocked)
- [x] **TEST-20** Performance mode: pressing a button starts its source, and starting a song raises its play counter by 1 (SONG-02, BTN-02).
- [x] **TEST-21** Edit mode: changes take effect only on Save or Done (BTN-16, ARCH-41).
- [x] **TEST-22** "Reset" sets all play counters to 0 (SONG-03).

### Running the tests
- [x] **TEST-30** `npm run build` still type-checks the test files, and `npm run lint` passes on them.
- [x] **TEST-31** The tests run on every push (Vercel build, or a GitHub Action) and a failing test blocks the deploy.

## Edge cases & errors

- [x] **TEST-40** The suite does not depend on the current date, time zone or random values (UUIDs and `Math.random` are stubbed where output is compared).

## Open questions

- [x] **TEST-90** Test runner: Vitest. Agreed 2026-11-05.
- [x] **TEST-91** No Playwright / end-to-end tests for now. Agreed 2026-11-05.
- [x] **TEST-92** Tests run in the Vercel build (`npm test && npm run build`), so a failing test blocks the deploy (TEST-31). Agreed 2026-11-05.
- [x] **TEST-93** Logic still inside components or `useSpotify.ts` is extracted into `src/utils/` in small steps with no behaviour change, each checked by hand. Agreed 2026-11-05.

## Notes

- The rule that every future feature ships with tests is ARCH-52.
- Verify each extraction by running the existing app by hand once, since there are no tests to protect the refactor itself (SONG-15, BTN-12).
- Rough order: setup (TEST-01 to 04), then pure logic, then UI flows, then CI.
