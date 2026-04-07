import React, { useState, useMemo, useEffect } from 'react';
import { BOIR_CATALOG, searchBoirLocal } from '../lib/boirCatalog';

const THEME = {
  bg: '#fff8f1',
  surfaceLow: '#faf2ea',
  surfaceHigh: '#e8e1da',
  card: '#f4ede5',
  text: '#25160e',
  muted: '#4f4540',
  accent: '#775a19'
};
const FLAGS = { 'France': '🇫🇷', 'Italie': '🇮🇹', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Argentine': '🇦🇷', 'Belgique': '🇧🇪' };
const REGIONS_BY_COUNTRY = {
  'France': ['Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne', 'Autre'],
  'Italie': ['Piémont', 'Toscane', 'Vénétie', 'Sicile'],
};

function WineCard({ wine }) {
  if (!wine) return null;
  const title = wine.t || wine.title;
  const price = wine.p || wine.price;
  const region = (wine.r || wine.region || "Autre").toUpperCase();
  const vendor = wine.v || wine.vendor;
  const img = wine.img || wine.image;

  return (
    <div style={{ background: THEME.card, borderRadius: '16px', padding: '16px', display: 'flex', gap: 12, marginBottom: '12px', boxShadow: '0 20px 40px rgba(37,22,14,0.04)' }}>
      <div style={{ width: 60, height: 75, background: THEME.surfaceHigh, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
         {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{fontSize: 24}}>🍷</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10px', color: THEME.accent, fontWeight: 'bold' }}>{region}</div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.text, fontFamily: 'serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: '12px', color: THEME.muted, opacity: 0.8 }}>{vendor}</div>
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: THEME.accent }}>{parseFloat(price || 0).toFixed(2)}€</span>
          <a href={wine.u || wine.url} target="_blank" rel="noreferrer" style={{ background: THEME.accent, color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', textDecoration: 'none', fontWeight: 'bold' }}>VOIR</a>
        </div>
      </div>
    </div>
  );
}

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [country, setCountry] = useState('Tous');
  const [region, setRegion] = useState('Toutes');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const MAX_RESULTS = 120;

  useEffect(() => { setRegion('Toutes'); }, [country]);

  const results = useMemo(() => {
    const catalog = BOIR_CATALOG || [];
    const base = query.trim().length >= 2 ? searchBoirLocal(query) : catalog;

    const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    const mapType = (w) => {
      const raw = norm(w.y || w.type || w.t || '');
      if (raw.includes('rouge') || raw.includes('red')) return 'Rouge';
      if (raw.includes('blanc') || raw.includes('white')) return 'Blanc';
      if (raw.includes('rose')) return 'Rosé';
      if (raw.includes('effervescent') || raw.includes('mousseux') || raw.includes('sparkling') || raw.includes('champagne')) return 'Bulles';
      return 'Autre';
    };

    return base
      .filter((w) => {
        if (country === 'Tous') return true;
        const wCountry = w.c || w.country || '';
        if (wCountry !== country) return false;
        if (region === 'Toutes') return true;
        const r = norm(w.r || w.region || '');
        return r.includes(norm(region));
      })
      .filter((w) => typeFilter === 'Tous' ? true : mapType(w) === typeFilter)
      .slice(0, MAX_RESULTS);
  }, [query, typeFilter, country, region]);

  return (
    <div style={{ padding: '0 20px 140px', minHeight: '100vh', background: THEME.bg }}>
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <span style={{ fontSize: 10, color: THEME.accent, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase' }}>Curation exclusive</span>
        <h2 style={{ color: THEME.text, fontFamily: 'Noto Serif, serif', margin: '6px 0 0', letterSpacing: '1px' }}>Suggestions de Claude</h2>
        <p style={{ fontSize: '11px', color: THEME.muted }}>Decouvrez notre selection hebdomadaire de crus d'exception.</p>
        {results.length === MAX_RESULTS && (
          <p style={{ fontSize: '11px', color: THEME.muted, marginTop: 4 }}>Affichage limité à 120 résultats pour plus de fluidité</p>
        )}
      </div>

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 18, top: 14, color: THEME.muted, fontSize: 18 }}>⌕</span>
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} 
          placeholder="Un chateau, une appellation, un cepage..." 
          style={{ width: '100%', height: 54, padding: '0 16px 0 44px', background: '#fff', border: 'none', borderRadius: '999px', outline: 'none', boxSizing: 'border-box', boxShadow: '0 20px 40px rgba(37,22,14,0.04)', fontFamily: 'Manrope, sans-serif' }} 
        />
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 15, scrollbarWidth: 'none' }}>
        {['Tous', 'Rouge', 'Blanc', 'Rosé', 'Bulles'].map(c => (
          <button key={c} onClick={() => setTypeFilter(c)} style={{ flexShrink: 0, padding: '10px 18px', borderRadius: 25, background: typeFilter === c ? THEME.text : THEME.surfaceHigh, color: typeFilter === c ? '#fff' : THEME.text, border: 'none', fontWeight: '700', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            {c}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowAdvanced((v) => !v)}
        style={{ width: '100%', marginBottom: 10, background: 'transparent', border: 'none', textAlign: 'left', color: THEME.muted, fontFamily: 'Manrope, sans-serif', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' }}
      >
        {showAdvanced ? '− Filtres avances' : '+ Filtres avances'}
      </button>

      {showAdvanced && (
        <>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 8, scrollbarWidth: 'none' }}>
            {['Tous', ...Object.keys(FLAGS)].map((c) => (
              <button key={c} onClick={() => setCountry(c)} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 20, background: country === c ? THEME.accent : THEME.surfaceHigh, color: country === c ? '#fff' : THEME.text, border: 'none', fontWeight: 700, fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                {FLAGS[c] || ''} {c}
              </button>
            ))}
          </div>
          {country !== 'Tous' && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, scrollbarWidth: 'none' }}>
              {['Toutes', ...(REGIONS_BY_COUNTRY[country] || [])].map((r) => (
                <button key={r} onClick={() => setRegion(r)} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 20, background: region === r ? THEME.text : THEME.surfaceHigh, color: region === r ? '#fff' : THEME.muted, border: 'none', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                  {r}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {results.map((w) => <WineCard key={w.u || w.url || w.t || w.title} wine={w} />)}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: THEME.accent, opacity: .35 }} />
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: THEME.accent, opacity: .35 }} />
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: THEME.accent, opacity: .35 }} />
      </div>
    </div>
  );
}
