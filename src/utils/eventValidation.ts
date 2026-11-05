import type { AudioSource, DJEvent, OccasionButton, SongItem } from '../types/index.js'

export const MAX_BUTTONS = 40
export const MAX_SONGS = 1000
const MAX_TEXT = 300

type Result = { ok: true; event: DJEvent } | { ok: false; error: string }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function text(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v.slice(0, MAX_TEXT) : fallback
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback
}

function audioSource(v: unknown): AudioSource | undefined | null {
  if (v === undefined || v === null) return undefined
  if (!isObject(v)) return null
  if (v.type !== 'spotifyTrack' && v.type !== 'spotifyPlaylist' && v.type !== 'mp3') return null
  const out: AudioSource = { type: v.type, uri: text(v.uri), name: text(v.name) }
  if (v.type === 'mp3') {
    if (typeof v.fileKey === 'string') out.fileKey = text(v.fileKey)
    if (typeof v.fileName === 'string') out.fileName = text(v.fileName)
  } else if (!/^spotify:(track|playlist|album):[A-Za-z0-9]+$/.test(out.uri)) {
    return null
  }
  return out
}

/**
 * Checks that unknown data is an event and returns a clean copy with only the known fields (EVT-40, ARCH-24, SHARE-13).
 * Missing optional fields get defaults, so old exports still load (ARCH-23).
 */
export function validateEvent(input: unknown): Result {
  if (!isObject(input)) return { ok: false, error: 'The file does not contain an event' }
  if (typeof input.name !== 'string' || !input.name.trim()) return { ok: false, error: 'The event has no name' }
  if (!Array.isArray(input.occasionButtons)) return { ok: false, error: 'The event has no occasionButtons list' }
  if (!Array.isArray(input.songs)) return { ok: false, error: 'The event has no songs list' }
  if (input.occasionButtons.length > MAX_BUTTONS) return { ok: false, error: `The event has more than ${MAX_BUTTONS} buttons` }
  if (input.songs.length > MAX_SONGS) return { ok: false, error: `The event has more than ${MAX_SONGS} songs` }

  const buttons: OccasionButton[] = []
  for (const [i, b] of input.occasionButtons.entries()) {
    if (!isObject(b)) return { ok: false, error: `Button ${i + 1} is not valid` }
    const source = audioSource(b.audioSource)
    if (source === null) return { ok: false, error: `Button ${i + 1} has an invalid audio source` }
    const button: OccasionButton = {
      id: text(b.id, `btn-${i}`) || `btn-${i}`,
      label: text(b.label),
      colorHex: /^#[0-9a-fA-F]{6}$/.test(String(b.colorHex)) ? String(b.colorHex) : '#666666',
      startOffset: num(b.startOffset),
    }
    if (source) button.audioSource = source
    buttons.push(button)
  }

  const songs: SongItem[] = []
  for (const [i, s] of input.songs.entries()) {
    if (!isObject(s)) return { ok: false, error: `Song ${i + 1} is not valid` }
    const source = audioSource(s.audioSource)
    if (source === null) return { ok: false, error: `Song ${i + 1} has an invalid audio source` }
    const song: SongItem = {
      id: text(s.id, `song-${i}`) || `song-${i}`,
      title: text(s.title),
      order: num(s.order, i),
      startOffset: num(s.startOffset),
      playCount: num(s.playCount),
    }
    if (source) song.audioSource = source
    songs.push(song)
  }

  return { ok: true, event: { id: text(input.id, 'event') || 'event', name: text(input.name), sport: text(input.sport), occasionButtons: buttons, songs } }
}
