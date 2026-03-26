import React, { useState, useMemo, useEffect } from 'react';
import * as WineData from '../lib/boirCatalog';

const COLORS = { bg: '#000000', card: '#1a1510', accent: '#c8956c', text: '#e8d5b7', muted: '#7a6040', border: '#2a2015' };
const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Afrique du Sud': '🇿🇦', 'Argentine': '🇦🇷', 'Chili': '🇨🇱', 'Allemagne': '🇩🇪', 'Autriche': '🇦🇹', 'États-Unis': '🇺🇸', 'Grèce': '🇬🇷', 'Georgie': '🇬🇪', 'Belgique': '🇧🇪', 'Australie': '🇦🇺', 'Nouvelle-Zélande': '🇳🇿' };
const REGIONS_BY_COUNTRY = {
  'France': ['Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne', 'Provence'],
  'Italie': ['Piémont', 'Toscane', 'Vénétie', 'Sicile', 'Pouilles'],
  'Espagne': ['Rioja', 'Ribera del Duero', 'Priorat'],
  'Portugal': ['Douro', 'Alentejo'],
};

function WineCard({ wine }) {
  // Supporte les clés courtes et longues pour la sécurité
  const title = wine.title || wine.t;
  const price = wine.price || wine.p;
  const vendor = wine.vendor || wine.v;
  const url = wine.url || wine.u;
  const region = wine.region || wine.r;
  const country = wine.country || wine.c;

  return (
    <div style={{ background: COLORS.card, padding: '20px', borderRadius: '14px', border: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '10px', color: COLORS.accent, margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {FLAGS[country] || '🍷'} {region}
        </p>
        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'normal', color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </h3>
        <p style={{ margin: '5px 0 0', fontSize: '12px', color: COLORS.muted }}>{vendor}</p>
      </div>
      <div style={{ textAlign: 'right', marginLeft: '15px' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: COLORS.accent }}>€{price.toFixed(2)}</div>
        <a href={url} target="_blank" rel="noreferrer" style={{ display:'inline-block', marginTop: '10px', background: COLORS.accent, color: '#000', padding: '7px 15px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none' }}>ACHETER</a>
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

  // On remet la région à "Toutes" si on change de pays
  useEffect(() => { setRegion('Toutes'); }, [country]);

  // --- LE MOTEUR DE FILTRAGE UNIQUE ---
  const filteredResults = useMemo(() => {
    let baseList = [];

    // 1. On définit la base : soit le résultat de la recherche, soit TOUT le catalogue
    if (query.trim().length >= 2) {
      baseList = searchFn(query.trim());
    } else {
      baseList = catalog;
    }

    // 2. On applique les filtres sur cette base
    return baseList.filter(w => {
      const wPrice = w.price || w.p;
      const wCountry = w.country || w.c;
      const wRegion = w.region || w.r;
      
      const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

      const mCountry = country === 'Tous' || wCountry === country;
      const mRegion = region === 'Toutes' || norm(wRegion) === norm(region);
      const mPrice = price === 'all' ? true : 
                    price === 'under25' ? wPrice < 25 : 
                    price === '25to50' ? (wPrice >= 25 && wPrice <= 50) : 
                    wPrice > 50;

      return mCountry && mRegion && mPrice;
    }).sort((a, b) => {
      const pA = a.price || a.p;
      const pB = b.price || b.p;
      return sort === 'asc' ? pA - pB : pB - pA;
    });
  }, [query, country, region, price, sort, catalog, searchFn]);

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.text, padding: '20px 16px 100px', fontFamily: 'Georgia, serif', boxSizing:'border-box' }}>
      <header style={{ textAlign: 'center', marginBottom: '25px' }}>
        <h1 style={{ color: COLORS.accent, fontSize: '32px', margin: 0 }}>Unwine-D</h1>
        <p style={{ color: COLORS.muted, fontSize: '12px', marginTop: '5px' }}>LA CAVE DIGITALE</p>
      </header>

      {/* 1. Barre de Recherche */}
      <div style={{ marginBottom: 20 }}>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher (ex: Syrah, Margaux...)" 
          style={{ width: '100%', padding: '15px', background: COLORS.card, border: `1px solid ${COLORS.muted}`, borderRadius: '12px', color: COLORS.text, fontSize: '16px', outline: 'none' }} 
        />
      </div>

      {/* 2. Filtres Pays */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '15px', marginBottom:'10px', scrollbarWidth: 'none' }}>
        {['Tous', ...Object.keys(FLAGS)].map(c => (
          <button key={c} onClick={() => setCountry(c)} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '20px', fontSize: '12px', background: country === c ? COLORS.accent : COLORS.card, color: country === c ? '#1a1510' : COLORS.text, border: `1px solid ${COLORS.muted}` }}>{c}</button>
        ))}
      </div>

      {/* 3. Filtres Régions */}
      {country !== 'Tous' && REGIONS_BY_COUNTRY[country] && (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', borderTop: `1px solid ${COLORS.border}`, paddingTop: '15px', marginBottom:'10px', scrollbarWidth: 'none' }}>
          {['Toutes', ...REGIONS_BY_COUNTRY[country]].map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '5px', fontSize: '11px', background: 'transparent', color: region === r ? COLORS.accent : COLORS.muted, border: `1px solid ${region === r ? COLORS.accent : 'transparent'}` }}>{r.toUpperCase()}</button>
          ))}
        </div>
      )}

      {/* 4. Filtres Prix & Tri */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', gap: 10 }}>
        <select value={price} onChange={e => setPrice(e.target.value)} style={{ background: COLORS.card, color: COLORS.text, border: `1px solid ${COLORS.muted}`, padding: '8px', borderRadius: '8px', flex: 1 }}>
          <option value="all">Tous les prix</option>
          <option value="under25">- 25€</option>
          <option value="25to50">25€ - 50€</option>
          <option value="above50">50€ +</option>
        </select>
        <button onClick={() => setSort(sort==='asc'?'desc':'asc')} style={{ background: 'transparent', border: `1px solid ${COLORS.accent}`, color: COLORS.accent, padding: '8px 15px', borderRadius: '8px', fontSize: 12 }}>
          Prix {sort === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* 5. Liste des Résultats */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 15 }}>{filteredResults.length} vins trouvés</p>
        {filteredResults.map((wine, i) => <WineCard key={i} wine={wine} />)}
        
        {filteredResults.length === 0 && (
          <p style={{ textAlign: 'center', color: COLORS.muted, marginTop: '40px' }}>Aucune pépite ne correspond à vos critères.</p>
        )}
      </div>

      {/* Navigation Basse */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '75px', background: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: `1px solid ${COLORS.border}`, paddingBottom: '10px' }}>
        <div style={{ color: COLORS.muted, textAlign: 'center' }}><span className="material-symbols-outlined">search</span><div style={{ fontSize: '9px', marginTop: '4px' }}>RECHERCHE</div></div>
        <div style={{ color: COLORS.muted, textAlign: 'center' }}><span className="material-symbols-outlined">inventory_2</span><div style={{ fontSize: '9px', marginTop: '4px' }}>MA CAVE</div></div>
      </nav>
    </div>
  );
}
