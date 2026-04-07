import React, { useState, useMemo, useEffect } from 'react';
import { BOIR_CATALOG, searchBoirLocal } from '../lib/boirCatalog';

const THEME = { card: '#ffffff', text: '#452b00', muted: '#806c50', accent: '#c8956c', border: '#e8e1d5' };
const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Argentine': '🇦🇷', 'Belgique': '🇧🇪' };
const REGIONS_BY_COUNTRY = {
  'France': ['Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne', 'Autre'],
  'Italie': ['Piémont', 'Toscane', 'Vénétie', 'Sicile'],
};

function WineCard({ wine }) {
  if (!wine) return null;
  const title = wine.t || wine.title;
  const price = wine.p || wine.price;
  const region = (wine.r || wine.region || "Autre").toUpperCase();
  const vendor = wine.v || wine.vendor;
  const img = wine.img || wine.image;

  return (
    <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: '16px', padding: '16px', display: 'flex', gap: 12, marginBottom: '12px', boxShadow: '0 4px 12px rgba(139,90,60,0.08)' }}>
      <div style={{ width: 60, height: 75, background: '#f9f7f2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
         {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{fontSize: 24}}>🍷</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10px', color: THEME.accent, fontWeight: 'bold' }}>{region}</div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.text, fontFamily: 'serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: '12px', color: THEME.muted, opacity: 0.8 }}>{vendor}</div>
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: THEME.accent }}>{parseFloat(price || 0).toFixed(2)}€</span>
          <a href={wine.u || wine.url} target="_blank" rel="noreferrer" style={{ background: THEME.accent, color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', textDecoration: 'none', fontWeight: 'bold' }}>VOIR</a>
        </div>
      </div>
    </div>
  );
}

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('Tous');
  const [region, setRegion] = useState('Toutes');

  useEffect(() => { setRegion('Toutes'); }, [country]);

  const results = useMemo(() => {
    const catalog = BOIR_CATALOG || [];
    if (query.trim().length >= 2) return searchBoirLocal(query);
    if (country === 'Tous') return [];

    const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    
    return catalog.filter(w => {
      const wCountry = w.c || w.country || '';
      if (wCountry !== country) return false;
      if (region === 'Toutes') return true;

      const searchTarget = norm(region);
      const wineContent = norm((w.t || '') + ' ' + (w.r || ''));
      return wineContent.includes(searchTarget);
    });
  }, [query, country, region]);

  return (
    <div style={{ padding: '0 20px 140px', minHeight: '100vh' }}>
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <h2 style={{ color: THEME.text, fontFamily: 'serif', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>La Sélection</h2>
        <p style={{ fontSize: '11px', color: THEME.muted }}>{results.length} PÉPITES TROUVÉES</p>
      </div>

      <input type="text" value={query} onChange={e => {setQuery(e.target.value); if(e.target.value) setCountry('Tous');}} 
        placeholder="Un château, un cépage, un domaine..." 
        style={{ width: '100%', padding: '16px', background: '#fff', border: `1px solid ${THEME.border}`, borderRadius: '14px', marginBottom: '20px', outline: 'none', boxSizing: 'border-box' }} 
      />

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 15, scrollbarWidth: 'none' }}>
        {['Tous', ...Object.keys(FLAGS)].map(c => (
          <button key={c} onClick={() => setCountry(c)} style={{ flexShrink: 0, padding: '10px 18px', borderRadius: 25, background: country === c ? THEME.accent : '#fff', color: country === c ? '#fff' : THEME.text, border: `1px solid ${THEME.border}`, fontWeight: '600' }}>
            {FLAGS[c]} {c}
          </button>
        ))}
      </div>

      {country !== 'Tous' && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, padding: '10px 0', borderTop: `1px solid ${THEME.border}`, scrollbarWidth: 'none' }}>
          {['Toutes', ...(REGIONS_BY_COUNTRY[country] || [])].map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{ flexShrink: 0, padding: '7px 15px', borderRadius: '10px', background: region === r ? '#452b00' : 'rgba(139,90,60,0.05)', color: region === r ? '#fff' : THEME.muted, border: 'none', fontSize: '11px', fontWeight: 'bold' }}>
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {results.map((w, i) => <WineCard key={i} wine={w} />)}
    </div>
  );
}
