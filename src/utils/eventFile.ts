import { v4 as uuidv4 } from 'uuid'
import type { DJEvent } from '../types'

export function eventFileName(event: DJEvent): string {
  return `${event.name.replace(/\s+/g, '_')}.sportsdj.json`
}

export function serializeEvent(event: DJEvent): string {
  return JSON.stringify(event, null, 2)
}

/** Parses an exported event file and gives it a fresh id. Throws Error('Invalid event file') if it is not valid JSON. */
export function parseEventFile(text: string): DJEvent {
  try {
    const parsed = JSON.parse(text) as DJEvent
    return { ...parsed, id: uuidv4() }
  } catch {
    throw new Error('Invalid event file')
  }
}
