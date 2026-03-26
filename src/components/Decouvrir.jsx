import React, { useState, useMemo, useEffect } from 'react';
import * as WineData from '../lib/boirCatalog';

// --- THEME CLAIRE (Identique à Ma Cave) ---
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
  const p = wine.price || wine.p || 0;
  const title = wine.title || wine.t || '';
  const vendor = wine.vendor || wine.v || '';
  const region = wine.region || wine.r || '';
  const country = wine.country || wine.c || '';
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
          <div style={{ fontSize: 16, fontWeight: '700', color: THEME.text, fontFamily: 'Playfair Display, serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: THEME.muted, fontFamily: 'Cormorant Garamond, serif' }}>
            {region.toUpperCase()} · {vendor}
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: '700', color: THEME.accent, fontFamily: 'Playfair Display, serif' }}>
          {p.toFixed(2)}€
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: THEME.muted, background: '#f9f7f2', padding: '4px 12px', borderRadius: 20, fontFamily: 'Cormorant Garamond, serif' }}>
          {FLAGS[country] || '🍷'} {country}
        </span>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ 
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
    const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    
    // 1. Base de recherche : soit la saisie, soit tout le catalogue
    let list = (query.length >= 2) ? searchFn(query) : catalog;

    // 2. Filtrage intelligent (Boutons Pays & Région)
    return list.filter(w => {
      const wCountry = w.country || w.c || '';
      const wRegion = w.region || w.r || '';
      const wTitle = w.title || w.t || '';

      // Match Pays
      const matchCountry = country === 'Tous' || norm(wCountry) === norm(country);
      
      // Match Région : On cherche dans le champ Région OU dans le Titre (pour éviter les 0 résultats)
      const matchRegion = region === 'Toutes' || 
                          norm(wRegion).includes(norm(region)) || 
                          norm(wTitle).includes(norm(region));

      // Si on n'a ni recherche ni pays sélectionné, on ne montre rien par défaut (optionnel)
      if (query.length < 2 && country === 'Tous') return false;

      return matchCountry && matchRegion;
    });
  }, [query, country, region, catalog, searchFn]);

  return (
    <div style={{ padding: '0 20px 140px', boxSizing: 'border-box' }}>
      
      <div style={{ marginBottom: 20 }}>
        <input 
          type="text" value={query} onChange={e => {setQuery(e.target.value); if(e.target.value.length >= 2) setCountry('Tous');}} 
          placeholder="Rechercher un domaine, un cépage..." 
          style={{ 
            width: '100%', padding: '16px', background: THEME.card, 
            border: `1px solid ${THEME.border}`, borderRadius: '16px', 
            color: THEME.text, fontSize: 16, outline: 'none', boxSizing: 'border-box',
            boxShadow: '0 4px 12px rgba(139,90,60,0.05)', fontFamily: 'Cormorant Garamond, serif'
          }} 
        />
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
        {['Tous', ...Object.keys(FLAGS)].map(c => (
          <button key={c} onClick={() => {setCountry(c); setQuery('');}} style={{ 
            flexShrink: 0, padding: '8px 16px', borderRadius: 24, fontSize: 12, 
            background: country === c ? THEME.accent : THEME.card, 
            color: country === c ? '#fff' : THEME.muted,
            border: `1px solid ${country === c ? THEME.accent : THEME.border}`,
            fontWeight: '600', transition: 'all 0.2s'
          }}>
            {c}
          </button>
        ))}
      </div>

      {country !== 'Tous' && REGIONS_BY_COUNTRY[country] && (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '10px 0', borderTop: `1px solid ${THEME.border}`, scrollbarWidth: 'none' }}>
          {['Toutes', ...REGIONS_BY_COUNTRY[country]].map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{ 
              flexShrink: 0, padding: '6px 12px', borderRadius: '5px', fontSize: 11, 
              background: 'transparent', 
              color: region === r ? THEME.accent : THEME.muted, 
              border: `1px solid ${region === r ? THEME.accent : 'transparent'}`,
              fontWeight: region === r ? '700' : '400'
            }}>
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <p style={{ fontSize: 13, color: THEME.muted, marginBottom: 15, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
          {results.length} pépites trouvées
        </p>
        {results.map((w, i) => <WineCard key={i} wine={w} />)}
        
        {results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: THEME.muted, fontFamily: 'Cormorant Garamond, serif' }}>
            {query.length < 2 && country === 'Tous' 
              ? "Commencez par choisir un pays ou tapez une recherche." 
              : "Aucun vin ne correspond à cette sélection."}
          </div>
        )}
      </div>
    </div>
  );
}
