// Datalag for treningsapp.
// All persistering går via dette modulen. UI-kode bruker bare de eksporterte
// funksjonene — IndexedDB-detaljene er innkapslet her. Når vi senere bytter
// til en backend (f.eks. Railway), erstatter vi innmaten uten å endre kallene.

const DB_NAME = 'treningsapp';
const DB_VERSION = 2;
const STORES = ['exercises', 'workouts', 'workout_exercises', 'workout_sets', 'profile'];

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('exercises')) {
        const s = db.createObjectStore('exercises', { keyPath: 'id' });
        s.createIndex('name', 'name', { unique: false });
        s.createIndex('muscleGroup', 'muscleGroup', { unique: false });
      }
      if (!db.objectStoreNames.contains('workouts')) {
        const s = db.createObjectStore('workouts', { keyPath: 'id' });
        s.createIndex('startedAt', 'startedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('workout_exercises')) {
        const s = db.createObjectStore('workout_exercises', { keyPath: 'id' });
        s.createIndex('workoutId', 'workoutId', { unique: false });
      }
      if (!db.objectStoreNames.contains('workout_sets')) {
        const s = db.createObjectStore('workout_sets', { keyPath: 'id' });
        s.createIndex('workoutExerciseId', 'workoutExerciseId', { unique: false });
      }
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(stores, mode = 'readonly') {
  return openDB().then(db => db.transaction(stores, mode));
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}

export const MUSCLE_GROUPS = ['Bryst', 'Rygg', 'Ben', 'Skuldre', 'Armer', 'Mage'];

// === Exercises ===

export async function listExercises() {
  const t = await tx(['exercises']);
  return reqToPromise(t.objectStore('exercises').getAll());
}

export async function addExercise({ name, muscleGroup, prWeight = null, prReps = null }) {
  const ex = { id: uid(), name, muscleGroup, prWeight, prReps, createdAt: Date.now() };
  const t = await tx(['exercises'], 'readwrite');
  await reqToPromise(t.objectStore('exercises').add(ex));
  return ex;
}

export async function updateExercise(id, { name, muscleGroup }) {
  const t = await tx(['exercises'], 'readwrite');
  const store = t.objectStore('exercises');
  const ex = await reqToPromise(store.get(id));
  if (!ex) return null;
  if (name != null) ex.name = name;
  if (muscleGroup != null) ex.muscleGroup = muscleGroup;
  await reqToPromise(store.put(ex));
  return ex;
}

export async function deleteExercise(id) {
  const t = await tx(['exercises'], 'readwrite');
  await reqToPromise(t.objectStore('exercises').delete(id));
}

export async function countWorkoutsUsingExerciseName(name) {
  const t = await tx(['workout_exercises']);
  const all = await reqToPromise(t.objectStore('workout_exercises').getAll());
  const workoutIds = new Set(all.filter(we => we.exerciseName === name).map(we => we.workoutId));
  return workoutIds.size;
}

// === Workouts ===

export async function listWorkouts() {
  const t = await tx(['workouts', 'workout_exercises', 'workout_sets']);
  const workouts = await reqToPromise(t.objectStore('workouts').getAll());
  const allExercises = await reqToPromise(t.objectStore('workout_exercises').getAll());
  const allSets = await reqToPromise(t.objectStore('workout_sets').getAll());

  const setsByExercise = new Map();
  for (const s of allSets) {
    if (!setsByExercise.has(s.workoutExerciseId)) setsByExercise.set(s.workoutExerciseId, []);
    setsByExercise.get(s.workoutExerciseId).push(s);
  }

  const exercisesByWorkout = new Map();
  for (const e of allExercises) {
    e.sets = (setsByExercise.get(e.id) || []).sort((a, b) => a.setNumber - b.setNumber);
    if (!exercisesByWorkout.has(e.workoutId)) exercisesByWorkout.set(e.workoutId, []);
    exercisesByWorkout.get(e.workoutId).push(e);
  }

  for (const w of workouts) {
    w.exercises = (exercisesByWorkout.get(w.id) || []).sort((a, b) => a.order - b.order);
  }
  workouts.sort((a, b) => b.startedAt - a.startedAt);
  return workouts;
}

export async function getWorkout(id) {
  const all = await listWorkouts();
  return all.find(w => w.id === id) || null;
}

export async function createWorkout({ name }) {
  const w = { id: uid(), name, startedAt: Date.now(), endedAt: null, notes: '' };
  const t = await tx(['workouts'], 'readwrite');
  await reqToPromise(t.objectStore('workouts').add(w));
  w.exercises = [];
  return w;
}

export async function updateWorkoutNotes(workoutId, notes) {
  const t = await tx(['workouts'], 'readwrite');
  const store = t.objectStore('workouts');
  const w = await reqToPromise(store.get(workoutId));
  if (!w) return null;
  w.notes = notes;
  await reqToPromise(store.put(w));
  return w;
}

export async function finishWorkout(workoutId) {
  // Rydd bort tomme sett (vekt eller reps = 0)
  const cleanTx = await tx(['workout_exercises', 'workout_sets'], 'readwrite');
  const exStore = cleanTx.objectStore('workout_exercises');
  const setStore = cleanTx.objectStore('workout_sets');
  const exKeys = await reqToPromise(exStore.index('workoutId').getAllKeys(workoutId));
  for (const exKey of exKeys) {
    const setKeys = await reqToPromise(setStore.index('workoutExerciseId').getAllKeys(exKey));
    for (const sKey of setKeys) {
      const s = await reqToPromise(setStore.get(sKey));
      if (!s) continue;
      if (!s.weight || !s.reps) {
        await reqToPromise(setStore.delete(sKey));
      }
    }
  }

  const t = await tx(['workouts'], 'readwrite');
  const store = t.objectStore('workouts');
  const w = await reqToPromise(store.get(workoutId));
  if (!w) return null;
  w.endedAt = Date.now();
  await reqToPromise(store.put(w));
  return w;
}

export async function addExerciseToWorkout(workoutId, { exerciseName, muscleGroup, order }) {
  const we = { id: uid(), workoutId, exerciseName, muscleGroup, order };
  const t = await tx(['workout_exercises'], 'readwrite');
  await reqToPromise(t.objectStore('workout_exercises').add(we));
  we.sets = [];
  return we;
}

export async function addSet(workoutExerciseId, { weight = 0, reps = 0, isCompleted = false, setNumber }) {
  const s = { id: uid(), workoutExerciseId, setNumber, weight, reps, isCompleted };
  const t = await tx(['workout_sets'], 'readwrite');
  await reqToPromise(t.objectStore('workout_sets').add(s));
  return s;
}

export async function updateSet(setId, patch) {
  const t = await tx(['workout_sets'], 'readwrite');
  const store = t.objectStore('workout_sets');
  const s = await reqToPromise(store.get(setId));
  if (!s) return null;
  Object.assign(s, patch);
  await reqToPromise(store.put(s));
  return s;
}

export async function deleteSet(setId) {
  const t = await tx(['workout_sets'], 'readwrite');
  await reqToPromise(t.objectStore('workout_sets').delete(setId));
}

export async function deleteWorkoutExercise(workoutExerciseId) {
  const t = await tx(['workout_exercises', 'workout_sets'], 'readwrite');
  const setsStore = t.objectStore('workout_sets');
  const idx = setsStore.index('workoutExerciseId');
  const sets = await reqToPromise(idx.getAllKeys(workoutExerciseId));
  for (const key of sets) {
    await reqToPromise(setsStore.delete(key));
  }
  await reqToPromise(t.objectStore('workout_exercises').delete(workoutExerciseId));
}

export async function updateWorkout(workoutId, { name, startedAt }) {
  const t = await tx(['workouts'], 'readwrite');
  const store = t.objectStore('workouts');
  const w = await reqToPromise(store.get(workoutId));
  if (!w) return null;
  if (name != null) w.name = name;
  if (startedAt != null) {
    const diff = startedAt - w.startedAt;
    w.startedAt = startedAt;
    if (w.endedAt != null) w.endedAt += diff;
  }
  await reqToPromise(store.put(w));
  return w;
}

export async function deleteWorkout(workoutId) {
  const t = await tx(['workouts', 'workout_exercises', 'workout_sets'], 'readwrite');
  const exStore = t.objectStore('workout_exercises');
  const setStore = t.objectStore('workout_sets');
  const exIdx = exStore.index('workoutId');
  const exKeys = await reqToPromise(exIdx.getAllKeys(workoutId));
  const exRows = await reqToPromise(exIdx.getAll(workoutId));
  for (const ex of exRows) {
    const setKeys = await reqToPromise(setStore.index('workoutExerciseId').getAllKeys(ex.id));
    for (const k of setKeys) await reqToPromise(setStore.delete(k));
  }
  for (const k of exKeys) await reqToPromise(exStore.delete(k));
  await reqToPromise(t.objectStore('workouts').delete(workoutId));
}

// === Profil ===

const PROFILE_ID = 'me';
const DEFAULT_PROFILE = { id: PROFILE_ID, name: '', startedTrainingAt: null };

export async function getProfile() {
  const t = await tx(['profile']);
  const existing = await reqToPromise(t.objectStore('profile').get(PROFILE_ID));
  return existing || { ...DEFAULT_PROFILE };
}

export async function saveProfile({ name, startedTrainingAt }) {
  const profile = { id: PROFILE_ID, name: name ?? '', startedTrainingAt: startedTrainingAt ?? null };
  const t = await tx(['profile'], 'readwrite');
  await reqToPromise(t.objectStore('profile').put(profile));
  return profile;
}

// === Eksport / import / slett ===

export async function exportAll() {
  const t = await tx(STORES);
  const data = {};
  for (const name of STORES) {
    data[name] = await reqToPromise(t.objectStore(name).getAll());
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export async function importAll(payload, { replace = true } = {}) {
  if (!payload || !payload.data) throw new Error('Ugyldig importfil');
  const t = await tx(STORES, 'readwrite');
  for (const name of STORES) {
    const store = t.objectStore(name);
    if (replace) await reqToPromise(store.clear());
    const rows = payload.data[name] || [];
    for (const row of rows) {
      await reqToPromise(store.put(row));
    }
  }
}

export async function clearAll() {
  const t = await tx(STORES, 'readwrite');
  for (const name of STORES) {
    await reqToPromise(t.objectStore(name).clear());
  }
}

// === Beregninger (kan kjøres på data uten DB) ===

// Bygg en map: øvelsesnavn -> { setId } for det settet med høyest vekt × reps.
// Bruker tidligst-vunnet-vekt prinsipp: ved likhet vinner det eldste settet
// (siden senere likt sett ikke ville være "ny PR").
export async function buildPRMap() {
  const t = await tx(['workouts', 'workout_exercises', 'workout_sets']);
  const workouts = await reqToPromise(t.objectStore('workouts').getAll());
  const exercises = await reqToPromise(t.objectStore('workout_exercises').getAll());
  const sets = await reqToPromise(t.objectStore('workout_sets').getAll());

  const workoutById = new Map(workouts.map(w => [w.id, w]));
  const exById = new Map(exercises.map(e => [e.id, e]));

  // For hvert sett, finn øvelsens navn og workoutens startedAt
  const candidates = sets
    .filter(s => s.isCompleted && s.weight > 0 && s.reps > 0)
    .map(s => {
      const ex = exById.get(s.workoutExerciseId);
      if (!ex) return null;
      const w = workoutById.get(ex.workoutId);
      if (!w || w.endedAt == null) return null;
      return {
        setId: s.id,
        name: ex.exerciseName,
        weight: s.weight,
        reps: s.reps,
        startedAt: w.startedAt,
      };
    })
    .filter(Boolean);

  // Grupper per navn, finn beste verdi (høyeste vekt × reps)
  const bestByName = new Map();
  for (const c of candidates) {
    const cur = bestByName.get(c.name);
    if (!cur || c.weight > cur.weight || (c.weight === cur.weight && c.reps > cur.reps)) {
      bestByName.set(c.name, { weight: c.weight, reps: c.reps });
    }
  }

  // Marker alle sett som matcher beste verdi for sin øvelse
  const map = new Map();
  for (const c of candidates) {
    const best = bestByName.get(c.name);
    if (c.weight === best.weight && c.reps === best.reps) {
      map.set(c.setId, true);
    }
  }
  return map;
}

export function workoutDurationSec(w) {
  const end = w.endedAt ?? Date.now();
  return Math.max(0, Math.floor((end - w.startedAt) / 1000));
}

export function workoutTotalVolume(w) {
  let v = 0;
  for (const ex of w.exercises ?? []) {
    for (const s of ex.sets ?? []) {
      if (s.isCompleted) v += (s.weight || 0) * (s.reps || 0);
    }
  }
  return v;
}

// === Seed ved første kjøring ===

export async function seedIfEmpty() {
  const existing = await listExercises();
  if (existing.length > 0) return;

  const library = [
    ['Benkpress', 'Bryst', null, null],
    ['Skråbenk hantel', 'Bryst', null, null],
    ['Flies', 'Bryst', null, null],
    ['Markløft', 'Rygg', null, null],
    ['Nedtrekk', 'Rygg', null, null],
    ['Stang-rodning', 'Rygg', null, null],
    ['Knebøy', 'Ben', null, null],
    ['Beinpress', 'Ben', null, null],
    ['Leg curl', 'Ben', null, null],
    ['Skulderpress', 'Skuldre', null, null],
    ['Lateral raises', 'Skuldre', null, null],
    ['Bicepscurl', 'Armer', null, null],
    ['Tricepspress', 'Armer', null, null],
    ['Plank', 'Mage', null, null],
    ['Hengende kneløft', 'Mage', null, null],
  ];
  for (const [name, muscleGroup, prWeight, prReps] of library) {
    await addExercise({ name, muscleGroup, prWeight, prReps });
  }
}
