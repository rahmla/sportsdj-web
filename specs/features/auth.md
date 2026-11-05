# Spotify login

**Area code:** `AUTH`  ·  **Status:** implemented

## Why

The app plays music through the DJ's own Spotify Premium account, and events are stored per Spotify user.

## Acceptance criteria

- [x] **AUTH-01** When the DJ is not logged in, the app shows a login screen with "Log in with Spotify" and a "Requires Spotify Premium" note.
- [x] **AUTH-02** Login uses the OAuth 2.0 Authorization Code flow with PKCE (`src/utils/pkce.ts`). No client secret is used.
- [x] **AUTH-03** While the OAuth callback is processed, a "Connecting to Spotify…" spinner is shown.
- [x] **AUTH-04** If the callback fails (for example, a missing code verifier or a failed token exchange), the error is shown together with a "Back to login" button.
- [x] **AUTH-05** After login, the DJ's events load for their Spotify user id.
- [x] **AUTH-06** When the stored token has expired at load time, the DJ sees "Session expired. Please log in again." instead of an endless spinner.
- [x] **AUTH-07** The menu shows the Spotify connection state and offers Logout, or Login when disconnected.
- [x] **AUTH-08** Logout clears the token and the player but leaves all events untouched.
- [x] **AUTH-09** If the account is not Premium, the error reads "Account error: … Spotify Premium required."

## Open questions

- [?] **AUTH-90** Tokens expire after about one hour and there is no refresh-token flow. A DJ in the middle of a long event gets logged out. Should the app refresh the token silently?
