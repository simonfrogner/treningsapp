// screens-secondary.jsx — History, Session Detail, Exercises, Profile

// ── History Screen ───────────────────────────────────────────
function HistoryScreen({ onViewSession }) {
  const theme = useTheme();
  const grouped = WEEK_LABELS.map((label, wi) => ({
    label,
    sessions: SESSIONS.filter(s => s.week === wi),
  })).filter(g => g.sessions.length > 0);

  return (
    <div style={{ paddingTop: 62, paddingBottom: 20 }}>
      <div style={{ padding: '8px 24px 20px' }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: theme.text, letterSpacing: 0.3 }}>Historikk</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {grouped.map(group => (
          <div key={group.label}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: theme.textSec,
              textTransform: 'uppercase', letterSpacing: 0.6,
              padding: '0 24px 8px',
            }}>{group.label}</div>

            <div style={{ margin: '0 20px', background: theme.surface, borderRadius: 14, overflow: 'hidden', boxShadow: theme.cardShadow }}>
              {group.sessions.map((s, i) => (
                <div key={s.id} onClick={() => onViewSession(s)} style={{
                  padding: '14px 16px', cursor: 'pointer',
                  borderTop: i > 0 ? `0.5px solid ${theme.sep}` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>{s.name}</div>
                    <div style={{ fontSize: 14, color: theme.textSec, marginTop: 3, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span>{s.dateLabel}</span>
                      <span style={{ color: theme.textTer }}>·</span>
                      <span>{s.dur} min</span>
                      <span style={{ color: theme.textTer }}>·</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatVol(s.vol)}</span>
                    </div>
                  </div>
                  <AppIcon name="chevron" size={16} color={theme.textTer} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Session Detail Screen ────────────────────────────────────
function SessionDetailScreen({ session, onBack }) {
  const theme = useTheme();
  return (
    <div style={{ paddingTop: 62, paddingBottom: 24 }}>
      <BackHeader title={session.name} onBack={onBack} />

      <div style={{ padding: '12px 24px 20px' }}>
        <div style={{ fontSize: 14, color: theme.textSec }}>
          {session.dateLabel} · {session.dur} min
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: theme.text, fontVariantNumeric: 'tabular-nums' }}>
            {formatVol(session.vol).replace(' kg', '')}
          </span>
          <span style={{ fontSize: 15, color: theme.textSec }}>kg totalt volum</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 20px' }}>
        {session.exercises.map((ex, ei) => (
          <div key={ei} style={{
            background: theme.surface, borderRadius: 14, padding: '14px 16px',
            boxShadow: theme.cardShadow,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>{ex.name}</span>
              <MuscleTag muscle={ex.muscle} small />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ex.sets.map((set, si) => (
                <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: theme.textTer, width: 20, fontVariantNumeric: 'tabular-nums' }}>{si + 1}.</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: theme.text, fontVariantNumeric: 'tabular-nums' }}>
                    {set.w} kg
                  </span>
                  <span style={{ fontSize: 14, color: theme.textSec }}>×</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: theme.text, fontVariantNumeric: 'tabular-nums' }}>
                    {set.r} reps
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Exercises Screen ─────────────────────────────────────────
function ExercisesScreen() {
  const theme = useTheme();
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('Alle');

  const filtered = EXERCISES_DB.filter(ex => {
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'Alle' || ex.muscle === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ paddingTop: 62, paddingBottom: 20 }}>
      <div style={{ padding: '8px 24px 16px' }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: theme.text, letterSpacing: 0.3 }}>Øvelser</div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: theme.surface, borderRadius: 12, padding: '10px 14px',
          boxShadow: theme.cardShadow,
        }}>
          <AppIcon name="search" size={18} color={theme.textTer} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Søk øvelser..."
            style={{
              border: 'none', outline: 'none', background: 'transparent', flex: 1,
              fontSize: 16, color: theme.text, fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 16px',
        WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
      }}>
        {MUSCLE_GROUPS.map(mg => {
          const on = filter === mg;
          return (
            <div key={mg} onClick={() => setFilter(mg)} style={{
              padding: '7px 14px', borderRadius: 20, whiteSpace: 'nowrap',
              cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
              fontSize: 14, fontWeight: 500,
              background: on ? theme.accent : theme.surface,
              color: on ? '#fff' : theme.textSec,
              boxShadow: on ? 'none' : theme.cardShadow,
            }}>{mg}</div>
          );
        })}
      </div>

      {/* Exercise list */}
      <div style={{ margin: '0 20px', background: theme.surface, borderRadius: 14, overflow: 'hidden', boxShadow: theme.cardShadow }}>
        {filtered.map((ex, i) => (
          <div key={ex.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '13px 16px',
            borderTop: i > 0 ? `0.5px solid ${theme.sep}` : 'none',
            cursor: 'pointer',
          }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500, color: theme.text }}>{ex.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <MuscleTag muscle={ex.muscle} small />
                {ex.pb && (
                  <span style={{ fontSize: 13, color: theme.textSec, fontVariantNumeric: 'tabular-nums' }}>
                    PR: {ex.pb}
                  </span>
                )}
              </div>
            </div>
            <AppIcon name="chevron" size={16} color={theme.textTer} />
          </div>
        ))}
      </div>

      {/* Add exercise */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '14px', borderRadius: 14, cursor: 'pointer',
          border: `1.5px dashed ${theme.sep}`,
        }}>
          <AppIcon name="plus" size={18} color={theme.accent} />
          <span style={{ fontSize: 15, fontWeight: 500, color: theme.accent }}>Legg til ny øvelse</span>
        </div>
      </div>
    </div>
  );
}

// ── Profile Screen ───────────────────────────────────────────
function ProfileScreen() {
  const theme = useTheme();
  const totalVol = SESSIONS.reduce((sum, s) => sum + s.vol, 0);
  const stats = [
    { value: SESSIONS.length, label: 'treninger', sub: 'denne mnd' },
    { value: formatVol(totalVol).replace(' kg', ''), label: 'kg', sub: 'total volum' },
    { value: '8', label: 'dager', sub: 'streak' },
  ];

  const settingsItems = [
    { label: 'Innstillinger', icon: 'settings' },
    { label: 'Enheter', detail: 'Metrisk (kg)' },
    { label: 'Eksporter data' },
    { label: 'Om appen' },
  ];

  return (
    <div style={{ paddingTop: 62, paddingBottom: 20 }}>
      <div style={{ padding: '8px 24px 24px' }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: theme.text, letterSpacing: 0.3 }}>Profil</div>
      </div>

      {/* Avatar + name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 28px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 40,
          background: theme.accentBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 700, color: theme.accent,
          marginBottom: 12,
        }}>ME</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: theme.text }}>Magnus Eriksen</div>
        <div style={{ fontSize: 14, color: theme.textSec, marginTop: 2 }}>Trener siden mars 2024</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, padding: '0 20px 24px' }}>
        {stats.map((st, i) => (
          <div key={i} style={{
            flex: 1, background: theme.surface, borderRadius: 14,
            padding: '16px 12px', textAlign: 'center', boxShadow: theme.cardShadow,
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: theme.text, fontVariantNumeric: 'tabular-nums' }}>
              {st.value}
            </div>
            <div style={{ fontSize: 12, color: theme.textSec, marginTop: 2 }}>{st.label}</div>
            <div style={{ fontSize: 11, color: theme.textTer }}>{st.sub}</div>
          </div>
        ))}
      </div>

      {/* Settings list */}
      <div style={{ margin: '0 20px', background: theme.surface, borderRadius: 14, overflow: 'hidden', boxShadow: theme.cardShadow }}>
        {settingsItems.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', cursor: 'pointer',
            borderTop: i > 0 ? `0.5px solid ${theme.sep}` : 'none',
          }}>
            <span style={{ fontSize: 16, color: theme.text }}>{item.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {item.detail && <span style={{ fontSize: 14, color: theme.textSec }}>{item.detail}</span>}
              <AppIcon name="chevron" size={16} color={theme.textTer} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { HistoryScreen, SessionDetailScreen, ExercisesScreen, ProfileScreen });
