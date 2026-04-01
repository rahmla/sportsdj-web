import { useRef, useState } from 'react'
import { useSpotify } from './hooks/useSpotify'
import { useEvents } from './hooks/useEvents'
import { PerformanceView } from './components/PerformanceView'
import { EditView } from './components/EditView'
import type { DJEvent } from './types'
import { BUILT_IN_TEMPLATES } from './utils/templates'

// ─── Login screen ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-6 px-6">
      <div className="text-center flex flex-col items-center gap-3">
        <img src="/logo.png" alt="SportsDJ" className="w-24 h-24 rounded-2xl shadow-2xl" />
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">SportsDJ</h1>
          <p className="text-gray-400 text-sm">DJ soundboard for sports events</p>
        </div>
      </div>
      <button
        onClick={onLogin}
        className="flex items-center gap-3 bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-bold px-8 py-4 rounded-full text-base transition-colors touch-manipulation"
      >
        <SpotifyLogo />
        Log in with Spotify
      </button>
      <p className="text-gray-600 text-xs text-center">Requires Spotify Premium</p>
    </div>
  )
}

function SpotifyLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

// ─── New event modal ──────────────────────────────────────────────────────────

const EMPTY_TEMPLATE_ID = '__empty__'

function NewEventModal({
  onConfirm,
  onConfirmFromTemplate,
  onCancel,
}: {
  onConfirm: (name: string, sport: string) => void
  onConfirmFromTemplate: (template: DJEvent) => void
  onCancel: () => void
}) {
  const [templateId, setTemplateId] = useState(EMPTY_TEMPLATE_ID)
  const [name, setName] = useState('')
  const [sport, setSport] = useState('')

  function handleTemplateChange(id: string) {
    setTemplateId(id)
    const tpl = BUILT_IN_TEMPLATES.find(t => t.id === id)
    setName(tpl?.name ?? '')
    setSport(tpl?.sport ?? '')
  }

  function handleCreate() {
    if (!name.trim()) return
    if (templateId === EMPTY_TEMPLATE_ID) {
      onConfirm(name.trim(), sport.trim())
    } else {
      const tpl = BUILT_IN_TEMPLATES.find(t => t.id === templateId)
      if (tpl) onConfirmFromTemplate({ ...tpl, name: name.trim(), sport: sport.trim() })
    }
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-gray-800 rounded-2xl mx-4 w-full max-w-xs shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-4 flex flex-col gap-3">
          <h3 className="text-white font-bold text-lg">New Event</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">Template</label>
            <select
              value={templateId}
              onChange={e => handleTemplateChange(e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value={EMPTY_TEMPLATE_ID}>Empty</option>
              {BUILT_IN_TEMPLATES.map(tpl => (
                <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">Event name</label>
            <input
              type="text"
              placeholder="e.g. Volleyboll SM"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="bg-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">Sport</label>
            <input
              type="text"
              placeholder="e.g. Volleyball"
              value={sport}
              onChange={e => setSport(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="bg-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
            />
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-gray-700 text-white font-medium text-sm hover:bg-gray-600 transition-colors touch-manipulation">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-green-600 disabled:opacity-40 text-white font-semibold text-sm hover:bg-green-500 transition-colors touch-manipulation"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Open event modal ─────────────────────────────────────────────────────────

function OpenEventModal({
  events,
  activeId,
  onSelect,
  onDelete,
  onCancel,
}: {
  events: DJEvent[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onCancel: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-gray-800 rounded-2xl mx-4 w-full max-w-xs shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-700">
          <h3 className="text-white font-bold text-lg">Open Event</h3>
        </div>
        <ul className="max-h-72 overflow-y-auto divide-y divide-gray-700">
          {events.map(ev => (
            <li key={ev.id} className="flex items-center gap-2 px-4 py-3">
              <button
                onClick={() => { onSelect(ev.id); onCancel() }}
                className="flex-1 text-left"
              >
                <p className={`font-semibold text-sm ${ev.id === activeId ? 'text-green-400' : 'text-white'}`}>{ev.name}</p>
                {ev.sport && <p className="text-gray-500 text-xs">{ev.sport}</p>}
              </button>
              <button
                onClick={() => setConfirmDelete(ev.id)}
                className="text-gray-600 hover:text-red-400 text-lg leading-none px-1 transition-colors"
                aria-label="Delete event"
              >
                ×
              </button>
            </li>
          ))}
        </ul>

<div className="px-5 py-3 border-t border-gray-700">
          <button onClick={onCancel} className="w-full py-2 rounded-xl bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 transition-colors touch-manipulation">Close</button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60" onClick={() => setConfirmDelete(null)}>
          <div className="bg-gray-800 rounded-2xl p-6 mx-4 w-full max-w-xs shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="text-white font-semibold mb-4">Delete "{events.find(e => e.id === confirmDelete)?.name}"?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 transition-colors">Cancel</button>
              <button onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); if (events.length <= 1) onCancel() }} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Header with dropdown menu ────────────────────────────────────────────────

function Header({
  eventName,
  hasActiveEvent,
  onNew,
  onOpen,
  onClose,
  onExport,
  onImport,
  importError,
  spotifyReady,
  spotifyToken,
  onSpotifyLogin,
  onSpotifyLogout,
}: {
  eventName: string
  hasActiveEvent: boolean
  onNew: () => void
  onOpen: () => void
  onClose: () => void
  onExport: () => void
  onImport: (file: File) => void
  importError: string | null
  spotifyReady: boolean
  spotifyToken: string | null
  onSpotifyLogin: () => void
  onSpotifyLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const menuItem = 'w-full text-left px-4 py-3 text-sm text-white hover:bg-gray-700 active:bg-gray-600 transition-colors touch-manipulation flex items-center gap-3'

  return (
    <div className="relative">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2 min-w-0">
          <img src="/logo.png" alt="SportsDJ" className="w-8 h-8 rounded-lg flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-white font-bold text-sm">SportsDJ Web</p>
            <p className="text-gray-500 text-xs truncate">{eventName}</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="ml-3 flex-shrink-0 w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 active:bg-gray-500 transition-colors touch-manipulation"
          aria-label="Menu"
        >
          <span className="block w-4 h-0.5 bg-white rounded" />
          <span className="block w-4 h-0.5 bg-white rounded" />
          <span className="block w-4 h-0.5 bg-white rounded" />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden mt-1 mr-1">
            <button className={menuItem} onClick={() => { onNew(); setOpen(false) }}>
              <span>＋</span> New event
            </button>
            <button className={menuItem} onClick={() => { onOpen(); setOpen(false) }}>
              <span>📂</span> Open event
            </button>
            {hasActiveEvent && (
              <button className={menuItem} onClick={() => { onClose(); setOpen(false) }}>
                <span>✕</span> Close event
              </button>
            )}
            <div className="border-t border-gray-700" />
            <button className={menuItem} onClick={() => { onExport(); setOpen(false) }}>
              <span>⬇️</span> Export
            </button>
            <button className={menuItem} onClick={() => { fileRef.current?.click(); setOpen(false) }}>
              <span>⬆️</span> Import
            </button>
            <input ref={fileRef} type="file" accept=".json" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = '' }} />
            <div className="border-t border-gray-700" />
            <button className={menuItem} onClick={() => { setShowHelp(true); setOpen(false) }}>
              <span>❓</span> Help
            </button>
            <button className={menuItem} onClick={() => { setShowAbout(true); setOpen(false) }}>
              <span>ℹ️</span> About
            </button>
            <div className="border-t border-gray-700" />
            {spotifyToken ? (
              <button className={menuItem} onClick={() => { onSpotifyLogout(); setOpen(false) }}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${spotifyReady ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span>{spotifyReady ? 'Spotify connected' : 'Spotify connecting…'}</span>
                <span className="ml-auto text-xs text-gray-500">Logout</span>
              </button>
            ) : (
              <button className={menuItem} onClick={() => { onSpotifyLogin(); setOpen(false) }}>
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                Connect Spotify
              </button>
            )}
          </div>
        </>
      )}
      {importError && <p className="text-red-400 text-xs px-4 py-1 bg-gray-800">{importError}</p>}

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-700 flex-shrink-0">
              <h2 className="text-white font-bold text-lg">Help</h2>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors">✕</button>
            </div>
            <div className="overflow-y-auto px-5 py-4 flex flex-col gap-5 text-sm">

              <section className="flex flex-col gap-2">
                <h3 className="text-green-400 font-semibold uppercase tracking-wider text-xs">Requirements</h3>
                <p className="text-gray-300 leading-relaxed">SportsDJ requires a <span className="text-white font-semibold">Spotify Premium</span> account and a <span className="text-white font-semibold">desktop browser</span> (Chrome, Firefox, Edge, or Safari on macOS). It does not work on phones or tablets.</p>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-green-400 font-semibold uppercase tracking-wider text-xs">Events</h3>
                <ul className="text-gray-300 leading-relaxed flex flex-col gap-1.5">
                  <li><span className="text-white font-semibold">New</span> — create a blank event with 8 empty occasion buttons.</li>
                  <li><span className="text-white font-semibold">Open</span> — switch between saved events.</li>
                  <li><span className="text-white font-semibold">Export</span> — download the current event as a JSON file (backup or sharing).</li>
                  <li><span className="text-white font-semibold">Import</span> — load a previously exported JSON file.</li>
                </ul>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-green-400 font-semibold uppercase tracking-wider text-xs">Importing songs from Spotify</h3>
                <p className="text-gray-300 leading-relaxed">Spotify's API does not allow direct playlist import in development mode. Use <span className="text-white font-semibold">Exportify</span> instead:</p>
                <ol className="text-gray-300 leading-relaxed flex flex-col gap-1.5 list-decimal list-inside">
                  <li>Go to <span className="text-white font-mono text-xs bg-gray-700 px-1.5 py-0.5 rounded">exportify.net</span></li>
                  <li>Log in with Spotify and click <span className="text-white font-semibold">Export</span> on your playlist</li>
                  <li>Save the downloaded <span className="text-white font-semibold">.csv</span> file</li>
                  <li>In SportsDJ → <span className="text-white font-semibold">Edit</span> → Songs → tap <span className="text-white font-semibold">+ CSV</span> and select the file</li>
                </ol>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-green-400 font-semibold uppercase tracking-wider text-xs">Occasion buttons</h3>
                <ul className="text-gray-300 leading-relaxed flex flex-col gap-1.5">
                  <li>Tap a button in Edit mode to set its <span className="text-white font-semibold">label</span>, <span className="text-white font-semibold">color</span>, and <span className="text-white font-semibold">Spotify URI</span>.</li>
                  <li>Use <span className="text-white font-semibold">+ Row / − Row</span> to add or remove rows (1–5 rows of 4 buttons).</li>
                  <li>Find a track URI in Spotify: right-click a song → Share → <span className="text-white font-semibold">Copy Song Link</span>, then paste it in the URI field.</li>
                  <li>Set a <span className="text-white font-semibold">start offset</span> (seconds) to begin playback partway into a track.</li>
                </ul>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-green-400 font-semibold uppercase tracking-wider text-xs">Performance</h3>
                <ul className="text-gray-300 leading-relaxed flex flex-col gap-1.5">
                  <li>Tap any button or song row to start playback.</li>
                  <li>Press <span className="text-white font-semibold">STOP</span> or hit <span className="text-white font-mono text-xs bg-gray-700 px-1.5 py-0.5 rounded">Space</span> to stop with a fade-out.</li>
                  <li>The timer on the Stop button shows how long the current track has been playing (including any start offset).</li>
                  <li>The number on the left of each song row counts how many times it has been played. Reset counters in Edit → Songs → <span className="text-white font-semibold">Reset</span>.</li>
                  <li>Pressing <span className="text-white font-semibold">Edit</span> stops playback and opens the last played song for editing.</li>
                </ul>
              </section>

            </div>
            <div className="px-5 pb-5 pt-3 flex-shrink-0">
              <button onClick={() => setShowHelp(false)} className="w-full py-2.5 rounded-xl bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 transition-colors touch-manipulation">Close</button>
            </div>
          </div>
        </div>
      )}

      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAbout(false)}>
          <div className="bg-gray-800 rounded-2xl p-6 mx-4 w-full max-w-xs shadow-2xl flex flex-col items-center gap-4 text-center" onClick={e => e.stopPropagation()}>
            <img src="/logo.png" alt="SportsDJ" className="w-20 h-20 rounded-2xl shadow-lg" />
            <div>
              <h2 className="text-white font-bold text-xl mb-1">SportsDJ Web</h2>
              <p className="text-gray-400 text-sm">DJ soundboard for sports events</p>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Built by <span className="text-white font-semibold">Lars Rahm</span> and <span className="text-white font-semibold">Claude</span> (Anthropic).
            </p>
            <button
              onClick={() => setShowAbout(false)}
              className="w-full py-2.5 rounded-xl bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 transition-colors touch-manipulation"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const spotify = useSpotify()
  const { events, activeEvent, setActiveEventId, closeEvent, updateEvent, addEvent, addEventFromTemplate, deleteEvent, exportEvent, importEvent } = useEvents(spotify.user?.id ?? null)

  const [isEditing, setIsEditing] = useState(false)
  const [editFocusSongId, setEditFocusSongId] = useState<string | undefined>(undefined)
  const [showNew, setShowNew] = useState(false)
  const [showOpen, setShowOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  // OAuth callback spinner — only show while we have a code and no error yet
  const isOAuthCallback = new URLSearchParams(window.location.search).has('code')
  if (isOAuthCallback && !spotify.token) {
    if (spotify.error) {
      return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4 px-6">
          <p className="text-red-400 text-sm text-center">{spotify.error}</p>
          <button
            onClick={() => window.location.replace('/')}
            className="px-6 py-2 rounded-full bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors"
          >
            Back to login
          </button>
        </div>
      )
    }
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Connecting to Spotify…</p>
      </div>
    )
  }

  // Not logged in
  if (!spotify.token) {
    return <LoginScreen onLogin={spotify.login} />
  }

  // Logged in but user info still loading
  if (!spotify.user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  function handleImport(file: File) {
    setImportError(null)
    importEvent(file).catch((err: Error) => setImportError(err.message))
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="mx-auto w-full max-w-5xl min-h-screen flex flex-col bg-gray-900 shadow-2xl">

        <Header
          eventName={activeEvent?.name ?? 'SportsDJ'}
          hasActiveEvent={!!activeEvent}
          onNew={() => setShowNew(true)}
          onOpen={() => setShowOpen(true)}
          onClose={() => { closeEvent(); setIsEditing(false) }}
          onExport={() => activeEvent && exportEvent(activeEvent)}
          onImport={handleImport}
          importError={importError}
          spotifyReady={spotify.isReady}
          spotifyToken={spotify.token}
          onSpotifyLogin={spotify.login}
          onSpotifyLogout={spotify.logout}
        />

        <div className="flex-1 overflow-y-auto">
          {activeEvent ? (
            isEditing ? (
              <EditView
                profile={activeEvent}
                onUpdate={updateEvent}
                onDone={() => setIsEditing(false)}
                initialExpandedSongId={editFocusSongId}
              />
            ) : (
              <PerformanceView
                profile={activeEvent}
                spotify={spotify}
                onEdit={(songId) => { setEditFocusSongId(songId); setIsEditing(true) }}
                onUpdate={updateEvent}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center gap-6 px-6 py-20">
              <div className="text-center flex flex-col gap-2">
                <p className="text-white font-semibold text-lg">No active event</p>
                <p className="text-gray-500 text-sm">Select New event or Open event to get started</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNew(true)}
                  className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 text-white text-sm font-semibold transition-colors touch-manipulation"
                >
                  ＋ New event
                </button>
                {events.length > 0 && (
                  <button
                    onClick={() => setShowOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white text-sm font-semibold transition-colors touch-manipulation"
                  >
                    📂 Open event
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewEventModal
          onConfirm={(name, sport) => { addEvent(name, sport); setShowNew(false) }}
          onConfirmFromTemplate={tpl => { addEventFromTemplate(tpl); setShowNew(false); setIsEditing(false) }}
          onCancel={() => setShowNew(false)}
        />
      )}

      {showOpen && (
        <OpenEventModal
          events={events}
          activeId={activeEvent?.id ?? null}
          onSelect={id => { setActiveEventId(id); setIsEditing(false) }}
          onDelete={deleteEvent}
          onCancel={() => setShowOpen(false)}
        />
      )}
    </div>
  )
}
