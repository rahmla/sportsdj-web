# Devices & mobile

**Area code:** `DEV`  ·  **Status:** implemented

## Why

Many DJs run the event from a phone. Mobile browsers cannot host the Spotify Web Playback SDK, so on a phone the app controls another Spotify device through Spotify Connect.

## Acceptance criteria

- [x] **DEV-01** Desktop: the app registers its own Web Playback SDK player in the browser and plays through it.
- [x] **DEV-02** A device counts as mobile when its user agent matches iPhone, iPad, iPod or Android. On mobile the app plays through a Spotify Connect device chosen by the DJ.
- [x] **DEV-03** On mobile, "Select device" opens a list of the DJ's Spotify devices with a Refresh button. The selected device is marked.
- [x] **DEV-04** The selected device is remembered across reloads.
- [x] **DEV-05** When no devices are found, the DJ is told to open Spotify on a phone or computer, start playing something, and then refresh.
- [x] **DEV-06** On mobile, fades use fewer volume steps (5 in, 6 out instead of 20 in, 30 out) to stay under Spotify's API rate limits.
- [x] **DEV-07** The app installs as a PWA, and an installed iOS PWA picks up a new deploy without stalling (how: ARCH-02, ARCH-03).
- [x] **DEV-08** Every tap target uses `touch-manipulation`, so there is no 300 ms tap delay.

## Open questions

- [?] **DEV-90** iPads that report a desktop user agent (iPadOS "Request Desktop Website") are treated as desktop, and the SDK may fail there. Should detection use a feature check instead?
