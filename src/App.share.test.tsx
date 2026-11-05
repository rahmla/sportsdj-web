import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { fakeSpotify, sampleEvent } from './test/fakes'
import { PENDING_SHARE_KEY } from './utils/shareClient'
import { loadEvents } from './utils/storage'
import type { SpotifyHook } from './hooks/useSpotify'

const ID = 'AbCdEfGhIjKlMnOp'
let spotify: SpotifyHook

vi.mock('./hooks/useSpotify', () => ({ useSpotify: () => spotify }))
vi.mock('./utils/shareClient', async importOriginal => ({ ...(await importOriginal<typeof import('./utils/shareClient')>()), fetchSharedEvent: vi.fn() }))
import { fetchSharedEvent } from './utils/shareClient'

function loggedIn(): SpotifyHook {
  return fakeSpotify({ user: { id: 'u1', displayName: 'U' } })
}

beforeEach(() => {
  vi.mocked(fetchSharedEvent).mockResolvedValue({ event: { ...sampleEvent(), name: 'Shared final' }, mp3Buttons: 0 })
  window.history.replaceState({}, '', '/')
})
afterEach(() => { vi.clearAllMocks(); window.history.replaceState({}, '', '/') })

describe('opening a share link', () => {
  test('SHARE-11 a logged-out visitor sees the login screen, and the link is remembered for after login', () => {
    spotify = fakeSpotify({ token: null })
    window.history.replaceState({}, '', `/s/${ID}`)
    render(<App />)
    expect(screen.queryByText('Shared event')).not.toBeInTheDocument()
    expect(localStorage.getItem(PENDING_SHARE_KEY)).toBe(ID)
  })

  test('SHARE-11 after login the remembered link opens the preview', async () => {
    localStorage.setItem(PENDING_SHARE_KEY, ID)
    spotify = loggedIn()
    render(<App />)
    expect(await screen.findByText('Shared final')).toBeInTheDocument()
    expect(fetchSharedEvent).toHaveBeenCalledWith(ID)
  })

  test('SHARE-12 adding saves a new event, makes it active, and forgets the link', async () => {
    spotify = loggedIn()
    window.history.replaceState({}, '', `/s/${ID}`)
    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: 'Add to my events' }))
    await waitFor(() => expect(loadEvents('u1').map(e => e.name)).toContain('Shared final'))
    const saved = loadEvents('u1').find(e => e.name === 'Shared final')!
    expect(saved.id).not.toBe('e1')
    expect(saved.songs.every(s => s.playCount === 0)).toBe(true)
    expect(localStorage.getItem(PENDING_SHARE_KEY)).toBeNull()
    expect(window.location.pathname).toBe('/')
    expect(screen.queryByText('Shared event')).not.toBeInTheDocument()
  })

  test('SHARE-14 closing the preview of a broken link keeps the user in the app and forgets the link', async () => {
    const { ShareError } = await import('./utils/shareClient')
    vi.mocked(fetchSharedEvent).mockRejectedValue(new ShareError('This link does not exist or has expired', 'not_found'))
    spotify = loggedIn()
    window.history.replaceState({}, '', `/s/${ID}`)
    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: 'Open the app' }))
    expect(localStorage.getItem(PENDING_SHARE_KEY)).toBeNull()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
