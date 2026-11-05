import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SongTile } from './SongTile'
import { song } from '../test/fakes'

describe('SongTile', () => {
  test('SONG-21 shows the title, and the full title is the accessible name and tooltip', () => {
    render(<SongTile song={song('s1', 'A very long title – Some Artist')} onPress={vi.fn()} isPlaying={false} />)
    const tile = screen.getByRole('button', { name: 'Play A very long title – Some Artist' })
    expect(tile).toHaveAttribute('title', 'A very long title – Some Artist')
    expect(tile).toHaveTextContent('A very long title – Some Artist')
  })

  test('SONG-22 the play count badge shows the count, green above 0 and grey at 0', () => {
    const { rerender } = render(<SongTile song={song('s1', 'X', 0)} onPress={vi.fn()} isPlaying={false} />)
    expect(screen.getByTestId('play-count')).toHaveTextContent('0')
    expect(screen.getByTestId('play-count')).toHaveClass('text-gray-600')
    rerender(<SongTile song={song('s1', 'X', 4)} onPress={vi.fn()} isPlaying={false} />)
    expect(screen.getByTestId('play-count')).toHaveTextContent('4')
    expect(screen.getByTestId('play-count')).toHaveClass('text-green-400')
  })

  test('SONG-22 a missing play count is shown as 0', () => {
    render(<SongTile song={{ ...song('s1', 'X'), playCount: undefined }} onPress={vi.fn()} isPlaying={false} />)
    expect(screen.getByTestId('play-count')).toHaveTextContent('0')
  })

  test('SONG-23 the playing tile is highlighted, others are not', () => {
    const { rerender } = render(<SongTile song={song('s1', 'X')} onPress={vi.fn()} isPlaying={true} />)
    expect(screen.getByRole('button')).toHaveClass('ring-green-400')
    rerender(<SongTile song={song('s1', 'X')} onPress={vi.fn()} isPlaying={false} />)
    expect(screen.getByRole('button')).not.toHaveClass('ring-green-400')
  })

  test('SONG-24 PLAY-03 a tile without a source is dimmed and does nothing when tapped', async () => {
    const onPress = vi.fn()
    render(<SongTile song={{ ...song('s1', 'X'), audioSource: undefined }} onPress={onPress} isPlaying={false} />)
    const tile = screen.getByRole('button')
    expect(tile).toBeDisabled()
    expect(tile).toHaveClass('opacity-50')
    await userEvent.click(tile)
    expect(onPress).not.toHaveBeenCalled()
  })

  test('SONG-20 tapping a tile with a source calls onPress', async () => {
    const onPress = vi.fn()
    render(<SongTile song={song('s1', 'X')} onPress={onPress} isPlaying={false} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  test('SONG-40 the title is clamped to 3 lines and wraps long words', () => {
    render(<SongTile song={song('s1', 'Supercalifragilisticexpialidocious'.repeat(3))} onPress={vi.fn()} isPlaying={false} />)
    const title = screen.getByText(/Supercali/)
    expect(title).toHaveClass('line-clamp-3')
    expect(title.className).toContain('overflow-wrap:anywhere')
  })
})
