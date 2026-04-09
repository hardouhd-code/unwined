import React, { useMemo, useState } from "react";
import { C, WINE_TYPES } from "../lib/constants";
import { t } from "../lib/i18n";
import { haptic, typeColor, typeLight, typeEmoji } from "../lib/helpers";
import { searchBoirLocal } from "../lib/boirCatalog";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const BOIR_URL_CACHE = new Map();

function resolveBoirUrl(wine) {
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

const MaCave=({db,onOpenWine,onAdd,onUpdateWine})=>{
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [typeFilter,setTypeFilter]=useState(null);
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

  const changeQty = (wine, delta) => {
    if (!onUpdateWine) return;
    const currentQty = Math.max(0, Number(wine.quantity ?? 1));
    const nextQty = Math.max(0, currentQty + delta);
    onUpdateWine(wine.id, { quantity: nextQty });
  };

  const renderWineList = (list, offset = 0) => (
    <div style={{display:"flex",flexDirection:"column",gap:9}}>
      {list.map((wine,i)=>{const tc=typeColor(wine.type);return(
        <button key={wine.id} onClick={()=>{haptic(30);onOpenWine(wine);}} style={{background:"#211a15",border:"1px solid rgba(197,160,89,.14)",borderRadius:16,padding:"14px",textAlign:"left",transition:"all .2s",animation:`fadeUp .35s ease ${(i+offset)*.04}s both`,opacity:0,display:"flex",alignItems:"center",gap:12,boxShadow:`0 8px 14px rgba(0,0,0,.22)`}}>
          <div style={{width:58,height:74,borderRadius:10,flexShrink:0,background:"#302822",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,border:"1px solid rgba(197,160,89,.18)"}}>{typeEmoji(wine.type)}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:tc,display:"inline-block"}} />
              <span style={{fontSize:10,color:C.gold,letterSpacing:".14em",textTransform:"uppercase",fontFamily:"Manrope,sans-serif"}}>{wine.region || wine.country || "Région"}</span>
            </div>
            <div style={{fontSize:16,fontFamily:"Noto Serif,serif",color:C.cream,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{wine.producer||wine.name||"Vin sans nom"}</div>
            <div style={{fontSize:13,color:C.subtext,fontFamily:"Manrope,sans-serif",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{[wine.year, wine.name && wine.name!==wine.producer ? wine.name : null].filter(Boolean).join(" · ")}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:2}} onClick={(e)=>e.stopPropagation()}>
            <button
              onClick={() => { haptic(20); changeQty(wine, -1); }}
              style={{width:30,height:30,borderRadius:"50%",border:"1px solid rgba(197,160,89,.28)",background:"transparent",color:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,lineHeight:1}}
            >
              −
            </button>
            <span style={{minWidth:14,textAlign:"center",fontSize:22,fontFamily:"Noto Serif,serif",fontWeight:700,color:C.cream}}>
              {Math.max(0, Number(wine.quantity ?? 1))}
            </span>
            <button
              onClick={() => { haptic(20); changeQty(wine, +1); }}
              style={{width:30,height:30,borderRadius:"50%",border:"1px solid rgba(197,160,89,.28)",background:"transparent",color:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,lineHeight:1}}
            >
              +
            </button>
          </div>
        </button>
      );})}
    </div>
  );

  if(db.length===0)return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 24px 100px",textAlign:"center"}}>
      <div style={{fontSize:60,marginBottom:14,opacity:.25}}>🗄️</div>
      <h3 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8}}>{t("cave_empty")}</h3>
      <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:26,lineHeight:1.7}}>Commencez par ajouter un vin<br/>pour constituer votre collection.</p>
      <button onClick={onAdd} style={{background:`linear-gradient(135deg,${C.terra},${C.terraD})`,color:"#fff",border:"none",padding:"15px 30px",borderRadius:50,fontSize:14,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:600,boxShadow:`0 8px 24px rgba(200,80,58,.25)`}}>+ Ajouter mon premier vin</button>
    </div>
  );

  return(
    <div style={{flex:1,overflowY:"auto",padding:"14px 16px 100px",background:"#19120d"}}>
      <div style={{textAlign:"center",marginBottom:14}}>
        <h2 style={{fontSize:42,fontFamily:"Noto Serif,serif",color:"#e9c176",fontWeight:300,letterSpacing:".02em",margin:"2px 0"}}>Ma Cave</h2>
        <div style={{fontSize:11,color:"#d4c3b8",letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Manrope,sans-serif"}}>{stats.total} bouteilles de collection</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
        {[[stats.total,"Vins",C.cream],[stats.inCave,t("filter_cave"),C.gold],[stats.tasted,t("filter_tasted"),C.terra],[stats.avg,"Moy.",C.sauge]].map(([v,l,col])=>(
          <div key={l} style={{background:"#211a15",border:`1px solid rgba(197,160,89,.12)`,borderRadius:14,padding:"11px 7px",textAlign:"center",boxShadow:`0 20px 40px rgba(37,22,14,.2)`}}>
            <div style={{fontSize:19,fontFamily:"Playfair Display,serif",color:col,fontWeight:600,lineHeight:1}}>{v}</div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
      {restockWines.length > 0 && (
        <div style={{background:"#211a15",border:`1px solid rgba(197,160,89,.18)`,borderRadius:16,padding:"12px",marginBottom:12}}>
          <div style={{fontSize:11,color:C.gold,letterSpacing:".16em",textTransform:"uppercase",fontFamily:"Manrope,sans-serif",marginBottom:8}}>
            A racheter ({restockWines.length})
          </div>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>
            {restockWines.map((wine)=>(
              <button key={`restock-${wine.id}`} onClick={()=>onOpenWine(wine)} style={{minWidth:180,background:"#302822",border:"1px solid rgba(197,160,89,.12)",borderRadius:12,padding:"10px",textAlign:"left"}}>
                <div style={{fontSize:13,color:C.cream,fontFamily:"Noto Serif,serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {wine.producer || wine.name || "Vin"}
                </div>
                <div style={{fontSize:11,color:C.subtext,fontFamily:"Manrope,sans-serif",margin:"4px 0 8px"}}>
                  Note: {wine.rating}/5
                </div>
                <div onClick={(e)=>e.stopPropagation()} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:11,color:"#ffb68c"}}>Rupture</span>
                  <div style={{display:"flex",gap:6}}>
                    {boirUrlByWineId.get(wine.id) ? (
                      <a
                        href={boirUrlByWineId.get(wine.id)}
                        target="_blank"
                        rel="noreferrer"
                        style={{background:"rgba(255,182,140,.16)",border:"1px solid rgba(255,182,140,.35)",borderRadius:20,padding:"3px 9px",fontSize:11,color:"#ffb68c",textDecoration:"none"}}
                      >
                        Racheter
                      </a>
                    ) : (
                      <span style={{fontSize:10,color:C.muted}}>Pas sur Boir</span>
                    )}
                    <button onClick={()=>changeQty(wine, +1)} style={{background:"rgba(233,193,118,.18)",border:"1px solid rgba(233,193,118,.35)",borderRadius:20,padding:"3px 9px",fontSize:11,color:C.gold}}>
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
        <div style={{background:"#211a15",border:"1px solid rgba(255,182,140,.25)",borderRadius:16,padding:"12px",marginBottom:12}}>
          <div style={{fontSize:11,color:"#ffb68c",letterSpacing:".16em",textTransform:"uppercase",fontFamily:"Manrope,sans-serif",marginBottom:8}}>
            Stock bas ({lowStockWines.length})
          </div>
          <div style={{display:"grid",gap:7}}>
            {lowStockWines.map((wine) => (
              <div key={`low-${wine.id}`} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#302822",border:"1px solid rgba(255,182,140,.16)",borderRadius:10,padding:"8px 10px"}}>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,color:C.cream,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    {wine.producer || wine.name || "Vin"}
                  </div>
                  <div style={{fontSize:11,color:C.subtext}}>
                    {Math.max(0, Number(wine.quantity ?? 0))} en cave (seuil {Number(wine.lowStockThreshold ?? 1)})
                  </div>
                </div>
                {boirUrlByWineId.get(wine.id) ? (
                  <a
                    href={boirUrlByWineId.get(wine.id)}
                    target="_blank"
                    rel="noreferrer"
                    style={{fontSize:11,color:"#ffb68c",textDecoration:"none",border:"1px solid rgba(255,182,140,.3)",borderRadius:16,padding:"4px 8px",flexShrink:0}}
                  >
                    Commander
                  </a>
                ) : (
                  <span style={{fontSize:10,color:C.muted,flexShrink:0}}>Non disponible</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher…" style={{width:"100%",background:"#302822",border:"1px solid rgba(197,160,89,.12)",borderRadius:999,padding:"13px 16px",color:C.cream,fontSize:14,fontFamily:"Manrope,sans-serif",marginBottom:10,boxShadow:`0 20px 40px rgba(37,22,14,.2)`}}/>
      <div style={{display:"flex",gap:6,marginBottom:8,overflowX:"auto",paddingBottom:3}}>
        <button onClick={()=>setTypeFilter(null)} style={{background:!typeFilter?C.gold:"#302822",border:`1px solid ${!typeFilter?"rgba(233,193,118,.4)":"rgba(197,160,89,.18)"}`,borderRadius:20,padding:"6px 12px",fontSize:10,color:!typeFilter?"#412d00":C.subtext,whiteSpace:"nowrap",fontFamily:"Manrope,sans-serif"}}>Tous</button>
        {WINE_TYPES.map(t=>(
          <button key={t.id} onClick={()=>setTypeFilter(typeFilter===t.id?null:t.id)} style={{background:typeFilter===t.id?"rgba(233,193,118,.18)":"#302822",border:`1px solid ${typeFilter===t.id?"rgba(233,193,118,.45)":"rgba(197,160,89,.15)"}`,borderRadius:20,padding:"6px 12px",fontSize:10,color:typeFilter===t.id?C.gold:C.subtext,whiteSpace:"nowrap",fontFamily:"Manrope,sans-serif"}}>{t.emoji} {t.label}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:3}}>
        {[["all",t("filter_all")],["cave",t("filter_cave")],["tasted",t("filter_tasted")],["top","⭐ Top"],["avoid","🚫 Éviter"]].map(([id,l])=>(
        <button key={id} onClick={()=>setFilter(id)} style={{background:filter===id?"rgba(233,193,118,.18)":"#302822",border:"none",borderRadius:20,padding:"6px 12px",fontSize:10,color:filter===id?C.gold:C.subtext,whiteSpace:"nowrap",fontFamily:"Manrope,sans-serif"}}>{l}</button>
        ))}
      </div>
      {displayed.length===0?(<div style={{textAlign:"center",padding:"40px 0",color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",fontSize:14}}>Aucun vin dans cette catégorie.</div>):(
        filter==="all" ? (
          <div>
            <div style={{marginBottom:10,marginTop:2}}>
              <button
                onClick={() => setShowCaveSection(v => !v)}
                style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"transparent",border:"none",padding:0,cursor:"pointer"}}
              >
                <div style={{fontSize:12,color:C.gold,letterSpacing:".12em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:600}}>
                  🗄️ Dans ma cave ({caveWines.length})
                </div>
                <div style={{fontSize:14,color:C.gold,fontFamily:"Cormorant Garamond,serif"}}>{showCaveSection ? "−" : "+"}</div>
              </button>
            </div>
            {showCaveSection && (
              caveWines.length
                ? renderWineList(caveWines, 0)
                : <div style={{color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",fontSize:13,marginBottom:14}}>Aucun vin en cave.</div>
            )}

            <div style={{margin:"16px 0 10px",height:1,background:`linear-gradient(90deg, transparent, ${C.border}, transparent)`}} />
            <div style={{marginBottom:10}}>
              <button
                onClick={() => setShowTastedSection(v => !v)}
                style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"transparent",border:"none",padding:0,cursor:"pointer"}}
              >
                <div style={{fontSize:12,color:C.terra,letterSpacing:".12em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:600}}>
                  ⭐ Déjà goûtés ({tastedWines.length})
                </div>
                <div style={{fontSize:14,color:C.terra,fontFamily:"Cormorant Garamond,serif"}}>{showTastedSection ? "−" : "+"}</div>
              </button>
            </div>
            {showTastedSection && (
              tastedWines.length
                ? renderWineList(tastedWines, caveWines.length)
                : <div style={{color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",fontSize:13}}>Aucun vin goûté.</div>
            )}
          </div>
        ) : renderWineList(displayed, 0)
      )}
    </div>
  );
};

// Claude génère une sélection de vins avec liens Vivino
async function fetchVivinoSuggestions(db, opts = {}) {
  const liked    = db.filter(w=>w.tasted&&w.rating>=3).map(w=>`${w.type} ${w.region}`).join(", ");
  const disliked = db.filter(w=>w.tasted&&w.rating<=1).map(w=>w.type).join(", ");
  const query    = opts.query || null;

  const prompt = query
    ? `Tu es sommelier expert. Recherche : "${query}".${liked?` Goûts : ${liked}.`:""}
Propose 5 vins réels qui correspondent. JSON strict sans markdown :
[{"name":"Château X","producer":"Domaine Y","type":"rouge","region":"Bordeaux","country":"France","year":2019,"rating":"4.2","ratings_count":"52000","price_range":"25-35€","grapes":"Merlot, Cabernet","description":"2 phrases arômes et style","search_query":"Château X 2019"}]`
    : `Tu es sommelier. Propose 5 vins diversifiés et excellents.${liked?` Pour quelqu'un qui aime : ${liked}.`:""}${disliked?` Éviter : ${disliked}.`:""}
Vins variés (pays, types, prix différents). JSON strict sans markdown :
[{"name":"Château X","producer":"Domaine Y","type":"rouge","region":"Bordeaux","country":"France","year":2019,"rating":"4.2","ratings_count":"52000","price_range":"25-35€","grapes":"Merlot, Cabernet","description":"2 phrases arômes et style","search_query":"Château X 2019"}]`;

  const txt = await callClaude([{role:"user",content:prompt}], 1200);
  const arr = safeJson(txt, []);
  const wines = Array.isArray(arr) ? arr : (arr.wines || []);

  // Construire le lien Vivino pour chaque vin
  return wines.map(w => ({
    ...w,
    type: w.type||"autre",
    wine_url: `https://www.wine-searcher.com/find/${encodeURIComponent((w.search_query||(`${w.name} ${w.year||""}`.trim())).replace(/\s+/g,"+"))}`,
    image: null,
  }));
}

export { MaCave };
