// Felles hjelpefunksjoner for visning og formattering.

const MND = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
const UKEDAG = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

export function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'God morgen,';
  if (h >= 10 && h < 17) return 'God ettermiddag,';
  if (h >= 17 && h < 23) return 'God kveld,';
  return 'God natt,';
}

export function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getDate()}. ${MND[d.getMonth()]}`;
}

export function formatWeekday(ts) {
  const d = new Date(ts);
  return `${UKEDAG[d.getDay()]} ${d.getDate()}. ${MND[d.getMonth()]}`;
}

export function formatDuration(sec) {
  const mins = Math.floor(sec / 60);
  return `${mins} min`;
}

export function formatTimer(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // mandag = 0
  d.setDate(d.getDate() - day);
  return d.getTime();
}

export function startOfMonth(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d.getTime();
}

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
