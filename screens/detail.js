import {
  getWorkout, workoutDurationSec,
  updateWorkout, updateWorkoutNotes, deleteWorkout, deleteSet,
} from '../db.js';
import { formatWeekday, formatDuration, escapeHTML } from '../utils.js';

export async function renderDetail({ workoutId, onClose }) {
  let w = await getWorkout(workoutId);
  if (!w) return { html: '<p>Fant ikke trening</p>', bind: () => {} };

  function html() {
    return `
      <header class="overlay-header">
        <button class="icon-btn" id="back-btn" aria-label="Tilbake">
          <svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <div class="overlay-title">${escapeHTML(w.name)}</div>
        <button class="icon-btn" id="edit-btn" aria-label="Rediger">
          <svg viewBox="0 0 24 24"><path d="M4 20h4l11-11-4-4L4 16v4z"/></svg>
        </button>
      </header>

      <div class="t-secondary" style="margin-top:8px;">${formatWeekday(w.startedAt)}</div>
      <div class="t-secondary">${formatDuration(workoutDurationSec(w))}</div>

      <div class="stack" style="margin-top:24px;">
        ${w.exercises.map(exerciseCard).join('')}
      </div>

      <button class="dashed-btn" id="notes-btn" style="margin-top:var(--card-gap);">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
        <span>${w.notes ? 'Rediger notater' : 'Legg til notater'}</span>
      </button>
    `;
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
            <div class="detail-set tnum" data-set-id="${escapeHTML(s.id)}">
              <span class="detail-set__num">${s.setNumber}.</span>
              <span class="detail-set__value">${s.weight} kg × ${s.reps} reps</span>
              <button class="detail-set__delete" data-action="delete-set" aria-label="Slett sett">
                <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6l-12 12"/></svg>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  async function refresh(rootEl) {
    w = await getWorkout(workoutId);
    if (!w) { onClose(); return; }
    rootEl.innerHTML = html();
    bind(rootEl);
  }

  function bind(rootEl) {
    rootEl.querySelector('#back-btn').addEventListener('click', onClose);
    rootEl.querySelector('#edit-btn').addEventListener('click', async () => {
      const action = await openEditWorkoutModal(w);
      if (action === 'saved') {
        await refresh(rootEl);
      } else if (action === 'deleted') {
        onClose();
      }
    });
    rootEl.querySelector('#notes-btn').addEventListener('click', async () => {
      const updated = await openNotesModal(w.notes || '');
      if (updated !== null) {
        await updateWorkoutNotes(workoutId, updated);
        await refresh(rootEl);
      }
    });

    for (const btn of rootEl.querySelectorAll('[data-action="delete-set"]')) {
      btn.addEventListener('click', async () => {
        const row = btn.closest('[data-set-id]');
        if (!confirm('Slette dette settet?')) return;
        await deleteSet(row.dataset.setId);
        await refresh(rootEl);
      });
    }
  }

  return { html: html(), bind };
}

function openNotesModal(initial) {
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal">
        <div class="modal__head">
          <h2 class="modal__title" style="margin:0;">Notater</h2>
          <button class="modal__close" data-action="cancel" aria-label="Lukk">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6l-12 12"/></svg>
          </button>
        </div>
        <textarea class="notes-textarea" id="notes-input" rows="5" placeholder="Hvordan kjentes økten?">${escapeHTML(initial)}</textarea>
        <button class="modal__btn modal__btn--primary" data-action="save">Lagre</button>
      </div>
    `;
    document.body.appendChild(wrap);
    const ta = wrap.querySelector('#notes-input');
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);

    function close(v) { wrap.remove(); resolve(v); }
    wrap.addEventListener('click', e => { if (e.target === wrap) close(null); });
    wrap.querySelector('[data-action="cancel"]').addEventListener('click', () => close(null));
    wrap.querySelector('[data-action="save"]').addEventListener('click', () => close(ta.value));
  });
}

function openEditWorkoutModal(workout) {
  return new Promise(resolve => {
    const dateStr = new Date(workout.startedAt).toISOString().slice(0, 10);

    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal">
        <h2 class="modal__title">Rediger trening</h2>
        <label class="field">
          <span class="field__label">Navn</span>
          <input class="field__input" id="w-name" type="text" value="${escapeHTML(workout.name)}" autocomplete="off">
        </label>
        <label class="field">
          <span class="field__label">Dato</span>
          <input class="field__input" id="w-date" type="date" value="${escapeHTML(dateStr)}">
        </label>
        <button class="modal__delete" data-action="delete">Slett trening</button>
        <div class="modal__actions">
          <button class="modal__btn modal__btn--ghost" data-action="cancel">Avbryt</button>
          <button class="modal__btn modal__btn--primary" data-action="save">Lagre</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    function close(result) { wrap.remove(); resolve(result); }

    wrap.querySelector('[data-action="cancel"]').addEventListener('click', () => close(null));
    wrap.addEventListener('click', e => { if (e.target === wrap) close(null); });
    wrap.querySelector('[data-action="save"]').addEventListener('click', async () => {
      const name = wrap.querySelector('#w-name').value.trim() || workout.name;
      const dateStr = wrap.querySelector('#w-date').value;
      const newStart = dateStr ? newStartFromDate(workout.startedAt, dateStr) : workout.startedAt;
      await updateWorkout(workout.id, { name, startedAt: newStart });
      close('saved');
    });
    wrap.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (!confirm('Slette hele treningsøkten? Dette kan ikke angres.')) return;
      await deleteWorkout(workout.id);
      close('deleted');
    });
  });
}

function newStartFromDate(originalTs, dateStr) {
  const original = new Date(originalTs);
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(original);
  next.setFullYear(y, m - 1, d);
  return next.getTime();
}
