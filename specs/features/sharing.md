# Sharing events by link

**Area code:** `SHARE`  ·  **Status:** draft

## Why

Today an event can only be moved between devices or people as a JSON file (EVT-30, EVT-31). That is awkward on a phone and for non-technical DJs. A link or QR code should be enough: "here is my event, tap to add it to yours."

## Scope

- In: a small server function that stores a read-only snapshot of an event and returns a link; opening a link and adding the event to the user's own events.
- Out: accounts or sync across devices, editing a shared event together, sharing MP3 files (IDEA-04), and the redesign of the New / Open / Close menu (IDEA-15, to be specified separately).
- Approach ("middle path", agreed 2026-11-05): the app stays local-first. The server only holds snapshots. Playing music never depends on it.

## Acceptance criteria

### Creating a link
- [ ] **SHARE-01** The menu has a "Share" item for the active event.
- [ ] **SHARE-02** Share uploads a snapshot of the event, in the existing event JSON format (ARCH-22) with all play counts set to 0, and shows a link of the form `https://sportsdj-web.vercel.app/s/<id>`.
- [ ] **SHARE-03** The id is random and unguessable (at least 72 bits of randomness). There is no list of shared events.
- [ ] **SHARE-04** The link is shown with a "Copy" button and a QR code. On devices that support it, a "Share…" button opens the system share sheet.
- [ ] **SHARE-05** Every Share creates a new snapshot. Changing the event afterwards does not change links already created.

### Opening a link
- [ ] **SHARE-10** Opening `/s/<id>` shows a preview with the event name, sport, number of buttons with a source and number of songs, and an "Add to my events" button.
- [ ] **SHARE-11** If the user is not logged in to Spotify, they log in first and then return to the same preview (the link survives the login redirect).
- [ ] **SHARE-12** "Add to my events" saves a copy as a new event with a fresh id and play counts 0, and makes it active (same as EVT-31).
- [ ] **SHARE-13** The imported data is validated before it is saved (EVT-40, ARCH-24). An invalid snapshot is rejected with a clear message.
- [ ] **SHARE-14** An unknown or expired link shows "This link does not exist or has expired", with a button to the app.

### MP3 buttons
- [ ] **SHARE-20** MP3 sources are not part of a snapshot. Buttons that used an MP3 arrive as empty buttons with their label and colour, and the preview says how many MP3 buttons will not be included.

### Server
- [ ] **SHARE-30** `POST /api/share` accepts an event JSON of at most 200 KB, checks its shape, stores it, and returns its id. `GET /api/share/<id>` returns the snapshot. Neither needs a login.
- [ ] **SHARE-31** Sharing is rate limited per client (proposed: 20 snapshots per hour).
- [ ] **SHARE-32** Snapshots are deleted after a fixed time (see SHARE-90).
- [ ] **SHARE-33** The server stores only the event contents. No Spotify token, user id or other personal data is sent to or stored on the server.

## Edge cases & errors

- [ ] **SHARE-40** If the server cannot be reached, Share shows an error and Export (file) still works. No local data is changed or lost.
- [ ] **SHARE-41** An event over the size limit shows "This event is too large to share" and nothing is uploaded.
- [ ] **SHARE-42** Opening a link while an event is being edited does not discard the unsaved edits (see EVT-92).

## Open questions

- [?] **SHARE-90** How long should a link live? Proposed: 90 days, renewed each time the link is opened.
- [?] **SHARE-91** Where are snapshots stored? Options: Vercel Blob (simple files) or a Marketplace key-value store such as Upstash Redis (also gives easy expiry and rate limiting). Proposed: Redis, for the expiry and the rate limit.
- [?] **SHARE-92** Should the person who shared be able to delete a link early? That needs a delete token kept on their device. Proposed: not in the first version.
- [?] **SHARE-93** Should Share require being logged in to Spotify (some accountability) or be open to anyone who has the app? Proposed: no check, since the app needs Spotify to be usable anyway.
- [?] **SHARE-94** Do we split the work? Proposed: F-019 is sharing only, and the menu redesign (a single Events screen, duplicate, no "Close") is a separate feature afterwards.

## Notes

- Needs architecture changes: ARCH-01 says "no backend", and AD-1 says "no backend". See ARCH-06 and AD-6 (proposed).
- Snapshot format is the existing `DJEvent` JSON, so the import code from F-016 (`parseEventFile`) can be reused, with real validation added.
