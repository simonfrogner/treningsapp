// app-core.jsx — Theme, data, icons, shared components for Treningsapp

// ── Theme ────────────────────────────────────────────────────
const ACCENT_MAP = {
  '#2563EB': { main: '#2563EB', light: '#3B82F6', bg: '#EBF2FF', darkBg: '#172554' },
  '#D97706': { main: '#D97706', light: '#FBBF24', bg: '#FFF7ED', darkBg: '#451A03' },
  '#0D9488': { main: '#0D9488', light: '#2DD4BF', bg: '#F0FDFA', darkBg: '#042F2E' },
};

function buildTheme(mode, accentHex, cardStyle) {
  const a = ACCENT_MAP[accentHex] || ACCENT_MAP['#2563EB'];
  const dk = mode === 'dark';
  return {
    isDark: dk,
    bg: dk ? '#000' : '#F2F2F7',
    surface: dk ? '#1C1C1E' : '#FFF',
    text: dk ? '#F5F5F7' : '#1D1D1F',
    textSec: dk ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)',
    textTer: dk ? 'rgba(235,235,245,0.3)' : 'rgba(60,60,67,0.3)',
    sep: dk ? 'rgba(84,84,88,0.34)' : 'rgba(60,60,67,0.12)',
    accent: dk ? a.light : a.main,
    accentBg: dk ? a.darkBg : a.bg,
    tabBg: dk ? 'rgba(30,30,30,0.92)' : 'rgba(249,249,249,0.92)',
    cardShadow: cardStyle === 'shadow'
      ? (dk ? '0 2px 16px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.06)')
      : 'none',
  };
}

const ThemeCtx = React.createContext(null);
const useTheme = () => React.useContext(ThemeCtx);

// ── Data ─────────────────────────────────────────────────────
const MUSCLE_GROUPS = ['Alle', 'Bryst', 'Rygg', 'Ben', 'Skuldre', 'Armer', 'Mage'];

const EXERCISES_DB = [
  { id:1, name:'Benkpress', muscle:'Bryst', pb:'100 × 5' },
  { id:2, name:'Skråbenkpress', muscle:'Bryst', pb:'80 × 6' },
  { id:3, name:'Brystflyes', muscle:'Bryst', pb:'18 × 12' },
  { id:4, name:'Knebøy', muscle:'Ben', pb:'120 × 5' },
  { id:5, name:'Beinpress', muscle:'Ben', pb:'200 × 8' },
  { id:6, name:'Utfall', muscle:'Ben', pb:'40 × 10' },
  { id:7, name:'Lårcurl', muscle:'Ben', pb:'55 × 10' },
  { id:8, name:'Markløft', muscle:'Rygg', pb:'140 × 3' },
  { id:9, name:'Nedtrekk', muscle:'Rygg', pb:'75 × 8' },
  { id:10, name:'Roing', muscle:'Rygg', pb:'80 × 8' },
  { id:11, name:'Skulderpress', muscle:'Skuldre', pb:'60 × 8' },
  { id:12, name:'Sideheving', muscle:'Skuldre', pb:'14 × 12' },
  { id:13, name:'Bicepscurl', muscle:'Armer', pb:'20 × 10' },
  { id:14, name:'Triceps pushdown', muscle:'Armer', pb:'35 × 10' },
  { id:15, name:'Planke', muscle:'Mage', pb:null },
];

const WEEK_LABELS = ['Denne uken', 'Forrige uke', 'For 2 uker siden'];

const SESSIONS = [
  { id:1, name:'Overkropp styrke', dateLabel:'I dag', dur:52, vol:4285, week:0,
    exercises:[
      { name:'Benkpress', muscle:'Bryst', sets:[{w:80,r:8},{w:90,r:6},{w:95,r:5},{w:80,r:8}] },
      { name:'Skulderpress', muscle:'Skuldre', sets:[{w:50,r:8},{w:55,r:6},{w:55,r:6}] },
      { name:'Nedtrekk', muscle:'Rygg', sets:[{w:65,r:10},{w:70,r:8},{w:70,r:8}] },
    ]},
  { id:2, name:'Beindag', dateLabel:'Søn 17. mai', dur:65, vol:6890, week:1,
    exercises:[
      { name:'Knebøy', muscle:'Ben', sets:[{w:100,r:6},{w:110,r:5},{w:115,r:4},{w:100,r:6}] },
      { name:'Beinpress', muscle:'Ben', sets:[{w:180,r:10},{w:190,r:8},{w:200,r:8}] },
      { name:'Lårcurl', muscle:'Ben', sets:[{w:45,r:10},{w:50,r:8},{w:50,r:8}] },
    ]},
  { id:3, name:'Push', dateLabel:'Fre 15. mai', dur:48, vol:3125, week:1,
    exercises:[
      { name:'Benkpress', muscle:'Bryst', sets:[{w:85,r:6},{w:90,r:5},{w:85,r:6}] },
      { name:'Skråbenkpress', muscle:'Bryst', sets:[{w:65,r:8},{w:70,r:7},{w:70,r:6}] },
      { name:'Sideheving', muscle:'Skuldre', sets:[{w:12,r:12},{w:14,r:10},{w:14,r:10}] },
    ]},
  { id:4, name:'Pull', dateLabel:'Ons 13. mai', dur:55, vol:3245, week:1,
    exercises:[
      { name:'Markløft', muscle:'Rygg', sets:[{w:120,r:5},{w:130,r:3},{w:130,r:3}] },
      { name:'Roing', muscle:'Rygg', sets:[{w:70,r:8},{w:75,r:8},{w:75,r:7}] },
      { name:'Bicepscurl', muscle:'Armer', sets:[{w:16,r:10},{w:18,r:8},{w:18,r:8}] },
    ]},
  { id:5, name:'Overkropp styrke', dateLabel:'Man 12. mai', dur:50, vol:2820, week:1,
    exercises:[
      { name:'Benkpress', muscle:'Bryst', sets:[{w:80,r:8},{w:85,r:6},{w:85,r:6}] },
      { name:'Skulderpress', muscle:'Skuldre', sets:[{w:50,r:8},{w:55,r:7},{w:50,r:8}] },
    ]},
  { id:6, name:'Beindag', dateLabel:'Søn 10. mai', dur:60, vol:4715, week:2,
    exercises:[
      { name:'Knebøy', muscle:'Ben', sets:[{w:95,r:8},{w:105,r:5},{w:110,r:4}] },
      { name:'Beinpress', muscle:'Ben', sets:[{w:170,r:10},{w:180,r:8}] },
    ]},
  { id:7, name:'Push', dateLabel:'Fre 8. mai', dur:45, vol:2340, week:2,
    exercises:[
      { name:'Benkpress', muscle:'Bryst', sets:[{w:80,r:8},{w:85,r:6},{w:80,r:7}] },
      { name:'Brystflyes', muscle:'Bryst', sets:[{w:16,r:12},{w:18,r:10}] },
    ]},
  { id:8, name:'Pull', dateLabel:'Ons 6. mai', dur:50, vol:2625, week:2,
    exercises:[
      { name:'Markløft', muscle:'Rygg', sets:[{w:115,r:5},{w:125,r:4},{w:125,r:3}] },
      { name:'Nedtrekk', muscle:'Rygg', sets:[{w:60,r:10},{w:65,r:8}] },
    ]},
];

