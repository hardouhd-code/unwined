import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { searchBoirLocal } from '../lib/boirCatalog';

const TOKENS = {
  bg: '#001710',
  surface: '#00251a',
  surfaceHigh: '#083025',
  primary: '#ffb94f',
  onBackground: '#c3ebda',
  muted: 'rgba(195, 235, 218, 0.6)',
  fonts: { serif: "'Noto Serif', serif", sans: "'Manrope', sans-serif" }
};

const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Afrique du Sud': '🇿🇦', 'Argentine': '🇦🇷', 'Chili': '🇨🇱', 'Allemagne': '🇩🇪', 'Autriche': '🇦🇹', 'États-Unis': '🇺🇸', 'Grèce': '🇬🇷', 'Georgie': '🇬🇪', 'Belgique': '🇧🇪', 'Australie': '🇦🇺', 'Nouvelle-Zélande': '🇳🇿' };

function WineCard({ wine }) {
  if (!wine) return null;
  return (
    <article style={{ background: TOKENS.surface, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Prix stylisé */}
      <div style={{ position: 'absolute', top: 24, right: 20, color: TOKENS.primary, fontSize: 20, fontWeight: '800', fontFamily: TOKENS.fonts.serif }}>
        €{wine.price?.toFixed(2)}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <img src={wine.image || ''} alt="" style={{ width: 80, height: 110, objectFit: 'contain', background: 'transparent', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
             <span className="material-symbols-outlined" style={{ fontSize: 12, color: TOKENS.muted }}>flag</span>
             <span style={{ fontSize: 10, color: TOKENS.muted, textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '600' }}>
               {wine.region?.toUpperCase()}, {wine.country?.toUpperCase()}
             </span>
          </div>
          <h2 style={{ fontSize: 22, color: TOKENS.onBackground, margin: 0, fontFamily: TOKENS.fonts.serif, fontWeight: '700', lineHeight: 1.2 }}>
            {wine.title}
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: TOKENS.surfaceHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: 14 }}>{FLAGS[wine.country] || '🍷'}</span>
          </div>
          <span style={{ fontSize: 10, color: TOKENS.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{wine.vendor}</span>
        </div>
        <a href={wine.url} target="_blank" rel="noopener noreferrer" style={{ background: 'linear-gradient(135deg, #ffb94f 0%, #e09e34 100%)', color: '#452b00', padding: '10px 32px', textDecoration: 'none', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
          Buy
        </a>
      </div>
    </article>
  );
}

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = (v) => {
    setQuery(v);
    if (v.trim().length >= 2) {
      const data = searchBoirLocal(v.trim(), 500);
      setResults(data || []);
      setSearched(true);
    } else {
      setResults([]);
      setSearched(false);
    }
  };

  return (
    <div style={{ background: TOKENS.bg, minHeight: '100vh', boxSizing: 'border-box', color: TOKENS.onBackground, fontFamily: TOKENS.fonts.sans }}>
      
      {/* Top Bar */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 70, background: TOKENS.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', zIndex: 1000, borderBottom: '1px solid rgba(8,48,37,0.4)' }}>
        <span className="material-symbols-outlined" style={{ color: TOKENS.primary }}>search</span>
        <h1 style={{ fontFamily: TOKENS.fonts.serif, fontSize: 24, fontWeight: '700', color: TOKENS.primary, fontStyle: 'italic', letterSpacing: '0.1em' }}>Unwine-D</h1>
        <span className="material-symbols-outlined" style={{ color: TOKENS.primary }}>monitoring</span>
      </header>

      <main style={{ pt: 90, padding: '90px 0 100px' }}>
        {/* Barre de Recherche */}
        <div style={{ padding: '0 20px', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
             <span style={{ fontSize: 13, fontFamily: TOKENS.fonts.serif, fontStyle: 'italic', opacity: 0.7 }}>
               {searched ? `${results.length}+ Results Found` : 'Start exploring...'}
             </span>
             <span className="material-symbols-outlined" style={{ color: TOKENS.primary }}>tune</span>
          </div>
          <input 
            type="text" value={query} onChange={e => handleSearch(e.target.value)} 
            placeholder="Search a domain, a grape..." 
            style={{ width: '100%', padding: '16px 0', background: 'transparent', border: 'none', borderBottom: `1px solid ${TOKENS.muted}`, color: TOKENS.onBackground, fontSize: 18, outline: 'none', fontFamily: TOKENS.fonts.serif }} 
          />
        </div>

        {/* Liste des Vins */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {results.map((w, i) => <WineCard key={i} wine={w} />)}
        </div>
      </main>

      {/* Nav Bas */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 80, background: 'rgba(8,48,37,0.7)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: '1px solid rgba(81,69,54,0.15)', zIndex: 1000, paddingBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'rgba(195,235,218,0.6)' }}>
          <span className="material-symbols-outlined">explore</span>
          <span style={{ fontSize: 9, marginTop: 4, letterSpacing: '0.1em' }}>DISCOVERY</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: TOKENS.primary }}>
          <span className="material-symbols-outlined">search</span>
          <span style={{ fontSize: 9, marginTop: 4, letterSpacing: '0.1em', fontWeight: '800' }}>SEARCH</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'rgba(195,235,218,0.6)' }}>
          <span className="material-symbols-outlined">inventory_2</span>
          <span style={{ fontSize: 9, marginTop: 4, letterSpacing: '0.1em' }}>CELLAR</span>
        </div>
      </nav>
    </div>
  );
}
