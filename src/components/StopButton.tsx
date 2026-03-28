interface Props {
  onStop: () => void
  disabled: boolean
}

export function StopButton({ onStop, disabled }: Props) {
  return (
    <button
      onClick={onStop}
      disabled={disabled}
      className={[
        'w-full py-4 rounded-xl font-black text-white text-xl tracking-widest',
        'transition-all duration-75 touch-manipulation select-none focus:outline-none',
        'focus:ring-2 focus:ring-red-400/50',
        disabled
          ? 'bg-gray-700 opacity-40 cursor-default'
          : 'bg-red-600 hover:bg-red-500 active:scale-95 active:bg-red-700 shadow-lg shadow-red-900/40',
      ].join(' ')}
      aria-label="Stop playback"
    >
      ■ STOP
    </button>
  )
}
