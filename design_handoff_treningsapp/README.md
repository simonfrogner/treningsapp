# Handoff: Treningsapp — Styrketreningsapp

## Overview
En minimalistisk mobil styrketreningsapp for å logge treningsøkter, se historikk, og administrere et personlig øvelsesbibliotek. Designet er inspirert av Apple Fitness og Linear — rent, rolig, typografi-drevet med generøst whitespace og én aksentfarge.

## About the Design Files
Filene i denne pakken er **designreferanser laget i HTML** — interaktive prototyper som viser ønsket utseende og oppførsel. De er IKKE produksjonskode. Oppgaven er å **gjenskape disse designene i den valgte teknologien** (React Native, SwiftUI, Flutter, etc.) med etablerte mønstre og biblioteker. Hvis ingen teknologi er valgt ennå, anbefales React Native eller SwiftUI basert på målplattform.

## Fidelity
**High-fidelity (hifi)** — Pixel-perfekte mockups med endelige farger, typografi, spacing og interaksjoner. Utvikleren bør gjenskape UI-et så nøyaktig som mulig.

---

## Screens / Views

### 1. Hjem (Home / Today)
**Purpose:** Landingsside. Hilser brukeren, gir rask tilgang til å starte trening, og viser siste treningsøkter.

**Layout:**
- Vertikal stack, full bredde
- Padding: 24px horisontal, 62px topp (under statuslinje)

**Components:**
- **Hilsen:** "God morgen/ettermiddag/kveld," (15px, regular, secondary color) + "Magnus" (34px, bold 700, primær tekstfarge). Tidbasert dynamisk hilsen.
- **Start trening CTA:** Full bredde, 56px høy, border-radius 16px, aksentfarge bakgrunn. Tekst: "Start trening" (17px, semibold 600, hvit). Undertekst: "Logg øvelser og sett" (13px, hvit 70% opacity). Pil-ikon høyre side.
- **Seksjonstittel:** "SISTE TRENINGER" (13px, semibold 600, uppercase, letter-spacing 0.6px, sekundær tekstfarge)
- **Treningskort (×3):** Bakgrunn: surface-farge, border-radius 14px, padding 14-16px. Innhold per kort:
  - Treningsnavn (16px, semibold 600)
  - Dato · varighet · volum (14px, sekundær)
  - Øvelsesnavn kommaseparert (13px, tertiær, truncated)
  - Chevron-ikon høyre (16px, tertiær)
- **Ukessammendrag-kort:** Viser antall treninger og total volum denne uken med store tall (28px, bold 700).

### 2. Aktiv trening (Active Workout)
**Purpose:** Logge øvelser og sett i sanntid under en treningsøkt.

**Layout:**
- Vertikal stack, scrollbar
- Tilbakeknapp øverst, timer sentrert, øvelseskort, handlinger nederst
- Tab bar er SKJULT under aktiv trening

**Components:**
- **Header:** Tilbake-pil (chevron left, 22px) + "Aktiv trening" (17px, semibold 600)
- **Timer:** Sentrert, stor (54px, ultralight 200, tabular-nums), format MM:SS. Label "Varighet" under (13px, sekundær). Tikker hvert sekund.
- **Øvelseskort:** For hver øvelse:
  - Øvelsesnavn (16px, semibold 600) + MuscleTag (se Design Tokens)
  - Sett-tabell med grid: `gridTemplateColumns: '36px 1fr 1fr 40px'`
    - Header: SETT / KG / REPS (11px, semibold 600, uppercase, tertiær)
    - Rader: settnr (14px, semibold, sekundær) | vekt (17px, semibold) | reps (17px, semibold) | avkrysningssirkel
    - Fullført rad: subtil blå bakgrunn (4% opacity), fylt blå sirkel med hvit checkmark
    - Ufullført: transparent bakgrunn, tom sirkel med border (2px, tertiær)
  - "Legg til sett"-knapp (14px, semibold 500, aksentfarge, med pluss-ikon)
- **Legg til øvelse:** Dashed border (1.5px), sentrert tekst+ikon, border-radius 14px
- **Fullfør trening:** Full bredde, aksentfarge bakgrunn, border-radius 14px, padding 16px, "Fullfør trening" (17px, semibold 600, hvit)

**Interactions:**
- Trykk avkrysningssirkel → toggle sett-fullføring (animert, 0.15s)
- Trykk "Legg til sett" → ny tom rad
- Trykk "Legg til øvelse" → legger til neste øvelse fra biblioteket
- Trykk "Fullfør trening" → tilbake til Hjem

### 3. Historikk (History)
**Purpose:** Kronologisk oversikt over alle gjennomførte treningsøkter, gruppert etter uke.

