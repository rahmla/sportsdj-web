import { describe, expect, test } from 'vitest'
import { createShare, createShareId, getShare, isValidShareId, toSnapshot, RATE_LIMIT, MAX_SNAPSHOT_BYTES, SNAPSHOT_TTL_SECONDS, type ShareStore } from './share'
import { sampleEvent, song } from '../test/fakes'

function memoryStore() {
  const data = new Map<string, string>()
  const ttls = new Map<string, number>()
  const counters = new Map<string, number>()
  const store: ShareStore = {
    get: async k => data.get(k) ?? null,
    set: async (k, v, ttl) => { data.set(k, v); ttls.set(k, ttl) },
    touch: async (k, ttl) => { ttls.set(k, ttl) },
    incr: async k => { const n = (counters.get(k) ?? 0) + 1; counters.set(k, n); return n },
  }
  return { store, data, ttls }
}

describe('share ids', () => {
  test('SHARE-03 ids are 16 URL-safe characters and different every time', () => {
    const ids = new Set(Array.from({ length: 200 }, createShareId))
    expect(ids.size).toBe(200)
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]{16}$/)
  })

  test('SHARE-14 only well-formed ids are accepted', () => {
    expect(isValidShareId(createShareId())).toBe(true)
    for (const bad of ['', 'short', 'x'.repeat(17), '../../etc/passwd01', undefined, 42, null]) expect(isValidShareId(bad)).toBe(false)
  })
})

describe('toSnapshot', () => {
  test('SHARE-02 play counts are reset to 0', () => {
    const { snapshot } = toSnapshot(sampleEvent())
    expect(snapshot.songs.every(s => s.playCount === 0)).toBe(true)
  })

  test('SHARE-20 MP3 buttons lose their source but keep label and colour, and are counted', () => {
    const ev = sampleEvent()
    ev.occasionButtons.push({ id: 'b3', label: 'HORN', colorHex: '#123456', startOffset: 0, audioSource: { type: 'mp3', uri: '', name: 'horn.mp3', fileKey: 'k1' } })
    const { snapshot, mp3Buttons } = toSnapshot(ev)
    expect(mp3Buttons).toBe(1)
    const horn = snapshot.occasionButtons.find(b => b.id === 'b3')!
    expect(horn).toEqual({ id: 'b3', label: 'HORN', colorHex: '#123456', startOffset: 0 })
  })

  test('SHARE-20 MP3 songs are left out', () => {
    const ev = sampleEvent()
    ev.songs.push({ ...song('s3', 'Local file'), audioSource: { type: 'mp3', uri: '', name: 'a.mp3', fileKey: 'k2' } })
    expect(toSnapshot(ev).snapshot.songs.map(s => s.id)).toEqual(['s1', 's2'])
  })

  test('SHARE-05 the original event is not changed', () => {
    const ev = sampleEvent()
    toSnapshot(ev)
    expect(ev.songs[0].playCount).toBe(2)
  })
})

describe('createShare', () => {
  test('SHARE-30 SHARE-32 stores a snapshot with the 90 day expiry and returns its id', async () => {
    const { store, data, ttls } = memoryStore()
    const r = await createShare(sampleEvent(), '1.2.3.4', store)
    expect(r.status).toBe(201)
    const id = r.body.id as string
    expect(isValidShareId(id)).toBe(true)
    expect(JSON.parse(data.get(`share:${id}`)!).name).toBe('Final')
    expect(ttls.get(`share:${id}`)).toBe(SNAPSHOT_TTL_SECONDS)
  })

  test('SHARE-02 SHARE-33 the stored snapshot has no play counts', async () => {
    const { store, data } = memoryStore()
    const r = await createShare(sampleEvent(), 'ip', store)
    const saved = JSON.parse(data.get(`share:${r.body.id}`)!)
    expect(saved.songs.map((s: { playCount: number }) => s.playCount)).toEqual([0, 0])
  })

  test('SHARE-30 SHARE-13 something that is not an event gives 400 and stores nothing', async () => {
    const { store, data } = memoryStore()
    expect((await createShare({ hello: 1 }, 'ip', store)).status).toBe(400)
    expect(data.size).toBe(0)
  })

  test('SHARE-41 SHARE-30 a snapshot over 200 KB gives 413', async () => {
    const { store, data } = memoryStore()
    const ev = sampleEvent()
    ev.songs = Array.from({ length: 900 }, (_, i) => ({ ...song(`s${i}`, 'x'.repeat(290)), order: i }))
    expect(JSON.stringify(ev).length).toBeGreaterThan(MAX_SNAPSHOT_BYTES)
    const r = await createShare(ev, 'ip', store)
    expect(r.status).toBe(413)
    expect(data.size).toBe(0)
  })

  test('SHARE-31 the 21st share in the window from one client gives 429, other clients are unaffected', async () => {
    const { store } = memoryStore()
    for (let i = 0; i < RATE_LIMIT; i++) expect((await createShare(sampleEvent(), 'a', store)).status).toBe(201)
    expect((await createShare(sampleEvent(), 'a', store)).status).toBe(429)
    expect((await createShare(sampleEvent(), 'b', store)).status).toBe(201)
  })
})

describe('getShare', () => {
  test('SHARE-30 a created snapshot can be read back', async () => {
    const { store } = memoryStore()
    const { body } = await createShare(sampleEvent(), 'ip', store)
    const r = await getShare(body.id, store)
    expect(r.status).toBe(200)
    expect((r.body.event as { name: string }).name).toBe('Final')
  })

  test('SHARE-14 an unknown or malformed id gives 404', async () => {
    const { store } = memoryStore()
    expect((await getShare(createShareId(), store)).status).toBe(404)
    expect((await getShare('nope', store)).status).toBe(404)
  })

  test('SHARE-90 reading a link renews its expiry', async () => {
    const { store, ttls } = memoryStore()
    const { body } = await createShare(sampleEvent(), 'ip', store)
    ttls.set(`share:${body.id}`, 5)
    await getShare(body.id, store)
    expect(ttls.get(`share:${body.id}`)).toBe(SNAPSHOT_TTL_SECONDS)
  })
})
