export interface AudioSource {
  type: 'spotifyTrack' | 'spotifyPlaylist'
  uri: string
  name: string
}

export interface OccasionButton {
  id: string
  label: string
  colorHex: string
  audioSource?: AudioSource
  startOffset: number
}

export interface SongItem {
  id: string
  title: string
  audioSource?: AudioSource
  order: number
  startOffset: number
  playCount?: number
}

export interface DJEvent {
  id: string
  name: string
  sport: string
  occasionButtons: OccasionButton[]
  songs: SongItem[]
}

// Keep backward compat alias so old localStorage data still loads
export type SportProfile = DJEvent
