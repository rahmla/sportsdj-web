export interface AudioSource {
  type: 'spotifyTrack' | 'spotifyPlaylist' | 'mp3'
  uri: string        // spotify URI; empty string for mp3
  name: string       // display name
  fileKey?: string   // IndexedDB key (mp3 only)
  fileName?: string  // original filename for display (mp3 only)
}

/** Returns a stable identifier for tracking which source is playing */
export function sourceId(source: AudioSource): string {
  return source.type === 'mp3' ? (source.fileKey ?? '') : source.uri
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
