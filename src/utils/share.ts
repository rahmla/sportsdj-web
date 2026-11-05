import type { DJEvent } from '../types'
import { validateEvent } from './eventValidation'

export const MAX_SNAPSHOT_BYTES = 200 * 1024
export const SNAPSHOT_TTL_SECONDS = 90 * 24 * 60 * 60 // SHARE-90
export const RATE_LIMIT = 20 // SHARE-31
export const RATE_WINDOW_SECONDS = 60 * 60

const ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const ID_LENGTH = 16 // 16 x 6 bits = 96 bits (SHARE-03)

export function createShareId(): string {
  const bytes = new Uint8Array(ID_LENGTH)
  crypto.getRandomValues(bytes)
  // 64 characters and 256 byte values: no modulo bias
  return Array.from(bytes, b => ID_ALPHABET[b % 64]).join('')
}

export function isValidShareId(id: unknown): id is string {
  return typeof id === 'string' && new RegExp(`^[A-Za-z0-9_-]{${ID_LENGTH}}$`).test(id)
}

/** A snapshot has play counts reset to 0 and no MP3 sources (SHARE-02, SHARE-20). */
export function toSnapshot(event: DJEvent): { snapshot: DJEvent; mp3Buttons: number } {
  let mp3Buttons = 0
  const occasionButtons = event.occasionButtons.map(b => {
    if (b.audioSource?.type === 'mp3') {
      mp3Buttons++
      const { audioSource: _omit, ...rest } = b
      void _omit
      return rest
    }
    return b
  })
  const songs = event.songs
    .filter(s => s.audioSource?.type !== 'mp3')
    .map(s => ({ ...s, playCount: 0 }))
  return { snapshot: { ...event, occasionButtons, songs }, mp3Buttons }
}

export function countMp3Buttons(event: DJEvent): number {
  return event.occasionButtons.filter(b => b.audioSource?.type === 'mp3').length
}

export interface ShareStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  touch(key: string, ttlSeconds: number): Promise<void>
  /** Adds 1 to a counter that expires after `windowSeconds` since its first increment, and returns the new value. */
  incr(key: string, windowSeconds: number): Promise<number>
}

export interface ApiResult {
  status: number
  body: Record<string, unknown>
}

/** POST /api/share (SHARE-30, 31, 32, 33, 41) */
export async function createShare(body: unknown, clientId: string, store: ShareStore): Promise<ApiResult> {
  const used = await store.incr(`ratelimit:${clientId}`, RATE_WINDOW_SECONDS)
  if (used > RATE_LIMIT) return { status: 429, body: { error: 'Too many shares. Try again later.' } }

  const checked = validateEvent(body)
  if (!checked.ok) return { status: 400, body: { error: checked.error } }
  const { snapshot } = toSnapshot(checked.event)
  const json = JSON.stringify(snapshot)
  if (new TextEncoder().encode(json).length > MAX_SNAPSHOT_BYTES) {
    return { status: 413, body: { error: 'This event is too large to share' } }
  }
  const id = createShareId()
  await store.set(`share:${id}`, json, SNAPSHOT_TTL_SECONDS)
  return { status: 201, body: { id } }
}

/** GET /api/share/<id> (SHARE-14, SHARE-90) */
export async function getShare(id: unknown, store: ShareStore): Promise<ApiResult> {
  if (!isValidShareId(id)) return { status: 404, body: { error: 'not_found' } }
  const raw = await store.get(`share:${id}`)
  if (!raw) return { status: 404, body: { error: 'not_found' } }
  await store.touch(`share:${id}`, SNAPSHOT_TTL_SECONDS)
  return { status: 200, body: { event: JSON.parse(raw) } }
}
