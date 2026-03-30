import { useState, useEffect, useRef } from 'react'
import type { DJEvent, AudioSource } from '../types'
import type { SpotifyHook } from '../hooks/useSpotify'
import { OccasionButton } from './OccasionButton'
import { SongRow } from './SongRow'
import { StopButton } from './StopButton'

interface Props {
  profile: DJEvent
  spotify: SpotifyHook
  onEdit: (lastPlayedSongId?: string) => void
  onUpdate: (event: DJEvent) => void
}

export function PerformanceView({ profile, spotify, onEdit, onUpdate }: Props) {
  const [playingSourceUri, setPlayingSourceUri] = useState<string | null>(null)
  const [lastPlayedSongId, setLastPlayedSongId] = useState<string | undefined>(undefined)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startTimer(offsetSeconds = 0) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setElapsed(offsetSeconds)
    intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
  }

  function stopTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setElapsed(0)
  }

  useEffect(() => {
    if (!spotify.isPlaying) stopTimer()
  }, [spotify.isPlaying])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        if (spotify.isPlaying) handleStop()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [spotify.isPlaying])

  async function handlePlay(source: AudioSource, offset: number, songId?: string) {
    if (!source) return
    setPlayingSourceUri(source.uri)
    startTimer(offset)
    await spotify.playUri(source.uri, offset)
    if (songId) {
      setLastPlayedSongId(songId)
      onUpdate({
        ...profile,
        songs: profile.songs.map(s =>
          s.id === songId ? { ...s, playCount: (s.playCount ?? 0) + 1 } : s
        ),
      })
    }
  }

  async function handleStop() {
    setPlayingSourceUri(null)
    stopTimer()
    await spotify.stop()
  }

  // Sync playing state: if spotify stopped externally, clear highlight
  const effectivelyPlaying = spotify.isPlaying ? playingSourceUri : null

  return (
    <div className="flex flex-col gap-3 p-3 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        {/* Spotify status */}
        <div className="flex items-center gap-2">
          <div
            className={[
              'w-2.5 h-2.5 rounded-full flex-shrink-0',
              spotify.isReady ? 'bg-green-400' : 'bg-red-500',
            ].join(' ')}
          />
          <span className="text-xs text-gray-400">
            {spotify.isReady ? 'Spotify ready' : spotify.token ? 'Connecting…' : 'Not connected'}
          </span>
        </div>

        {/* Profile name + Edit */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm font-semibold text-white leading-tight">{profile.name}</div>
            <div className="text-xs text-gray-400 leading-tight">{profile.sport}</div>
          </div>
          <button
            onClick={async () => { await handleStop(); onEdit(lastPlayedSongId) }}
            className="ml-1 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white text-sm font-medium transition-colors touch-manipulation"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Error banner */}
      {spotify.error && (
        <div className="bg-red-900/60 border border-red-700 rounded-lg px-3 py-2 text-red-200 text-xs">
          {spotify.error}
        </div>
      )}

      {/* Occasion Buttons Grid: 4 columns, 2 rows */}
      <div className="grid grid-cols-4 gap-2" style={{ gridAutoRows: '1fr' }}>
        {profile.occasionButtons.map((btn) => (
          <OccasionButton
            key={btn.id}
            button={btn}
            onPress={() => {
              if (btn.audioSource) {
                handlePlay(btn.audioSource, btn.startOffset)
              }
            }}
            isPlaying={
              effectivelyPlaying !== null &&
              !!btn.audioSource &&
              effectivelyPlaying === btn.audioSource.uri
            }
          />
        ))}
      </div>

      {/* Stop Button */}
      <StopButton onStop={handleStop} disabled={!spotify.isPlaying} elapsed={elapsed} />

      {/* Songs Section */}
      {profile.songs.length > 0 && (
        <div className="flex flex-col min-h-0">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Songs
          </h2>
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[50vh] pr-0.5">
            {profile.songs
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((song) => (
                <SongRow
                  key={song.id}
                  song={song}
                  onPress={() => {
                    if (song.audioSource) {
                      handlePlay(song.audioSource, song.startOffset, song.id)
                    }
                  }}
                  isPlaying={
                    effectivelyPlaying !== null &&
                    !!song.audioSource &&
                    effectivelyPlaying === song.audioSource.uri
                  }
                />
              ))}
          </div>
          {profile.songs.some(s => (s.playCount ?? 0) > 0) && (
            <button
              onClick={() => onUpdate({
                ...profile,
                songs: profile.songs.map(s => ({ ...s, playCount: 0 })),
              })}
              className="mt-2 w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs font-semibold transition-colors touch-manipulation"
            >
              Reset play counters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
