import { describe, expect, test } from 'vitest'
import { BUILT_IN_TEMPLATES } from './templates'

describe.each(BUILT_IN_TEMPLATES.map(t => [t.name, t] as const))('template %s', (_name, t) => {
  test('EVT-03 TEST-15 has an id, a name, and buttons and songs with unique ids', () => {
    expect(t.id).toBeTruthy()
    expect(t.name).toBeTruthy()
    expect(t.occasionButtons.length).toBeGreaterThanOrEqual(8)
    expect(new Set(t.occasionButtons.map(b => b.id)).size).toBe(t.occasionButtons.length)
    expect(new Set(t.songs.map(s => s.id)).size).toBe(t.songs.length)
  })

  test('EVT-03 TEST-15 every audio source is a valid spotify: URI of its declared type', () => {
    const sources = [...t.occasionButtons, ...t.songs].flatMap(x => (x.audioSource ? [x.audioSource] : []))
    for (const s of sources) {
      expect(s.uri).toMatch(/^spotify:(track|playlist|album):[A-Za-z0-9]+$/)
    }
  })

  test('EVT-03 TEST-15 songs start with play count 0 and a non-negative offset', () => {
    for (const s of t.songs) {
      expect(s.playCount ?? 0).toBe(0)
      expect(s.startOffset).toBeGreaterThanOrEqual(0)
    }
  })
})
