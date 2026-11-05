import { describe, expect, test } from 'vitest'
import { parseCsvRow, parseExportifyCsv } from './csv'

const HEADER = 'Track URI,Track Name,Artist Name(s),Album Name'

describe('parseCsvRow', () => {
  test('TEST-11 splits on commas', () => {
    expect(parseCsvRow('a,b,c')).toEqual(['a', 'b', 'c'])
  })
  test('TEST-11 keeps commas and escaped quotes inside quoted fields', () => {
    expect(parseCsvRow('"a,b","say ""hi""",c')).toEqual(['a,b', 'say "hi"', 'c'])
  })
  test('TEST-11 keeps empty fields', () => {
    expect(parseCsvRow('a,,c,')).toEqual(['a', '', 'c', ''])
  })
})

describe('parseExportifyCsv', () => {
  test('SONG-15 TEST-11 titles are "Track – Artist1, Artist2" and rows keep file order', () => {
    const csv = [HEADER, 'spotify:track:1,Song A,Artist X;Artist Y,Album', 'spotify:track:2,Song B,Artist Z,Album'].join('\n')
    expect(parseExportifyCsv(csv).map(t => [t.uri, t.title])).toEqual([
      ['spotify:track:1', 'Song A – Artist X, Artist Y'],
      ['spotify:track:2', 'Song B – Artist Z'],
    ])
  })

  test('SONG-15 TEST-11 rows whose URI is not spotify:track: are skipped', () => {
    const csv = [HEADER, 'spotify:episode:9,Pod,Host,Show', 'spotify:track:1,Song A,Artist,Album'].join('\n')
    expect(parseExportifyCsv(csv)).toHaveLength(1)
  })

  test('SONG-15 TEST-11 handles Windows line endings and quoted titles with commas', () => {
    const csv = [HEADER, 'spotify:track:1,"Hello, World",Artist,Album'].join('\r\n')
    expect(parseExportifyCsv(csv)[0].title).toBe('Hello, World – Artist')
  })

  test('SONG-15 TEST-11 falls back to the track name, then the URI, when the artist or name is missing', () => {
    expect(parseExportifyCsv([HEADER, 'spotify:track:1,Only Name,,Album'].join('\n'))[0].title).toBe('Only Name')
    expect(parseExportifyCsv([HEADER, 'spotify:track:1,,,Album'].join('\n'))[0].title).toBe('spotify:track:1')
  })

  test('SONG-16 TEST-11 an empty file or a header only gives "CSV file is empty"', () => {
    expect(() => parseExportifyCsv('')).toThrow('CSV file is empty')
    expect(() => parseExportifyCsv(HEADER)).toThrow('CSV file is empty')
  })

  test('SONG-16 TEST-11 no URI column gives the Exportify hint', () => {
    expect(() => parseExportifyCsv('Name,Artist\nA,B')).toThrow('No URI column found. Make sure this is an Exportify CSV.')
  })

  test('SONG-16 TEST-11 no spotify:track: rows gives "No tracks found in CSV"', () => {
    expect(() => parseExportifyCsv([HEADER, 'spotify:episode:9,Pod,Host,Show'].join('\n'))).toThrow('No tracks found in CSV')
  })
})
