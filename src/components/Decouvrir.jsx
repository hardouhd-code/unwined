import React, { useState, useMemo, useEffect } from 'react';
import * as WineData from '../lib/boirCatalog';

// --- DESIGN HARMONISÉ (ACCUEIL/CAVE) ---
const THEME = {
  card: '#ffffff',
  text: '#452b00',
  muted: '#806c50',
  accent: '#c8956c',
  border: '#e8e1d5',
};

const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Afrique du Sud': '🇿🇦', 'Argentine': '🇦🇷', 'Chili': '🇨🇱', 'Allemagne': '🇩🇪', 'Autriche': '🇦🇹', 'États-Unis': '🇺🇸', 'Grèce': '🇬🇷', 'Georgie': '🇬🇪', 'Belgique': '🇧🇪', 'Australie': '🇦🇺', 'Nouvelle-Zélande': '🇳🇿' };

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('Tous');

  // Sécurité sur l'importation
  const catalog = WineData?.BOIR_CATALOG || [];
  const searchFn = WineData?.searchBoirLocal || (() => []);

  const results = useMemo(() => {
    // 1. Normalisation : On transforme t, p, r, c en noms complets pour éviter les bugs
    const cleanCatalog = catalog.map(w => ({
      title: w.title || w.t || "Vin",
      price: w.price || w.p || 0,
      vendor: w.vendor || w.v || "Boir",
      url: w.url || w.u || "#",
      region: w.region || w.r || "Autre",
      country: w.country || w.c || "France",
      image: w.image || w.img || ""
    }));

    const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

    // 2. Logique de filtrage
    if (query.length >= 2) {
      return searchFn(query);
    }
    
    if (country !== 'Tous') {
      return cleanCatalog.filter(w => w.country === country);
    }

    return [];
  }, [query, country, catalog, searchFn]);

  return (
    <div style={{ padding: '0 20px 140px', boxSizing: 'border-box' }}>
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <h2 style={{ color: THEME.text, fontFamily: 'serif', margin: 0 }}>Découverte</h2>
        <p style={{ fontSize: '11px', color: THEME.muted }}>{catalog.length} bouteilles disponibles</p>
      </div>

      {/* Barre de Recherche */}
      <input 
        type="text" value={query} onChange={e => setQuery(e.target.value)}
        placeholder="Un domaine, un cépage..." 
        style={{ width: '100%', padding: '16px', background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: '16px', color: THEME.text, outline: 'none', marginBottom: '20px', boxSizing: 'border-box' }}
      />

      {/* Filtres Pays */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
        {['Tous', 'France', 'Italie', 'Espagne', 'Portugal', 'Argentine'].map(c => (
          <button key={c} onClick={() => {setCountry(c); setQuery('');}} style={{
            flexShrink: 0, padding: '8px 16px', borderRadius: 24, fontSize: 12, fontWeight: '600',
            background: country === c ? THEME.accent : THEME.card,
            color: country === c ? '#fff' : THEME.muted,
            border: `1px solid ${country === c ? THEME.accent : THEME.border}`
          }}>{c}</button>
        ))}
      </div>

      {/* Liste des Résultats */}
      <div style={{ marginTop: 20 }}>
        {results.map((w, i) => (
          <div key={i} style={{ background: THEME.card, padding: '16px', borderRadius: '16px', marginBottom: '12px', border: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(139,90,60,0.05)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '10px', color: THEME.accent, fontWeight: 'bold' }}>
                {FLAGS[w.country || w.c] || '🍷'} {(w.region || w.r || 'VIN').toUpperCase()}
              </div>
              <div style={{ fontWeight: 'bold', color: THEME.text, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {w.title || w.t}
              </div>
            </div>
            <div style={{ textAlign: 'right', marginLeft: 15 }}>
              <div style={{ color: THEME.accent, fontWeight: 'bold' }}>{(w.price || w.p)}€</div>
              <a href={w.url || w.u} target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: THEME.muted, textDecoration: 'underline' }}>VOIR</a>
            </div>
          </div>
        ))}
        
        {results.length === 0 && (
          <p style={{ textAlign: 'center', color: THEME.muted, marginTop: 40, fontStyle: 'italic' }}>
            {query.length < 2 && country === 'Tous' ? "Explorez la cave par pays ou par nom." : "Aucun vin trouvé."}
          </p>
        )}
      </div>
    </div>
  );
}
