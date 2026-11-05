/** Turns a pasted Spotify link or URI into a `spotify:<type>:<id>` URI. Other input is returned trimmed. */
export function normalizeSpotifyUri(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('spotify:')) return trimmed
  const match = trimmed.match(/open\.spotify\.com\/(track|playlist|album)\/([A-Za-z0-9]+)/)
  if (match) return `spotify:${match[1]}:${match[2]}`
  return trimmed
}
