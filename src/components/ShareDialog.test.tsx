import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareDialog } from './ShareDialog'
import { sampleEvent } from '../test/fakes'
import { ShareError } from '../utils/shareClient'

vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn(async () => 'data:image/png;base64,AAAA') } }))
vi.mock('../utils/shareClient', async importOriginal => ({ ...(await importOriginal<typeof import('../utils/shareClient')>()), createShareLink: vi.fn() }))
import { createShareLink } from '../utils/shareClient'

afterEach(() => vi.clearAllMocks())

describe('ShareDialog', () => {
  test('SHARE-02 SHARE-04 shows the link, a QR code and a Copy button', async () => {
    vi.mocked(createShareLink).mockResolvedValue({ id: 'AbCdEfGhIjKlMnOp', mp3Buttons: 0 })
    render(<ShareDialog event={sampleEvent()} onClose={vi.fn()} />)
    expect(await screen.findByLabelText('Share link')).toHaveValue(`${window.location.origin}/s/AbCdEfGhIjKlMnOp`)
    expect(screen.getByAltText('QR code for the share link')).toHaveAttribute('src', 'data:image/png;base64,AAAA')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
  })

  test('SHARE-04 Copy puts the link on the clipboard', async () => {
    vi.mocked(createShareLink).mockResolvedValue({ id: 'AbCdEfGhIjKlMnOp', mp3Buttons: 0 })
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<ShareDialog event={sampleEvent()} onClose={vi.fn()} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Copy' }))
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/s/AbCdEfGhIjKlMnOp`)
    expect(await screen.findByRole('button', { name: 'Link copied' })).toBeInTheDocument()
  })

  test('SHARE-04 the system share button is only shown when the device supports it', async () => {
    vi.mocked(createShareLink).mockResolvedValue({ id: 'AbCdEfGhIjKlMnOp', mp3Buttons: 0 })
    const { unmount } = render(<ShareDialog event={sampleEvent()} onClose={vi.fn()} />)
    await screen.findByLabelText('Share link')
    expect(screen.queryByRole('button', { name: 'Share…' })).not.toBeInTheDocument()
    unmount()
    Object.defineProperty(navigator, 'share', { value: vi.fn(async () => {}), configurable: true })
    render(<ShareDialog event={sampleEvent()} onClose={vi.fn()} />)
    expect(await screen.findByRole('button', { name: 'Share…' })).toBeInTheDocument()
    Reflect.deleteProperty(navigator, 'share')
  })

  test('SHARE-20 the dialog says how many MP3 buttons are left out', async () => {
    vi.mocked(createShareLink).mockResolvedValue({ id: 'AbCdEfGhIjKlMnOp', mp3Buttons: 2 })
    render(<ShareDialog event={sampleEvent()} onClose={vi.fn()} />)
    expect(await screen.findByText(/2 MP3 buttons and all MP3 songs are not included/)).toBeInTheDocument()
  })

  test('SHARE-40 SHARE-41 an error is shown and the dialog can be closed', async () => {
    vi.mocked(createShareLink).mockRejectedValue(new ShareError('This event is too large to share', 'too_large'))
    const onClose = vi.fn()
    render(<ShareDialog event={sampleEvent()} onClose={onClose} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('This event is too large to share')
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })

  test('SHARE-05 every time the dialog opens it creates a new snapshot', async () => {
    vi.mocked(createShareLink).mockResolvedValue({ id: 'AbCdEfGhIjKlMnOp', mp3Buttons: 0 })
    const { unmount } = render(<ShareDialog event={sampleEvent()} onClose={vi.fn()} />)
    await waitFor(() => expect(createShareLink).toHaveBeenCalledTimes(1))
    unmount()
    render(<ShareDialog event={sampleEvent()} onClose={vi.fn()} />)
    await waitFor(() => expect(createShareLink).toHaveBeenCalledTimes(2))
  })
})
