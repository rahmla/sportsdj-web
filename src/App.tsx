import { useState } from 'react'
import { useSpotify } from './hooks/useSpotify'
import { useProfiles } from './hooks/useProfiles'
import { ProfileBar } from './components/ProfileBar'
import { PerformanceView } from './components/PerformanceView'
import { EditView } from './components/EditView'

function AddProfileModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string, sport: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [sport, setSport] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-gray-800 rounded-2xl p-6 mx-4 w-full max-w-xs shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-lg mb-4">New Profile</h3>
        <div className="flex flex-col gap-3 mb-5">
          <input
            type="text"
            placeholder="Team / DJ name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <input
            type="text"
            placeholder="Sport (e.g. Volleyball)"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-gray-700 text-white font-medium text-sm hover:bg-gray-600 transition-colors touch-manipulation"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (name.trim()) {
                onConfirm(name.trim(), sport.trim() || 'Sport')
              }
            }}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold text-sm hover:bg-blue-500 transition-colors touch-manipulation"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const spotify = useSpotify()
  const { profiles, activeProfile, setActiveProfileId, updateProfile, addProfile, deleteProfile } =
    useProfiles()
  const [isEditing, setIsEditing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Check if we're in the OAuth callback flow
  const isOAuthCallback =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('code')

  if (isOAuthCallback && !spotify.token) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Connecting to Spotify…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Center on desktop, phone-width */}
      <div className="mx-auto w-full max-w-[480px] min-h-screen flex flex-col bg-gray-900 shadow-2xl">
        {/* Profile Bar */}
        <ProfileBar
          profiles={profiles}
          activeProfileId={activeProfile?.id ?? null}
          onSelectProfile={(id) => {
            setActiveProfileId(id)
            setIsEditing(false)
          }}
          onAddProfile={() => setShowAddModal(true)}
          onDeleteProfile={deleteProfile}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {activeProfile ? (
            isEditing ? (
              <EditView
                profile={activeProfile}
                spotify={spotify}
                onUpdate={updateProfile}
                onDone={() => setIsEditing(false)}
              />
            ) : (
              <PerformanceView
                profile={activeProfile}
                spotify={spotify}
                onEdit={() => setIsEditing(true)}
              />
            )
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-500 text-sm">No profile selected.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Profile Modal */}
      {showAddModal && (
        <AddProfileModal
          onConfirm={(name, sport) => {
            addProfile(name, sport)
            setShowAddModal(false)
          }}
          onCancel={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
