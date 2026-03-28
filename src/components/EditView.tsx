import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { DJEvent, OccasionButton, SongItem, AudioSource } from '../types'
import type { SpotifyHook } from '../hooks/useSpotify'

interface Props {
  profile: DJEvent
  spotify: SpotifyHook
  onUpdate: (event: DJEvent) => void
  onDone: () => void
}

interface EditingButton {
  id: string
  label: string
  colorHex: string
  uriInput: string
  uriName: string
  uriType: 'spotifyTrack' | 'spotifyPlaylist'
  startOffset: string
}

interface EditingSong {
  id: string
  title: string
  uriInput: string
  uriName: string
  uriType: 'spotifyTrack' | 'spotifyPlaylist'
  startOffset: string
  order: number
}

function toEditingButton(btn: OccasionButton): EditingButton {
  return {
    id: btn.id,
    label: btn.label,
    colorHex: btn.colorHex,
    uriInput: btn.audioSource?.uri ?? '',
    uriName: btn.audioSource?.name ?? '',
    uriType: btn.audioSource?.type ?? 'spotifyTrack',
    startOffset: String(btn.startOffset ?? 0),
  }
}

function toEditingSong(song: SongItem): EditingSong {
  return {
    id: song.id,
    title: song.title,
    uriInput: song.audioSource?.uri ?? '',
    uriName: song.audioSource?.name ?? '',
    uriType: song.audioSource?.type ?? 'spotifyTrack',
    startOffset: String(song.startOffset ?? 0),
    order: song.order,
  }
}

function fromEditingButton(eb: EditingButton): OccasionButton {
  const hasUri = eb.uriInput.trim().length > 0
  const isPlaylist =
    eb.uriInput.includes('spotify:playlist:') || eb.uriInput.includes('spotify:album:')
  const audioSource: AudioSource | undefined = hasUri
    ? {
        type: isPlaylist ? 'spotifyPlaylist' : 'spotifyTrack',
        uri: eb.uriInput.trim(),
        name: eb.uriName.trim() || eb.label,
      }
    : undefined
  return {
    id: eb.id,
    label: eb.label,
    colorHex: eb.colorHex,
    audioSource,
    startOffset: parseFloat(eb.startOffset) || 0,
  }
}

function fromEditingSong(es: EditingSong): SongItem {
  const hasUri = es.uriInput.trim().length > 0
  const isPlaylist =
    es.uriInput.includes('spotify:playlist:') || es.uriInput.includes('spotify:album:')
  const audioSource: AudioSource | undefined = hasUri
    ? {
        type: isPlaylist ? 'spotifyPlaylist' : 'spotifyTrack',
        uri: es.uriInput.trim(),
        name: es.uriName.trim() || es.title,
      }
    : undefined
  return {
    id: es.id,
    title: es.title,
    audioSource,
    startOffset: parseFloat(es.startOffset) || 0,
    order: es.order,
  }
}

function extractPlaylistId(input: string): string | null {
  const uriMatch = input.match(/spotify:playlist:([A-Za-z0-9]+)/)
  if (uriMatch) return uriMatch[1]
  const urlMatch = input.match(/open\.spotify\.com\/playlist\/([A-Za-z0-9]+)/)
  if (urlMatch) return urlMatch[1]
  return null
}

