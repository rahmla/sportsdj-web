import { describe, expect, test } from 'vitest'
import { normalizeSpotifyUri } from './spotifyUri'

describe('normalizeSpotifyUri', () => {
  test('TEST-10 BTN-12 SONG-11 keeps a spotify: URI as is', () => {
    expect(normalizeSpotifyUri('spotify:track:abc123')).toBe('spotify:track:abc123')
  })

  test.each(['track', 'playlist', 'album'])('TEST-10 BTN-12 converts an open.spotify.com %s link', type => {
    expect(normalizeSpotifyUri(`https://open.spotify.com/${type}/4uLU6hMCjMI75M1A2tKUQC`)).toBe(`spotify:${type}:4uLU6hMCjMI75M1A2tKUQC`)
  })

  test('TEST-10 SONG-11 ignores the query string on a link', () => {
    expect(normalizeSpotifyUri('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=xyz')).toBe('spotify:track:4uLU6hMCjMI75M1A2tKUQC')
  })

  test('TEST-10 trims whitespace and returns empty for empty input', () => {
    expect(normalizeSpotifyUri('  spotify:track:abc  ')).toBe('spotify:track:abc')
    expect(normalizeSpotifyUri('   ')).toBe('')
  })

  test('TEST-10 unrecognised input is returned trimmed, not converted', () => {
    expect(normalizeSpotifyUri(' hello ')).toBe('hello')
    expect(normalizeSpotifyUri('https://open.spotify.com/artist/abc')).toBe('https://open.spotify.com/artist/abc')
  })
})
