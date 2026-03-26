import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { searchBoirLocal } from '../lib/boirCatalog';

// --- CONFIGURATION DU DESIGN SYSTEM (Strictement selon DESIGN.md) ---
const TOKENS = {
  bg: '#001710',           // Deep atmospheric green
  surface: '#00251a',      // surface-container
  surfaceHigh: '#083025',  // surface-container-high
  primary: '#ffb94f',      // Sun-drenched gold
  onBackground: '#c3ebda', // Soft mint text
  muted: 'rgba(195, 235, 218, 0.6)',
  fonts: {
    serif: "'Noto Serif', serif",
    sans: "'Manrope', sans-serif"
  }
};

const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Afrique du Sud': '🇿🇦', 'Argentine': '🇦🇷', 'Chili': '🇨🇱', 'Allemagne': '🇩🇪', 'Autriche': '🇦🇹', 'États-Unis': '🇺🇸', 'Grèce': '🇬🇷', 'Georgie': '🇬🇪', 'Belgique': '🇧🇪', 'Australie': '🇦🇺', 'Nouvelle-Zélande': '🇳🇿' };

const REGIONS_BY_COUNTRY = {
  'France': ['Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne', 'Languedoc-Roussillon', 'Provence', 'Beaujolais', 'Corse'],
  'Italie': ['Piémont', 'Toscane', 'Vénétie', 'Sicile', 'Pouilles'],
  'Espagne': ['Rioja', 'Ribera del Duero', 'Priorat', 'Cava'],
  'Portugal': ['Douro', 'Alentejo', 'Dão'],
};

// --- COMPOSANTS INTERNES ---