export function EditView({ profile, spotify, onUpdate, onDone }: Props) {
  const [name, setName] = useState(profile.name)
  const [sport, setSport] = useState(profile.sport)
  const [buttons, setButtons] = useState<EditingButton[]>(
    profile.occasionButtons.map(toEditingButton)
  )
  const [songs, setSongs] = useState<EditingSong[]>(profile.songs.map(toEditingSong))
  const [expandedButtonId, setExpandedButtonId] = useState<string | null>(null)
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null)
  const [showPlaylistImport, setShowPlaylistImport] = useState(false)
  const [playlistInput, setPlaylistInput] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  async function importFromPlaylist() {
    const playlistId = extractPlaylistId(playlistInput.trim())
    if (!playlistId) { setImportError('Invalid playlist URL or URI'); return }
    if (!spotify.token) { setImportError('Not logged in to Spotify'); return }

    setImportLoading(true)
    setImportError(null)

    try {
      const newSongs: EditingSong[] = []
      let url: string | null =
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=next,items(track(uri,name,artists))`

      while (url) {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${spotify.token}` } })
        if (!res.ok) throw new Error(`Spotify error ${res.status}`)
        const data = await res.json()

        for (const item of data.items ?? []) {
          const track = item?.track
          if (!track?.uri || track.uri.startsWith('spotify:local:')) continue
          const artists = (track.artists ?? []).map((a: { name: string }) => a.name).join(', ')
          const title = artists ? `${track.name} – ${artists}` : track.name
          newSongs.push({
            id: uuidv4(),
            title,
            uriInput: track.uri,
            uriName: track.name,
            uriType: 'spotifyTrack',
            startOffset: '0',
            order: songs.length + newSongs.length,
          })
        }
        url = data.next ?? null
      }

      setSongs(prev => [...prev, ...newSongs])
      setShowPlaylistImport(false)
      setPlaylistInput('')
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImportLoading(false)
    }
  }

  function saveAll() {
    const updated: DJEvent = {
      ...profile,
      name,
      sport,
      occasionButtons: buttons.map(fromEditingButton),
      songs: songs.map(fromEditingSong),
    }
    onUpdate(updated)
    onDone()
  }

  function updateButton(id: string, patch: Partial<EditingButton>) {
    setButtons((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }

  function updateSong(id: string, patch: Partial<EditingSong>) {
    setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function addSong() {
    const newSong: EditingSong = {
      id: uuidv4(),
      title: 'New Song',
      uriInput: '',
      uriName: '',
      uriType: 'spotifyTrack',
      startOffset: '0',
      order: songs.length,
    }
    setSongs((prev) => [...prev, newSong])
    setExpandedSongId(newSong.id)
  }

  function deleteSong(id: string) {
    setSongs((prev) => prev.filter((s) => s.id !== id))
    if (expandedSongId === id) setExpandedSongId(null)
  }

  return (
    <div className="flex flex-col gap-4 p-3 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Edit Event</h1>
        <button
          onClick={saveAll}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 active:bg-green-700 rounded-lg text-white font-semibold transition-colors touch-manipulation"
        >
          Done
        </button>
      </div>

      {/* Profile Section */}
      <section className="bg-gray-800 rounded-xl p-4 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Event</h2>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Event name"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400">Sport</label>
          <input
            type="text"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Sport"
          />
        </div>
      </section>

      {/* Spotify Section */}
      <section className="bg-gray-800 rounded-xl p-4 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Spotify</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={[
                'w-2.5 h-2.5 rounded-full',
                spotify.isReady ? 'bg-green-400' : 'bg-red-500',
              ].join(' ')}
            />
            <span className="text-sm text-gray-300">
              {spotify.isReady
                ? 'Connected'
                : spotify.token
                ? 'Connecting…'
                : 'Not connected'}
            </span>
          </div>
          {spotify.token ? (
            <button
              onClick={spotify.logout}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors touch-manipulation"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={spotify.login}
              className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded-lg text-sm text-white font-semibold transition-colors touch-manipulation"
            >
              Login with Spotify
            </button>
          )}
        </div>
        {spotify.error && (
          <p className="text-xs text-red-400">{spotify.error}</p>
        )}
        {spotify.token && !spotify.isReady && (
          <p className="text-xs text-gray-500">Waiting for player… (Spotify Premium required)</p>
        )}
      </section>

      {/* Occasion Buttons Section */}
      <section className="bg-gray-800 rounded-xl p-4 flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-1">
          Occasion Buttons
        </h2>
        {buttons.map((btn) => (
          <div key={btn.id} className="rounded-lg overflow-hidden">
            {/* Button row */}
            <button
              onClick={() =>
                setExpandedButtonId(expandedButtonId === btn.id ? null : btn.id)
              }
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 transition-colors text-left touch-manipulation"
            >
              <div
                className="w-7 h-7 rounded-md flex-shrink-0"
                style={{ backgroundColor: btn.colorHex }}
              />
              <span className="flex-1 text-white font-semibold text-sm">{btn.label}</span>
              {btn.uriInput && (
                <span className="text-green-400 text-xs">●</span>
              )}
              <span className="text-gray-400 text-xs">
                {expandedButtonId === btn.id ? '▲' : '▼'}
              </span>
            </button>

            {/* Expanded edit panel */}
            {expandedButtonId === btn.id && (
              <div className="bg-gray-750 border-t border-gray-600 px-3 py-3 flex flex-col gap-3 bg-gray-900/50">
                {/* Label + Color row */}
                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Label</label>
                    <input
                      type="text"
                      value={btn.label}
                      onChange={(e) => updateButton(btn.id, { label: e.target.value })}
                      className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={8}
                    />
                  </div>
                  <div className="flex flex-col gap-1 items-center">
                    <label className="text-xs text-gray-400">Color</label>
                    <input
                      type="color"
                      value={btn.colorHex}
                      onChange={(e) => updateButton(btn.id, { colorHex: e.target.value })}
                      className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                  </div>
                </div>

                {/* Spotify URI */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">
                    Spotify URI{' '}
                    <span className="text-gray-500">(spotify:track:… or spotify:playlist:…)</span>
                  </label>
                  <input
                    type="text"
                    value={btn.uriInput}
                    onChange={(e) => updateButton(btn.id, { uriInput: e.target.value })}
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="spotify:track:0abc…"
                  />
                </div>

                {/* Display Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Display Name (optional)</label>
                  <input
                    type="text"
                    value={btn.uriName}
                    onChange={(e) => updateButton(btn.id, { uriName: e.target.value })}
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Song name"
                  />
                </div>

                {/* Start Offset */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Start Offset (seconds)</label>
                  <input
                    type="number"
                    value={btn.startOffset}
                    onChange={(e) => updateButton(btn.id, { startOffset: e.target.value })}
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1"
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Songs Section */}
      <section className="bg-gray-800 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Songs</h2>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowPlaylistImport(true); setImportError(null) }}
              className="px-3 py-1 bg-green-800 hover:bg-green-700 rounded-lg text-sm text-white font-semibold transition-colors touch-manipulation"
            >
              + Playlist
            </button>
            <button
              onClick={addSong}
              className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm text-white font-semibold transition-colors touch-manipulation"
            >
              + Add
            </button>
          </div>
        </div>

        {songs.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No songs yet. Tap + Add or import a playlist.</p>
        )}

        {songs.map((song) => (
          <div key={song.id} className="rounded-lg overflow-hidden">
            {/* Song row */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-700">
              <button
                onClick={() =>
                  setExpandedSongId(expandedSongId === song.id ? null : song.id)
                }
                className="flex-1 flex items-center gap-2 text-left touch-manipulation hover:opacity-80 active:opacity-60 transition-opacity"
              >
                <span className="flex-1 text-white text-sm truncate">{song.title}</span>
                {song.uriInput && <span className="text-green-400 text-xs">●</span>}
                <span className="text-gray-400 text-xs">
                  {expandedSongId === song.id ? '▲' : '▼'}
                </span>
              </button>
              <button
                onClick={() => deleteSong(song.id)}
                className="ml-1 w-7 h-7 flex items-center justify-center rounded-md bg-red-800/60 hover:bg-red-700 text-red-300 text-sm transition-colors touch-manipulation flex-shrink-0"
                aria-label={`Delete ${song.title}`}
              >
                ✕
              </button>
            </div>

            {/* Expanded edit panel */}
            {expandedSongId === song.id && (
              <div className="border-t border-gray-600 px-3 py-3 flex flex-col gap-3 bg-gray-900/50">
                {/* Title */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Title</label>
                  <input
                    type="text"
                    value={song.title}
                    onChange={(e) => updateSong(song.id, { title: e.target.value })}
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Song title"
                  />
                </div>

                {/* Spotify URI */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">
                    Spotify URI{' '}
                    <span className="text-gray-500">(spotify:track:… or spotify:playlist:…)</span>
                  </label>
                  <input
                    type="text"
                    value={song.uriInput}
                    onChange={(e) => updateSong(song.id, { uriInput: e.target.value })}
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="spotify:track:0abc…"
                  />
                </div>

                {/* Display Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Display Name (optional)</label>
                  <input
                    type="text"
                    value={song.uriName}
                    onChange={(e) => updateSong(song.id, { uriName: e.target.value })}
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Song name"
                  />
                </div>

                {/* Start Offset */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Start Offset (seconds)</label>
                  <input
                    type="number"
                    value={song.startOffset}
                    onChange={(e) => updateSong(song.id, { startOffset: e.target.value })}
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1"
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Bottom Done button */}
      <button
        onClick={saveAll}
        className="w-full py-4 bg-green-600 hover:bg-green-500 active:bg-green-700 rounded-xl text-white font-bold text-lg transition-colors touch-manipulation"
      >
        Done
      </button>

      {/* Import Playlist Modal */}
      {showPlaylistImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !importLoading && setShowPlaylistImport(false)}
        >
          <div
            className="bg-gray-800 rounded-2xl p-6 mx-4 w-full max-w-xs shadow-2xl flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg">Import Spotify Playlist</h3>
            <p className="text-gray-400 text-xs">
              Paste a Spotify playlist URL or URI. All tracks will be added to the songs list.
            </p>
            <input
              type="text"
              placeholder="https://open.spotify.com/playlist/…"
              value={playlistInput}
              onChange={e => setPlaylistInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !importLoading && importFromPlaylist()}
              className="bg-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
              autoFocus
              disabled={importLoading}
            />
            {importError && <p className="text-red-400 text-xs">{importError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPlaylistImport(false)}
                disabled={importLoading}
                className="flex-1 py-2.5 rounded-xl bg-gray-700 text-white font-medium text-sm hover:bg-gray-600 transition-colors touch-manipulation disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={importFromPlaylist}
                disabled={importLoading || !playlistInput.trim()}
                className="flex-1 py-2.5 rounded-xl bg-green-600 disabled:opacity-40 text-white font-semibold text-sm hover:bg-green-500 transition-colors touch-manipulation flex items-center justify-center gap-2"
              >
                {importLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    Importing…
                  </>
                ) : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
