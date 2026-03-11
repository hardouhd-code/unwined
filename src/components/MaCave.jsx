import React, { useState } from "react";
import { C, WINE_TYPES } from "../lib/constants";
import { t } from "../lib/i18n";
import { typeColor, typeLight, typeEmoji, haptic } from "../lib/helpers";

const MaCave=({db,onOpenWine,onAdd,onUpdateWine})=>{
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [typeFilter,setTypeFilter]=useState(null);
  const displayed=db.filter(w=>{
    const s=search.toLowerCase();
    if(s&&!`${w.producer} ${w.name} ${w.region} ${w.country}`.toLowerCase().includes(s))return false;
    if(typeFilter&&w.type!==typeFilter)return false;
    if(filter==="cave")return!w.tasted;
    if(filter==="tasted")return w.tasted;
    if(filter==="top")return w.tasted&&w.rating>=4;
    if(filter==="avoid")return w.tasted&&w.rating<=1;
    return true;
  });
  const stats={total:db.length,inCave:db.filter(w=>!w.tasted).length,tasted:db.filter(w=>w.tasted).length,avg:db.filter(w=>w.tasted&&w.rating!==null).length?((db.filter(w=>w.tasted&&w.rating!==null).reduce((a,w)=>a+w.rating,0)/db.filter(w=>w.tasted&&w.rating!==null).length).toFixed(1)):"—"};

  if(db.length===0)return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 24px 100px",textAlign:"center"}}>
      <div style={{fontSize:60,marginBottom:14,opacity:.25}}>🗄️</div>
      <h3 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8}}>{t("cave_empty")}</h3>
      <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:26,lineHeight:1.7}}>Commencez par ajouter un vin<br/>pour constituer votre collection.</p>
      <button onClick={onAdd} style={{background:`linear-gradient(135deg,${C.terra},${C.terraD})`,color:"#fff",border:"none",padding:"15px 30px",borderRadius:50,fontSize:14,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:600,boxShadow:`0 8px 24px rgba(200,80,58,.25)`}}>+ Ajouter mon premier vin</button>
    </div>
  );

  return(
    <div style={{flex:1,overflowY:"auto",padding:"14px 16px 100px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
        {[[stats.total,"Vins",C.cream],[stats.inCave,t("filter_cave"),C.gold],[stats.tasted,t("filter_tasted"),C.terra],[stats.avg,"Moy.",C.sauge]].map(([v,l,col])=>(
          <div key={l} style={{background:C.bgCard,border:C.border,borderRadius:14,padding:"11px 7px",textAlign:"center",boxShadow:`0 2px 8px rgba(139,90,60,.08)`}}>
            <div style={{fontSize:19,fontFamily:"Playfair Display,serif",color:col,fontWeight:600,lineHeight:1}}>{v}</div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher…" style={{width:"100%",background:C.bgCard,border:`1px solid rgba(139,90,60,.2)`,borderRadius:14,padding:"11px 14px",color:C.cream,fontSize:14,fontFamily:"Cormorant Garamond,serif",marginBottom:10,boxShadow:`0 2px 8px rgba(139,90,60,.06)`}}/>
      <div style={{display:"flex",gap:6,marginBottom:8,overflowX:"auto",paddingBottom:3}}>
        <button onClick={()=>setTypeFilter(null)} style={{background:!typeFilter?C.terra:"rgba(139,90,60,.08)",border:`1px solid ${!typeFilter?C.terra:"rgba(139,90,60,.18)"}`,borderRadius:20,padding:"6px 12px",fontSize:10,color:!typeFilter?"#fff":C.subtext,whiteSpace:"nowrap",fontFamily:"Cormorant Garamond,serif"}}>Tous</button>
        {WINE_TYPES.map(t=>(
          <button key={t.id} onClick={()=>setTypeFilter(typeFilter===t.id?null:t.id)} style={{background:typeFilter===t.id?typeLight(t.id):"rgba(139,90,60,.05)",border:`1px solid ${typeFilter===t.id?t.color+"66":"rgba(139,90,60,.15)"}`,borderRadius:20,padding:"6px 12px",fontSize:10,color:typeFilter===t.id?C.terra:C.subtext,whiteSpace:"nowrap",fontFamily:"Cormorant Garamond,serif"}}>{t.emoji} {t.label}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:3}}>
        {[["all",t("filter_all")],["cave",t("filter_cave")],["tasted",t("filter_tasted")],["top","⭐ Top"],["avoid","🚫 Éviter"]].map(([id,l])=>(
          <button key={id} onClick={()=>setFilter(id)} style={{background:filter===id?"rgba(184,134,42,.15)":"rgba(139,90,60,.05)",border:`1px solid ${filter===id?"rgba(184,134,42,.4)":"rgba(139,90,60,.15)"}`,borderRadius:20,padding:"6px 12px",fontSize:10,color:filter===id?C.gold:C.subtext,whiteSpace:"nowrap",fontFamily:"Cormorant Garamond,serif"}}>{l}</button>
        ))}
      </div>
      {displayed.length===0?(<div style={{textAlign:"center",padding:"40px 0",color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",fontSize:14}}>Aucun vin dans cette catégorie.</div>):(
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {displayed.map((wine,i)=>{const tc=typeColor(wine.type);const tl=typeLight(wine.type);return(
            <div key={wine.id} style={{background:C.bgCard,border:`1px solid ${tc}22`,borderRadius:16,overflow:"hidden",animation:`fadeUp .35s ease ${i*.04}s both`,opacity:0,boxShadow:`0 2px 10px rgba(139,90,60,.07)`}}>
              <button onClick={()=>{haptic(30);onOpenWine(wine);}} style={{width:"100%",padding:"14px",textAlign:"left",background:"none",border:"none",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:46,height:46,borderRadius:"50%",flexShrink:0,background:tl,border:`1px solid ${tc}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21}}>{typeEmoji(wine.type)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{wine.producer||wine.name||"Vin sans nom"}</div>
                  {wine.name&&wine.name!==wine.producer&&<div style={{fontSize:13,color:C.terra,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{wine.name}</div>}
                  <div style={{fontSize:13,color:C.subtext,fontFamily:"Cormorant Garamond,serif",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{[WINE_TYPES.find(t=>t.id===wine.type)?.label,wine.region,wine.country,wine.year].filter(Boolean).join(" · ")}</div>
                </div>
                <div style={{flexShrink:0,textAlign:"right"}}>
                  {wine.tasted&&wine.rating!==null?(<div><div style={{fontSize:17,fontFamily:"Playfair Display,serif",color:wine.rating>=4?C.sauge:wine.rating>=2?C.gold:C.terra,fontWeight:600}}>{wine.rating}/5</div><div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif"}}>{"★".repeat(wine.rating)}{"☆".repeat(5-wine.rating)}</div></div>):!wine.tasted?(<div style={{fontSize:14,color:C.gold,background:"rgba(184,134,42,.1)",border:"1px solid rgba(184,134,42,.25)",borderRadius:10,padding:"4px 8px",fontFamily:"Cormorant Garamond,serif"}}>🗄️ Cave</div>):(<div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif"}}>Non noté</div>)}
                </div>
              </button>
              {/* Quick +/- quantity */}
              {!wine.tasted&&(wine.quantity||0)>=0&&(
                <div style={{borderTop:`1px solid ${tc}18`,padding:"8px 14px",display:"flex",alignItems:"center",gap:10,background:`${tl}`}}>
                  <span style={{fontSize:12,color:C.muted,fontFamily:"Cormorant Garamond,serif",flex:1}}>{t("bottles_in_cave")}</span>
                  <button onClick={e=>{e.stopPropagation();haptic(20);onUpdateWine&&onUpdateWine(wine.id,{quantity:Math.max(0,(wine.quantity||0)-1)});}} style={{width:28,height:28,borderRadius:"50%",background:"rgba(139,90,60,.12)",border:"1px solid rgba(139,90,60,.2)",color:C.cream,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>−</button>
                  <span style={{fontSize:16,fontFamily:"Playfair Display,serif",color:C.cream,minWidth:20,textAlign:"center"}}>{wine.quantity||0}</span>
                  <button onClick={e=>{e.stopPropagation();haptic(20);onUpdateWine&&onUpdateWine(wine.id,{quantity:(wine.quantity||0)+1});}} style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.terra},${C.terraD})`,border:"none",color:"#fff",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>＋</button>
                </div>
              )}
            </div>
          );})}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   HELPER — Suggestions via Claude + lien Vivino
   Claude génère les vins,
   chaque carte a un lien direct vers Wine-Searcher.
═══════════════════════════════════════════════════════════════ */

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
/* ═══════════════════════════════════════════════════════════════
   DÉCOUVRIR — Vivino live + recherche libre
═══════════════════════════════════════════════════════════════ */
const Decouvrir=({db})=>{

export { MaCave };
