import { seedIfEmpty, createWorkout, listWorkouts, deleteWorkout } from './db.js';
import { renderHome } from './screens/home.js';
import { renderHistory } from './screens/history.js';
import { renderExercises } from './screens/exercises.js';
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
    } else {
      screen = await renderDetail({ workoutId: overlay.workoutId, onClose: closeOverlay });
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
        screen = await renderExercises();
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
  setTab('home');

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('./sw.js');

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
