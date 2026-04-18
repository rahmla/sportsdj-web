import { useState, useEffect, useRef } from 'react'
import type { DJEvent, AudioSource } from '../types'
import { sourceId } from '../types'
import type { SpotifyHook, SpotifyDevice } from '../hooks/useSpotify'
import { OccasionButton } from './OccasionButton'
import { SongRow } from './SongRow'
import { StopButton } from './StopButton'
import { getMp3 } from '../utils/mp3Storage'

function DevicePickerModal({
  devices,
  selectedId,
  onSelect,
  onRefresh,
  onClose,
}: {
  devices: SpotifyDevice[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRefresh: () => void
  onClose: () => void
}) {
  const deviceIcon = (type: string) => {
    if (type === 'Smartphone') return '📱'
    if (type === 'Computer') return '💻'
    if (type === 'Speaker') return '🔊'
    if (type === 'TV') return '📺'
    if (type === 'CastAudio') return '🔊'
    return '🎵'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-800 rounded-t-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-700">
          <h2 className="text-white font-bold text-lg">Select Spotify Device</h2>
          <button onClick={onRefresh} className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">Refresh</button>
        </div>
        {devices.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-gray-400 text-sm">No devices found.</p>
            <p className="text-gray-500 text-xs mt-2">Open Spotify on your phone or computer, start playing something, then refresh.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-700 max-h-64 overflow-y-auto">
            {devices.map(d => (
              <li key={d.id}>
                <button
                  onClick={() => { onSelect(d.id); onClose() }}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-700 active:bg-gray-600 transition-colors text-left"
                >
                  <span className="text-xl">{deviceIcon(d.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${d.id === selectedId ? 'text-green-400' : 'text-white'}`}>{d.name}</p>
                    <p className="text-gray-500 text-xs">{d.type}{d.isActive ? ' · Active' : ''}</p>
                  </div>
                  {d.id === selectedId && <span className="text-green-400 text-xs font-semibold">Selected</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="px-5 py-4 border-t border-gray-700">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 transition-colors">Close</button>
        </div>
      </div>
    </div>
  )
}

interface Props {
  profile: DJEvent
  spotify: SpotifyHook
  onEdit: (lastPlayedSongId?: string) => void
  onUpdate: (event: DJEvent) => void
}

const CROSSFADE_MS = 4000
const MAX_VOL = 0.8

export function PerformanceView({ profile, spotify, onEdit, onUpdate }: Props) {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [mp3Playing, setMp3Playing] = useState(false)
  const [lastPlayedSongId, setLastPlayedSongId] = useState<string | undefined>(undefined)
  const [elapsed, setElapsed] = useState(0)
  const [showDevicePicker, setShowDevicePicker] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const manualStopRef = useRef(false)
  const crossfadeStartedRef = useRef(false)
  const playingIdRef = useRef<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playStartedAtRef = useRef<number>(0)
  // Pre-loaded blob URLs keyed by fileKey — avoids async IndexedDB call during playback
  const mp3UrlsRef = useRef<Map<string, string>>(new Map())

  const isAnyPlaying = spotify.isPlaying || mp3Playing

  // Pre-load all MP3 blob URLs when profile loads
  useEffect(() => {
    const sources = profile.occasionButtons
      .map(b => b.audioSource)
      .filter((s): s is AudioSource => s?.type === 'mp3' && !!s.fileKey)

    sources.forEach(async source => {
      if (!source.fileKey || mp3UrlsRef.current.has(source.fileKey)) return
      const blob = await getMp3(source.fileKey)
      if (blob) mp3UrlsRef.current.set(source.fileKey, URL.createObjectURL(blob))
    })

    return () => {
      mp3UrlsRef.current.forEach(url => URL.revokeObjectURL(url))
      mp3UrlsRef.current.clear()
    }
  }, [profile.id])

  function startTimer(offsetSeconds = 0) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setElapsed(offsetSeconds)
    intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
  }

  function stopTimer() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    setElapsed(0)
  }

  useEffect(() => { playingIdRef.current = playingId }, [playingId])
  useEffect(() => { if (!spotify.isPlaying && !mp3Playing) stopTimer() }, [spotify.isPlaying, mp3Playing])
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        if (isAnyPlaying) handleStop()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isAnyPlaying])

  // Crossfade for Spotify
  useEffect(() => {
    if (!spotify.isPlaying || !spotify.duration) return
    const remaining = spotify.duration - spotify.position
    if (remaining > 0 && remaining <= CROSSFADE_MS && !crossfadeStartedRef.current) {
      crossfadeStartedRef.current = true
      // Fewer steps on mobile to avoid Spotify API rate limits
      const steps = spotify.isMobile ? 6 : 30
      const stepMs = remaining / steps
      let step = steps
      const fade = setInterval(async () => {
        step--
        await spotify.setVolume((step / steps) * MAX_VOL)
        if (step <= 0) clearInterval(fade)
      }, stepMs)
    }
  }, [spotify.position])

  // Auto-play next Spotify song when track ends
  useEffect(() => {
    if (spotify.isPlaying || manualStopRef.current || !playingIdRef.current) return
    // Grace period: ignore false readings shortly after starting playback (Connect buffering delay)
    if (Date.now() - playStartedAtRef.current < 8000) return
    const sorted = profile.songs.slice().sort((a, b) => a.order - b.order)
    const currentIdx = sorted.findIndex(s => s.audioSource && sourceId(s.audioSource) === playingIdRef.current)
    const next = currentIdx >= 0 ? sorted[currentIdx + 1] : null
    if (next?.audioSource && next.audioSource.type !== 'mp3') {
      handlePlayWithFadeIn(next.audioSource, next.startOffset, next.id)
    } else if (!mp3Playing) {
      setPlayingId(null)
    }
  }, [spotify.isPlaying])

  function stopMp3() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.onended = null
      audioRef.current = null
    }
    setMp3Playing(false)
  }

  function playMp3(source: AudioSource, offset: number, songId?: string) {
    if (!source.fileKey) return
    const url = mp3UrlsRef.current.get(source.fileKey)
    if (!url) {
      // Not pre-loaded yet — load now (may fail autoplay on first try in some browsers)
      getMp3(source.fileKey).then(blob => {
        if (!blob) return
        const blobUrl = URL.createObjectURL(blob)
        mp3UrlsRef.current.set(source.fileKey!, blobUrl)
        playMp3(source, offset, songId)
      })
      return
    }

    stopMp3()
    const audio = new Audio(url)
    audioRef.current = audio
    if (offset > 0) audio.currentTime = offset
    audio.onended = () => {
      setMp3Playing(false)
      setPlayingId(null)
      stopTimer()
    }
    audio.play().catch(err => console.error('[MP3] play() failed:', err))
    setMp3Playing(true)
    setPlayingId(source.fileKey)
    startTimer(offset)

    if (songId) {
      setLastPlayedSongId(songId)
      onUpdate({ ...profile, songs: profile.songs.map(s => s.id === songId ? { ...s, playCount: (s.playCount ?? 0) + 1 } : s) })
    }
  }

  async function handlePlayWithFadeIn(source: AudioSource, offset: number, songId?: string) {
    if (source.type === 'mp3') { playMp3(source, offset, songId); return }
    await spotify.setVolume(0)
    setPlayingId(source.uri)
    crossfadeStartedRef.current = false
    manualStopRef.current = false
    playStartedAtRef.current = Date.now()
    startTimer(offset)
    await spotify.playUri(source.uri, offset)
    // Fewer steps on mobile to avoid Spotify API rate limits
    const steps = spotify.isMobile ? 5 : 20
    const stepMs = 2000 / steps
    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, stepMs))
      await spotify.setVolume((i / steps) * MAX_VOL)
    }
    if (songId) {
      setLastPlayedSongId(songId)
      onUpdate({ ...profile, songs: profile.songs.map(s => s.id === songId ? { ...s, playCount: (s.playCount ?? 0) + 1 } : s) })
    }
  }

  async function handlePlay(source: AudioSource, offset: number, songId?: string) {
    if (source.type === 'mp3') { playMp3(source, offset, songId); return }
    manualStopRef.current = false
    crossfadeStartedRef.current = false
    setPlayingId(source.uri)
    playStartedAtRef.current = Date.now()
    startTimer(offset)
    await spotify.setVolume(MAX_VOL)
    await spotify.playUri(source.uri, offset)
    if (songId) {
      setLastPlayedSongId(songId)
      onUpdate({ ...profile, songs: profile.songs.map(s => s.id === songId ? { ...s, playCount: (s.playCount ?? 0) + 1 } : s) })
    }
  }

  async function handleStop() {
    manualStopRef.current = true
    crossfadeStartedRef.current = false
    setPlayingId(null)
    stopTimer()
    stopMp3()
    await spotify.stop()
    await spotify.setVolume(MAX_VOL)
  }

  const effectivelyPlayingId = isAnyPlaying ? playingId : null

  return (
    <div className="h-full flex flex-col">
      {/* Top section — always visible */}
      <div className="flex-shrink-0 flex flex-col gap-3 p-3 sm:p-5">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={['w-2.5 h-2.5 rounded-full flex-shrink-0', spotify.isReady ? 'bg-green-400' : 'bg-red-500'].join(' ')} />
            {spotify.isMobile ? (
              spotify.isReady ? (
                <button
                  onClick={() => { spotify.fetchDevices(); setShowDevicePicker(true) }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {spotify.devices.find(d => d.id === spotify.selectedDeviceId)?.name ?? 'Spotify ready'}
                  <span className="ml-1 text-xs text-gray-600">▾</span>
                </button>
              ) : (
                <button
                  onClick={() => { spotify.fetchDevices(); setShowDevicePicker(true) }}
                  className="text-sm text-green-400 hover:text-green-300 font-medium transition-colors"
                >
                  Select Spotify device
                </button>
              )
            ) : (
              <span className="text-sm text-gray-400">
                {spotify.isReady ? 'Spotify ready' : spotify.token ? 'Connecting…' : 'Not connected'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-base font-bold text-white leading-tight">{profile.name}</div>
              <div className="text-sm text-gray-400 leading-tight">{profile.sport}</div>
            </div>
            <button onClick={async () => { await handleStop(); onEdit(lastPlayedSongId) }}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white text-sm font-medium transition-colors">Edit</button>
          </div>
        </div>

        {spotify.error && (
          <div className="bg-red-900/60 border border-red-700 rounded-lg px-4 py-2 text-red-200 text-sm">{spotify.error}</div>
        )}

        {/* Occasion buttons — 4 columns on mobile, 8 on wider screens */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3" style={{ gridAutoRows: '1fr' }}>
          {profile.occasionButtons.map(btn => (
            <OccasionButton
              key={btn.id}
              button={btn}
              onPress={() => { if (btn.audioSource) handlePlay(btn.audioSource, btn.startOffset) }}
              isPlaying={effectivelyPlayingId !== null && !!btn.audioSource && effectivelyPlayingId === sourceId(btn.audioSource)}
            />
          ))}
        </div>

        <StopButton onStop={handleStop} disabled={!isAnyPlaying} elapsed={elapsed} />
      </div>

      {/* Songs — scrollable */}
      {profile.songs.length > 0 && (
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2 px-3 sm:px-5 pb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Songs</h2>
          <div className="flex flex-col gap-1.5">
            {profile.songs.slice().sort((a, b) => a.order - b.order).map(song => (
              <SongRow
                key={song.id}
                song={song}
                onPress={() => { if (song.audioSource) handlePlay(song.audioSource, song.startOffset, song.id) }}
                isPlaying={effectivelyPlayingId !== null && !!song.audioSource && effectivelyPlayingId === sourceId(song.audioSource)}
              />
            ))}
          </div>
          {profile.songs.some(s => (s.playCount ?? 0) > 0) && (
            <button onClick={() => onUpdate({ ...profile, songs: profile.songs.map(s => ({ ...s, playCount: 0 })) })}
              className="mt-1 w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs font-semibold transition-colors">
              Reset play counters
            </button>
          )}
        </div>
      )}

      {showDevicePicker && (
        <DevicePickerModal
          devices={spotify.devices}
          selectedId={spotify.selectedDeviceId}
          onSelect={spotify.selectDevice}
          onRefresh={spotify.fetchDevices}
          onClose={() => setShowDevicePicker(false)}
        />
      )}
    </div>
  )
}
