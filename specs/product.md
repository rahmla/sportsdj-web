# SportsDJ Web — Product spec

## Vision

A soundboard for DJs working live sports events. Before the event, the DJ sets up
**occasion buttons** (instant stingers such as ACE, BLOCK, WIN) and a **song list**
for play between rallies and during breaks. During the event, a single tap plays the
right music immediately, on desktop or on a phone.

## Users

- **Event DJ.** Often alone, under time pressure, frequently on a phone or tablet, with a Spotify Premium account.

## Glossary

| Term | Meaning |
|------|---------|
| **Event** | One saved setup (name, sport, buttons, songs). Formerly called "profile". |
| **Occasion button** | A coloured pad that plays one audio source from a start offset. |
| **Song** | An item in the event's ordered song list; it has a play counter. |
| **Audio source** | A Spotify track, a Spotify playlist/album, or a local MP3 file. |
| **Start offset** | The number of seconds into the track where playback begins. |
| **Template** | A built-in event that can be copied into a new event (currently: Beachvolley). |
| **Performance mode** | The default view, used for playing. |
| **Edit mode** | The view for configuring the active event. |

## Product constraints

- **G-01** Spotify playback requires a **Spotify Premium** account.
- **G-02** The app must be usable on both desktop and phones, including as an installed iOS home-screen app.
- **G-03** A DJ's events belong to their Spotify login and stay on their own device.
- **G-04** The UI language is English.

Technical properties (hosting, security, storage, playback back-ends, data model) are in [architecture.md](architecture.md).

## Feature specs

- [Spotify login](features/auth.md) — `AUTH`
- [Events](features/events.md) — `EVT`
- [Occasion buttons](features/occasion-buttons.md) — `BTN`
- [Song list](features/songs.md) — `SONG`
- [Performance mode](features/performance.md) — `PLAY`
- [Devices & mobile](features/devices.md) — `DEV`
