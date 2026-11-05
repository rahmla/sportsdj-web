import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { DJEvent } from '../types'
import { createShareLink, shareUrl } from '../utils/shareClient'

interface Props {
  event: DJEvent
  onClose: () => void
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; url: string; qr: string; mp3Buttons: number }

/** Creates a share link for the event and shows it with Copy, QR code and the system share sheet (SHARE-01 to 05). */
export function ShareDialog({ event, onClose }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { id, mp3Buttons } = await createShareLink(event)
        const url = shareUrl(id)
        const qr = await QRCode.toDataURL(url, { margin: 1, width: 220 })
        if (!cancelled) setState({ status: 'ready', url, qr, mp3Buttons })
      } catch (err) {
        if (!cancelled) setState({ status: 'error', message: err instanceof Error ? err.message : 'Sharing failed' })
      }
    })()
    return () => { cancelled = true }
  }, [event])

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-6 mx-4 w-full max-w-sm shadow-2xl flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-white font-bold text-lg">Share “{event.name}”</h2>

        {state.status === 'loading' && (
          <div className="flex justify-center py-6">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" role="status" aria-label="Creating link" />
          </div>
        )}

        {state.status === 'error' && (
          <p className="text-red-300 text-sm" role="alert">{state.message}</p>
        )}

        {state.status === 'ready' && (
          <>
            <img src={state.qr} alt="QR code for the share link" className="self-center rounded-lg bg-white" width={220} height={220} />
            <input readOnly value={state.url} aria-label="Share link" onFocus={e => e.currentTarget.select()}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm font-mono w-full" />
            <div className="flex gap-2">
              <button onClick={() => copy(state.url)}
                className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors">
                {copied ? 'Link copied' : 'Copy'}
              </button>
              {canShare && (
                <button onClick={() => navigator.share({ title: event.name, url: state.url }).catch(() => {})}
                  className="flex-1 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors">
                  Share…
                </button>
              )}
            </div>
            <p className="text-gray-400 text-xs">
              The link holds a copy of the event as it is now. Later changes are not included, and it expires after 90 days without use.
              {state.mp3Buttons > 0 && ` ${state.mp3Buttons} MP3 button${state.mp3Buttons > 1 ? 's' : ''} and all MP3 songs are not included.`}
            </p>
          </>
        )}

        <button onClick={onClose} className="py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors">Close</button>
      </div>
    </div>
  )
}
