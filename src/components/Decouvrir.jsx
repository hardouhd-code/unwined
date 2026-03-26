import { useState, useMemo, useEffect } from 'react';
import { searchBoirLocal } from '../lib/boirCatalog';

// --- PALETTE CLAIRE "MA CAVE" ---
const THEME = {
  bg: '#f3efe6',        // Fond beige identique à Ma Cave
  card: '#ffffff',      // Cartes blanches
  text: '#452b00',      // Texte marron foncé
  muted: '#806c50',     // Texte secondaire
  accent: '#c8956c',    // Or pour les prix et boutons
  border: '#e8e1d5',    // Bordures fines
};

const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Afrique du Sud': '🇿🇦', 'Argentine': '🇦🇷', 'Chili': '🇨🇱', 'Allemagne': '🇩🇪', 'Autriche': '🇦🇹', 'États-Unis': '🇺🇸', 'Grèce': '🇬🇷', 'Georgie': '🇬🇪', 'Belgique': '🇧🇪', 'Australie': '🇦🇺', 'Nouvelle-Zélande': '🇳🇿' };

function WineCard({ wine }) {
  return (
    <div style={{ 
      background: THEME.card, border: `1px solid ${THEME.border}`, 
      borderRadius: '14px', padding: '16px', display: 'flex', 
      flexDirection: 'column', gap: 10, marginBottom: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 48, height: 48, background: '#f9f7f2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
           <img src={wine.image || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 'bold', color: THEME.text, fontFamily: 'Georgia, serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {wine.title}
          </div>
          <div style={{ fontSize: 12, color: THEME.muted }}>
            {(wine.region || 'Vin').toUpperCase()} · {wine.vendor}
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 'bold', color: THEME.accent, fontFamily: 'Georgia, serif' }}>
          {wine.price}€
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: THEME.muted, background: '#f9f7f2', padding: '4px 10px', borderRadius: 10 }}>
          {FLAGS[wine.country] || '🌐'} {wine.country}
        </span>
        <a href={wine.url} target="_blank" rel="noopener noreferrer" style={{ 
          padding: '8px 16px', borderRadius: '8px', background: THEME.accent, 
          color: '#ffffff', fontSize: 12, textDecoration: 'none', fontWeight: 'bold' 
        }}>ACHETER</a>
      </div>
    </div>
  );
}

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  const handleSearch = (v) => {
    setQuery(v);
    if (v.trim().length >= 2) { setResults(searchBoirLocal(v.trim(), 500)); }
    else { setResults([]); }
  };

  return (
    <div style={{ 
      background: THEME.bg, minHeight: '100vh', 
      padding: '20px 16px 100px', boxSizing: 'border-box' 
    }}>
      
      {/* Barre de Recherche assortie */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <input 
          type="text" value={query} onChange={e => handleSearch(e.target.value)} 
          placeholder="Rechercher (ex: Bordeaux, Syrah...)" 
          style={{ 
            width: '100%', padding: '14px 16px', background: THEME.card, 
            border: `1px solid ${THEME.border}`, borderRadius: '12px', 
            color: THEME.text, fontSize: 16, outline: 'none', boxSizing: 'border-box' 
          }} 
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: 12, color: THEME.muted, marginBottom: 15 }}>
          {results.length} vins trouvés
        </p>
        {results.map((w, i) => <WineCard key={i} wine={w} />)}
      </div>
    </div>
  );
}
