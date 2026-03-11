import React, { useState, useEffect } from "react";
import { C, WINE_TYPES } from "../lib/constants";
import { t } from "../lib/i18n";
import { haptic, typeColor, typeLight, typeEmoji } from "../lib/helpers";
import { callClaude, safeJson } from "../lib/claude";
import { Tag } from "./UI";

const Accueil=({db,userName,onSetName,onAdd,onOpenWine})=>{
  const [wines,setWines]=useState(null);
  const [phase,setPhase]=useState("idle"); // idle|loading|done|error
  const [error,setError]=useState("");
  const [editingName,setEditingName]=useState(!userName);
  const [nameInput,setNameInput]=useState(userName||"");

  // Quand le prénom arrive depuis Supabase, fermer l'écran de saisie
  useEffect(()=>{
    if(userName){ setEditingName(false); setNameInput(userName); }
  },[userName]);

  // Heure du jour pour la salutation
  const hour=new Date().getHours();
  const greeting=hour<12?t("good_morning"):hour<18?t("good_afternoon"):t("good_evening");

  // Charger les 3 vins au montage (si nom connu)
  useEffect(()=>{
    if(userName && !wines && phase==="idle") loadWines();
  },[userName]);

  const loadWines=async()=>{
    setPhase("loading"); setError("");
    try {
      const rated = db.filter(w=>w.tasted&&w.rating!=null);
      const liked = rated.filter(w=>w.rating>=4).map(w=>`${w.type} ${w.region||w.country||""}`).join(", ");
      const disliked = rated.filter(w=>w.rating<=1).map(w=>w.type).join(", ");

    const _seed = parseInt(localStorage.getItem("unwined_seed")||"0");
      const prompt = `Tu es sommelier expert. Réponds UNIQUEMENT avec un tableau JSON valide, rien d'autre, pas de texte avant ou après, pas de markdown.
[Session ${_seed}] Propose exactement 3 vins DIFFÉRENTS pour ${userName||"cet utilisateur"}.
${liked?`Goûts appréciés : ${liked}.`:"Pas encore de préférences — propose des classiques polyvalents."}
${disliked?`À éviter absolument : ${disliked}.`:""}
1 vin par gamme : budget(10-30€), milieu(30-75€), prestige(75€+).
FORMAT EXACT — commence directement par [ :
[{"name":"Château X","producer":"Domaine Y","type":"rouge","region":"Bordeaux","country":"France","year":2020,"price_range":"18-24€","grapes":"Merlot, Cabernet","description":"2 phrases arômes et style","why":"Raison personnalisée","search_query":"Chateau X 2020","budget":"budget"},{"name":"...","producer":"...","type":"blanc","region":"...","country":"...","year":2021,"price_range":"45-55€","grapes":"...","description":"...","why":"...","search_query":"...","budget":"milieu"},{"name":"...","producer":"...","type":"rouge","region":"...","country":"...","year":2019,"price_range":"90-120€","grapes":"...","description":"...","why":"...","search_query":"...","budget":"prestige"}]`;

      const txt = await callClaude([{role:"user",content:prompt}], 1500);
      const arr = safeJson(txt, []);
      const list = Array.isArray(arr) ? arr : [];
      setWines(list.slice(0,3));
      setPhase("done");
    } catch(e) {
      setError(e.message||"Erreur");
      setPhase("error");
    }
  };

  const saveName=()=>{
    if(!nameInput.trim()) return;
    onSetName(nameInput.trim());
    setEditingName(false);
    setPhase("idle");
    setTimeout(loadWines, 100);
  };

  const BUDGET_LABELS={budget:"10–30€",milieu:"30–75€",prestige:"75€+"};
  const BUDGET_COLORS={budget:C.sauge,milieu:C.gold,prestige:C.terra};

  // Écran saisie du prénom
  if(editingName) return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 28px 100px",textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:20,filter:"drop-shadow(0 4px 14px rgba(200,80,58,.7)) saturate(2) brightness(1.1)"}}>🍷</div>
      <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8}}>{t("welcome")}</h2>
      <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:32,lineHeight:1.7}}>{t("name_q")}</p>
      <input
        value={nameInput}
        onChange={e=>setNameInput(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&saveName()}
        placeholder={t("name_placeholder")}
        autoFocus
        style={{width:"100%",maxWidth:280,background:C.bgCard,border:`1px solid rgba(139,90,60,.25)`,borderRadius:16,padding:"14px 18px",color:C.cream,fontSize:16,fontFamily:"Playfair Display,serif",textAlign:"center",marginBottom:16,outline:"none"}}
      />
      <button onClick={saveName} disabled={!nameInput.trim()} style={{background:`linear-gradient(135deg,${C.terra},${C.terraD})`,color:"#fff",border:"none",padding:"14px 36px",borderRadius:50,fontSize:14,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:700,opacity:nameInput.trim()?1:.4}}>
        Entrer →
      </button>
    </div>
  );

  return(
    <div style={{flex:1,overflowY:"auto",padding:"20px 16px 100px"}}>

      {/* Salutation */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:4}}>{greeting},</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h2 style={{fontSize:30,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400}}>{userName} <span style={{color:C.terra}}>✦</span></h2>
          <button onClick={()=>{setEditingName(true);setNameInput(userName);}} style={{fontSize:14,color:C.muted,background:"none",fontFamily:"Cormorant Garamond,serif",textDecoration:"underline"}}>Changer</button>
        </div>
        <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginTop:6,lineHeight:1.6}}>
          {db.filter(w=>w.tasted).length>0
            ? t("based_on", db.filter(w=>w.tasted).length)
            : t("no_prefs")}
        </p>
      </div>

      {/* Ligne déco */}
      <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.terra}66,transparent)`,marginBottom:24}}/>

      {/* Titre section */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h3 style={{fontSize:18,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400}}>Je vous propose ces 3 vins</h3>
          <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",marginTop:2}}>Une sélection sur 3 gammes de prix</div>
        </div>
        {phase==="done"&&(
          <button onClick={loadWines} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(184,134,42,.1)",border:`1px solid rgba(184,134,42,.3)`,borderRadius:20,padding:"7px 13px",color:C.gold,fontSize:14,fontFamily:"Cormorant Garamond,serif"}}>
            <span style={{fontSize:13}}>↺</span> Autre
          </button>
        )}
      </div>

      {/* Loader */}
      {phase==="loading"&&(
        <div style={{textAlign:"center",padding:"50px 20px"}}>
          <div style={{fontSize:48,marginBottom:16,animation:"pulse 1.5s ease-in-out infinite",filter:"drop-shadow(0 4px 14px rgba(200,80,58,.7)) saturate(2) brightness(1.1)"}}>🍷</div>
          <div style={{fontSize:15,fontFamily:"Playfair Display,serif",color:C.cream,marginBottom:6}}>{t("thinking")}</div>
          <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>{t("personalized")}</div>
        </div>
      )}

      {/* Erreur */}
      {phase==="error"&&(
        <div style={{textAlign:"center",padding:"30px 16px"}}>
          <div style={{fontSize:14,color:C.terra,fontFamily:"Cormorant Garamond,serif",marginBottom:14}}>{error}</div>
          <button onClick={loadWines} style={{background:`rgba(200,80,58,.1)`,border:`1px solid rgba(200,80,58,.3)`,borderRadius:20,padding:"10px 24px",color:C.terra,fontSize:14,fontFamily:"Playfair Display,serif"}}>Réessayer</button>
        </div>
      )}

      {/* Idle — pas encore chargé */}
      {phase==="idle"&&(
        <div style={{textAlign:"center",padding:"40px 16px"}}>
          <button onClick={loadWines} style={{background:`linear-gradient(135deg,${C.terra},${C.terraD})`,color:"#fff",border:"none",padding:"16px 36px",borderRadius:50,fontSize:14,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:700,boxShadow:`0 8px 24px rgba(200,80,58,.25)`}}>
            Voir ma sélection →
          </button>
        </div>
      )}

      {/* Les 3 vins */}
      {phase==="done"&&wines&&wines.map((wine,i)=>{
        const tc=typeColor(wine.type||"rouge");
        const tl=typeLight(wine.type||"rouge");
        const budgetColor=BUDGET_COLORS[wine.budget]||C.gold;
        const budgetLabel=BUDGET_LABELS[wine.budget]||wine.price_range||"";
        return(
          <div key={i} style={{background:C.bgCard,border:`1px solid ${tc}22`,borderRadius:20,padding:"18px",marginBottom:14,animation:`fadeUp .4s ease ${i*.12}s both`,opacity:0,boxShadow:`0 4px 16px rgba(139,90,60,.07)`}}>

            {/* Badge gamme de prix */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:tl,border:`1px solid ${tc}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{typeEmoji(wine.type||"rouge")}</div>
                <div>
                  <div style={{fontSize:15,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,lineHeight:1.2}}>{wine.name}</div>
                  <div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>{wine.producer}</div>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                <div style={{fontSize:14,fontFamily:"Playfair Display,serif",color:budgetColor,fontWeight:700}}></div>
                <div style={{fontSize:14,color:budgetColor,background:`${budgetColor}15`,border:`1px solid ${budgetColor}33`,borderRadius:10,padding:"2px 7px",fontFamily:"Cormorant Garamond,serif",letterSpacing:".06em",marginTop:2}}>{budgetLabel}</div>
              </div>
            </div>

            {/* Tags */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
              {[WINE_TYPES.find(t=>t.id===wine.type)?.label,wine.region,wine.country,wine.year].filter(Boolean).map(tag=>(<Tag key={String(tag)}>{tag}</Tag>))}
              {wine.grapes&&<Tag>{wine.grapes.split(",")[0].trim()}</Tag>}
            </div>

            {/* Why + description */}
            {wine.why&&<p style={{fontSize:14,color:C.terra,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.7,marginBottom:6,fontWeight:600}}>{wine.why}</p>}
            {wine.description&&<p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",lineHeight:1.7,marginBottom:12}}>{wine.description}</p>}

            {/* Bouton Wine-Searcher */}
            <a href={`https://www.wine-searcher.com/find/${encodeURIComponent((wine.search_query||wine.name).replace(/\s+/g,"+"))}`}
              target="_blank" rel="noopener noreferrer"
              style={{display:"inline-flex",alignItems:"center",gap:7,
                background:`linear-gradient(135deg,rgba(200,80,58,.1),rgba(184,134,42,.06))`,
                border:`1px solid rgba(200,80,58,.28)`,borderRadius:18,padding:"8px 16px",
                textDecoration:"none",color:C.terra,fontSize:10,letterSpacing:".12em",
                textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:600}}>
              🔍 Wine-Searcher
            </a>
          </div>
        );
      })}

      {/* CTA cave vide */}
      {phase==="done"&&db.length===0&&(
        <div style={{background:`rgba(184,134,42,.06)`,border:`1px solid rgba(184,134,42,.2)`,borderRadius:16,padding:"16px",marginTop:8,textAlign:"center"}}>
          <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.7,marginBottom:12}}>Notez vos vins pour affiner la sélection selon vos goûts réels.</p>
          <button onClick={onAdd} style={{background:`linear-gradient(135deg,${C.terra},${C.terraD})`,color:"#fff",border:"none",padding:"11px 24px",borderRadius:30,fontSize:14,letterSpacing:".15em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:600}}>+ Ajouter un vin</button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   AUTH SCREEN — Login / Signup
═══════════════════════════════════════════════════════════════ */
const AuthScreen=({onAuth})=>{

export { Accueil };
