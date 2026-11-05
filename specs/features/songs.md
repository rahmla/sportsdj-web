# Song list

**Area code:** `SONG`  ·  **Status:** implemented

## Why

Between rallies and during breaks, the DJ plays songs from a prepared, ordered list. Each song can start at its best moment (its start offset).

## Acceptance criteria

### In performance mode
- [x] **SONG-01** Songs are listed below the buttons, sorted by `order`, and the list scrolls on its own.
- [x] **SONG-02** Each row shows a play counter on the left. It goes up by 1 every time the song is started.
- [x] **SONG-03** "Reset" sets every play counter in the event back to 0.

### Editing (Edit mode → "Songs")
- [x] **SONG-10** "+ Song" adds a song titled "New Song" at the end and opens its editor.
- [x] **SONG-11** A song has a Spotify link or URI (normalised to `spotify:track:…`), a Title and a Start offset.
- [x] **SONG-12** After a valid track link is pasted, the title is fetched from the Spotify API as "Track – First artist".
- [x] **SONG-13** Preview plays the track from the current offset in Edit mode. Pressing it again stops it.
- [x] **SONG-14** While a preview plays, "Set here" stores the current playback position (in whole seconds) as the start offset.
- [x] **SONG-15** "+ CSV" imports an Exportify CSV. Rows whose URI is `spotify:track:…` are appended after the existing songs in file order, titled "Track – Artist1, Artist2".
- [x] **SONG-16** CSV errors are shown inline: "CSV file is empty", "No URI column found. Make sure this is an Exportify CSV." and "No tracks found in CSV".
- [x] **SONG-17** A song can be deleted from its row.
- [x] **SONG-18** When Edit is entered from performance mode, the last played song is opened for editing.

## Open questions

- [?] **SONG-90** There is no way to reorder songs, apart from deleting and re-adding them. → parked as IDEA-01.
- [?] **SONG-91** Songs can only use Spotify tracks, while buttons can also use MP3 and playlists. Is that intentional?
