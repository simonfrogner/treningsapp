// Vises i appen via versjonsnummeret i Profil.
// Hold synkronisert med CHANGELOG.md ved nye versjoner.
// Bare de 3 siste vises i appen.

export const CHANGELOG = [
  {
    version: '1.7.1',
    date: '2026-05-20',
    sections: [
      {
        title: 'Fikset',
        items: ['Innhold scroller ikke lenger bak status-bar på iPhone'],
      },
    ],
  },
  {
    version: '1.7.0',
    date: '2026-05-20',
    sections: [
      {
        title: 'Lagt til',
        items: [
          'Trykk versjonsnummeret for å se endringslogg',
          '"Sjekk for oppdateringer"-rad i Profil',
        ],
      },
      {
        title: 'Endret',
        items: [
          'Nye versjoner aktiveres umiddelbart i bakgrunnen',
          'Service worker oppdateres alltid ved ny versjon',
        ],
      },
    ],
  },
  {
    version: '1.6.0',
    date: '2026-05-20',
    sections: [
      {
        title: 'Lagt til',
        items: [
          'Detalj-skjerm for hver øvelse med statistikk',
          'Graf over maks-vekt per økt',
          'PR-badge på rekord-sett',
          'Pille-bakgrunn på aktiv tab',
        ],
      },
      {
        title: 'Endret',
        items: [
          'Tydeligere input-felter for vekt og reps',
          'Tall markeres automatisk ved fokus',
        ],
      },
    ],
  },
];
