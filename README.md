# Treningsapp

En minimalistisk iOS-app for å logge styrketrening. Bygget i SwiftUI med SwiftData for lokal lagring. Designet er inspirert av Apple Fitness og Linear — rent, typografi-drevet og rolig.

## Funksjoner

- **Hjem** — tidsbasert hilsen, start-knapp, siste treninger og ukessammendrag
- **Aktiv trening** — timer, logging av sett (vekt × reps), fullføring per sett
- **Historikk** — alle gjennomførte økter gruppert per uke
- **Treningsdetalj** — fullstendig oversikt over én økt
- **Øvelser** — søkbart bibliotek med filtrering per muskelgruppe
- **Profil** — statistikk (treninger denne måneden, total volum, streak)

## Teknologi

- **SwiftUI** for UI
- **SwiftData** for lokal persistering
- **Minimum iOS:** 17
- **Xcode:** 26+

## Komme i gang

1. Klon repoet
2. Åpne `Treningsapp/Treningsapp.xcodeproj` i Xcode
3. Velg en iPhone-simulator
4. Trykk **⌘R** for å bygge og kjøre

Ved første kjøring fylles appen med et eksempelbibliotek (15 øvelser) og noen tidligere treninger, slik at skjermene har innhold å vise.

## Prosjektstruktur

```
Treningsapp/Treningsapp/
├── TreningsappApp.swift      # App entry point, ModelContainer
├── RootView.swift            # Tab-navigasjon
├── Theme.swift               # Farger, typografi, spacing
├── Components.swift          # MuscleTag, Card, SectionHeader, Chevron
├── Models.swift              # SwiftData-modeller
├── SampleData.swift          # Seed for første kjøring
├── HomeView.swift            # Hjem
├── HistoryView.swift         # Historikk
├── ExercisesView.swift       # Øvelser
├── ProfileView.swift         # Profil
├── ActiveWorkoutView.swift   # Aktiv trening
└── SessionDetailView.swift   # Treningsdetalj
```

## Datamodell

- **Exercise** — øvelse i biblioteket (navn, muskelgruppe, PR)
- **Workout** — én treningsøkt (start, slutt, øvelser)
- **WorkoutExercise** — øvelse innenfor en økt
- **WorkoutSet** — ett enkelt sett (vekt, reps, fullført)

## Design

Designspesifikasjonen ligger i [`design_handoff_treningsapp/`](design_handoff_treningsapp/). Den inneholder HTML-prototyper og en detaljert README med design tokens (farger, typografi, spacing, ikoner).
