import React, { useState, useEffect } from "react";
import { C, WINE_TYPES } from "../lib/constants";
import { t } from "../lib/i18n";
import { haptic, typeColor, typeLight, typeEmoji } from "../lib/helpers";
import { callClaude, safeJson } from "../lib/claude";
import { Tag } from "./UI";
import { searchBoirLocal } from "../lib/boirCatalog";

/* ── MICRO-ANIMATIONS (injectées une seule fois) ── */
const STYLES = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
@keyframes pulse {
  0%,100% { transform: scale(1);   opacity: 1; }
  50%      { transform: scale(1.08); opacity: .75; }
}
@keyframes spinSlow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.wine-card {
  transition: transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease;
}
.wine-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 50px rgba(139,90,60,.14) !important;
}
.btn-ghost {
  transition: background .2s, color .2s, border-color .2s;
}
.btn-ghost:hover {
  background: rgba(200,80,58,.08) !important;
}
`;
if (typeof document !== "undefined" && !document.getElementById("accueil-css")) {
  const s = document.createElement("style");
  s.id = "accueil-css";
  s.textContent = STYLES;
  document.head.appendChild(s);
}

/* ── SKELETON CARD (pendant le chargement) ── */
const SkeletonCard = ({ delay = 0 }) => (
  <div style={{
    background: "#fff",
    borderRadius: 24,
    padding: "24px",
    marginBottom: 16,
    animation: `fadeUp .4s ease ${delay}s both`,
    opacity: 0,
    boxShadow: "0 8px 30px rgba(139,90,60,.06)",
  }}>
    {[100, 70, 90, 50].map((w, i) => (
      <div key={i} style={{
        height: i === 0 ? 18 : 13,
        width: `${w}%`,
        borderRadius: 8,
        marginBottom: 12,
        background: "linear-gradient(90deg, #f0e8df 25%, #e8ddd0 50%, #f0e8df 75%)",
        backgroundSize: "800px 100%",
        animation: "shimmer 1.4s infinite",
      }} />
    ))}
  </div>
);

/* ── COMPOSANT PRINCIPAL ── */
const Accueil = ({ db, userName, onSetName, onAdd, onOpenWine }) => {
  const [wines, setWines] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [editingName, setEditingName] = useState(!userName);
  const [nameInput, setNameInput] = useState(userName || "");
  const [favoriteCount, setFavoriteCount] = useState(0);
  const analytics = React.useMemo(() => {
    const tasted = db.filter((w) => w.tasted);
    const byType = tasted.reduce((acc, w) => {
      const k = w.type || "autre";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
    const repurchase = db.filter((w) => Number(w.quantity ?? 0) === 0 && Number(w.rating ?? 0) >= 4).length;
    const byWine = tasted.reduce((acc, w) => {
      const key = (w.name || w.producer || "Vin").trim();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const topWines = Object.entries(byWine).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      tastedCount: tasted.length,
      topType: topType ? topType[0] : null,
      topTypeCount: topType ? topType[1] : 0,
      repurchase,
      topWines
    };
  }, [db]);

  useEffect(() => {
    if (userName) { setEditingName(false); setNameInput(userName); }
  }, [userName]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("unwined_favorites_boir");
      const parsed = raw ? JSON.parse(raw) : [];
      setFavoriteCount(Array.isArray(parsed) ? parsed.length : 0);
    } catch {
      setFavoriteCount(0);
    }
  }, [phase]);

  const dayKey = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const cacheKey = () => `unwined_selection_${(userName || "guest").toLowerCase()}_${dayKey()}`;

  const readCachedSelection = () => {
    try {
      const raw = localStorage.getItem(cacheKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const writeCachedSelection = (items) => {
    try {
      if (!Array.isArray(items) || items.length === 0) return;
      localStorage.setItem(cacheKey(), JSON.stringify(items));
    } catch {
      // no-op: localStorage peut être indisponible
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("good_morning") : hour < 18 ? t("good_afternoon") : t("good_evening");

  useEffect(() => {
    if (!userName || wines || phase !== "idle") return;

    const cached = readCachedSelection();
    if (cached) {
      setWines(cached);
      setPhase("done");
      // refresh silencieux en arrière-plan pour garder la sélection fraîche
      setTimeout(() => loadWines(), 30);
      return;
    }

    loadWines();
  }, [userName]);

  // Recherche directement dans le catalogue local — zéro appel réseau, zéro blocage
  const searchBoir = (query) => {
    const results = searchBoirLocal(query, 5);
    return results.map(w => ({
      title:  w.title,
      url:    w.url,
      price:  w.price ? `${w.price}€` : null,
      image:  w.image || null,
      vendor: w.vendor || "",
    }));
  };

  const getQueryList = (likedText = "", dislikedText = "") => {
    const likedTokens = likedText.toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
    const dislikedTokens = dislikedText.toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
    const base = [
      "bordeaux", "cotes du rhone", "chablis", "rioja", "barolo", "sancerre",
      "champagne", "bourgogne", "chianti", "priorat", "brunello", "pouilly"
    ];
    const merged = [...likedTokens, ...base]
      .filter(q => !dislikedTokens.some(d => q.includes(d)))
      .filter((q, i, arr) => q && arr.indexOf(q) === i)
      .slice(0, 10);
    return merged.map((query, i) => ({
      query,
      budget: i < 3 ? "budget" : i < 7 ? "milieu" : "prestige"
    }));
  };

  const loadWines = async (attempt = 0) => {
    setPhase("loading"); setError("");
    try {
      const rated    = db.filter(w => w.tasted && w.rating != null);
      const liked    = rated.filter(w => w.rating >= 4).map(w => `${w.type} ${w.region || w.country || ""}`).join(", ");
      const disliked = rated.filter(w => w.rating <= 1).map(w => w.type).join(", ");
      const last5    = db.filter(w => w.tasted).slice(-5).map(w =>
        `${w.name} (${w.type}, note: ${w.rating ?? "?"}/5)`
      ).join("; ");

      // ÉTAPE 1: sélection de requêtes locale (instantanée, sans appel réseau)
      const qList = getQueryList(liked, disliked);

      // ── ÉTAPE 2 : Chercher séquentiellement dans le catalogue local jusqu'à avoir 3 vins ──
      const foundWines = [];
      for (const { query, budget } of qList) {
        if (foundWines.length >= 3) break;
        const results = searchBoir(query);
        const match = results[0] || null;
        if (match) foundWines.push({ ...match, budget });
      }
      if (foundWines.length === 0) throw new Error("Aucun vin trouvé sur Boir.be");

      // ── ÉTAPE 3 : affichage immédiat + enrichissement Claude en arrière-plan ──
      const BUDGET_MAP = { budget: "10–30€", milieu: "30–75€", prestige: "75€+" };
      const instantWines = foundWines.map((w) => ({
        name:        w.title,
        producer:    w.vendor || "",
        type:        "rouge",
        region:      "",
        country:     "",
        grapes:      "",
        description: "",
        why:         "",
        price_range: w.price || BUDGET_MAP[w.budget] || "",
        budget:      w.budget,
        boir_url:    w.url,
        boir_price:  w.price,
        boir_found:  true,
        boir_image:  w.image,
      }));

      setWines(instantWines);
      setPhase("done");
      writeCachedSelection(instantWines);

      const wineList = foundWines.map(w => `${w.title} (${w.price || "?"})`).join(", ");
      const enrichPrompt = `Tu es sommelier expert. Réponds UNIQUEMENT avec un tableau JSON valide, rien d'autre.
