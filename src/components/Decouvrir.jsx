import React, { useState, useMemo, useEffect } from 'react';
// On importe le catalogue avec une sécurité maximale
import * as WineData from '../lib/boirCatalog';

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

// Composant Carte avec sécurité sur les données
function WineCard({ wine }) {
  if (!wine) return null;
  
  // Sécurisation des valeurs pour éviter le crash .toFixed()
  const priceVal = wine.price || wine.p || 0;
  const displayPrice = typeof priceVal === 'number' ? priceVal.toFixed(2) : parseFloat(priceVal || 0).toFixed(2);
  
  const title = wine.title || wine.t || 'Vin sans nom';
  const region = wine.region || wine.r || 'Région';
  const country = wine.country || wine.c || 'France';
  const vendor = wine.vendor || wine.v || 'Boir';
  const url = wine.url || wine.u || '#';
  const img = wine.image || wine.img || '';

  return (
    <div style={{ 
      background: THEME.card, border: `1px solid ${THEME.border}`, 
      borderRadius: '16px', padding: '16px', display: 'flex', 
      flexDirection: 'column', gap: 10, marginBottom: '12px',
      boxShadow: '0 4px 12px rgba(139,90,60,0.08)' 
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 50, height: 65, background: '#f9f7f2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
           <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: THEME.text, fontFamily: 'serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: THEME.muted, fontFamily: 'serif' }}>
            {region.toUpperCase()} · {vendor}
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 'bold', color: THEME.accent, fontFamily: 'serif' }}>
          {displayPrice}€
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: THEME.muted, background: '#f9f7f2', padding: '4px 12px', borderRadius: 20 }}>
          {FLAGS[country] || '🍷'} {country}
        </span>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ 
          padding: '8px 20px', borderRadius: '24px', background: THEME.accent, 
          color: '#ffffff', fontSize: 12, textDecoration: 'none', fontWeight: 'bold'
        }}>Acheter</a>
      </div>
    </div>
  );
}

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('Tous');
  const [region, setRegion] = useState('Toutes');

  // Sécurité sur les données importées
  const catalog = WineData?.BOIR_CATALOG || [];
  const searchFn = WineData?.searchBoirLocal || (() => []);

  useEffect(() => { setRegion('Toutes'); }, [country]);

  // Moteur de recherche robuste
  const results = useMemo(() => {
    const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    
    // Si on a tapé quelque chose, on utilise la fonction de recherche
    let baseList = (query.trim().length >= 2) ? searchFn(query.trim()) : catalog;

    // Si rien n'est sélectionné et pas de recherche, on montre une liste vide
    if (query.trim().length < 2 && country === 'Tous') return [];

    return baseList.filter(w => {
      const wCountry = w.country || w.c || '';
      const wRegion = w.region || w.r || '';
      const wTitle = w.title || w.t || '';

      const matchCountry = country === 'Tous' || norm(wCountry) === norm(country);
      const matchRegion = region === 'Toutes' || 
                          norm(wRegion).includes(norm(region)) || 
                          norm(wTitle).includes(norm(region));

      return matchCountry && matchRegion;
    });
  }, [query, country, region, catalog, searchFn]);

  return (
    <div style={{ padding: '0 20px 140px', boxSizing: 'border-box', width: '100%' }}>
      
      {/* 1. Barre de Recherche */}
      <div style={{ marginBottom: 20 }}>
        <input 
          type="text" value={query} 
          onChange={e => {
            setQuery(e.target.value);
            if (e.target.value.length >= 2) setCountry('Tous');
          }} 
          placeholder="Un domaine, une région..." 
          style={{ 
            width: '100%', padding: '16px', background: THEME.card, 
            border: `1px solid ${THEME.border}`, borderRadius: '16px', 
            color: THEME.text, fontSize: 16, outline: 'none', boxSizing: 'border-box',
            boxShadow: '0 4px 12px rgba(139,90,60,0.05)'
          }} 
        />
      </div>

      {/* 2. Boutons Pays */}
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

      {/* 3. Boutons Régions */}
      {country !== 'Tous' && REGIONS_BY_COUNTRY[country] && (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '10px 0', borderTop: `1px solid ${THEME.border}`, scrollbarWidth: 'none' }}>
          {['Toutes', ...REGIONS_BY_COUNTRY[country]].map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{ 
              flexShrink: 0, padding: '6px 12px', borderRadius: '5px', fontSize: 11, 
              background: 'transparent', 
              color: region === r ? THEME.accent : THEME.muted, 
              border: `1px solid ${region === r ? THEME.accent : 'transparent'}`,
              fontWeight: region === r ? 'bold' : 'normal'
            }}>
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* 4. Liste des Vins */}
      <div style={{ marginTop: 20 }}>
        <p style={{ fontSize: 13, color: THEME.muted, marginBottom: 15, fontStyle: 'italic' }}>
          {results.length} pépites trouvées
        </p>
        
        {results.map((w, i) => <WineCard key={i} wine={w} />)}
        
        {results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: THEME.muted }}>
            {query.length < 2 && country === 'Tous' 
              ? "Choisissez un pays ou recherchez un vin." 
              : "Aucune bouteille trouvée."}
          </div>
        )}
      </div>
    </div>
  );
}
