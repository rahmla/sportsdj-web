import { v4 as uuidv4 } from 'uuid'
import type { OccasionButton, SportProfile } from '../types'

const PROFILES_KEY = 'sportsdj_profiles'
const ACTIVE_PROFILE_KEY = 'sportsdj_active_profile'

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

export function createDefaultProfile(name: string = 'My Team'): SportProfile {
  return {
    id: uuidv4(),
    name,
    sport: 'Volleyball',
    occasionButtons: DEFAULT_BUTTONS.map(btn => ({ ...btn, id: uuidv4() })),
    songs: [],
  }
}

export function loadProfiles(): SportProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    if (!raw) return [createDefaultProfile()]
    const parsed = JSON.parse(raw) as SportProfile[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [createDefaultProfile()]
    }
    return parsed
  } catch {
    return [createDefaultProfile()]
  }
}

export function saveProfiles(profiles: SportProfile[]): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

export function loadActiveProfileId(): string | null {
  return localStorage.getItem(ACTIVE_PROFILE_KEY)
}

export function saveActiveProfileId(id: string): void {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id)
}
