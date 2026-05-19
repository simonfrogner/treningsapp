// app.jsx — Main App component with routing + theme + tweaks

function App({ defaults }) {
  const [t, setTweak] = useTweaks(defaults);
  const theme = buildTheme(t.theme, t.accent, t.cardStyle);

  const [tab, setTab] = React.useState('home');
  const [isWorkout, setIsWorkout] = React.useState(false);
  const [detail, setDetail] = React.useState(null);

  const showTabBar = !isWorkout && !detail;

  const handleTab = (id) => { setDetail(null); setTab(id); };
  const handleStartWorkout = () => setIsWorkout(true);
  const handleFinishWorkout = () => { setIsWorkout(false); setTab('home'); };
  const handleViewSession = (s) => setDetail(s);
  const handleBack = () => { setDetail(null); setIsWorkout(false); };

  const renderScreen = () => {
    if (isWorkout) return <WorkoutScreen onFinish={handleFinishWorkout} onBack={handleBack} />;
    if (detail) return <SessionDetailScreen session={detail} onBack={handleBack} />;
    switch (tab) {
      case 'home': return <HomeScreen onStartWorkout={handleStartWorkout} onViewSession={handleViewSession} />;
      case 'history': return <HistoryScreen onViewSession={handleViewSession} />;
      case 'exercises': return <ExercisesScreen />;
      case 'profile': return <ProfileScreen />;
      default: return null;
    }
  };

  return (
    <ThemeCtx.Provider value={theme}>
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', width: '100%',
        background: theme.isDark ? '#111' : '#E8E8ED',
        padding: '20px 0',
      }}>
        <IOSDevice dark={theme.isDark} width={393} height={852}>
          <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: theme.bg,
          }}>
            <div style={{
              flex: 1, overflowY: 'auto', overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
            }}>
              {renderScreen()}
            </div>
            {showTabBar && <TabBar active={tab} onNavigate={handleTab} />}
          </div>
        </IOSDevice>
      </div>

      <TweaksPanel>
        <TweakSection label="Utseende" />
        <TweakRadio
          label="Tema"
          value={t.theme}
          options={['light', 'dark']}
          labels={['Lys', 'Mørk']}
          onChange={v => setTweak('theme', v)}
        />
        <TweakColor
          label="Aksentfarge"
          value={t.accent}
          options={['#2563EB', '#D97706', '#0D9488']}
          onChange={v => setTweak('accent', v)}
        />
        <TweakRadio
          label="Kort-stil"
          value={t.cardStyle}
          options={['flat', 'shadow']}
          labels={['Flat', 'Skygge']}
          onChange={v => setTweak('cardStyle', v)}
        />
      </TweaksPanel>
    </ThemeCtx.Provider>
  );
}

Object.assign(window, { App });
