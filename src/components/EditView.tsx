import { useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { DJEvent, OccasionButton, SongItem, AudioSource } from '../types'
import { saveMp3, deleteMp3 } from '../utils/mp3Storage'

interface SpotifyPreview {
  isReady: boolean
  isPlaying: boolean
  getPosition: () => number
  playUri: (uri: string, offset?: number) => Promise<void>
  stop: () => Promise<void>
}

interface Props {
  profile: DJEvent
  onUpdate: (event: DJEvent) => void
  onDone: () => void
  initialExpandedSongId?: string
  spotifyToken?: string | null
  spotify?: SpotifyPreview
}

interface EditingButton {
  id: string
  label: string
  colorHex: string
  uriInput: string
  uriName: string
  uriType: 'spotifyTrack' | 'spotifyPlaylist'
  sourceType: 'spotify' | 'mp3'
  fileKey?: string
  fileName?: string
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
  playCount: number
}

function toEditingButton(btn: OccasionButton): EditingButton {
  const isMp3 = btn.audioSource?.type === 'mp3'
  return {
    id: btn.id,
    label: btn.label,
    colorHex: btn.colorHex,
    uriInput: (!isMp3 && btn.audioSource?.uri) ? btn.audioSource.uri : '',
    uriName: (!isMp3 && btn.audioSource?.name) ? btn.audioSource.name : '',
    uriType: (!isMp3 && btn.audioSource?.type === 'spotifyPlaylist') ? 'spotifyPlaylist' : 'spotifyTrack',
    sourceType: isMp3 ? 'mp3' : 'spotify',
    fileKey: isMp3 ? btn.audioSource?.fileKey : undefined,
    fileName: isMp3 ? btn.audioSource?.fileName : undefined,
    startOffset: String(btn.startOffset ?? 0),
  }
}

function toEditingSong(song: SongItem): EditingSong {
  return {
    id: song.id,
    title: song.title,
    uriInput: song.audioSource?.uri ?? '',
    uriName: song.audioSource?.name ?? '',
    uriType: song.audioSource?.type === 'spotifyPlaylist' ? 'spotifyPlaylist' : 'spotifyTrack',
    startOffset: String(song.startOffset ?? 0),
    order: song.order,
    playCount: song.playCount ?? 0,
  }
}

function normalizeSpotifyUri(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('spotify:')) return trimmed
  const match = trimmed.match(/open\.spotify\.com\/(track|playlist|album)\/([A-Za-z0-9]+)/)
  if (match) return `spotify:${match[1]}:${match[2]}`
  return trimmed
}

function fromEditingButton(eb: EditingButton): OccasionButton {
  let audioSource: AudioSource | undefined
  if (eb.sourceType === 'mp3' && eb.fileKey) {
    audioSource = { type: 'mp3', uri: '', name: eb.fileName ?? eb.label, fileKey: eb.fileKey, fileName: eb.fileName }
  } else if (eb.uriInput.trim()) {
    const uri = normalizeSpotifyUri(eb.uriInput)
    const isPlaylist = uri.includes('spotify:playlist:') || uri.includes('spotify:album:')
    audioSource = { type: isPlaylist ? 'spotifyPlaylist' : 'spotifyTrack', uri, name: eb.label }
  }
  return { id: eb.id, label: eb.label, colorHex: eb.colorHex, audioSource, startOffset: parseFloat(eb.startOffset) || 0 }
}

