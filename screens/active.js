import {
  listExercises, addExerciseToWorkout, addSet, updateSet, deleteSet,
  deleteWorkoutExercise, finishWorkout, getWorkout, deleteWorkout,
  updateWorkoutNotes,
} from '../db.js';
import { formatTimer, escapeHTML } from '../utils.js';

export async function renderActive({ workoutId, onClose }) {
  let workout = await getWorkout(workoutId);
  const library = await listExercises();
  library.sort((a, b) => a.name.localeCompare(b.name, 'nb'));
  let tickHandle = null;

  function html() {
    return `
      <header class="overlay-header">
        <button class="icon-btn" id="back-btn" aria-label="Tilbake">
          <svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <div class="overlay-title">Aktiv trening</div>
        <div style="width:40px;"></div>
      </header>

      <section class="timer-section">
        <div class="timer" id="timer">${formatTimer(elapsedSec())}</div>
        <div class="t-small">Varighet</div>
      </section>

      <div class="stack" id="exercises">
        ${workout.exercises.map(exerciseCard).join('')}
      </div>

      <button class="dashed-btn" id="add-exercise-btn">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        <span>Legg til øvelse</span>
      </button>

      <button class="dashed-btn" id="notes-btn">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
        <span>${workout.notes ? 'Rediger notater' : 'Legg til notater'}</span>
      </button>

      <button class="primary-btn" id="finish-btn">Fullfør trening</button>
    `;
  }

  function elapsedSec() {
    return Math.max(0, Math.floor((Date.now() - workout.startedAt) / 1000));
  }

  function exerciseCard(ex) {
    return `
      <div class="card exercise-log" data-ex-id="${escapeHTML(ex.id)}">
        <div class="exercise-log__head">
          <span class="t-card-title">${escapeHTML(ex.exerciseName)}</span>
          <span class="muscle-tag">${escapeHTML(ex.muscleGroup)}</span>
          <button class="exercise-log__remove" data-action="remove-exercise" data-ex-id="${escapeHTML(ex.id)}" aria-label="Fjern øvelse">
            <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
          </button>
        </div>
        <div class="set-table">
          <div class="set-table__head">
            <span></span>
            <span>KG</span>
            <span>REPS</span>
            <span></span>
          </div>
          ${ex.sets.map(setRow).join('')}
        </div>
        <button class="link-btn add-set-btn" data-ex-id="${escapeHTML(ex.id)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          Legg til sett
        </button>
      </div>
    `;
  }

  function setRow(s) {
    return `
      <div class="set-row ${s.isCompleted ? 'is-done' : ''}" data-set-id="${escapeHTML(s.id)}">
        <button class="set-row__delete" data-action="delete-set" aria-label="Slett sett">
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6l-12 12"/></svg>
        </button>
        <input class="set-row__input" type="number" inputmode="decimal" data-field="weight" value="${s.weight || ''}" placeholder="0">
        <input class="set-row__input" type="number" inputmode="numeric" data-field="reps" value="${s.reps || ''}" placeholder="0">
        <button class="check-circle ${s.isCompleted ? 'is-done' : ''}" data-action="toggle" aria-label="Marker sett som fullført">
          ${s.isCompleted ? '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-11"/></svg>' : ''}
        </button>
      </div>
    `;
  }

  async function refresh() {
    workout = await getWorkout(workoutId);
    const el = document.getElementById('exercises');
    if (el) el.innerHTML = workout.exercises.map(exerciseCard).join('');
    rebind();
  }

  function rebind() {
    for (const btn of document.querySelectorAll('.add-set-btn')) {
      btn.onclick = async () => {
        const exId = btn.dataset.exId;
        const ex = workout.exercises.find(e => e.id === exId);
        const last = ex.sets[ex.sets.length - 1];
        await addSet(exId, {
          setNumber: (last?.setNumber ?? 0) + 1,
          weight: last?.weight ?? 0,
          reps: last?.reps ?? 0,
        });
        await refresh();
      };
    }
    for (const btn of document.querySelectorAll('[data-action="remove-exercise"]')) {
      btn.onclick = async (e) => {
        e.stopPropagation();
        if (!confirm('Fjerne denne øvelsen fra økten?')) return;
        await deleteWorkoutExercise(btn.dataset.exId);
        await refresh();
      };
    }
    for (const row of document.querySelectorAll('.set-row')) {
      const setId = row.dataset.setId;
      for (const input of row.querySelectorAll('input')) {
        input.onchange = async () => {
          const field = input.dataset.field;
          const value = parseFloat(input.value) || 0;
          await updateSet(setId, { [field]: value });
        };
      }
      const check = row.querySelector('[data-action="toggle"]');
      check.onclick = async () => {
        const ex = workout.exercises.find(e => e.sets.some(s => s.id === setId));
        const s = ex.sets.find(x => x.id === setId);
        const w = parseFloat(row.querySelector('[data-field="weight"]').value) || 0;
        const r = parseInt(row.querySelector('[data-field="reps"]').value) || 0;
        await updateSet(setId, { isCompleted: !s.isCompleted, weight: w, reps: r });
        await refresh();
      };
      const delBtn = row.querySelector('[data-action="delete-set"]');
      delBtn.onclick = async () => {
        await deleteSet(setId);
        await refresh();
      };
    }
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

  function openExitDialog() {
    return new Promise(resolve => {
      const wrap = document.createElement('div');
      wrap.className = 'modal-backdrop';
      wrap.innerHTML = `
        <div class="modal">
          <h2 class="modal__title">Avslutt trening?</h2>
          <p class="t-secondary" style="margin:0;">Hva vil du gjøre med denne økten?</p>
          <button class="modal__btn modal__btn--primary" data-action="continue">Fortsett trening</button>
          <button class="modal__delete" data-action="discard">Forkast trening</button>
        </div>
      `;
      document.body.appendChild(wrap);

      function close(v) { wrap.remove(); resolve(v); }

      wrap.addEventListener('click', e => { if (e.target === wrap) close('cancel'); });
      wrap.querySelector('[data-action="continue"]').addEventListener('click', () => close('cancel'));
      wrap.querySelector('[data-action="discard"]').addEventListener('click', () => {
        if (!confirm('Forkaste hele økten? Dette kan ikke angres.')) return;
        close('discard');
      });
    });
  }

  function openExercisePicker(allExercises) {
    return new Promise(resolve => {
      const sorted = [...allExercises].sort((a, b) => a.name.localeCompare(b.name, 'nb'));
      const wrap = document.createElement('div');
      wrap.className = 'modal-backdrop';
      wrap.innerHTML = `
        <div class="modal modal--tall">
          <div class="modal__head">
            <h2 class="modal__title" style="margin:0;">Velg øvelse</h2>
            <button class="modal__close" data-action="cancel" aria-label="Lukk">
              <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6l-12 12"/></svg>
            </button>
          </div>
          <input class="field__input picker-search" id="picker-search" type="search" placeholder="Søk..." autocomplete="off">
          <div class="picker-list" id="picker-list">
            ${sorted.length === 0
              ? `<p class="t-secondary" style="text-align:center; padding:24px 0;">Alle øvelser er allerede med</p>`
              : sorted.map(ex => `
                <button class="picker-row" data-ex-id="${escapeHTML(ex.id)}">
                  <span>${escapeHTML(ex.name)}</span>
                  <span class="muscle-tag">${escapeHTML(ex.muscleGroup)}</span>
                </button>
              `).join('')
            }
          </div>
        </div>
      `;
      document.body.appendChild(wrap);

      function close(result) { wrap.remove(); resolve(result); }

      wrap.querySelector('[data-action="cancel"]').addEventListener('click', () => close(null));
      wrap.addEventListener('click', e => { if (e.target === wrap) close(null); });

      const search = wrap.querySelector('#picker-search');
      search.addEventListener('input', () => {
        const q = search.value.toLowerCase();
        for (const row of wrap.querySelectorAll('.picker-row')) {
          const name = row.querySelector('span').textContent.toLowerCase();
          row.style.display = !q || name.includes(q) ? '' : 'none';
        }
      });

      for (const row of wrap.querySelectorAll('.picker-row')) {
        row.addEventListener('click', () => {
          const ex = allExercises.find(e => e.id === row.dataset.exId);
          close(ex);
        });
      }
    });
  }

  return {
    html: html(),
    bind(rootEl) {
      rootEl.querySelector('#back-btn').addEventListener('click', async () => {
        const choice = await openExitDialog();
        if (choice === 'cancel') return;
        clearInterval(tickHandle);
        if (choice === 'discard') {
          await deleteWorkout(workoutId);
        }
        onClose();
      });

      rootEl.querySelector('#add-exercise-btn').addEventListener('click', async () => {
        const usedNames = new Set(workout.exercises.map(e => e.exerciseName));
        const available = library.filter(ex => !usedNames.has(ex.name));
        const picked = await openExercisePicker(available);
        if (!picked) return;
        const we = await addExerciseToWorkout(workoutId, {
          exerciseName: picked.name,
          muscleGroup: picked.muscleGroup,
          order: workout.exercises.length,
        });
        await addSet(we.id, { setNumber: 1 });
        await refresh();
      });

      rootEl.querySelector('#finish-btn').addEventListener('click', async () => {
        if (workout.exercises.length === 0) {
          alert('Legg til minst én øvelse før du fullfører.');
          return;
        }
        clearInterval(tickHandle);
        await finishWorkout(workoutId);
        onClose();
      });

      rootEl.querySelector('#notes-btn').addEventListener('click', async () => {
        const updated = await openNotesModal(workout.notes || '');
        if (updated !== null) {
          await updateWorkoutNotes(workoutId, updated);
          await refresh();
        }
      });

      rebind();

      tickHandle = setInterval(() => {
        const t = document.getElementById('timer');
        if (t) t.textContent = formatTimer(elapsedSec());
      }, 1000);
    }
  };
}
