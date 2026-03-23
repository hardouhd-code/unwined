import React from "react";
import { C, WINE_TYPES } from "../lib/constants";
import { t } from "../lib/i18n";

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

export { Tag, StarRating };
