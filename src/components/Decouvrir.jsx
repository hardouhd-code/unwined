import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { searchBoirLocal } from '../lib/boirCatalog';

const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Afrique du Sud': '🇿🇦', 'Argentine': '🇦🇷', 'Chili': '🇨🇱', 'Allemagne': '🇩🇪', 'Autriche': '🇦🇹', 'États-Unis': '🇺🇸', 'Grèce': '🇬🇷', 'Georgie': '🇬🇪', 'Belgique': '🇧🇪', 'Australie': '🇦🇺', 'Nouvelle-Zélande': '🇳🇿' };

// Mapping des régions par pays (basé sur ton script de sync)
const REGIONS_BY_COUNTRY = {
  'France': ['Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne', 'Languedoc-Roussillon', 'Provence', 'Beaujolais', 'Corse'],
  'Italie': ['Piémont', 'Toscane', 'Vénétie', 'Sicile', 'Pouilles'],
  'Espagne': ['Rioja', 'Ribera del Duero', 'Priorat', 'Cava'],
  'Portugal': ['Douro', 'Alentejo', 'Dão'],
};

const TYPE_COLOR = { rouge: { border: 'rgba(139,26,26,0.4)', text: '#c87070' }, blanc: { border: 'rgba(200,180,80,0.35)', text: '#c8b448' } };

function WineCard({ wine }) {
  const colors = TYPE_COLOR[wine.type] || TYPE_COLOR.rouge;
  return (
    <div style={{ background:'#1a1510', border:`1px solid ${colors.border}`, borderRadius:14, padding:'16px', display:'flex', flexDirection:'column', gap:10, boxSizing:'border-box' }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <img src={wine.image || ''} alt="" style={{ width:48, height:48, objectFit:'contain', borderRadius:6, background:'#0f0c09', flexShrink:0 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:'bold', color:'#e8d5b7', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{wine.title}</div>
          <div style={{ fontSize:12, color:'#9a7d5a' }}>{wine.region} · {wine.vendor}</div>
        </div>
        <div style={{ fontSize:16, fontWeight:'bold', color:colors.text, flexShrink:0 }}>{wine.price}€</div>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:10, color:'#7a6040', background:'rgba(255,255,255,0.05)', padding:'3px 10px', borderRadius:10 }}>
          {FLAGS[wine.country] || '🌐'} {wine.country}
        </span>
        <a href={wine.url} target="_blank" rel="noopener noreferrer" style={{ padding:'6px 12px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:`1px solid ${colors.border}`, color:colors.text, fontSize:12, textDecoration:'none', fontWeight:'bold' }}>Acheter</a>
      </div>
    </div>
  );
}

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  
  // États de filtres
  const [country, setCountry] = useState('Tous');
  const [region, setRegion] = useState('Toutes');
  const [price, setPrice] = useState('all');
  const [sort, setSort] = useState('asc');

  // Reset la région quand on change de pays
  useEffect(() => { setRegion('Toutes'); }, [country]);

  const processed = useMemo(() => {
    let list = results.filter(w => {
      const mPrice = price === 'under25' ? w.price < 25 : price === '25to50' ? (w.price >= 25 && w.price <= 50) : price === 'above50' ? w.price > 50 : true;
      const mCountry = country === 'Tous' || w.country === country;
      const mRegion = region === 'Toutes' || w.region === region;
      return mPrice && mCountry && mRegion;
    });
    return list.sort((a,b) => sort === 'asc' ? a.price - b.price : b.price - a.price);
  }, [results, price, country, region, sort]);

  const handleSearch = (v) => {
    setQuery(v);
    if (v.trim().length >= 2) { setResults(searchBoirLocal(v.trim(), 500)); setSearched(true); }
    else { setResults([]); setSearched(false); }
  };

  return (
    <div style={{ padding:'20px 16px 100px', maxWidth:'100%', boxSizing:'border-box', overflowX:'hidden' }}>
      
      {/* 1. Recherche */}
      <div style={{ position:'relative', marginBottom:16 }}>
        <input type="text" value={query} onChange={e => handleSearch(e.target.value)} placeholder="Rechercher (ex: Bordeaux, Syrah...)" 
          style={{ width:'100%', padding:'13px 44px', background:'#1a1510', border:'1px solid #3d2f1f', borderRadius:12, color:'#e8d5b7', outline:'none', fontSize:16, boxSizing:'border-box' }} 
        />
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}>🔍</span>
      </div>

      {/* 2. Filtres Pays */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:10, scrollbarWidth:'none' }}>
        {['Tous', ...Object.keys(FLAGS)].map(c => (
          <button key={c} onClick={() => setCountry(c)} 
            style={{ flexShrink:0, padding:'8px 16px', borderRadius:20, fontSize:13, background: country === c ? '#c8956c' : '#1a1510', color: country === c ? '#1a1510' : '#c8b48a', border: `1px solid ${country === c ? '#c8956c' : '#3d2f1f'}`, cursor:'pointer' }}>
            {c}
          </button>
        ))}
      </div>

      {/* 3. Filtres Régions (Apparaissent si pays sélectionné) */}
      {country !== 'Tous' && REGIONS_BY_COUNTRY[country] && (
        <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'4px 0 12px', borderTop:'1px solid #2a2015', marginTop:4, scrollbarWidth:'none' }}>
          {['Toutes', ...REGIONS_BY_COUNTRY[country]].map(r => (
            <button key={r} onClick={() => setRegion(r)} 
              style={{ flexShrink:0, padding:'6px 12px', borderRadius:8, fontSize:12, background: region === r ? '#4a3a2a' : 'transparent', color: region === r ? '#e8d5b7' : '#9a7d5a', border: `1px solid ${region === r ? '#c8956c' : '#3d2f1f'}`, cursor:'pointer' }}>
              {r}
            </button>
          ))}
        </div>
      )}

      {/* 4. Filtres Prix */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:12, marginBottom:8, scrollbarWidth:'none' }}>
        {['all', 'under25', '25to50', 'above50'].map(id => (
          <button key={id} onClick={() => setPrice(id)} 
            style={{ flexShrink:0, padding:'8px 16px', borderRadius:12, fontSize:12, background: price === id ? '#3d2f1f' : '#1a1510', color: price === id ? '#e8d5b7' : '#7a6040', border: `1px solid ${price === id ? '#c8956c' : '#3d2f1f'}`, cursor:'pointer' }}>
            {id==='all'?'Tous les prix':id==='under25'?'< 25€':id==='25to50'?'25-50€':'50€ +'}
          </button>
        ))}
      </div>

      {/* Résultats */}
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16, alignItems:'center' }}>
        <span style={{ color:'#7a6040', fontSize:12 }}>{processed.length} vins trouvés</span>
        <button onClick={() => setSort(sort==='asc'?'desc':'asc')} style={{ background:'#1a1510', border:'1px solid #3d2f1f', color:'#c8b48a', padding:'6px 12px', borderRadius:8, fontSize:12 }}>
          Prix {sort==='asc'?'↗':'↘'}
        </button>
      </div>

      {searched && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {processed.map((w,i) => <WineCard key={i} wine={w} />)}
        </div>
      )}
    </div>
  );
}
