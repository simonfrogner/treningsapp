import { listWorkouts, buildPRMap } from '../db.js';
import { formatWeekday, escapeHTML } from '../utils.js';

export async function renderExerciseDetail({ exercise, onClose, onEdit }) {
  const all = await listWorkouts();
  const completed = all.filter(w => w.endedAt != null);
  const prMap = await buildPRMap();

  // Samle alle sett for denne øvelsen, sortert nyeste først
  const usages = [];
  for (const w of completed) {
    for (const we of w.exercises) {
      if (we.exerciseName !== exercise.name) continue;
      const completedSets = we.sets.filter(s => s.isCompleted);
      if (completedSets.length === 0) continue;
      usages.push({
        date: w.startedAt,
        workoutName: w.name,
        workoutId: w.id,
        sets: completedSets.sort((a, b) => a.setNumber - b.setNumber),
      });
    }
  }
  usages.sort((a, b) => b.date - a.date);

  // Stats
  const totalTimes = usages.length;
  const lastDate = usages[0]?.date;
  let bestSet = null;
  for (const u of usages) {
    for (const s of u.sets) {
      if (!bestSet || s.weight > bestSet.weight || (s.weight === bestSet.weight && s.reps > bestSet.reps)) {
        bestSet = { ...s, date: u.date };
      }
    }
  }

  const html = `
    <header class="overlay-header">
      <button class="icon-btn" id="back-btn" aria-label="Tilbake">
        <svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>
      </button>
      <div class="overlay-title">${escapeHTML(exercise.name)}</div>
      <button class="icon-btn" id="edit-btn" aria-label="Rediger">
        <svg viewBox="0 0 24 24"><path d="M4 20h4l11-11-4-4L4 16v4z"/></svg>
      </button>
    </header>

    <div style="margin-top:8px;">
      <span class="muscle-tag">${escapeHTML(exercise.muscleGroup)}</span>
    </div>

    ${totalTimes === 0
      ? `<div class="card" style="margin-top:24px;">
          <p class="t-secondary" style="margin:0;">Du har ikke logget denne øvelsen ennå.</p>
        </div>`
      : `
        <section class="section stats-row">
          <div class="card stat-card">
            <div class="stat-card__value tnum">${bestSet.weight} × ${bestSet.reps}</div>
            <div class="stat-card__label">beste sett</div>
            <div class="stat-card__sub">${formatDateShort(bestSet.date)}</div>
          </div>
          <div class="card stat-card">
            <div class="stat-card__value tnum">${totalTimes}</div>
            <div class="stat-card__label">${totalTimes === 1 ? 'gang' : 'ganger'}</div>
            <div class="stat-card__sub">${lastDate ? `sist ${formatDateShort(lastDate)}` : ''}</div>
          </div>
        </section>

        ${totalTimes >= 2 ? renderChart(usages) : ''}

        <section class="section">
          <h2 class="t-section-title">Historikk</h2>
          <div class="stack">
            ${usages.map(u => `
              <div class="card">
                <div class="t-secondary" style="margin-bottom:8px;">${escapeHTML(formatWeekday(u.date))}</div>
                <div class="detail-sets" style="margin-top:0;">
                  ${u.sets.map(s => `
                    <div class="detail-set tnum">
                      <span class="detail-set__num">${s.setNumber}.</span>
                      <span class="detail-set__value">${s.weight} kg × ${s.reps} reps</span>
                      ${prMap.has(s.id) ? '<span class="pr-badge">PR</span>' : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      `
    }
  `;

  return {
    html,
    bind(rootEl) {
      rootEl.querySelector('#back-btn').addEventListener('click', onClose);
      rootEl.querySelector('#edit-btn').addEventListener('click', () => onEdit(exercise));
      bindChart(rootEl);
    }
  };
}

function bindChart(rootEl) {
  const tooltip = rootEl.querySelector('#chart-tooltip');
  const card = rootEl.querySelector('.chart-card');
  if (!tooltip || !card) return;

  const hits = rootEl.querySelectorAll('.chart-dot-hit');
  let activeIdx = null;

  function show(hit) {
    const i = hit.dataset.i;
    if (activeIdx === i) { hide(); return; }
    activeIdx = i;
    const date = parseInt(hit.dataset.date);
    const weight = parseFloat(hit.dataset.weight);
    tooltip.textContent = `${formatDateShort(date)} · ${weight} kg`;
    tooltip.hidden = false;

    // Plasser tooltip over punktet
    const svg = rootEl.querySelector('.chart');
    const svgRect = svg.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const cx = parseFloat(hit.getAttribute('cx'));
    const cy = parseFloat(hit.getAttribute('cy'));
    const vb = svg.viewBox.baseVal;
    const xRatio = svgRect.width / vb.width;
    const yRatio = svgRect.height / vb.height;
    const px = (svgRect.left - cardRect.left) + cx * xRatio;
    const py = (svgRect.top - cardRect.top) + cy * yRatio;
    tooltip.style.left = `${px}px`;
    tooltip.style.top = `${py - 8}px`;

    for (const dot of rootEl.querySelectorAll('.chart-dot')) {
      dot.classList.toggle('chart-dot--active', dot.dataset.i === i);
    }
  }

  function hide() {
    activeIdx = null;
    tooltip.hidden = true;
    for (const dot of rootEl.querySelectorAll('.chart-dot')) {
      dot.classList.remove('chart-dot--active');
    }
  }

  for (const hit of hits) {
    hit.addEventListener('click', (e) => {
      e.stopPropagation();
      show(hit);
    });
  }

  document.addEventListener('click', hide, { once: true, capture: false });
}

function renderChart(usages) {
  // Bygg punkter: maks-vekt per økt, eldste først
  const points = usages
    .slice()
    .reverse()
    .map(u => ({
      date: u.date,
      maxWeight: Math.max(...u.sets.map(s => s.weight)),
    }));

  const W = 320;
  const H = 160;
  const padL = 36, padR = 12, padT = 16, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxY = Math.max(...points.map(p => p.maxWeight));
  const minY = Math.min(...points.map(p => p.maxWeight));
  const rangeY = maxY - minY || maxY * 0.2 || 1;
  const yMax = maxY + rangeY * 0.15;
  const yMin = Math.max(0, minY - rangeY * 0.15);

  const xFor = i => padL + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const yFor = v => padT + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;

  // Smooth path via Catmull-Rom → cubic Bezier
  let path = '';
  if (points.length === 1) {
    path = `M ${xFor(0)} ${yFor(points[0].maxWeight)}`;
  } else {
    path = `M ${xFor(0).toFixed(1)} ${yFor(points[0].maxWeight).toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const x1 = xFor(i), y1 = yFor(p1.maxWeight);
      const x2 = xFor(i + 1), y2 = yFor(p2.maxWeight);
      const cp1x = x1 + (xFor(i + 1) - xFor(i - 1 < 0 ? 0 : i - 1)) / 6;
      const cp1y = y1 + (yFor(p2.maxWeight) - yFor(p0.maxWeight)) / 6;
      const cp2x = x2 - (xFor(i + 2 > points.length - 1 ? points.length - 1 : i + 2) - xFor(i)) / 6;
      const cp2y = y2 - (yFor(p3.maxWeight) - yFor(p1.maxWeight)) / 6;
      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }
  }

  // Område-fyll under linja
  const areaPath = `${path} L ${xFor(points.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${xFor(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;

  // PR-punkt: høyeste maxWeight
  const prIndex = points.reduce((best, p, i) => p.maxWeight > points[best].maxWeight ? i : best, 0);

  // Y-akse mellomverdier (4 referanselinjer)
  const yTicks = 4;
  const ticks = [];
  for (let i = 0; i <= yTicks; i++) {
    const v = yMin + (i / yTicks) * (yMax - yMin);
    ticks.push({ y: yFor(v), value: v });
  }

  const dots = points.map((p, i) => {
    const isPR = i === prIndex;
    const cx = xFor(i).toFixed(1);
    const cy = yFor(p.maxWeight).toFixed(1);
    return `
      <circle cx="${cx}" cy="${cy}" r="${isPR ? 5 : 3}" class="chart-dot ${isPR ? 'chart-dot--pr' : ''}" data-i="${i}"/>
      <circle cx="${cx}" cy="${cy}" r="14" class="chart-dot-hit" data-i="${i}" data-date="${p.date}" data-weight="${p.maxWeight}"/>
    `;
  }).join('');

  const gridLines = ticks.map(t => `
    <line x1="${padL}" y1="${t.y.toFixed(1)}" x2="${W - padR}" y2="${t.y.toFixed(1)}" class="chart-grid"/>
  `).join('');

  const yLabels = ticks.map(t => `
    <text x="${padL - 6}" y="${(t.y + 3).toFixed(1)}" class="chart-label" text-anchor="end">${t.value.toFixed(0)}</text>
  `).join('');

  const firstDate = formatDateShort(points[0].date);
  const lastDate = formatDateShort(points[points.length - 1].date);

  return `
    <section class="section">
      <h2 class="t-section-title">Fremgang (maks vekt per økt)</h2>
      <div class="card chart-card">
        <div class="chart-tooltip" id="chart-tooltip" hidden></div>
        <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Fremgang">
          <defs>
            <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          ${gridLines}
          ${yLabels}
          <path d="${areaPath}" class="chart-area"/>
          <path d="${path}" class="chart-line" fill="none"/>
          ${dots}
          <text x="${padL}" y="${(H - 8).toFixed(1)}" class="chart-label">${firstDate}</text>
          <text x="${W - padR}" y="${(H - 8).toFixed(1)}" class="chart-label" text-anchor="end">${lastDate}</text>
        </svg>
      </div>
    </section>
  `;
}

function formatDateShort(ts) {
  const MND = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
  const d = new Date(ts);
  return `${d.getDate()}. ${MND[d.getMonth()]}`;
}
