import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { DJEvent } from '../types'
import {
  loadEvents,
  saveEvents,
  loadActiveEventId,
  saveActiveEventId,
  createDefaultEvent,
} from '../utils/storage'
import { eventFileName, parseEventFile, serializeEvent } from '../utils/eventFile'

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

  // Load events when userId becomes available. Done during render (not in an effect)
  // so state is set once, without an extra render pass.
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  if (userId && loadedFor !== userId) {
    setLoadedFor(userId)
    const loaded = loadEvents(userId)
    const saved = loadActiveEventId(userId)
    setEventsState(loaded)
    setActiveEventIdState((saved && loaded.find(e => e.id === saved)) ? saved : (loaded[0]?.id ?? null))
  }

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
    const updated = events.filter(e => e.id !== id)
    setEvents(updated)
    if (activeEventId === id || updated.length === 0) {
      const next = updated[0]?.id ?? null
      if (next) setActiveEventId(next)
      else {
        setActiveEventIdState(CLOSED)
        if (userId) saveActiveEventId(userId, CLOSED)
      }
    }
  }, [events, activeEventId, userId, setEvents, setActiveEventId])

  const exportEvent = useCallback((event: DJEvent) => {
    const json = serializeEvent(event)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = eventFileName(event)
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
          const imported = parseEventFile(e.target?.result as string)
          const updated = [...events, imported]
          setEvents(updated)
          setActiveEventId(imported.id)
          resolve()
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Invalid event file'))
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
