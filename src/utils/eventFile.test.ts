import { describe, expect, test } from 'vitest'
import { createDefaultEvent } from './storage'
import { eventFileName, parseEventFile, serializeEvent } from './eventFile'

describe('event file', () => {
  test('EVT-30 TEST-12 the file name replaces spaces with underscores', () => {
    expect(eventFileName({ ...createDefaultEvent(), name: 'Beach Volley Final' })).toBe('Beach_Volley_Final.sportsdj.json')
  })

  test('EVT-30 EVT-31 TEST-12 an exported event can be imported with the same content and a fresh id', () => {
    const original = { ...createDefaultEvent('Round trip'), songs: [{ id: 's1', title: 'Song', order: 0, startOffset: 12, playCount: 3 }] }
    const imported = parseEventFile(serializeEvent(original))
    expect(imported.id).not.toBe(original.id)
    expect({ ...imported, id: original.id }).toEqual(original)
  })

  test('EVT-32 TEST-12 a file that is not valid JSON throws "Invalid event file"', () => {
    expect(() => parseEventFile('{not json')).toThrow('Invalid event file')
    expect(() => parseEventFile('')).toThrow('Invalid event file')
  })

  test('EVT-40 ARCH-24 TEST-12 JSON that is not an event is rejected with a reason', () => {
    expect(() => parseEventFile('null')).toThrow('Invalid event file: The file does not contain an event')
    expect(() => parseEventFile('123')).toThrow('Invalid event file')
    expect(() => parseEventFile('{}')).toThrow('Invalid event file: The event has no name')
    expect(() => parseEventFile('{"name":"X"}')).toThrow('occasionButtons')
    expect(() => parseEventFile('{"name":"X","occasionButtons":[]}')).toThrow('songs')
  })
})
