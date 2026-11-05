# Occasion buttons

**Area code:** `BTN`  ·  **Status:** implemented

## Why

Some moments in a match (ace, block, timeout, win) need an instant stinger, started with one tap and no searching.

## Acceptance criteria

### Layout
- [x] **BTN-01** Buttons appear in a grid at the top of performance mode: 4 per row on phones, 8 per row from the `sm` breakpoint up.
- [x] **BTN-02** Each button shows its label on its colour, and is visibly highlighted while its source is playing.

### Editing (Edit mode → "Occasion Buttons")
- [x] **BTN-10** Tapping a button expands its editor, which has Label, Color, Audio Source and Start offset.
- [x] **BTN-11** Colour is chosen from a palette of 16 swatches, or with a custom colour picker.
- [x] **BTN-12** The audio source is either **Spotify** (a URI or open.spotify.com link for a track, playlist or album, normalised to a `spotify:` URI) or **MP3** (a file chosen from the device and stored in IndexedDB).
- [x] **BTN-13** Replacing or removing an MP3 deletes the old file from IndexedDB.
- [x] **BTN-14** Start offset is a whole number of seconds, 0 or more.
- [x] **BTN-15** "+ Row" adds 8 buttons and "− Row" removes the last 8. The count stays between 8 and 40 (shown as "n / 5 rows").
- [x] **BTN-16** Changes only take effect when Save (header) or Done (bottom) is pressed.

## Open questions

- [?] **BTN-90** The Help text says "1–5 rows of 4 buttons", but a "row" in the editor is 8 buttons. Which is right? The help text or the UI needs to change.
- [?] **BTN-91** "− Row" removes the last 8 buttons, configured or not, without asking. Should it ask for confirmation when any of them have a source?
- [?] **BTN-92** The original spec (US-09) allowed adding and removing single buttons, between 1 and 20. Is that intentionally replaced by rows of 8?
