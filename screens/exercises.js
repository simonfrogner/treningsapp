import { listExercises, MUSCLE_GROUPS } from '../db.js';
import { escapeHTML } from '../utils.js';

let state = { search: '', filter: null };

export async function renderExercises() {
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
        const updated = await renderExercises();
        rootEl.innerHTML = updated.html;
        updated.bind(rootEl);
        const fresh = rootEl.querySelector('#ex-search');
        fresh.focus();
        fresh.setSelectionRange(fresh.value.length, fresh.value.length);
      });
      for (const chip of rootEl.querySelectorAll('.chip')) {
        chip.addEventListener('click', async () => {
          state.filter = chip.dataset.filter || null;
          const updated = await renderExercises();
          rootEl.innerHTML = updated.html;
          updated.bind(rootEl);
        });
      }
    }
  };
}

function exerciseRow(ex) {
  const pr = (ex.prWeight != null && ex.prReps != null)
    ? `PR: ${ex.prWeight} × ${ex.prReps}` : null;
  return `
    <div class="list-row exercise-row">
      <div class="exercise-row__body">
        <div class="exercise-row__name">${escapeHTML(ex.name)}</div>
        <div class="exercise-row__meta">
          <span class="muscle-tag">${escapeHTML(ex.muscleGroup)}</span>
          ${pr ? `<span class="t-small tnum">${escapeHTML(pr)}</span>` : ''}
        </div>
      </div>
      <span class="chevron"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span>
    </div>
  `;
}
