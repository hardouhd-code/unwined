import React, { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { C, WINE_TYPES } from "../lib/constants";
import { t } from "../lib/i18n";
import { haptic, typeColor, typeLight, typeEmoji } from "../lib/helpers";
import { searchBoirLocal } from "../lib/boirCatalog";
import { Wine } from "../types";

const norm = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const BOIR_URL_CACHE = new Map();

function resolveBoirUrl(wine: Partial<Wine>) {
  const query = `${wine.producer || ""} ${wine.name || ""}`.trim();
  if (query.length < 3) return null;
  const cacheKey = norm(query);
  if (BOIR_URL_CACHE.has(cacheKey)) return BOIR_URL_CACHE.get(cacheKey);
  const results = searchBoirLocal(query);
  if (!results?.length) {
    BOIR_URL_CACHE.set(cacheKey, null);
    return null;
  }
  const top = results[0];
  const tokens = norm(query).split(/\s+/).filter((x) => x.length >= 4).slice(0, 5);
  const title = norm(top.title || top.t || "");
  const vendor = norm(top.vendor || top.v || "");
  const hasStrongMatch = tokens.some((tk) => title.includes(tk) || vendor.includes(tk));
  const out = hasStrongMatch ? (top.url || top.u || null) : null;
  BOIR_URL_CACHE.set(cacheKey, out);
  return out;
}

const MaCave = () => {
  const { db, updateWine } = useStore();
  const navigate = useNavigate();
  const onOpenWine = (wine: Wine) => navigate(`/vin/${wine.id}`);
  const onAdd = () => navigate("/add");

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showCaveSection, setShowCaveSection] = useState(true);
  const [showTastedSection, setShowTastedSection] = useState(true);
  const displayed = useMemo(() => db.filter((w) => {
    const s = search.toLowerCase();
    if (s && !`${w.producer} ${w.name} ${w.region} ${w.country}`.toLowerCase().includes(s)) return false;
    if (typeFilter && w.type !== typeFilter) return false;
    if (filter === "cave") return !w.tasted;
    if (filter === "tasted") return w.tasted;
    if (filter === "top") return w.tasted && w.rating >= 4;
    if (filter === "avoid") return w.tasted && w.rating <= 1;
    return true;
  }), [db, search, typeFilter, filter]);
  const caveWines = displayed.filter(w => !w.tasted);
  const tastedWines = displayed.filter(w => w.tasted);
  const restockWines = useMemo(
    () => db
      .filter((w) => Number(w.quantity ?? 0) === 0 && Number(w.rating ?? 0) >= 4)
      .sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0))
      .slice(0, 6),
    [db]
  );
  const lowStockWines = useMemo(
    () => db
      .filter((w) => {
        if (w.tasted) return false;
        const qty = Number(w.quantity ?? 0);
        const threshold = Number(w.lowStockThreshold ?? 1);
        return qty <= threshold;
      })
      .sort((a, b) => Number(a.quantity ?? 0) - Number(b.quantity ?? 0))
      .slice(0, 8),
    [db]
  );
  const stats={total:db.length,inCave:db.filter(w=>!w.tasted).length,tasted:db.filter(w=>w.tasted).length,avg:db.filter(w=>w.tasted&&w.rating!==null).length?((db.filter(w=>w.tasted&&w.rating!==null).reduce((a,w)=>a+w.rating,0)/db.filter(w=>w.tasted&&w.rating!==null).length).toFixed(1)):"—"};
  const boirUrlByWineId = useMemo(() => {
    const map = new Map();
    for (const wine of db) map.set(wine.id, resolveBoirUrl(wine));
    return map;
  }, [db]);

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    db.forEach(w => {
      counts[w.type] = (counts[w.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, value]) => ({
      name: WINE_TYPES.find(t => t.id === type)?.label || type,
      value,
      color: typeColor(type)
    })).sort((a,b) => b.value - a.value);
  }, [db]);

  const changeQty = (wine: Wine, delta: number) => {
    const currentQty = Math.max(0, Number(wine.quantity ?? 1));
    const nextQty = Math.max(0, currentQty + delta);
    updateWine(wine.id, { quantity: nextQty });
  };

  const renderWineList = (list: Wine[], offset = 0) => (
    <div className="flex flex-col gap-[9px]">
      {list.map((wine,i)=>{const tc=typeColor(wine.type);return(
        <button key={wine.id} onClick={()=>{haptic(30);onOpenWine(wine);}} 
                className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-3.5 text-left transition-all duration-200 flex items-center gap-3 shadow-[0_8px_14px_rgba(0,0,0,.22)] animate-fadeUp opacity-0" 
                style={{ animationDelay: `${(i+offset)*.04}s`, animationFillMode: 'both' }}>
          <div className="w-[58px] h-[74px] rounded-lg shrink-0 bg-[#302822] flex items-center justify-center text-[26px] border border-[var(--color-border-subtle)]">{typeEmoji(wine.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{background:tc}} />
              <span className="text-[10px] text-[var(--color-gold)] tracking-[.14em] uppercase font-['Manrope',sans-serif]">{wine.region || wine.country || "Région"}</span>
            </div>
            <div className="text-base font-['Noto_Serif',serif] text-[var(--color-cream)] font-bold truncate">{wine.producer||wine.name||"Vin sans nom"}</div>
            <div className="text-[13px] text-[var(--color-subtext)] font-['Manrope',sans-serif] mt-0.5 truncate">{[wine.year, wine.name && wine.name!==wine.producer ? wine.name : null].filter(Boolean).join(" · ")}</div>
          </div>
          <div className="flex items-center gap-2 ml-0.5" onClick={(e)=>e.stopPropagation()}>
            <button
              onClick={() => { haptic(20); changeQty(wine, -1); }}
              className="w-[30px] h-[30px] rounded-full border border-[#c5a05947] bg-transparent text-[var(--color-gold)] flex items-center justify-center text-lg leading-none"
            >
              −
            </button>
            <span className="min-w-[14px] text-center text-[22px] font-['Noto_Serif',serif] font-bold text-[var(--color-cream)]">
              {Math.max(0, Number(wine.quantity ?? 1))}
            </span>
            <button
              onClick={() => { haptic(20); changeQty(wine, +1); }}
              className="w-[30px] h-[30px] rounded-full border border-[#c5a05947] bg-transparent text-[var(--color-gold)] flex items-center justify-center text-lg leading-none"
            >
              +
            </button>
          </div>
        </button>
      );})}
    </div>
  );

  if(db.length===0)return(
    <div className="flex-1 flex flex-col items-center justify-center px-6 pt-5 pb-[100px] text-center">
      <div className="text-[60px] mb-3.5 opacity-25">🗄️</div>
      <h3 className="text-[22px] font-['Playfair_Display',serif] text-[var(--color-cream)] font-normal mb-2">{t("cave_empty")}</h3>
      <p className="text-sm text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic mb-6 leading-[1.7]">Commencez par ajouter un vin<br/>pour constituer votre collection.</p>
      <button onClick={onAdd} className="bg-gradient-to-br from-[var(--color-terra)] to-[var(--color-terra-dark)] text-white border-none px-7 py-3.5 rounded-full text-sm tracking-[.2em] uppercase font-['Cormorant_Garamond',serif] font-semibold shadow-[0_8px_24px_rgba(200,80,58,.25)]">
        + Ajouter mon premier vin
      </button>
    </div>
  );

  return(
    <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-[100px] bg-[var(--color-bg)]">
      <div className="text-center mb-3.5">
        <h2 className="text-[42px] font-['Noto_Serif',serif] text-[var(--color-gold)] font-light tracking-[.02em] my-0.5">Ma Cave</h2>
        <div className="text-[11px] text-[var(--color-accent-color)] tracking-[.2em] uppercase font-['Manrope',sans-serif]">{stats.total} bouteilles de collection</div>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-3.5">
        {[[stats.total,"Vins","var(--color-cream)"],[stats.inCave,t("filter_cave"),"var(--color-gold)"],[stats.tasted,t("filter_tasted"),"var(--color-terra)"],[stats.avg,"Moy.","var(--color-sauge)"]].map(([v,l,col])=>(
          <div key={l as string} className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl py-2.5 px-1.5 text-center shadow-[0_20px_40px_rgba(37,22,14,.2)]">
            <div className="text-[19px] font-['Playfair_Display',serif] font-semibold leading-none" style={{color:col as string}}>{v as React.ReactNode}</div>
            <div className="text-[10px] text-[var(--color-muted-text)] tracking-[.1em] uppercase font-['Cormorant_Garamond',serif] mt-0.5">{l as string}</div>
          </div>
        ))}
      </div>
      {chartData.length > 0 && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-4 mb-3.5 flex items-center justify-between shadow-[0_20px_40px_rgba(37,22,14,.2)]">
          <div className="w-[100px] h-[100px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={32} outerRadius={48} stroke="none" paddingAngle={2}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)', borderRadius: '8px', fontSize: '11px', color: 'var(--color-cream)' }}
                  itemStyle={{ color: 'var(--color-gold)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 pl-4 flex flex-col gap-1.5 justify-center">
            {chartData.slice(0, 4).map(d => (
              <div key={d.name} className="flex justify-between items-center text-[11px] font-['Manrope',sans-serif]">
                <div className="flex items-center gap-1.5 text-[var(--color-cream)]">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }}></span>
                  {d.name}
                </div>
                <span className="text-[var(--color-muted-text)] font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {restockWines.length > 0 && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-3 mb-3">
          <div className="text-[11px] text-[var(--color-gold)] tracking-[.16em] uppercase font-['Manrope',sans-serif] mb-2">
            A racheter ({restockWines.length})
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {restockWines.map((wine)=>(
              <button key={`restock-${wine.id}`} onClick={()=>onOpenWine(wine)} className="min-w-[180px] bg-[#302822] border border-[#c5a0591f] rounded-xl p-2.5 text-left">
                <div className="text-[13px] text-[var(--color-cream)] font-['Noto_Serif',serif] whitespace-nowrap overflow-hidden text-ellipsis">
                  {wine.producer || wine.name || "Vin"}
                </div>
                <div className="text-[11px] text-[var(--color-subtext)] font-['Manrope',sans-serif] my-1">
                  Note: {wine.rating}/5
                </div>
                <div onClick={(e)=>e.stopPropagation()} className="flex justify-between items-center mt-1">
                  <span className="text-[11px] text-[var(--color-terra)]">Rupture</span>
                  <div className="flex gap-1.5">
                    {boirUrlByWineId.get(wine.id) ? (
                      <a
                        href={boirUrlByWineId.get(wine.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#ffb68c29] border border-[#ffb68c59] rounded-full px-2 py-[3px] text-[11px] text-[var(--color-terra)] no-underline"
                      >
                        Racheter
                      </a>
                    ) : (
                      <span className="text-[10px] text-[var(--color-muted-text)] mt-1">Pas sur Boir</span>
                    )}
                    <button onClick={()=>changeQty(wine, +1)} className="bg-[#e9c1762e] border border-[#e9c17659] rounded-full px-2 py-[3px] text-[11px] text-[var(--color-gold)]">
                      +1
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {lowStockWines.length > 0 && (
        <div className="bg-[var(--color-bg-card)] border border-[#ffb68c40] rounded-2xl p-3 mb-3">
          <div className="text-[11px] text-[var(--color-terra)] tracking-[.16em] uppercase font-['Manrope',sans-serif] mb-2">
            Stock bas ({lowStockWines.length})
          </div>
          <div className="grid gap-[7px]">
            {lowStockWines.map((wine) => (
              <div key={`low-${wine.id}`} className="flex justify-between items-center bg-[#302822] border border-[#ffb68c29] rounded-xl px-2.5 py-2">
                <div className="min-w-0">
                  <div className="text-xs text-[var(--color-cream)] whitespace-nowrap overflow-hidden text-ellipsis">
                    {wine.producer || wine.name || "Vin"}
                  </div>
                  <div className="text-[11px] text-[var(--color-subtext)]">
                    {Math.max(0, Number(wine.quantity ?? 0))} en cave (seuil {Number(wine.lowStockThreshold ?? 1)})
                  </div>
                </div>
                {boirUrlByWineId.get(wine.id) ? (
                  <a
                    href={boirUrlByWineId.get(wine.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[var(--color-terra)] no-underline border border-[#ffb68c4d] rounded-2xl px-2 py-1 shrink-0"
                  >
                    Commander
                  </a>
                ) : (
                  <span className="text-[10px] text-[var(--color-muted-text)] shrink-0">Non disponible</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher…" 
             className="w-full bg-[#302822] border border-[var(--color-border-subtle)] rounded-full px-4 py-3 text-[var(--color-cream)] text-sm font-['Manrope',sans-serif] mb-2.5 shadow-[0_20px_40px_rgba(37,22,14,.2)] outline-none focus:border-[var(--color-gold)] transition-colors"/>
      <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1 no-scrollbar">
        <button onClick={()=>setTypeFilter(null)} 
                className={`rounded-full px-3 py-1.5 text-[10px] whitespace-nowrap font-['Manrope',sans-serif] ${!typeFilter ? "bg-[var(--color-gold)] border-[#e9c17666] text-[#412d00]" : "bg-[#302822] border-[rgba(197,160,89,.18)] text-[var(--color-subtext)]"}`}>Tous</button>
        {WINE_TYPES.map(t=>(
          <button key={t.id} onClick={()=>setTypeFilter(typeFilter===t.id?null:t.id)} 
                  className={`rounded-full px-3 py-1.5 text-[10px] whitespace-nowrap font-['Manrope',sans-serif] ${typeFilter===t.id ? "bg-[#e9c1762e] border-[#e9c17673] text-[var(--color-gold)]" : "bg-[#302822] border-[rgba(197,160,89,.15)] text-[var(--color-subtext)]"}`}>{t.emoji} {t.label}</button>
        ))}
      </div>
      <div className="flex gap-1.5 mb-3.5 overflow-x-auto pb-1 no-scrollbar">
        {[["all",t("filter_all")],["cave",t("filter_cave")],["tasted",t("filter_tasted")],["top","⭐ Top"],["avoid","🚫 Éviter"]].map(([id,l])=>(
        <button key={id} onClick={()=>setFilter(id)} 
                className={`rounded-full px-3 py-1.5 text-[10px] whitespace-nowrap font-['Manrope',sans-serif] ${filter===id ? "bg-[#e9c1762e] text-[var(--color-gold)]" : "bg-[#302822] text-[var(--color-subtext)]"}`}>{l}</button>
        ))}
      </div>
      {displayed.length===0?(<div className="text-center py-10 text-[var(--color-muted-text)] font-['Cormorant_Garamond',serif] italic text-sm">Aucun vin dans cette catégorie.</div>):(
        filter==="all" ? (
          <div>
            <div className="mb-2.5 mt-0.5">
              <button
                onClick={() => setShowCaveSection(v => !v)}
                className="w-full flex items-center justify-between bg-transparent border-none p-0 cursor-pointer"
              >
                <div className="text-xs text-[var(--color-gold)] tracking-[.12em] uppercase font-['Cormorant_Garamond',serif] font-semibold">
                  🗄️ Dans ma cave ({caveWines.length})
                </div>
                <div className="text-sm text-[var(--color-gold)] font-['Cormorant_Garamond',serif]">{showCaveSection ? "−" : "+"}</div>
              </button>
            </div>
            {showCaveSection && (
              caveWines.length
                ? renderWineList(caveWines, 0)
                : <div className="text-[13px] text-[var(--color-muted-text)] font-['Cormorant_Garamond',serif] italic mb-3.5">Aucun vin en cave.</div>
            )}

            <div className="my-4 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-border-subtle)] to-transparent" />
            <div className="mb-2.5">
              <button
                onClick={() => setShowTastedSection(v => !v)}
                className="w-full flex items-center justify-between bg-transparent border-none p-0 cursor-pointer"
              >
                <div className="text-xs text-[var(--color-terra)] tracking-[.12em] uppercase font-['Cormorant_Garamond',serif] font-semibold">
                  ⭐ Déjà goûtés ({tastedWines.length})
                </div>
                <div className="text-sm text-[var(--color-terra)] font-['Cormorant_Garamond',serif]">{showTastedSection ? "−" : "+"}</div>
              </button>
            </div>
            {showTastedSection && (
              tastedWines.length
                ? renderWineList(tastedWines, caveWines.length)
                : <div className="text-[13px] text-[var(--color-muted-text)] font-['Cormorant_Garamond',serif] italic">Aucun vin goûté.</div>
            )}
          </div>
        ) : renderWineList(displayed, 0)
      )}
    </div>
  );
};

export { MaCave };
