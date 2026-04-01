import { useState, useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { DJEvent } from '../types'
import {
  loadEvents,
  saveEvents,
  loadActiveEventId,
  saveActiveEventId,
  createDefaultEvent,
} from '../utils/storage'

export interface EventsHook {
  events: DJEvent[]
  activeEvent: DJEvent | null
  setActiveEventId: (id: string) => void
  closeEvent: () => void
  updateEvent: (event: DJEvent) => void
  addEvent: (name: string, sport: string) => void
  addEventFromTemplate: (template: DJEvent) => void
  deleteEvent: (id: string) => void
  exportEvent: (event: DJEvent) => void
  importEvent: (file: File) => Promise<void>
}

export function useEvents(userId: string | null): EventsHook {
  const [events, setEventsState] = useState<DJEvent[]>([])
  const [activeEventId, setActiveEventIdState] = useState<string | null>(null)

  // Load events when userId becomes available
  useEffect(() => {
    if (!userId) return
    const loaded = loadEvents(userId)
    setEventsState(loaded)
    const saved = loadActiveEventId(userId)
    const activeId = (saved && loaded.find(e => e.id === saved)) ? saved : (loaded[0]?.id ?? null)
    setActiveEventIdState(activeId)
  }, [userId])

  const CLOSED = '__closed__'
  const activeEvent = activeEventId === CLOSED ? null : (events.find(e => e.id === activeEventId) ?? events[0] ?? null)

  const setEvents = useCallback((updated: DJEvent[]) => {
    setEventsState(updated)
    if (userId) saveEvents(userId, updated)
  }, [userId])

  const setActiveEventId = useCallback((id: string) => {
    setActiveEventIdState(id)
    if (userId) saveActiveEventId(userId, id)
  }, [userId])

  const updateEvent = useCallback((event: DJEvent) => {
    setEvents(events.map(e => e.id === event.id ? event : e))
  }, [events, setEvents])

  const addEvent = useCallback((name: string, sport: string) => {
    const newEvent: DJEvent = { ...createDefaultEvent(name), id: uuidv4(), name, sport }
    const updated = [...events, newEvent]
    setEvents(updated)
    setActiveEventId(newEvent.id)
  }, [events, setEvents, setActiveEventId])

  const addEventFromTemplate = useCallback((template: DJEvent) => {
    const newEvent: DJEvent = {
      ...template,
      id: uuidv4(),
      songs: template.songs.map(s => ({ ...s, playCount: 0 })),
    }
    const updated = [...events, newEvent]
    setEvents(updated)
    setActiveEventId(newEvent.id)
  }, [events, setEvents, setActiveEventId])

  const closeEvent = useCallback(() => {
    setActiveEventIdState('__closed__')
    if (userId) saveActiveEventId(userId, '__closed__')
  }, [userId])

  const deleteEvent = useCallback((id: string) => {
    if (events.length <= 1) return
    const updated = events.filter(e => e.id !== id)
    setEvents(updated)
    if (activeEventId === id) {
      const next = updated[0]?.id ?? null
      if (next) setActiveEventId(next)
    }
  }, [events, activeEventId, setEvents, setActiveEventId])

  const exportEvent = useCallback((event: DJEvent) => {
    const json = JSON.stringify(event, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.name.replace(/\s+/g, '_')}.sportsdj.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const importEvent = useCallback((file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string) as DJEvent
          const imported: DJEvent = { ...parsed, id: uuidv4() }
          const updated = [...events, imported]
          setEvents(updated)
          setActiveEventId(imported.id)
          resolve()
        } catch {
          reject(new Error('Invalid event file'))
        }
      }
      reader.onerror = () => reject(new Error('Could not read file'))
      reader.readAsText(file)
    })
  }, [events, setEvents, setActiveEventId])

  return {
    events,
    activeEvent,
    setActiveEventId,
    closeEvent,
    updateEvent,
    addEvent,
    addEventFromTemplate,
    deleteEvent,
    exportEvent,
    importEvent,
  }
}
