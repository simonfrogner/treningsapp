import { seedIfEmpty, createWorkout, listWorkouts, deleteWorkout, getProfile, saveProfile } from './db.js';
import { APP_VERSION } from './version.js';
import { renderHome } from './screens/home.js';
import { renderHistory } from './screens/history.js';
import { renderExercises, openEditExerciseModal } from './screens/exercises.js';
import { renderExerciseDetail } from './screens/exercise-detail.js';
import { renderProfile } from './screens/profile.js';
import { renderActive } from './screens/active.js';
import { renderDetail } from './screens/detail.js';

const root = document.getElementById('screen-root');
const tabbar = document.getElementById('tabbar');

let currentTab = 'home';
let overlay = null; // { kind: 'active'|'detail', workoutId }

async function render() {
  for (const btn of tabbar.querySelectorAll('.tab')) {
    btn.classList.toggle('is-active', btn.dataset.tab === currentTab);
  }

  let screen;
  if (overlay) {
    document.body.classList.add('has-overlay');
    if (overlay.kind === 'active') {
      screen = await renderActive({ workoutId: overlay.workoutId, onClose: closeOverlay });
    } else if (overlay.kind === 'detail') {
      screen = await renderDetail({ workoutId: overlay.workoutId, onClose: closeOverlay });
    } else if (overlay.kind === 'exercise-detail') {
      screen = await renderExerciseDetail({
        exercise: overlay.exercise,
        onClose: closeOverlay,
        onEdit: async (ex) => {
          const changed = await openEditExerciseModal(ex);
          if (changed) {
            // Hvis øvelsen ble slettet, lukk overlay
            closeOverlay();
          } else {
            render();
          }
        },
      });
    }
  } else {
    document.body.classList.remove('has-overlay');
    switch (currentTab) {
      case 'home':
        screen = await renderHome({
          onStartWorkout: startWorkout,
          onOpenWorkout: openDetail,
          onSeeAll: () => setTab('history'),
        });
        break;
      case 'history':
        screen = await renderHistory({ onOpenWorkout: openDetail });
        break;
      case 'exercises':
        screen = await renderExercises({ onOpenExercise: openExerciseDetail });
        break;
      case 'profile':
        screen = await renderProfile({ onProfileChanged: render });
        break;
    }
  }

  root.innerHTML = screen.html;
  screen.bind(root);
  root.scrollTop = 0;
}

async function startWorkout() {
  const all = await listWorkouts();
  for (const stale of all.filter(w => w.endedAt == null)) {
    await deleteWorkout(stale.id);
  }
  const w = await createWorkout({ name: workoutNameForToday() });
  overlay = { kind: 'active', workoutId: w.id };
  render();
}

function workoutNameForToday() {
  const MND = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
  const d = new Date();
  return `Trening ${d.getDate()}. ${MND[d.getMonth()]}`;
}

function openDetail(id) {
  overlay = { kind: 'detail', workoutId: id };
  render();
}

function openExerciseDetail(exercise) {
  overlay = { kind: 'exercise-detail', exercise };
  render();
}

function closeOverlay() {
  overlay = null;
  render();
}

function setTab(tab) {
  currentTab = tab;
  overlay = null;
  render();
}

tabbar.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab');
  if (btn) setTab(btn.dataset.tab);
});

(async function init() {
  await seedIfEmpty();
  await ensureProfileName();
  setTab('home');

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`);

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner();
            }
          });
        });

        // Sjekk for oppdateringer hver gang appen får fokus
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update();
        });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      } catch (err) {
        console.warn('Service worker registration failed:', err);
      }
    });
  }
})();

async function ensureProfileName() {
  const profile = await getProfile();
  if (profile.name && profile.name.trim()) return;
  await new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal">
        <h2 class="modal__title">Velkommen!</h2>
        <p class="t-secondary" style="margin:0;">Hva heter du? Dette brukes til å hilse på deg når du åpner appen.</p>
        <label class="field">
          <span class="field__label">Navn</span>
          <input class="field__input" id="welcome-name" type="text" placeholder="Ditt navn" autocomplete="given-name">
        </label>
        <button class="modal__btn modal__btn--primary" data-action="save">Kom i gang</button>
      </div>
    `;
    document.body.appendChild(wrap);
    const input = wrap.querySelector('#welcome-name');
    setTimeout(() => input.focus(), 50);

    async function submit() {
      const name = input.value.trim();
      if (!name) {
        input.focus();
        return;
      }
      await saveProfile({ name, startedTrainingAt: null });
      wrap.remove();
      resolve();
    }

    wrap.querySelector('[data-action="save"]').addEventListener('click', submit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') submit();
    });
  });
}

function showUpdateBanner() {
  if (document.getElementById('update-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.className = 'update-banner';
  banner.innerHTML = `
    <span>Ny versjon tilgjengelig</span>
    <button class="update-banner__btn">Oppdater</button>
  `;
  banner.querySelector('button').addEventListener('click', async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  });
  document.body.appendChild(banner);
}
