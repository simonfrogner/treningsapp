// Datalag for treningsapp.
// All persistering går via dette modulen. UI-kode bruker bare de eksporterte
// funksjonene — IndexedDB-detaljene er innkapslet her. Når vi senere bytter
// til en backend (f.eks. Railway), erstatter vi innmaten uten å endre kallene.

const DB_NAME = 'treningsapp';
const DB_VERSION = 1;
const STORES = ['exercises', 'workouts', 'workout_exercises', 'workout_sets'];

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
  const w = { id: uid(), name, startedAt: Date.now(), endedAt: null };
  const t = await tx(['workouts'], 'readwrite');
  await reqToPromise(t.objectStore('workouts').add(w));
  w.exercises = [];
  return w;
}

export async function finishWorkout(workoutId) {
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

// === Beregninger (kan kjøres på data uten DB) ===

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
    ['Benkpress', 'Bryst', 100, 5],
    ['Skråbenk hantel', 'Bryst', 32, 8],
    ['Flies', 'Bryst', null, null],
    ['Markløft', 'Rygg', 160, 3],
    ['Nedtrekk', 'Rygg', 70, 8],
    ['Stang-rodning', 'Rygg', 80, 6],
    ['Knebøy', 'Ben', 140, 5],
    ['Beinpress', 'Ben', 200, 8],
    ['Leg curl', 'Ben', 50, 10],
    ['Skulderpress', 'Skuldre', 50, 6],
    ['Lateral raises', 'Skuldre', 12, 12],
    ['Bicepscurl', 'Armer', 18, 10],
    ['Tricepspress', 'Armer', 30, 8],
    ['Plank', 'Mage', null, null],
    ['Hengende kneløft', 'Mage', null, null],
  ];
  for (const [name, muscleGroup, prWeight, prReps] of library) {
    await addExercise({ name, muscleGroup, prWeight, prReps });
  }

  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const past = [
    { name: 'Push', daysAgo: 1, exercises: [
      { exerciseName: 'Benkpress', muscleGroup: 'Bryst', sets: [[80, 8], [80, 8], [80, 7]] },
      { exerciseName: 'Skulderpress', muscleGroup: 'Skuldre', sets: [[45, 8], [45, 7]] },
      { exerciseName: 'Tricepspress', muscleGroup: 'Armer', sets: [[25, 10], [25, 10]] },
    ]},
    { name: 'Pull', daysAgo: 3, exercises: [
      { exerciseName: 'Markløft', muscleGroup: 'Rygg', sets: [[120, 5], [130, 5], [140, 3]] },
      { exerciseName: 'Nedtrekk', muscleGroup: 'Rygg', sets: [[60, 10], [60, 8]] },
      { exerciseName: 'Bicepscurl', muscleGroup: 'Armer', sets: [[16, 10], [16, 10]] },
    ]},
    { name: 'Ben', daysAgo: 5, exercises: [
      { exerciseName: 'Knebøy', muscleGroup: 'Ben', sets: [[100, 8], [110, 6], [120, 5]] },
      { exerciseName: 'Beinpress', muscleGroup: 'Ben', sets: [[180, 10], [180, 10]] },
    ]},
    { name: 'Push', daysAgo: 8, exercises: [
      { exerciseName: 'Benkpress', muscleGroup: 'Bryst', sets: [[75, 8], [80, 6]] },
      { exerciseName: 'Lateral raises', muscleGroup: 'Skuldre', sets: [[10, 12], [10, 12]] },
    ]},
  ];

  for (const p of past) {
    const start = now - p.daysAgo * day;
    const end = start + 55 * 60 * 1000;
    const w = await createWorkout({ name: p.name });
    // Sett start/end manuelt for seed-data
    const t = await tx(['workouts'], 'readwrite');
    const stored = await reqToPromise(t.objectStore('workouts').get(w.id));
    stored.startedAt = start;
    stored.endedAt = end;
    await reqToPromise(t.objectStore('workouts').put(stored));

    for (let i = 0; i < p.exercises.length; i++) {
      const ex = p.exercises[i];
      const we = await addExerciseToWorkout(w.id, {
        exerciseName: ex.exerciseName,
        muscleGroup: ex.muscleGroup,
        order: i,
      });
      for (let j = 0; j < ex.sets.length; j++) {
        const [weight, reps] = ex.sets[j];
        await addSet(we.id, { setNumber: j + 1, weight, reps, isCompleted: true });
      }
    }
  }
}
