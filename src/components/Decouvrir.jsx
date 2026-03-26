import React, { useState, useMemo, useEffect } from 'react';
import * as WineData from '../lib/boirCatalog';

const COLORS = {
  bg: '#000000',
  card: '#1a1510',
  accent: '#c8956c', 
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

function WineCard({ wine }) {
  return (
    <div style={{ background: COLORS.card, padding: '20px', borderRadius: '14px', border: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '10px', color: COLORS.accent, margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {FLAGS[wine.country] || '🍷'} {wine.region}
        </p>
        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'normal', color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {wine.title}
        </h3>
        <p style={{ margin: '5px 0 0', fontSize: '12px', color: COLORS.muted }}>{wine.vendor}</p>
      </div>
      <div style={{ textAlign: 'right', marginLeft: '15px' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: COLORS.accent }}>€{wine.price.toFixed(2)}</div>
        <a href={wine.url} target="_blank" rel="noreferrer" style={{ display:'inline-block', marginTop: '10px', background: COLORS.accent, color: '#000', padding: '7px 15px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none' }}>ACHETER</a>
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

  useEffect(() => { setRegion('Toutes'); }, [country]);

  const filteredResults = useMemo(() => {
    let list = (query.length >= 2) ? searchFn(query) : 
               (country !== 'Tous') ? catalog.filter(w => w.country === country) : [];

    return list.filter(w => {
      const mPrice = price === 'under25' ? w.price < 25 : 
                    price === '25to50' ? (w.price >= 25 && w.price <= 50) : 
                    price === 'above50' ? w.price > 50 : true;
      const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
      const mRegion = region === 'Toutes' || norm(w.region) === norm(region);
      return mPrice && mRegion;
    }).sort((a, b) => sort === 'asc' ? a.price - b.price : b.price - a.price);
  }, [query, country, region, price, sort, catalog, searchFn]);

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.text, padding: '20px 20px 100px', fontFamily: 'Georgia, serif', boxSizing:'border-box' }}>
      <header style={{ textAlign: 'center', marginBottom: '25px' }}>
        <h1 style={{ color: COLORS.accent, fontSize: '32px', margin: 0 }}>Unwine-D</h1>
        <p style={{ color: COLORS.muted, fontSize: '12px', marginTop: '5px' }}>LA CAVE DIGITALE</p>
      </header>

      <input type="text" value={query} onChange={(e) => {setQuery(e.target.value); if(e.target.value) setCountry('Tous');}} placeholder="Rechercher..." 
        style={{ width: '100%', padding: '15px', background: COLORS.card, border: `1px solid ${COLORS.muted}`, borderRadius: '12px', color: COLORS.text, fontSize: '16px', outline: 'none', marginBottom: '20px' }} 
      />

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '15px', marginBottom:'10px', scrollbarWidth: 'none' }}>
        {['Tous', ...Object.keys(FLAGS)].map(c => (
          <button key={c} onClick={() => {setCountry(c); setQuery('');}} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '20px', fontSize: '12px', background: country === c ? COLORS.accent : COLORS.card, color: country === c ? '#000' : COLORS.text, border: `1px solid ${COLORS.muted}` }}>{c}</button>
        ))}
      </div>

      {country !== 'Tous' && REGIONS_BY_COUNTRY[country] && (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', borderTop: `1px solid ${COLORS.border}`, paddingTop: '15px', marginBottom:'10px', scrollbarWidth: 'none' }}>
          {['Toutes', ...REGIONS_BY_COUNTRY[country]].map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '5px', fontSize: '11px', background: 'transparent', color: region === r ? COLORS.accent : COLORS.muted, border: `1px solid ${region === r ? COLORS.accent : 'transparent'}` }}>{r.toUpperCase()}</button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', gap: 10 }}>
        <select value={price} onChange={e => setPrice(e.target.value)} style={{ background: COLORS.card, color: COLORS.text, border: `1px solid ${COLORS.muted}`, padding: '8px', borderRadius: '8px', flex: 1 }}>
          <option value="all">Tous les prix</option>
          <option value="under25">- 25€</option>
          <option value="25to50">25€ - 50€</option>
          <option value="above50">50€ +</option>
        </select>
        <button onClick={() => setSort(sort==='asc'?'desc':'asc')} style={{ background: 'transparent', border: `1px solid ${COLORS.accent}`, color: COLORS.accent, padding: '8px 15px', borderRadius: '8px' }}>Prix {sort === 'asc' ? '↑' : '↓'}</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {filteredResults.map((wine, i) => <WineCard key={i} wine={wine} />)}
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '75px', background: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: `1px solid ${COLORS.border}`, paddingBottom: '10px' }}>
        <div style={{ color: COLORS.accent, textAlign: 'center' }}><span className="material-symbols-outlined">search</span><div style={{ fontSize: '9px', marginTop: '4px', fontWeight:'bold' }}>RECHERCHE</div></div>
        <div style={{ color: COLORS.muted, textAlign: 'center' }}><span className="material-symbols-outlined">inventory_2</span><div style={{ fontSize: '9px', marginTop: '4px' }}>MA CAVE</div></div>
      </nav>
    </div>
  );
}
