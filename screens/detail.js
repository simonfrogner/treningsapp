import { getWorkout, workoutDurationSec, workoutTotalVolume } from '../db.js';
import { formatWeekday, formatDuration, escapeHTML } from '../utils.js';

export async function renderDetail({ workoutId, onClose }) {
  const w = await getWorkout(workoutId);
  if (!w) return { html: '<p>Fant ikke trening</p>', bind: () => {} };

  const html = `
    <header class="overlay-header">
      <button class="icon-btn" id="back-btn" aria-label="Tilbake">
        <svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>
      </button>
      <div class="overlay-title">${escapeHTML(w.name)}</div>
      <div style="width:40px;"></div>
    </header>

    <div class="t-secondary" style="margin-top:8px;">${formatWeekday(w.startedAt)}</div>
    <div class="t-secondary">${formatDuration(workoutDurationSec(w))}</div>

    <div class="volume-line">
      <span class="t-big-number">${Math.round(workoutTotalVolume(w))}</span>
      <span class="t-secondary" style="font-size:15px;">kg totalt volum</span>
    </div>

    <div class="stack" style="margin-top:24px;">
      ${w.exercises.map(exerciseCard).join('')}
    </div>
  `;

  return {
    html,
    bind(rootEl) {
      rootEl.querySelector('#back-btn').addEventListener('click', onClose);
    }
  };
}

function exerciseCard(ex) {
  return `
    <div class="card">
      <div class="exercise-log__head">
        <span class="t-card-title">${escapeHTML(ex.exerciseName)}</span>
        <span class="muscle-tag">${escapeHTML(ex.muscleGroup)}</span>
      </div>
      <div class="detail-sets">
        ${ex.sets.map(s => `
          <div class="detail-set tnum">
            <span class="detail-set__num">${s.setNumber}.</span>
            <span>${s.weight} kg × ${s.reps} reps</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
