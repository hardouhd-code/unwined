import React, { useState, useMemo, useEffect } from 'react';
import { BOIR_CATALOG, searchBoirLocal } from '../lib/boirCatalog';

const THEME = {
  card: '#ffffff',
  text: '#452b00',
  muted: '#806c50',
  accent: '#c8956c',
  border: '#e8e1d5',
};

const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Argentine': '🇦🇷' };

// Mapping des régions par pays présent dans ton catalogue Boir
const REGIONS_BY_COUNTRY = {
  'France': ['Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne', 'Provence', 'Autre'],
  'Italie': ['Piémont', 'Toscane', 'Vénétie', 'Sicile', 'Autre'],
  'Espagne': ['Rioja', 'Priorat', 'Autre'],
  'Portugal': ['Douro', 'Alentejo'],
  'Argentine': ['Mendoza', 'Salta']
};

function WineCard({ wine }) {
  // Gestion des clés courtes (t, p...) et longues (title, price...)
  const title = wine.t || wine.title;
  const price = wine.p || wine.price;
  const region = wine.r || wine.region;
  const vendor = wine.v || wine.vendor;
  const img = wine.img || wine.image;
  const url = wine.u || wine.url;

  return (
    <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '12px', boxShadow: '0 4px 12px rgba(139,90,60,0.08)' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 50, height: 60, background: '#f9f7f2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
           <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: '700', color: THEME.text, fontFamily: 'serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          <div style={{ fontSize: 12, color: THEME.muted }}>{region?.toUpperCase()} · {vendor}</div>
        </div>
        <div style={{ fontSize: 17, fontWeight: '700', color: THEME.accent, fontFamily: 'serif' }}>{price}€</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 20px', borderRadius: '24px', background: THEME.accent, color: '#ffffff', fontSize: 11, textDecoration: 'none', fontWeight: '700', textTransform: 'uppercase' }}>Acheter</a>
      </div>
    </div>
  );
}

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('Tous');
  const [region, setRegion] = useState('Toutes');

  // Quand on change de pays, on remet la région à "Toutes" par défaut
  useEffect(() => { setRegion('Toutes'); }, [country]);

  const results = useMemo(() => {
    const catalog = BOIR_CATALOG || [];
    
    // 1. Si recherche texte active
    if (query.trim().length >= 2) return searchBoirLocal(query);

    // 2. Si pays sélectionné
    if (country !== 'Tous') {
      return catalog.filter(w => {
        const matchCountry = (w.c === country || w.country === country);
        const matchRegion = (region === 'Toutes' || w.r === region || w.region === region);
        return matchCountry && matchRegion;
      });
    }

    return [];
  }, [query, country, region]);

  return (
    <div style={{ padding: '0 20px 140px', boxSizing: 'border-box' }}>
      
      {/* Barre de Recherche */}
      <div style={{ marginBottom: 20 }}>
        <input type="text" value={query} onChange={e => {setQuery(e.target.value); if(e.target.value) setCountry('Tous');}} 
          placeholder="Rechercher (Bordeaux, Syrah...)" 
          style={{ width: '100%', padding: '16px', background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: '16px', color: THEME.text, fontSize: 16, outline: 'none', boxShadow: '0 4px 12px rgba(139,90,60,0.05)' }} 
        />
      </div>

      {/* 1ère Ligne : Pays */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
        {['Tous', ...Object.keys(FLAGS)].map(c => (
          <button key={c} onClick={() => setCountry(c)} style={{ flexShrink: 0, padding: '10px 18px', borderRadius: 24, fontSize: 13, background: country === c ? THEME.accent : THEME.card, color: country === c ? '#fff' : THEME.text, border: `1px solid ${country === c ? THEME.accent : THEME.border}`, fontWeight: '600' }}>
            {FLAGS[c] && <span style={{ marginRight: 6 }}>{FLAGS[c]}</span>}{c}
          </button>
        ))}
      </div>

      {/* 2ème Ligne : Régions (Nouveau !) */}
      {country !== 'Tous' && REGIONS_BY_COUNTRY[country] && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 0', marginTop: 5, scrollbarWidth: 'none', borderTop: `1px solid ${THEME.border}` }}>
          {['Toutes', ...REGIONS_BY_COUNTRY[country]].map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 8, fontSize: 11, background: region === r ? '#452b00' : 'transparent', color: region === r ? '#fff' : THEME.muted, border: `1px solid ${region === r ? '#452b00' : THEME.border}`, fontWeight: '600' }}>
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Résultats */}
      <div style={{ marginTop: 20 }}>
        {results.length > 0 && (
           <p style={{ fontSize: 12, color: THEME.muted, marginBottom: 15, fontStyle: 'italic' }}>{results.length} vins trouvés</p>
        )}
        
        {results.map((w, i) => <WineCard key={i} wine={w} />)}
        
        {results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: THEME.muted }}>
            {query.length < 2 && country === 'Tous' ? "Sélectionnez un pays pour voir les régions." : "Aucune bouteille trouvée."}
          </div>
        )}
      </div>
    </div>
  );
}