function WineCard({ wine }) {
  return (
    <div style={{ 
      background: TOKENS.surface, borderRadius: 4, padding: '20px', 
      display: 'flex', flexDirection: 'column', gap: 16, boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* Prix flottant - Style Sommelier */}
      <div style={{ 
        position: 'absolute', top: 0, right: 0, background: TOKENS.primary, 
        color: '#680017', padding: '4px 12px', fontWeight: '800', 
        fontFamily: TOKENS.fonts.sans, fontSize: 14 
      }}>
        {wine.price}€
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <img src={wine.image || ''} alt="" style={{ width: 64, height: 64, objectFit: 'contain', background: TOKENS.bg }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ 
            fontSize: 16, color: TOKENS.onBackground, margin: 0, 
            fontFamily: TOKENS.fonts.serif, fontWeight: '700' 
          }}>{wine.title}</h3>
          <p style={{ 
            fontSize: 12, color: TOKENS.muted, margin: '4px 0 0', 
            fontFamily: TOKENS.fonts.sans, letterSpacing: '0.05em' 
          }}>
            {FLAGS[wine.country] || '🌐'} {wine.country.toUpperCase()} · {wine.region.toUpperCase()}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid rgba(255,255,255,0.05)`, paddingTop: 12 }}>
        <span style={{ fontSize: 11, color: TOKENS.primary, fontWeight: '700', fontFamily: TOKENS.fonts.sans }}>{wine.vendor}</span>
        <a href={wine.url} target="_blank" rel="noopener noreferrer" style={{ 
          color: TOKENS.primary, textDecoration: 'none', fontSize: 12, 
          fontWeight: '800', fontFamily: TOKENS.fonts.sans, borderBottom: `2px solid ${TOKENS.primary}`
        }}>COMMANDER</a>
      </div>
    </div>
  );
}

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [country, setCountry] = useState('Tous');
  const [region, setRegion] = useState('Toutes');
  const [price, setPrice] = useState('all');
  const [sort, setSort] = useState('asc');

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
    <div style={{ 
      background: TOKENS.bg, minHeight: '100vh', padding: '24px 16px 120px', 
      boxSizing: 'border-box', color: TOKENS.onBackground, fontFamily: TOKENS.fonts.sans 
    }}>
      
      {/* Header Editorial */}
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ 
          fontFamily: TOKENS.fonts.serif, fontSize: 32, fontWeight: '700', 
          color: TOKENS.primary, margin: '0 0 8px' 
        }}>La Cave Digitale</h1>
        <p style={{ color: TOKENS.muted, fontSize: 14, maxWidth: '80%' }}>
          Une sélection de {processed.length} pépites sourcées pour vous.
        </p>
      </header>

      {/* Barre de recherche "Invisible" */}
      <div style={{ marginBottom: 24 }}>
        <input 
          type="text" value={query} onChange={e => handleSearch(e.target.value)} 
          placeholder="Rechercher un domaine, un cépage..." 
          style={{ 
            width: '100%', padding: '16px 0', background: 'transparent', 
            border: 'none', borderBottom: `1px solid ${TOKENS.muted}`, 
            color: TOKENS.onBackground, fontSize: 18, outline: 'none', fontFamily: TOKENS.fonts.serif 
          }} 
        />
      </div>

      {/* Filtres Pays - Style Minimal Pills */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'none' }}>
        {['Tous', ...Object.keys(FLAGS)].map(c => (
          <button key={c} onClick={() => setCountry(c)} style={{
            flexShrink: 0, padding: '8px 20px', borderRadius: 2, fontSize: 12, fontWeight: '700',
            background: country === c ? TOKENS.primary : TOKENS.surfaceHigh,
            color: country === c ? TOKENS.bg : TOKENS.onBackground,
            border: 'none', cursor: 'pointer', transition: '0.2s'
          }}>
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Régions Dynamiques */}
      {country !== 'Tous' && REGIONS_BY_COUNTRY[country] && (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 20 }}>
          {['Toutes', ...REGIONS_BY_COUNTRY[country]].map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{
              flexShrink: 0, background: 'transparent', border: 'none',
              color: region === r ? TOKENS.primary : TOKENS.muted,
              fontSize: 13, fontWeight: '700', cursor: 'pointer',
              borderBottom: region === r ? `2px solid ${TOKENS.primary}` : 'none'
            }}>
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Tri et Prix */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <select value={price} onChange={e => setPrice(e.target.value)} style={{
          flex: 1, background: TOKENS.surfaceHigh, color: TOKENS.onBackground, 
          padding: '12px', border: 'none', borderRadius: 2, fontSize: 12, fontWeight: '700'
        }}>
          <option value="all">TOUS LES PRIX</option>
          <option value="under25">&lt; 25€</option>
          <option value="25to50">25€ - 50€</option>
          <option value="above50">PRESTIGE (50€+)</option>
        </select>
        <button onClick={() => setSort(sort==='asc'?'desc':'asc')} style={{
          background: TOKENS.surfaceHigh, color: TOKENS.primary, padding: '12px 20px', 
          border: 'none', borderRadius: 2, fontSize: 12, fontWeight: '800'
        }}>
          {sort === 'asc' ? 'PRIX ↗' : 'PRIX ↘'}
        </button>
      </div>

      {/* Liste des Vins */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {processed.map((w, i) => <WineCard key={i} wine={w} />)}
      </div>

      {/* Bottom Nav - Style "Digital Cellar" */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 75,
        background: 'rgba(0, 37, 26, 0.95)', borderTop: `1px solid rgba(255,219,179,0.1)`,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        backdropFilter: 'blur(10px)', zIndex: 1000
      }}>
        <div style={{ color: TOKENS.primary, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span className="material-symbols-outlined">explore</span>
          <span style={{ fontSize: 10, marginTop: 4, fontWeight: '700' }}>DECOUVRIR</span>
        </div>
        <div style={{ color: TOKENS.muted, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span className="material-symbols-outlined">inventory_2</span>
          <span style={{ fontSize: 10, marginTop: 4, fontWeight: '700' }}>MA CAVE</span>
        </div>
      </nav>
    </div>
  );
}