Enrichis ces vins réels du catalogue Boir.be avec une description et une recommandation personnalisée :
Vins : ${wineList}
${liked ? `Goûts appréciés : ${liked}.` : ""}
${last5 ? `Derniers vins : ${last5}.` : ""}
Pour chaque vin, donne : type (rouge/blanc/rose/mousseux), region, country, grapes, description (2 phrases), why (raison personnalisée pour ${userName || "cet utilisateur"}).
FORMAT (même ordre que les vins fournis) :
[{"type":"rouge","region":"Bordeaux","country":"France","grapes":"Merlot","description":"...","why":"..."},...]`;

      const enrichTxt  = await callClaude([{ role: "user", content: enrichPrompt }], 800);
      const enrichData = safeJson(enrichTxt, []);

      // ── ÉTAPE 4 : Fusionner données boir.be + enrichissement Claude ──
      const finalWines = foundWines.map((w, i) => {
        const extra = Array.isArray(enrichData) ? (enrichData[i] || {}) : {};
        return {
          name:        w.title,
          producer:    w.vendor || "",
          type:        extra.type    || "rouge",
          region:      extra.region  || "",
          country:     extra.country || "",
          grapes:      extra.grapes  || "",
          description: extra.description || "",
          why:         extra.why     || "",
          price_range: w.price       || BUDGET_MAP[w.budget] || "",
          budget:      w.budget,
          boir_url:    w.url,
          boir_price:  w.price,
          boir_found:  true,
          boir_image:  w.image,
        };
      });

      setWines(finalWines);
      writeCachedSelection(finalWines);
    } catch (e) {
      if ((e.message?.includes("529") || e.message?.includes("overloaded")) && attempt < 2) {
        setTimeout(() => loadWines(attempt + 1), 4000 * (attempt + 1));
        return;
      }
      setError(e.message || "Erreur");
      setPhase("error");
    }
  };

  const saveName = () => {
    if (!nameInput.trim()) return;
    onSetName(nameInput.trim());
    setEditingName(false);
    setPhase("idle");
    setTimeout(loadWines, 100);
  };

  const BUDGET_LABELS  = { budget: "10–30€", milieu: "30–75€", prestige: "75€+" };
  const BUDGET_COLORS  = { budget: C.sauge,  milieu: C.gold,   prestige: C.terra };
  const BUDGET_ICONS   = { budget: "◇", milieu: "◈", prestige: "◆" };

  /* ── ÉCRAN SAISIE NOM ── */
  if (editingName) return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "20px 28px 100px", textAlign: "center",
    }}>
      {/* Orbe décoratif */}
      <div style={{
        width: 90, height: 90, borderRadius: "50%", marginBottom: 28,
        background: `radial-gradient(circle at 35% 35%, ${C.terraL}, ${C.terraD})`,
        boxShadow: `0 0 50px rgba(200,80,58,.3), 0 0 80px rgba(200,80,58,.1)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40,
      }}>🍷</div>

      <div style={{ fontSize: 10, color: C.gold, letterSpacing: ".35em", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
        Bienvenue
      </div>
      <h2 style={{ fontSize: 30, fontFamily: "Playfair Display,serif", color: C.cream, fontWeight: 400, margin: "0 0 10px" }}>
        {t("welcome")}
      </h2>
      <p style={{ fontSize: 15, color: C.subtext, fontFamily: "Cormorant Garamond,serif", fontStyle: "italic", marginBottom: 36, lineHeight: 1.8 }}>
        {t("name_q")}
      </p>

      <input
        value={nameInput}
        onChange={e => setNameInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && saveName()}
        placeholder={t("name_placeholder")}
        autoFocus
        style={{
          width: "100%", maxWidth: 280,
          background: "rgba(255,255,255,.7)",
          border: "none",
          borderBottom: `2px solid rgba(200,80,58,.35)`,
          borderRadius: 0,
          padding: "12px 4px",
          color: C.cream, fontSize: 20,
          fontFamily: "Playfair Display,serif",
          textAlign: "center",
          marginBottom: 28, outline: "none",
          letterSpacing: ".05em",
        }}
      />
      <button
        onClick={saveName}
        disabled={!nameInput.trim()}
        style={{
          background: `linear-gradient(135deg,${C.terra},${C.terraD})`,
          color: "#fff", border: "none",
          padding: "14px 40px", borderRadius: 50,
          fontSize: 11, letterSpacing: ".25em", textTransform: "uppercase",
          fontFamily: "Cormorant Garamond,serif", fontWeight: 700,
          opacity: nameInput.trim() ? 1 : .35,
          boxShadow: nameInput.trim() ? `0 10px 28px rgba(200,80,58,.3)` : "none",
          transition: "opacity .2s, box-shadow .2s",
        }}>
        Entrer →
      </button>
    </div>
  );

  /* ── VUE PRINCIPALE ── */
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 16px 110px" }}>

      {/* ── EN-TÊTE ÉDITORIAL ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: C.gold, letterSpacing: ".32em", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
          {greeting}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontSize: 34, fontFamily: "Playfair Display,serif", color: C.cream, fontWeight: 400, margin: 0, lineHeight: 1.1 }}>
              {userName}
              <span style={{ color: C.terra, marginLeft: 8 }}>✦</span>
            </h2>
            <p style={{ fontSize: 13, color: C.subtext, fontFamily: "Cormorant Garamond,serif", fontStyle: "italic", marginTop: 6, lineHeight: 1.6 }}>
              {db.filter(w => w.tasted).length > 0
                ? t("based_on", db.filter(w => w.tasted).length)
                : t("no_prefs")}
            </p>
          </div>
          <button
            className="btn-ghost"
            onClick={() => { setEditingName(true); setNameInput(userName); }}
            style={{
              fontSize: 10, color: C.muted, background: "none",
              border: "1px solid rgba(139,90,60,.18)", borderRadius: 20,
              padding: "6px 14px", letterSpacing: ".1em", textTransform: "uppercase",
              fontFamily: "Cormorant Garamond,serif",
            }}>
            Changer
          </button>
        </div>
      </div>
      {favoriteCount > 0 && (
        <div style={{ marginBottom: 18, background: "rgba(233,193,118,.1)", border: "1px solid rgba(233,193,118,.25)", borderRadius: 14, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: C.gold, letterSpacing: ".16em", textTransform: "uppercase", fontWeight: 700 }}>
            Vos envies
          </div>
          <div style={{ fontSize: 13, color: C.subtext, marginTop: 4 }}>
            {favoriteCount} vins en favoris dans Decouvrir.
          </div>
        </div>
      )}
      {(analytics.tastedCount > 0 || analytics.repurchase > 0) && (
        <div style={{ marginBottom: 18, background: "rgba(48,40,34,.65)", border: "1px solid rgba(197,160,89,.2)", borderRadius: 14, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: C.gold, letterSpacing: ".16em", textTransform: "uppercase", fontWeight: 700 }}>
            Analytics rapides
          </div>
          <div style={{ fontSize: 13, color: C.subtext, marginTop: 4 }}>
            {analytics.topType ? `Type le plus bu: ${analytics.topType} (${analytics.topTypeCount})` : "Ajoute des notes pour voir ton profil."}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            A racheter: {analytics.repurchase} | Vins degustes: {analytics.tastedCount}
          </div>
          {analytics.topWines?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {analytics.topWines.map(([name, count], idx) => (
                <div key={`${name}-${idx}`} style={{ fontSize: 12, color: C.subtext }}>
                  {idx + 1}. {name} ({count})
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Séparateur dégradé */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.terra}55, transparent)`, marginBottom: 28 }} />

      {/* ── TITRE SECTION ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 22, fontFamily: "Playfair Display,serif", color: C.cream, fontWeight: 400, margin: "0 0 3px" }}>
            Sélection du jour
          </h3>
          <div style={{ fontSize: 12, color: C.muted, fontFamily: "Cormorant Garamond,serif", letterSpacing: ".06em" }}>
            personnalisé pour vous
          </div>
        </div>
        {phase === "done" && (
          <button
            className="btn-ghost"
            onClick={loadWines}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: `rgba(184,134,42,.08)`,
              border: `1px solid rgba(184,134,42,.28)`,
              borderRadius: 20, padding: "7px 14px",
              color: C.gold, fontSize: 13,
              fontFamily: "Cormorant Garamond,serif",
            }}>
            <span style={{ fontSize: 12 }}>↺</span> Nouvelle sélection
          </button>
        )}
      </div>

      {/* ── ÉTATS : LOADING ── */}
      {phase === "loading" && (
        <div>
          {[0, 0.1, 0.2].map((d, i) => <SkeletonCard key={i} delay={d} />)}
        </div>
      )}

      {/* ── ÉTATS : ERROR ── */}
      {phase === "error" && (
        <div style={{
          background: "rgba(200,80,58,.05)", border: "1px solid rgba(200,80,58,.2)",
          borderRadius: 20, padding: "28px 20px", textAlign: "center", marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, color: C.terra, fontFamily: "Cormorant Garamond,serif", fontStyle: "italic", marginBottom: 16, lineHeight: 1.7 }}>
            {error}
          </div>
          <button
            onClick={loadWines}
            style={{
              background: `linear-gradient(135deg,${C.terra},${C.terraD})`,
              color: "#fff", border: "none",
              padding: "11px 28px", borderRadius: 30,
              fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase",
              fontFamily: "Cormorant Garamond,serif", fontWeight: 700,
            }}>
            Réessayer
          </button>
        </div>
      )}

      {/* ── ÉTATS : IDLE ── */}
      {phase === "idle" && (
        <div style={{ textAlign: "center", padding: "44px 16px" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", margin: "0 auto 24px",
            background: `radial-gradient(circle at 35% 35%, ${C.terraL}, ${C.terraD})`,
            boxShadow: `0 8px 30px rgba(200,80,58,.25)`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
          }}>🍷</div>
          <button
            onClick={loadWines}
            style={{
              background: `linear-gradient(135deg,${C.terra},${C.terraD})`,
              color: "#fff", border: "none",
              padding: "15px 38px", borderRadius: 50,
              fontSize: 11, letterSpacing: ".25em", textTransform: "uppercase",
              fontFamily: "Cormorant Garamond,serif", fontWeight: 700,
              boxShadow: `0 10px 30px rgba(200,80,58,.28)`,
            }}>
            Voir ma sélection →
          </button>
        </div>
      )}

      {/* ── CARTES VINS ── */}
      {phase === "done" && wines && wines.map((wine, i) => {
        const tc = typeColor(wine.type || "rouge");
        const tl = typeLight(wine.type || "rouge");
        const budgetColor = BUDGET_COLORS[wine.budget] || C.gold;
        const budgetLabel = BUDGET_LABELS[wine.budget] || wine.price_range || "";
        const budgetIcon  = BUDGET_ICONS[wine.budget] || "◇";

        return (
          <div
            key={i}
            className="wine-card"
            style={{
              background: "#FFFFFF",
              borderRadius: 24,
              padding: "22px 20px",
              marginBottom: 18,
              animation: `fadeUp .45s cubic-bezier(.22,1,.36,1) ${i * .13}s both`,
              opacity: 0,
              boxShadow: "0 8px 32px rgba(139,90,60,.08), 0 2px 8px rgba(139,90,60,.04)",
              border: `1px solid rgba(184,134,42,.1)`,
              position: "relative",
              overflow: "hidden",
            }}>

            {/* Accent latéral coloré */}
            <div style={{
              position: "absolute", left: 0, top: "15%", bottom: "15%",
              width: 3, borderRadius: "0 3px 3px 0",
              background: `linear-gradient(180deg, ${tc}aa, ${tc}33)`,
            }} />

            {/* En-tête vin */}
            <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                background: tl, border: `1px solid ${tc}33`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
              }}>
                {typeEmoji(wine.type || "rouge")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontFamily: "Playfair Display,serif", color: C.cream, fontWeight: 400, lineHeight: 1.2, marginBottom: 3 }}>
                  {wine.name}
                </div>
                <div style={{ fontSize: 13, color: C.subtext, fontFamily: "Cormorant Garamond,serif", fontStyle: "italic" }}>
                  {wine.producer}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {[WINE_TYPES.find(t => t.id === wine.type)?.label, wine.region, wine.country, wine.year]
                .filter(Boolean).map(tag => <Tag key={String(tag)}>{tag}</Tag>)}
              {wine.grapes && <Tag>{wine.grapes.split(",")[0].trim()}</Tag>}
            </div>

            {/* Citation personnalisée */}
            {wine.why && (
              <p style={{
                fontSize: 14, color: C.terra,
                fontFamily: "Cormorant Garamond,serif", fontStyle: "italic",
                lineHeight: 1.75, marginBottom: 8, fontWeight: 600,
                borderLeft: `2px solid ${C.terra}33`, paddingLeft: 14,
              }}>
                "{wine.why}"
              </p>
            )}

            {/* Description */}
            {wine.description && (
              <p style={{ fontSize: 13, color: C.subtext, fontFamily: "Cormorant Garamond,serif", lineHeight: 1.75, marginBottom: 16 }}>
                {wine.description}
              </p>
            )}

            {/* CTA boir.be — toujours un lien direct (vins issus du catalogue réel) */}
            <a
              href={wine.boir_url}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: `linear-gradient(135deg, rgba(184,134,42,.12), rgba(184,134,42,.06))`,
                border: `1px solid rgba(184,134,42,.4)`,
                borderRadius: 14, padding: "11px 14px",
                textDecoration: "none",
                fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase",
                fontFamily: "Cormorant Garamond,serif", fontWeight: 700,
              }}
            >
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ color: C.gold }}>🍷 Commander sur Boir.be</span>
                {wine.boir_price && <span style={{ fontSize: 12, color: C.gold, fontFamily: "Playfair Display,serif", letterSpacing: 0 }}>{wine.boir_price}</span>}
              </span>
            </a>
          </div>
        );
      })}

      {/* ── PROMPT AJOUT SI CAVE VIDE ── */}
      {phase === "done" && db.length === 0 && (
        <div style={{
          background: `rgba(184,134,42,.05)`,
          border: `1px solid rgba(184,134,42,.18)`,
          borderRadius: 20, padding: "22px 20px", marginTop: 4, textAlign: "center",
          animation: "fadeUp .5s ease .4s both", opacity: 0,
        }}>
          <div style={{ fontSize: 10, color: C.gold, letterSpacing: ".3em", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
            Affinez votre profil
          </div>
          <p style={{ fontSize: 14, color: C.subtext, fontFamily: "Cormorant Garamond,serif", fontStyle: "italic", lineHeight: 1.8, marginBottom: 18 }}>
            Notez vos vins pour que la sélection épouse vos goûts réels.
          </p>
          <button
            onClick={onAdd}
            style={{
              background: `linear-gradient(135deg,${C.terra},${C.terraD})`,
              color: "#fff", border: "none",
              padding: "12px 28px", borderRadius: 30,
              fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase",
              fontFamily: "Cormorant Garamond,serif", fontWeight: 700,
              boxShadow: `0 8px 22px rgba(200,80,58,.22)`,
            }}>
            + Ajouter un vin
          </button>
        </div>
      )}
    </div>
  );
};

export { Accueil };
