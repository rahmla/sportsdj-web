import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SharedEventDialog } from './SharedEventDialog'
import { sampleEvent } from '../test/fakes'
import { ShareError } from '../utils/shareClient'

vi.mock('../utils/shareClient', async importOriginal => ({ ...(await importOriginal<typeof import('../utils/shareClient')>()), fetchSharedEvent: vi.fn() }))
import { fetchSharedEvent } from '../utils/shareClient'

afterEach(() => vi.clearAllMocks())

describe('SharedEventDialog', () => {
  test('SHARE-10 shows the name, sport and the counts of buttons with a sound and songs', async () => {
    vi.mocked(fetchSharedEvent).mockResolvedValue({ event: sampleEvent(), mp3Buttons: 0 })
    render(<SharedEventDialog id="AbCdEfGhIjKlMnOp" onAdd={vi.fn()} onClose={vi.fn()} />)
    expect(await screen.findByText('Final')).toBeInTheDocument()
    expect(screen.getByText('Beachvolley')).toBeInTheDocument()
    expect(screen.getByText('1 buttons with a sound')).toBeInTheDocument()
    expect(screen.getByText('2 songs')).toBeInTheDocument()
  })

  test('SHARE-12 "Add to my events" hands the event to onAdd', async () => {
    vi.mocked(fetchSharedEvent).mockResolvedValue({ event: sampleEvent(), mp3Buttons: 0 })
    const onAdd = vi.fn()
    render(<SharedEventDialog id="AbCdEfGhIjKlMnOp" onAdd={onAdd} onClose={vi.fn()} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Add to my events' }))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'Final' }))
  })

  test('SHARE-20 the preview says how many MP3 buttons will be empty', async () => {
    vi.mocked(fetchSharedEvent).mockResolvedValue({ event: sampleEvent(), mp3Buttons: 3 })
    render(<SharedEventDialog id="AbCdEfGhIjKlMnOp" onAdd={vi.fn()} onClose={vi.fn()} />)
    expect(await screen.findByText(/3 MP3 buttons will be empty/)).toBeInTheDocument()
  })

  test('SHARE-14 an unknown link shows the message and no Add button, with a way into the app', async () => {
    vi.mocked(fetchSharedEvent).mockRejectedValue(new ShareError('This link does not exist or has expired', 'not_found'))
    const onClose = vi.fn()
    render(<SharedEventDialog id="AbCdEfGhIjKlMnOp" onAdd={vi.fn()} onClose={onClose} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('This link does not exist or has expired')
    expect(screen.queryByRole('button', { name: 'Add to my events' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Open the app' }))
    expect(onClose).toHaveBeenCalled()
  })

  test('SHARE-13 an invalid snapshot shows its reason and cannot be added', async () => {
    vi.mocked(fetchSharedEvent).mockRejectedValue(new ShareError('This shared event is not valid: The event has no name', 'invalid'))
    render(<SharedEventDialog id="AbCdEfGhIjKlMnOp" onAdd={vi.fn()} onClose={vi.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('not valid')
    expect(screen.queryByRole('button', { name: 'Add to my events' })).not.toBeInTheDocument()
  })
})
