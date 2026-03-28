import { v4 as uuidv4 } from 'uuid'
import type { OccasionButton, DJEvent } from '../types'

function eventsKey(userId: string) { return `sportsdj_events_${userId}` }
function activeKey(userId: string) { return `sportsdj_active_${userId}` }

export const DEFAULT_BUTTONS: OccasionButton[] = [
  { id: 'btn-ace',   label: 'ACE',   colorHex: '#7700BB', startOffset: 0 },
  { id: 'btn-boom',  label: 'BOOM',  colorHex: '#CC0000', startOffset: 0 },
  { id: 'btn-block', label: 'BLOCK', colorHex: '#0044CC', startOffset: 0 },
  { id: 'btn-dig',   label: 'DIG',   colorHex: '#CC5500', startOffset: 0 },
  { id: 'btn-rally', label: 'RALLY', colorHex: '#007A00', startOffset: 0 },
  { id: 'btn-time',  label: 'TIME',  colorHex: '#007A7A', startOffset: 0 },
  { id: 'btn-drama', label: 'DRAMA', colorHex: '#885500', startOffset: 0 },
  { id: 'btn-wait',  label: 'WAIT',  colorHex: '#556B2F', startOffset: 0 },
]

export function createDefaultEvent(name = 'My Event'): DJEvent {
  return {
    id: uuidv4(),
    name,
    sport: '',
    occasionButtons: DEFAULT_BUTTONS.map(btn => ({ ...btn, id: uuidv4() })),
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
