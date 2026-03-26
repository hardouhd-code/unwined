import React, { useState, useMemo } from 'react';
// Import sécurisé pour éviter de faire planter l'app si le fichier est vide
import * as CatalogData from '../lib/boirCatalog';

const THEME = {
  bg: '#001710',
  surface: '#00251b',
  primary: '#ffb94f',
  onSurface: '#c3ebda',
  muted: 'rgba(195, 235, 218, 0.4)',
  serif: "'Noto Serif', serif",
  sans: "'Manrope', sans-serif"
};

export function Decouvrir() {
  const [query, setQuery] = useState('');
  
  // Sécurisation : On vérifie si les exports existent avant de les utiliser
  const catalog = CatalogData.BOIR_CATALOG || [];
  const searchFn = CatalogData.searchBoirLocal || (() => []);

  // On s'assure que results est toujours un tableau
  const results = useMemo(() => {
    if (query.length < 2) return [];
    try {
      const found = searchFn(query);
      return Array.isArray(found) ? found : [];
    } catch (e) {
      console.error("Erreur de recherche:", e);
      return [];
    }
  }, [query, searchFn]);

  return (
    <div style={{ background: THEME.bg, minHeight: '100vh', color: THEME.onSurface, fontFamily: THEME.sans, padding: '20px', boxSizing: 'border-box' }}>
      
      {/* HEADER VISIBLE */}
      <header style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '20px' }}>
        <h1 style={{ fontFamily: THEME.serif, color: THEME.primary, fontSize: '32px', margin: 0, fontStyle: 'italic', fontWeight: '700' }}>
          Unwine-D
        </h1>
        <p style={{ fontSize: '10px', color: THEME.muted, letterSpacing: '3px', textTransform: 'uppercase', marginTop: '4px' }}>
          THE DIGITAL CELLAR
        </p>
      </header>

      {/* RECHERCHE */}
      <div style={{ marginBottom: '32px' }}>
        <input 
          type="text" 
          placeholder="Rechercher une pépite..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${THEME.muted}`,
            color: THEME.onSurface, fontSize: '20px', padding: '12px 0', outline: 'none', fontFamily: THEME.serif
          }}
        />
        <div style={{ fontSize: '12px', color: THEME.muted, marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <span>{catalog.length} vins en cave</span>
          {query.length >= 2 && <span>{results.length} résultats</span>}
        </div>
      </div>

      {/* LISTE DES VINS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {results.map((wine, i) => (
          <div key={i} style={{ background: THEME.surface, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontFamily: THEME.serif, color: THEME.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {wine.title || wine.t}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: THEME.primary, fontWeight: '700', textTransform: 'uppercase' }}>
                {wine.vendor || wine.v}
              </p>
            </div>
            <div style={{ textAlign: 'right', marginLeft: '16px' }}>
              <div style={{ fontWeight: '800', fontSize: '18px', color: THEME.primary, marginBottom: '8px' }}>
                {wine.price || wine.p}€
              </div>
              <a href={wine.url || wine.u} target="_blank" rel="noreferrer" style={{ background: THEME.primary, color: '#001710', padding: '8px 16px', fontSize: '11px', fontWeight: '800', textDecoration: 'none', display: 'inline-block' }}>
                BUY
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* BARRE DE NAVIGATION FIXE */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '75px', background: 'rgba(0, 37, 26, 0.9)', backdropFilter: 'blur(15px)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
        <div style={{ color: THEME.muted, textAlign: 'center' }}>
          <span className="material-symbols-outlined">explore</span>
          <div style={{ fontSize: '9px', marginTop: '2px' }}>DISCOVERY</div>
        </div>
        <div style={{ color: THEME.primary, textAlign: 'center' }}>
          <span className="material-symbols-outlined">search</span>
          <div style={{ fontSize: '9px', marginTop: '2px', fontWeight: '800' }}>SEARCH</div>
        </div>
        <div style={{ color: THEME.muted, textAlign: 'center' }}>
          <span className="material-symbols-outlined">inventory_2</span>
          <div style={{ fontSize: '9px', marginTop: '2px' }}>CELLAR</div>
        </div>
      </nav>
    </div>
  );
}
