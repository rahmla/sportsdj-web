import { describe, expect, test, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PerformanceView } from './PerformanceView'
import { fakeSpotify, sampleEvent } from '../test/fakes'
import type { DJEvent } from '../types'

/** Holds the event in state like the app does, so onUpdate re-renders the view. */
function Harness({ spotify, onUpdate }: { spotify: ReturnType<typeof fakeSpotify>; onUpdate?: (e: DJEvent) => void }) {
  const [event, setEvent] = useState(sampleEvent())
  return (
    <PerformanceView
      profile={event}
      spotify={spotify}
      onEdit={vi.fn()}
      onUpdate={e => { setEvent(e); onUpdate?.(e) }}
    />
  )
}

describe('PerformanceView', () => {
  test('TEST-20 BTN-02 pressing an occasion button plays its source from its start offset', async () => {
    const spotify = fakeSpotify()
    render(<Harness spotify={spotify} />)
    await userEvent.click(screen.getByRole('button', { name: 'ACE' }))
    await waitFor(() => expect(spotify.playUri).toHaveBeenCalledWith('spotify:track:ace', 5))
  })

  test('TEST-20 BTN-02 pressing an occasion button does not change any play counter', async () => {
    const onUpdate = vi.fn()
    render(<Harness spotify={fakeSpotify()} onUpdate={onUpdate} />)
    await userEvent.click(screen.getByRole('button', { name: 'ACE' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'ACE' })).toBeInTheDocument())
    expect(onUpdate).not.toHaveBeenCalled()
  })

  test('TEST-20 SONG-02 starting a song plays it from its offset and raises only its counter by 1', async () => {
    const spotify = fakeSpotify()
    const onUpdate = vi.fn()
    render(<Harness spotify={spotify} onUpdate={onUpdate} />)
    await userEvent.click(screen.getByRole('button', { name: 'Play First Song' }))
    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1))
    expect(spotify.playUri).toHaveBeenCalledWith('spotify:track:s1', 30)
    const songs = onUpdate.mock.calls[0][0].songs
    expect(songs.map((s: { playCount: number }) => s.playCount)).toEqual([3, 0])
  })

  test('TEST-20 PLAY-01 a button without a source does not start playback', async () => {
    const spotify = fakeSpotify()
    render(<Harness spotify={spotify} />)
    await userEvent.click(screen.getByRole('button', { name: 'NONE' }))
    expect(spotify.playUri).not.toHaveBeenCalled()
  })

  test('TEST-22 SONG-03 Reset play counters sets every counter to 0 and then hides itself', async () => {
    const onUpdate = vi.fn()
    render(<Harness spotify={fakeSpotify()} onUpdate={onUpdate} />)
    await userEvent.click(screen.getByRole('button', { name: 'Reset play counters' }))
    expect(onUpdate.mock.calls[0][0].songs.map((s: { playCount: number }) => s.playCount)).toEqual([0, 0])
    expect(screen.queryByRole('button', { name: 'Reset play counters' })).not.toBeInTheDocument()
  })

  test('SONG-01 SONG-25 the grid shows every song, in the order of their `order` field', () => {
    const ev = sampleEvent()
    ev.songs = [{ ...ev.songs[0], order: 2 }, { ...ev.songs[1], order: 1 }]
    render(<PerformanceView profile={ev} spotify={fakeSpotify()} onEdit={vi.fn()} onUpdate={vi.fn()} />)
    const names = screen.getAllByRole('button', { name: /^Play / }).map(b => b.getAttribute('aria-label'))
    expect(names).toEqual(['Play Second Song', 'Play First Song'])
  })

  test('SONG-26 the Songs heading is shown, and an event without songs has no song area', () => {
    const { unmount } = render(<Harness spotify={fakeSpotify()} />)
    expect(screen.getByRole('heading', { name: 'Songs' })).toBeInTheDocument()
    unmount()
    const ev = { ...sampleEvent(), songs: [] }
    render(<PerformanceView profile={ev} spotify={fakeSpotify()} onEdit={vi.fn()} onUpdate={vi.fn()} />)
    expect(screen.queryByRole('heading', { name: 'Songs' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ACE' })).toBeInTheDocument()
  })
})
