import React, { useState, useMemo, useEffect } from 'react';
import * as Data from '../lib/boirCatalog';

const THEME = { card: '#ffffff', text: '#452b00', muted: '#806c50', accent: '#c8956c', border: '#e8e1d5' };
const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Argentine': '🇦🇷' };

const REGIONS_BY_COUNTRY = {
  'France': ['Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne', 'Autre'],
  'Italie': ['Piémont', 'Toscane', 'Vénétie', 'Sicile'],
};

function WineCard({ wine }) {
  if (!wine) return null;

  // SÉCURITÉ TOTALE SUR LES DONNÉES
  const title = wine.t || wine.title || "Vin sans nom";
  const vendor = wine.v || wine.vendor || "Boir";
  const region = (wine.r || wine.region || "Vin").toUpperCase();
  const img = wine.img || wine.image || "";
  const url = wine.u || wine.url || "#";
  const country = wine.c || wine.country || "France";
  
  const rawPrice = wine.p || wine.price || 0;
  const price = parseFloat(rawPrice).toFixed(2);

  return (
    <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: '16px', padding: '16px', display: 'flex', gap: 12, marginBottom: '12px', boxShadow: '0 4px 12px rgba(139,90,60,0.08)' }}>
      <div style={{ width: 55, height: 65, background: '#f9f7f2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
         {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span>🍷</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10px', color: THEME.accent, fontWeight: 'bold' }}>{region}</div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: '12px', color: THEME.muted, opacity: 0.8 }}>{vendor}</div>
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: THEME.accent }}>{price}€</span>
          <a href={url} target="_blank" rel="noreferrer" style={{ background: THEME.accent, color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', textDecoration: 'none', fontWeight: 'bold' }}>ACHETER</a>
        </div>
      </div>
    </div>
  );
}

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('Tous');
  const [region, setRegion] = useState('Toutes');

  const catalog = Data?.BOIR_CATALOG || [];
  const searchFn = Data?.searchBoirLocal || (() => []);

  useEffect(() => { setRegion('Toutes'); }, [country]);

  const results = useMemo(() => {
    try {
      // 1. Si on tape une recherche
      if (query.trim().length >= 2) return searchFn(query);

      // 2. Si on clique sur un pays
      if (country === 'Tous') return [];

      return catalog.filter(w => {
        if (!w) return false;
        const wCountry = w.c || w.country || '';
        if (wCountry !== country) return false;

        if (region === 'Toutes') return true;

        const wRegion = (w.r || w.region || '').toLowerCase();
        const wTitle = (w.t || w.title || '').toLowerCase();
        const target = region.toLowerCase();

        // On cherche dans la catégorie OU dans le titre (pour Bordeaux notamment)
        return wRegion === target || wTitle.includes(target);
      });
    } catch (e) {
      return [];
    }
  }, [query, country, region, catalog, searchFn]);

  return (
    <div style={{ padding: '0 20px 140px', minHeight: '100vh' }}>
      <input type="text" value={query} onChange={e => {setQuery(e.target.value); if(e.target.value) setCountry('Tous');}} 
        placeholder="Rechercher..." 
        style={{ width: '100%', padding: '15px', background: '#fff', border: `1px solid ${THEME.border}`, borderRadius: '14px', margin: '20px 0', outline: 'none' }} 
      />

      {/* Boutons Pays */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 15, scrollbarWidth: 'none' }}>
        {['Tous', ...Object.keys(FLAGS)].map(c => (
          <button key={c} onClick={() => setCountry(c)} style={{ flexShrink: 0, padding: '8px 20px', borderRadius: '25px', background: country === c ? THEME.accent : '#fff', color: country === c ? '#fff' : THEME.text, border: `1px solid ${THEME.border}`, fontWeight: '600' }}>{c}</button>
        ))}
      </div>

      {/* Boutons Régions */}
      {country !== 'Tous' && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, padding: '10px 0', borderTop: `1px solid ${THEME.border}`, scrollbarWidth: 'none' }}>
          {['Toutes', ...(REGIONS_BY_COUNTRY[country] || [])].map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{ flexShrink: 0, padding: '7px 15px', borderRadius: '10px', background: region === r ? '#452b00' : 'rgba(139,90,60,0.05)', color: region === r ? '#fff' : THEME.muted, border: 'none', fontSize: '11px', fontWeight: 'bold' }}>{r.toUpperCase()}</button>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
         <span style={{ fontSize: '13px', color: THEME.muted }}>{results.length} pépites trouvées</span>
      </div>
      
      {results.map((w, i) => <WineCard key={i} wine={w} />)}
    </div>
  );
}
