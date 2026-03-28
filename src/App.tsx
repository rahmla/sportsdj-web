import { useRef, useState } from 'react'
import { useSpotify } from './hooks/useSpotify'
import { useEvents } from './hooks/useEvents'
import { PerformanceView } from './components/PerformanceView'
import { EditView } from './components/EditView'
import type { DJEvent } from './types'

// ─── Login screen ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">SportsDJ</h1>
        <p className="text-gray-400 text-sm">DJ soundboard for sports events</p>
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

function NewEventModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string, sport: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [sport, setSport] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-gray-800 rounded-2xl p-6 mx-4 w-full max-w-xs shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-bold text-lg mb-4">New Event</h3>
        <div className="flex flex-col gap-3 mb-5">
          <input
            type="text"
            placeholder="Event name (e.g. Volleyboll SM)"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && onConfirm(name.trim(), sport.trim())}
            className="bg-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
            autoFocus
          />
          <input
            type="text"
            placeholder="Sport (e.g. Volleyball)"
            value={sport}
            onChange={e => setSport(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && onConfirm(name.trim(), sport.trim())}
            className="bg-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-gray-700 text-white font-medium text-sm hover:bg-gray-600 transition-colors touch-manipulation">Cancel</button>
          <button
            onClick={() => name.trim() && onConfirm(name.trim(), sport.trim())}
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
              {events.length > 1 && (
                <button
                  onClick={() => setConfirmDelete(ev.id)}
                  className="text-gray-600 hover:text-red-400 text-lg leading-none px-1 transition-colors"
                  aria-label="Delete event"
                >
                  ×
                </button>
              )}
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
              <button onClick={() => { onDelete(confirmDelete); setConfirmDelete(null) }} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors">Delete</button>
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
  userName,
  isEditing,
  onEdit,
  onDone,
  onNew,
  onOpen,
  onExport,
  onImport,
  importError,
}: {
  eventName: string
  userName: string
  isEditing: boolean
  onEdit: () => void
  onDone: () => void
  onNew: () => void
  onOpen: () => void
  onExport: () => void
  onImport: (file: File) => void
  importError: string | null
}) {
  const [open, setOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const menuItem = 'w-full text-left px-4 py-3 text-sm text-white hover:bg-gray-700 active:bg-gray-600 transition-colors touch-manipulation flex items-center gap-3'

  return (
    <div className="relative">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate">{eventName}</p>
          <p className="text-gray-500 text-xs truncate">{userName}</p>
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
            {isEditing ? (
              <button className={menuItem} onClick={() => { onDone(); setOpen(false) }}>
                <span className="text-green-400">✓</span> Done editing
              </button>
            ) : (
              <button className={menuItem} onClick={() => { onEdit(); setOpen(false) }}>
                <span>✏️</span> Edit event
              </button>
            )}
            <div className="border-t border-gray-700" />
            <button className={menuItem} onClick={() => { onNew(); setOpen(false) }}>
              <span>＋</span> New event
            </button>
            <button className={menuItem} onClick={() => { onOpen(); setOpen(false) }}>
              <span>📂</span> Open event
            </button>
            <div className="border-t border-gray-700" />
            <button className={menuItem} onClick={() => { onExport(); setOpen(false) }}>
              <span>⬇️</span> Export
            </button>
            <button className={menuItem} onClick={() => { fileRef.current?.click(); setOpen(false) }}>
              <span>⬆️</span> Import
            </button>
            <input ref={fileRef} type="file" accept=".json" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = '' }} />
          </div>
        </>
      )}
      {importError && <p className="text-red-400 text-xs px-4 py-1 bg-gray-800">{importError}</p>}
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const spotify = useSpotify()
  const { events, activeEvent, setActiveEventId, updateEvent, addEvent, deleteEvent, exportEvent, importEvent } = useEvents(spotify.user?.id ?? null)

  const [isEditing, setIsEditing] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showOpen, setShowOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  // OAuth callback spinner
  const isOAuthCallback = new URLSearchParams(window.location.search).has('code')
  if (isOAuthCallback && !spotify.token) {
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
      <div className="mx-auto w-full max-w-[480px] min-h-screen flex flex-col bg-gray-900 shadow-2xl">

        <Header
          eventName={activeEvent?.name ?? 'No event'}
          userName={spotify.user.displayName}
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          onDone={() => setIsEditing(false)}
          onNew={() => setShowNew(true)}
          onOpen={() => setShowOpen(true)}
          onExport={() => activeEvent && exportEvent(activeEvent)}
          onImport={handleImport}
          importError={importError}
        />

        <div className="flex-1 overflow-y-auto">
          {activeEvent ? (
            isEditing ? (
              <EditView
                profile={activeEvent}
                spotify={spotify}
                onUpdate={updateEvent}
                onDone={() => setIsEditing(false)}
              />
            ) : (
              <PerformanceView
                profile={activeEvent}
                spotify={spotify}
                onEdit={() => setIsEditing(true)}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <p className="text-gray-500 text-sm">No events yet.</p>
              <button onClick={() => setShowNew(true)} className="px-4 py-2 rounded-full bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors touch-manipulation">Create first event</button>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewEventModal
          onConfirm={(name, sport) => { addEvent(name, sport); setShowNew(false) }}
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
