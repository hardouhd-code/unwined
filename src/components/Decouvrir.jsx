import React, { useState, useMemo, useEffect } from 'react';
// Importation directe pour éviter les erreurs de lien
import { BOIR_CATALOG, searchBoirLocal } from '../lib/boirCatalog';

const THEME = {
  card: '#ffffff',
  text: '#452b00',
  muted: '#806c50',
  accent: '#c8956c',
  border: '#e8e1d5',
};

const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Afrique du Sud': '🇿🇦', 'Argentine': '🇦🇷', 'Chili': '🇨🇱', 'Allemagne': '🇩🇪', 'Autriche': '🇦🇹', 'États-Unis': '🇺🇸', 'Grèce': '🇬🇷', 'Georgie': '🇬🇪', 'Belgique': '🇧🇪', 'Australie': '🇦🇺', 'Nouvelle-Zélande': '🇳🇿' };

const REGIONS_BY_COUNTRY = {
  'France': ['Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne', 'Provence'],
  'Italie': ['Piémont', 'Toscane', 'Vénétie', 'Sicile', 'Pouilles'],
  'Espagne': ['Rioja', 'Ribera del Duero', 'Priorat'],
  'Portugal': ['Douro', 'Alentejo'],
};

function WineCard({ wine }) {
  // Traduction automatique des clés courtes (t, p, v...) en clés longues
  const title = wine.title || wine.t || "Vin Inconnu";
  const price = wine.price || wine.p || 0;
  const vendor = wine.vendor || wine.v || "Boir";
  const region = wine.region || wine.r || "Vin";
  const country = wine.country || wine.c || "France";
  const url = wine.url || wine.u || "#";
  const img = wine.image || wine.img || "";

  return (
    <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '12px', boxShadow: '0 4px 12px rgba(139,90,60,0.08)' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 50, height: 60, background: '#f9f7f2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
           <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: '700', color: THEME.text, fontFamily: 'serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: THEME.muted }}>
            {region.toUpperCase()} · {vendor}
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: '700', color: THEME.accent, fontFamily: 'serif' }}>
          {parseFloat(price).toFixed(2)}€
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: THEME.muted, background: '#f9f7f2', padding: '4px 12px', borderRadius: 20 }}>
          {FLAGS[country] || '🍷'} {country}
        </span>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 20px', borderRadius: '24px', background: THEME.accent, color: '#ffffff', fontSize: 12, textDecoration: 'none', fontWeight: '700', textTransform: 'uppercase' }}>Acheter</a>
      </div>
    </div>
  );
}

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('Tous');
  const [region, setRegion] = useState('Toutes');

  const catalog = BOIR_CATALOG || [];

  // Reset region if country changes
  useEffect(() => { setRegion('Toutes'); }, [country]);

  const results = useMemo(() => {
    const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    
    // On travaille sur une liste "propre" avec les vrais noms
    let list = (query.length >= 2) ? searchBoirLocal(query) : catalog;

    return list.filter(w => {
      const wCountry = w.c || w.country || '';
      const wRegion = w.r || w.region || '';
      const wTitle = w.t || w.title || '';

      const matchCountry = country === 'Tous' || norm(wCountry) === norm(country);
      const matchRegion = region === 'Toutes' || norm(wRegion).includes(norm(region)) || norm(wTitle).includes(norm(region));

      // On ne montre rien si pas de recherche ni de pays (évite l'écran surchargé au début)
      if (query.length < 2 && country === 'Tous') return false;

      return matchCountry && matchRegion;
    });
  }, [query, country, region, catalog]);

  return (
    <div style={{ padding: '0 20px 140px', boxSizing: 'border-box' }}>
      
      {/* 1. Recherche */}
      <div style={{ marginBottom: 20 }}>
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Un domaine, un cépage..." 
          style={{ width: '100%', padding: '16px', background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: '16px', color: THEME.text, fontSize: 16, outline: 'none', boxShadow: '0 4px 12px rgba(139,90,60,0.05)' }} 
        />
      </div>

      {/* 2. Pays */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
        {['Tous', 'France', 'Italie', 'Espagne', 'Portugal'].map(c => (
          <button key={c} onClick={() => {setCountry(c); setQuery('');}} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 24, fontSize: 12, background: country === c ? THEME.accent : THEME.card, color: country === c ? '#fff' : THEME.muted, border: `1px solid ${country === c ? THEME.accent : THEME.border}`, fontWeight: '600' }}>{c}</button>
        ))}
      </div>

      {/* 3. Régions (si pays choisi) */}
      {country !== 'Tous' && REGIONS_BY_COUNTRY[country] && (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '10px 0', borderTop: `1px solid ${THEME.border}`, scrollbarWidth: 'none' }}>
          {['Toutes', ...REGIONS_BY_COUNTRY[country]].map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '5px', fontSize: 11, background: 'transparent', color: region === r ? THEME.accent : THEME.muted, border: `1px solid ${region === r ? THEME.accent : 'transparent'}`, fontWeight: region === r ? '700' : '400' }}>{r.toUpperCase()}</button>
          ))}
        </div>
      )}

      {/* 4. Résultats */}
      <div style={{ marginTop: 10 }}>
        <p style={{ fontSize: 13, color: THEME.muted, marginBottom: 15, fontStyle: 'italic' }}>{results.length} pépites trouvées</p>
        
        {results.map((w, i) => <WineCard key={i} wine={w} />)}
        
        {results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: THEME.muted }}>
            {query.length < 2 && country === 'Tous' ? "Sélectionnez un pays pour commencer." : "Aucun vin trouvé."}
          </div>
        )}
      </div>
    </div>
  );
}
