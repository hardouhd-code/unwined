import React, { useState, useMemo, useEffect } from 'react';
// Importation sécurisée du catalogue
import * as WineData from '../lib/boirCatalog';

// --- CONFIGURATION LOOK VINTAGE (CONSERVÉ) ---
const COLORS = {
  bg: '#000000',
  card: '#1a1510',
  accent: '#c8956c', // Doré vintage
  text: '#e8d5b7',
  muted: '#7a6040',
  border: '#2a2015'
};

const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Afrique du Sud': '🇿🇦', 'Argentine': '🇦🇷', 'Chili': '🇨🇱', 'Allemagne': '🇩🇪', 'Autriche': '🇦🇹', 'États-Unis': '🇺🇸', 'Grèce': '🇬🇷', 'Georgie': '🇬🇪', 'Belgique': '🇧🇪', 'Australie': '🇦🇺', 'Nouvelle-Zélande': '🇳🇿' };

const REGIONS_BY_COUNTRY = {
  'France': ['Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne', 'Provence'],
  'Italie': ['Piémont', 'Toscane', 'Vénétie', 'Sicile', 'Pouilles'],
  'Espagne': ['Rioja', 'Ribera del Duero', 'Priorat'],
  'Portugal': ['Douro', 'Alentejo'],
};

