import type { SongItem } from '../types'

interface Props {
  song: SongItem
  onPress: () => void
  isPlaying: boolean
}

export function SongTile({ song, onPress, isPlaying }: Props) {
  const hasSource = !!song.audioSource
  const playCount = song.playCount ?? 0

  return (
    <button
      onClick={onPress}
      disabled={!hasSource}
      title={song.title}
      className={[
        'relative aspect-square w-full min-w-0 flex items-center justify-center rounded-xl p-2 pt-5 text-center',
        'transition-colors duration-100 touch-manipulation select-none focus:outline-none',
        isPlaying
          ? 'bg-green-700/60 ring-2 ring-green-400'
          : 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600',
        !hasSource ? 'opacity-50 cursor-default' : 'cursor-pointer',
      ].join(' ')}
      aria-label={`Play ${song.title}`}
    >
      {/* Play count badge (SONG-22) */}
      <span
        data-testid="play-count"
        className={`absolute top-1.5 left-2 text-xs font-bold tabular-nums ${playCount > 0 ? 'text-green-400' : 'text-gray-600'}`}
      >
        {playCount}
      </span>

      {/* Title, max 3 lines, never wider than the tile (SONG-21, SONG-40) */}
      <span className="w-full text-white font-semibold text-sm leading-tight line-clamp-3 break-words [overflow-wrap:anywhere]">
        {song.title}
      </span>
    </button>
  )
}
