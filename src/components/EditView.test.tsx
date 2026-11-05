import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditView } from './EditView'
import { sampleEvent } from '../test/fakes'

describe('EditView', () => {
  test('TEST-21 BTN-16 ARCH-41 edits are not committed until Done is pressed', async () => {
    const onUpdate = vi.fn()
    const onDone = vi.fn()
    render(<EditView profile={sampleEvent()} onUpdate={onUpdate} onDone={onDone} />)
    const name = screen.getByPlaceholderText('Event name')
    await userEvent.clear(name)
    await userEvent.type(name, 'Semi final')
    expect(onUpdate).not.toHaveBeenCalled()
    expect(onDone).not.toHaveBeenCalled()
  })

  test.each([0, 1])('TEST-21 BTN-16 Done (button %i) commits the edited event and closes Edit mode', async index => {
    const onUpdate = vi.fn()
    const onDone = vi.fn()
    render(<EditView profile={sampleEvent()} onUpdate={onUpdate} onDone={onDone} />)
    const name = screen.getByPlaceholderText('Event name')
    await userEvent.clear(name)
    await userEvent.type(name, 'Semi final')
    await userEvent.click(screen.getAllByRole('button', { name: 'Done' })[index])
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.calls[0][0]).toMatchObject({ id: 'e1', name: 'Semi final', sport: 'Beachvolley' })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  test('TEST-21 ARCH-41 committing without edits keeps buttons and songs, including play counts', async () => {
    const onUpdate = vi.fn()
    const original = sampleEvent()
    render(<EditView profile={original} onUpdate={onUpdate} onDone={vi.fn()} />)
    await userEvent.click(screen.getAllByRole('button', { name: 'Done' })[0])
    const saved = onUpdate.mock.calls[0][0]
    expect(saved.occasionButtons.map((b: { label: string }) => b.label)).toEqual(['ACE', 'NONE'])
    expect(saved.songs.map((s: { title: string; playCount: number }) => [s.title, s.playCount])).toEqual([['First Song', 2], ['Second Song', 0]])
  })
})
