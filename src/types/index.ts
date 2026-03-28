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
}

export interface SportProfile {
  id: string
  name: string
  sport: string
  occasionButtons: OccasionButton[]
  songs: SongItem[]
}
