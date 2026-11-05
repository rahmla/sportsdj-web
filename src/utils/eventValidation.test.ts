import { describe, expect, test } from 'vitest'
import { validateEvent, MAX_BUTTONS, MAX_SONGS } from './eventValidation'
import { sampleEvent } from '../test/fakes'
import { BUILT_IN_TEMPLATES } from './templates'

describe('validateEvent', () => {
  test('EVT-40 ARCH-24 a valid event passes unchanged', () => {
    const ev = sampleEvent()
    const r = validateEvent(ev)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.event).toEqual(ev)
  })

  test('EVT-03 ARCH-24 every built-in template is valid', () => {
    for (const t of BUILT_IN_TEMPLATES) expect(validateEvent(t).ok).toBe(true)
  })

  test.each([[null], [undefined], [42], ['x'], [[]], [{}]])('EVT-40 %j is not an event', input => {
    expect(validateEvent(input).ok).toBe(false)
  })

  test('EVT-40 a missing buttons or songs list is rejected', () => {
    expect(validateEvent({ name: 'X', songs: [] })).toEqual({ ok: false, error: 'The event has no occasionButtons list' })
    expect(validateEvent({ name: 'X', occasionButtons: [] })).toEqual({ ok: false, error: 'The event has no songs list' })
  })

  test('ARCH-23 old events with missing optional fields get defaults', () => {
    const r = validateEvent({ name: 'Old', occasionButtons: [{ id: 'b', label: 'A' }], songs: [{ id: 's', title: 'T' }] })
    expect(r.ok && r.event.sport).toBe('')
    expect(r.ok && r.event.occasionButtons[0]).toEqual({ id: 'b', label: 'A', colorHex: '#666666', startOffset: 0 })
    expect(r.ok && r.event.songs[0]).toMatchObject({ order: 0, startOffset: 0, playCount: 0 })
  })

  test('SHARE-13 unknown fields are dropped', () => {
    const r = validateEvent({ ...sampleEvent(), evil: '<script>', occasionButtons: [{ id: 'b', label: 'A', extra: 1 }], songs: [] })
    expect(r.ok && JSON.stringify(r.event)).not.toContain('evil')
    expect(r.ok && JSON.stringify(r.event)).not.toContain('extra')
  })

  test('SHARE-13 an audio source with a bad type or a bad Spotify URI is rejected', () => {
    const bad = (audioSource: unknown) => validateEvent({ name: 'X', occasionButtons: [{ id: 'b', label: 'A', audioSource }], songs: [] }).ok
    expect(bad({ type: 'youtube', uri: 'x', name: 'n' })).toBe(false)
    expect(bad({ type: 'spotifyTrack', uri: 'https://evil.example', name: 'n' })).toBe(false)
    expect(bad({ type: 'spotifyTrack', uri: 'spotify:track:abc123', name: 'n' })).toBe(true)
    expect(bad({ type: 'mp3', uri: '', name: 'n', fileKey: 'k' })).toBe(true)
  })

  test('SHARE-13 limits on the number of buttons and songs', () => {
    const buttons = Array.from({ length: MAX_BUTTONS + 1 }, (_, i) => ({ id: `b${i}`, label: 'A' }))
    expect(validateEvent({ name: 'X', occasionButtons: buttons, songs: [] }).ok).toBe(false)
    const songs = Array.from({ length: MAX_SONGS + 1 }, (_, i) => ({ id: `s${i}`, title: 'T' }))
    expect(validateEvent({ name: 'X', occasionButtons: [], songs }).ok).toBe(false)
  })

  test('SHARE-13 invalid colours and negative offsets fall back to defaults', () => {
    const r = validateEvent({ name: 'X', occasionButtons: [{ id: 'b', label: 'A', colorHex: 'red', startOffset: -5 }], songs: [] })
    expect(r.ok && r.event.occasionButtons[0]).toMatchObject({ colorHex: '#666666', startOffset: 0 })
  })
})
