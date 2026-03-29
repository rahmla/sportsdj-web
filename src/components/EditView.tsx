import { useState, useRef } from 'react'
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
        name: eb.label,
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
        name: es.title,
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

function parseCsvRow(row: string): string[] {
  const fields: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < row.length; i++) {
    const ch = row[i]
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  fields.push(cur)
  return fields
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
  const [importError, setImportError] = useState<string | null>(null)
  const csvFileRef = useRef<HTMLInputElement>(null)

  function importFromCsv(file: File) {
    setImportError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split(/\r?\n/).filter(l => l.trim())
        if (lines.length < 2) throw new Error('CSV file is empty')

        const headers = parseCsvRow(lines[0]).map(h => h.trim().toLowerCase())
        const trackNameIdx = headers.findIndex(h => h === 'track name')
        const artistIdx = headers.findIndex(h => h.includes('artist name'))
        const uriIdx = headers.findIndex(h => h.includes('uri'))

        if (uriIdx === -1) throw new Error('No URI column found. Make sure this is an Exportify CSV.')

        const newSongs: EditingSong[] = []
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCsvRow(lines[i])
          const uri = cols[uriIdx]?.trim()
          if (!uri?.startsWith('spotify:track:')) continue
          const trackName = trackNameIdx !== -1 ? cols[trackNameIdx]?.trim() ?? '' : ''
          const artist = (artistIdx !== -1 ? cols[artistIdx]?.trim() ?? '' : '').replace(/;/g, ', ')
          const title = trackName && artist ? `${trackName} – ${artist}` : trackName || uri
          newSongs.push({
            id: uuidv4(),
            title,
            uriInput: uri,
            uriName: trackName,
            uriType: 'spotifyTrack',
            startOffset: '0',
            order: songs.length + newSongs.length,
          })
        }

        if (newSongs.length === 0) throw new Error('No tracks found in CSV')
        setSongs(prev => [...prev, ...newSongs])
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'CSV import failed')
      }
    }
    reader.onerror = () => setImportError('Could not read file')
    reader.readAsText(file)
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
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Occasion Buttons
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{buttons.length / 4} / 5 rows</span>
            {buttons.length > 4 && (
              <button
                onClick={() => {
                  setButtons(prev => prev.slice(0, -4))
                  setExpandedButtonId(null)
                }}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white font-semibold transition-colors touch-manipulation"
              >
                − Row
              </button>
            )}
            {buttons.length < 20 && (
              <button
                onClick={() => setButtons(prev => [...prev, ...Array.from({ length: 4 }, () => ({
                  id: uuidv4(),
                  label: 'NON',
                  colorHex: '#666666',
                  uriInput: '',
                  uriName: '',
                  uriType: 'spotifyTrack' as const,
                  startOffset: '0',
                }))])}
                className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm text-white font-semibold transition-colors touch-manipulation"
              >
                + Row
              </button>
            )}
          </div>
        </div>
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
                {/* Label */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Label</label>
                  <input
                    type="text"
                    value={btn.label}
                    onChange={(e) => updateButton(btn.id, { label: e.target.value })}
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={8}
                  />
                </div>

                {/* Color */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-400">Color</label>
                  <div className="grid grid-cols-8 gap-1.5">
                    {[
                      '#CC0000','#FF4500','#FF8C00','#FFD700',
                      '#228B22','#007A7A','#0044CC','#7700BB',
                      '#C71585','#FF69B4','#FFFFFF','#AAAAAA',
                      '#666666','#333333','#1a1a2e','#8B4513',
                    ].map(color => (
                      <button
                        key={color}
                        onClick={() => updateButton(btn.id, { colorHex: color })}
                        className="w-full aspect-square rounded-md border-2 transition-transform active:scale-90 touch-manipulation"
                        style={{
                          backgroundColor: color,
                          borderColor: btn.colorHex === color ? '#ffffff' : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Custom:</label>
                    <input
                      type="color"
                      value={btn.colorHex}
                      onChange={(e) => updateButton(btn.id, { colorHex: e.target.value })}
                      className="w-10 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-xs text-gray-500 font-mono">{btn.colorHex}</span>
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
              onClick={() => csvFileRef.current?.click()}
              className="px-3 py-1 bg-green-800 hover:bg-green-700 rounded-lg text-sm text-white font-semibold transition-colors touch-manipulation"
            >
              + CSV
            </button>
            <input
              ref={csvFileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) importFromCsv(f); e.target.value = '' }}
            />
            <button
              onClick={addSong}
              className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm text-white font-semibold transition-colors touch-manipulation"
            >
              + Add
            </button>
          </div>
        </div>

        {importError && <p className="text-red-400 text-xs px-1">{importError}</p>}
        {songs.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No songs yet. Tap + CSV to import from Exportify, or + Add to add manually.</p>
        )}

        {songs.map((song) => (
          <div key={song.id} className="rounded-lg overflow-hidden">
            {/* Song row */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-700">
              <button
                onClick={() =>
                  setExpandedSongId(expandedSongId === song.id ? null : song.id)
                }
                className="flex-1 min-w-0 flex items-center gap-2 text-left touch-manipulation hover:opacity-80 active:opacity-60 transition-opacity"
              >
                <span className="flex-1 min-w-0 text-white text-sm truncate">{song.title}</span>
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

    </div>
  )
}
