import React, { useState } from "react";
import { C, WINE_TYPES, COUNTRIES, generateStory } from "../lib/constants";
import { t } from "../lib/i18n";
import { haptic, typeColor, typeLight, typeEmoji } from "../lib/helpers";

const AddWineForm=({onSave,onCancel})=>{
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({type:"",country:"",region:"",year:new Date().getFullYear(),producer:"",name:"",tasted:null,rating:null,storage:false,notes:"",quantity:1});
  const LABELS=["","Type de vin","Pays","Région","Détails","Dégustation"];
  const totalSteps=5;
  const up=(k,v)=>setForm(f=>({...f,[k]:v}));
  const canNext=()=>step===1?!!form.type:step===2?!!form.country:step===3?!!form.region:step===4?!!form.year:true;
  const handleSave=()=>{haptic(60);const s=generateStory(form);onSave({...form,id:Date.now(),story:s.story,anecdote:s.anecdote,addedAt:new Date().toLocaleDateString("fr-FR")});};

  const inp=(filled)=>({width:"100%",background:filled?"rgba(200,80,58,.07)":"rgba(139,90,60,.06)",border:`1px solid ${filled?"rgba(200,80,58,.35)":"rgba(139,90,60,.2)"}`,borderRadius:12,padding:"13px 15px",color:C.cream,fontSize:15,fontFamily:"Cormorant Garamond,serif",transition:"border-color .25s"});
  const lbl={fontSize:14,color:C.accent,letterSpacing:".25em",textTransform:"uppercase",marginBottom:8,fontFamily:"Cormorant Garamond,serif",display:"block"};

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"36px 20px 0",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button onClick={onCancel} style={{width:36,height:36,borderRadius:"50%",background:"rgba(139,90,60,.1)",border:`1px solid rgba(139,90,60,.2)`,color:C.accent,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
          <div>
            <div style={{fontSize:14,color:C.muted,letterSpacing:".3em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>Étape {step} / {totalSteps}</div>
            <div style={{fontSize:16,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400}}>{LABELS[step]}</div>
          </div>
        </div>
        <div style={{height:3,background:"rgba(139,90,60,.1)",borderRadius:2,marginBottom:28}}>
          <div style={{height:"100%",width:`${(step/totalSteps)*100}%`,borderRadius:2,background:`linear-gradient(90deg,${C.terra},${C.gold})`,transition:"width .4s ease"}}/>
        </div>
      </div>

      <div style={{flex:1,overflowY:"hidden",padding:"0 20px 0"}}>
        {step===1&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8,lineHeight:1.2}}>Quel type de vin<br/>souhaitez-vous ajouter ?</h2>
            <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:28}}>Commençons par le commencement.</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {WINE_TYPES.map((t,i)=>(
                <button key={t.id} onClick={()=>{haptic(30);up("type",t.id);}} style={{background:form.type===t.id?typeLight(t.id):"rgba(139,90,60,.05)",border:`1px solid ${form.type===t.id?t.color+"66":"rgba(139,90,60,.15)"}`,borderRadius:16,padding:"16px 18px",display:"flex",alignItems:"center",gap:14,animation:`fadeUp .3s ease ${i*.06}s both`,opacity:0,transition:"all .2s"}}>
                  <div style={{width:44,height:44,borderRadius:"50%",flexShrink:0,background:form.type===t.id?t.color+"22":"rgba(139,90,60,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,border:`1px solid ${form.type===t.id?t.color+"55":"rgba(139,90,60,.15)"}`}}>{t.emoji}</div>
                  <div style={{fontSize:16,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400}}>{t.label}</div>
                  {form.type===t.id&&<div style={{marginLeft:"auto",width:20,height:20,borderRadius:"50%",background:t.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",fontWeight:700}}>✓</div>}
                </button>
              ))}
            </div>
          </div>
        )}
        {step===2&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8,lineHeight:1.2}}>De quel pays<br/>vient ce vin ?</h2>
            <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:28}}>Le terroir raconte toujours une histoire.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {Object.entries(COUNTRIES).map(([country,data])=>(
                <button key={country} onClick={()=>{haptic(20);up("country",country);up("region","");}} style={{background:form.country===country?"rgba(184,134,42,.15)":"rgba(139,90,60,.05)",border:`1px solid ${form.country===country?"rgba(184,134,42,.5)":"rgba(139,90,60,.15)"}`,borderRadius:12,padding:"11px 10px",display:"flex",alignItems:"center",gap:8,transition:"all .2s"}}>
                  <span style={{fontSize:18}}>{data.flag}</span>
                  <span style={{fontSize:14,color:form.country===country?C.gold:C.subtext,fontFamily:"Cormorant Garamond,serif",fontWeight:form.country===country?600:400}}>{country}</span>
                  {form.country===country&&<span style={{marginLeft:"auto",color:C.gold,fontSize:12}}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}
        {step===3&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8,lineHeight:1.2}}>Quelle région ?</h2>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(184,134,42,.1)",border:"1px solid rgba(184,134,42,.3)",borderRadius:20,padding:"6px 14px",marginBottom:22}}>
              <span style={{fontSize:16}}>{COUNTRIES[form.country]?.flag}</span>
              <span style={{fontSize:14,color:C.gold,fontFamily:"Cormorant Garamond,serif"}}>{form.country}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {COUNTRIES[form.country]?.regions.map(r=>(
                <button key={r} onClick={()=>{haptic(20);up("region",r);}} style={{background:form.region===r?"rgba(200,80,58,.12)":"rgba(139,90,60,.05)",border:`1px solid ${form.region===r?"rgba(200,80,58,.45)":"rgba(139,90,60,.15)"}`,borderRadius:12,padding:"12px 16px",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .2s"}}>
                  <span style={{fontSize:14,color:form.region===r?C.cream:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>{r}</span>
                  {form.region===r&&<span style={{color:C.terra,fontSize:13}}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}
        {step===4&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8,lineHeight:1.2}}>Quelques précisions…</h2>
            <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:28}}>Plus vous en dites, mieux je vous connais.</p>
            <div style={{marginBottom:16}}><label style={lbl}>Millésime</label><input type="number" value={form.year} onChange={e=>up("year",parseInt(e.target.value)||new Date().getFullYear())} min={1900} max={new Date().getFullYear()} style={inp(form.year)}/></div>
            <div style={{marginBottom:16}}><label style={lbl}>Maison / Domaine / Château</label><input type="text" value={form.producer} onChange={e=>up("producer",e.target.value)} placeholder="Ex: Château Margaux, Domaine Leroy…" style={inp(form.producer)}/></div>
            <div style={{marginBottom:16}}><label style={lbl}>Nom du vin <span style={{color:C.muted,fontWeight:300}}>(optionnel)</span></label><input type="text" value={form.name} onChange={e=>up("name",e.target.value)} placeholder="Ex: Cuvée Prestige, Grand Cru…" style={inp(form.name)}/></div>
            <div style={{marginBottom:16}}>
              <label style={lbl}>{t("bottles_in_cave")}</label>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <button onClick={()=>up("quantity",Math.max(0,form.quantity-1))} style={{width:42,height:42,borderRadius:"50%",background:"rgba(139,90,60,.1)",border:"1px solid rgba(139,90,60,.2)",color:C.cream,fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:300}}>−</button>
                <div style={{flex:1,textAlign:"center",fontSize:28,fontFamily:"Playfair Display,serif",color:C.cream}}>{form.quantity}</div>
                <button onClick={()=>up("quantity",form.quantity+1)} style={{width:42,height:42,borderRadius:"50%",background:`linear-gradient(135deg,${C.terra},${C.terraD})`,border:"none",color:"#fff",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:300}}>＋</button>
              </div>
              <div style={{textAlign:"center",fontSize:12,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginTop:6}}>0 = déjà bu / plus en stock</div>
            </div>
          </div>
        )}
        {step===5&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8,lineHeight:1.2}}>L'avez-vous<br/>déjà goûté ?</h2>
            <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:28}}>Votre mémoire gustative est précieuse.</p>
            <div style={{display:"flex",gap:12,marginBottom:24}}>
              {[{val:true,label:"Oui, je l'ai bu",emoji:"✓",c:C.sauge},{val:false,label:"Non, pas encore",emoji:"○",c:C.gold}].map(opt=>(
                <button key={String(opt.val)} onClick={()=>{haptic(40);up("tasted",opt.val);up("storage",!opt.val);}} style={{flex:1,padding:"18px 10px",background:form.tasted===opt.val?`${opt.c}18`:"rgba(139,90,60,.05)",border:`1px solid ${form.tasted===opt.val?opt.c+"55":"rgba(139,90,60,.15)"}`,borderRadius:16,display:"flex",flexDirection:"column",alignItems:"center",gap:10,transition:"all .25s"}}>
                  <div style={{width:42,height:42,borderRadius:"50%",background:form.tasted===opt.val?opt.c+"22":"rgba(139,90,60,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,color:form.tasted===opt.val?opt.c:C.muted,fontWeight:700}}>{opt.emoji}</div>
                  <span style={{fontSize:14,color:form.tasted===opt.val?C.cream:C.subtext,fontFamily:"Cormorant Garamond,serif",textAlign:"center",lineHeight:1.3}}>{opt.label}</span>
                </button>
              ))}
            </div>
            {form.tasted===true&&(
              <div style={{background:"rgba(200,80,58,.07)",border:`1px solid rgba(200,80,58,.2)`,borderRadius:16,padding:"20px 16px",marginBottom:14,animation:"fadeUp .3s ease"}}>
                <div style={{fontSize:10,color:C.terra,letterSpacing:".22em",textTransform:"uppercase",marginBottom:6,fontFamily:"Cormorant Garamond,serif",textAlign:"center"}}>Votre note sur 5</div>
                <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",textAlign:"center",marginBottom:16}}>0 = à éviter · 5 = expérience absolue</div>
                <StarRating value={form.rating??-1} onChange={v=>{haptic(30);up("rating",v);}} size={32}/>
                {form.rating!==null&&<div style={{textAlign:"center",marginTop:12,fontSize:14,color:C.cream,fontFamily:"Playfair Display,serif",fontStyle:"italic",animation:"fadeIn .3s ease"}}>{["À éviter 🚫","Décevant 😕","Correct 😐","Bien 🙂","Très bon ⭐","Exceptionnel ✨"][form.rating]}</div>}
                <div style={{marginTop:16}}>
                  <label style={{...lbl}}>Notes <span style={{color:C.muted}}>(optionnel)</span></label>
                  <textarea value={form.notes} onChange={e=>up("notes",e.target.value)} placeholder="Un souvenir, un accord, une émotion…" rows={3} style={{...inp(form.notes),resize:"none",lineHeight:1.65,fontStyle:"italic"}}/>
                </div>
              </div>
            )}
            {form.tasted===false&&(
              <div style={{background:"rgba(184,134,42,.08)",border:`1px solid rgba(184,134,42,.22)`,borderRadius:16,padding:"16px",animation:"fadeUp .3s ease"}}>
                <div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.7,textAlign:"center"}}>Ce vin sera stocké dans votre cave.<br/><span style={{color:C.gold}}>Vous pourrez l'évaluer plus tard.</span></div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{flexShrink:0,padding:"16px 20px 32px",background:`linear-gradient(transparent,${C.bg} 35%)`}}>
        {step<5?(
          <button onClick={()=>{if(canNext()){haptic(40);setStep(s=>s+1);}}} style={{width:"100%",padding:"16px",background:canNext()?`linear-gradient(135deg,${C.terra},${C.terraD})`:"rgba(139,90,60,.12)",color:canNext()?"#fff":"rgba(61,43,26,.3)",border:"none",borderRadius:50,fontSize:14,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:700,boxShadow:canNext()?`0 8px 28px rgba(200,80,58,.3)`:"none",transition:"all .3s"}}>Continuer →</button>
        ):(
          <button onClick={handleSave} disabled={form.tasted===null||(form.tasted===true&&form.rating===null)} style={{width:"100%",padding:"16px",background:(form.tasted!==null&&(form.tasted===false||form.rating!==null))?`linear-gradient(135deg,${C.sauge},#4a7a2e)`:"rgba(139,90,60,.12)",color:(form.tasted!==null&&(form.tasted===false||form.rating!==null))?"#fff":"rgba(61,43,26,.3)",border:"none",borderRadius:50,fontSize:14,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:700,transition:"all .3s"}}>✓ Ajouter à ma cave</button>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DÉTAIL D'UN VIN
═══════════════════════════════════════════════════════════════ */

export { AddWineForm };
