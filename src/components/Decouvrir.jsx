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
      <img src={img} alt="" style={{ width: 50, height: 65, objectFit: 'contain', borderRadius: '8px', background: '#f9f7f2' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10px', color: THEME.accent, fontWeight: 'bold' }}>{r?.toUpperCase()}</div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.text, fontFamily: 'serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</div>
        <div style={{ fontSize: '12px', color: THEME.muted }}>{v}</div>
        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: THEME.accent }}>{p}€</span>
          <a href={wine.u || wine.url} target="_blank" rel="noreferrer" style={{ background: THEME.accent, color: '#fff', padding: '5px 12px', borderRadius: '15px', fontSize: '10px', textDecoration: 'none', fontWeight: 'bold' }}>ACHETER</a>
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

      // RECHERCHE HYBRIDE : On cherche dans le champ région OU dans le titre
      const rName = (w.r || w.region || '').toLowerCase();
      const tName = (w.t || w.title || '').toLowerCase();
      const searchTarget = region.toLowerCase();
      
      return rName === searchTarget || tName.includes(searchTarget);
    });
  }, [query, country, region]);

  return (
    <div style={{ padding: '0 20px 140px' }}>
      <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un vin..." 
        style={{ width: '100%', padding: '15px', background: '#fff', border: `1px solid ${THEME.border}`, borderRadius: '12px', margin: '20px 0' }} 
      />

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 15, scrollbarWidth: 'none' }}>
        {['Tous', ...Object.keys(FLAGS)].map(c => (
          <button key={c} onClick={() => setCountry(c)} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '20px', background: country === c ? THEME.accent : '#fff', color: country === c ? '#fff' : THEME.text, border: `1px solid ${THEME.border}` }}>{c}</button>
        ))}
      </div>

      {country !== 'Tous' && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, padding: '10px 0', borderTop: `1px solid ${THEME.border}`, scrollbarWidth: 'none' }}>
          {['Toutes', ...(REGIONS_BY_COUNTRY[country] || [])].map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '8px', background: region === r ? '#452b00' : 'transparent', color: region === r ? '#fff' : THEME.muted, border: 'none', fontSize: '11px', fontWeight: 'bold' }}>{r.toUpperCase()}</button>
          ))}
        </div>
      )}

      <p style={{ fontSize: '12px', color: THEME.muted, marginBottom: 15 }}>{results.length} vins trouvés</p>
      {results.map((w, i) => <WineCard key={i} wine={w} />)}
    </div>
  );
}
