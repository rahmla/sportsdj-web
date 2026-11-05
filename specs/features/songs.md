# Song list

**Area code:** `SONG`  ·  **Status:** implemented

## Why

Between rallies and during breaks, the DJ plays songs from a prepared, ordered list. Each song can start at its best moment (its start offset).

## Acceptance criteria

### In performance mode
- [ ] **SONG-01** Songs are shown as a grid of tiles (SONG-20), sorted by `order`, and the song area scrolls on its own. *(Changed by F-017. It was a list of rows.)*
- [x] **SONG-02** Each tile shows a play counter. It goes up by 1 every time the song is started. *(Changed by F-017. The counter used to be on the left of a row.)*
- [x] **SONG-03** "Reset" sets every play counter in the event back to 0.

### Song grid (F-017, replaces the list)
- [ ] **SONG-20** Songs are square tiles in a grid. The number of columns follows the available width, with tiles at least 104 px wide, so phones get 3 or more per row and wide screens get more.
- [x] **SONG-21** A tile shows the song title, centred, cut off with "…" after 3 lines. The full title is the tile's accessible name ("Play <title>") and its tooltip.
- [x] **SONG-22** The play counter is a small badge in the tile's top-left corner. It is green when above 0 and grey at 0 (as in the old list).
- [x] **SONG-23** The tile of the song that is playing is highlighted with a green background and ring (as in the old list).
- [x] **SONG-24** A tile whose song has no source is dimmed and does nothing when tapped (PLAY-03).
- [x] **SONG-25** The reading order of the grid (left to right, top to bottom) is the `order` of the songs. Auto-advance (PLAY-21) still starts the next song in that order.
- [x] **SONG-26** The "Songs" heading and the "Reset play counters" button (SONG-03) stay above and below the grid, with the same behaviour.

### Edge cases
- [x] **SONG-40** A very long title, or a title without spaces, stays inside its tile and does not widen the grid.

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
