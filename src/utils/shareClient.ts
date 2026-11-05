import type { DJEvent } from '../types'
import { validateEvent } from './eventValidation'

export const PENDING_SHARE_KEY = 'sportsdj_pending_share'

export type ShareErrorKind = 'not_found' | 'too_large' | 'rate_limited' | 'unavailable' | 'invalid'

export class ShareError extends Error {
  kind: ShareErrorKind
  constructor(message: string, kind: ShareErrorKind) {
    super(message)
    this.kind = kind
  }
}

export function shareUrl(id: string, origin = window.location.origin): string {
  return `${origin}/s/${id}`
}

/** Returns the share id when the path is `/s/<id>`, otherwise null (SHARE-10). */
export function parseSharePath(pathname: string): string | null {
  const m = pathname.match(/^\/s\/([A-Za-z0-9_-]{16})\/?$/)
  return m ? m[1] : null
}

async function readJson(res: Response): Promise<Record<string, unknown> | null> {
  try { return await res.json() } catch { return null }
}

/** Uploads a snapshot of the event and returns its id (SHARE-02, SHARE-40, SHARE-41). */
export async function createShareLink(event: DJEvent): Promise<{ id: string; mp3Buttons: number }> {
  let res: Response
  try {
    res = await fetch('/api/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) })
  } catch {
    throw new ShareError('Could not reach the sharing service. Check your connection, or use Export instead.', 'unavailable')
  }
  const body = await readJson(res)
  if (res.status === 413) throw new ShareError('This event is too large to share', 'too_large')
  if (res.status === 429) throw new ShareError('Too many shares. Try again later.', 'rate_limited')
  if (res.status === 400) throw new ShareError(typeof body?.error === 'string' ? body.error : 'This event cannot be shared', 'invalid')
  if (!res.ok || typeof body?.id !== 'string') throw new ShareError('Sharing is not available right now. Use Export instead.', 'unavailable')
  return { id: body.id, mp3Buttons: typeof body.mp3Buttons === 'number' ? body.mp3Buttons : 0 }
}

/** Loads a shared snapshot and validates it before use (SHARE-10, SHARE-13, SHARE-14). */
export async function fetchSharedEvent(id: string): Promise<{ event: DJEvent; mp3Buttons: number }> {
  let res: Response
  try {
    res = await fetch(`/api/share/${id}`)
  } catch {
    throw new ShareError('Could not reach the sharing service.', 'unavailable')
  }
  if (res.status === 404) throw new ShareError('This link does not exist or has expired', 'not_found')
  const body = await readJson(res)
  if (!res.ok || !body) throw new ShareError('Sharing is not available right now.', 'unavailable')
  const checked = validateEvent(body.event)
  if (!checked.ok) throw new ShareError(`This shared event is not valid: ${checked.error}`, 'invalid')
  return { event: checked.event, mp3Buttons: typeof body.mp3Buttons === 'number' ? body.mp3Buttons : 0 }
}
