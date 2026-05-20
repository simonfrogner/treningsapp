import {
  listExercises, addExerciseToWorkout, addSet, updateSet, finishWorkout, getWorkout,
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
        </div>
        <div class="set-table">
          <div class="set-table__head">
            <span>SETT</span>
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
        <span class="set-row__num">${s.setNumber}</span>
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
    }
  }

  return {
    html: html(),
    bind(rootEl) {
      rootEl.querySelector('#back-btn').addEventListener('click', () => {
        clearInterval(tickHandle);
        onClose();
      });

      rootEl.querySelector('#add-exercise-btn').addEventListener('click', async () => {
        const usedNames = new Set(workout.exercises.map(e => e.exerciseName));
        const next = library.find(ex => !usedNames.has(ex.name));
        if (!next) return;
        const we = await addExerciseToWorkout(workoutId, {
          exerciseName: next.name,
          muscleGroup: next.muscleGroup,
          order: workout.exercises.length,
        });
        await addSet(we.id, { setNumber: 1 });
        await refresh();
      });

      rootEl.querySelector('#finish-btn').addEventListener('click', async () => {
        clearInterval(tickHandle);
        await finishWorkout(workoutId);
        onClose();
      });

      rebind();

      tickHandle = setInterval(() => {
        const t = document.getElementById('timer');
        if (t) t.textContent = formatTimer(elapsedSec());
      }, 1000);
    }
  };
}