// ── Utilities ────────────────────────────────────────────────
const formatVol = (kg) => kg.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009') + ' kg';

// ── Icons ────────────────────────────────────────────────────
function AppIcon({ name, size = 22, color = '#999', strokeWidth: sw }) {
  const p = { width:size, height:size, viewBox:'0 0 24 24', fill:'none',
    stroke:color, strokeWidth: sw || 1.8, strokeLinecap:'round', strokeLinejoin:'round' };
  const icons = {
    home: <svg {...p}><path d="M4 10l8-7 8 7v10a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z"/></svg>,
    clock: <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    dumbbell: <svg {...p} strokeWidth={1.6}><rect x="2" y="9" width="3" height="6" rx=".8"/><rect x="5" y="6.5" width="3" height="11" rx=".8"/><rect x="16" y="6.5" width="3" height="11" rx=".8"/><rect x="19" y="9" width="3" height="6" rx=".8"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
    person: <svg {...p}><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 00-16 0"/></svg>,
    search: <svg {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>,
    plus: <svg {...p} strokeWidth={2}><path d="M12 5v14M5 12h14"/></svg>,
    check: <svg {...p} strokeWidth={2.5}><path d="M5 12l5 5L20 7"/></svg>,
    back: <svg {...p} strokeWidth={2.2}><path d="M15 19l-7-7 7-7"/></svg>,
    chevron: <svg {...p} strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>,
    arrow: <svg {...p} strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
    settings: <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  };
  return icons[name] || null;
}

// ── Tab Bar ──────────────────────────────────────────────────
const TAB_ITEMS = [
  { id:'home', label:'Hjem', icon:'home' },
  { id:'history', label:'Historikk', icon:'clock' },
  { id:'exercises', label:'Øvelser', icon:'dumbbell' },
  { id:'profile', label:'Profil', icon:'person' },
];

function TabBar({ active, onNavigate }) {
  const theme = useTheme();
  return (
    <div style={{
      display:'flex', justifyContent:'space-around', alignItems:'flex-start',
      paddingTop:8, paddingBottom:30,
      background:theme.tabBg, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
      borderTop:`0.5px solid ${theme.sep}`, flexShrink:0,
    }}>
      {TAB_ITEMS.map(tab => {
        const on = active === tab.id;
        const c = on ? theme.accent : theme.textTer;
        return (
          <div key={tab.id} onClick={() => onNavigate(tab.id)} style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            cursor:'pointer', WebkitTapHighlightColor:'transparent', padding:'2px 16px',
          }}>
            <AppIcon name={tab.icon} size={22} color={c} />
            <span style={{ fontSize:10, fontWeight:500, color:c, letterSpacing:0.07 }}>{tab.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Shared Components ────────────────────────────────────────
function MuscleTag({ muscle, small }) {
  const theme = useTheme();
  return (
    <span style={{
      fontSize: small ? 11 : 12, fontWeight:500, color:theme.accent,
      background:theme.accentBg, padding: small ? '1px 6px' : '2px 8px',
      borderRadius:6, letterSpacing:0.1,
    }}>{muscle}</span>
  );
}

function BackHeader({ title, onBack, right }) {
  const theme = useTheme();
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', minHeight:44 }}>
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        <div onClick={onBack} style={{ cursor:'pointer', padding:8, margin:'-8px -4px -8px -8px', borderRadius:20 }}>
          <AppIcon name="back" size={22} color={theme.text} />
        </div>
        <span style={{ fontSize:17, fontWeight:600, color:theme.text }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

Object.assign(window, {
  buildTheme, ThemeCtx, useTheme, ACCENT_MAP,
  EXERCISES_DB, MUSCLE_GROUPS, SESSIONS, WEEK_LABELS, formatVol,
  AppIcon, TabBar, MuscleTag, BackHeader, TAB_ITEMS,
});
