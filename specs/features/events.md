# Events

**Area code:** `EVT`  ·  **Status:** implemented

## Why

A DJ works many different events and sports, and wants to set each one up once and reuse it.

## Acceptance criteria

### Create
- [x] **EVT-01** The menu has a "New" item. It opens a dialog with Template (default "Empty"), Event name and Sport.
- [x] **EVT-02** An empty new event gets 8 occasion buttons labelled `NON`, colour `#666666`, no source, and an empty song list.
- [x] **EVT-03** Choosing a template copies its buttons and songs into a new event with a fresh id and all play counts reset to 0.
- [x] **EVT-04** The new event becomes the active event right away.

### Open / switch / close / delete
- [x] **EVT-10** "Open" lists all events and switching to one makes it active. The choice is remembered across reloads.
- [x] **EVT-11** Deleting an event from the Open dialog asks for confirmation first.
- [x] **EVT-12** "Close" deactivates the current event and shows the empty state ("No active event", with New event and Open event buttons).
- [x] **EVT-13** Deleting the last event leads to the empty state.
- [x] **EVT-14** On first use, when nothing is stored, a default event named "My Event" is created.

### Persistence
- [x] **EVT-20** Every committed change is written to localStorage immediately. There is no separate Save step. Edit mode commits on Save/Done (see BTN, SONG).

### Export / import
- [x] **EVT-30** "Export" downloads the active event as `<name with spaces→_>.sportsdj.json`.
- [x] **EVT-31** "Import" reads such a file, adds it as a new event with a fresh id, and makes it active.
- [x] **EVT-32** A file that is not valid JSON shows the error "Invalid event file".

## Edge cases & errors

- [ ] **EVT-40** Importing JSON that is valid but is not an event (missing `occasionButtons` or `songs`) is rejected with a clear message. Today it is accepted and can crash the views. (Technical side: ARCH-24.)

## Open questions

- [?] **EVT-90** MP3 files live in IndexedDB and are **not** part of the export. An imported event with MP3 buttons has no audio. → parked as IDEA-04.
- [?] **EVT-91** Deleting an event does not remove its MP3 files from IndexedDB, so storage keeps growing. Should those files be cleaned up?
- [?] **EVT-92** The Open dialog switches events even while edits are unsaved, and those edits are lost without a warning. The original US-04 asked for a confirmation here.
