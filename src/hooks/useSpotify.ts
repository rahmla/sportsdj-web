import { useState, useEffect, useRef, useCallback } from 'react'
import {
  generateCodeVerifier,
  buildAuthURL,
  getCodeVerifier,
  clearCodeVerifier,
  exchangeCodeForToken,
} from '../utils/pkce'

const TOKEN_KEY = 'spotify_access_token'
const DEVICE_KEY = 'spotify_connect_device'
const API_BASE = 'https://api.spotify.com/v1'

export interface SpotifyUser {
  id: string
  displayName: string
}

export interface SpotifyDevice {
  id: string
  name: string
  type: string
  isActive: boolean
}

export interface SpotifyHook {
  token: string | null
  user: SpotifyUser | null
  deviceId: string | null
  isReady: boolean
  isPlaying: boolean
  position: number
  duration: number
  error: string | null
  isMobile: boolean
  devices: SpotifyDevice[]
  selectedDeviceId: string | null
  login: () => Promise<void>
  logout: () => void
  playUri: (uri: string, startOffset?: number) => Promise<void>
  pause: () => Promise<void>
  stop: () => Promise<void>
  setVolume: (vol: number) => Promise<void>
  fetchDevices: () => Promise<void>
  selectDevice: (id: string) => void
  getPosition: () => number
}

