# CLAUDE.md – Sports DJ Web

## Projektöversikt

**Sports DJ Web** är en webbapp för DJs som arbetar med sportevent. Appen låter DJn förbereda och spela upp Spotify-musik via konfigurerbara knappar anpassade till olika sportgrenar och eventtyper.

---

## Tech Stack (förslag)

- **Frontend:** React + TypeScript
- **Autentisering:** Spotify OAuth 2.0 (PKCE-flöde)
- **Musikuppspelning:** Spotify Web Playback SDK (kräver Spotify Premium)
- **Lagring:** LocalStorage (inställningar) + filsystem via JSON-export (profiler)

---

## Arkitektur & Datamodell

### Profil
```json
{
  "id": "uuid",
  "name": "Fotboll Final",
  "sport": "Fotboll",
  "buttons": [
    {
      "id": "uuid",
      "label": "Mål!",
      "color": "#00FF00",
      "spotifyUri": "spotify:track:xxxx"
    }
  ]
}
```

### Användarinställningar (ej i profil, lagras per inloggning)
```json
{
  "spotifyAccessToken": "...",
  "spotifyDeviceId": "..."
}
```

---

## App-lägen

| Läge | Beskrivning |
|------|-------------|
| **Edit-läge** | DJn konfigurerar knappar, profiler och inställningar |
| **Play-läge** | DJn spelar musik via knapptryck – ingen konfiguration möjlig |

---

## User Stories

---

### US-01: Logga in med Spotify

**Som** DJ  
**Vill jag** kunna logga in med mitt Spotify-konto  
**Så att** jag kan använda appen och koppla upp min Spotify Premium-uppspelning i ett enda steg

**Acceptanskriterier:**
- [ ] DJ kan klicka "Logga in med Spotify" på startsidan
- [ ] OAuth 2.0 PKCE-flöde används för autentisering
- [ ] Efter inloggning är DJn inne i appen och Spotify är kopplat
- [ ] Åtkomsttoken lagras per inloggning, ej i profilen
- [ ] Om token går ut uppmanas DJn att logga in igen

---

### US-02: Koppla Spotify Premium i menyn

**Som** DJ  
**Vill jag** kunna hantera min Spotify-koppling via menyn  
**Så att** jag kan se status, återansluta eller logga ut från Spotify

**Acceptanskriterier:**
- [ ] Menyn visar om Spotify är anslutet eller ej
- [ ] DJ kan logga ut från Spotify utan att profiler påverkas
- [ ] Spotify-inställningen är kopplad till inloggningen, inte till profilen
- [ ] Appen visar tydligt fel om Premium-konto saknas

---

### US-03: Skapa ny profil

**Som** DJ  
**Vill jag** kunna skapa en ny profil  
**Så att** jag kan sätta upp en färsk spellista och välja sportgren/eventtyp för ett nytt event

**Acceptanskriterier:**
- [ ] DJ kan klicka "Ny profil" och få ett tomt profilformulär
- [ ] Profilen kräver minst ett namn och en sportgren/eventtyp
- [ ] Ny profil skapas med 8 tomma standardknappar
- [ ] Profilen sparas inte automatiskt – DJ måste explicit spara

---

### US-04: Öppna befintlig profil

**Som** DJ  
**Vill jag** kunna öppna en tidigare sparad profil  
**Så att** jag snabbt kan återanvända en spellista och eventinställning

**Acceptanskriterier:**
- [ ] DJ kan bläddra bland sparade profiler i menyn
- [ ] Profilen laddas med knappar, färger, etiketter och Spotify-URIs intakta
- [ ] Om osparade ändringar finns visas en bekräftelsedialog

---

### US-05: Spara profil

**Som** DJ  
**Vill jag** kunna spara min aktiva profil  
**Så att** mina ändringar bevaras till nästa session

**Acceptanskriterier:**
- [ ] DJ kan spara via "Spara"-knapp i menyn
- [ ] Befintlig profil uppdateras (ej dupliceras)
- [ ] DJ får visuell bekräftelse när profilen sparats
- [ ] "Spara som" skapar en ny kopia med eget namn

---

### US-06: Exportera profil

**Som** DJ  
**Vill jag** kunna exportera min profil som en JSON-fil  
**Så att** jag kan dela eller säkerhetskopiera min konfiguration

**Acceptanskriterier:**
- [ ] DJ kan klicka "Exportera" i menyn och ladda ner en `.json`-fil
- [ ] JSON-filen innehåller profilnamn, sportgren/eventtyp och alla knappar
- [ ] Filnamnet baseras på profilnamnet (t.ex. `fotboll-final.json`)

---

### US-07: Växla mellan Edit- och Play-läge

**Som** DJ  
**Vill jag** kunna växla mellan Edit-läge och Play-läge  
**Så att** jag kan konfigurera i förväg och sedan fokusera på att spela under eventet

**Acceptanskriterier:**
- [ ] En tydlig toggle/knapp i menyn byter läge
- [ ] I Play-läge är all konfiguration inaktiverad
- [ ] I Edit-läge är uppspelning via knappar inaktiverad
- [ ] Aktuellt läge visas tydligt i gränssnittet

---

### US-08: Konfigurera knappar i Edit-läge

**Som** DJ  
**Vill jag** kunna konfigurera varje knapp med etikett, färg och Spotify-URI  
**Så att** jag snabbt hittar och spelar rätt musik under eventet

**Acceptanskriterier:**
- [ ] Varje knapp har ett fält för etikett (rubrik)
- [ ] DJ kan välja färg per knapp via en färgväljare
- [ ] DJ kan ange en Spotify-URI (t.ex. `spotify:track:xxxx` eller `spotify:playlist:xxxx`)
- [ ] Ändringar sparas i profilen vid "Spara"

---

### US-09: Hantera antal knappar i Edit-läge

**Som** DJ  
**Vill jag** kunna lägga till fler knappar utöver de 8 som finns som standard  
**Så att** jag kan täcka fler musikmoment under ett event

**Acceptanskriterier:**
- [ ] Standardantalet knappar är 8
- [ ] DJ kan lägga till knappar upp till max 20
- [ ] DJ kan ta bort knappar (minst 1 måste finnas kvar)
- [ ] Knappar visas i rader om 4 per rad

---

### US-10: Spela musik i Play-läge

**Som** DJ  
**Vill jag** att ett knapptryck i Play-läge omedelbart spelar rätt låt via Spotify  
**Så att** jag kan trigga musik snabbt och intuitivt under eventet

**Acceptanskriterier:**
- [ ] Tryck på en knapp startar uppspelning av konfigurerad Spotify-URI direkt
- [ ] Uppspelning sker via Spotify Web Playback SDK
- [ ] Om ingen Spotify-URI är konfigurerad på knappen händer ingenting (eller visas en subtle varning)
- [ ] Om Spotify-kopplingen saknas visas ett felmeddelande

---

## Layout

```
┌─────────────────────────────────────┐
│  Meny (profil, läge, Spotify, etc.) │
├─────────────────────────────────────┤
│  [Knapp 1] [Knapp 2] [Knapp 3] [Knapp 4]  │
│  [Knapp 5] [Knapp 6] [Knapp 7] [Knapp 8]  │
│  ...                                │
└─────────────────────────────────────┘
```

- Knappar visas högt upp direkt under menyn
- 4 knappar per rad
- 8 knappar som standard, upp till 20 i Edit-läge

---

## Viktiga begränsningar

- Spotify Web Playback SDK kräver **Spotify Premium**
- Spotify-koppling lagras **aldrig** i profilen – endast per inloggningssession
- Profiler lagras lokalt och kan exporteras/importeras som JSON
