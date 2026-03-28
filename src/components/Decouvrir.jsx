import React, { useState, useMemo, useEffect } from 'react';
import { BOIR_CATALOG, searchBoirLocal } from '../lib/boirCatalog';

const THEME = { card: '#ffffff', text: '#452b00', muted: '#806c50', accent: '#c8956c', border: '#e8e1d5' };
const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Argentine': '🇦🇷' };
const REGIONS_BY_COUNTRY = {
  'France': ['Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne', 'Autre'],
  'Italie': ['Piémont', 'Toscane', 'Vénétie', 'Sicile'],
};

function WineCard({ wine }) {
  const t = wine.t || wine.title;
  const p = wine.p || wine.price;
  const r = wine.r || wine.region;
  const v = wine.v || wine.vendor;
  const img = wine.img || wine.image;

  return (
    <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: '16px', padding: '16px', display: 'flex', gap: 12, marginBottom: '12px', boxShadow: '0 4px 12px rgba(139,90,60,0.08)' }}>
      <img src={img} alt="" style={{ width: 55, height: 65, objectFit: 'contain', borderRadius: '8px', background: '#f9f7f2' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10px', color: THEME.accent, fontWeight: 'bold', letterSpacing: '0.5px' }}>{r?.toUpperCase()}</div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.text, fontFamily: 'serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '2px 0' }}>{t}</div>
        <div style={{ fontSize: '12px', color: THEME.muted, opacity: 0.8 }}>{v}</div>
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: THEME.accent }}>{p.toFixed(2)}€</span>
          <a href={wine.u || wine.url} target="_blank" rel="noreferrer" style={{ background: THEME.accent, color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', textDecoration: 'none', fontWeight: 'bold' }}>ACHETER</a>
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
    if (query.length >= 2) return searchBoirLocal(query);
    if (country === 'Tous') return [];

    return catalog.filter(w => {
      const matchCountry = (w.c === country || w.country === country);
      if (!matchCountry) return false;
      if (region === 'Toutes') return true;
      return (w.r === region || w.region === region);
    });
  }, [query, country, region]);

  return (
    <div style={{ padding: '0 20px 140px', minHeight: '100vh' }}>
      <input type="text" value={query} onChange={e => {setQuery(e.target.value); if(e.target.value) setCountry('Tous');}} placeholder="Rechercher (ex: Syrah, Chablis...)" 
        style={{ width: '100%', padding: '16px', background: '#fff', border: `1px solid ${THEME.border}`, borderRadius: '14px', margin: '20px 0', fontSize: '16px', outline: 'none' }} 
      />

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 15, scrollbarWidth: 'none' }}>
        {['Tous', ...Object.keys(FLAGS)].map(c => (
          <button key={c} onClick={() => setCountry(c)} style={{ flexShrink: 0, padding: '8px 20px', borderRadius: '25px', background: country === c ? THEME.accent : '#fff', color: country === c ? '#fff' : THEME.text, border: `1px solid ${THEME.border}`, fontWeight: '600' }}>{c}</button>
        ))}
      </div>

      {country !== 'Tous' && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, padding: '10px 0', borderTop: `1px solid ${THEME.border}`, scrollbarWidth: 'none' }}>
          {['Toutes', ...(REGIONS_BY_COUNTRY[country] || [])].map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{ flexShrink: 0, padding: '7px 15px', borderRadius: '10px', background: region === r ? '#452b00' : 'rgba(139,90,60,0.05)', color: region === r ? '#fff' : THEME.muted, border: 'none', fontSize: '11px', fontWeight: 'bold' }}>{r.toUpperCase()}</button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
         <span style={{ fontSize: '13px', color: THEME.muted, fontStyle: 'italic' }}>{results.length} vins trouvés</span>
      </div>
      
      {results.map((w, i) => <WineCard key={i} wine={w} />)}
      
      {results.length === 0 && country === 'Tous' && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: THEME.muted }}>
          Choisissez un pays pour explorer la cave.
        </div>
      )}
    </div>
  );
}