export function useSpotify(): SpotifyHook {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [sdkDeviceId, setSdkDeviceId] = useState<string | null>(null)
  const [connectDeviceId, setConnectDeviceId] = useState<string | null>(
    () => localStorage.getItem(DEVICE_KEY)
  )
  const [devices, setDevices] = useState<SpotifyDevice[]>([])
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)

  function updatePosition(ms: number) { positionRef.current = ms; setPosition(ms) }
  const [error, setError] = useState<string | null>(null)

  const playerRef = useRef<Spotify.Player | null>(null)
  const sdkLoadedRef = useRef(false)
  const isMobile = useRef(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)).current
  const connectDeviceIdRef = useRef(connectDeviceId)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const positionRef = useRef(0)

  useEffect(() => { connectDeviceIdRef.current = connectDeviceId }, [connectDeviceId])

  // isReady for mobile = token + selected device
  useEffect(() => {
    if (!isMobile) return
    setIsReady(!!token && !!connectDeviceId)
  }, [isMobile, token, connectDeviceId])

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
        const url = new URL(window.location.href)
        url.searchParams.delete('code')
        url.searchParams.delete('state')
        window.history.replaceState({}, '', url.toString())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Token exchange failed')
      }
    })()
  }, [])

  // Fetch user info when token is available
  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 401) {
          localStorage.removeItem(TOKEN_KEY)
          setToken(null)
          setIsReady(false)
          return null
        }
        return r.ok ? r.json() : null
      })
      .then(data => {
        if (data) setUser({ id: data.id, displayName: data.display_name ?? data.id })
      })
      .catch(() => {})
  }, [token])

  // Load Spotify SDK script when token becomes available (desktop only)
  useEffect(() => {
    if (!token || sdkLoadedRef.current || isMobile) return
    sdkLoadedRef.current = true

    window.onSpotifyWebPlaybackSDKReady = () => {
      initPlayer(token)
    }

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
      setSdkDeviceId(device_id)
      setIsReady(true)
      setError(null)
    })

    player.addListener('not_ready', () => {
      setIsReady(false)
      setSdkDeviceId(null)
    })

    player.addListener('player_state_changed', (state) => {
      if (state) {
        setIsPlaying(!state.paused)
        updatePosition(state.position)
        setDuration(state.duration)
      } else {
        setIsPlaying(false)
        updatePosition(0)
        setDuration(0)
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

  // Tick position on desktop using local SDK call (no network)
  useEffect(() => {
    if (isMobile || !isPlaying) return
    const tick = setInterval(async () => {
      const state = await playerRef.current?.getCurrentState()
      if (state) updatePosition(state.position)
    }, 500)
    return () => clearInterval(tick)
  }, [isMobile, isPlaying])

  // Poll playback state on mobile when playing
  useEffect(() => {
    if (!isMobile) return
    if (!isPlaying) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      return
    }
    pollRef.current = setInterval(async () => {
      const res = await apiFetch(`${API_BASE}/me/player`)
      if (res?.status === 200) {
        const data = await res.json()
        setIsPlaying(data.is_playing)
        updatePosition(data.progress_ms ?? 0)
        setDuration(data.item?.duration_ms ?? 0)
      } else if (res?.status === 204) {
        setIsPlaying(false)
        updatePosition(0)
        setDuration(0)
      }
    }, 3000)
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
  }, [isMobile, isPlaying, apiFetch])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playerRef.current?.disconnect()
      if (pollRef.current) clearInterval(pollRef.current)
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
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setSdkDeviceId(null)
    setIsReady(false)
    setIsPlaying(false)
    setError(null)
  }, [])

  const fetchDevices = useCallback(async () => {
    const res = await apiFetch(`${API_BASE}/me/player/devices`)
    if (res?.ok) {
      const data = await res.json()
      setDevices((data.devices ?? []).map((d: { id: string; name: string; type: string; is_active: boolean }) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        isActive: d.is_active,
      })))
    }
  }, [apiFetch])

  const selectDevice = useCallback((id: string) => {
    setConnectDeviceId(id)
    localStorage.setItem(DEVICE_KEY, id)
    setError(null)
  }, [])

  const pause = useCallback(async () => {
    const effectiveDeviceId = isMobile ? connectDeviceIdRef.current : sdkDeviceId
    if (!effectiveDeviceId) return
    const res = await apiFetch(`${API_BASE}/me/player/pause?device_id=${effectiveDeviceId}`, {
      method: 'PUT',
    })
    if (res && (res.ok || res.status === 204)) {
      setIsPlaying(false)
    }
  }, [isMobile, sdkDeviceId, apiFetch])

  const playUri = useCallback(
    async (uri: string, startOffset: number = 0) => {
      const effectiveDeviceId = isMobile ? connectDeviceIdRef.current : sdkDeviceId
      if (!effectiveDeviceId) {
        setError(isMobile ? 'No Spotify device selected. Tap "Select device" to choose.' : 'Player not ready. Please wait.')
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
        `${API_BASE}/me/player/play?device_id=${effectiveDeviceId}`,
        {
          method: 'PUT',
          body: JSON.stringify(body),
        }
      )

      if (res && !res.ok && res.status !== 204) {
        if (res.status === 404) {
          setError('Device not found. Open Spotify on the target device first, then try again.')
        } else if (res.status === 403) {
          setError('Playback not allowed. Make sure your Spotify Premium account is active.')
        } else {
          const text = await res.text()
          setError(`Play failed (${res.status}): ${text}`)
        }
      } else {
        setIsPlaying(true)
        setError(null)
      }
    },
    [isMobile, sdkDeviceId, apiFetch]
  )

  const setVolume = useCallback(async (vol: number) => {
    if (isMobile) {
      const devId = connectDeviceIdRef.current
      if (!devId) return
      const pct = Math.round(Math.max(0, Math.min(1, vol)) * 100)
      await apiFetch(`${API_BASE}/me/player/volume?volume_percent=${pct}&device_id=${devId}`, { method: 'PUT' })
    } else {
      await playerRef.current?.setVolume(Math.max(0, Math.min(1, vol)))
    }
  }, [isMobile, apiFetch])

  const stop = useCallback(async () => {
    if (isMobile) {
      const devId = connectDeviceIdRef.current
      if (devId) {
        for (let i = 5; i >= 0; i--) {
          const pct = Math.round((i / 5) * 80)
          await apiFetch(`${API_BASE}/me/player/volume?volume_percent=${pct}&device_id=${devId}`, { method: 'PUT' })
          await new Promise(r => setTimeout(r, 150))
        }
      }
      await pause()
      if (devId) {
        await apiFetch(`${API_BASE}/me/player/volume?volume_percent=80&device_id=${devId}`, { method: 'PUT' })
      }
      return
    }
    const player = playerRef.current
    if (!player) { await pause(); return }
    const steps = 20
    for (let i = steps; i >= 0; i--) {
      await player.setVolume(i / steps * 0.8)
      await new Promise(r => setTimeout(r, 50))
    }
    await pause()
    await player.setVolume(0.8)
  }, [isMobile, pause, apiFetch])

  return {
    token,
    user,
    deviceId: isMobile ? connectDeviceId : sdkDeviceId,
    isReady,
    isPlaying,
    position,
    duration,
    error,
    isMobile,
    devices,
    selectedDeviceId: connectDeviceId,
    login,
    logout,
    playUri,
    pause,
    stop,
    setVolume,
    fetchDevices,
    selectDevice,
    getPosition: () => positionRef.current,
  }
}
