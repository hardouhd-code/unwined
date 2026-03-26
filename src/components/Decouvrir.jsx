import React, { useState } from 'react';
import * as CatalogModule from '../lib/boirCatalog';

const THEME = {
  bg: '#001710',
  surface: '#00251b',
  primary: '#ffb94f',
  text: '#c3ebda',
  muted: 'rgba(195, 235, 218, 0.4)',
  serif: "'Noto Serif', serif",
  sans: "'Manrope', sans-serif"
};

export function Decouvrir() {
  const [query, setQuery] = useState('');
  // Sécurité : on vérifie si le catalogue existe, sinon on prend une liste vide
  const catalog = CatalogModule.BOIR_CATALOG || [];
  const searchFn = CatalogModule.searchBoirLocal || (() => []);

  const results = query.length >= 2 ? searchFn(query) : [];

  return (
    <div style={{ background: THEME.bg, minHeight: '100vh', color: THEME.text, fontFamily: THEME.sans, padding: '20px' }}>
      
      {/* HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '20px' }}>
        <h1 style={{ fontFamily: THEME.serif, color: THEME.primary, fontSize: '28px', margin: 0, fontStyle: 'italic' }}>Unwine-D</h1>
        <p style={{ fontSize: '12px', opacity: 0.6, letterSpacing: '2px', textTransform: 'uppercase' }}>The Digital Cellar</p>
      </header>

      {/* RECHERCHE */}
      <div style={{ marginBottom: '40px' }}>
        <input 
          type="text" 
          placeholder="Rechercher une pépite..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${THEME.muted}`,
            color: THEME.text, fontSize: '20px', padding: '10px 0', outline: 'none', fontFamily: THEME.serif
          }}
        />
        <p style={{ fontSize: '12px', color: THEME.muted, marginTop: '10px' }}>
          {catalog.length > 0 ? `${catalog.length} vins disponibles` : "Chargement du catalogue..."}
        </p>
      </div>

      {/* LISTE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {results.map((wine, i) => (
          <div key={i} style={{ background: THEME.surface, padding: '20px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontFamily: THEME.serif }}>{wine.t}</h3>
              <p style={{ margin: '4px 0', fontSize: '12px', color: THEME.primary }}>{wine.v}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '800', fontSize: '18px', color: THEME.primary, marginBottom: '8px' }}>{wine.p}€</div>
              <a href={wine.u} target="_blank" rel="noreferrer" style={{ background: THEME.primary, color: THEME.bg, padding: '6px 15px', borderRadius: '2px', fontSize: '11px', fontWeight: '800', textDecoration: 'none' }}>BUY</a>
            </div>
          </div>
        ))}
      </div>

      {/* NAV BAS */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px', background: 'rgba(0,23,16,0.9)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ color: THEME.primary, textAlign: 'center' }}>
          <span className="material-symbols-outlined">search</span>
          <div style={{ fontSize: '9px' }}>SEARCH</div>
        </div>
        <div style={{ color: THEME.muted, textAlign: 'center' }}>
          <span className="material-symbols-outlined">inventory_2</span>
          <div style={{ fontSize: '9px' }}>CELLAR</div>
        </div>
      </nav>
    </div>
  );
}
