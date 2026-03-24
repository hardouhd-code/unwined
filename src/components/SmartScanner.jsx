import React, { useState } from "react";
import { C, WINE_TYPES } from "../lib/constants";
import { t } from "../lib/i18n";
import { haptic, typeColor, typeLight, typeEmoji } from "../lib/helpers";
import { callClaude, safeJson } from "../lib/claude";

const SmartScanner = ({ db, onResult, onBack }) => {
  const [phase, setPhase] = useState("idle");
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  const processImage = async (file) => {
    if (!file) return;
    setPhase("scanning");
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new Image();
      img.onload = async () => {
        // 1. Amélioration : Compression plus rapide pour éviter de figer l'interface
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 1000; // Légèrement plus grand pour une meilleure lecture du texte (OCR)
        const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Un ou deux passages maximum suffisent pour l'IA (évite la boucle while bloquante)
        let b64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
        if (b64.length > 600000) {
          b64 = canvas.toDataURL("image/jpeg", 0.4).split(",")[1];
        }

        // 2. Préparation du prompt
        const liked = db.filter(w => w.tasted && w.rating >= 3).map(w => `${w.type} ${w.region} (${w.rating}/5)`).join(", ");
        const disliked = db.filter(w => w.tasted && w.rating <= 1).map(w => `${w.type} ${w.region}`).join(", ");
        
        const prompt = `Tu es le Sommelier Expert d'Unwine-D. Analyse cette image (étiquette ou carte des vins).
${liked ? `Goûts appréciés : ${liked}.` : ""}${disliked ? ` À éviter : ${disliked}.` : ""}
1. Identifie le vin principal (topPick).
2. Suggère 2 vins alternatifs à acheter sur boir.be (marché belge, accessibles et connus).
Réponds UNIQUEMENT en JSON valide, sans markdown :
{"topPick":{"name":"","producer":"","type":"rouge|blanc|rose|mousseux|autre","country":"","region":"","year":2020,"match":85,"why":"2 phrases poétiques","story":"3 phrases terroir","emoji":"🍷","grapes":"","price_range":""},"boirSuggestions":[{"name":"Nom Vin 1","reason":"Pourquoi ce vin ressemble au scanné"},{"name":"Nom Vin 2","reason":"Une alternative accessible en Belgique"}]}`;

        // 3. Appel API
        try {
          const r = await fetch("/api/claude", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "claude-3-5-sonnet-20241022", // <-- Le vrai nom du modèle
              max_tokens: 900,
              messages: [{
                role: "user",
                content: [
                  { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
                  { type: "text", text: prompt }
                ]
              }]
            })
          });

          const d = await r.json();
          if (!r.ok) throw new Error(d.error?.message || `Erreur serveur HTTP ${r.status}`);
          
          const txt = d.content.map(b => b.text || "").join("").replace(/```json|```/g, "").trim();
          const parsedResult = safeJson(txt, {});
          
          // Vérification que l'IA a bien renvoyé les données minimales
          if (!parsedResult || !parsedResult.topPick) {
            throw new Error("L'étiquette n'a pas pu être lue correctement. Veuillez réessayer.");
          }

          setResult(parsedResult);
          setPhase("result");

        } catch (e) {
          console.error("Erreur Scanner:", e);
          setErrMsg(e.message?.slice(0, 120) || "Une erreur inattendue est survenue.");
          setPhase("error");
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // --- RENDU : CHARGEMENT ---
  if (phase === "scanning") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, padding: 32 }}>
        <div style={{ position: "relative", width: 72, height: 72 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid rgba(184,134,42,.2)` }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: C.gold, animation: "spin 1.2s linear infinite" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🔍</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontFamily: "Playfair Display,serif", color: C.cream, marginBottom: 6 }}>{t("analyzing")}</div>
          <div style={{ fontSize: 14, color: C.subtext, fontFamily: "Cormorant Garamond,serif", fontStyle: "italic" }}>Le Sommelier lit l'étiquette...</div>
        </div>
      </div>
    );
  }

  // --- RENDU : ERREUR ---
  if (phase === "error") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ fontSize: 15, fontFamily: "Playfair Display,serif", color: C.cream }}>{errMsg}</div>
        <button onClick={() => setPhase("idle")} style={{ background: `rgba(200,80,58,.12)`, border: `1px solid rgba(200,80,58,.35)`, borderRadius: 22, padding: "11px 26px", color: C.terra, fontSize: 14, fontFamily: "Playfair Display,serif" }}>
          Réessayer
        </button>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 14, fontFamily: "Cormorant Garamond,serif", cursor: "pointer" }}>
          ← Retour
        </button>
      </div>
    );
  }

  // --- RENDU : RÉSULTAT ---
  if (phase === "result" && result) {
    const p = result.topPick || {}; // Sécurité anti-crash
    const tc = typeColor(p.type || "rouge");
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
      <div style={{ minHeight: "100vh", background: C.bg, overflowY: "auto" }}>
        <div style={{ background: `linear-gradient(160deg,${typeLight(p.type)} 0%,transparent 40%)` }}>
          <div style={{ padding: "36px 20px 80px" }}>
            
            {/* Header / Retour */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(139,90,60,.12)", border: `1px solid rgba(139,90,60,.2)`, color: C.accent, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                ←
              </button>
              <span style={{ fontSize: 10, color: C.muted, letterSpacing: ".25em", textTransform: "uppercase", fontFamily: "Cormorant Garamond,serif" }}>
                Étiquette analysée
              </span>
            </div>

            {/* Carte Principale */}
            <div style={{ background: C.bgCard, border: `1px solid ${tc}33`, borderRadius: 22, padding: "22px", marginBottom: 14, boxShadow: `0 4px 24px rgba(139,90,60,.1)` }}>
              <div style={{ fontSize: 14, color: C.gold, letterSpacing: ".3em", textTransform: "uppercase", marginBottom: 12, fontFamily: "Cormorant Garamond,serif", textAlign: "center" }}>Recommandation du Sommelier</div>
              <div style={{ fontSize: 46, textAlign: "center", marginBottom: 12 }}>{p.emoji || typeEmoji(p.type)}</div>
              <h2 style={{ fontSize: 22, fontFamily: "Playfair Display,serif", color: C.cream, fontWeight: 400, textAlign: "center", marginBottom: 4 }}>{p.name}</h2>
              <div style={{ fontSize: 14, color: C.subtext, fontFamily: "Cormorant Garamond,serif", textAlign: "center", marginBottom: 14 }}>{p.producer}</div>
              
              <div style={{ background: "rgba(139,90,60,.06)", borderRadius: 14, padding: "12px", textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 32, fontFamily: "Playfair Display,serif", color: C.gold, fontWeight: 600, lineHeight: 1 }}>{p.match || 50}%</div>
                <div style={{ fontSize: 14, color: C.muted, letterSpacing: ".15em", textTransform: "uppercase", fontFamily: "Cormorant Garamond,serif", marginTop: 2 }}>match avec vos goûts</div>
                <div style={{ height: 3, background: "rgba(139,90,60,.1)", borderRadius: 2, marginTop: 10 }}>
                  <div style={{ height: "100%", width: `${p.match || 50}%`, borderRadius: 2, background: `linear-gradient(90deg,${C.terra},${C.gold})` }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 7, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
                {[WINE_TYPES.find(t => t.id === p.type)?.label, p.region, p.country, p.year && String(p.year)].filter(Boolean).map(tag => (
                  <span key={tag} style={{ fontSize: 14, color: C.subtext, background: "rgba(139,90,60,.07)", border: "1px solid rgba(139,90,60,.15)", borderRadius: 20, padding: "4px 11px", fontFamily: "Cormorant Garamond,serif" }}>
                    {tag}
                  </span>
                ))}
              </div>

              {p.grapes && <div style={{ fontSize: 14, color: C.muted, fontFamily: "Cormorant Garamond,serif", textAlign: "center", marginBottom: 8 }}>🍇 {p.grapes}</div>}
              {p.price_range && <div style={{ fontSize: 14, color: C.gold, fontFamily: "Playfair Display,serif", textAlign: "center", marginBottom: 10, fontWeight: 600 }}>{p.price_range}</div>}
              <p style={{ fontSize: 14, color: C.subtext, fontFamily: "Cormorant Garamond,serif", fontStyle: "italic", lineHeight: 1.8, textAlign: "center" }}>{p.why}</p>
            </div>

            {/* Lien Wine-Searcher */}
            <a href={`https://www.wine-searcher.com/find/${encodeURIComponent(((p.name || "") + " " + (p.year || "")).trim().replace(/\s+/g, "+"))}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "transparent", border: `1px solid rgba(200,80,58,.3)`, borderRadius: 14, padding: "11px 0", marginBottom: 14, textDecoration: "none", color: C.terra, fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", fontFamily: "Cormorant Garamond,serif", fontWeight: 700 }}>
              🔍 Fiche sur Wine-Searcher
            </a>

            {/* Suggestions Boir.be */}
            {(result.boirSuggestions?.length > 0) && (
              <div style={{ background: "rgba(184,134,42,.05)", border: `1px solid rgba(184,134,42,.22)`, borderRadius: 18, padding: "16px", marginBottom: 14, animation: "fadeUp .4s ease .2s both" }}>
                <div style={{ fontSize: 10, color: C.gold, letterSpacing: ".22em", textTransform: "uppercase", fontWeight: 700, fontFamily: "Cormorant Garamond,serif", marginBottom: 12 }}>
                  ✦ Alternatives sur Boir.be
                </div>
                {result.boirSuggestions.map((sug, i) => (
                  <a key={i}
                    href={`https://boir.be/fr/recherche?search_query=${encodeURIComponent((sug.name || "").replace(/\s+/g, "+"))}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 12, background: C.bgCard, padding: "11px 14px", borderRadius: 12, marginBottom: i === 0 ? 8 : 0, textDecoration: "none", border: "1px solid rgba(139,90,60,.1)" }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>🍷</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: C.cream, fontFamily: "Playfair Display,serif", fontWeight: 400, lineHeight: 1.2 }}>{sug.name}</div>
                      <div style={{ fontSize: 12, color: C.muted, fontFamily: "Cormorant Garamond,serif", fontStyle: "italic", marginTop: 2, lineHeight: 1.4 }}>{sug.reason}</div>
                    </div>
                    <span style={{ color: C.gold, fontSize: 14, flexShrink: 0 }}>→</span>
                  </a>
                ))}
              </div>
            )}

            {/* Section Récit */}
            {p.story && (
              <div style={{ background: "rgba(200,80,58,.06)", borderLeft: `3px solid ${C.terra}`, borderRadius: "0 14px 14px 0", padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 14, color: C.terra, letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 8, fontFamily: "Cormorant Garamond,serif" }}>Le Récit</div>
                <p style={{ fontSize: 14, color: C.subtext, fontFamily: "Cormorant Garamond,serif", fontStyle: "italic", lineHeight: 1.85 }}>{p.story}</p>
              </div>
            )}

            {/* Actions */}
            <button onClick={() => { haptic(60); onResult({ id: Date.now(), ...wineObj, tasted: false, storage: true, rating: null, notes: "", addedAt: new Date().toLocaleDateString("fr-FR") }); }} 
                    style={{ width: "100%", background: `linear-gradient(135deg,${C.terra},${C.terraD})`, color: "#fff", border: "none", padding: "16px", borderRadius: 50, fontSize: 14, letterSpacing: ".2em", textTransform: "uppercase", fontFamily: "Cormorant Garamond,serif", fontWeight: 700, marginBottom: 10, boxShadow: `0 8px 28px rgba(200,80,58,.25)`, cursor: "pointer" }}>
              + Ajouter à ma cave
            </button>
            <button onClick={() => setPhase("idle")} 
                    style={{ width: "100%", background: "rgba(139,90,60,.08)", border: `1px solid rgba(139,90,60,.2)`, color: C.muted, padding: "12px", borderRadius: 50, fontSize: 14, letterSpacing: ".15em", textTransform: "uppercase", fontFamily: "Cormorant Garamond,serif", cursor: "pointer" }}>
              ↺ Scanner une autre
            </button>

          </div>
        </div>
      </div>
    );
  }

  // --- RENDU : ACCUEIL (IDLE) ---
  return (
    <div style={{ flex: 1, background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 24px 100px" }}>
      <div style={{ fontSize: 56, marginBottom: 12, animation: "pulse 2s ease-in-out infinite" }}>📸</div>
      <h2 style={{ fontSize: 26, fontFamily: "Playfair Display,serif", color: C.cream, textAlign: "center", marginBottom: 8, fontWeight: 400 }}>{t("scanner_title")}</h2>
      <p style={{ fontSize: 14, color: C.subtext, fontFamily: "Cormorant Garamond,serif", textAlign: "center", marginBottom: 36, lineHeight: 1.7, fontStyle: "italic" }}>
        Scannez une étiquette de bouteille<br />ou une carte des vins au restaurant.
      </p>

      {/* Bouton Appareil Photo */}
      <label style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "26px 22px", background: `rgba(200,80,58,.08)`, border: `2px solid rgba(200,80,58,.3)`, borderRadius: 22, cursor: "pointer" }}>
        <input type="file" accept="image/*" capture="environment" onChange={e => processImage(e.target.files?.[0])} style={{ display: "none" }} />
        <span style={{ fontSize: 30 }}>📷</span>
        <span style={{ fontFamily: "Playfair Display,serif", fontSize: 16, color: C.cream }}>{t("take_photo")}</span>
        <span style={{ fontSize: 14, color: C.muted, fontFamily: "Cormorant Garamond,serif" }}>{t("open_camera")}</span>
      </label>

      {/* Bouton Galerie */}
      <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, padding: "11px 20px", background: "rgba(139,90,60,.06)", border: `1px solid rgba(139,90,60,.18)`, borderRadius: 16, cursor: "pointer" }}>
        <input type="file" accept="image/*" onChange={e => processImage(e.target.files?.[0])} style={{ display: "none" }} />
        <span style={{ fontSize: 17 }}>🖼️</span>
        <span style={{ fontSize: 14, color: C.subtext, fontFamily: "Cormorant Garamond,serif" }}>{t("from_gallery")}</span>
      </label>
    </div>
  );
};

export { SmartScanner };
