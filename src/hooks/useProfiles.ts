import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { SportProfile } from '../types'
import {
  loadProfiles,
  saveProfiles,
  loadActiveProfileId,
  saveActiveProfileId,
  createDefaultProfile,
} from '../utils/storage'

export interface ProfilesHook {
  profiles: SportProfile[]
  activeProfile: SportProfile | null
  setActiveProfileId: (id: string) => void
  updateProfile: (profile: SportProfile) => void
  addProfile: (name: string, sport: string) => void
  deleteProfile: (id: string) => void
  exportProfile: (profile: SportProfile) => void
  importProfile: (file: File) => Promise<void>
}

export function useProfiles(): ProfilesHook {
  const [profiles, setProfilesState] = useState<SportProfile[]>(() => loadProfiles())
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(() => {
    const saved = loadActiveProfileId()
    const all = loadProfiles()
    if (saved && all.find((p) => p.id === saved)) return saved
    return all[0]?.id ?? null
  })

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? null

  const setProfiles = useCallback((updated: SportProfile[]) => {
    setProfilesState(updated)
    saveProfiles(updated)
  }, [])

  const setActiveProfileId = useCallback((id: string) => {
    setActiveProfileIdState(id)
    saveActiveProfileId(id)
  }, [])

  const updateProfile = useCallback(
    (profile: SportProfile) => {
      const updated = profiles.map((p) => (p.id === profile.id ? profile : p))
      setProfiles(updated)
    },
    [profiles, setProfiles]
  )

  const addProfile = useCallback(
    (name: string, sport: string) => {
      const newProfile: SportProfile = {
        ...createDefaultProfile(name),
        id: uuidv4(),
        name,
        sport,
      }
      const updated = [...profiles, newProfile]
      setProfiles(updated)
      setActiveProfileId(newProfile.id)
    },
    [profiles, setProfiles, setActiveProfileId]
  )

  const deleteProfile = useCallback(
    (id: string) => {
      if (profiles.length <= 1) return
      const updated = profiles.filter((p) => p.id !== id)
      setProfiles(updated)
      if (activeProfileId === id) {
        const newActive = updated[0]?.id ?? null
        if (newActive) setActiveProfileId(newActive)
      }
    },
    [profiles, activeProfileId, setProfiles, setActiveProfileId]
  )

  const exportProfile = useCallback((profile: SportProfile) => {
    const json = JSON.stringify(profile, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${profile.name.replace(/\s+/g, '_')}.sportsdj.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const importProfile = useCallback(
    (file: File): Promise<void> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const parsed = JSON.parse(e.target?.result as string) as SportProfile
            const imported: SportProfile = { ...parsed, id: uuidv4() }
            const updated = [...profiles, imported]
            setProfiles(updated)
            setActiveProfileId(imported.id)
            resolve()
          } catch {
            reject(new Error('Invalid profile file'))
          }
        }
        reader.onerror = () => reject(new Error('Could not read file'))
        reader.readAsText(file)
      })
    },
    [profiles, setProfiles, setActiveProfileId]
  )

  return {
    profiles,
    activeProfile,
    setActiveProfileId,
    updateProfile,
    addProfile,
    deleteProfile,
    exportProfile,
    importProfile,
  }
}
