import { v4 as uuidv4 } from 'uuid'
import type { DJEvent } from '../types'

function eventsKey(userId: string) { return `sportsdj_events_${userId}` }
function activeKey(userId: string) { return `sportsdj_active_${userId}` }

export function createDefaultEvent(name = 'My Event'): DJEvent {
  return {
    id: uuidv4(),
    name,
    sport: '',
    occasionButtons: Array.from({ length: 8 }, () => ({
      id: uuidv4(),
      label: 'NON',
      colorHex: '#666666',
      startOffset: 0,
    })),
    songs: [],
  }
}

export function loadEvents(userId: string): DJEvent[] {
  try {
    const raw = localStorage.getItem(eventsKey(userId))
    if (!raw) return [createDefaultEvent()]
    const parsed = JSON.parse(raw) as DJEvent[]
    if (!Array.isArray(parsed) || parsed.length === 0) return [createDefaultEvent()]
    return parsed
  } catch {
    return [createDefaultEvent()]
  }
}

export function saveEvents(userId: string, events: DJEvent[]): void {
  localStorage.setItem(eventsKey(userId), JSON.stringify(events))
}

export function loadActiveEventId(userId: string): string | null {
  return localStorage.getItem(activeKey(userId))
}

export function saveActiveEventId(userId: string, id: string): void {
  localStorage.setItem(activeKey(userId), id)
}
