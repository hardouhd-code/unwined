import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { searchBoirLocal } from '../lib/boirCatalog';

// --- DESIGN SYSTEM (Palette claire "Ma Cave") ---
const DESIGN = {
  colors: {
    bg: '#f3efe6',        // Fond principal
    card: '#ffffff',      // Fond des cartes et du champ de recherche
    text: '#452b00',      // Texte principal
    muted: '#806c50',     // Texte secondaire
    accent: '#c8956c',    // Prix et boutons dorés
    border: '#e8e1d5',    // Bordures subtiles
    tag: 'rgba(255,255,255,0.05)', // Pilules
  },
  fonts: {
    serif: "'Georgia', serif",
    sans: 'sans-serif'
  },
  shadow: '0 4px 12px rgba(0,0,0,0.08)',
  borderRadius: {
    input: '12px',
    card: '14px',
    button: '8px',
    flag: '10px'
  }
};

const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Afrique du Sud': '🇿🇦', 'Argentine': '🇦🇷', 'Chili': '🇨🇱', 'Allemagne': '🇩🇪', 'Autriche': '🇦🇹', 'États-Unis': '🇺🇸', 'Grèce': '🇬🇷', 'Georgie': '🇬🇪', 'Belgique': '🇧🇪', 'Australie': '🇦🇺', 'Nouvelle-Zélande': '🇳🇿' };

// Mapping des régions par pays (basé sur ton script de sync)
const REGIONS_BY_COUNTRY = {
  'France': ['Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne', 'Languedoc-Roussillon', 'Provence', 'Beaujolais', 'Corse'],
  'Italie': ['Piémont', 'Toscane', 'Vénétie', 'Sicile', 'Pouilles'],
  'Espagne': ['Rioja', 'Ribera del Duero', 'Priorat', 'Cava'],
  'Portugal': ['Douro', 'Alentejo', 'Dão'],
};

// Icône de bouteille générique (basée sur screen.jpg)
const BOTTLE_ICON = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJhNyA3IDAgMCAxIDcgN3YxNWg0VjhMNyA4djE1SDEyem0wIDJhNyA3IDAgMCAwIDcgN003IDh2MTVoLTRWOEc3IDh6bTAtMnYxNWgtMlY4TDcgNnotbTggMHYxNWg0VjhMNyA4djE1SDEyeiIgZmlsbD0iI2M4OTU2YyIvPjwvc3ZnPg==`;

function WineCard({ wine }) {
  // Utiliser l'image fournie ou l'icône générique
  const imageUrl = wine.image || BOTTLE_ICON;
  
  return (
    <div style={{ background: DESIGN.colors.card, border: `1px solid ${DESIGN.colors.border}`, borderRadius: DESIGN.borderRadius.card, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, boxSizing: 'border-box', boxShadow: DESIGN.shadow }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <img src={imageUrl} alt="" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 6, flexShrink: 0, padding: 4, background: wine.image ? 'transparent' : 'rgba(139,26,26,0.05)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: DESIGN.colors.text, fontFamily: DESIGN.fonts.serif, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{wine.title}</div>
          <div style={{ fontSize: 13, color: DESIGN.colors.muted }}>{(wine.region || 'Vin').toUpperCase()} · {wine.vendor}</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 'bold', color: DESIGN.colors.accent, fontFamily: DESIGN.fonts.serif, flexShrink: 0 }}>{wine.price}€</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: DESIGN.colors.muted, background: DESIGN.colors.border, padding: '3px 10px', borderRadius: 10 }}>
          {FLAGS[wine.country] || '🌐'} {wine.country}
        </span>
        <a href={wine.url} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', borderRadius: DESIGN.borderRadius.button, background: DESIGN.colors.accent, color: '#1a1510', fontSize: 12, textDecoration: 'none', fontWeight: 'bold' }}>Acheter</a>
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
    <div style={{ padding: '20px 16px 100px', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      {/* 1. Recherche (Style Ma Cave) */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input type="text" value={query} onChange={e => handleSearch(e.target.value)} placeholder="Rechercher (ex: Syrah, Margaux...)" 
          style={{ width: '100%', padding: '14px 48px', background: DESIGN.colors.card, border: `1px solid ${DESIGN.colors.border}`, borderRadius: DESIGN.borderRadius.input, color: DESIGN.colors.text, outline: 'none', fontSize: 16, boxSizing: 'border-box', boxShadow: DESIGN.shadow }} 
        />
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: 18 }}>🔍</span>
      </div>

      {/* 2. Filtres Pays (Style "Ma Cave") */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
        {['Tous', ...Object.keys(FLAGS)].map(c => (
          <button key={c} onClick={() => setCountry(c)} 
            style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 20, fontSize: 13, background: country === c ? DESIGN.colors.accent : DESIGN.colors.card, color: country === c ? '#1a1510' : DESIGN.colors.muted, border: `1px solid ${country === c ? DESIGN.colors.accent : DESIGN.colors.border}`, cursor: 'pointer' }}>
            {c}
          </button>
        ))}
      </div>

      {/* 3. Filtres Régions (Apparaissent si pays sélectionné) */}
      {country !== 'Tous' && REGIONS_BY_COUNTRY[country] && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0 12px', borderTop: `1px solid ${DESIGN.colors.border}`, marginTop: 4, scrollbarWidth: 'none' }}>
          {['Toutes', ...REGIONS_BY_COUNTRY[country]].map(r => (
            <button key={r} onClick={() => setRegion(r)} 
              style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, fontSize: 12, background: region === r ? DESIGN.colors.accent : 'transparent', color: region === r ? '#1a1510' : DESIGN.colors.muted, border: `1px solid ${region === r ? DESIGN.colors.accent : 'transparent'}`, cursor: 'pointer' }}>
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* 4. Filtres Prix (Style Ma Cave) */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 8, scrollbarWidth: 'none' }}>
        {['all', 'under25', '25to50', 'above50'].map(id => (
          <button key={id} onClick={() => setPrice(id)} 
            style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 12, fontSize: 12, background: price === id ? DESIGN.colors.accent : DESIGN.colors.card, color: price === id ? '#1a1510' : DESIGN.colors.muted, border: `1px solid ${price === id ? DESIGN.colors.accent : DESIGN.colors.border}`, cursor: 'pointer' }}>
            {id==='all'?'Tous les prix':id==='under25'?'< 25€':id==='25to50'?'25-50€':'50€ +'}
          </button>
        ))}
      </div>

      {/* Résultats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <span style={{ color: DESIGN.colors.muted, fontSize: 13 }}>{processed.length} vins trouvés</span>
        <button onClick={() => setSort(sort==='asc'?'desc':'asc')} style={{ background: DESIGN.colors.card, border: `1px solid ${DESIGN.colors.border}`, color: DESIGN.colors.text, padding: '6px 12px', borderRadius: 8, fontSize: 12 }}>
          Prix {sort==='asc'?'↗':'↘'}
        </button>
      </div>

      {searched && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {processed.map((w,i) => <WineCard key={i} wine={w} />)}
        </div>
      )}
    </div>
  );
}
