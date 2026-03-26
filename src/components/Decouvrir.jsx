import { useState, useCallback, useRef, useMemo } from 'react';
import { searchBoirLocal } from '../lib/boirCatalog';

const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Afrique du Sud': '🇿🇦', 'Argentine': '🇦🇷', 'Chili': '🇨🇱', 'Allemagne': '🇩🇪', 'Autriche': '🇦🇹', 'États-Unis': '🇺🇸', 'Grèce': '🇬🇷', 'Georgie': '🇬🇪', 'Belgique': '🇧🇪', 'Australie': '🇦🇺', 'Nouvelle-Zélande': '🇳🇿', 'Luxembourg': '🇱🇺', 'Norvège': '🇳🇴' };
const COUNTRIES = ['Tous', ...Object.keys(FLAGS)];
const TYPE_COLOR = { rouge: { bg: 'rgba(139,26,26,0.15)', border: 'rgba(139,26,26,0.4)', text: '#c87070' }, blanc: { bg: 'rgba(200,180,80,0.12)', border: 'rgba(200,180,80,0.35)', text: '#c8b448' } };

function WineCard({ wine }) {
  const colors = TYPE_COLOR[wine.type] || TYPE_COLOR.rouge;
  return (
    <div style={{ background:'#1a1510', border:`1px solid ${colors.border}`, borderRadius:14, padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <img src={wine.image || ''} alt="" style={{ width:48, height:48, objectFit:'contain', borderRadius:6, background:'#0f0c09' }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:'bold', color:'#e8d5b7' }}>{wine.title}</div>
          <div style={{ fontSize:12, color:'#9a7d5a' }}>{wine.region} · {wine.vendor}</div>
        </div>
        <div style={{ fontSize:16, fontWeight:'bold', color:colors.text }}>{wine.price}€</div>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:10, color:'#7a6040', background:'rgba(255,255,255,0.05)', padding:'3px 10px', borderRadius:10 }}>
          {FLAGS[wine.country] || '🌐'} {wine.country} · {wine.region}
        </span>
        <a href={wine.url} target="_blank" rel="noopener noreferrer" style={{ padding:'6px 12px', borderRadius:8, background:colors.bg, border:`1px solid ${colors.border}`, color:colors.text, fontSize:12, textDecoration:'none', fontWeight:'bold' }}>Commander →</a>
      </div>
    </div>
  );
}

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [country, setCountry] = useState('Tous');
  const [price, setPrice] = useState('all');
  const [sort, setSort] = useState('asc');

  const processed = useMemo(() => {
    let list = results.filter(w => {
      const mPrice = price === 'under25' ? w.price < 25 : price === '25to50' ? (w.price >= 25 && w.price <= 50) : price === 'above50' ? w.price > 50 : true;
      const mCountry = country === 'Tous' || w.country === country;
      return mPrice && mCountry;
    });
    return list.sort((a,b) => sort === 'asc' ? a.price - b.price : b.price - a.price);
  }, [results, price, country, sort]);

  const handleSearch = (v) => {
    setQuery(v);
    if (v.trim().length >= 2) { setResults(searchBoirLocal(v.trim(), 500)); setSearched(true); }
    else { setResults([]); setSearched(false); }
  };

  return (
    <div style={{ padding:'20px 16px', maxWidth:700, margin:'0 auto', fontFamily:'Georgia, serif' }}>
      <div style={{ position:'relative', marginBottom:12 }}>
        <input type="text" value={query} onChange={e => handleSearch(e.target.value)} placeholder="Région, cépage..." style={{ width:'100%', padding:'13px 44px', background:'#1a1510', border:'1px solid #3d2f1f', borderRadius:12, color:'#e8d5b7', outline:'none' }} />
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}>🔍</span>
      </div>
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:12, scrollbarWidth:'none' }}>
        {COUNTRIES.map(c => <button key={c} onClick={() => setCountry(c)} style={{ padding:'6px 14px', borderRadius:20, whiteSpace:'nowrap', fontSize:12, background: country === c ? '#c8956c' : '#1a1510', color: country === c ? '#1a1510' : '#c8b48a', border: `1px solid ${country === c ? '#c8956c' : '#3d2f1f'}` }}>{c}</button>)}
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {['all', 'under25', '25to50', 'above50'].map(id => <button key={id} onClick={() => setPrice(id)} style={{ flex:1, padding:'6px 8px', borderRadius:10, fontSize:11, background: price === id ? '#3d2f1f' : 'transparent', color: price === id ? '#e8d5b7' : '#7a6040', border: `1px solid ${price === id ? '#c8956c' : '#3d2f1f'}` }}>{id==='all'?'Prix':id==='under25'?'<25€':id==='25to50'?'25-50€':'50€+'}</button>)}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
        <span style={{ color:'#7a6040', fontSize:12 }}>{processed.length} vins trouvés</span>
        <button onClick={() => setSort(sort==='asc'?'desc':'asc')} style={{ background:'#1a1510', border:'1px solid #3d2f1f', color:'#c8b48a', padding:'4px 10px', borderRadius:8, fontSize:11 }}>Prix {sort==='asc'?'↗':'↘'}</button>
      </div>
      {searched && <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{processed.map((w,i) => <WineCard key={i} wine={w} />)}</div>}
    </div>
  );
}
