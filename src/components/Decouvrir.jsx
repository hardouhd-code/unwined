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
  const aromas   = wine.aromas   ? wine.aromas.split(',').map(s=>s.trim()).filter(Boolean)   : [];
  const grapes   = wine.grapes   ? wine.grapes.split(',').map(s=>s.trim()).filter(Boolean)   : [];
  const pairings = wine.pairings ? wine.pairings.split(',').map(s=>s.trim()).filter(Boolean) : [];

  return (
    <div
      style={{ background:'#1a1510', border:`1px solid ${colors.border}`, borderRadius:14,
        padding:'16px', display:'flex', flexDirection:'column', gap:10,
        transition:'transform 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,0.4)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
    >
      {/* Header */}
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
            {wine.country}{wine.year ? ` · ${wine.year}` : ''}
            {wine.profile ? <span style={{ color:colors.text }}> · {wine.profile}</span> : null}
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          {wine.price > 0 && (
            <div style={{ fontSize:16, fontWeight:'bold', color:colors.text }}>{wine.price}€</div>
          )}
          {wine.service && <div style={{ fontSize:11, color:'#7a6040' }}>{wine.service}</div>}
        </div>
      </div>

      {grapes.length > 0 && (
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {grapes.map((g,i) => <Tag key={i} label={`🍇 ${g}`} color="#a08050" />)}
        </div>
      )}

      {aromas.length > 0 && (
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {aromas.map((a,i) => <Tag key={i} label={`✨ ${a}`} color="#8090a0" />)}
        </div>
      )}

      {pairings.length > 0 && (
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {pairings.map((p,i) => <Tag key={i} label={`🍽 ${p}`} color="#708060" />)}
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}>
        {wine.aging
          ? <span style={{ fontSize:11, color:'#7a6040' }}>📅 {wine.aging}</span>
          : <span />}
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
  { label:'🍷 Bordeaux',  q:'bordeaux'  },
  { label:'🥂 Chablis',   q:'chablis'   },
  { label:'🌹 Barolo',    q:'barolo'    },
  { label:'🌿 Rioja',     q:'rioja'     },
  { label:'🍾 Champagne', q:'champagne' },
  { label:'🌸 Rosé',      q:'rosé'      },
  { label:'🍇 Malbec',    q:'malbec'    },
  { label:'🥂 Sancerre',  q:'sancerre'  },
];

export default function Decouvrir() {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  const handleSearch = useCallback((value) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        setResults(searchBoirLocal(value.trim(), 12));
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
          Recherchez par appellation, cépage, arôme ou pays
        </p>
      </div>

      <div style={{ position:'relative', marginBottom:16 }}>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
          fontSize:18, color:'#7a6040', pointerEvents:'none' }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Bordeaux, Pinot Noir, cerise, Italie…"
          style={{ width:'100%', padding:'13px 40px 13px 44px', boxSizing:'border-box',
            background:'#1a1510', border:'1px solid #3d2f1f', borderRadius:12,
            color:'#e8d5b7', fontSize:15, fontFamily:'Georgia, serif', outline:'none' }}
          autoFocus
        />
        {query && (
          <button onClick={reset}
            style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', color:'#7a6040', cursor:'pointer', fontSize:18, padding:'4px 6px' }}>
            ×
          </button>
        )}
      </div>

      {!searched && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
          {QUICK.map(({ label, q }) => (
            <button key={q} onClick={() => handleSearch(q)}
              style={{ padding:'7px 14px', borderRadius:20, background:'#1a1510',
                border:'1px solid #3d2f1f', color:'#c8b48a', fontSize:13,
                cursor:'pointer', fontFamily:'Georgia, serif' }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {searched && (
        <div>
          <p style={{ color:'#7a6040', fontSize:13, marginBottom:16 }}>
            {results.length > 0
              ? `${results.length} vin${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''} pour « ${query} »`
              : `Aucun vin trouvé pour « ${query} »`}
          </p>
          {results.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'#7a6040' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🍷</div>
              <p style={{ marginBottom:8 }}>Essayez un autre terme : cépage, région, arôme…</p>
              <p style={{ fontSize:13 }}>Ex : « Syrah », « minéral », « Toscane », « épicé »</p>
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {results.map((wine, i) => <WineCard key={i} wine={wine} />)}
          </div>
        </div>
      )}

      {!searched && (
        <div style={{ textAlign:'center', padding:'32px 20px', color:'#5a4030' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🍾</div>
          <p style={{ fontSize:14 }}>Catalogue Boir.be · mis à jour chaque nuit</p>
        </div>
      )}
    </div>
  );
}
