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
  const sections = [
    {
      title: 'Kom i gang',
      items: [
        { strong: 'Legg til navn', text: 'Trykk på avataren øverst for å skrive inn navnet ditt' },
        { strong: 'Start trening', text: 'Trykk «Start trening» på Hjem for å begynne en ny økt' },
      ],
    },
    {
      title: 'Logg en økt',
      items: [
        { strong: 'Legg til øvelse', text: 'Velg fra biblioteket eller bruk søkefeltet' },
        { strong: 'Fyll inn sett', text: 'Skriv vekt og reps, trykk sirkelen for å fullføre' },
        { strong: 'Legg til flere sett', text: 'Trykk «Legg til sett» under hver øvelse' },
        { strong: 'Slett et sett', text: 'Trykk X-en til venstre for sett-raden' },
        { strong: 'Notater', text: 'Skriv ned hvordan økten kjentes — kan endres senere' },
      ],
    },
    {
      title: 'Avslutt',
      items: [
        { strong: 'Fullfør', text: 'Tomme sett ryddes automatisk' },
        { strong: 'Forkast', text: 'Trykk tilbake-pilen og velg «Forkast trening»' },
      ],
    },
    {
      title: 'Øvelser og historikk',
      items: [
        { strong: 'Tilpass biblioteket', text: 'Legg til, endre eller slett øvelser i Øvelser-fanen' },
        { strong: 'Se historikk', text: 'Alle gjennomførte økter ligger i Historikk gruppert per uke' },
        { strong: 'Rediger økt', text: 'Trykk blyant-ikonet i en treningsdetalj for å endre navn eller dato' },
      ],
    },
    {
      title: 'Smart å vite',
      items: [
        { strong: 'Backup', text: 'Eksporter data som JSON jevnlig — den lagres bare på din enhet' },
        { strong: 'Installer på iPhone', text: 'I Safari: del-knappen → «Legg til på Hjem-skjerm»' },
      ],
    },
  ];

  function row(item) {
    return `
      <div class="guide-row">
        <div class="guide-text">
          <strong>${item.strong}</strong>
          <span>${item.text}</span>
        </div>
      </div>
    `;
  }

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
        ${sections.map(sec => `
          <div class="guide-section-title">${sec.title}</div>
          <div class="guide-grid">
            ${sec.items.map(row).join('')}
          </div>
        `).join('')}
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
