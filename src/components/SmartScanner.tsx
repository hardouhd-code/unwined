import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { z } from "zod";
import { C, WINE_TYPES } from "../lib/constants";
import { t } from "../lib/i18n";
import { haptic, typeColor, typeLight, typeEmoji } from "../lib/helpers";
import { callClaude, safeJson } from "../lib/claude";
import { Wine } from "../types";

const claudeSchema = z.object({
  topPick: z.object({
    name: z.string().optional(),
    producer: z.string().optional(),
    type: z.enum(["rouge", "blanc", "rose", "mousseux", "autre"]).optional(),
    country: z.string().optional(),
    region: z.string().optional(),
    year: z.number().optional(),
    match: z.number().optional(),
    confidence: z.number().optional(),
    why: z.string().optional(),
    story: z.string().optional(),
    taste_profile: z.object({
      nose: z.string().optional(),
      palate: z.string().optional(),
      finish: z.string().optional(),
      body: z.string().optional(),
      acidity: z.string().optional(),
      tannins: z.string().optional(),
    }).optional(),
    serving: z.object({
      temperature: z.string().optional(),
      pairing: z.string().optional(),
    }).optional(),
    emoji: z.string().optional(),
    grapes: z.string().optional(),
    price_range: z.string().optional(),
  }),
  boirSuggestions: z.array(z.object({
    name: z.string(),
    reason: z.string().optional(),
  })).optional()
});

