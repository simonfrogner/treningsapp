import { listWorkouts, workoutDurationSec, getProfile } from '../db.js';
import { greeting, formatDuration, escapeHTML } from '../utils.js';

export async function renderHome({ onStartWorkout, onOpenWorkout, onSeeAll }) {
  const all = await listWorkouts();
  const profile = await getProfile();
  const firstName = (profile.name || '').split(/\s+/)[0];
  const completed = all.filter(w => w.endedAt != null);
  const recent = completed.slice(0, 3);

  const html = `
    <header class="hero">
      ${firstName
        ? `<p class="hero__greeting">${greeting()}</p><h1 class="hero__name">${escapeHTML(firstName)}</h1>`
        : `<h1 class="hero__name">${greeting().replace(',', '!')}</h1>`
      }
    </header>

    <button class="start-cta" id="start-cta">
      <div class="start-cta__text">
        <span class="start-cta__title">Start trening</span>
        <span class="start-cta__sub">Logg øvelser og sett</span>
      </div>
      <svg class="start-cta__arrow" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6"/>
      </svg>
    </button>

    <section class="section">
      <div class="section__head">
        <h2 class="t-section-title">Siste treninger</h2>
        ${completed.length > 3 ? `<button class="link-btn link-btn--inline" id="see-all-btn">Se alle</button>` : ''}
      </div>
      ${recent.length === 0
        ? `<div class="card"><p class="t-secondary" style="margin:0;">Ingen treninger ennå</p></div>`
        : `<div class="stack">${recent.map(workoutCard).join('')}</div>`
      }
    </section>

  `;

  return {
    html,
    bind(rootEl) {
      rootEl.querySelector('#start-cta').addEventListener('click', () => onStartWorkout());
      for (const el of rootEl.querySelectorAll('[data-workout-id]')) {
        el.addEventListener('click', () => onOpenWorkout(el.dataset.workoutId));
      }
      rootEl.querySelector('#see-all-btn')?.addEventListener('click', () => onSeeAll?.());
    }
  };
}

function workoutCard(w) {
  const exercises = (w.exercises || [])
    .map(e => e.exerciseName)
    .join(', ');
  return `
    <button class="card workout-card" data-workout-id="${escapeHTML(w.id)}">
      <div class="workout-card__body">
        <div class="t-card-title">${escapeHTML(w.name)}</div>
        <div class="t-secondary">${formatDuration(workoutDurationSec(w))}</div>
        ${exercises ? `<div class="t-small workout-card__exercises">${escapeHTML(exercises)}</div>` : ''}
      </div>
      <span class="chevron">
        <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>
      </span>
    </button>
  `;
}
