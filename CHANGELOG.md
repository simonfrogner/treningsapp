# Changelog

Format basert på [Keep a Changelog](https://keepachangelog.com/).
Versjonering følger [SemVer](https://semver.org/).

## [1.6.0] – 2026-05-20

### Lagt til
- Detalj-skjerm for hver øvelse (trykk en øvelse i Øvelser-fanen).
- Statistikk per øvelse: beste sett, antall ganger gjort, sist gjort.
- Linjegraf over maks-vekt per økt med smooth-kurve, område-fyll og PR-markering.
- Tap på et grafpunkt viser dato og vekt i en tooltip.
- "PR"-badge i historikk og øvelses-detalj for sett som matcher rekorden.
- Pille-bakgrunn rundt aktiv fane i tab-baren.

### Endret
- Inputene for vekt og reps har nå lett bakgrunn for å vise at de er klikkbare.
- Tall i input markeres automatisk ved fokus, så det er lett å endre.

## [1.5.0] – 2026-05-20

### Lagt til
- Velkomstmodal ved første oppstart som krever at brukeren skriver inn navn.

### Endret
- Brukerveiledning uten ikoner — bare titler og tekst.

## [1.4.0] – 2026-05-20

### Lagt til
- Notater vises inline med en liten rediger-pen i treningsdetalj når de finnes.

### Endret
- Brukerveiledningen omgjort til seksjoner med ikoner og korte rader (samme stil som handleliste-appen).
- "Legg til ny øvelse" flyttet til toppen av Øvelser-listen.

## [1.3.0] – 2026-05-20

### Lagt til
- Banner som varsler om ny versjon og lar deg oppdatere med ett trykk.
- Automatisk sjekk etter oppdateringer hver gang appen får fokus.

## [1.2.0] – 2026-05-20

### Lagt til
- Brukerveiledning som modal i Profil-fanen.
- "Del appen": bruker native del-meny på iPhone, kopierer lenke på desktop.

## [1.1.0] – 2026-05-20

### Lagt til
- Notater per treningsøkt (knapp som åpner modal i aktiv trening og treningsdetalj).
- Picker for å velge øvelse når man legger til midt i en økt (med søk, filtrerer bort allerede valgte øvelser).
- "Se alle"-lenke på Hjem som tar deg til Historikk når du har 4+ treninger.
- Profil-statistikk utvidet: totalt antall, denne uken, denne måneden, streak.
- "Dager siden sist"-fallback hvis streak er 0.

### Endret
- Profil-header (avatar + navn) er nå klikkbar og åpner redigeringsmodalen direkte.
- Tilbake-pil under aktiv trening gir valg om "Fortsett" eller "Forkast".
- Tomme sett ryddes automatisk når en trening fullføres.
- Hilsen tilpasses automatisk om navn er satt eller ikke.
- "Total volum" fjernet fra alle skjermer for renere UI.
- Uferdige treninger ryddes stille når en ny økt startes.

### Fjernet
- "Trener siden"-felt i profilen.
- Ukessammendrag på Hjem (vises nå i Profil-statistikken).

### Fikset
- Separator-linjer i lister sto for langt inne.
- Forhindrer fullføring av tom trening (uten øvelser).
- Zoom på dobbeltrykk på iPhone er skrudd av.

## [1.0.0] – 2026-05-20

### Lagt til
- Hjem-skjerm med tidsbasert hilsen, start-knapp, siste treninger og ukessammendrag.
- Aktiv trening med timer, logging av sett (vekt × reps), avkrysning per sett.
- Mulighet til å legge til og fjerne øvelser midt i en aktiv økt.
- Slett enkeltsett under aktiv trening.
- Historikk gruppert per uke.
- Treningsdetalj med oversikt over alle sett.
- Rediger navn og dato på en treningsøkt, eller slett hele økten.
- Slett enkeltsett fra en gjennomført trening.
- Øvelsesbibliotek med søk og filtrering per muskelgruppe.
- Legg til, rediger og slett egne øvelser (med advarsel hvis øvelsen er brukt før).
- Profil med statistikk (treninger denne måneden, total volum, streak).
- Rediger profil (navn + startdato for trening).
- Eksporter og importer all data som JSON.
- Slett alle data med dobbel bekreftelse.
- Automatisk navn på nye treninger ("Trening 20. mai").
- Lokal lagring i nettleseren via IndexedDB.
- PWA: installerbar på hjemskjerm, fungerer offline, mørk og lys modus.
