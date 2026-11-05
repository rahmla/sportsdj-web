# CLAUDE.md – SportsDJ Web

DJ soundboard for sports events: occasion buttons and a song list, played through Spotify Premium (Web Playback SDK on desktop, Spotify Connect on mobile) or as local MP3s.

## Spec-driven development — read first

`specs/` is the source of truth. Start with `specs/README.md` (workflow), `specs/product.md` (what and why) and `specs/architecture.md` (how: properties `ARCH-NN`, module map, data model, decisions). Read `architecture.md` before any change that touches storage, auth, playback back-ends or hosting.

Rules for every change:

0. **Log every new feature.** When the user describes a new feature, add a row to `specs/changelog.md` (next `F-NNN`, today's date, status `specified`) in addition to writing the spec. If the user calls it an idea, a "maybe" or "not now", put it in `specs/ideas.md` (next `IDEA-NN`) instead and do not spec or build it. Promote an idea only when the user asks.
1. **Spec before code.** Before implementing a feature or behavior change, update or create the spec in `specs/features/` with numbered criteria marked `[ ]`, and get the user's OK on the spec. Do not write code for criteria marked `[?]`. Ask instead.
2. **Cite IDs.** Commit messages and test names reference the criterion IDs they satisfy (e.g. `PLAY-11`).
3. **Close the loop.** When a criterion is implemented and verified, flip it to `[x]` and mark the `changelog.md` row `shipped` (with date and commits) in the same commit.
4. **Spec drift.** If the code and the spec disagree, do not silently "fix" either one. Point out the mismatch and ask which is right.
5. **Tests for every feature.** Every new feature or behaviour change ships with automated tests for its criteria (ARCH-52). A change is not done until `npm test`, `npm run lint` and `npm run build` pass. Applies once F-016 has shipped.

## Tech stack

React 19 + TypeScript + Vite 8 + Tailwind CSS 4, static SPA on Vercel. Details and the module map are in `specs/architecture.md`.

## Commands

- `npm run dev` — dev server (HTTPS via basic-ssl, needed for the Spotify SDK)
- `npm run build` — type-check and build
- `npm run lint`

There are no automated tests yet. Until there are, verify criteria manually in the running app.
