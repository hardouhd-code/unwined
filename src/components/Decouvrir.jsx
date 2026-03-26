import React, { useState, useMemo } from 'react';

// Tentative d'importation sécurisée
let WineData = { BOIR_CATALOG: [], searchBoirLocal: () => [] };
try {
  WineData = require('../lib/boirCatalog');
} catch (e) {
  console.error("Le fichier boirCatalog.js est introuvable ou vide.");
}

const THEME = {
  bg: '#001710',
  surface: '#00251b',
  primary: '#ffb94f',
  text: '#c3ebda',
  muted: 'rgba(195, 235, 218, 0.5)',
  serif: "'Noto Serif', serif",
  sans: "'Manrope', sans-serif"
};

const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Afrique du Sud': '🇿🇦', 'Argentine': '🇦🇷', 'Chili': '🇨🇱', 'Allemagne': '🇩🇪', 'Autriche': '🇦🇹', 'États-Unis': '🇺🇸', 'Grèce': '🇬🇷', 'Georgie': '🇬🇪', 'Belgique': '🇧🇪', 'Australie': '🇦🇺', 'Nouvelle-Zélande': '🇳🇿' };

export function Decouvrir() {
  const [query, setQuery] = useState('');

  // Sécurisation des données
  const catalog = WineData?.BOIR_CATALOG || [];
  const searchFn = WineData?.searchBoirLocal || (() => []);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    try {
      return searchFn(query) || [];
    } catch (err) {
      return [];
    }
  }, [query, searchFn]);

  return (
    <div style={{ 
      background: THEME.bg, 
      minHeight: '100vh', 
      color: THEME.text, 
      fontFamily: THEME.sans,
      padding: '24px 20px 100px',
      boxSizing: 'border-box'
    }}>
      
      {/* HEADER - Si tu vois ça, c'est que React fonctionne ! */}
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontFamily: THEME.serif, color: THEME.primary, fontSize: '32px', margin: 0, fontStyle: 'italic', fontWeight: '700' }}>
          Unwine-D
        </h1>
        <p style={{ fontSize: '10px', color: THEME.muted, letterSpacing: '4px', textTransform: 'uppercase', marginTop: '4px' }}>
          THE DIGITAL CELLAR
        </p>
      </header>

      {/* BARRE DE RECHERCHE */}
      <div style={{ marginBottom: '40px' }}>
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un domaine, un pays..." 
          style={{ 
            width: '100%', background: 'transparent', border: 'none', borderBottom: `2px solid ${THEME.muted}`, 
            color: '#FFFFFF', fontSize: '20px', padding: '12px 0', outline: 'none', fontFamily: THEME.serif 
          }} 
        />
        <p style={{ fontSize: '12px', color: THEME.muted, marginTop: '10px' }}>
          {catalog.length} vins disponibles dans la cave.
        </p>
      </div>

      {/* LISTE DES RÉSULTATS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {results.map((wine, i) => (
          <div key={i} style={{ 
            background: THEME.surface, padding: '20px', borderRadius: '4px', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '10px', color: THEME.primary, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>
                {FLAGS[wine.country] || '🍷'} {wine.region || 'Vin'}
              </p>
              <h3 style={{ fontSize: '18px', color: THEME.text, fontFamily: THEME.serif, margin: 0 }}>
                {wine.title || wine.t}
              </h3>
            </div>
            <div style={{ textAlign: 'right', marginLeft: '16px' }}>
              <div style={{ color: THEME.primary, fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>
                {wine.price || wine.p}€
              </div>
              <a href={wine.url || wine.u} target="_blank" rel="noreferrer" style={{ 
                background: THEME.primary, color: '#001710', padding: '8px 16px', borderRadius: '2px', 
                fontSize: '11px', fontWeight: '800', textDecoration: 'none', display: 'inline-block'
              }}>BUY</a>
            </div>
          </div>
        ))}
      </div>

      {/* NAVIGATION BASSE (Matérialisée par des icônes) */}
      <nav style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '80px', 
        background: 'rgba(0, 23, 16, 0.95)', backdropFilter: 'blur(15px)', 
        display: 'flex', justifyContent: 'space-around', alignItems: 'center', 
        borderTop: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px',
        zIndex: 1000
      }}>
        <div style={{ textAlign: 'center', color: THEME.muted }}>
          <span className="material-symbols-outlined">explore</span>
          <div style={{ fontSize: '9px', marginTop: '4px' }}>DISCOVERY</div>
        </div>
        <div style={{ textAlign: 'center', color: THEME.primary }}>
          <span className="material-symbols-outlined" style={{ fontWeight: 'bold' }}>search</span>
          <div style={{ fontSize: '9px', marginTop: '4px', fontWeight: '800' }}>SEARCH</div>
        </div>
        <div style={{ textAlign: 'center', color: THEME.muted }}>
          <span className="material-symbols-outlined">inventory_2</span>
          <div style={{ fontSize: '9px', marginTop: '4px' }}>CELLAR</div>
        </div>
      </nav>
    </div>
  );
}
