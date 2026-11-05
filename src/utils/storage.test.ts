import { describe, expect, test } from 'vitest'
import {
  createDefaultEvent,
  loadActiveEventId,
  loadEvents,
  saveActiveEventId,
  saveEvents,
} from './storage'

describe('storage', () => {
  test('TEST-13 EVT-02 a new default event has 8 grey NON buttons and no songs', () => {
    const ev = createDefaultEvent()
    expect(ev.occasionButtons).toHaveLength(8)
    expect(ev.occasionButtons.every(b => b.label === 'NON' && b.colorHex === '#666666')).toBe(true)
    expect(ev.songs).toEqual([])
  })

  test('TEST-13 loading with nothing saved returns one default event', () => {
    expect(loadEvents('u1')).toHaveLength(1)
  })

  test('TEST-13 ARCH-42 saved events round-trip', () => {
    const events = [createDefaultEvent('A'), createDefaultEvent('B')]
    saveEvents('u1', events)
    expect(loadEvents('u1')).toEqual(events)
  })

  test('TEST-13 ARCH-20 events are separated per user', () => {
    saveEvents('u1', [createDefaultEvent('Mine')])
    expect(loadEvents('u2')[0].name).toBe('My Event')
  })

  test('TEST-13 corrupt or empty stored data falls back to a default event', () => {
    localStorage.setItem('sportsdj_events_u1', '{not json')
    expect(loadEvents('u1')).toHaveLength(1)
    localStorage.setItem('sportsdj_events_u1', '[]')
    expect(loadEvents('u1')).toHaveLength(1)
    localStorage.setItem('sportsdj_events_u1', '{"a":1}')
    expect(loadEvents('u1')).toHaveLength(1)
  })

  test('TEST-13 the active event id round-trips', () => {
    expect(loadActiveEventId('u1')).toBeNull()
    saveActiveEventId('u1', 'abc')
    expect(loadActiveEventId('u1')).toBe('abc')
  })
})
