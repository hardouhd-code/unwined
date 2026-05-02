import React, { useState, useEffect } from "react";
import { C, WINE_TYPES } from "../lib/constants";
import { t } from "../lib/i18n";
import { haptic, typeColor, typeLight, typeEmoji } from "../lib/helpers";
import { callClaude, safeJson } from "../lib/claude";
import { Tag } from "./UI";
import { searchBoirLocal } from "../lib/boirCatalog";



/* ── SKELETON CARD (pendant le chargement) ── */
const SkeletonCard = ({ delay = 0 }: { delay?: number }) => (
  <div className="bg-[#211a15] rounded-[24px] p-6 mb-4 animate-[fadeUp_0.4s_ease_both] opacity-0 shadow-[0_8px_30px_rgba(139,90,60,.06)]"
       style={{ animationDelay: `${delay}s` }}>
    {[100, 70, 90, 50].map((w, i) => (
      <div key={i} className="rounded-lg mb-3 bg-gradient-to-r from-[#2f251f] via-[#3a2e27] to-[#2f251f] bg-[length:800px_100%] animate-pulse"
           style={{ height: i === 0 ? 18 : 13, width: `${w}%` }} />
    ))}
  </div>
);

/* ── COMPOSANT PRINCIPAL ── */
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router-dom";

