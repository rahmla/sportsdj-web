declare namespace Spotify {
  interface PlayerInit {
    name: string
    getOAuthToken: (cb: (token: string) => void) => void
    volume?: number
  }

  interface Error {
    message: string
  }

  interface WebPlaybackInstance {
    device_id: string
  }

  interface Track {
    uri: string
    id: string | null
    type: 'track' | 'episode' | 'ad'
    media_type: 'audio' | 'video'
    name: string
    is_playable: boolean
    album: {
      uri: string
      name: string
      images: { url: string }[]
    }
    artists: { uri: string; name: string }[]
  }

  interface PlaybackState {
    context: {
      uri: string | null
      metadata: Record<string, unknown> | null
    }
    disallows: {
      pausing: boolean
      peeking_next: boolean
      peeking_prev: boolean
      resuming: boolean
      seeking: boolean
      skipping_next: boolean
      skipping_prev: boolean
    }
    duration: number
    paused: boolean
    position: number
    repeat_mode: 0 | 1 | 2
    shuffle: boolean
    timestamp: number
    track_window: {
      current_track: Track
      next_tracks: Track[]
      previous_tracks: Track[]
    }
  }

  type PlayerEventType =
    | 'player_state_changed'
    | 'ready'
    | 'not_ready'
    | 'initialization_error'
    | 'authentication_error'
    | 'account_error'
    | 'playback_error'

  interface Player {
    new (options: PlayerInit): Player
    connect(): Promise<boolean>
    disconnect(): void
    addListener(event: 'ready', cb: (instance: WebPlaybackInstance) => void): boolean
    addListener(event: 'not_ready', cb: (instance: WebPlaybackInstance) => void): boolean
    addListener(event: 'player_state_changed', cb: (state: PlaybackState | null) => void): boolean
    addListener(event: 'initialization_error', cb: (err: Error) => void): boolean
    addListener(event: 'authentication_error', cb: (err: Error) => void): boolean
    addListener(event: 'account_error', cb: (err: Error) => void): boolean
    addListener(event: 'playback_error', cb: (err: Error) => void): boolean
    removeListener(event: PlayerEventType, cb?: (...args: unknown[]) => void): boolean
    getCurrentState(): Promise<PlaybackState | null>
    setName(name: string): Promise<void>
    getVolume(): Promise<number>
    setVolume(volume: number): Promise<void>
    pause(): Promise<void>
    resume(): Promise<void>
    togglePlay(): Promise<void>
    seek(position_ms: number): Promise<void>
    previousTrack(): Promise<void>
    nextTrack(): Promise<void>
    activateElement(): Promise<void>
  }
}

interface Window {
  Spotify: {
    Player: new (options: Spotify.PlayerInit) => Spotify.Player
  }
  onSpotifyWebPlaybackSDKReady: () => void
}
