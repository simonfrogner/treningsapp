# Treningsapp

En minimalistisk web-app (PWA) for å logge styrketrening. Bygget med ren HTML/CSS/JavaScript og IndexedDB for lokal lagring. Designet er inspirert av Apple Fitness og Linear — rent, typografi-drevet og rolig.

## Funksjoner

- **Hjem** — tidsbasert hilsen, start-knapp, siste treninger og ukessammendrag
- **Aktiv trening** — timer, logging av sett (vekt × reps), fullføring per sett
- **Historikk** — alle gjennomførte økter gruppert per uke
- **Treningsdetalj** — fullstendig oversikt over én økt
- **Øvelser** — søkbart bibliotek med filtrering per muskelgruppe
- **Profil** — statistikk (treninger denne måneden, total volum, streak)
- **PWA** — fungerer offline og kan installeres på hjemskjerm

## Teknologi

- **HTML/CSS/JS** uten rammeverk eller byggesteg
- **IndexedDB** for lokal datalagring (data ligger i nettleseren)
- **Service Worker** for offline-støtte
- **GitHub Pages** for hosting

## Komme i gang

### Lokal utvikling

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Åpne `http://localhost:8000` i en nettleser. På iPhone på samme WiFi: bytt ut `localhost` med Macens IP-adresse.

### Installer som app

På iPhone: åpne i Safari → del-knappen → **Legg til på Hjem-skjerm**.
Da fungerer den som en vanlig app uten Safari-UI rundt.

## Prosjektstruktur

```
.
├── index.html        # Skjelett, tab-bar
├── style.css         # Design tokens + komponentstiler
├── app.js            # Ruting mellom skjermer
├── db.js             # Datalag (IndexedDB) — isolert API
├── utils.js          # Felleshjelpere
├── sw.js             # Service worker (offline)
├── manifest.json     # PWA-manifest
├── icons/            # App-ikoner
└── screens/
    ├── home.js
    ├── history.js
    ├── exercises.js
    ├── profile.js
    ├── active.js     # Aktiv trening
    └── detail.js     # Treningsdetalj
```

## Datamodell

Lagres lokalt i nettleserens IndexedDB:

- **exercises** — øvelse i biblioteket (navn, muskelgruppe, PR)
- **workouts** — én treningsøkt (start, slutt)
- **workout_exercises** — øvelser i en økt
- **workout_sets** — enkeltsett (vekt, reps, fullført)

Data ligger på brukerens enhet og synkroniseres ikke mellom enheter.

## Design

Designspesifikasjonen ligger i [`design_handoff_treningsapp/`](design_handoff_treningsapp/). Den inneholder HTML-prototyper og en detaljert README med design tokens (farger, typografi, spacing, ikoner).