const Accueil = () => {
  const { db, userName, setUserName: onSetName } = useStore();
  const navigate = useNavigate();
  const onAdd = () => navigate("/add");
  const onOpenWine = (wine: any) => navigate(`/vin/${wine.id}`);

  const [wines, setWines] = useState<any[] | null>(null);
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [editingName, setEditingName] = useState(!userName);
  const [nameInput, setNameInput] = useState(userName || "");
  const [favoriteCount, setFavoriteCount] = useState(0);
  
  const analytics = React.useMemo(() => {
    const tasted = db.filter((w) => w.tasted);
    const byType = tasted.reduce((acc: any, w) => {
      const k = w.type || "autre";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const topType = Object.entries(byType).sort((a: any, b: any) => b[1] - a[1])[0];
    const repurchase = db.filter((w) => Number(w.quantity ?? 0) === 0 && Number(w.rating ?? 0) >= 4).length;
    const byWine = tasted.reduce((acc: any, w) => {
      const key = (w.name || w.producer || "Vin").trim();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const topWines = Object.entries(byWine).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);
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
  const searchBoir = (query: string) => {
    const results = searchBoirLocal(query).slice(0, 5);
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
    <div className="flex-1 flex flex-col items-center justify-center px-7 pb-[100px] pt-5 text-center">
      {/* Orbe décoratif */}
      <div className="w-[90px] h-[90px] rounded-full mb-7 bg-[radial-gradient(circle_at_35%_35%,var(--color-terra-light),var(--color-terra-dark))] shadow-[0_0_50px_rgba(200,80,58,.3),0_0_80px_rgba(200,80,58,.1)] flex items-center justify-center text-[40px]">🍷</div>

      <div className="text-[10px] text-[var(--color-gold)] tracking-[.35em] uppercase font-bold mb-2.5">
        Bienvenue
      </div>
      <h2 className="text-[30px] font-['Playfair_Display',serif] text-[var(--color-cream)] font-normal m-0 mb-2.5">
        {t("welcome")}
      </h2>
      <p className="text-[15px] text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic mb-9 leading-[1.8]">
        {t("name_q")}
      </p>

      <input
        value={nameInput}
        onChange={e => setNameInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && saveName()}
        placeholder={t("name_placeholder")}
        autoFocus
        className="w-full max-w-[280px] bg-white/70 border-none border-b-[2px] border-b-[#c8503a59] rounded-none px-1 py-3 text-[var(--color-cream)] text-xl font-['Playfair_Display',serif] text-center mb-7 outline-none tracking-[.05em] focus:border-b-[var(--color-terra)] transition-colors"
      />
      <button
        onClick={saveName}
        disabled={!nameInput.trim()}
        className={`bg-gradient-to-br from-[var(--color-terra)] to-[var(--color-terra-dark)] text-white border-none py-[14px] px-10 rounded-full text-[11px] tracking-[.25em] uppercase font-['Cormorant_Garamond',serif] font-bold transition-all duration-200 ${nameInput.trim() ? "opacity-100 shadow-[0_10px_28px_rgba(200,80,58,.3)]" : "opacity-35 shadow-none"}`}>
        Entrer →
      </button>
    </div>
  );

  /* ── VUE PRINCIPALE ── */
  return (
    <div className="flex-1 overflow-y-auto px-4 pt-5 pb-[104px]">

      {/* ── EN-TÊTE ÉDITORIAL ── */}
      <div className="mb-6">
        <div className="text-[10px] text-[var(--color-gold)] tracking-[.32em] uppercase font-bold mb-1.5">
          {greeting}
        </div>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-[32px] font-['Playfair_Display',serif] text-[var(--color-cream)] font-medium m-0 leading-[1.1]">
              {userName}
              <span className="text-[var(--color-terra)] ml-2">✦</span>
            </h2>
            <p className="text-[13px] text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic mt-1.5 leading-[1.6]">
              {db.filter(w => w.tasted).length > 0
                ? t("based_on", db.filter(w => w.tasted).length)
                : t("no_prefs")}
            </p>
          </div>
          <button
            className="text-[10px] text-[var(--color-muted-text)] bg-transparent border border-[rgba(139,90,60,.18)] rounded-full px-3.5 py-1.5 tracking-[.1em] uppercase font-['Cormorant_Garamond',serif] transition-colors duration-200 hover:bg-[#c8503a14]"
            onClick={() => { setEditingName(true); setNameInput(userName); }}
          >
            Changer
          </button>
        </div>
      </div>
      {favoriteCount > 0 && (
        <div className="mb-4.5 bg-[#e9c1761a] border border-[#e9c17640] rounded-[14px] px-3.5 py-3">
          <div className="text-[10px] text-[var(--color-gold)] tracking-[.16em] uppercase font-bold">
            Vos envies
          </div>
          <div className="text-[13px] text-[var(--color-subtext)] mt-1">
            {favoriteCount} vins en favoris dans Decouvrir.
          </div>
        </div>
      )}
      {(analytics.tastedCount > 0 || analytics.repurchase > 0) && (
        <div className="mb-4.5 bg-[rgba(48,40,34,.75)] border border-[rgba(197,160,89,.24)] rounded-[14px] px-3.5 py-3">
          <div className="text-[10px] text-[var(--color-gold)] tracking-[.16em] uppercase font-bold">
            Analytics rapides
          </div>
          <div className="text-[13px] text-[var(--color-subtext)] mt-1">
            {analytics.topType ? `Type le plus bu: ${analytics.topType} (${analytics.topTypeCount})` : "Ajoute des notes pour voir ton profil."}
          </div>
          <div className="text-xs text-[var(--color-muted-text)] mt-1">
            A racheter: {analytics.repurchase} | Vins degustes: {analytics.tastedCount}
          </div>
          {analytics.topWines?.length > 0 && (
            <div className="mt-2">
              {analytics.topWines.map(([name, count]: any, idx: number) => (
                <div key={`${name}-${idx}`} className="text-xs text-[var(--color-subtext)]">
                  {idx + 1}. {name as React.ReactNode} ({count as React.ReactNode})
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Séparateur dégradé */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--color-terra-light)] to-transparent opacity-55 mb-7" />

      {/* ── TITRE SECTION ── */}
      <div className="flex justify-between items-end mb-5">
        <div>
          <h3 className="text-[22px] font-['Playfair_Display',serif] text-[var(--color-cream)] font-normal m-0 mb-1">
            Sélection du jour
          </h3>
          <div className="text-xs text-[var(--color-muted-text)] font-['Cormorant_Garamond',serif] tracking-[.06em]">
            personnalisé pour vous
          </div>
        </div>
        {phase === "done" && (
          <button
            className="flex items-center gap-1.5 bg-[#b8862a14] border border-[#b8862a47] rounded-full px-3.5 py-1.5 text-[13px] text-[var(--color-gold)] font-['Cormorant_Garamond',serif] transition-colors duration-200 hover:bg-[#c8503a14]"
            onClick={() => loadWines(0)}>
            <span className="text-xs">↺</span> Nouvelle sélection
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
        <div className="bg-[#c8503a0d] border border-[#c8503a33] rounded-[20px] p-7 text-center mb-4">
          <div className="text-[13px] text-[var(--color-terra)] font-['Cormorant_Garamond',serif] italic mb-4 leading-[1.7]">
            {error}
          </div>
          <button
            onClick={() => loadWines(0)}
            className="bg-gradient-to-br from-[var(--color-terra)] to-[var(--color-terra-dark)] text-white border-none py-2.5 px-7 rounded-full text-[11px] tracking-[.2em] uppercase font-['Cormorant_Garamond',serif] font-bold">
            Réessayer
          </button>
        </div>
      )}

      {/* ── ÉTATS : IDLE ── */}
      {phase === "idle" && (
        <div className="text-center py-[44px] px-4">
          <div className="w-[72px] h-[72px] rounded-full mx-auto mb-6 bg-[radial-gradient(circle_at_35%_35%,var(--color-terra-light),var(--color-terra-dark))] shadow-[0_8px_30px_rgba(200,80,58,.25)] flex items-center justify-center text-[32px]">🍷</div>
          <button
            onClick={() => loadWines(0)}
            className="bg-gradient-to-br from-[var(--color-terra)] to-[var(--color-terra-dark)] text-white border-none py-[15px] px-[38px] rounded-full text-[11px] tracking-[.25em] uppercase font-['Cormorant_Garamond',serif] font-bold shadow-[0_10px_30px_rgba(200,80,58,.28)]">
            Voir ma sélection →
          </button>
        </div>
      )}

      {/* ── CARTES VINS ── */}
      {phase === "done" && wines && wines.slice(0, 3).map((wine, i) => {
        const tc = typeColor(wine.type || "rouge");
        const tl = typeLight(wine.type || "rouge");

        return (
          <div
            key={i}
            className="bg-[#211a15] rounded-[24px] p-3.5 mb-2.5 shadow-[0_18px_36px_rgba(0,0,0,.35),0_2px_10px_rgba(0,0,0,.25)] border border-[#b8862a33] relative overflow-hidden transition-all duration-[250ms] ease-[cubic-bezier(.34,1.56,.64,1)] hover:-translate-y-[3px] hover:shadow-[0_20px_50px_rgba(139,90,60,.14)] opacity-0 animate-[fadeUp_0.45s_cubic-bezier(.22,1,.36,1)_both]"
            style={{ animationDelay: `${i * .13}s` }}>

            {/* Accent latéral coloré */}
            <div className="absolute left-0 top-[15%] bottom-[15%] w-[3px] rounded-r-sm"
                 style={{ background: `linear-gradient(180deg, ${tc}aa, ${tc}33)` }} />

            {/* En-tête vin */}
            <div className="flex gap-2.5 mb-2.5">
              <div className="w-[42px] h-[42px] rounded-xl shrink-0 flex items-center justify-center text-xl"
                   style={{ background: tl, border: `1px solid ${tc}33` }}>
                {typeEmoji(wine.type || "rouge")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-['Playfair_Display',serif] text-[var(--color-cream)] font-medium leading-[1.2] mb-0.5 line-clamp-2">
                  {wine.name}
                </div>
                <div className="text-xs text-[var(--color-muted-text)] font-['Cormorant_Garamond',serif] italic whitespace-nowrap overflow-hidden text-ellipsis">
                  {wine.producer}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex gap-1.5 flex-wrap mb-2.5">
              {[WINE_TYPES.find(t => t.id === wine.type)?.label, wine.region, wine.country, wine.year]
                .filter(Boolean).slice(0, 3).map(tag => <Tag key={String(tag)} color="var(--color-gold)">{tag}</Tag>)}
            </div>

            {/* CTA boir.be — toujours un lien direct (vins issus du catalogue réel) */}
            <a
              href={wine.boir_url}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-gradient-to-br from-[#b8862a38] to-[#b8862a1f] border border-[#b8862a73] rounded-xl px-3 py-2 no-underline text-[10px] tracking-[.18em] uppercase font-['Cormorant_Garamond',serif] font-bold"
            >
              <span className="flex flex-col items-center gap-0.5">
                <span className="text-[var(--color-gold)]">🍷 Commander sur Boir.be</span>
                {wine.boir_price && <span className="text-xs text-[var(--color-gold)] font-['Playfair_Display',serif] tracking-normal">{wine.boir_price}</span>}
              </span>
            </a>
          </div>
        );
      })}

      {/* ── PROMPT AJOUT SI CAVE VIDE ── */}
      {phase === "done" && db.length === 0 && (
        <div className="bg-[#b8862a0d] border border-[#b8862a2e] rounded-[20px] px-5 py-[22px] mt-1 text-center opacity-0 animate-[fadeUp_0.5s_ease_0.4s_both]">
          <div className="text-[10px] text-[var(--color-gold)] tracking-[.3em] uppercase font-bold mb-2.5">
            Affinez votre profil
          </div>
          <p className="text-sm text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic leading-[1.8] mb-4.5">
            Notez vos vins pour que la sélection épouse vos goûts réels.
          </p>
          <button
            onClick={onAdd}
            className="bg-gradient-to-br from-[var(--color-terra)] to-[var(--color-terra-dark)] text-white border-none py-3 px-7 rounded-[30px] text-[10px] tracking-[.22em] uppercase font-['Cormorant_Garamond',serif] font-bold shadow-[0_8px_22px_rgba(200,80,58,.22)]">
            + Ajouter un vin
          </button>
        </div>
      )}
    </div>
  );
};

export { Accueil };
