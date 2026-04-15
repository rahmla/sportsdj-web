interface Props {
  onStop: () => void
  disabled: boolean
  elapsed: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function StopButton({ onStop, disabled, elapsed }: Props) {
  return (
    <button
      onClick={onStop}
      disabled={disabled}
      className={[
        'w-full py-2.5 rounded-2xl font-black text-white text-2xl tracking-widest',
        'flex items-center justify-center gap-4',
        'transition-all duration-75 touch-manipulation select-none focus:outline-none',
        'focus:ring-2 focus:ring-red-400/50',
        disabled
          ? 'bg-gray-700 opacity-40 cursor-default'
          : 'bg-red-600 hover:bg-red-500 active:scale-95 active:bg-red-700 shadow-lg shadow-red-900/40',
      ].join(' ')}
      aria-label="Stop playback"
    >
      ■ STOP
      <span className={`text-base font-mono font-normal tracking-normal tabular-nums ${disabled ? 'text-gray-500' : 'text-red-200'}`}>
        {disabled ? '00:00' : formatTime(elapsed)}
      </span>
    </button>
  )
}