const SmartScanner = () => {
  const navigate = useNavigate();
  const { db, addWine } = useStore();
  const onResult = (wine: Wine) => { addWine(wine); navigate("/cave"); };
  const onBack = () => navigate(-1);
  const [phase, setPhase] = useState("idle");
  const [result, setResult] = useState<z.infer<typeof claudeSchema> | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const webcamRef = useRef<Webcam>(null);

  const capture = useCallback(() => {
    haptic(50);
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
          processImage(file);
        });
    }
  }, [webcamRef]);

  const processImage = async (file: File | undefined) => {
    if (!file) return;
    setPhase("scanning");
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 1000;
        const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        let b64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
        if (b64.length > 600000) {
          b64 = canvas.toDataURL("image/jpeg", 0.4).split(",")[1];
        }

        const liked = db.filter(w => w.tasted && w.rating >= 3).map(w => `${w.type} ${w.region} (${w.rating}/5)`).join(", ");
        const disliked = db.filter(w => w.tasted && w.rating <= 1).map(w => `${w.type} ${w.region}`).join(", ");
        
        const prompt = `Tu es le Sommelier Expert d'Unwine-D. Analyse cette image (étiquette ou carte des vins).
${liked ? `Goûts appréciés : ${liked}.` : ""}${disliked ? ` À éviter : ${disliked}.` : ""}
1. Identifie le vin principal (topPick).
2. Suggère 2 vins alternatifs à acheter sur boir.be (marché belge, accessibles et connus).
Réponds UNIQUEMENT en JSON valide, sans markdown :
{"topPick":{"name":"","producer":"","type":"rouge|blanc|rose|mousseux|autre","country":"","region":"","year":2020,"match":85,"why":"2 phrases poétiques","story":"3 phrases terroir","taste_profile":{"nose":"arômes au nez","palate":"saveurs en bouche","finish":"finale","body":"leger|moyen|ample","acidity":"faible|moyenne|vive","tannins":"souples|moyens|puissants"},"serving":{"temperature":"ex: 16-18°C","pairing":"accord mets-vin conseillé"},"emoji":"🍷","grapes":"","price_range":""},"boirSuggestions":[{"name":"Nom Vin 1","reason":"Pourquoi ce vin ressemble au scanné"},{"name":"Nom Vin 2","reason":"Une alternative accessible en Belgique"}]}`;

        const callClaudeVision = async (promptText) => {
          const r = await fetch("/api/claude", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 900,
              messages: [{
                role: "user",
                content: [
                  { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
                  { type: "text", text: promptText }
                ]
              }]
            })
          });
          const d = await r.json();
          if (!r.ok) throw new Error((typeof d.error === "string" && d.error) || d.error?.message || `Erreur serveur HTTP ${r.status}`);
          const txt = d.content.map(b => b.text || "").join("").replace(/```json|```/g, "").trim();
          return safeJson(txt, {});
        };

        try {
          let parsedResult = await callClaudeVision(prompt);
          if (!parsedResult?.topPick?.name || !parsedResult?.topPick?.taste_profile) {
            const fallbackPrompt = `${prompt}\n\nIMPORTANT: Si incertain, propose des valeurs plausibles et complete taste_profile + serving.`;
            parsedResult = await callClaudeVision(fallbackPrompt);
          }
          
          let validatedData;
          try {
            validatedData = claudeSchema.parse(parsedResult);
          } catch (zodError) {
            console.error("Zod Validation Error:", zodError);
            throw new Error("Impossible d'extraire les données du vin avec précision. Veuillez réessayer.", { cause: zodError });
          }

          if (!validatedData || !validatedData.topPick) {
            throw new Error("L'étiquette n'a pas pu être lue correctement. Veuillez réessayer.");
          }

          const withConfidence = {
            ...validatedData,
            topPick: {
              ...(validatedData.topPick || {}),
              confidence: validatedData?.topPick?.confidence ?? Math.max(55, Math.min(98, Number(validatedData?.topPick?.match || 70))),
            }
          };
          setResult(withConfidence as z.infer<typeof claudeSchema>);
          setPhase("result");

        } catch (e: any) {
          console.error("Erreur Scanner:", e);
          setErrMsg(e.message?.slice(0, 120) || "Une erreur inattendue est survenue.");
          setPhase("error");
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- RENDU : CHARGEMENT ---
  if (phase === "scanning") {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center gap-5.5 p-8">
        <div className="relative w-[72px] h-[72px]">
          <div className="absolute inset-0 rounded-full border-2 border-[rgba(184,134,42,.2)]" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--color-gold)] animate-[spin_1.2s_linear_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center text-[26px]">🔍</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-['Playfair_Display',serif] text-[var(--color-cream)] mb-1.5">{t("analyzing")}</div>
          <div className="text-sm text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic">Le Sommelier lit l'étiquette...</div>
        </div>
      </div>
    );
  }

  // --- RENDU : ERREUR ---
  if (phase === "error") {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center gap-4.5 p-8 text-center">
        <div className="text-[48px]">⚠️</div>
        <div className="text-[15px] font-['Playfair_Display',serif] text-[var(--color-cream)]">{errMsg}</div>
        <button onClick={() => setPhase("idle")} className="bg-[#c8503a1f] border border-[#c8503a59] rounded-[22px] py-2.5 px-6.5 text-[var(--color-terra)] text-sm font-['Playfair_Display',serif]">
          Réessayer
        </button>
        <button onClick={onBack} className="bg-transparent border-none text-[var(--color-muted-text)] text-sm font-['Cormorant_Garamond',serif] cursor-pointer">
          ← Retour
        </button>
      </div>
    );
  }

  // --- RENDU : RÉSULTAT ---
  if (phase === "result" && result) {
    const p = result.topPick || {};
    const tc = typeColor(p.type || "rouge");
    const taste = p.taste_profile || {};
    const serving = p.serving || {};
    const wineObj = {
      type: p.type || "rouge",
      country: p.country || "",
      region: p.region || "",
      year: p.year || new Date().getFullYear(),
      producer: p.producer || "",
      name: p.name || "Vin Inconnu",
      story: p.story || "",
      anecdote: ""
    };

    return (
      <div className="min-h-screen bg-[var(--color-bg)] overflow-y-auto">
        <div style={{ background: `linear-gradient(160deg,${typeLight(p.type)} 0%,transparent 40%)` }}>
          <div className="px-5 pt-9 pb-20">
            
            <div className="flex items-center gap-3 mb-5.5">
              <button onClick={onBack} className="w-[38px] h-[38px] rounded-full bg-[#8b5a3c1f] border border-[#8b5a3c33] text-[var(--color-gold)] text-base flex items-center justify-center cursor-pointer">
                ←
              </button>
              <span className="text-[10px] text-[var(--color-muted-text)] tracking-[.25em] uppercase font-['Cormorant_Garamond',serif]">
                Étiquette analysée
              </span>
            </div>

            <div className="bg-[var(--color-bg-card)] rounded-[22px] p-5.5 mb-3.5 shadow-[0_4px_24px_rgba(139,90,60,.1)]" style={{ border: `1px solid ${tc}33` }}>
              <div className="text-sm text-[var(--color-gold)] tracking-[.3em] uppercase mb-3 font-['Cormorant_Garamond',serif] text-center">Recommandation du Sommelier</div>
              <div className="text-[46px] text-center mb-3">{p.emoji || typeEmoji(p.type)}</div>
              <h2 className="text-[22px] font-['Playfair_Display',serif] text-[var(--color-cream)] font-normal text-center mb-1">{p.name}</h2>
              <div className="text-sm text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] text-center mb-3.5">{p.producer}</div>
              
              <div className="bg-[#8b5a3c0f] rounded-2xl p-3 text-center mb-3.5">
                <div className="text-[32px] font-['Playfair_Display',serif] text-[var(--color-gold)] font-semibold leading-none">{p.match || 50}%</div>
                <div className="text-sm text-[var(--color-muted-text)] tracking-[.15em] uppercase font-['Cormorant_Garamond',serif] mt-0.5">match avec vos goûts</div>
                <div className="h-[3px] bg-[#8b5a3c1a] rounded-[2px] mt-2.5">
                  <div className="h-full rounded-[2px] bg-gradient-to-r from-[var(--color-terra)] to-[var(--color-gold)]" style={{ width: `${p.match || 50}%` }} />
                </div>
                {p.confidence && (
                  <div className="text-xs text-[var(--color-muted-text)] mt-2">
                    Confiance de lecture: {p.confidence}%
                  </div>
                )}
              </div>

              <div className="flex gap-1.5 justify-center flex-wrap mb-3">
                {[WINE_TYPES.find(t => t.id === p.type)?.label, p.region, p.country, p.year && String(p.year)].filter(Boolean).map(tag => (
                  <span key={tag} className="text-[14px] text-[var(--color-subtext)] bg-[#8b5a3c12] border border-[#8b5a3c26] rounded-full px-3 py-1 font-['Cormorant_Garamond',serif]">
                    {tag}
                  </span>
                ))}
              </div>

              {p.grapes && <div className="text-[14px] text-[var(--color-muted-text)] font-['Cormorant_Garamond',serif] text-center mb-2">🍇 {p.grapes}</div>}
              {p.price_range && <div className="text-[14px] text-[var(--color-gold)] font-['Playfair_Display',serif] text-center mb-2.5 font-semibold">{p.price_range}</div>}
              <p className="text-[14px] text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic leading-[1.8] text-center">{p.why}</p>
            </div>

            <a href={`https://www.wine-searcher.com/find/${encodeURIComponent(((p.name || "") + " " + (p.year || "")).trim().replace(/\s+/g, "+"))}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-transparent border border-[#c8503a4d] rounded-2xl py-2.5 mb-3.5 no-underline text-[var(--color-terra)] text-[10px] tracking-[.22em] uppercase font-['Cormorant_Garamond',serif] font-bold">
              🔍 Fiche sur Wine-Searcher
            </a>

            {(result.boirSuggestions?.length > 0) && (
              <div className="bg-[#b8862a0d] border border-[#b8862a38] rounded-2xl p-4 mb-3.5 animate-[fadeUp_0.4s_ease_0.2s_both]">
                <div className="text-[10px] text-[var(--color-gold)] tracking-[.22em] uppercase font-bold font-['Cormorant_Garamond',serif] mb-3">
                  ✦ Alternatives sur Boir.be
                </div>
                {result.boirSuggestions.map((sug, i) => (
                  <a key={i}
                    href={`https://boir.be/fr/recherche?search_query=${encodeURIComponent((sug.name || "").replace(/\s+/g, "+"))}`}
                    target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-3 bg-[var(--color-bg-card)] px-3.5 py-2.5 rounded-xl no-underline border border-[#8b5a3c1a] ${i === 0 ? "mb-2" : "mb-0"}`}>
                    <span className="text-xl shrink-0">🍷</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[var(--color-cream)] font-['Playfair_Display',serif] font-normal leading-[1.2]">{sug.name}</div>
                      <div className="text-xs text-[var(--color-muted-text)] font-['Cormorant_Garamond',serif] italic mt-0.5 leading-[1.4]">{sug.reason}</div>
                    </div>
                    <span className="text-[var(--color-gold)] text-sm shrink-0">→</span>
                  </a>
                ))}
              </div>
            )}

            {p.story && (
              <div className="bg-[#c8503a0f] border-l-2 border-l-[var(--color-terra)] rounded-r-2xl py-3.5 px-4 mb-3.5">
                <div className="text-[14px] text-[var(--color-terra)] tracking-[.2em] uppercase mb-2 font-['Cormorant_Garamond',serif]">Le Récit</div>
                <p className="text-[14px] text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic leading-[1.85]">{p.story}</p>
              </div>
            )}

            {(taste.nose || taste.palate || taste.finish || taste.body || taste.acidity || taste.tannins) && (
              <div className="bg-[#e9c17614] border border-[#e9c17640] rounded-[14px] px-4 py-3.5 mb-3.5">
                <div className="text-[13px] text-[var(--color-gold)] tracking-[.18em] uppercase mb-2 font-['Cormorant_Garamond',serif]">
                  Profil de goût
                </div>
                {taste.nose && <p className="text-[13px] text-[var(--color-subtext)] mb-1"><strong>Nez:</strong> {taste.nose}</p>}
                {taste.palate && <p className="text-[13px] text-[var(--color-subtext)] mb-1"><strong>Bouche:</strong> {taste.palate}</p>}
                {taste.finish && <p className="text-[13px] text-[var(--color-subtext)] mb-1"><strong>Finale:</strong> {taste.finish}</p>}
                <div className="flex gap-1.5 flex-wrap mt-1.5">
                  {taste.body && <span className="text-[11px] text-[var(--color-muted-text)] bg-[rgba(48,40,34,.7)] rounded-xl py-[3px] px-2">Corps: {taste.body}</span>}
                  {taste.acidity && <span className="text-[11px] text-[var(--color-muted-text)] bg-[rgba(48,40,34,.7)] rounded-xl py-[3px] px-2">Acidité: {taste.acidity}</span>}
                  {taste.tannins && <span className="text-[11px] text-[var(--color-muted-text)] bg-[rgba(48,40,34,.7)] rounded-xl py-[3px] px-2">Tanins: {taste.tannins}</span>}
                </div>
                {(serving.temperature || serving.pairing) && (
                  <div className="mt-2.5 pt-2 border-t border-t-[#e9c17633]">
                    {serving.temperature && <p className="text-[12px] text-[var(--color-subtext)] mb-1"><strong>Service:</strong> {serving.temperature}</p>}
                    {serving.pairing && <p className="text-[12px] text-[var(--color-subtext)]"><strong>Accord:</strong> {serving.pairing}</p>}
                  </div>
                )}
              </div>
            )}

            <button onClick={() => { haptic(60); onResult({ id: String(Date.now()), ...wineObj, tasted: false, storage: true, rating: null, notes: "", addedAt: new Date().toLocaleDateString("fr-FR"), quantity: 1, lowStockThreshold: 1, type: wineObj.type as any }); }} 
                    className="w-full bg-gradient-to-br from-[var(--color-terra)] to-[var(--color-terra-dark)] text-white border-none p-4 rounded-full text-[14px] tracking-[.2em] uppercase font-['Cormorant_Garamond',serif] font-bold mb-2.5 shadow-[0_8px_28px_rgba(200,80,58,.25)] cursor-pointer hover:shadow-lg transition-shadow">
              + Ajouter à ma cave
            </button>
            <button onClick={() => setPhase("idle")} 
                    className="w-full bg-[#8b5a3c14] border border-[#8b5a3c33] text-[var(--color-muted-text)] p-3 rounded-full text-sm tracking-[.15em] uppercase font-['Cormorant_Garamond',serif] cursor-pointer hover:bg-[#8b5a3c1a] transition-colors">
              ↺ Scanner une autre
            </button>

          </div>
        </div>
      </div>
    );
  }

  // --- RENDU : ACCUEIL (IDLE) ---
  return (
    <div className="flex-1 relative bg-[#25160e] overflow-hidden h-[100dvh]">
      <div className="absolute inset-0 bg-black">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "environment" }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-[rgba(37,22,14,.42)] pointer-events-none" />

      {/* pb-[100px] pour laisser de la place au-dessus de la navbar */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full pt-[60px] px-6 pb-[100px]">
        <div className="text-center">
          <span className="text-[11px] text-[rgba(255,248,241,.8)] tracking-[.2em] uppercase font-bold font-['Manrope',sans-serif]">
            Vision API Active
          </span>
          <h2 className="text-[30px] mt-2 font-['Noto_Serif',serif] text-[#fff8f1] font-bold tracking-[.03em]">
            SCANNER
          </h2>
        </div>

        <div className="relative w-[75vw] max-w-[320px] aspect-[3/4] rounded-[26px] overflow-hidden shadow-[0_0_100px_rgba(37,22,14,.5)]">
          <div className="absolute inset-0 border border-[rgba(119,90,25,.45)] rounded-[26px]" />
          <div className="absolute top-0 left-0 w-12 h-12 border-t-[2px] border-l-[2px] border-[#775a19] rounded-tl-[26px]" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-[2px] border-r-[2px] border-[#775a19] rounded-tr-[26px]" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[2px] border-l-[2px] border-[#775a19] rounded-bl-[26px]" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[2px] border-r-[2px] border-[#775a19] rounded-br-[26px]" />
          <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#775a19] to-transparent shadow-[0_0_15px_#775a19] animate-[pulse_2s_ease-in-out_infinite]" />
        </div>

        <div className="w-full max-w-[320px]">
          <p className="text-sm text-[rgba(255,248,241,.92)] text-center mb-4.5 font-['Manrope',sans-serif]">
            Cadrez l'etiquette pour identifier le vin
          </p>
          <div className="flex items-center justify-between mb-3">
            <button type="button" className="w-12 h-12 rounded-full border-none bg-[rgba(60,42,33,.3)] text-[#fff8f1] flex items-center justify-center backdrop-blur-sm cursor-pointer">
              <span className="text-xl">⚡</span>
            </button>

            <button onClick={capture} className="relative w-20 h-20 rounded-full flex items-center justify-center cursor-pointer bg-transparent border-none">
              <span className="absolute inset-0 rounded-full border-[4px] border-[rgba(119,90,25,.6)]" />
              <span className="w-16 h-16 rounded-full bg-[#775a19] shadow-[0_0_20px_rgba(119,90,25,.6)] flex items-center justify-center active:scale-90 transition-transform">
                <span className="w-14 h-14 rounded-full border border-[rgba(255,255,255,.3)]" />
              </span>
            </button>

            <button type="button" className="w-12 h-12 rounded-full border-none bg-[rgba(60,42,33,.3)] text-[#fff8f1] flex items-center justify-center backdrop-blur-sm cursor-pointer">
              <span className="text-lg">🔄</span>
            </button>
          </div>

          <label className="flex justify-center cursor-pointer">
            <input type="file" accept="image/*" onChange={e => processImage(e.target.files?.[0])} className="hidden" />
            <span className="text-xs text-[rgba(255,248,241,.85)] tracking-[.12em] uppercase font-['Manrope',sans-serif]">
              Importer depuis la galerie
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export { SmartScanner };
