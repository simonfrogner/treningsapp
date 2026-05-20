import {
  listWorkouts, workoutTotalVolume,
  getProfile, saveProfile,
  exportAll, importAll, clearAll,
} from '../db.js';
import { startOfMonth, startOfDay, escapeHTML } from '../utils.js';
import { APP_VERSION } from '../version.js';

const MND = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];

export async function renderProfile({ onProfileChanged } = {}) {
  const profile = await getProfile();
  const all = await listWorkouts();
  const completed = all.filter(w => w.endedAt != null);

  const monthStart = startOfMonth();
  const thisMonth = completed.filter(w => w.startedAt >= monthStart).length;
  const totalVolume = Math.round(completed.reduce((s, w) => s + workoutTotalVolume(w), 0));

  const day = 24 * 60 * 60 * 1000;
  const days = new Set(completed.map(w => startOfDay(new Date(w.startedAt))));
  let streak = 0;
  let cursor = startOfDay();
  while (days.has(cursor)) {
    streak += 1;
    cursor -= day;
  }

  const initials = initialsFor(profile.name);
  const displayName = profile.name || 'Legg til navn';
  const trainerSince = formatTrainerSince(profile.startedTrainingAt);

  const html = `
    <h1 class="t-large-title" style="margin-top:8px;">Profil</h1>

    <section class="section profile-header">
      <div class="avatar">${escapeHTML(initials)}</div>
      <div class="profile-meta">
        <div class="profile-name">${escapeHTML(displayName)}</div>
        <div class="t-secondary">${escapeHTML(trainerSince)}</div>
      </div>
    </section>

    <section class="section stats-row">
      ${statCard(thisMonth, 'treninger', 'denne mnd')}
      ${statCard(totalVolume, 'kg', 'total volum')}
      ${statCard(streak, 'dager', 'streak')}
    </section>

    <section class="section">
      <div class="card card--flush">
        <button class="list-row settings-row" data-action="edit">
          <span class="settings-row__label">Rediger profil</span>
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
      rootEl.querySelector('[data-action="edit"]').addEventListener('click', async () => {
        await openEditProfileModal(profile);
        onProfileChanged?.();
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

function formatTrainerSince(ts) {
  if (!ts) return 'Sett startdato i profilen';
  const d = new Date(ts);
  return `Trener siden ${MND[d.getMonth()]} ${d.getFullYear()}`;
}

function openEditProfileModal(profile) {
  return new Promise(resolve => {
    const startedAt = profile.startedTrainingAt
      ? new Date(profile.startedTrainingAt).toISOString().slice(0, 10)
      : '';

    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal">
        <h2 class="modal__title">Rediger profil</h2>
        <label class="field">
          <span class="field__label">Navn</span>
          <input class="field__input" id="profile-name" type="text" value="${escapeHTML(profile.name || '')}" placeholder="Ditt navn">
        </label>
        <label class="field">
          <span class="field__label">Trener siden</span>
          <input class="field__input" id="profile-date" type="date" value="${escapeHTML(startedAt)}">
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
      const dateStr = wrap.querySelector('#profile-date').value;
      const startedTrainingAt = dateStr ? new Date(dateStr + 'T00:00:00').getTime() : null;
      await saveProfile({ name, startedTrainingAt });
      close();
    });
  });
}
