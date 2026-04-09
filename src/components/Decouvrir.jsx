import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { BOIR_CATALOG, searchBoirLocal } from '../lib/boirCatalog';

const THEME = {
  bg: '#19120d',
  surfaceLow: '#211a15',
  surfaceHigh: '#302822',
  card: '#261e18',
  text: '#efe0d6',
  muted: '#d1c5b4',
  accent: '#e9c176'
};
const FLAG_BY_COUNTRY = {
  France: '🇫🇷',
  Italie: '🇮🇹',
  Espagne: '🇪🇸',
  Portugal: '🇵🇹',
  Argentine: '🇦🇷',
  Belgique: '🇧🇪',
  Allemagne: '🇩🇪',
  Chili: '🇨🇱',
  'Nouvelle-Zélande': '🇳🇿',
  'États-Unis': '🇺🇸',
  'Afrique du Sud': '🇿🇦',
};
const PRICE_FILTERS = ['Tous', '<15€', '15–30€', '30–60€', '60€+'];

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function priceBucket(price) {
  const p = Number(price || 0);
  if (p < 15) return '<15€';
  if (p < 30) return '15–30€';
  if (p < 60) return '30–60€';
  return '60€+';
}

function wineTypeLabel(w) {
  const raw = norm(w.y || w.type || w.t || w.title || '');
  if (raw.includes('rouge') || raw.includes('red')) return 'Rouge';
  if (raw.includes('blanc') || raw.includes('white')) return 'Blanc';
  if (raw.includes('rose')) return 'Rosé';
  if (raw.includes('effervescent') || raw.includes('mousseux') || raw.includes('sparkling') || raw.includes('champagne')) return 'Bulles';
  return 'Autre';
}

