import { afterEach, describe, expect, test, vi } from 'vitest'
import { createShareLink, fetchSharedEvent, parseSharePath, shareUrl, ShareError } from './shareClient'
import { sampleEvent } from '../test/fakes'

const ID = 'AbCdEfGhIjKlMnOp'

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('share paths and urls', () => {
  test('SHARE-02 the link is <origin>/s/<id>', () => {
    expect(shareUrl(ID, 'https://sportsdj-web.vercel.app')).toBe(`https://sportsdj-web.vercel.app/s/${ID}`)
  })

  test('SHARE-10 /s/<id> is recognised, other paths are not', () => {
    expect(parseSharePath(`/s/${ID}`)).toBe(ID)
    expect(parseSharePath(`/s/${ID}/`)).toBe(ID)
    for (const p of ['/', '/callback', '/s/', '/s/short', `/s/${ID}x`, `/x/${ID}`]) expect(parseSharePath(p)).toBeNull()
  })
})

describe('createShareLink', () => {
  test('SHARE-02 posts the event and returns the id and the MP3 count', async () => {
    const f = mockFetch(201, { id: ID, mp3Buttons: 2 })
    await expect(createShareLink(sampleEvent())).resolves.toEqual({ id: ID, mp3Buttons: 2 })
    expect(f).toHaveBeenCalledWith('/api/share', expect.objectContaining({ method: 'POST' }))
  })

  test('SHARE-41 a too large event gives the "too large" message', async () => {
    mockFetch(413, { error: 'x' })
    await expect(createShareLink(sampleEvent())).rejects.toMatchObject({ kind: 'too_large', message: 'This event is too large to share' })
  })

  test('SHARE-31 the rate limit gives its own message', async () => {
    mockFetch(429, {})
    await expect(createShareLink(sampleEvent())).rejects.toMatchObject({ kind: 'rate_limited' })
  })

  test('SHARE-40 an unreachable server points to Export and does not throw anything else', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network') }))
    const err = await createShareLink(sampleEvent()).catch(e => e)
    expect(err).toBeInstanceOf(ShareError)
    expect(err.kind).toBe('unavailable')
    expect(err.message).toContain('Export')
  })

  test('SHARE-40 a server error (500, or an HTML page in dev) gives "not available"', async () => {
    mockFetch(500, { error: 'boom' })
    await expect(createShareLink(sampleEvent())).rejects.toMatchObject({ kind: 'unavailable' })
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html></html>', { status: 200 })))
    await expect(createShareLink(sampleEvent())).rejects.toMatchObject({ kind: 'unavailable' })
  })
})

describe('fetchSharedEvent', () => {
  test('SHARE-10 returns the validated event and the MP3 count', async () => {
    mockFetch(200, { event: sampleEvent(), mp3Buttons: 1 })
    const r = await fetchSharedEvent(ID)
    expect(r.event.name).toBe('Final')
    expect(r.mp3Buttons).toBe(1)
  })

  test('SHARE-14 an unknown link gives the expiry message', async () => {
    mockFetch(404, { error: 'not_found' })
    await expect(fetchSharedEvent(ID)).rejects.toMatchObject({ kind: 'not_found', message: 'This link does not exist or has expired' })
  })

  test('SHARE-13 an invalid snapshot is rejected before use', async () => {
    mockFetch(200, { event: { name: 'X' } })
    await expect(fetchSharedEvent(ID)).rejects.toMatchObject({ kind: 'invalid' })
  })
})
