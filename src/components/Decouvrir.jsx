import { useState, useCallback, useRef, useMemo } from 'react';
import { searchBoirLocal } from '../lib/boirCatalog';

const TYPE_EMOJI = { rouge: '🍷', blanc: '🥂', rosé: '🌸', effervescent: '🍾', doux: '🍯' };
const TYPE_COLOR = {
  rouge:        { bg: 'rgba(139,26,26,0.15)',   border: 'rgba(139,26,26,0.4)',   text: '#c87070' },
  blanc:        { bg: 'rgba(200,180,80,0.12)',   border: 'rgba(200,180,80,0.35)', text: '#c8b448' },
  rosé:         { bg: 'rgba(200,100,120,0.12)',  border: 'rgba(200,100,120,0.35)',text: '#c87090' },
  effervescent: { bg: 'rgba(100,160,200,0.12)', border: 'rgba(100,160,200,0.35)',text: '#70a8c8' },
  doux:         { bg: 'rgba(180,140,60,0.15)',   border: 'rgba(180,140,60,0.4)', text: '#c8a848' },
};

function WineCard({ wine }) {
  const colors = TYPE_COLOR[wine.type] || TYPE_COLOR.rouge;
  const emoji = TYPE_EMOJI[wine.type] || '🍷';
  return (
    <div style={{ 
      background:'#1a1510', border:`1px solid ${colors.border}`, borderRadius:14,
      padding:'16px', display:'flex', flexDirection:'column', gap:10 
    }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        {wine.image ? (
          <img src={wine.image} alt={wine.title} style={{ width:48, height:48, objectFit:'contain', borderRadius:6, background:'#0f0c09' }} />
        ) : (
          <div style={{ width:48, height:48, borderRadius:6, background:colors.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>{emoji}</div>
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:'bold', color:'#e8d5b7', lineHeight:1.3 }}>{wine.title}</div>
          <div style={{ fontSize:12, color:'#9a7d5a', marginTop:2 }}>{wine.region} · {wine.vendor}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:16, fontWeight:'bold', color:colors.text }}>{wine.price}€</div>
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
        <span style={{ fontSize:11, color:'#7a6040', background:'rgba(255,255,255,0.05)', padding:'2px 8px', borderRadius:10 }}>📍 {wine.region}</span>
        <a href={wine.url} target="_blank" rel="noopener noreferrer" style={{ 
          padding:'6px 12px', borderRadius:8, background:colors.bg, border:`1px solid ${colors.border}`, 
          color:colors.text, fontSize:12, textDecoration:'none', fontWeight:'bold' 
        }}>Commander →</a>
      </div>
    </div>
  );
}

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [priceRange, setPriceRange] = useState('all');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' ou 'desc'
  const debounceRef = useRef(null);

  // LOGIQUE : Filtre + Tri combinés
  const processedResults = useMemo(() => {
    let list = results.filter(wine => {
      if (priceRange === 'under25') return wine.price < 25;
      if (priceRange === '25to50') return wine.price >= 25 && wine.price <= 50;
      if (priceRange === 'above50') return wine.price > 50;
      return true;
    });

    return list.sort((a, b) => {
      return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    });
  }, [results, priceRange, sortOrder]);

  const handleSearch = useCallback((value) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        setResults(searchBoirLocal(value.trim(), 500));
        setSearched(true);
      } else {
        setResults([]);
        setSearched(false);
      }
    }, 200);
  }, []);

  return (
    <div style={{ padding:'20px 16px', maxWidth:700, margin:'0 auto', fontFamily:'Georgia, serif' }}>
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <h2 style={{ fontSize:22, color:'#c8956c', margin:'0 0 6px' }}>Découvrir</h2>
        <p style={{ color:'#7a6040', fontSize:13 }}>Le catalogue complet de Boir.be (891 vins)</p>
      </div>

      <div style={{ position:'relative', marginBottom:16 }}>
        <input
          type="text" value={query} onChange={e => handleSearch(e.target.value)}
          placeholder="Recherchez une région, un château..."
          style={{ 
            width:'100%', padding:'13px 44px', background:'#1a1510', border:'1px solid #3d2f1f', 
            borderRadius:12, color:'#e8d5b7', fontSize:15, outline:'none' 
          }}
        />
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}>🔍</span>
      </div>

      {/* FILTRES PRIX */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8, marginBottom:8 }}>
        {['all', 'under25', '25to50', 'above50'].map(id => (
          <button key={id} onClick={() => setPriceRange(id)} style={{
            padding:'6px 14px', borderRadius:20, whiteSpace:'nowrap', fontSize:12, cursor:'pointer',
            background: priceRange === id ? '#c8956c' : '#1a1510',
            color: priceRange === id ? '#1a1510' : '#c8b48a',
            border: `1px solid ${priceRange === id ? '#c8956c' : '#3d2f1f'}`,
          }}>
            {id === 'all' ? 'Tous' : id === 'under25' ? '< 25€' : id === '25to50' ? '25-50€' : '50€+'}
          </button>
        ))}
      </div>

      {/* OPTIONS DE TRI */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, borderTop:'1px solid #3d2f1f', paddingTop:12 }}>
        <span style={{ color:'#7a6040', fontSize:12 }}>{processedResults.length} vins trouvés</span>
        <div style={{ display:'flex', gap:4 }}>
           <button onClick={() => setSortOrder('asc')} style={{ 
             background: sortOrder === 'asc' ? '#3d2f1f' : 'transparent', border:'none', color:'#c8b48a', 
             padding:'4px 8px', borderRadius:6, fontSize:11, cursor:'pointer' 
           }}>Prix ↗</button>
           <button onClick={() => setSortOrder('desc')} style={{ 
             background: sortOrder === 'desc' ? '#3d2f1f' : 'transparent', border:'none', color:'#c8b48a', 
             padding:'4px 8px', borderRadius:6, fontSize:11, cursor:'pointer' 
           }}>Prix ↘</button>
        </div>
      </div>

      {searched && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {processedResults.map((wine, i) => <WineCard key={i} wine={wine} />)}
        </div>
      )}
    </div>
  );
}