const WineCard = React.memo(function WineCard({ wine, isFavorite, onToggleFavorite, stockQty }) {
  if (!wine) return null;
  const title = wine.t || wine.title;
  const price = wine.p || wine.price;
  const region = (wine.r || wine.region || "Autre").toUpperCase();
  const vendor = wine.v || wine.vendor;
  const img = wine.img || wine.image;
  const aop = wine.a || wine.aop;
  const type = wineTypeLabel(wine);
  const stockBadge = stockQty > 0 ? `En cave: ${stockQty}` : stockQty === 0 ? 'Rupture cave' : null;

  return (
    <div style={{ background: THEME.card, borderRadius: '16px', padding: '16px', display: 'flex', gap: 12, marginBottom: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
      <div style={{ width: 60, height: 75, background: THEME.surfaceHigh, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
         {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{fontSize: 24}}>🍷</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: '10px', color: THEME.accent, fontWeight: 'bold' }}>{region}</div>
          <button onClick={() => onToggleFavorite(wine)} style={{ border: 'none', background: 'transparent', color: isFavorite ? '#ffb68c' : THEME.muted, fontSize: 16, cursor: 'pointer' }}>
            {isFavorite ? '♥' : '♡'}
          </button>
        </div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.text, fontFamily: 'serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: '12px', color: THEME.muted, opacity: 0.8 }}>{vendor}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          <span style={{ fontSize: 10, background: THEME.surfaceHigh, color: THEME.text, padding: '3px 8px', borderRadius: 12 }}>{type}</span>
          <span style={{ fontSize: 10, background: THEME.surfaceHigh, color: THEME.accent, padding: '3px 8px', borderRadius: 12 }}>{priceBucket(price)}</span>
          {aop && aop !== 'N/A' && <span style={{ fontSize: 10, background: '#302822', color: THEME.muted, padding: '3px 8px', borderRadius: 12 }}>{aop}</span>}
          {stockBadge && <span style={{ fontSize: 10, background: stockQty > 0 ? 'rgba(197,160,89,.2)' : 'rgba(255,182,140,.2)', color: stockQty > 0 ? THEME.accent : '#ffb68c', padding: '3px 8px', borderRadius: 12 }}>{stockBadge}</span>}
        </div>
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: THEME.accent }}>{parseFloat(price || 0).toFixed(2)}€</span>
          <a href={wine.u || wine.url} target="_blank" rel="noreferrer" style={{ background: THEME.accent, color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', textDecoration: 'none', fontWeight: 'bold' }}>VOIR</a>
        </div>
      </div>
    </div>
  );
});

export function Decouvrir({ db = [] }) {
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [country, setCountry] = useState('Tous');
  const [region, setRegion] = useState('Toutes');
  const [priceFilter, setPriceFilter] = useState('Tous');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortMode, setSortMode] = useState('match');
  const [favorites, setFavorites] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const MAX_RESULTS = 120;
  const FAVORITES_KEY = 'unwined_favorites_boir';

  useEffect(() => { setRegion('Toutes'); }, [country]);
  const availableCountries = useMemo(() => {
    const set = new Set();
    for (const w of BOIR_CATALOG || []) {
      const c = w.c || w.country;
      if (c) set.add(c);
    }
    return ['Tous', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))];
  }, []);
  const regionsByCountry = useMemo(() => {
    const map = {};
    for (const w of BOIR_CATALOG || []) {
      const c = w.c || w.country;
      const r = w.r || w.region;
      if (!c || !r) continue;
      if (!map[c]) map[c] = new Set();
      map[c].add(r);
    }
    const out = {};
    Object.keys(map).forEach((c) => {
      out[c] = Array.from(map[c]).sort((a, b) => a.localeCompare(b, 'fr'));
    });
    return out;
  }, []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setFavorites(Array.isArray(parsed) ? parsed : []);
    } catch {
      setFavorites([]);
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(queryInput), 180);
    return () => clearTimeout(timer);
  }, [queryInput]);

  const inventoryByTitle = useMemo(() => {
    const map = new Map();
    for (const w of db) {
      const key = norm(w.name || w.producer || '');
      if (!key) continue;
      const q = Number(w.quantity ?? 0);
      map.set(key, (map.get(key) || 0) + q);
    }
    return map;
  }, [db]);

  const likedProfile = useMemo(() => {
    const liked = db.filter((w) => w.tasted && Number(w.rating) >= 4);
    return {
      types: new Set(liked.map((w) => norm(w.type))),
      regions: new Set(liked.map((w) => norm(w.region))),
      countries: new Set(liked.map((w) => norm(w.country))),
    };
  }, [db]);

  const toggleFavorite = useCallback((wine) => {
    const id = wine.u || wine.url || wine.t || wine.title;
    setFavorites((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  const results = useMemo(() => {
    const catalog = BOIR_CATALOG || [];
    const base = query.trim().length >= 2 ? searchBoirLocal(query) : catalog;
    const deduped = [];
    const seen = new Set();
    for (const w of base) {
      const key = `${norm(w.t || w.title)}|${norm(w.v || w.vendor)}|${Number(w.p || w.price || 0).toFixed(2)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(w);
    }
    return deduped
      .filter((w) => {
        if (country === 'Tous') return true;
        const wCountry = w.c || w.country || '';
        if (wCountry !== country) return false;
        if (region === 'Toutes') return true;
        const r = norm(w.r || w.region || '');
        return r.includes(norm(region));
      })
      .filter((w) => typeFilter === 'Tous' ? true : wineTypeLabel(w) === typeFilter)
      .filter((w) => priceFilter === 'Tous' ? true : priceBucket(w.p || w.price) === priceFilter)
      .filter((w) => {
        if (!onlyFavorites) return true;
        const id = w.u || w.url || w.t || w.title;
        return favorites.includes(id);
      })
      .map((w) => {
        let score = 0;
        if (likedProfile.types.has(norm(wineTypeLabel(w)))) score += 30;
        if (likedProfile.regions.has(norm(w.r || w.region))) score += 35;
        if (likedProfile.countries.has(norm(w.c || w.country))) score += 20;
        const price = Number(w.p || w.price || 0);
        const qualityPrice = price > 0 ? Math.round(((50 + score) / price) * 10) : 0;
        return { ...w, _match: Math.min(99, 50 + score), _qp: qualityPrice };
      })
      .sort((a, b) => {
        if (sortMode === 'priceAsc') return Number(a.p || a.price || 0) - Number(b.p || b.price || 0);
        if (sortMode === 'priceDesc') return Number(b.p || b.price || 0) - Number(a.p || a.price || 0);
        if (sortMode === 'qualityPrice') return (b._qp || 0) - (a._qp || 0);
        return (b._match || 0) - (a._match || 0);
      })
      .slice(0, MAX_RESULTS);
  }, [query, typeFilter, country, region, priceFilter, onlyFavorites, favorites, likedProfile, sortMode]);

  return (
    <div style={{ padding: '0 16px 148px', minHeight: '100vh', background: THEME.bg }}>
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <span style={{ fontSize: 10, color: THEME.accent, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase' }}>Curation exclusive</span>
        <h2 style={{ color: THEME.accent, fontFamily: 'Noto Serif, serif', margin: '6px 0 0', letterSpacing: '1px' }}>Suggestions de Claude</h2>
        <p style={{ fontSize: '12px', color: THEME.muted, lineHeight: 1.45 }}>Decouvrez notre selection hebdomadaire de crus d'exception.</p>
        {results.length === MAX_RESULTS && (
          <p style={{ fontSize: '11px', color: THEME.muted, marginTop: 4 }}>Affichage limité à 120 résultats pour plus de fluidité</p>
        )}
      </div>

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 18, top: 14, color: THEME.muted, fontSize: 18 }}>⌕</span>
        <input type="text" value={queryInput} onChange={e => setQueryInput(e.target.value)} 
          placeholder="Un chateau, une appellation, un cepage..." 
          style={{ width: '100%', height: 54, padding: '0 16px 0 44px', background: '#302822', color: THEME.text, border: '1px solid rgba(197,160,89,.15)', borderRadius: '999px', outline: 'none', boxSizing: 'border-box', boxShadow: '0 20px 40px rgba(37,22,14,0.22)', fontFamily: 'Manrope, sans-serif' }} 
        />
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 15, scrollbarWidth: 'none' }}>
        {['Tous', 'Rouge', 'Blanc', 'Rosé', 'Bulles'].map(c => (
          <button key={c} onClick={() => setTypeFilter(c)} style={{ flexShrink: 0, padding: '11px 18px', borderRadius: 25, background: typeFilter === c ? THEME.accent : THEME.surfaceHigh, color: typeFilter === c ? '#412d00' : THEME.text, border: 'none', fontWeight: '700', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            {c}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10, scrollbarWidth: 'none' }}>
        {PRICE_FILTERS.map((p) => (
          <button key={p} onClick={() => setPriceFilter(p)} style={{ flexShrink: 0, padding: '9px 14px', borderRadius: 20, background: priceFilter === p ? THEME.accent : THEME.surfaceHigh, color: priceFilter === p ? '#412d00' : THEME.text, border: 'none', fontWeight: 700, fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {p}
          </button>
        ))}
        <button onClick={() => setOnlyFavorites((v) => !v)} style={{ flexShrink: 0, padding: '9px 14px', borderRadius: 20, background: onlyFavorites ? '#ffb68c' : THEME.surfaceHigh, color: onlyFavorites ? '#412d00' : THEME.text, border: 'none', fontWeight: 700, fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          {onlyFavorites ? '♥ Favoris' : '♡ Favoris'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10, scrollbarWidth: 'none' }}>
        {[
          ['match', 'Match'],
          ['qualityPrice', 'Qualite/Prix'],
          ['priceAsc', 'Prix ↑'],
          ['priceDesc', 'Prix ↓'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setSortMode(id)} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 18, background: sortMode === id ? THEME.accent : THEME.surfaceHigh, color: sortMode === id ? '#412d00' : THEME.text, border: 'none', fontWeight: 700, fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {label}
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
            {availableCountries.map((c) => (
              <button key={c} onClick={() => setCountry(c)} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 20, background: country === c ? THEME.accent : THEME.surfaceHigh, color: country === c ? '#412d00' : THEME.text, border: 'none', fontWeight: 700, fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                {(FLAG_BY_COUNTRY[c] || '')} {c}
              </button>
            ))}
          </div>
          {country !== 'Tous' && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, scrollbarWidth: 'none' }}>
              {['Toutes', ...(regionsByCountry[country] || [])].map((r) => (
                <button key={r} onClick={() => setRegion(r)} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 20, background: region === r ? THEME.accent : THEME.surfaceHigh, color: region === r ? '#412d00' : THEME.muted, border: 'none', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                  {r}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {results.map((w) => {
        const id = w.u || w.url || w.t || w.title;
        const key = norm(w.t || w.title || '');
        return (
          <WineCard
            key={id}
            wine={w}
            isFavorite={favorites.includes(id)}
            onToggleFavorite={toggleFavorite}
            stockQty={inventoryByTitle.has(key) ? inventoryByTitle.get(key) : null}
          />
        );
      })}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: THEME.accent, opacity: .35 }} />
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: THEME.accent, opacity: .35 }} />
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: THEME.accent, opacity: .35 }} />
      </div>
    </div>
  );
}
