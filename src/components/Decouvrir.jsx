import React, { useState, useMemo, useEffect } from 'react';
import { BOIR_CATALOG, searchBoirLocal } from '../lib/boirCatalog';

const THEME = { card: '#ffffff', text: '#452b00', muted: '#806c50', accent: '#c8956c', border: '#e8e1d5' };
const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Argentine': '🇦🇷' };

const REGIONS_BY_COUNTRY = {
  'France': ['Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne'],
  'Italie': ['Piémont', 'Toscane', 'Vénétie', 'Sicile'],
};

function WineCard({ wine }) {
  if (!wine) return null;
  const t = wine.t || wine.title;
  const p = wine.p || wine.price;
  const r = (wine.r || wine.region || "Autre").toUpperCase();
  const v = wine.v || wine.vendor;
  const img = wine.img || wine.image;
  const url = wine.u || wine.url;

  return (
    <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: '16px', padding: '16px', display: 'flex', gap: 12, marginBottom: '12px', boxShadow: '0 4px 12px rgba(139,90,60,0.08)' }}>
      <div style={{ width: 55, height: 65, background: '#f9f7f2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
         {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{fontSize: 20}}>🍷</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10px', color: THEME.accent, fontWeight: 'bold' }}>{r}</div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.text, fontFamily: 'serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</div>
        <div style={{ fontSize: '12px', color: THEME.muted, opacity: 0.8 }}>{v}</div>
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: THEME.accent }}>{parseFloat(p).toFixed(2)}€</span>
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

  useEffect(() => { setRegion('Toutes'); }, [country]);

  const results = useMemo(() => {
    const catalog = BOIR_CATALOG || [];
    
    // 1. Si l'utilisateur tape une recherche, on utilise la fonction de recherche globale
    if (query.trim().length >= 2) return searchBoirLocal(query);

    // 2. Si aucun pays n'est sélectionné, on ne montre rien (évite de charger 800 vins pour rien)
    if (country === 'Tous') return [];

    const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    const targetCountry = country;
    const targetRegion = region;

    return catalog.filter(w => {
      // Filtrage par Pays (c ou country)
      const wCountry = w.c || w.country || '';
      if (wCountry !== targetCountry) return false;

      // Si on veut "Toutes" les régions du pays
      if (targetRegion === 'Toutes') return true;

      // --- LE FILTRE MAGIQUE ---
      // On cherche si le nom de la région est dans la case "r" OU dans le titre "t"
      const rName = norm(w.r || w.region || '');
      const tName = norm(w.t || w.title || '');
      const searchVal = norm(targetRegion);
      
      return rName.includes(searchVal) || tName.includes(searchVal);
    });
  }, [query, country, region]);

  return (
    <div style={{ padding: '0 20px 140px', minHeight: '100vh' }}>
      
      {/* Recherche */}
      <input type="text" value={query} onChange={e => {setQuery(e.target.value); if(e.target.value) setCountry('Tous');}} 
        placeholder="Rechercher (ex: Margaux, Syrah...)" 
        style={{ width: '100%', padding: '16px', background: '#fff', border: `1px solid ${THEME.border}`, borderRadius: '14px', margin: '20px 0', fontSize: '16px', outline: 'none' }} 
      />

      {/* Pays */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 15, scrollbarWidth: 'none' }}>
        {['Tous', ...Object.keys(FLAGS)].map(c => (
          <button key={c} onClick={() => setCountry(c)} style={{ flexShrink: 0, padding: '10px 18px', borderRadius: '25px', background: country === c ? THEME.accent : '#fff', color: country === c ? '#fff' : THEME.text, border: `1px solid ${THEME.border}`, fontWeight: '600' }}>
            {FLAGS[c]} {c}
          </button>
        ))}
      </div>

      {/* Régions (Apparaissent si Pays sélectionné) */}
      {country !== 'Tous' && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, padding: '10px 0', borderTop: `1px solid ${THEME.border}`, scrollbarWidth: 'none' }}>
          {['Toutes', ...(REGIONS_BY_COUNTRY[country] || []), 'Autre'].map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{ flexShrink: 0, padding: '7px 15px', borderRadius: '10px', background: region === r ? '#452b00' : 'rgba(139,90,60,0.05)', color: region === r ? '#fff' : THEME.muted, border: 'none', fontSize: '11px', fontWeight: 'bold' }}>
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Liste des résultats */}
      <div style={{ marginBottom: 15 }}>
         <span style={{ fontSize: '13px', color: THEME.muted, fontStyle: 'italic' }}>
            {results.length} pépites trouvées
         </span>
      </div>
      
      {results.map((w, i) => <WineCard key={i} wine={w} />)}

      {results.length === 0 && country !== 'Tous' && (
        <div style={{ textAlign: 'center', padding: '40px', color: THEME.muted }}>
          Aucun vin ne correspond à cette région.
        </div>
      )}
    </div>
  );
}
