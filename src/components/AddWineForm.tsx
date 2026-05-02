import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { C, WINE_TYPES, COUNTRIES, generateStory } from "../lib/constants";
import { t } from "../lib/i18n";
import { haptic, typeColor, typeLight, typeEmoji } from "../lib/helpers";
import { StarRating } from "./UI";
import { Wine, WineType } from "../types";

const AddWineForm = () => {
  const navigate = useNavigate();
  const { addWine } = useStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Partial<Wine>>({ type: undefined, country: "", region: "", year: new Date().getFullYear(), producer: "", name: "", tasted: false, rating: null, storage: false, notes: "", quantity: 1 });
  const LABELS = ["", "Type de vin", "Pays", "Région", "Détails", "Dégustation"];
  const totalSteps = 5;
  const up = (k: keyof Wine, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const canNext = () => step === 1 ? !!form.type : step === 2 ? !!form.country : step === 3 ? !!form.region : step === 4 ? !!form.year : true;
  const handleSave = () => { haptic(60); const s = generateStory(form); addWine({ ...form, id: String(Date.now()), story: s.story, anecdote: s.anecdote, addedAt: new Date().toLocaleDateString("fr-FR") } as Wine); navigate("/cave"); };
  const onCancel = () => navigate(-1);

  const inp = (filled: boolean) => filled
    ? "w-full bg-[#c8503a12] border border-[#c8503a59] rounded-xl px-4 py-3 text-[var(--color-cream)] text-[15px] font-['Cormorant_Garamond',serif] transition-colors duration-250 outline-none"
    : "w-full bg-[#8b5a3c0f] border border-[#8b5a3c33] rounded-xl px-4 py-3 text-[var(--color-cream)] text-[15px] font-['Cormorant_Garamond',serif] transition-colors duration-250 outline-none focus:border-[#c8503a59]";
  const lbl = "block text-[14px] text-[var(--color-gold)] tracking-[.25em] uppercase mb-2 font-['Cormorant_Garamond',serif]";

  return(
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <div className="pt-9 px-5 shrink-0">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onCancel} className="w-9 h-9 rounded-full bg-[#8b5a3c1a] border border-[#8b5a3c33] text-[var(--color-gold)] text-base flex items-center justify-center">←</button>
          <div>
            <div className="text-[14px] text-[var(--color-muted-text)] tracking-[.3em] uppercase font-['Cormorant_Garamond',serif]">Étape {step} / {totalSteps}</div>
            <div className="text-[16px] font-['Playfair_Display',serif] text-[var(--color-cream)] font-normal">{LABELS[step]}</div>
          </div>
        </div>
        <div className="h-[3px] bg-[#8b5a3c1a] rounded-[2px] mb-7 overflow-hidden">
          <div className="h-full rounded-[2px] bg-gradient-to-r from-[var(--color-terra)] to-[var(--color-gold)] transition-all duration-400 ease-out" style={{width:`${(step/totalSteps)*100}%`}}/>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 scrollbar-hide pb-5">
        {step===1&&(
          <div className="animate-[fadeUp_0.4s_ease]">
            <h2 className="text-[26px] font-['Playfair_Display',serif] text-[var(--color-cream)] font-normal mb-2 leading-[1.2]">Quel type de vin<br/>souhaitez-vous ajouter ?</h2>
            <p className="text-[14px] text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic mb-7">Commençons par le commencement.</p>
            <div className="flex flex-col gap-2.5">
              {WINE_TYPES.map((t,i)=>(
                <button key={t.id} onClick={()=>{haptic(30);up("type",t.id);}} 
                        className={`rounded-2xl p-4 flex items-center gap-3.5 opacity-0 animate-[fadeUp_0.3s_ease_both] transition-all duration-200 border ${form.type === t.id ? "bg-[#b8862a1a] border-[rgba(184,134,42,.4)]" : "bg-[#8b5a3c0d] border-[#8b5a3c26]"}`}
                        style={{animationDelay: `${i*0.06}s`}}>
                  <div className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-[22px] border ${form.type === t.id ? "bg-[rgba(184,134,42,.13)] border-[rgba(184,134,42,.33)]" : "bg-[#8b5a3c14] border-[#8b5a3c26]"}`}>{t.emoji}</div>
                  <div className="text-[16px] font-['Playfair_Display',serif] text-[var(--color-cream)] font-normal">{t.label}</div>
                  {form.type===t.id&&<div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-[14px] text-white font-bold" style={{backgroundColor:t.color}}>✓</div>}
                </button>
              ))}
            </div>
          </div>
        )}
        {step===2&&(
          <div className="animate-[fadeUp_0.4s_ease]">
            <h2 className="text-[26px] font-['Playfair_Display',serif] text-[var(--color-cream)] font-normal mb-2 leading-[1.2]">De quel pays<br/>vient ce vin ?</h2>
            <p className="text-[14px] text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic mb-7">Le terroir raconte toujours une histoire.</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(COUNTRIES).map(([country,data])=>(
                <button key={country} onClick={()=>{haptic(20);up("country",country);up("region","");}} 
                        className={`rounded-xl p-2.5 flex items-center gap-2 transition-all duration-200 border ${form.country===country ? "bg-[rgba(184,134,42,.15)] border-[rgba(184,134,42,.5)]" : "bg-[rgba(139,90,60,.05)] border-[rgba(139,90,60,.15)]"}`}>
                  <span className="text-[18px]">{data.flag}</span>
                  <span className={`text-[14px] font-['Cormorant_Garamond',serif] ${form.country===country?"text-[var(--color-gold)] font-semibold":"text-[var(--color-subtext)] font-normal"}`}>{country}</span>
                  {form.country===country&&<span className="ml-auto text-[var(--color-gold)] text-[12px]">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}
        {step===3&&(
          <div className="animate-[fadeUp_0.4s_ease]">
            <h2 className="text-[26px] font-['Playfair_Display',serif] text-[var(--color-cream)] font-normal mb-2 leading-[1.2]">Quelle région ?</h2>
            <div className="inline-flex items-center gap-2 bg-[rgba(184,134,42,.1)] border border-[rgba(184,134,42,.3)] rounded-full px-3.5 py-1.5 mb-5">
              <span className="text-[16px]">{COUNTRIES[form.country]?.flag}</span>
              <span className="text-[14px] text-[var(--color-gold)] font-['Cormorant_Garamond',serif]">{form.country}</span>
            </div>
            <div className="flex flex-col gap-2">
              {COUNTRIES[form.country]?.regions.map(r=>(
                <button key={r} onClick={()=>{haptic(20);up("region",r);}} 
                        className={`rounded-xl p-3 text-left flex justify-between items-center transition-all duration-200 border ${form.region===r ? "bg-[rgba(200,80,58,.12)] border-[rgba(200,80,58,.45)]" : "bg-[rgba(139,90,60,.05)] border-[rgba(139,90,60,.15)]"}`}>
                  <span className={`text-[14px] font-['Cormorant_Garamond',serif] ${form.region===r ? "text-[var(--color-cream)]" : "text-[var(--color-subtext)]"}`}>{r}</span>
                  {form.region===r&&<span className="text-[var(--color-terra)] text-[13px]">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}
        {step===4&&(
          <div className="animate-[fadeUp_0.4s_ease]">
            <h2 className="text-[26px] font-['Playfair_Display',serif] text-[var(--color-cream)] font-normal mb-2 leading-[1.2]">Quelques précisions…</h2>
            <p className="text-[14px] text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic mb-7">Plus vous en dites, mieux je vous connais.</p>
            <div className="mb-4"><label className={lbl}>Millésime</label><input type="number" value={form.year} onChange={e=>up("year",parseInt(e.target.value)||new Date().getFullYear())} min={1900} max={new Date().getFullYear()} className={inp(!!form.year)}/></div>
            <div className="mb-4"><label className={lbl}>Maison / Domaine / Château</label><input type="text" value={form.producer} onChange={e=>up("producer",e.target.value)} placeholder="Ex: Château Margaux, Domaine Leroy…" className={inp(!!form.producer)}/></div>
            <div className="mb-4"><label className={lbl}>Nom du vin <span className="text-[var(--color-muted-text)] font-light">(optionnel)</span></label><input type="text" value={form.name} onChange={e=>up("name",e.target.value)} placeholder="Ex: Cuvée Prestige, Grand Cru…" className={inp(!!form.name)}/></div>
            <div className="mb-4">
              <label className={lbl}>{t("bottles_in_cave")}</label>
              <div className="flex items-center gap-3">
                <button onClick={()=>up("quantity",Math.max(0,form.quantity-1))} className="w-11 h-11 rounded-full bg-[rgba(139,90,60,.1)] border border-[rgba(139,90,60,.2)] text-[var(--color-cream)] text-[22px] flex items-center justify-center font-light cursor-pointer active:scale-95 transition-transform">−</button>
                <div className="flex-1 text-center text-[28px] font-['Playfair_Display',serif] text-[var(--color-cream)]">{form.quantity}</div>
                <button onClick={()=>up("quantity",form.quantity+1)} className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--color-terra)] to-[var(--color-terra-dark)] border-none text-white text-[22px] flex items-center justify-center font-light shadow-lg cursor-pointer active:scale-95 transition-transform">＋</button>
              </div>
              <div className="text-center text-[12px] text-[var(--color-muted-text)] font-['Cormorant_Garamond',serif] italic mt-1.5">0 = déjà bu / plus en stock</div>
            </div>
          </div>
        )}
        {step===5&&(
          <div className="animate-[fadeUp_0.4s_ease]">
            <h2 className="text-[26px] font-['Playfair_Display',serif] text-[var(--color-cream)] font-normal mb-2 leading-[1.2]">L'avez-vous<br/>déjà goûté ?</h2>
            <p className="text-[14px] text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic mb-7">Votre mémoire gustative est précieuse.</p>
            <div className="flex gap-3 mb-6">
              {[{val:true,label:"Oui, je l'ai bu",emoji:"✓",c:"#7b956c"},{val:false,label:"Non, pas encore",emoji:"○",c:"#b8862a"}].map(opt=>(
                <button key={String(opt.val)} onClick={()=>{haptic(40);up("tasted",opt.val);up("storage",!opt.val);}} 
                        className={`flex-1 p-[18px_10px] rounded-2xl flex flex-col items-center gap-2.5 transition-all duration-250 border ${form.tasted===opt.val ? "bg-[#"+opt.c.replace('#','')+"18] border-["+opt.c+"55]" : "bg-[#8b5a3c0d] border-[#8b5a3c26]"}`}>
                  <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center text-[19px] font-bold ${form.tasted===opt.val ? "bg-["+opt.c+"22] text-["+opt.c+"]" : "bg-[#8b5a3c14] text-[var(--color-muted-text)]"}`}>{opt.emoji}</div>
                  <span className={`text-[14px] font-['Cormorant_Garamond',serif] text-center leading-[1.3] ${form.tasted===opt.val ? "text-[var(--color-cream)]" : "text-[var(--color-subtext)]"}`}>{opt.label}</span>
                </button>
              ))}
            </div>
            {form.tasted===true&&(
              <div className="bg-[#c8503a12] border border-[#c8503a33] rounded-2xl p-5 mb-3.5 animate-[fadeUp_0.3s_ease]">
                <div className="text-[10px] text-[var(--color-terra)] tracking-[.22em] uppercase mb-1.5 font-['Cormorant_Garamond',serif] text-center">Votre note sur 5</div>
                <div className="text-[14px] text-[var(--color-muted-text)] font-['Cormorant_Garamond',serif] italic text-center mb-4">0 = à éviter · 5 = expérience absolue</div>
                <StarRating value={form.rating??-1} onChange={v=>{haptic(30);up("rating",v);}} size={32}/>
                {form.rating!==null&&<div className="text-center mt-3 text-[14px] text-[var(--color-cream)] font-['Playfair_Display',serif] italic animate-[fadeIn_0.3s_ease]">{["À éviter 🚫","Décevant 😕","Correct 😐","Bien 🙂","Très bon ⭐","Exceptionnel ✨"][form.rating]}</div>}
                <div className="mt-4">
                  <label className={lbl}>Notes <span className="text-[var(--color-muted-text)] font-light">(optionnel)</span></label>
                  <textarea value={form.notes} onChange={e=>up("notes",e.target.value)} placeholder="Un souvenir, un accord, une émotion…" rows={3} className={`${inp(!!form.notes)} resize-none leading-[1.65] italic`}/>
                </div>
              </div>
            )}
            {form.tasted===false&&(
              <div className="bg-[#b8862a14] border border-[#b8862a38] rounded-2xl p-4 animate-[fadeUp_0.3s_ease]">
                <div className="text-[14px] text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic leading-[1.7] text-center">Ce vin sera stocké dans votre cave.<br/><span className="text-[var(--color-gold)]">Vous pourrez l'évaluer plus tard.</span></div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 p-[16px_20px_32px] bg-gradient-to-t from-[var(--color-bg)] from-35% to-transparent">
        {step<5?(
          <button onClick={()=>{if(canNext()){haptic(40);setStep(s=>s+1);}}} 
                  className={`w-full p-4 border-none rounded-full text-[14px] tracking-[.2em] uppercase font-['Cormorant_Garamond',serif] font-bold transition-all duration-300 ${canNext() ? "bg-gradient-to-br from-[var(--color-terra)] to-[var(--color-terra-dark)] text-white shadow-[0_8px_28px_rgba(200,80,58,.3)] cursor-pointer hover:shadow-lg" : "bg-[#8b5a3c1f] text-[rgba(61,43,26,.3)]"}`}>
            Continuer →
          </button>
        ):(
          <button onClick={handleSave} disabled={form.tasted===null||(form.tasted===true&&form.rating===null)} 
                  className={`w-full p-4 border-none rounded-full text-[14px] tracking-[.2em] uppercase font-['Cormorant_Garamond',serif] font-bold transition-all duration-300 ${(form.tasted!==null&&(form.tasted===false||form.rating!==null)) ? "bg-gradient-to-br from-[var(--color-sauge)] to-[#4a7a2e] text-white shadow-lg cursor-pointer" : "bg-[#8b5a3c1f] text-[rgba(61,43,26,.3)]"}`}>
            ✓ Ajouter à ma cave
          </button>
        )}
      </div>
    </div>
  );
};

export { AddWineForm };
