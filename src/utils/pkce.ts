const CLIENT_ID = '1063298d0bd844eaa7df158a4f86f9d2'
const REDIRECT_URI = import.meta.env.DEV
  ? 'https://localhost:5173/callback'
  : 'https://sportsdj-web.vercel.app/callback'
const SCOPES = 'streaming user-read-playback-state user-modify-playback-state user-read-email user-read-private'
const CODE_VERIFIER_KEY = 'spotify_code_verifier'

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (const byte of bytes) {
    str += String.fromCharCode(byte)
  }
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function generateCodeVerifier(): Promise<string> {
  const randomBytes = new Uint8Array(64)
  crypto.getRandomValues(randomBytes)
  return base64urlEncode(randomBytes.buffer)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64urlEncode(digest)
}

export async function buildAuthURL(verifier: string): Promise<string> {
  const challenge = await generateCodeChallenge(verifier)
  sessionStorage.setItem(CODE_VERIFIER_KEY, verifier)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })

  return `https://accounts.spotify.com/authorize?${params.toString()}`
}

export function getCodeVerifier(): string | null {
  return sessionStorage.getItem(CODE_VERIFIER_KEY)
}

export function clearCodeVerifier(): void {
  sessionStorage.removeItem(CODE_VERIFIER_KEY)
}

export async function exchangeCodeForToken(code: string, verifier: string): Promise<string> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }).toString(),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Token exchange failed: ${err}`)
  }

  const data = await response.json()
  return data.access_token as string
}