**Layout:**
- Stor tittel "Historikk" (34px, bold 700)
- Seksjoner gruppert: "Denne uken", "Forrige uke", "For 2 uker siden"

**Components:**
- **Gruppetittel:** (13px, semibold 600, uppercase, letter-spacing 0.6px, sekundær)
- **Treningsrader** i grupperte kort (surface bg, border-radius 14px):
  - Treningsnavn (16px, semibold 600)
  - Datolabel · varighet · volum (14px, sekundær, med tabular-nums for tall)
  - Chevron høyre (16px, tertiær)
  - Separator mellom rader: 0.5px solid separator-farge

**Interactions:**
- Trykk rad → åpne SessionDetail med alle øvelser og sett

### 4. Treningsdetalj (Session Detail)
**Purpose:** Vise fullstendig oversikt over én gjennomført treningsøkt.

**Components:**
- BackHeader: "← Treningsnavn"
- Metadata: datolabel · varighet (14px, sekundær)
- Total volum: stort tall (28px, bold 700) + "kg totalt volum" (15px, sekundær)
- Øvelseskort per øvelse: navn + MuscleTag, deretter nummererte sett med "80 kg × 8 reps" format

### 5. Øvelser (Exercise Library)
**Purpose:** Søkbart bibliotek over alle øvelser med filtrering per muskelgruppe.

**Components:**
- Stor tittel "Øvelser" (34px, bold 700)
- **Søkefelt:** Surface bg, border-radius 12px, padding 10-14px, forstørrelsesglassikon, placeholder "Søk øvelser..."
- **Filterchips:** Horisontal scrollbar, gap 8px. Aktiv chip: aksentfarge bg + hvit tekst. Inaktiv: surface bg + sekundær tekst. Border-radius 20px, padding 7-14px, font 14px semibold 500.
  - Grupper: Alle, Bryst, Rygg, Ben, Skuldre, Armer, Mage
- **Øvelsesliste** i gruppert kort:
  - Øvelsesnavn (16px, medium 500)
  - MuscleTag + "PR: 100 × 5" (13px, sekundær, tabular-nums)
  - Chevron høyre
- **Legg til ny øvelse:** Dashed border-knapp

**Interactions:**
- Søk filtrerer i sanntid
- Chip-trykk filtrerer etter muskelgruppe
- "Alle" viser alt

### 6. Profil (Profile)
**Purpose:** Brukeroversikt med statistikk og innstillinger.

**Components:**
- Stor tittel "Profil" (34px, bold 700)
- **Avatar:** 80×80px sirkel, aksentBg bakgrunn, initialer "ME" (28px, bold 700, aksentfarge)
- **Navn:** "Magnus Eriksen" (20px, semibold 600), "Trener siden mars 2024" (14px, sekundær)
- **Statistikkort (×3):** Flex row, gap 10px, like bredde. Hvert kort:
  - Tall (24px, bold 700, tabular-nums)
  - Label (12px, sekundær)
  - Sublabel (11px, tertiær)
  - Stats: 8 treninger denne mnd | 30 045 kg total volum | 8 dager streak
- **Innstillingsliste:** Gruppert kort med rader:
  - Innstillinger, Enheter (med "Metrisk (kg)" detalj), Eksporter data, Om appen
  - Chevron høyre på alle

---

## Navigation

- **Tab bar** med 4 faner: Hjem, Historikk, Øvelser, Profil
  - Alltid synlig UNNTATT under aktiv trening og treningsdetalj
  - Ikonene: hus, klokke, manual, person (stroke-baserte, 22px)
  - Aktiv = aksentfarge, inaktiv = tertiær
  - Background: semi-transparent med backdrop-blur (20px)
  - Padding: 8px topp, 30px bunn (safe area)
  - Border-top: 0.5px separator

- **Tilbake-navigasjon:** Brukes i Aktiv trening og Treningsdetalj med chevron-left ikon

---

## Interactions & Behavior

| Handling | Resultat |
|----------|----------|
| Trykk "Start trening" | Åpne Aktiv trening, start timer |
| Trykk avkrysningssirkel | Toggle sett fullført (0.15s transition) |
| Trykk "Legg til sett" | Ny tom rad i øvelsen |
| Trykk "Legg til øvelse" | Legg til neste øvelse fra bibliotek |
| Trykk "Fullfør trening" | Tilbake til Hjem |
| Trykk treningskort (Hjem/Historikk) | Åpne Treningsdetalj |
| Trykk tilbake-pil | Tilbake til forrige skjerm |
| Søk i øvelsesfelt | Filtrer liste i sanntid |
| Trykk filterchip | Filtrer øvelser etter muskelgruppe |

---

## State Management

