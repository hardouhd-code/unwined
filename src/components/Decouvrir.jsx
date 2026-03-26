import React, { useState, useMemo, useEffect } from 'react';
// Import sécurisé du catalogue
import * as CatalogModule from '../lib/boirCatalog';

// --- DESIGN TOKENS (Source: DESIGN.md) ---
const THEME = {
  bg: '#001710',           // Fond profond
  surface: '#00251a',      // Cartes
  primary: '#ffb94f',      // Or Solaire
  text: '#c3ebda',         // Menthe clair
  textMuted: 'rgba(195, 235, 218, 0.5)',
  serif: "'Noto Serif', serif",
  sans: "'Manrope', sans-serif"
};

// --- COMPOSANT CARTE DE VIN ---
function WineCard({ wine }) {
  if (!wine) return null;
  
  return (
    <div style={{ 
      background: THEME.surface, 
      padding: '24px 20px', 
      marginBottom: '16px', // Espacement vertical à la place des lignes
      display: 'flex', 
      gap: '20px', 
      alignItems: 'center',
      position: 'relative',
      borderRadius: '4px'
    }}>
      {/* Prix en Or */}
      <div style={{ 
        position: 'absolute', top: '24px', right: '20px', 
        color: THEME.primary, fontSize: '18px', fontWeight: '800', 
        fontFamily: THEME.sans 
      }}>
        {wine.price ? `${wine.price}€` : '--'}
      </div>

      {/* Image de la bouteille */}
      <div style={{ flexShrink: 0, width: '60px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img 
          src={wine.image || ''} 
          alt="" 
          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }} 
        />
      </div>

      {/* Infos Textuelles */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: THEME.textMuted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 4px' }}>
          {wine.region || 'Région inconnue'}
        </p>
        <h3 style={{ color: THEME.text, fontFamily: THEME.serif, fontSize: '18px', margin: 0, fontWeight: '700', lineHeight: '1.2' }}>
          {wine.title || 'Vin sans nom'}
        </h3>
        <p style={{ color: THEME.primary, fontSize: '11px', fontWeight: '700', margin: '8px 0 0', textTransform: 'uppercase' }}>
          {wine.vendor}
        </p>
      </div>
    </div>
  );
}

// --- COMPOSANT PRINCIPAL ---
export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  // Sécurité si searchBoirLocal n'est pas encore défini
  const searchFn = CatalogModule.searchBoirLocal || (() => []);

  const handleSearch = (v) => {
    setQuery(v);
    if (v.trim().length >= 2) {
      try {
        const data = searchFn(v.trim(), 500);
        setResults(Array.isArray(data) ? data : []);
        setSearched(true);
      } catch (err) {
        console.error("Erreur recherche:", err);
      }
    } else {
      setResults([]);
      setSearched(false);
    }
  };

  return (
    <div style={{ 
      background: THEME.bg, 
      minHeight: '100vh', 
      color: THEME.text, 
      fontFamily: THEME.sans,
      paddingBottom: '100px' // Espace pour la barre du bas
    }}>
      
      {/* Header Fixe */}
      <header style={{ 
        height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px', position: 'sticky', top: 0, background: THEME.bg, zIndex: 10
      }}>
        <h1 style={{ fontFamily: THEME.serif, color: THEME.primary, fontSize: '22px', fontStyle: 'italic', margin: 0 }}>
          Unwine-D
        </h1>
      </header>

      {/* Zone de Recherche */}
      <div style={{ padding: '20px' }}>
        <p style={{ fontFamily: THEME.serif, fontStyle: 'italic', fontSize: '14px', marginBottom: '8px', color: THEME.textMuted }}>
          Découvrez notre sélection...
        </p>
        <input 
          type="text" 
          value={query} 
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Un domaine, une région..."
          style={{ 
            width: '100%', background: 'transparent', border: 'none', 
            borderBottom: `1px solid ${THEME.textMuted}`, color: THEME.text,
            padding: '12px 0', fontSize: '18px', outline: 'none', fontFamily: THEME.serif
          }}
        />
      </div>

      {/* Liste des Résultats */}
      <div style={{ padding: '0 20px' }}>
        {results.length > 0 ? (
          results.map((wine, i) => <WineCard key={i} wine={wine} />)
        ) : searched ? (
          <p style={{ textAlign: 'center', marginTop: '40px', color: THEME.textMuted }}>Aucune pépite trouvée.</p>
        ) : null}
      </div>

      {/* Barre de Navigation du bas (Glassmorphism) */}
      <nav style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '80px',
        background: 'rgba(0, 37, 26, 0.8)', backdropFilter: 'blur(15px)',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px'
      }}>
        <div style={{ textAlign: 'center', color: THEME.textMuted }}>
          <span className="material-symbols-outlined">explore</span>
          <div style={{ fontSize: '9px', marginTop: '4px' }}>DÉCOUVRIR</div>
        </div>
        <div style={{ textAlign: 'center', color: THEME.primary }}>
          <span className="material-symbols-outlined">search</span>
          <div style={{ fontSize: '9px', marginTop: '4px', fontWeight: 'bold' }}>RECHERCHE</div>
        </div>
        <div style={{ textAlign: 'center', color: THEME.textMuted }}>
          <span className="material-symbols-outlined">inventory_2</span>
          <div style={{ fontSize: '9px', marginTop: '4px' }}>MA CAVE</div>
        </div>
      </nav>
    </div>
  );
}
