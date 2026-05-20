import { listWorkouts, workoutTotalVolume } from '../db.js';
import { startOfMonth, startOfDay } from '../utils.js';

export async function renderProfile() {
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

  const html = `
    <h1 class="t-large-title" style="margin-top:8px;">Profil</h1>

    <section class="section profile-header">
      <div class="avatar">ME</div>
      <div class="profile-meta">
        <div class="profile-name">Magnus Eriksen</div>
        <div class="t-secondary">Trener siden mars 2024</div>
      </div>
    </section>

    <section class="section stats-row">
      ${statCard(thisMonth, 'treninger', 'denne mnd')}
      ${statCard(totalVolume, 'kg', 'total volum')}
      ${statCard(streak, 'dager', 'streak')}
    </section>

    <section class="section">
      <div class="card card--flush">
        ${settingsRow('Innstillinger')}
        ${settingsRow('Enheter', 'Metrisk (kg)')}
        ${settingsRow('Eksporter data')}
        ${settingsRow('Om appen')}
      </div>
    </section>
  `;

  return { html, bind() {} };
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

function settingsRow(label, detail = null) {
  return `
    <div class="list-row settings-row">
      <span class="settings-row__label">${label}</span>
      ${detail ? `<span class="t-secondary">${detail}</span>` : ''}
      <span class="chevron"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span>
    </div>
  `;
}
