import React, { useState } from "react";
import { C, WINE_TYPES, COUNTRIES } from "../lib/constants";
import { t } from "../lib/i18n";
import { haptic, typeColor, typeLight, typeEmoji } from "../lib/helpers";
import { Tag, StarRating, WineInfoCard } from "./UI";

const WineDetail=({wine,onBack,onUpdateRating,onDelete,onUpdateWine})=>{
  const [rating,setRating]=useState(wine.rating??null);
  const [showRate,setShowRate]=useState(false);
  const tc=typeColor(wine.type);
  const tl=typeLight(wine.type);
  const handleRate=(r)=>{haptic(50);setRating(r);onUpdateRating(wine.id,r);setShowRate(false);};
  return(
    <div style={{minHeight:"100vh",background:C.bg,overflowY:"auto"}}>
      <div style={{background:`linear-gradient(160deg,${tl} 0%,transparent 40%)`,minHeight:"100vh"}}>
        <div style={{padding:"36px 20px 0",display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <button onClick={onBack} style={{width:38,height:38,borderRadius:"50%",background:"rgba(139,90,60,.12)",border:`1px solid rgba(139,90,60,.2)`,color:C.accent,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
          <div>
            <div style={{fontSize:14,color:C.muted,letterSpacing:".25em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>{typeEmoji(wine.type)} {WINE_TYPES.find(t=>t.id===wine.type)?.label}</div>
            <div style={{fontSize:16,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,maxWidth:280,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{wine.producer||wine.name||"Vin sans nom"}</div>
          </div>
        </div>
        <div style={{padding:"0 20px 80px"}}>
          <div style={{background:C.bgCard,border:`1px solid ${tc}33`,borderRadius:22,padding:"22px",marginBottom:14,boxShadow:`0 4px 24px rgba(139,90,60,.1)`}}>
            <div style={{fontSize:52,textAlign:"center",marginBottom:14,filter:`drop-shadow(0 4px 12px ${tc}44)`}}>{typeEmoji(wine.type)}</div>
            <h2 style={{fontSize:24,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,textAlign:"center",marginBottom:6,lineHeight:1.2}}>{wine.producer||"Domaine inconnu"}</h2>
            {wine.name&&<div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",textAlign:"center",marginBottom:12}}>{wine.name}</div>}
            <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
              {[wine.region&&`📍 ${wine.region}`,wine.country&&`${COUNTRIES[wine.country]?.flag||"🌍"} ${wine.country}`,wine.year&&`📅 ${wine.year}`].filter(Boolean).map(tag=>(
                <span key={tag} style={{fontSize:14,color:C.subtext,background:"rgba(139,90,60,.07)",border:"1px solid rgba(139,90,60,.15)",borderRadius:20,padding:"5px 12px",fontFamily:"Cormorant Garamond,serif"}}>{tag}</span>
              ))}
            </div>
                </div>

          {}
          <div style={{background:C.bgCard,border:"1px solid rgba(139,90,60,.12)",borderRadius:18,padding:"16px 20px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
            <div>
              <div style={{fontSize:11,color:C.muted,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginBottom:8}}>{t("bottles_in_cave")}</div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <button onClick={()=>onUpdateWine&&onUpdateWine(wine.id,{quantity:Math.max(0,(wine.quantity||0)-1)})} style={{width:34,height:34,borderRadius:"50%",background:"rgba(139,90,60,.1)",border:"1px solid rgba(139,90,60,.2)",color:C.cream,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                <span style={{fontSize:28,fontFamily:"Playfair Display,serif",color:C.cream,minWidth:32,textAlign:"center"}}>{wine.quantity||0}</span>
                <button onClick={()=>onUpdateWine&&onUpdateWine(wine.id,{quantity:(wine.quantity||0)+1})} style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${C.terra},${C.terraD})`,border:"none",color:"#fff",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>＋</button>
                <span style={{fontSize:13,color:C.muted,fontFamily:"Cormorant Garamond,serif"}}>{(wine.quantity||0)>1?t("bottles"):t("bottle")}</span>
              </div>
            </div>
            {onDelete&&<button onClick={()=>{if(window.confirm(t("confirm_delete")))onDelete(wine.id);}} style={{background:"none",border:"1px solid rgba(200,80,58,.25)",borderRadius:20,padding:"8px 14px",color:C.terra,fontSize:13,fontFamily:"Cormorant Garamond,serif",whiteSpace:"nowrap",flexShrink:0}}>🗑 Supprimer</button>}
          </div>

          <div style={{background:C.bgCard,border:C.border,borderRadius:18,padding:"18px",marginBottom:14,boxShadow:`0 2px 12px rgba(139,90,60,.06)`}}>
            {wine.tasted&&rating!==null?(<div style={{textAlign:"center"}}><div style={{fontSize:10,color:C.gold,letterSpacing:".22em",textTransform:"uppercase",marginBottom:10,fontFamily:"Cormorant Garamond,serif"}}>{t("your_rating")}</div><div style={{fontSize:44,fontFamily:"Playfair Display,serif",color:tc,fontWeight:600,lineHeight:1}}>{rating}<span style={{fontSize:18,color:C.muted}}>/5</span></div><div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginTop:6}}>{["À éviter 🚫","Décevant 😕","Correct 😐","Bien 🙂","Très bon ⭐","Exceptionnel ✨"][rating]}</div><button onClick={()=>setShowRate(true)} style={{marginTop:10,background:"none",color:"rgba(184,134,42,.6)",fontSize:10,fontFamily:"Cormorant Garamond,serif",letterSpacing:".1em",textDecoration:"underline"}}>{t("modify_rating")}</button></div>
            ):wine.tasted&&rating===null?(<div><div style={{fontSize:10,color:C.gold,letterSpacing:".22em",textTransform:"uppercase",marginBottom:14,fontFamily:"Cormorant Garamond,serif",textAlign:"center"}}>{t("rate_wine")}</div><StarRating value={-1} onChange={handleRate}/></div>
            ):(<div style={{textAlign:"center"}}><div style={{fontSize:30,marginBottom:8}}>🗄️</div><div style={{fontSize:14,color:C.cream,fontFamily:"Playfair Display,serif",marginBottom:6}}>En cave</div><div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:14}}>Stocké pour plus tard</div><button onClick={()=>setShowRate(true)} style={{background:`linear-gradient(135deg,${C.terra},${C.terraD})`,color:"#fff",border:"none",padding:"10px 22px",borderRadius:50,fontSize:14,letterSpacing:".15em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>Je l'ai goûté !</button></div>)}
          </div>

          <WineInfoCard wine={wine}/>

          {wine.story&&(<div style={{background:"rgba(200,80,58,.06)",borderLeft:`3px solid ${C.terra}`,borderRadius:"0 14px 14px 0",padding:"14px 16px",marginBottom:14}}><div style={{fontSize:14,color:C.terra,letterSpacing:".22em",textTransform:"uppercase",marginBottom:8,fontFamily:"Cormorant Garamond,serif"}}>{t("terroir")}</div><p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.85}}>{wine.story}</p></div>)}
          {wine.anecdote&&(<div style={{background:"rgba(184,134,42,.07)",border:`1px solid rgba(184,134,42,.2)`,borderRadius:14,padding:"13px 15px",marginBottom:14}}><div style={{fontSize:14,color:C.gold,letterSpacing:".18em",textTransform:"uppercase",marginBottom:6,fontFamily:"Cormorant Garamond,serif"}}>✦ Le saviez-vous ?</div><p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",lineHeight:1.75}}>{wine.anecdote}</p></div>)}
          {wine.notes&&(<div style={{background:C.bgCard,border:C.border,borderRadius:14,padding:"13px 15px"}}><div style={{fontSize:14,color:C.muted,letterSpacing:".18em",textTransform:"uppercase",marginBottom:6,fontFamily:"Cormorant Garamond,serif"}}>Ma note personnelle</div><p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.75}}>{wine.notes}</p></div>)}
        </div>
      </div>

      {showRate&&(<div style={{position:"fixed",inset:0,zIndex:800,display:"flex",alignItems:"flex-end",background:"rgba(61,43,26,.5)"}} onClick={e=>{if(e.target===e.currentTarget)setShowRate(false);}}>
        <div style={{background:C.bgCard,border:`1px solid rgba(139,90,60,.2)`,borderRadius:"24px 24px 0 0",width:"100%",padding:"22px 20px 44px",animation:"slideUp .3s ease"}}>
          <div style={{width:32,height:3,background:"rgba(139,90,60,.2)",borderRadius:2,margin:"0 auto 18px"}}/>
          <div style={{fontSize:10,color:C.gold,letterSpacing:".22em",textTransform:"uppercase",marginBottom:14,fontFamily:"Cormorant Garamond,serif",textAlign:"center"}}>{t("rate_wine")}</div>
          <StarRating value={rating??-1} onChange={handleRate} size={36}/>
        </div>
      </div>)}

    </div>
  );
};

export { WineDetail };
