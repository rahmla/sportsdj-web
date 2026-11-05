import { v4 as uuidv4 } from 'uuid'
import type { DJEvent } from '../types'
import { validateEvent } from './eventValidation'

export function eventFileName(event: DJEvent): string {
  return `${event.name.replace(/\s+/g, '_')}.sportsdj.json`
}

export function serializeEvent(event: DJEvent): string {
  return JSON.stringify(event, null, 2)
}

/**
 * Parses an exported event file and gives it a fresh id.
 * Throws Error('Invalid event file') if it is not valid JSON (EVT-32), and a message saying what is wrong if it is JSON but not an event (EVT-40).
 */
export function parseEventFile(text: string): DJEvent {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Invalid event file')
  }
  const checked = validateEvent(parsed)
  if (!checked.ok) throw new Error(`Invalid event file: ${checked.error}`)
  return { ...checked.event, id: uuidv4() }
}
