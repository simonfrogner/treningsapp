import {
  listWorkouts,
  getProfile, saveProfile,
  exportAll, importAll, clearAll,
} from '../db.js';
import { startOfMonth, startOfWeek, startOfDay, escapeHTML } from '../utils.js';
import { APP_VERSION } from '../version.js';

export async function renderProfile({ onProfileChanged } = {}) {
  const profile = await getProfile();
  const all = await listWorkouts();
  const completed = all.filter(w => w.endedAt != null);

  const totalCount = completed.length;
  const weekStart = startOfWeek();
  const thisWeek = completed.filter(w => w.startedAt >= weekStart).length;
  const monthStart = startOfMonth();
  const thisMonth = completed.filter(w => w.startedAt >= monthStart).length;

  const day = 24 * 60 * 60 * 1000;
  const days = new Set(completed.map(w => startOfDay(new Date(w.startedAt))));
  const today = startOfDay();
  let streak = 0;
  let cursor = today;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= day;
  }
  let daysSinceLast = null;
  if (streak === 0 && completed.length > 0) {
    const lastTrainingDay = Math.max(...completed.map(w => startOfDay(new Date(w.startedAt))));
    daysSinceLast = Math.round((today - lastTrainingDay) / day);
  }

  const initials = initialsFor(profile.name);
  const displayName = profile.name || 'Legg til navn';

  const html = `
    <h1 class="t-large-title" style="margin-top:8px;">Profil</h1>

    <button class="section profile-header profile-header--button" data-action="edit-header">
      <div class="avatar">${escapeHTML(initials)}</div>
      <div class="profile-meta">
        <div class="profile-name">${escapeHTML(displayName)}</div>
      </div>
    </button>

    <section class="section stats-row">
      ${statCard(totalCount, 'treninger', 'totalt')}
      ${statCard(thisWeek, 'treninger', 'denne uken')}
      ${statCard(thisMonth, 'treninger', 'denne mnd')}
      ${streak > 0
        ? statCard(streak, streak === 1 ? 'dag' : 'dager', 'streak')
        : daysSinceLast != null
          ? statCard(daysSinceLast, daysSinceLast === 1 ? 'dag' : 'dager', 'siden sist')
          : statCard('—', '', 'streak')
      }
    </section>

    <section class="section">
      <div class="card card--flush">
        <button class="list-row settings-row" data-action="guide">
          <span class="settings-row__label">Brukerveiledning</span>
          <span class="chevron"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span>
        </button>
        <button class="list-row settings-row" data-action="share">
          <span class="settings-row__label">Del appen</span>
          <span class="chevron"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span>
        </button>
        <button class="list-row settings-row" data-action="export">
          <span class="settings-row__label">Eksporter data</span>
          <span class="chevron"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span>
        </button>
        <button class="list-row settings-row" data-action="import">
          <span class="settings-row__label">Importer data</span>
          <span class="chevron"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span>
        </button>
        <button class="list-row settings-row settings-row--danger" data-action="clear">
          <span class="settings-row__label">Slett alle data</span>
          <span class="chevron"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span>
        </button>
      </div>
    </section>

    <input type="file" id="import-input" accept="application/json" style="display:none;">

    <p class="version-line">v${APP_VERSION}</p>
  `;

  return {
    html,
    bind(rootEl) {
      rootEl.querySelector('[data-action="edit-header"]').addEventListener('click', async () => {
        await openEditProfileModal(profile);
        onProfileChanged?.();
      });

      rootEl.querySelector('[data-action="guide"]').addEventListener('click', () => {
        openGuideModal();
      });

      rootEl.querySelector('[data-action="share"]').addEventListener('click', async () => {
        const shareData = {
          title: 'Treningsapp',
          text: 'Logg styrketrening enkelt og uten innlogging',
          url: 'https://simonfrogner.github.io/treningsapp/',
        };
        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (e) {
            if (e.name !== 'AbortError') console.warn('Deling feilet:', e);
          }
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareData.url);
          alert('Lenke kopiert til utklippstavlen.');
        } else {
          prompt('Kopier lenken:', shareData.url);
        }
      });

      rootEl.querySelector('[data-action="export"]').addEventListener('click', async () => {
        const payload = await exportAll();
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const stamp = new Date().toISOString().slice(0, 10);
        const a = document.createElement('a');
        a.href = url;
        a.download = `treningsapp-${stamp}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });

      const importInput = rootEl.querySelector('#import-input');
      rootEl.querySelector('[data-action="import"]').addEventListener('click', () => {
        importInput.click();
      });
      importInput.addEventListener('change', async () => {
        const file = importInput.files?.[0];
        if (!file) return;
        if (!confirm('Importer fra fil og overskriv eksisterende data?')) {
          importInput.value = '';
          return;
        }
        try {
          const text = await file.text();
          const payload = JSON.parse(text);
          await importAll(payload, { replace: true });
          alert('Import fullført.');
          onProfileChanged?.();
        } catch (e) {
          alert('Kunne ikke lese filen: ' + e.message);
        } finally {
          importInput.value = '';
        }
      });

      rootEl.querySelector('[data-action="clear"]').addEventListener('click', async () => {
        if (!confirm('Slette ALLE data (profil, øvelser og treninger)? Dette kan ikke angres.')) return;
        if (!confirm('Er du helt sikker?')) return;
        await clearAll();
        alert('Alt slettet.');
        onProfileChanged?.();
      });
    }
  };
}

function statCard(value, label, sublabel) {
  return `
    <div class="card stat-card">
      <div class="stat-card__value tnum">${value}</div>
      <div class="stat-card__label">${label}</div>
      <div class="stat-card__sub">${sublabel}</div>
    </div>
  `;
}

function initialsFor(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function openGuideModal() {
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `
    <div class="modal modal--tall">
      <div class="modal__head">
        <h2 class="modal__title" style="margin:0;">Brukerveiledning</h2>
        <button class="modal__close" data-action="close" aria-label="Lukk">
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6l-12 12"/></svg>
        </button>
      </div>
      <div class="guide-body">
        <h3>Kom i gang</h3>
        <p>Legg til navnet ditt ved å trykke på avataren øverst i Profil. Deretter er du klar til å starte din første økt.</p>

        <h3>Start en trening</h3>
        <p>Trykk <strong>Start trening</strong> på Hjem-skjermen. Timeren starter automatisk. Trykk <strong>Legg til øvelse</strong> og velg fra biblioteket.</p>

        <h3>Logg sett</h3>
        <p>Fyll inn vekt og reps for hvert sett, og trykk på sirkelen til høyre for å markere settet som fullført. Trykk <strong>Legg til sett</strong> for å legge til flere. X-en til venstre fjerner et sett.</p>

        <h3>Fullfør eller forkast</h3>
        <p>Trykk <strong>Fullfør trening</strong> når du er ferdig. Hvis du vil avbryte underveis, trykk tilbake-pilen og velg <strong>Forkast trening</strong>. Tomme sett ryddes automatisk.</p>

        <h3>Notater</h3>
        <p>Trykk <strong>Legg til notater</strong> for å skrive ned hvordan økten kjentes, form-observasjoner eller påminnelser. Notater kan også redigeres senere fra treningsdetaljene.</p>

        <h3>Tilpass øvelsesbiblioteket</h3>
        <p>I Øvelser-fanen kan du legge til, endre navn eller slette øvelser. Tidligere treninger beholder de gamle navnene selv om du endrer dem i biblioteket.</p>

        <h3>Historikk og redigering</h3>
        <p>Alle gjennomførte økter ligger i Historikk-fanen, gruppert per uke. Trykk på en økt for å se detaljer. Blyant-ikonet øverst lar deg endre navn, dato eller slette økten.</p>

        <h3>Sikkerhetskopi</h3>
        <p>Treningsdata lagres lokalt på enheten din. Bruk <strong>Eksporter data</strong> jevnlig for å lagre en backup som JSON-fil. <strong>Importer data</strong> gjenoppretter fra en tidligere eksport.</p>

        <h3>Installer som app</h3>
        <p>På iPhone: åpne appen i Safari, trykk del-knappen og velg <strong>Legg til på Hjem-skjerm</strong>. Da kjører appen som en vanlig app uten Safari-grensesnitt rundt.</p>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  function close() { wrap.remove(); }
  wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
  wrap.querySelector('[data-action="close"]').addEventListener('click', close);
}

function openEditProfileModal(profile) {
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal">
        <h2 class="modal__title">Rediger profil</h2>
        <label class="field">
          <span class="field__label">Navn</span>
          <input class="field__input" id="profile-name" type="text" value="${escapeHTML(profile.name || '')}" placeholder="Ditt navn">
        </label>
        <div class="modal__actions">
          <button class="modal__btn modal__btn--ghost" data-action="cancel">Avbryt</button>
          <button class="modal__btn modal__btn--primary" data-action="save">Lagre</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    function close() {
      wrap.remove();
      resolve();
    }

    wrap.querySelector('[data-action="cancel"]').addEventListener('click', close);
    wrap.addEventListener('click', e => {
      if (e.target === wrap) close();
    });
    wrap.querySelector('[data-action="save"]').addEventListener('click', async () => {
      const name = wrap.querySelector('#profile-name').value.trim();
      await saveProfile({ name, startedTrainingAt: profile.startedTrainingAt });
      close();
    });
  });
}
