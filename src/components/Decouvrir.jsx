import React, { useState, useMemo } from 'react';
// Importation sécurisée
import * as Data from '../lib/boirCatalog';

const THEME = { card: '#ffffff', text: '#452b00', muted: '#806c50', accent: '#c8956c', border: '#e8e1d5' };

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('Tous');

  // PROTECTION : Si le fichier lib/boirCatalog.js est cassé, on ne crash pas l'app
  const catalog = Data?.BOIR_CATALOG || [];
  const searchFn = Data?.searchBoirLocal || (() => []);

  const results = useMemo(() => {
    try {
      if (query.length >= 2) return searchFn(query);
      if (country !== 'Tous') {
        return catalog
          .filter(w => (w.c === country || w.country === country))
          .map(w => ({ ...w, title: w.t || w.title, price: w.p || w.price }));
      }
      return [];
    } catch (e) { return []; }
  }, [query, country, catalog, searchFn]);

  return (
    <div style={{ padding: '0 20px 140px', boxSizing: 'border-box' }}>
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <h2 style={{ color: THEME.text, fontFamily: 'serif', margin: 0 }}>Découverte</h2>
      </div>

      <input 
        type="text" value={query} onChange={e => setQuery(e.target.value)}
        placeholder="Rechercher un vin..." 
        style={{ width: '100%', padding: '15px', background: '#fff', border: `1px solid ${THEME.border}`, borderRadius: '12px', outline: 'none' }}
      />

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '15px 0', scrollbarWidth: 'none' }}>
        {['Tous', 'France', 'Italie', 'Espagne'].map(c => (
          <button key={c} onClick={() => {setCountry(c); setQuery('');}} style={{
            flexShrink: 0, padding: '8px 16px', borderRadius: 20,
            background: country === c ? THEME.accent : '#fff',
            color: country === c ? '#fff' : THEME.muted,
            border: `1px solid ${THEME.border}`, fontWeight: 'bold'
          }}>{c}</button>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        {results.map((w, i) => (
          <div key={i} style={{ background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: `1px solid ${THEME.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 'bold', color: THEME.text }}>{w.title}</div>
            <div style={{ color: THEME.accent, fontWeight: 'bold' }}>{w.price}€</div>
          </div>
        ))}
        {results.length === 0 && (
          <p style={{ textAlign: 'center', color: THEME.muted, marginTop: 40 }}>
            {catalog.length > 0 ? "Choisissez un pays." : "Chargement du catalogue..."}
          </p>
        )}
      </div>
    </div>
  );
}