function fromEditingSong(es: EditingSong): SongItem {
  const uri = normalizeSpotifyUri(es.uriInput)
  const isPlaylist = uri.includes('spotify:playlist:') || uri.includes('spotify:album:')
  const audioSource: AudioSource | undefined = uri
    ? { type: isPlaylist ? 'spotifyPlaylist' : 'spotifyTrack', uri, name: es.title }
    : undefined
  return { id: es.id, title: es.title, audioSource, startOffset: parseFloat(es.startOffset) || 0, order: es.order, playCount: es.playCount }
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

export function EditView({ profile, onUpdate, onDone, initialExpandedSongId, spotifyToken, spotify }: Props) {
  const [name, setName] = useState(profile.name)
  const [sport, setSport] = useState(profile.sport)
  const [buttons, setButtons] = useState<EditingButton[]>(profile.occasionButtons.map(toEditingButton))
  const [songs, setSongs] = useState<EditingSong[]>(profile.songs.map(toEditingSong))
  const [expandedButtonId, setExpandedButtonId] = useState<string | null>(null)
  const [expandedSongId, setExpandedSongId] = useState<string | null>(initialExpandedSongId ?? null)
  const [importError, setImportError] = useState<string | null>(null)
  const [fetchingTitleId, setFetchingTitleId] = useState<string | null>(null)
  const [playingSongId, setPlayingSongId] = useState<string | null>(null)
  const csvFileRef = useRef<HTMLInputElement>(null)
  const mp3FileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  async function handleMp3Pick(btnId: string, file: File) {
    const key = uuidv4()
    const existing = buttons.find(b => b.id === btnId)
    if (existing?.fileKey) await deleteMp3(existing.fileKey).catch(() => {})
    await saveMp3(key, file)
    updateButton(btnId, { fileKey: key, fileName: file.name, sourceType: 'mp3', uriInput: '' })
  }

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
          newSongs.push({ id: uuidv4(), title, uriInput: uri, uriName: trackName, uriType: 'spotifyTrack', startOffset: '0', order: newSongs.length, playCount: 0 })
        }
        if (newSongs.length === 0) throw new Error('No tracks found in CSV')
        setSongs(prev => [...prev, ...newSongs.map((s, i) => ({ ...s, order: prev.length + i }))])
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'CSV import failed')
      }
    }
    reader.onerror = () => setImportError('Could not read file')
    reader.readAsText(file)
  }

  function saveAll() {
    onUpdate({ ...profile, name, sport, occasionButtons: buttons.map(fromEditingButton), songs: songs.map(fromEditingSong) })
    onDone()
  }

  function updateButton(id: string, patch: Partial<EditingButton>) {
    setButtons(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
  }

  function updateSong(id: string, patch: Partial<EditingSong>) {
    setSongs(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  async function handlePreview(song: EditingSong) {
    if (!spotify) return
    if (playingSongId === song.id && spotify.isPlaying) {
      await spotify.stop()
      setPlayingSongId(null)
      return
    }
    const uri = normalizeSpotifyUri(song.uriInput)
    if (!uri.startsWith('spotify:track:')) return
    setPlayingSongId(song.id)
    await spotify.playUri(uri, parseFloat(song.startOffset) || 0)
  }

  async function fetchTrackTitle(songId: string, rawUri: string) {
    if (!spotifyToken) return
    const uri = normalizeSpotifyUri(rawUri)
    const trackId = uri.match(/^spotify:track:([A-Za-z0-9]+)$/)?.[1]
    if (!trackId) return
    setFetchingTitleId(songId)
    try {
      const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        const artist = data.artists?.[0]?.name ?? ''
        const title = artist ? `${data.name} – ${artist}` : data.name
        setSongs(prev => prev.map(s => s.id === songId ? { ...s, title, uriInput: uri } : s))
      }
    } finally {
      setFetchingTitleId(null)
    }
  }

  function addSong() {
    const newSong: EditingSong = { id: uuidv4(), title: 'New Song', uriInput: '', uriName: '', uriType: 'spotifyTrack', startOffset: '0', order: songs.length, playCount: 0 }
    setSongs(prev => [...prev, newSong])
    setExpandedSongId(newSong.id)
  }

  function deleteSong(id: string) {
    setSongs(prev => prev.filter(s => s.id !== id))
    if (expandedSongId === id) setExpandedSongId(null)
  }

  return (
    <div className="flex flex-col gap-4 p-3 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" placeholder="Event name" />
          <input type="text" value={sport} onChange={e => setSport(e.target.value)}
            className="bg-gray-700 text-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" placeholder="Sport" />
        </div>
        <button onClick={saveAll} className="flex-shrink-0 px-4 py-2 bg-green-600 hover:bg-green-500 active:bg-green-700 rounded-lg text-white font-semibold transition-colors touch-manipulation">Done</button>
      </div>

      {/* Occasion Buttons */}
      <section className="bg-gray-800 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Occasion Buttons</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{buttons.length / 8} / 5 rows</span>
            {buttons.length > 8 && (
              <button onClick={() => { setButtons(prev => prev.slice(0, -8)); setExpandedButtonId(null) }}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white font-semibold transition-colors touch-manipulation">− Row</button>
            )}
            {buttons.length < 40 && (
              <button onClick={() => setButtons(prev => [...prev, ...Array.from({ length: 8 }, () => ({
                id: uuidv4(), label: 'NON', colorHex: '#666666', uriInput: '', uriName: '',
                uriType: 'spotifyTrack' as const, sourceType: 'spotify' as const, startOffset: '0',
              }))])} className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm text-white font-semibold transition-colors touch-manipulation">+ Row</button>
            )}
          </div>
        </div>

        {buttons.map(btn => (
          <div key={btn.id} className="rounded-lg overflow-hidden">
            <button onClick={() => setExpandedButtonId(expandedButtonId === btn.id ? null : btn.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 transition-colors text-left touch-manipulation">
              <div className="w-7 h-7 rounded-md flex-shrink-0" style={{ backgroundColor: btn.colorHex }} />
              <span className="flex-1 text-white font-semibold text-sm">{btn.label}</span>
              {btn.sourceType === 'mp3' && btn.fileName
                ? <span className="text-purple-400 text-xs truncate max-w-28">♪ {btn.fileName}</span>
                : btn.uriInput && <span className="text-green-400 text-xs">●</span>
              }
              <span className="text-gray-400 text-xs">{expandedButtonId === btn.id ? '▲' : '▼'}</span>
            </button>

            {expandedButtonId === btn.id && (
              <div className="border-t border-gray-600 px-3 py-3 flex flex-col gap-3 bg-gray-900/50">
                {/* Label */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Label</label>
                  <input type="text" value={btn.label} onChange={e => updateButton(btn.id, { label: e.target.value })}
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength={8} />
                </div>

                {/* Color */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-400">Color</label>
                  <div className="grid grid-cols-8 gap-1.5">
                    {['#CC0000','#FF4500','#FF8C00','#FFD700','#228B22','#007A7A','#0044CC','#7700BB',
                      '#C71585','#FF69B4','#FFFFFF','#AAAAAA','#666666','#333333','#1a1a2e','#8B4513'].map(color => (
                      <button key={color} onClick={() => updateButton(btn.id, { colorHex: color })}
                        className="w-full aspect-square rounded-md border-2 transition-transform active:scale-90 touch-manipulation"
                        style={{ backgroundColor: color, borderColor: btn.colorHex === color ? '#ffffff' : 'transparent' }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Custom:</label>
                    <input type="color" value={btn.colorHex} onChange={e => updateButton(btn.id, { colorHex: e.target.value })}
                      className="w-10 h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                    <span className="text-xs text-gray-500 font-mono">{btn.colorHex}</span>
                  </div>
                </div>

                {/* Source type toggle */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-400">Audio Source</label>
                  <div className="flex rounded-lg overflow-hidden border border-gray-600">
                    <button onClick={() => updateButton(btn.id, { sourceType: 'spotify' })}
                      className={`flex-1 py-2 text-xs font-semibold transition-colors touch-manipulation ${btn.sourceType !== 'mp3' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                      🎵 Spotify
                    </button>
                    <button onClick={() => updateButton(btn.id, { sourceType: 'mp3' })}
                      className={`flex-1 py-2 text-xs font-semibold transition-colors touch-manipulation ${btn.sourceType === 'mp3' ? 'bg-purple-700 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                      🎤 MP3 File
                    </button>
                  </div>
                </div>

                {/* Spotify URI */}
                {btn.sourceType !== 'mp3' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Spotify URI <span className="text-gray-500">(spotify:track:… or spotify:playlist:…)</span></label>
                    <input type="text" value={btn.uriInput} onChange={e => updateButton(btn.id, { uriInput: e.target.value })}
                      className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="spotify:track:0abc…" />
                  </div>
                )}

                {/* MP3 file picker */}
                {btn.sourceType === 'mp3' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400">MP3 / WAV File</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 truncate min-w-0">
                        {btn.fileName ?? 'No file selected'}
                      </div>
                      <button onClick={() => mp3FileRefs.current[btn.id]?.click()}
                        className="flex-shrink-0 px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-white text-xs font-semibold transition-colors touch-manipulation">
                        Choose…
                      </button>
                      <input ref={el => { mp3FileRefs.current[btn.id] = el }} type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/*"
                        className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleMp3Pick(btn.id, f); e.target.value = '' }} />
                    </div>
                    {btn.fileKey && (
                      <button onClick={() => { if (btn.fileKey) deleteMp3(btn.fileKey).catch(() => {}); updateButton(btn.id, { fileKey: undefined, fileName: undefined }) }}
                        className="text-xs text-red-400 hover:text-red-300 text-left transition-colors">Remove file</button>
                    )}
                    <p className="text-xs text-gray-500">Stored in this browser. Re-upload if you switch devices.</p>
                  </div>
                )}

                {/* Start Offset */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Start Offset (seconds)</label>
                  <input type="number" value={btn.startOffset} onChange={e => updateButton(btn.id, { startOffset: e.target.value })}
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" step="1" placeholder="0" />
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
            <button onClick={() => csvFileRef.current?.click()}
              className="px-3 py-1 bg-green-800 hover:bg-green-700 rounded-lg text-sm text-white font-semibold transition-colors touch-manipulation">+ CSV</button>
            <input ref={csvFileRef} type="file" accept=".csv" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) importFromCsv(f); e.target.value = '' }} />
            <button onClick={addSong}
              className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm text-white font-semibold transition-colors touch-manipulation">+ Add</button>
          </div>
        </div>

        {importError && <p className="text-red-400 text-xs px-1">{importError}</p>}
        {songs.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No songs yet. Tap + CSV to import from Exportify, or + Add to add manually.</p>
        )}

        {songs.map(song => (
          <div key={song.id} className="rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-700">
              <button onClick={() => setExpandedSongId(expandedSongId === song.id ? null : song.id)}
                className="flex-1 min-w-0 flex items-center gap-2 text-left touch-manipulation hover:opacity-80 active:opacity-60 transition-opacity">
                <span className="flex-1 min-w-0 text-white text-sm truncate">{song.title}</span>
                {song.uriInput && <span className="text-green-400 text-xs">●</span>}
                <span className="text-gray-400 text-xs">{expandedSongId === song.id ? '▲' : '▼'}</span>
              </button>
              <button onClick={() => deleteSong(song.id)}
                className="ml-1 w-7 h-7 flex items-center justify-center rounded-md bg-red-800/60 hover:bg-red-700 text-red-300 text-sm transition-colors touch-manipulation flex-shrink-0">✕</button>
            </div>

            {expandedSongId === song.id && (
              <div className="border-t border-gray-600 px-3 py-3 flex flex-col gap-3 bg-gray-900/50">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Spotify Link or URI</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={song.uriInput}
                      onChange={e => updateSong(song.id, { uriInput: e.target.value })}
                      onBlur={e => fetchTrackTitle(song.id, e.target.value)}
                      className="flex-1 min-w-0 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="Paste Spotify link or spotify:track:…"
                    />
                    {spotify?.isReady && normalizeSpotifyUri(song.uriInput).startsWith('spotify:track:') && (
                      <button
                        onClick={() => handlePreview(song)}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg text-white text-xs font-semibold transition-colors touch-manipulation ${playingSongId === song.id && spotify.isPlaying ? 'bg-red-700 hover:bg-red-600' : 'bg-green-700 hover:bg-green-600'}`}
                      >
                        {playingSongId === song.id && spotify.isPlaying ? '⏹ Stop' : '▶ Listen'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 flex items-center gap-2">
                    Title
                    {fetchingTitleId === song.id && <span className="text-gray-500 normal-case font-normal">Fetching…</span>}
                  </label>
                  <input type="text" value={song.title} onChange={e => updateSong(song.id, { title: e.target.value })}
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Song title" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Start Offset (seconds)</label>
                  <div className="flex gap-2">
                    <input type="number" value={song.startOffset} onChange={e => updateSong(song.id, { startOffset: e.target.value })}
                      className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" step="1" placeholder="0" />
                    {playingSongId === song.id && spotify?.isPlaying && (
                      <button
                        onClick={() => updateSong(song.id, { startOffset: String(Math.floor(spotify.getPosition() / 1000)) })}
                        className="flex-shrink-0 px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold transition-colors touch-manipulation"
                      >
                        Set here
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      <button onClick={saveAll}
        className="w-full py-4 bg-green-600 hover:bg-green-500 active:bg-green-700 rounded-xl text-white font-bold text-lg transition-colors touch-manipulation">Done</button>
    </div>
  )
}
