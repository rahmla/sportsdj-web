export function parseCsvRow(row: string): string[] {
  const fields: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < row.length; i++) {
    const ch = row[i]
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  fields.push(cur)
  return fields
}

export interface CsvTrack {
  uri: string
  trackName: string
  title: string
}

/** Parses an Exportify CSV. Only `spotify:track:` rows are returned, in file order. Throws a user-facing Error. */
export function parseExportifyCsv(text: string): CsvTrack[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) throw new Error('CSV file is empty')
  const headers = parseCsvRow(lines[0]).map(h => h.trim().toLowerCase())
  const trackNameIdx = headers.findIndex(h => h === 'track name')
  const artistIdx = headers.findIndex(h => h.includes('artist name'))
  const uriIdx = headers.findIndex(h => h.includes('uri'))
  if (uriIdx === -1) throw new Error('No URI column found. Make sure this is an Exportify CSV.')
  const tracks: CsvTrack[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i])
    const uri = cols[uriIdx]?.trim()
    if (!uri?.startsWith('spotify:track:')) continue
    const trackName = trackNameIdx !== -1 ? cols[trackNameIdx]?.trim() ?? '' : ''
    const artist = (artistIdx !== -1 ? cols[artistIdx]?.trim() ?? '' : '').replace(/;/g, ', ')
    const title = trackName && artist ? `${trackName} – ${artist}` : trackName || uri
    tracks.push({ uri, trackName, title })
  }
  if (tracks.length === 0) throw new Error('No tracks found in CSV')
  return tracks
}
