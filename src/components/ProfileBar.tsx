import { useRef, useState } from 'react'
import type { SportProfile } from '../types'

interface Props {
  profiles: SportProfile[]
  activeProfileId: string | null
  onSelectProfile: (id: string) => void
  onAddProfile: () => void
  onDeleteProfile: (id: string) => void
}

export function ProfileBar({
  profiles,
  activeProfileId,
  onSelectProfile,
  onAddProfile,
  onDeleteProfile,
}: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handlePointerDown(id: string) {
    longPressTimer.current = setTimeout(() => {
      setConfirmDeleteId(id)
    }, 600)
  }

  function handlePointerUp() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  function handleContextMenu(e: React.MouseEvent, id: string) {
    e.preventDefault()
    setConfirmDeleteId(id)
  }

  function confirmDelete() {
    if (confirmDeleteId) {
      onDeleteProfile(confirmDeleteId)
    }
    setConfirmDeleteId(null)
  }

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-800 overflow-x-auto scrollbar-none">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onPointerDown={() => handlePointerDown(profile.id)}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onContextMenu={(e) => handleContextMenu(e, profile.id)}
            onClick={() => onSelectProfile(profile.id)}
            className={[
              'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-manipulation select-none whitespace-nowrap',
              profile.id === activeProfileId
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white',
            ].join(' ')}
          >
            {profile.name}
          </button>
        ))}

        {/* Add button */}
        <button
          onClick={onAddProfile}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-gray-300 hover:text-white flex items-center justify-center text-lg font-light transition-colors touch-manipulation"
          aria-label="Add profile"
        >
          +
        </button>
      </div>

      {/* Delete confirmation overlay */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-gray-800 rounded-2xl p-6 mx-4 w-full max-w-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg mb-2">Delete Profile?</h3>
            <p className="text-gray-400 text-sm mb-5">
              "{profiles.find((p) => p.id === confirmDeleteId)?.name}" will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-700 text-white font-medium text-sm hover:bg-gray-600 transition-colors touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-500 transition-colors touch-manipulation"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
