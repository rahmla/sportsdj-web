import { useState, useEffect, useRef, useCallback } from 'react'
import {
  generateCodeVerifier,
  buildAuthURL,
  getCodeVerifier,
  clearCodeVerifier,
  exchangeCodeForToken,
} from '../utils/pkce'

const TOKEN_KEY = 'spotify_access_token'
const API_BASE = 'https://api.spotify.com/v1'

export interface SpotifyHook {
  token: string | null
  deviceId: string | null
  isReady: boolean
  isPlaying: boolean
  error: string | null
  login: () => Promise<void>
  logout: () => void
  playUri: (uri: string, startOffset?: number) => Promise<void>
  pause: () => Promise<void>
  stop: () => Promise<void>
}

export function useSpotify(): SpotifyHook {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const playerRef = useRef<Spotify.Player | null>(null)
  const sdkLoadedRef = useRef(false)

  // Helper: make authenticated fetch, handle 401
  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response | null> => {
      if (!token) return null
      const res = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(options.headers ?? {}),
        },
      })
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setIsReady(false)
        setError('Session expired. Please log in again.')
        return null
      }
      return res
    },
    [token]
  )

  // Handle OAuth callback: exchange code for token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) return

    const verifier = getCodeVerifier()
    if (!verifier) {
      setError('OAuth error: missing code verifier')
      return
    }

    ;(async () => {
      try {
        const accessToken = await exchangeCodeForToken(code, verifier)
        clearCodeVerifier()
        localStorage.setItem(TOKEN_KEY, accessToken)
        setToken(accessToken)
        // Clean up URL
        const url = new URL(window.location.href)
        url.searchParams.delete('code')
        url.searchParams.delete('state')
        window.history.replaceState({}, '', url.toString())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Token exchange failed')
      }
    })()
  }, [])

  // Load Spotify SDK script when token becomes available
  useEffect(() => {
    if (!token || sdkLoadedRef.current) return
    sdkLoadedRef.current = true

    window.onSpotifyWebPlaybackSDKReady = () => {
      initPlayer(token)
    }

    // If SDK already loaded (e.g. hot reload)
    if (window.Spotify) {
      initPlayer(token)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    document.body.appendChild(script)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  function initPlayer(accessToken: string) {
    if (playerRef.current) {
      playerRef.current.disconnect()
      playerRef.current = null
    }

    const player = new window.Spotify.Player({
      name: 'SportsDJ',
      getOAuthToken: (cb) => cb(accessToken),
      volume: 0.8,
    })

    player.addListener('ready', ({ device_id }) => {
      setDeviceId(device_id)
      setIsReady(true)
      setError(null)
    })

    player.addListener('not_ready', () => {
      setIsReady(false)
      setDeviceId(null)
    })

    player.addListener('player_state_changed', (state) => {
      if (state) {
        setIsPlaying(!state.paused)
      } else {
        setIsPlaying(false)
      }
    })

    player.addListener('initialization_error', ({ message }) => {
      setError(`Initialization error: ${message}`)
    })

    player.addListener('authentication_error', ({ message }) => {
      setError(`Auth error: ${message}`)
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      setIsReady(false)
    })

    player.addListener('account_error', ({ message }) => {
      setError(`Account error: ${message}. Spotify Premium required.`)
    })

    player.addListener('playback_error', ({ message }) => {
      setError(`Playback error: ${message}`)
    })

    player.connect()
    playerRef.current = player
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playerRef.current?.disconnect()
    }
  }, [])

  const login = useCallback(async () => {
    const verifier = await generateCodeVerifier()
    const url = await buildAuthURL(verifier)
    window.location.href = url
  }, [])

  const logout = useCallback(() => {
    playerRef.current?.disconnect()
    playerRef.current = null
    sdkLoadedRef.current = false
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setDeviceId(null)
    setIsReady(false)
    setIsPlaying(false)
    setError(null)
  }, [])

  const playUri = useCallback(
    async (uri: string, startOffset: number = 0) => {
      if (!deviceId) {
        setError('Player not ready. Please wait.')
        return
      }

      const isPlaylist = uri.startsWith('spotify:playlist:') || uri.startsWith('spotify:album:')
      const body: Record<string, unknown> = isPlaylist
        ? { context_uri: uri }
        : { uris: [uri] }

      if (startOffset > 0) {
        body.position_ms = startOffset * 1000
      }

      const res = await apiFetch(
        `${API_BASE}/me/player/play?device_id=${deviceId}`,
        {
          method: 'PUT',
          body: JSON.stringify(body),
        }
      )

      if (res && !res.ok && res.status !== 204) {
        const text = await res.text()
        setError(`Play failed: ${text}`)
      } else {
        setIsPlaying(true)
        setError(null)
      }
    },
    [deviceId, apiFetch]
  )

  const pause = useCallback(async () => {
    if (!deviceId) return
    const res = await apiFetch(`${API_BASE}/me/player/pause?device_id=${deviceId}`, {
      method: 'PUT',
    })
    if (res && (res.ok || res.status === 204)) {
      setIsPlaying(false)
    }
  }, [deviceId, apiFetch])

  const stop = useCallback(async () => {
    await pause()
  }, [pause])

  return {
    token,
    deviceId,
    isReady,
    isPlaying,
    error,
    login,
    logout,
    playUri,
    pause,
    stop,
  }
}
