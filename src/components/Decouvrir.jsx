// src/components/Decouvrir.jsx
import { useState, useCallback, useRef } from 'react';
import { searchBoirLocal } from '../lib/boirCatalog';

const TYPE_EMOJI = { rouge: '🍷', blanc: '🥂', rosé: '🌸', effervescent: '🍾', doux: '🍯' };
const TYPE_COLOR = {
  rouge:        { bg: 'rgba(139,26,26,0.15)',   border: 'rgba(139,26,26,0.4)',   text: '#c87070' },
  blanc:        { bg: 'rgba(200,180,80,0.12)',   border: 'rgba(200,180,80,0.35)', text: '#c8b448' },
  rosé:         { bg: 'rgba(200,100,120,0.12)',  border: 'rgba(200,100,120,0.35)',text: '#c87090' },
  effervescent: { bg: 'rgba(100,160,200,0.12)', border: 'rgba(100,160,200,0.35)',text: '#70a8c8' },
  doux:         { bg: 'rgba(180,140,60,0.15)',   border: 'rgba(180,140,60,0.4)', text: '#c8a848' },
};

function Tag({ label, color = '#9a7d5a' }) {
  return (
    <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:20, fontSize:11,
      background:'rgba(255,255,255,0.06)', color, border:`1px solid ${color}40`, whiteSpace:'nowrap' }}>
      {label}
    </span>
  );
}

function WineCard({ wine }) {
  const colors   = TYPE_COLOR[wine.type] || TYPE_COLOR.rouge;
  const emoji    = TYPE_EMOJI[wine.type] || '🍷';
  return (
    <div
      style={{ background:'#1a1510', border:`1px solid ${colors.border}`, borderRadius:14,
        padding:'16px', display:'flex', flexDirection:'column', gap:10,
        transition:'transform 0.15s, box-shadow 0.15s' }}
    >
      <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
        {wine.image ? (
          <img src={wine.image} alt={wine.title}
            style={{ width:44, height:44, objectFit:'contain', borderRadius:6, background:'#0f0c09', flexShrink:0 }} />
        ) : (
          <div style={{ width:44, height:44, borderRadius:6, background:colors.bg, border:`1px solid ${colors.border}`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
            {emoji}
          </div>
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:'bold', color:'#e8d5b7', lineHeight:1.3, marginBottom:2 }}>
            {wine.title}
          </div>
          <div style={{ fontSize:12, color:'#9a7d5a' }}>
             {wine.region || 'Vin'} · {wine.vendor}
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          {wine.price > 0 && (
            <div style={{ fontSize:16, fontWeight:'bold', color:colors.text }}>{wine.price}€</div>
          )}
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}>
        <span style={{ fontSize:11, color:'#7a6040' }}>📍 {wine.region}</span>
        <a href={wine.url} target="_blank" rel="noopener noreferrer"
          style={{ padding:'7px 14px', borderRadius:8, background:colors.bg,
            border:`1px solid ${colors.border}`, color:colors.text,
            fontSize:12, textDecoration:'none', fontWeight:'bold' }}>
          🍷 Commander →
        </a>
      </div>
    </div>
  );
}

const QUICK = [
  { label:'🍷 Bordeaux',   q:'bordeaux'  },
  { label:'🥂 Bourgogne',  q:'bourgogne' },
  { label:'🌹 Rhône',      q:'rhône'     },
  { label:'🌿 Italie',     q:'italie'    },
  { label:'🍾 Champagne',  q:'champagne' },
  { label:'🌸 Rosé',       q:'rosé'      },
  { label:'🥂 Loire',      q:'loire'     },
  { label:'🇪🇸 Espagne',    q:'espagne'   },
];

export function Decouvrir() {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  const handleSearch = useCallback((value) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        // LE FIX EST ICI : On passe de 12 à 500 pour voir TOUT le catalogue
        const data = searchBoirLocal(value.trim(), 500);
        setResults(data);
        setSearched(true);
      } else {
        setResults([]);
        setSearched(false);
      }
    }, 200);
  }, []);

  const reset = () => { setQuery(''); setResults([]); setSearched(false); };

  return (
    <div style={{ padding:'20px 16px', maxWidth:700, margin:'0 auto', fontFamily:'Georgia, serif' }}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <h2 style={{ fontSize:22, color:'#c8956c', margin:'0 0 6px', letterSpacing:'0.04em' }}>Découvrir</h2>
        <p style={{ color:'#7a6040', fontSize:13, margin:0 }}>
          Explorez les {results.length > 0 ? results.length : '891'} pépites de Boir.be
        </p>
      </div>

      <div style={{ position:'relative', marginBottom:16 }}>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
          fontSize:18, color:'#7a6040', pointerEvents:'none' }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Région, cépage, appellation..."
          style={{ width:'100%', padding:'13px 40px 13px 44px', boxSizing:'border-box',
            background:'#1a1510', border:'1px solid #3d2f1f', borderRadius:12,
            color:'#e8d5b7', fontSize:15, fontFamily:'Georgia, serif', outline:'none' }}
        />
        {query && <button onClick={reset} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#7a6040', fontSize:18 }}>×</button>}
      </div>

      {!searched && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
          {QUICK.map(({ label, q }) => (
            <button key={q} onClick={() => handleSearch(q)}
              style={{ padding:'7px 14px', borderRadius:20, background:'#1a1510',
                border:'1px solid #3d2f1f', color:'#c8b48a', fontSize:13, cursor:'pointer' }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {searched && (
        <div>
          <p style={{ color:'#7a6040', fontSize:13, marginBottom:16 }}>
            {results.length > 0
              ? `${results.length} vin${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`
              : `Aucun résultat pour « ${query} »`}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {results.map((wine, i) => <WineCard key={i} wine={wine} />)}
          </div>
        </div>
      )}
    </div>
  );
}
