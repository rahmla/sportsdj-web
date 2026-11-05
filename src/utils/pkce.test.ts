import { describe, expect, test } from 'vitest'
import { buildAuthURL, clearCodeVerifier, generateCodeChallenge, generateCodeVerifier, getCodeVerifier } from './pkce'

describe('pkce', () => {
  test('TEST-14 the verifier is 86 characters of base64url and differs on every call', async () => {
    const a = await generateCodeVerifier()
    const b = await generateCodeVerifier()
    expect(a).toMatch(/^[A-Za-z0-9_-]{86}$/)
    expect(a).not.toBe(b)
  })

  test('TEST-14 the S256 challenge matches the RFC 7636 test vector', async () => {
    expect(await generateCodeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  })

  test('ARCH-12 TEST-14 buildAuthURL stores the verifier in localStorage and sends only the challenge', async () => {
    const verifier = await generateCodeVerifier()
    const url = new URL(await buildAuthURL(verifier))
    expect(getCodeVerifier()).toBe(verifier)
    expect(url.origin + url.pathname).toBe('https://accounts.spotify.com/authorize')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('code_challenge')).toBe(await generateCodeChallenge(verifier))
    expect(url.search).not.toContain(verifier)
    clearCodeVerifier()
    expect(getCodeVerifier()).toBeNull()
  })
})
