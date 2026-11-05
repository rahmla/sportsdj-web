import { vi } from 'vitest'
import type { SpotifyHook } from '../hooks/useSpotify'
import type { DJEvent, SongItem } from '../types'

export function fakeSpotify(overrides: Partial<SpotifyHook> = {}): SpotifyHook {
  return {
    token: 'token',
    user: null,
    deviceId: 'device',
    isReady: true,
    isPlaying: false,
    position: 0,
    duration: 0,
    error: null,
    isMobile: false,
    devices: [],
    selectedDeviceId: null,
    login: vi.fn(async () => {}),
    logout: vi.fn(),
    playUri: vi.fn(async () => {}),
    pause: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
    setVolume: vi.fn(async () => {}),
    fetchDevices: vi.fn(async () => {}),
    selectDevice: vi.fn(),
    getPosition: vi.fn(() => 0),
    ...overrides,
  }
}

export function song(id: string, title: string, playCount = 0, startOffset = 0): SongItem {
  return {
    id,
    title,
    order: 0,
    startOffset,
    playCount,
    audioSource: { type: 'spotifyTrack', uri: `spotify:track:${id}`, name: title },
  }
}

export function sampleEvent(): DJEvent {
  return {
    id: 'e1',
    name: 'Final',
    sport: 'Beachvolley',
    occasionButtons: [
      { id: 'b1', label: 'ACE', colorHex: '#7700BB', startOffset: 5, audioSource: { type: 'spotifyTrack', uri: 'spotify:track:ace', name: 'ACE' } },
      { id: 'b2', label: 'NONE', colorHex: '#666666', startOffset: 0 },
    ],
    songs: [song('s1', 'First Song', 2, 30), song('s2', 'Second Song')],
  }
}