```
- currentTab: 'home' | 'history' | 'exercises' | 'profile'
- isWorkoutActive: boolean
- selectedSession: Session | null
- workoutState: { exercises: [{ name, muscle, sets: [{weight, reps, done}] }], startTime }
- exerciseSearch: string
- exerciseFilter: string (muskelgruppe)
```

---

## Design Tokens

### Colors — Light Mode
| Token | Verdi | Bruk |
|-------|-------|------|
| bg | `#F2F2F7` | Side-bakgrunn |
| surface | `#FFFFFF` | Kort, felt |
| text | `#1D1D1F` | Primærtekst |
| textSec | `rgba(60,60,67,0.6)` | Sekundærtekst |
| textTer | `rgba(60,60,67,0.3)` | Tertiærtekst, inaktive ikoner |
| sep | `rgba(60,60,67,0.12)` | Separatorlinjer |
| accent | `#2563EB` | CTA, aktive elementer |
| accentBg | `#EBF2FF` | Badge/tag bakgrunn |
| tabBg | `rgba(249,249,249,0.92)` | Tab bar bakgrunn |

### Colors — Dark Mode
| Token | Verdi | Bruk |
|-------|-------|------|
| bg | `#000000` | Side-bakgrunn |
| surface | `#1C1C1E` | Kort, felt |
| text | `#F5F5F7` | Primærtekst |
| textSec | `rgba(235,235,245,0.6)` | Sekundærtekst |
| textTer | `rgba(235,235,245,0.3)` | Tertiærtekst |
| sep | `rgba(84,84,88,0.34)` | Separatorlinjer |
| accent | `#3B82F6` | CTA, aktive elementer |
| accentBg | `#172554` | Badge/tag bakgrunn |
| tabBg | `rgba(30,30,30,0.92)` | Tab bar bakgrunn |

### Alternative aksentfarger
| Navn | Light | Dark | accentBg (light) | accentBg (dark) |
|------|-------|------|-------------------|-----------------|
| Blå | `#2563EB` | `#3B82F6` | `#EBF2FF` | `#172554` |
| Oransje | `#D97706` | `#FBBF24` | `#FFF7ED` | `#451A03` |
| Sjøgrønn | `#0D9488` | `#2DD4BF` | `#F0FDFA` | `#042F2E` |

### Typography
| Element | Size | Weight | Extras |
|---------|------|--------|--------|
| Stor tittel | 34px | 700 | letterSpacing: 0.3 |
| Seksjonstittel | 13px | 600 | uppercase, letterSpacing: 0.6 |
| Korttittel | 16px | 600 | — |
| Brødtekst | 16px | 400 | — |
| Sekundærtekst | 14px | 400 | — |
| Liten tekst | 13px | 400 | — |
| Etikett | 12px | 500 | — |
| Tab label | 10px | 500 | letterSpacing: 0.07 |
| Tall (stor) | 28px | 700 | tabular-nums |
| Timer | 54px | 200 | tabular-nums, letterSpacing: -1 |
| Font stack | `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif` |

### Spacing & Radii
| Token | Verdi |
|-------|-------|
| Screen padding | 20-24px horisontal |
| Kort padding | 14-16px |
| Kort radius | 14px |
| Chip radius | 20px |
| Knapp radius | 14-16px |
| Søkefelt radius | 12px |
| MuscleTag radius | 6px |
| Seksjon gap | 24-28px |
| Kort gap | 10-12px |
| Tab bar høyde | ~58px (8px top + 22px icon + 2px gap + 10px label + 16px bottom padding + 30px safe area) |

### Shadows (kun cardStyle: "shadow")
- Light: `0 1px 4px rgba(0,0,0,0.06)`
- Dark: `0 2px 16px rgba(0,0,0,0.4)`

---

## Assets
Alle ikoner er stroke-baserte SVG (1.8px stroke, round caps/joins, 24×24 viewBox):
- home (hus), clock (klokke), dumbbell (manual), person (bruker)
- search (forstørrelsesglass), plus, check, back (chevron-left), chevron (right), arrow (høyrepil), settings (tannhjul)

Ingen bilder eller eksterne assets kreves.

---

## Files
| Fil | Beskrivelse |
|-----|-------------|
| `Treningsapp.html` | Hoved-HTML med script-imports og tweaks |
| `app-core.jsx` | Tema, data, ikoner, delte komponenter |
| `screens-main.jsx` | Hjem + Aktiv trening skjermer |
| `screens-secondary.jsx` | Historikk, Øvelser, Profil skjermer |
| `app.jsx` | Hovedapp med routing og state |
| `ios-frame.jsx` | iOS-enhetsramme (kun for prototype) |
| `tweaks-panel.jsx` | Tweaks-panel (kun for prototype) |

**Merk:** `ios-frame.jsx` og `tweaks-panel.jsx` er kun for prototypen og skal ikke brukes i produksjon.
