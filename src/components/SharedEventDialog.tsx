import { useEffect, useState } from 'react'
import type { DJEvent } from '../types'
import { fetchSharedEvent } from '../utils/shareClient'

interface Props {
  id: string
  onAdd: (event: DJEvent) => void
  onClose: () => void
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; event: DJEvent; mp3Buttons: number }

/** Preview of a shared event with an "Add to my events" button (SHARE-10, 12, 13, 14, 20). */
export function SharedEventDialog({ id, onAdd, onClose }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetchSharedEvent(id)
      .then(({ event, mp3Buttons }) => { if (!cancelled) setState({ status: 'ready', event, mp3Buttons }) })
      .catch(err => { if (!cancelled) setState({ status: 'error', message: err instanceof Error ? err.message : 'Could not load the shared event' }) })
    return () => { cancelled = true }
  }, [id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl p-6 mx-4 w-full max-w-sm shadow-2xl flex flex-col gap-4">
        <h2 className="text-white font-bold text-lg">Shared event</h2>

        {state.status === 'loading' && (
          <div className="flex justify-center py-6">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading shared event" />
          </div>
        )}

        {state.status === 'error' && <p className="text-red-300 text-sm" role="alert">{state.message}</p>}

        {state.status === 'ready' && (
          <>
            <div>
              <p className="text-white font-semibold text-base">{state.event.name}</p>
              {state.event.sport && <p className="text-gray-400 text-sm">{state.event.sport}</p>}
            </div>
            <ul className="text-gray-300 text-sm list-disc pl-5">
              <li>{state.event.occasionButtons.filter(b => b.audioSource).length} buttons with a sound</li>
              <li>{state.event.songs.length} songs</li>
            </ul>
            {state.mp3Buttons > 0 && (
              <p className="text-yellow-300 text-xs">
                {state.mp3Buttons} MP3 button{state.mp3Buttons > 1 ? 's' : ''} will be empty, because MP3 files are not shared.
              </p>
            )}
            <button onClick={() => onAdd(state.event)}
              className="py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors">
              Add to my events
            </button>
          </>
        )}

        <button onClick={onClose} className="py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors">
          {state.status === 'error' ? 'Open the app' : 'Not now'}
        </button>
      </div>
    </div>
  )
}
