import type { OccasionButton as OccasionButtonType } from '../types'

interface Props {
  button: OccasionButtonType
  onPress: () => void
  isPlaying: boolean
}

export function OccasionButton({ button, onPress, isPlaying }: Props) {
  const hasSource = !!button.audioSource

  return (
    <button
      onClick={onPress}
      className="relative flex items-center justify-center w-full h-full min-h-[60px] sm:min-h-[120px] rounded-2xl select-none touch-manipulation transition-transform duration-75 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/30"
      style={{
        backgroundColor: button.colorHex,
        opacity: hasSource ? 1 : 0.6,
      }}
      aria-label={button.label}
    >
      {/* Pulsing ring when playing */}
      {isPlaying && (
        <span
          className="absolute inset-0 rounded-2xl animate-ping"
          style={{ backgroundColor: button.colorHex, opacity: 0.4 }}
        />
      )}
      {/* Bright border when playing */}
      {isPlaying && (
        <span className="absolute inset-0 rounded-2xl ring-2 ring-white/80" />
      )}

      <span
        className="relative z-10 font-black text-white tracking-widest drop-shadow-lg"
        style={{ fontSize: 'clamp(0.9rem, 2vw, 1.4rem)' }}
      >
        {button.label}
      </span>

      {!hasSource && (
        <span className="absolute bottom-1 right-1.5 text-white/40 text-[10px] leading-none">
          —
        </span>
      )}
    </button>
  )
}