// --- COMPOSANT CARTE ---
function WineCard({ wine }) {
  const p = wine.p || wine.price || 0;
  return (
    <div style={{ 
      background: COLORS.card, padding: '20px', borderRadius: '14px', 
      border: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '10px', color: COLORS.accent, margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {FLAGS[wine.country || wine.c] || '🍷'} {(wine.region || wine.r || 'Vin')}
        </p>
        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'normal', color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {wine.title || wine.t}
        </h3>
        <p style={{ margin: '5px 0 0', fontSize: '12px', color: COLORS.muted }}>{wine.vendor || wine.v}</p>
      </div>
      <div style={{ textAlign: 'right', marginLeft: '15px' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: COLORS.accent, fontFamily: 'Georgia, serif' }}>
          €{p.toFixed(2)}
        </div>
        <a href={wine.url || wine.u} target="_blank" rel="noreferrer" style={{ 
          display:'inline-block', marginTop: '10px', background: COLORS.accent, color: '#000', 
          padding: '7px 15px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', fontFamily: 'sans-serif' 
        }}>ACHETER</a>
      </div>
    </div>
  );
}

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('Tous');
  const [region, setRegion] = useState('Toutes');
  const [price, setPrice] = useState('all');
  const [sort, setSort] = useState('asc');

  const catalog = WineData?.BOIR_CATALOG || [];
  const searchFn = WineData?.searchBoirLocal || (() => []);

  // Reset la région quand on change de pays
  useEffect(() => { setRegion('Toutes'); }, [country]);

  // --- LE MOTEUR DE RECHERCHE ET FILTRAGE MIS À JOUR ---
  const results = useMemo(() => {
    let list = [];
    
    // 1. On récupère la base de données (soit via recherche, soit tout le pays)
    if (query.length >= 2) {
      list = searchFn(query);
    } else if (country !== 'Tous') {
      list = catalog.filter(w => (w.c || w.country) === country);
    } else {
      return []; // Si rien n'est sélectionné, on n'affiche rien
    }

    // 2. On applique les filtres secondaires (Région, Prix, Tri)
    return list.filter(w => {
      const wPrice = w.p || w.price || 0;
      
      // Normalisation pour que "Piémont" match avec "piemonte" ou "piemont" dans les données
      const wRegionNormalized = (w.r || w.region || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
      const selectedRegionNormalized = region.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
      
      const mPrice = price === 'under25' ? wPrice < 25 : 
                    price === '25to50' ? (wPrice >= 25 && wPrice <= 50) : 
                    price === 'above50' ? wPrice > 50 : true;
      
      const mRegion = region === 'Toutes' || wRegionNormalized === selectedRegionNormalized;
      
      return mPrice && mRegion;
    }).sort((a, b) => {
      const pA = a.p || a.price || 0;
      const pB = b.p || b.price || 0;
      return sort === 'asc' ? pA - pB : pB - pA;
    });
  }, [query, country, region, price, sort, catalog, searchFn]);

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.text, padding: '20px 20px 100px', fontFamily: 'Georgia, serif', boxSizing:'border-box', overflowX:'hidden' }}>
      
      {/* HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '25px', position:'sticky', top:0, background: COLORS.bg, zIndex:10, padding: '10px 0' }}>
        <h1 style={{ color: COLORS.accent, fontSize: '32px', margin: 0, fontWeight: 'normal' }}>Unwine-D</h1>
        <p style={{ color: COLORS.muted, fontSize: '12px', marginTop: '5px', letterSpacing:'1px' }}>LA CAVE DIGITALE</p>
      </header>

      {/* RECHERCHE */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          value={query}
          onChange={(e) => {setQuery(e.target.value); if(e.target.value) setCountry('Tous');}}
          placeholder="Un domaine, une région..." 
          style={{ 
            width: '100%', padding: '15px', background: COLORS.card, border: `1px solid ${COLORS.muted}`, 
            borderRadius: '12px', color: COLORS.text, fontSize: '16px', outline: 'none', fontFamily: 'Georgia, serif', boxSizing:'border-box'
          }} 
        />
      </div>

      {/* FILTRES PAYS */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '15px', marginBottom:'10px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {['Tous', ...Object.keys(FLAGS)].map(c => (
          <button key={c} onClick={() => {setCountry(c); setQuery('');}} style={{ 
            flexShrink: 0, padding: '8px 16px', borderRadius: '20px', fontSize: '12px', cursor:'pointer', transition:'0.2s', fontFamily:'Georgia, serif',
            background: country === c ? COLORS.accent : COLORS.card, 
            color: country === c ? '#000' : COLORS.text, 
            border: `1px solid ${country === c ? COLORS.accent : COLORS.muted}`
          }}>
            {c}
          </button>
        ))}
      </div>

      {/* FILTRES RÉGIONS */}
      {country !== 'Tous' && REGIONS_BY_COUNTRY[country] && (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', borderTop: `1px solid ${COLORS.border}`, paddingTop: '15px', marginBottom:'10px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {['Toutes', ...REGIONS_BY_COUNTRY[country]].map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{ 
              flexShrink: 0, padding: '6px 12px', borderRadius: '5px', fontSize: '11px', cursor:'pointer', transition:'0.2s', fontFamily:'Georgia, serif', background: 'transparent', 
              color: region === r ? COLORS.accent : COLORS.muted, 
              border: `1px solid ${region === r ? COLORS.accent : 'transparent'}`
            }}>
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* FILTRES PRIX ET TRI */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: 10 }}>
        <select value={price} onChange={e => setPrice(e.target.value)} style={{ background: COLORS.card, color: COLORS.text, border: `1px solid ${COLORS.muted}`, padding: '8px', borderRadius: '8px', fontSize: '12px', fontFamily: 'Georgia, serif', flex: 1, outline:'none' }}>
          <option value="all">Tous les prix</option>
          <option value="under25">- 25€</option>
          <option value="25to50">25€ - 50€</option>
          <option value="above50">50€ +</option>
        </select>
        <button onClick={() => setSort(sort==='asc'?'desc':'asc')} style={{ background: 'transparent', border: `1px solid ${COLORS.accent}`, color: COLORS.accent, padding: '8px 15px', borderRadius: '8px', fontSize: '12px', cursor:'pointer', fontFamily:'Georgia, serif', fontWeight:'bold' }}>
          Prix {sort === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* LISTE DES RÉSULTATS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {results.map((wine, i) => (
          <WineCard key={i} wine={wine} />
        ))}
        {(query.length >= 2 || country !== 'Tous') && results.length === 0 && (
            <p style={{ textAlign: 'center', color: COLORS.muted, marginTop: '40px', fontStyle: 'italic' }}>Aucune pépite trouvée.</p>
        )}
      </div>

      {/* BARRE DE NAVIGATION FIXE */}
      <nav style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '75px', 
        background: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(10px)', 
        display: 'flex', justifyContent: 'space-around', alignItems: 'center', 
        borderTop: `1px solid ${COLORS.border}`, paddingBottom: '10px', zIndex: 100
      }}>
        <div style={{ color: COLORS.accent, textAlign: 'center', cursor:'pointer' }}>
          <span className="material-symbols-outlined">search</span>
          <div style={{ fontSize: '9px', marginTop: '4px', fontFamily:'sans-serif', fontWeight:'bold' }}>RECHERCHE</div>
        </div>
        <div style={{ color: COLORS.muted, textAlign: 'center', cursor:'pointer' }}>
          <span className="material-symbols-outlined">inventory_2</span>
          <div style={{ fontSize: '9px', marginTop: '4px', fontFamily:'sans-serif' }}>MA CAVE</div>
        </div>
      </nav>
    </div>
  );
}
