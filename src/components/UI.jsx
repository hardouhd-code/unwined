import React from "react";
import { C } from "../lib/constants";
import { WINE_TYPES } from "../lib/constants";
import { t } from "../lib/i18n";
import { callClaude, safeJson, lookupWineOnline } from "../lib/claude";

const Tag=({children,color})=>(
  <span style={{fontSize:14,color:color||C.accent,background:color?`${color}18`:"rgba(139,90,60,.1)",border:`1px solid ${color||C.accent}33`,borderRadius:20,padding:"4px 11px",fontFamily:"Cormorant Garamond,serif",lineHeight:1}}>{children}</span>
);

const StarRating=({value,onChange,size=32})=>(
  <div style={{display:"flex",gap:8,justifyContent:"center"}}>
    {[0,1,2,3,4,5].map(n=>(
      <button key={n} onClick={()=>onChange(n)} style={{width:size+8,height:size+8,borderRadius:"50%",background:n<=value?`linear-gradient(135deg,${C.terra},${C.gold})`:`rgba(139,90,60,.1)`,border:n<=value?"none":`1px solid rgba(184,134,42,.3)`,color:n<=value?"#fff":C.muted,fontSize:n===0?13:17,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>{n===0?"✗":"★"}</button>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   WINE INFO CARD — lookup en ligne
═══════════════════════════════════════════════════════════════ */
const WineInfoCard=({wine})=>{
  const [info,setInfo]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(false);
  const q=[wine.producer,wine.name,wine.region,wine.country,wine.year].filter(Boolean).join(" ");
  const fetch_info=async()=>{setLoading(true);setError(false);try{setInfo(await lookupWineOnline(wine));}catch{setError(true);}finally{setLoading(false);}};
  if(!info&&!loading)return(
    <button onClick={fetch_info} style={{width:"100%",background:"rgba(184,134,42,.08)",border:`1px solid rgba(184,134,42,.25)`,borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:14,transition:"all .2s"}}>
      <span style={{fontSize:20}}>🌐</span>
      <div style={{textAlign:"left"}}>
        <div style={{fontSize:14,color:C.gold,fontFamily:"Playfair Display,serif",fontWeight:500}}>{t("online_sheet")}</div>
        <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",marginTop:2}}>{t("online_sheet_sub")}</div>
      </div>
      <span style={{marginLeft:"auto",color:C.gold,fontSize:16}}>→</span>
    </button>
  );
  if(loading)return(
    <div style={{background:"rgba(184,134,42,.06)",border:`1px solid rgba(184,134,42,.18)`,borderRadius:14,padding:"16px",marginBottom:14,textAlign:"center"}}>
      <div style={{width:22,height:22,border:`2px solid rgba(184,134,42,.2)`,borderTopColor:C.gold,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 8px"}}/>
      <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>Consultation des bases de données…</div>
    </div>
  );
  if(error)return(
    <div style={{background:"rgba(200,80,58,.06)",border:`1px solid rgba(200,80,58,.2)`,borderRadius:14,padding:"12px 16px",marginBottom:14}}>
      <span style={{fontSize:14,color:C.terra,fontFamily:"Cormorant Garamond,serif"}}>Impossible de récupérer les infos. </span>
      <button onClick={fetch_info} style={{color:C.gold,textDecoration:"underline",fontSize:14,fontFamily:"Cormorant Garamond,serif"}}>Réessayer</button>
    </div>
  );
  return(
    <div style={{background:"rgba(184,134,42,.07)",border:`1px solid rgba(184,134,42,.22)`,borderRadius:16,padding:"16px",marginBottom:14,animation:"fadeIn .4s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:14,color:C.gold,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>🌐 Fiche en ligne</div>
        {info.score&&<div style={{fontSize:14,color:C.gold,fontFamily:"Playfair Display,serif",fontWeight:600}}>{info.score}</div>}
      </div>
      {info.description&&<p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.8,marginBottom:12}}>{info.description}</p>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {info.grapes&&<div style={{background:"rgba(139,90,60,.06)",borderRadius:10,padding:"8px 10px"}}><div style={{fontSize:10,color:C.muted,letterSpacing:".15em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginBottom:3}}>Cépages</div><div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>{info.grapes}</div></div>}
        {info.price_range&&<div style={{background:"rgba(139,90,60,.06)",borderRadius:10,padding:"8px 10px"}}><div style={{fontSize:10,color:C.muted,letterSpacing:".15em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginBottom:3}}>Prix</div><div style={{fontSize:14,color:C.gold,fontFamily:"Playfair Display,serif",fontWeight:600}}>{info.price_range}</div></div>}
        {info.serving&&<div style={{background:"rgba(139,90,60,.06)",borderRadius:10,padding:"8px 10px"}}><div style={{fontSize:10,color:C.muted,letterSpacing:".15em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginBottom:3}}>Service</div><div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>{info.serving}</div></div>}
        {info.peak&&<div style={{background:"rgba(139,90,60,.06)",borderRadius:10,padding:"8px 10px"}}><div style={{fontSize:10,color:C.muted,letterSpacing:".15em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginBottom:3}}>Apogée</div><div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>{info.peak}</div></div>}
      </div>
      <a href={`https://www.wine-searcher.com/find/${encodeURIComponent((info.search_query||q).replace(/[\s]+/g,"+"))}`} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:`rgba(200,80,58,.12)`,border:`1px solid rgba(200,80,58,.3)`,borderRadius:20,padding:"7px 16px",textDecoration:"none",color:C.terra,fontSize:10,letterSpacing:".12em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>🔍 Wine-Searcher</a>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   FORMULAIRE D'AJOUT (5 étapes)
═══════════════════════════════════════════════════════════════ */
const AddWineForm=({onSave,onCancel})=>{
  const [step,setStep]=useState(1);

export { Tag, StarRating, WineInfoCard };
