# Specs — how we work

SportsDJ Web uses **spec-driven development**: every behavior change starts as a
written spec, gets agreed on, and only then is implemented. The specs in this folder
are the source of truth for *what the app should do*; the code is the source of
truth for *how*.

## Layout

| Path | What it is |
|------|-----------|
| `product.md` | Vision, users, glossary, product constraints (`G-NN`) |
| `architecture.md` | System context, architectural properties (`ARCH-NN`), module map, data model, storage, decision log |
| `features/*.md` | One spec per feature area, with numbered acceptance criteria |
| `changelog.md` | Feature log: every feature (`F-NNN`) with its status, dates, spec IDs and commits |
| `ideas.md` | Parking lot for uncommitted ideas (`IDEA-NN`). Not part of the spec. |
| `_template.md` | Copy this to start a new feature spec |
| `archive/` | Superseded documents, kept for history |

## Criterion IDs

Every acceptance criterion has a stable ID: `<AREA>-<NN>`, e.g. `PLAY-04`.

- IDs are never reused or renumbered. Removed criteria are struck through and marked `(removed)`.
- Reference IDs in commit messages, PRs and test names: `test('PLAY-04 Space stops playback', …)`.

Areas: `AUTH` (Spotify login), `EVT` (events), `BTN` (occasion buttons),
`SONG` (song list), `PLAY` (performance mode), `DEV` (devices / mobile).

## Status of a criterion

Each criterion carries one marker:

- `[x]` **Implemented** — the code does this today
- `[ ]` **Planned** — agreed, not built yet
- `[?]` **Open question** — needs a decision before anyone builds it

## Workflow for a change

0. **Log it.** Add a row to `changelog.md` with the next `F-NNN` and today's date, status `specified`.
   If the feature is only a "maybe", put it in `ideas.md` instead and stop there.
1. **Specify.** Edit the relevant `features/*.md` (or copy `_template.md` for a new area).
   Add or change criteria as `[ ]`, written as observable behavior (Given / When / Then
   where it helps). No implementation details unless they are a real constraint.
2. **Review.** Read the spec diff and agree on it *before* code is written. Resolve every `[?]` the change touches.
3. **Implement.** Build the smallest change that satisfies the new criteria.
4. **Verify.** Check each touched criterion: automated test where possible (`npm test`), otherwise
   a manual check in the running app (desktop and, for `DEV`/`PLAY`, a phone).
5. **Close.** Flip the criteria to `[x]` and set the `changelog.md` row to `shipped`, with the date and commits, in the same commit as the code.

Technical changes (new dependency, storage format, hosting, auth flow, a refactor that moves a
responsibility between modules) go through the same loop against `architecture.md`. A significant choice also
gets a row in its decision log.

A bug fix follows the same loop. If the spec was right and the code was wrong, just
fix the code and cite the ID. If the spec was silent, add a criterion first.
