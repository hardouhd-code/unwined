import React, { useState, useEffect } from "react";
import { C, WINE_TYPES } from "../lib/constants";
import { t } from "../lib/i18n";
import { haptic, typeColor, typeLight, typeEmoji } from "../lib/helpers";
import { callClaude, safeJson } from "../lib/claude";
import { Tag } from "./UI";

const Decouvrir=({db})=>{
  const [mode,setMode]=useState("suggestions");

  // Recherche directement depuis le navigateur
  const searchBoir=async(query)=>{
    try{
      const url=`https://boir.be/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=5`;
      const r=await fetch(url,{headers:{"Accept":"application/json"}});
      if(!r.ok)return[];
      const data=await r.json();
      const products=data?.resources?.results?.products||[];
      return products.filter(p=>p.available!==false).map(p=>({
        title:  p.title||"",
        url:    p.url?(p.url.startsWith("http")?p.url:`https://boir.be${p.url}`):`https://boir.be/fr/products/${p.handle}`,
        price:  p.price?`${(parseInt(p.price)/100).toFixed(2)}€`:null,
        image:  p.featured_image?.url||null,
        vendor: p.vendor||"",
      }));
    }catch{return[];}
  };

  const enrichWithBoir=async(wines)=>{
    return Promise.all(wines.map(async(wine)=>{
      const q=`${wine.producer||""} ${wine.name||""}`.trim();
      const results=await searchBoir(q);
      const match=results.find(r=>r.available)||results[0]||null;
      return{...wine,boir_url:match?.url||null,boir_price:match?.price||null,boir_found:!!match};
    }));
  };

  // ── Suggestions Vivino ──────────────────────────────────────
  const [vivinoWines,setVivinoWines]=useState(null);   // null=pas encore chargé
  const [vivinoPhase,setVivinoPhase]=useState("idle"); // idle|generating|fetching|done|error
  const [vivinoMsg,setVivinoMsg]=useState("");
  const [vivinoError,setVivinoError]=useState("");
  const [elapsed,setElapsed]=useState(0);

  // Timer d'élapsed pendant le chargement
  useEffect(()=>{
    if(vivinoPhase==="generating"||vivinoPhase==="fetching"){
      const t=setInterval(()=>setElapsed(e=>e+1),1000);
      return()=>clearInterval(t);
    }
  },[vivinoPhase]);

  const loadVivinoSuggestions=async()=>{
    setVivinoPhase("generating"); setVivinoError(""); setElapsed(0);
    setVivinoMsg("Le Sommelier compose votre sélection…");
    try {
      const wines = await fetchVivinoSuggestions(db);
      const enriched = await enrichWithBoir(wines);
      setVivinoWines(enriched);
      setVivinoPhase("done");
    } catch(e) {
      setVivinoError(e.message||"Erreur inconnue");
      setVivinoPhase("error");
    }
  };

  // ── Recherche libre ─────────────────────────────────────────
  const [query,setQuery]=useState("");
  const [searchPhase,setSearchPhase]=useState("idle"); // idle|searching|vivino|done|error
  const [searchResults,setSearchResults]=useState(null);
  const [searchError,setSearchError]=useState("");
  const [searchElapsed,setSearchElapsed]=useState(0);

  useEffect(()=>{
    if(searchPhase==="searching"||searchPhase==="vivino"){
      const t=setInterval(()=>setSearchElapsed(e=>e+1),1000);
      return()=>clearInterval(t);
    }
  },[searchPhase]);

  const doSearch=async()=>{
    if(!query.trim())return;
    setSearchPhase("searching"); setSearchError(""); setSearchResults(null); setSearchElapsed(0);
    try {
      setSearchPhase("vivino");
      const wines = await fetchVivinoSuggestions(db, {query});
      const enriched = await enrichWithBoir(wines);
      setSearchResults(enriched);
      setSearchPhase("done");
    } catch(e) {
      setSearchError(e.message||"Erreur");
      setSearchPhase("error");
    }
  };

  // ── Carte vin Vivino ────────────────────────────────────────
  const VivinoCard=({wine,idx})=>{
    const tc=typeColor(wine.type||"rouge");
    const tl=typeLight(wine.type||"rouge");
    return(
      <div style={{background:C.bgCard,border:`1px solid ${tc}28`,borderRadius:18,padding:"16px",animation:`fadeUp .4s ease ${idx*.07}s both`,opacity:0,boxShadow:`0 3px 14px rgba(139,90,60,.07)`}}>
        <div style={{display:"flex",gap:12,marginBottom:12}}>
          {}
          {wine.image?(
            <img src={wine.image} alt={wine.name} style={{width:52,height:52,borderRadius:10,objectFit:"cover",flexShrink:0,border:`1px solid ${tc}33`}}
              onError={e=>{e.target.style.display="none";}}/>
          ):(
            <div style={{width:52,height:52,borderRadius:10,flexShrink:0,background:tl,border:`1px solid ${tc}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{typeEmoji(wine.type||"rouge")}</div>
          )}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,lineHeight:1.3,marginBottom:3}}>{wine.name}</div>
            <div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>{[wine.producer,wine.year].filter(Boolean).join(" · ")}</div>
          </div>
          {}
          {wine.rating&&(
            <div style={{flexShrink:0,textAlign:"right"}}>
              <div style={{fontSize:20,fontFamily:"Playfair Display,serif",color:C.gold,fontWeight:600,lineHeight:1}}>{parseFloat(wine.rating).toFixed(1)}</div>
              <div style={{fontSize:10,color:C.muted,fontFamily:"Cormorant Garamond,serif",letterSpacing:".06em"}}>/ 5.0</div>
              {wine.ratings_count&&<div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif"}}>{wine.ratings_count.toLocaleString()} avis</div>}
            </div>
          )}
        </div>

        {}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {[WINE_TYPES.find(t=>t.id===wine.type)?.label,wine.region,wine.country].filter(Boolean).map(tag=>(<Tag key={tag}>{tag}</Tag>))}
          {wine.grapes&&<Tag>{wine.grapes.split(",")[0].trim()}</Tag>}
        </div>

        {}
        {wine.description&&(
          <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.75,marginBottom:10}}>{wine.description.slice(0,200)}{wine.description.length>200?"…":""}</p>
        )}

        {}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,alignItems:"center"}}>
          {wine.price_range&&(
            <div style={{fontSize:14,color:C.gold,fontFamily:"Playfair Display,serif",fontWeight:600}}></div>
          )}
          {[wine.acidity&&`Acidité ${wine.acidity}`,wine.tannin&&`Tanin ${wine.tannin}`,wine.sweetness&&`Douceur ${wine.sweetness}`].filter(Boolean).map(t=>(
            <span key={t} style={{fontSize:10,color:C.muted,background:"rgba(139,90,60,.06)",border:"1px solid rgba(139,90,60,.15)",borderRadius:20,padding:"3px 9px",fontFamily:"Cormorant Garamond,serif"}}>{t}</span>
          ))}
        </div>

        {}
        {/* CTA boir.be — lien direct si trouvé, recherche sinon */}
        <a href={wine.boir_found
            ? wine.boir_url
            : `https://boir.be/fr/recherche?search_query=${encodeURIComponent((wine.name+" "+(wine.year||"")).trim().replace(/\s+/g,"+"))}`}
          target="_blank" rel="noopener noreferrer"
          style={{display:"inline-flex",alignItems:"center",gap:7,
            background:wine.boir_found?`rgba(184,134,42,.1)`:`linear-gradient(135deg,rgba(200,80,58,.12),rgba(184,134,42,.08))`,
            border:wine.boir_found?`1px solid rgba(184,134,42,.35)`:`1px solid rgba(200,80,58,.3)`,
            borderRadius:18,padding:"8px 16px",
            textDecoration:"none",fontSize:10,letterSpacing:".12em",
            textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:600}}>
          {wine.boir_found?(
            <span style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{color:C.gold}}>✓ Disponible sur Boir.be</span>
              {wine.boir_price&&<span style={{color:C.gold,fontFamily:"Playfair Display,serif",fontSize:11,letterSpacing:0}}>· {wine.boir_price}</span>}
            </span>
          ):(
            <span style={{color:C.terra}}><span style={{fontSize:14}}>🍷</span> Rechercher sur Boir.be</span>
          )}
        </a>
      </div>
    );
  };

  // ── Loader avec progression ─────────────────────────────────
  const LoadingWine=({msg,elapsed,phase})=>{
    const steps=[
      {id:"generating",label:"Le Sommelier compose votre sélection",done:phase==="done"},
    ];
    return(
      <div style={{textAlign:"center",padding:"40px 20px"}}>
        {}
        <div style={{fontSize:56,marginBottom:20,animation:"pulse 1.5s ease-in-out infinite",filter:"drop-shadow(0 4px 14px rgba(200,80,58,.7)) saturate(2) brightness(1.1)"}}>🍷</div>
        <div style={{fontSize:16,fontFamily:"Playfair Display,serif",color:C.cream,marginBottom:6}}>{msg}</div>
        <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:28}}>{elapsed}s…</div>

        {}
        <div style={{display:"flex",flexDirection:"column",gap:10,maxWidth:280,margin:"0 auto 24px"}}>
          {steps.map((s,i)=>{
            const active=(s.id===phase)||(s.id==="fetching"&&phase==="fetching");
            return(
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,
                  background:s.done?`linear-gradient(135deg,${C.sauge},#4a7a2e)`:active?"rgba(200,80,58,.15)":"rgba(139,90,60,.06)",
                  border:`1px solid ${s.done?C.sauge:active?C.terra:"rgba(139,90,60,.2)"}`,
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {s.done?(
                    <span style={{fontSize:14,color:"#fff"}}>✓</span>
                  ):active?(
                    <div style={{width:10,height:10,borderRadius:"50%",border:`1.5px solid ${C.terra}`,borderTopColor:"transparent",animation:"spin 0.8s linear infinite"}}/>
                  ):(
                    <div style={{width:6,height:6,borderRadius:"50%",background:"rgba(139,90,60,.3)"}}/>
                  )}
                </div>
                <span style={{fontSize:14,color:s.done?C.sauge:active?C.terra:C.muted,fontFamily:"Cormorant Garamond,serif",fontWeight:active||s.done?600:400}}>{s.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>
          Sélection personnalisée en cours…
        </div>
      </div>
    );
  };

  const liked=db.filter(w=>w.tasted&&w.rating>=4);

  return(
    <div style={{flex:1,overflowY:"auto",padding:"14px 16px 100px"}}>
      {}
      <div style={{display:"flex",background:"rgba(139,90,60,.08)",border:`1px solid rgba(139,90,60,.15)`,borderRadius:14,padding:4,gap:4,marginBottom:18}}>
        {[["suggestions","✦ Découvrir"],["search","🔍 Recherche"]].map(([id,l])=>(
          <button key={id} onClick={()=>setMode(id)} style={{flex:1,padding:"10px",borderRadius:11,background:mode===id?`linear-gradient(135deg,${C.terra},${C.terraD})`:"transparent",color:mode===id?"#fff":C.subtext,fontSize:14,letterSpacing:".06em",fontFamily:"Cormorant Garamond,serif",transition:"all .25s"}}>{l}</button>
        ))}
      </div>

      {}
      {mode==="suggestions"&&(
        <>
          {vivinoPhase==="idle"&&(
            <div style={{textAlign:"center",padding:"30px 20px"}}>
              <div style={{fontSize:64,marginBottom:16,filter:"drop-shadow(0 4px 14px rgba(200,80,58,.7)) saturate(2) brightness(1.1)"}}>🍷</div>
              <h2 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8}}>Découvertes du Jour</h2>
              <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.7,marginBottom:8}}>
                {liked.length>0
                  ? `Basé sur vos ${liked.length} vins préférés, votre sommelier compose une sélection personnalisée.`
                  : "Votre sommelier compose une sélection du jour."}
              </p>
              <p style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",marginBottom:28}}>⏱ Environ 30–60 secondes</p>
              <button onClick={loadVivinoSuggestions} style={{background:`linear-gradient(135deg,${C.terra},${C.terraD})`,color:"#fff",border:"none",padding:"16px 32px",borderRadius:50,fontSize:14,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:700,boxShadow:`0 8px 28px rgba(200,80,58,.3)`}}>
                Voir la sélection →
              </button>
            </div>
          )}

          {(vivinoPhase==="generating"||vivinoPhase==="fetching")&&(
            <LoadingWine msg={vivinoMsg} elapsed={elapsed} phase={vivinoPhase}/>
          )}

          {vivinoPhase==="error"&&(
            <div style={{textAlign:"center",padding:"30px 20px"}}>
              <div style={{fontSize:48,marginBottom:14}}>⚠️</div>
              <div style={{fontSize:15,fontFamily:"Playfair Display,serif",color:C.cream,marginBottom:8}}>Oups, une erreur</div>
              <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:24,lineHeight:1.6}}>{vivinoError}</div>
              <button onClick={loadVivinoSuggestions} style={{background:`rgba(200,80,58,.12)`,border:`1px solid rgba(200,80,58,.35)`,borderRadius:22,padding:"11px 26px",color:C.terra,fontSize:14,fontFamily:"Playfair Display,serif"}}>Réessayer</button>
            </div>
          )}

          {vivinoPhase==="done"&&vivinoWines&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:16}}>
                <div>
                  <h2 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:4}}>Sélection du Sommelier</h2>
                  <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>Via Claude · {vivinoWines.length} vins</p>
                </div>
                <button onClick={()=>{setVivinoPhase("idle");setVivinoWines(null);}} style={{flexShrink:0,display:"flex",alignItems:"center",gap:6,background:"rgba(184,134,42,.1)",border:`1px solid rgba(184,134,42,.3)`,borderRadius:22,padding:"8px 14px",color:C.gold,fontSize:14,fontFamily:"Cormorant Garamond,serif"}}>
                  ↺ Nouvelle
                </button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {vivinoWines.map((w,i)=><VivinoCard key={i} wine={w} idx={i}/>)}
              </div>
            </>
          )}
        </>
      )}

      {}
      {mode==="search"&&(
        <>
          <div style={{marginBottom:16}}>
            <h2 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:4}}>Recherche de Vins</h2>
            <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>Décrivez ce que vous cherchez.</p>
          </div>

          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <input value={query} onChange={e=>setQuery(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&searchPhase==="idle"&&doSearch()}
              placeholder="Ex: Pinot Noir Bourgogne, Malbec argentin…"
              style={{flex:1,background:C.bgCard,border:`1px solid rgba(139,90,60,.22)`,borderRadius:14,padding:"12px 15px",color:C.cream,fontSize:14,fontFamily:"Cormorant Garamond,serif",boxShadow:`0 2px 8px rgba(139,90,60,.06)`}}/>
            <button onClick={doSearch} disabled={searchPhase!=="idle"&&searchPhase!=="done"&&searchPhase!=="error"||!query.trim()}
              style={{background:query.trim()?`linear-gradient(135deg,${C.terra},${C.terraD})`:"rgba(139,90,60,.1)",border:"none",borderRadius:14,padding:"12px 16px",color:query.trim()?"#fff":C.muted,fontSize:14,flexShrink:0,transition:"all .2s"}}>
              {searchPhase==="searching"||searchPhase==="vivino"?"…":"→"}
            </button>
          </div>

          {}
          {searchPhase==="idle"&&!searchResults&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:18}}>
              {["Bordeaux puissant","Blanc minéral","Champagne grower","Vin naturel","Malbec argentin","Riesling sec","Sangiovese","Orange wine"].map(s=>(
                <button key={s} onClick={()=>setQuery(s)} style={{background:"rgba(184,134,42,.08)",border:"1px solid rgba(184,134,42,.22)",borderRadius:20,padding:"7px 13px",fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>{s}</button>
              ))}
            </div>
          )}

          {(searchPhase==="searching"||searchPhase==="vivino")&&(
            <LoadingWine
              msg={searchPhase==="searching"?"Claude prépare la recherche…":"Recherche en cours…"}
              elapsed={searchElapsed}
              phase={searchPhase==="searching"||searchPhase==="vivino"?"generating":"done"}
            />
          )}

          {searchPhase==="error"&&(
            <div style={{background:`rgba(200,80,58,.07)`,border:`1px solid rgba(200,80,58,.22)`,borderRadius:14,padding:"13px 16px",textAlign:"center",marginBottom:14}}>
              <div style={{fontSize:14,color:C.terra,fontFamily:"Cormorant Garamond,serif",marginBottom:10}}>{searchError}</div>
              <button onClick={doSearch} style={{color:C.gold,textDecoration:"underline",fontSize:14,fontFamily:"Cormorant Garamond,serif",background:"none"}}>Réessayer</button>
            </div>
          )}

          {searchPhase==="done"&&searchResults&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>{searchResults.length} résultat{searchResults.length>1?"s":""}</div>
                <button onClick={()=>{setSearchResults(null);setSearchPhase("idle");setQuery("");}} style={{fontSize:10,color:C.muted,fontFamily:"Cormorant Garamond,serif",textDecoration:"underline",background:"none"}}>Nouvelle recherche</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {searchResults.map((w,i)=><VivinoCard key={i} wine={w} idx={i}/>)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export { Decouvrir };
