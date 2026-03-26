import React, { useState, useMemo, useEffect } from 'react';
import * as WineData from '../lib/boirCatalog';

// --- PALETTE CLAIRE (Identique à Ma Cave) ---
const THEME = {
  card: '#ffffff',      // Fond des cartes
  text: '#452b00',      // Marron foncé
  muted: '#806c50',     // Marron clair
  accent: '#c8956c',    // Or / Bronze
  border: '#e8e1d5',    // Bordures fines
};

const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Afrique du Sud': '🇿🇦', 'Argentine': '🇦🇷', 'Chili': '🇨🇱', 'Allemagne': '🇩🇪', 'Autriche': '🇦🇹', 'États-Unis': '🇺🇸', 'Grèce': '🇬🇷', 'Georgie': '🇬🇪', 'Belgique': '🇧🇪', 'Australie': '🇦🇺', 'Nouvelle-Zélande': '🇳🇿' };

const REGIONS_BY_COUNTRY = {
  'France': ['Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne', 'Provence'],
  'Italie': ['Piémont', 'Toscane', 'Vénétie', 'Sicile', 'Pouilles'],
  'Espagne': ['Rioja', 'Ribera del Duero', 'Priorat'],
  'Portugal': ['Douro', 'Alentejo'],
};

function WineCard({ wine }) {
  const p = wine.price || wine.p || 0;
  return (
    <div style={{ 
      background: THEME.card, border: `1px solid ${THEME.border}`, 
      borderRadius: '16px', padding: '16px', display: 'flex', 
      flexDirection: 'column', gap: 10, marginBottom: '12px',
      boxShadow: '0 4px 12px rgba(139,90,60,0.08)' 
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 50, height: 60, background: '#f9f7f2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
           <img src={wine.image || wine.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: '700', color: THEME.text, fontFamily: 'Playfair Display, serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {wine.title || wine.t}
          </div>
          <div style={{ fontSize: 12, color: THEME.muted, fontFamily: 'Cormorant Garamond, serif' }}>
            {(wine.region || wine.r || 'Vin').toUpperCase()} · {wine.vendor || wine.v}
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: '700', color: THEME.accent, fontFamily: 'Playfair Display, serif' }}>
          {p.toFixed(2)}€
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: THEME.muted, background: '#f9f7f2', padding: '4px 12px', borderRadius: 20, fontFamily: 'Cormorant Garamond, serif' }}>
          {FLAGS[wine.country || wine.c] || '🌐'} {wine.country || wine.c}
        </span>
        <a href={wine.url || wine.u} target="_blank" rel="noopener noreferrer" style={{ 
          padding: '8px 20px', borderRadius: '24px', background: THEME.accent, 
          color: '#ffffff', fontSize: 12, textDecoration: 'none', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px'
        }}>Acheter</a>
      </div>
    </div>
  );
}

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('Tous');
  const [region, setRegion] = useState('Toutes');

  const catalog = WineData?.BOIR_CATALOG || [];
  const searchFn = WineData?.searchBoirLocal || (() => []);

  useEffect(() => { setRegion('Toutes'); }, [country]);

  const results = useMemo(() => {
    let list = (query.length >= 2) ? searchFn(query) : 
               (country !== 'Tous') ? catalog.filter(w => (w.country || w.c) === country) : [];

    return list.filter(w => {
      const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
      return region === 'Toutes' || norm(w.region || w.r) === norm(region);
    });
  }, [query, country, region, catalog, searchFn]);

  return (
    <div style={{ padding: '0 20px 120px', boxSizing: 'border-box' }}>
      
      {/* Barre de Recherche Claire */}
      <div style={{ marginBottom: 20 }}>
        <input 
          type="text" value={query} onChange={e => setQuery(e.target.value)} 
          placeholder="Rechercher un domaine, un cépage..." 
          style={{ 
            width: '100%', padding: '16px', background: THEME.card, 
            border: `1px solid ${THEME.border}`, borderRadius: '16px', 
            color: THEME.text, fontSize: 16, outline: 'none', boxSizing: 'border-box',
            boxShadow: '0 4px 12px rgba(139,90,60,0.05)', fontFamily: 'Cormorant Garamond, serif'
          }} 
        />
      </div>

      {/* Filtres Pays */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
        {['Tous', ...Object.keys(FLAGS)].map(c => (
          <button key={c} onClick={() => {setCountry(c); setQuery('');}} style={{ 
            flexShrink: 0, padding: '8px 16px', borderRadius: 24, fontSize: 12, 
            background: country === c ? THEME.accent : THEME.card, 
            color: country === c ? '#fff' : THEME.muted,
            border: `1px solid ${country === c ? THEME.accent : THEME.border}`,
            fontWeight: '600'
          }}>
            {c}
          </button>
        ))}
      </div>

      {/* Liste de résultats */}
      <div style={{ marginTop: 10 }}>
        <p style={{ fontSize: 13, color: THEME.muted, marginBottom: 15, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
          {results.length} pépites trouvées
        </p>
        {results.map((w, i) => <WineCard key={i} wine={w} />)}
        {results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: THEME.muted }}>
            Sélectionnez un pays ou recherchez un vin.
          </div>
        )}
      </div>
    </div>
  );
}
