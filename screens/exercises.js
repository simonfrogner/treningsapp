import {
  listExercises, addExercise, updateExercise, deleteExercise,
  countWorkoutsUsingExerciseName, MUSCLE_GROUPS,
} from '../db.js';
import { escapeHTML } from '../utils.js';

let state = { search: '', filter: null };

export async function renderExercises({ onOpenExercise } = {}) {
  const all = await listExercises();
  all.sort((a, b) => a.name.localeCompare(b.name, 'nb'));

  const filtered = all.filter(ex => {
    const matchSearch = !state.search || ex.name.toLowerCase().includes(state.search.toLowerCase());
    const matchFilter = !state.filter || ex.muscleGroup === state.filter;
    return matchSearch && matchFilter;
  });

  const html = `
    <h1 class="t-large-title" style="margin-top:8px;">Øvelser</h1>

    <div class="search-field" style="margin-top:20px;">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      <input type="search" id="ex-search" placeholder="Søk øvelser..." value="${escapeHTML(state.search)}" autocomplete="off">
    </div>

    <div class="chips" style="margin-top:14px;">
      <button class="chip ${state.filter === null ? 'is-active' : ''}" data-filter="">Alle</button>
      ${MUSCLE_GROUPS.map(g => `
        <button class="chip ${state.filter === g ? 'is-active' : ''}" data-filter="${escapeHTML(g)}">${escapeHTML(g)}</button>
      `).join('')}
    </div>

    <button class="dashed-btn" id="add-ex-btn" style="margin-top:20px;">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
      <span>Legg til ny øvelse</span>
    </button>

    <section class="section">
      ${filtered.length === 0
        ? `<div class="card"><p class="t-secondary" style="margin:0;">${all.length === 0 ? 'Ingen øvelser ennå' : 'Ingen treff'}</p></div>`
        : `<div class="card card--flush">${filtered.map(exerciseRow).join('')}</div>`
      }
    </section>
  `;

  return {
    html,
    bind(rootEl) {
      const input = rootEl.querySelector('#ex-search');
      input.addEventListener('input', async () => {
        state.search = input.value;
        await rerender(rootEl, true);
      });
      for (const chip of rootEl.querySelectorAll('.chip')) {
        chip.addEventListener('click', async () => {
          state.filter = chip.dataset.filter || null;
          await rerender(rootEl);
        });
      }
      for (const row of rootEl.querySelectorAll('.exercise-row[data-ex-id]')) {
        const ex = all.find(e => e.id === row.dataset.exId);
        row.addEventListener('click', () => onOpenExercise?.(ex));
      }
      rootEl.querySelector('#add-ex-btn').addEventListener('click', async () => {
        const created = await openAddExerciseModal();
        if (created) await rerender(rootEl);
      });
    }
  };
}

async function rerender(rootEl, keepSearchFocus = false) {
  const updated = await renderExercises();
  rootEl.innerHTML = updated.html;
  updated.bind(rootEl);
  if (keepSearchFocus) {
    const fresh = rootEl.querySelector('#ex-search');
    fresh.focus();
    fresh.setSelectionRange(fresh.value.length, fresh.value.length);
  }
}

function exerciseRow(ex) {
  const pr = (ex.prWeight != null && ex.prReps != null)
    ? `PR: ${ex.prWeight} × ${ex.prReps}` : null;
  return `
    <button class="list-row exercise-row" data-ex-id="${escapeHTML(ex.id)}">
      <div class="exercise-row__body">
        <div class="exercise-row__name">${escapeHTML(ex.name)}</div>
        <div class="exercise-row__meta">
          <span class="muscle-tag">${escapeHTML(ex.muscleGroup)}</span>
          ${pr ? `<span class="t-small tnum">${escapeHTML(pr)}</span>` : ''}
        </div>
      </div>
      <span class="chevron"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span>
    </button>
  `;
}

function openAddExerciseModal() {
  return new Promise(resolve => {
    const wrap = buildModal({
      title: 'Ny øvelse',
      name: '',
      muscle: MUSCLE_GROUPS[0],
      withDelete: false,
    });
    document.body.appendChild(wrap);
    const nameInput = wrap.querySelector('#ex-name');
    nameInput.focus();

    wrap.querySelector('[data-action="cancel"]').addEventListener('click', () => close(null));
    wrap.addEventListener('click', e => { if (e.target === wrap) close(null); });
    wrap.querySelector('[data-action="save"]').addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const muscleGroup = wrap.querySelector('#ex-muscle').value;
      if (!name) { nameInput.focus(); return; }
      const created = await addExercise({ name, muscleGroup });
      close(created);
    });

    function close(result) { wrap.remove(); resolve(result); }
  });
}

export function openEditExerciseModal(ex) {
  return new Promise(resolve => {
    const wrap = buildModal({
      title: 'Rediger øvelse',
      name: ex.name,
      muscle: ex.muscleGroup,
      withDelete: true,
    });
    document.body.appendChild(wrap);
    const nameInput = wrap.querySelector('#ex-name');

    wrap.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));
    wrap.addEventListener('click', e => { if (e.target === wrap) close(false); });
    wrap.querySelector('[data-action="save"]').addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const muscleGroup = wrap.querySelector('#ex-muscle').value;
      if (!name) { nameInput.focus(); return; }
      await updateExercise(ex.id, { name, muscleGroup });
      close(true);
    });
    wrap.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      const count = await countWorkoutsUsingExerciseName(ex.name);
      const msg = count > 0
        ? `Denne øvelsen er brukt i ${count} ${count === 1 ? 'tidligere trening' : 'tidligere treninger'}. Tidligere treninger beholdes uansett. Slette øvelsen fra biblioteket?`
        : 'Slette denne øvelsen?';
      if (!confirm(msg)) return;
      await deleteExercise(ex.id);
      close(true);
    });

    function close(changed) { wrap.remove(); resolve(changed); }
  });
}

function buildModal({ title, name, muscle, withDelete }) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `
    <div class="modal">
      <h2 class="modal__title">${escapeHTML(title)}</h2>
      <label class="field">
        <span class="field__label">Navn</span>
        <input class="field__input" id="ex-name" type="text" value="${escapeHTML(name)}" placeholder="F.eks. Hip thrust" autocomplete="off">
      </label>
      <label class="field">
        <span class="field__label">Muskelgruppe</span>
        <select class="field__input" id="ex-muscle">
          ${MUSCLE_GROUPS.map(g => `<option value="${escapeHTML(g)}" ${g === muscle ? 'selected' : ''}>${escapeHTML(g)}</option>`).join('')}
        </select>
      </label>
      ${withDelete ? `<button class="modal__delete" data-action="delete">Slett øvelse</button>` : ''}
      <div class="modal__actions">
        <button class="modal__btn modal__btn--ghost" data-action="cancel">Avbryt</button>
        <button class="modal__btn modal__btn--primary" data-action="save">Lagre</button>
      </div>
    </div>
  `;
  return wrap;
}
