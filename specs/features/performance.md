# Performance mode

**Area code:** `PLAY`  ·  **Status:** implemented

## Why

Mid-match, the DJ needs one tap to get the right sound, a reliable way to stop, and nothing on screen that can be misconfigured by accident.

## Acceptance criteria

### Playing
- [x] **PLAY-01** Tapping a button or a song plays its source from its start offset, at full app volume (80% of Spotify's maximum).
- [x] **PLAY-02** Starting a new source replaces whatever was playing.
- [x] **PLAY-03** Tapping a button or song that has no source does nothing.
- [x] **PLAY-04** MP3 sources play through the browser's audio element. They are preloaded when the event opens, so a tap starts with no delay.

### Stopping
- [x] **PLAY-10** A STOP button shows the elapsed playback time (mm:ss). Pressing it stops all audio, Spotify and MP3.
- [x] **PLAY-11** On a keyboard, pressing **Space** stops playback, unless the focus is in a text field.

### Transitions
- [x] **PLAY-20** About 4 s before a Spotify track ends, its volume fades out.
- [x] **PLAY-21** When a Spotify song from the list ends by itself, the next song in the list starts automatically with a 2 s fade-in. Songs whose source is an MP3 are skipped.
- [x] **PLAY-22** A manual stop never triggers auto-advance.
- [x] **PLAY-23** For 8 s after playback starts, an "ended" state is ignored. This covers Spotify Connect buffering.

### Mode switch
- [x] **PLAY-30** Pressing "Edit" stops playback and opens Edit mode (see SONG-18).
- [x] **PLAY-31** No configuration is possible in performance mode, apart from resetting play counters (SONG-03).

## Edge cases & errors

- [x] **PLAY-40** If no playback device is available, the error "Player not ready. Please wait." is shown on desktop, or "No Spotify device selected…" on a phone.
- [x] **PLAY-41** Spotify returns 404 when the target device is gone. The DJ is then told to open Spotify on that device and try again.

## Open questions

- [?] **PLAY-90** When a stinger interrupts a song, the song stays stopped. → parked as IDEA-02.
- [?] **PLAY-91** Auto-advance can't be turned off. → parked as IDEA-03.
