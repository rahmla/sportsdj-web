import { describe, expect, test } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useEvents } from './useEvents'
import { createDefaultEvent, saveActiveEventId, saveEvents } from '../utils/storage'

describe('useEvents', () => {
  test('ARCH-20 without a user nothing is loaded', () => {
    const { result } = renderHook(() => useEvents(null))
    expect(result.current.events).toEqual([])
    expect(result.current.activeEvent).toBeNull()
  })

  test('ARCH-20 loads the stored events and the stored active event for the user', () => {
    const a = createDefaultEvent('A')
    const b = createDefaultEvent('B')
    saveEvents('u1', [a, b])
    saveActiveEventId('u1', b.id)
    const { result } = renderHook(() => useEvents('u1'))
    expect(result.current.events.map(e => e.name)).toEqual(['A', 'B'])
    expect(result.current.activeEvent?.name).toBe('B')
  })

  test('ARCH-20 an unknown stored active id falls back to the first event', () => {
    saveEvents('u1', [createDefaultEvent('A')])
    saveActiveEventId('u1', 'gone')
    const { result } = renderHook(() => useEvents('u1'))
    expect(result.current.activeEvent?.name).toBe('A')
  })

  test('ARCH-20 events are loaded when the user id arrives later', () => {
    saveEvents('u1', [createDefaultEvent('Mine')])
    const { result, rerender } = renderHook(({ id }) => useEvents(id), { initialProps: { id: null as string | null } })
    expect(result.current.events).toEqual([])
    rerender({ id: 'u1' })
    expect(result.current.activeEvent?.name).toBe('Mine')
  })

  test('ARCH-42 updateEvent persists to localStorage', () => {
    const a = createDefaultEvent('A')
    saveEvents('u1', [a])
    const { result } = renderHook(() => useEvents('u1'))
    act(() => result.current.updateEvent({ ...a, name: 'Renamed' }))
    expect(JSON.parse(localStorage.getItem('sportsdj_events_u1')!)[0].name).toBe('Renamed')
    expect(result.current.activeEvent?.name).toBe('Renamed')
  })
})
