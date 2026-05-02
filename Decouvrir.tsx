import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { BOIR_CATALOG, searchBoirLocal } from '../lib/boirCatalog';


const FLAG_BY_COUNTRY: Record<string, string> = {
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

const norm = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function priceBucket(price: any) {
  const p = Number(price || 0);
  if (p < 15) return '<15€';
  if (p < 30) return '15–30€';
  if (p < 60) return '30–60€';
  return '60€+';
}

function wineTypeLabel(w: any) {
  const raw = norm(w.y || w.type || w.t || w.title || '');
  if (raw.includes('rouge') || raw.includes('red')) return 'Rouge';
  if (raw.includes('blanc') || raw.includes('white')) return 'Blanc';
  if (raw.includes('rose')) return 'Rosé';
  if (raw.includes('effervescent') || raw.includes('mousseux') || raw.includes('sparkling') || raw.includes('champagne')) return 'Bulles';
  return 'Autre';
}

const WineCard = React.memo(function WineCard({ wine, isFavorite, onToggleFavorite, stockQty }: { wine: any, isFavorite: boolean, onToggleFavorite: (w: any) => void, stockQty: any }) {
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
    <div className="bg-[#261e18] rounded-2xl p-4 flex gap-3 mb-3 shadow-[0_8px_16px_rgba(0,0,0,0.2)]">
      <div className="w-[60px] h-[75px] bg-[#302822] rounded-lg flex items-center justify-center shrink-0">
         {img ? <img src={img} alt="" className="w-full h-full object-contain" /> : <span className="text-2xl">🍷</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center gap-2">
          <div className="text-[10px] text-[var(--color-gold)] font-bold">{region}</div>
          <button onClick={() => onToggleFavorite(wine)} className={`border-none bg-transparent text-base cursor-pointer ${isFavorite ? "text-[#ffb68c]" : "text-[var(--color-muted-text)]"}`}>
            {isFavorite ? '♥' : '♡'}
          </button>
        </div>
        <div className="text-[15px] font-bold text-[var(--color-cream)] font-serif whitespace-nowrap overflow-hidden text-ellipsis">{title}</div>
        <div className="text-[12px] text-[var(--color-muted-text)] opacity-80">{vendor}</div>
        <div className="flex gap-1.5 flex-wrap mt-2">
          <span className="text-[10px] bg-[#302822] text-[var(--color-cream)] px-2 py-[3px] rounded-xl">{type}</span>
          <span className="text-[10px] bg-[#302822] text-[var(--color-gold)] px-2 py-[3px] rounded-xl">{priceBucket(price)}</span>
          {aop && aop !== 'N/A' && <span className="text-[10px] bg-[#302822] text-[var(--color-muted-text)] px-2 py-[3px] rounded-xl">{aop}</span>}
          {stockBadge && <span className={`text-[10px] px-2 py-[3px] rounded-xl ${stockQty > 0 ? "bg-[rgba(197,160,89,.2)] text-[var(--color-gold)]" : "bg-[rgba(255,182,140,.2)] text-[#ffb68c]"}`}>{stockBadge}</span>}
        </div>
        <div className="mt-2.5 flex justify-between items-center">
          <span className="text-base font-bold text-[var(--color-gold)]">{parseFloat(price || 0).toFixed(2)}€</span>
          <a href={wine.u || wine.url} target="_blank" rel="noreferrer" className="bg-[var(--color-gold)] text-white px-4 py-1.5 rounded-full text-[11px] no-underline font-bold">VOIR</a>
        </div>
      </div>
    </div>
  );
});

export function Decouvrir() {
  const { db } = useStore();
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
    const set = new Set<string>();
    for (const w of (BOIR_CATALOG as any) || []) {
      const c = w.c || w.country;
      if (c) set.add(c);
    }
    return ['Tous', ...Array.from(set).sort((a: any, b: any) => a.localeCompare(b, 'fr'))];
  }, []);
  const regionsByCountry = useMemo(() => {
    const map: any = {};
    for (const w of (BOIR_CATALOG as any) || []) {
      const c = w.c || w.country;
      const r = w.r || w.region;
      if (!c || !r) continue;
      if (!map[c]) map[c] = new Set<string>();
      map[c].add(r);
    }
    const out: any = {};
    Object.keys(map).forEach((c) => {
      out[c] = Array.from(map[c] as Set<string>).sort((a: any, b: any) => a.localeCompare(b, 'fr'));
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

  const toggleFavorite = useCallback((wine: any) => {
    const id = wine.u || wine.url || wine.t || wine.title;
    setFavorites((prev: any) => prev.includes(id) ? prev.filter((x: any) => x !== id) : [...prev, id] as never[]);
  }, []);

  const results = useMemo(() => {
    const catalog = BOIR_CATALOG || [];
    const base = query.trim().length >= 2 ? searchBoirLocal(query) : catalog;
    const deduped: any[] = [];
    const seen = new Set();
    for (const w of (base as any[])) {
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
      .filter((w: any) => {
        if (!onlyFavorites) return true;
        const id = w.u || w.url || w.t || w.title;
        return (favorites as string[]).includes(id);
      })
      .map((w: any) => {
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
    <div className="px-4 pb-[148px] min-h-screen bg-[var(--color-bg)]">
      <div className="py-5 text-center">
        <span className="text-[10px] text-[var(--color-gold)] font-bold tracking-[.2em] uppercase">Curation exclusive</span>
        <h2 className="text-[var(--color-gold)] font-['Noto_Serif',serif] m-0 mt-1.5 tracking-[1px] text-[24px]">Suggestions de Claude</h2>
        <p className="text-[12px] text-[var(--color-muted-text)] leading-[1.45]">Decouvrez notre selection hebdomadaire de crus d'exception.</p>
        {results.length === MAX_RESULTS && (
          <p className="text-[11px] text-[var(--color-muted-text)] mt-1">Affichage limité à 120 résultats pour plus de fluidité</p>
        )}
      </div>

      <div className="relative mb-5">
        <span className="absolute left-[18px] top-[14px] text-[var(--color-muted-text)] text-lg">⌕</span>
        <input type="text" value={queryInput} onChange={e => setQueryInput(e.target.value)} 
          placeholder="Un chateau, une appellation, un cepage..." 
          className="w-full h-[54px] pl-[44px] pr-4 bg-[#302822] text-[var(--color-cream)] border border-[rgba(197,160,89,.15)] rounded-full outline-none box-border shadow-[0_20px_40px_rgba(37,22,14,0.22)] font-['Manrope',sans-serif] focus:border-[var(--color-gold)] transition-colors" 
        />
      </div>

      <div className="flex gap-2 overflow-x-auto mb-[15px] no-scrollbar">
        {['Tous', 'Rouge', 'Blanc', 'Rosé', 'Bulles'].map(c => (
          <button key={c} onClick={() => setTypeFilter(c)} 
                  className={`shrink-0 px-[18px] py-[11px] rounded-[25px] border-none font-bold text-[11px] tracking-[.12em] uppercase ${typeFilter === c ? "bg-[var(--color-gold)] text-[#412d00]" : "bg-[#302822] text-[var(--color-cream)]"}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto mb-2.5 no-scrollbar">
        {PRICE_FILTERS.map((p) => (
          <button key={p} onClick={() => setPriceFilter(p)} 
                  className={`shrink-0 px-3.5 py-[9px] rounded-[20px] border-none font-bold text-[10px] tracking-[.08em] uppercase ${priceFilter === p ? "bg-[var(--color-gold)] text-[#412d00]" : "bg-[#302822] text-[var(--color-cream)]"}`}>
            {p}
          </button>
        ))}
        <button onClick={() => setOnlyFavorites((v) => !v)} 
                className={`shrink-0 px-3.5 py-[9px] rounded-[20px] border-none font-bold text-[10px] tracking-[.08em] uppercase ${onlyFavorites ? "bg-[#ffb68c] text-[#412d00]" : "bg-[#302822] text-[var(--color-cream)]"}`}>
          {onlyFavorites ? '♥ Favoris' : '♡ Favoris'}
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto mb-2.5 no-scrollbar">
        {[
          ['match', 'Match'],
          ['qualityPrice', 'Qualite/Prix'],
          ['priceAsc', 'Prix ↑'],
          ['priceDesc', 'Prix ↓'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setSortMode(id as string)} 
                  className={`shrink-0 px-3 py-[7px] rounded-[18px] border-none font-bold text-[10px] tracking-[.08em] uppercase ${sortMode === id ? "bg-[var(--color-gold)] text-[#412d00]" : "bg-[#302822] text-[var(--color-cream)]"}`}>
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowAdvanced((v) => !v)}
        className="w-full mb-2.5 bg-transparent border-none text-left text-[var(--color-muted-text)] font-['Manrope',sans-serif] text-[11px] tracking-[.14em] uppercase"
      >
        {showAdvanced ? '− Filtres avances' : '+ Filtres avances'}
      </button>

      {showAdvanced && (
        <>
          <div className="flex gap-2 overflow-x-auto mb-2 no-scrollbar">
            {(availableCountries as string[]).map((c: string) => (
              <button key={c} onClick={() => setCountry(c)} 
                      className={`shrink-0 px-3.5 py-2 rounded-[20px] border-none font-bold text-[10px] tracking-[.08em] uppercase ${country === c ? "bg-[var(--color-gold)] text-[#412d00]" : "bg-[#302822] text-[var(--color-cream)]"}`}>
                {(FLAG_BY_COUNTRY[c] || '')} {c}
              </button>
            ))}
          </div>
          {country !== 'Tous' && (
            <div className="flex gap-2 overflow-x-auto mb-4 no-scrollbar">
              {['Toutes', ...(regionsByCountry[country] || [])].map((r: string) => (
                <button key={r} onClick={() => setRegion(r)} 
                        className={`shrink-0 px-3 py-[7px] rounded-[20px] border-none font-bold text-[10px] uppercase ${region === r ? "bg-[var(--color-gold)] text-[#412d00]" : "bg-[#302822] text-[var(--color-muted-text)]"}`}>
                  {r}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {results.map((w: any) => {
        const id = w.u || w.url || w.t || w.title;
        const key = norm(w.t || w.title || '');
        return (
          <WineCard
            key={id}
            wine={w}
            isFavorite={favorites.includes(id as never)}
            onToggleFavorite={toggleFavorite}
            stockQty={inventoryByTitle.has(key) ? inventoryByTitle.get(key) : null}
          />
        );
      })}
      <div className="h-12 flex items-center justify-center gap-1.5">
        <span className="w-1 h-1 rounded-full bg-[var(--color-gold)] opacity-35" />
        <span className="w-1 h-1 rounded-full bg-[var(--color-gold)] opacity-35" />
        <span className="w-1 h-1 rounded-full bg-[var(--color-gold)] opacity-35" />
      </div>
    </div>
  );
}
