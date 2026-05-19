// screens-main.jsx — Home + Active Workout screens

// ── Home Screen ──────────────────────────────────────────────
function HomeScreen({ onStartWorkout, onViewSession }) {
  const theme = useTheme();
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'God morgen';
    if (h < 17) return 'God ettermiddag';
    return 'God kveld';
  };
  const recent = SESSIONS.slice(0, 3);

  return (
    <div style={{ paddingTop: 62, paddingBottom: 20 }}>
      {/* Greeting */}
      <div style={{ padding: '8px 24px 0' }}>
        <div style={{ fontSize: 15, color: theme.textSec, fontWeight: 400, marginBottom: 2 }}>
          {getGreeting()},
        </div>
        <div style={{ fontSize: 34, fontWeight: 700, color: theme.text, letterSpacing: 0.3 }}>
          Magnus
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '24px 24px 0' }}>
        <div onClick={onStartWorkout} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: theme.accent, borderRadius: 16, padding: '18px 22px',
          cursor: 'pointer', transition: 'opacity 0.15s',
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#fff' }}>Start trening</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Logg øvelser og sett</div>
          </div>
          <AppIcon name="arrow" size={22} color="rgba(255,255,255,0.85)" />
        </div>
      </div>

      {/* Recent sessions */}
      <div style={{ padding: '28px 24px 0' }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: theme.textSec,
          textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12,
        }}>Siste treninger</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recent.map(s => (
            <div key={s.id} onClick={() => onViewSession(s)} style={{
              background: theme.surface, borderRadius: 14, padding: '14px 16px',
              cursor: 'pointer', boxShadow: theme.cardShadow,
              transition: 'transform 0.1s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>{s.name}</div>
                <AppIcon name="chevron" size={16} color={theme.textTer} />
              </div>
              <div style={{ fontSize: 14, color: theme.textSec, marginTop: 4 }}>
                {s.dateLabel} · {s.dur} min · {formatVol(s.vol)}
              </div>
              <div style={{
                fontSize: 13, color: theme.textTer, marginTop: 6,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {s.exercises.map(e => e.name).join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly summary */}
      <div style={{ padding: '24px 24px 0' }}>
        <div style={{
          background: theme.surface, borderRadius: 14, padding: '16px 18px',
          boxShadow: theme.cardShadow,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.textSec, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
            Denne uken
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.text, fontVariantNumeric: 'tabular-nums' }}>1</div>
              <div style={{ fontSize: 12, color: theme.textSec }}>trening</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.text, fontVariantNumeric: 'tabular-nums' }}>
                {formatVol(4285).replace(' kg', '')}
              </div>
              <div style={{ fontSize: 12, color: theme.textSec }}>kg volum</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Active Workout Screen ────────────────────────────────────
function WorkoutScreen({ onFinish, onBack }) {
  const theme = useTheme();

  // Timer
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  // Exercises state
  const [exercises, setExercises] = React.useState([
    { name: 'Benkpress', muscle: 'Bryst', sets: [
      { weight: 80, reps: 8, done: true },
      { weight: 90, reps: 6, done: true },
      { weight: 95, reps: 5, done: false },
    ]},
    { name: 'Skulderpress', muscle: 'Skuldre', sets: [
      { weight: 50, reps: 8, done: true },
      { weight: 55, reps: 6, done: false },
    ]},
  ]);

  const toggleSet = (ei, si) => {
    setExercises(prev => prev.map((ex, i) =>
      i === ei ? { ...ex, sets: ex.sets.map((s, j) =>
        j === si ? { ...s, done: !s.done } : s
      )} : ex
    ));
  };

  const addSet = (ei) => {
    setExercises(prev => prev.map((ex, i) =>
      i === ei ? { ...ex, sets: [...ex.sets, { weight: 0, reps: 0, done: false }] } : ex
    ));
  };

  const addExercise = () => {
    const used = new Set(exercises.map(e => e.name));
    const next = EXERCISES_DB.find(e => !used.has(e.name));
    if (next) setExercises(prev => [...prev, { name: next.name, muscle: next.muscle, sets: [{ weight: 0, reps: 0, done: false }] }]);
  };

  return (
    <div style={{ paddingTop: 62, paddingBottom: 24 }}>
      {/* Header */}
      <BackHeader title="Aktiv trening" onBack={onBack} />

      {/* Timer */}
      <div style={{ padding: '16px 24px 20px', textAlign: 'center' }}>
        <div style={{
          fontSize: 54, fontWeight: 200, color: theme.text,
          fontVariantNumeric: 'tabular-nums', letterSpacing: -1,
          fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif',
        }}>{mm}:{ss}</div>
        <div style={{ fontSize: 13, color: theme.textSec, marginTop: 2 }}>Varighet</div>
      </div>

      {/* Exercise cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px' }}>
        {exercises.map((ex, ei) => (
          <div key={ei} style={{
            background: theme.surface, borderRadius: 14, overflow: 'hidden',
            boxShadow: theme.cardShadow,
          }}>
            {/* Exercise header */}
            <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>{ex.name}</div>
                <div style={{ marginTop: 4 }}><MuscleTag muscle={ex.muscle} small /></div>
              </div>
            </div>

            {/* Set headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '36px 1fr 1fr 40px',
              padding: '0 16px 6px', gap: 8, alignItems: 'center',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: theme.textTer, textTransform: 'uppercase' }}>Sett</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: theme.textTer, textTransform: 'uppercase' }}>Kg</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: theme.textTer, textTransform: 'uppercase' }}>Reps</span>
              <span></span>
            </div>

            {/* Set rows */}
            {ex.sets.map((set, si) => (
              <div key={si} style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 1fr 40px',
                padding: '7px 16px', gap: 8, alignItems: 'center',
                background: set.done ? (theme.isDark ? 'rgba(59,130,246,0.08)' : 'rgba(37,99,235,0.04)') : 'transparent',
                borderTop: `0.5px solid ${theme.sep}`,
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: theme.textSec, fontVariantNumeric: 'tabular-nums' }}>{si + 1}</span>
                <span style={{ fontSize: 17, fontWeight: 600, color: set.weight ? theme.text : theme.textTer, fontVariantNumeric: 'tabular-nums' }}>
                  {set.weight || '—'}
                </span>
                <span style={{ fontSize: 17, fontWeight: 600, color: set.reps ? theme.text : theme.textTer, fontVariantNumeric: 'tabular-nums' }}>
                  {set.reps || '—'}
                </span>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div onClick={() => toggleSet(ei, si)} style={{
                    width: 28, height: 28, borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: set.done ? theme.accent : 'transparent',
                    border: set.done ? 'none' : `2px solid ${theme.textTer}`,
                  }}>
                    {set.done && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 7"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add set */}
            <div onClick={() => addSet(ei)} style={{
              padding: '10px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              borderTop: `0.5px solid ${theme.sep}`,
            }}>
              <AppIcon name="plus" size={16} color={theme.accent} />
              <span style={{ fontSize: 14, fontWeight: 500, color: theme.accent }}>Legg til sett</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add exercise */}
      <div style={{ padding: '12px 20px 0' }}>
        <div onClick={addExercise} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '14px', borderRadius: 14, cursor: 'pointer',
          border: `1.5px dashed ${theme.sep}`,
        }}>
          <AppIcon name="plus" size={18} color={theme.textSec} />
          <span style={{ fontSize: 15, fontWeight: 500, color: theme.textSec }}>Legg til øvelse</span>
        </div>
      </div>

      {/* Finish */}
      <div style={{ padding: '20px 20px 0' }}>
        <div onClick={onFinish} style={{
          background: theme.accent, borderRadius: 14, padding: '16px',
          textAlign: 'center', cursor: 'pointer',
        }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: '#fff' }}>Fullfør trening</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, WorkoutScreen });
