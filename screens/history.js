import { listWorkouts, workoutDurationSec, workoutTotalVolume } from '../db.js';
import { formatWeekday, formatDuration, startOfWeek, escapeHTML } from '../utils.js';

export async function renderHistory({ onOpenWorkout }) {
  const all = await listWorkouts();
  const completed = all.filter(w => w.endedAt != null);

  const week = 7 * 24 * 60 * 60 * 1000;
  const thisWeekStart = startOfWeek();
  const lastWeekStart = thisWeekStart - week;
  const twoWeeksAgoStart = thisWeekStart - 2 * week;

  const buckets = [
    { label: 'Denne uken', items: [] },
    { label: 'Forrige uke', items: [] },
    { label: 'For 2 uker siden', items: [] },
    { label: 'Tidligere', items: [] },
  ];

  for (const w of completed) {
    if (w.startedAt >= thisWeekStart) buckets[0].items.push(w);
    else if (w.startedAt >= lastWeekStart) buckets[1].items.push(w);
    else if (w.startedAt >= twoWeeksAgoStart) buckets[2].items.push(w);
    else buckets[3].items.push(w);
  }
  const groups = buckets.filter(b => b.items.length > 0);

  const html = `
    <h1 class="t-large-title" style="margin-top:8px;">Historikk</h1>
    ${groups.length === 0
      ? `<div class="card" style="margin-top:24px;"><p class="t-secondary" style="margin:0;">Ingen treninger ennå</p></div>`
      : groups.map(group).join('')
    }
  `;

  return {
    html,
    bind(rootEl) {
      for (const el of rootEl.querySelectorAll('[data-workout-id]')) {
        el.addEventListener('click', () => onOpenWorkout(el.dataset.workoutId));
      }
    }
  };
}

function group(g) {
  return `
    <section class="section">
      <h2 class="t-section-title">${escapeHTML(g.label)}</h2>
      <div class="card card--flush">
        ${g.items.map(row).join('')}
      </div>
    </section>
  `;
}

function row(w) {
  return `
    <button class="list-row history-row" data-workout-id="${escapeHTML(w.id)}">
      <div class="history-row__body">
        <div class="t-card-title">${escapeHTML(w.name)}</div>
        <div class="t-secondary tnum">${formatWeekday(w.startedAt)} · ${formatDuration(workoutDurationSec(w))} · ${Math.round(workoutTotalVolume(w))} kg</div>
      </div>
      <span class="chevron"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span>
    </button>
  `;
}
