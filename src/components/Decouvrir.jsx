import React, { useState, useEffect } from "react";
import { C, WINE_TYPES } from "../lib/constants";
import { t } from "../lib/i18n";
import { haptic, typeColor, typeLight, typeEmoji } from "../lib/helpers";
import { callClaude, safeJson } from "../lib/claude";
import { Tag } from "./UI";

// ── FONCTION HELPER (Nécessaire ici car utilisée par le composant) ──
async function fetchVivinoSuggestions(db, opts = {}) {
  const liked    = db.filter(w => w.tasted && w.rating >= 3).map(w => `${w.type} ${w.region}`).join(", ");
  const disliked = db.filter(w => w.tasted && w.rating <= 1).map(w => w.type).join(", ");
  const query    = opts.query || null;

  const prompt = query
    ? `Tu es sommelier expert. Recherche : "${query}".${liked ? ` Goûts : ${liked}.` : ""}
Propose 5 vins réels qui correspondent. JSON strict sans markdown :
[{"name":"Château X","producer":"Domaine Y","type":"rouge","region":"Bordeaux","country":"France","year":2019,"rating":"4.2","ratings_count":"52000","price_range":"25-35€","grapes":"Merlot, Cabernet","description":"2 phrases arômes et style","search_query":"Château X 2019"}]`
    : `Tu es sommelier. Propose 5 vins diversifiés et excellents.${liked ? ` Pour quelqu'un qui aime : ${liked}.` : ""}${disliked ? ` Éviter : ${disliked}.` : ""}
Vins variés (pays, types, prix différents). JSON strict sans markdown :
[{"name":"Château X","producer":"Domaine Y","type":"rouge","region":"Bordeaux","country":"France","year":2019,"rating":"4.2","ratings_count":"52000","price_range":"25-35€","grapes":"Merlot, Cabernet","description":"2 phrases arômes et style","search_query":"Château X 2019"}]`;

  const txt = await callClaude([{ role: "user", content: prompt }], 1200);
  const arr = safeJson(txt, []);
  const wines = Array.isArray(arr) ? arr : (arr.wines || []);

  return wines.map(w => ({
    ...w,
    type: w.type || "autre",
    wine_url: `https://www.wine-searcher.com/find/${encodeURIComponent((w.search_query || (`${w.name} ${w.year || ""}`.trim())).replace(/\s+/g, "+"))}`,
    image: null,
  }));
}

const Decouvrir = ({ db }) => {
  const [mode, setMode] = useState("suggestions");

  // ── Suggestions Vivino ──────────────────────────────────────
  const [vivinoWines, setVivinoWines] = useState(null);
  const [vivinoPhase, setVivinoPhase] = useState("idle");
  const [vivinoMsg, setVivinoMsg] = useState("");
  const [vivinoError, setVivinoError] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (vivinoPhase === "generating" || vivinoPhase === "fetching") {
      const t = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => clearInterval(t);
    }
  }, [vivinoPhase]);

  const loadVivinoSuggestions = async () => {
    setVivinoPhase("generating"); setVivinoError(""); setElapsed(0);
    setVivinoMsg("Le Sommelier compose votre sélection…");
    try {
      const wines = await fetchVivinoSuggestions(db);
      setVivinoWines(wines);
      setVivinoPhase("done");
    } catch (e) {
      setVivinoError(e.message || "Erreur inconnue");
      setVivinoPhase("error");
    }
  };

  // ── Recherche libre ─────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [searchPhase, setSearchPhase] = useState("idle");
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [searchElapsed, setSearchElapsed] = useState(0);

  useEffect(() => {
    if (searchPhase === "searching" || searchPhase === "vivino") {
      const t = setInterval(() => setSearchElapsed(e => e + 1), 1000);
      return () => clearInterval(t);
    }
  }, [searchPhase]);

  const doSearch = async () => {
    if (!query.trim()) return;
    setSearchPhase("searching"); setSearchError(""); setSearchResults(null); setSearchElapsed(0);
    try {
      setSearchPhase("vivino");
      const wines = await fetchVivinoSuggestions(db, { query });
      setSearchResults(wines);
      setSearchPhase("done");
    } catch (e) {
      setSearchError(e.message || "Erreur");
      setSearchPhase("error");
    }
  };

  const VivinoCard = ({ wine, idx }) => {
    const tc = typeColor(wine.type || "rouge");
    const tl = typeLight(wine.type || "rouge");
    return (
      <div style={{ background: C.bgCard, border: `1px solid ${tc}28`, borderRadius: 18, padding: "16px", animation: `fadeUp .4s ease ${idx * .07}s both`, opacity: 0, boxShadow: `0 3px 14px rgba(139,90,60,.07)` }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          {wine.image ? (
            <img src={wine.image} alt={wine.name} style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: `1px solid ${tc}33` }}
              onError={e => { e.target.style.display = "none"; }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0, background: tl, border: `1px solid ${tc}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{typeEmoji(wine.type || "rouge")}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontFamily: "Playfair Display,serif", color: C.cream, fontWeight: 400, lineHeight: 1.3, marginBottom: 3 }}>{wine.name}</div>
            <div style={{ fontSize: 14, color: C.subtext, fontFamily: "Cormorant Garamond,serif" }}>{[wine.producer, wine.year].filter(Boolean).join(" · ")}</div>
          </div>
          {wine.rating && (
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <div style={{ fontSize: 20, fontFamily: "Playfair Display,serif", color: C.gold, fontWeight: 600, lineHeight: 1 }}>{parseFloat(wine.rating).toFixed(1)}</div>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: "Cormorant Garamond,serif", letterSpacing: ".06em" }}>/ 5.0</div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {[WINE_TYPES.find(t => t.id === wine.type)?.label, wine.region, wine.country].filter(Boolean).map(tag => (<Tag key={tag}>{tag}</Tag>))}
        </div>
        <a href={wine.wine_url || `https://www.wine-searcher.com/find/${encodeURIComponent((wine.name + " " + (wine.year || "")).trim().replace(/\s+/g, "+"))}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: `linear-gradient(135deg,rgba(200,80,58,.12),rgba(184,134,42,.08))`,
            border: `1px solid rgba(200,80,58,.3)`, borderRadius: 18, padding: "8px 16px",
            textDecoration: "none", color: C.terra, fontSize: 10, letterSpacing: ".12em",
            textTransform: "uppercase", fontFamily: "Cormorant Garamond,serif", fontWeight: 600
          }}>
          <span style={{ fontSize: 14 }}>🔍</span> Wine-Searcher
        </a>
      </div>
    );
  };

  const LoadingWine = ({ msg, elapsed, phase }) => {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 56, marginBottom: 20, animation: "pulse 1.5s ease-in-out infinite" }}>🍷</div>
        <div style={{ fontSize: 16, fontFamily: "Playfair Display,serif", color: C.cream, marginBottom: 6 }}>{msg}</div>
        <div style={{ fontSize: 14, color: C.muted, fontFamily: "Cormorant Garamond,serif", fontStyle: "italic" }}>{elapsed}s…</div>
      </div>
    );
  };

  const liked = db.filter(w => w.tasted && w.rating >= 4);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 100px" }}>
      <div style={{ display: "flex", background: "rgba(139,90,60,.08)", border: `1px solid rgba(139,90,60,.15)`, borderRadius: 14, padding: 4, gap: 4, marginBottom: 18 }}>
        {[["suggestions", "✦ Découvrir"], ["search", "🔍 Recherche"]].map(([id, l]) => (
          <button key={id} onClick={() => setMode(id)} style={{ flex: 1, padding: "10px", borderRadius: 11, background: mode === id ? `linear-gradient(135deg,${C.terra},${C.terraD})` : "transparent", color: mode === id ? "#fff" : C.subtext, fontSize: 14, letterSpacing: ".06em", fontFamily: "Cormorant Garamond,serif", transition: "all .25s" }}>{l}</button>
        ))}
      </div>

      {mode === "suggestions" && (
        <>
          {vivinoPhase === "idle" && (
            <div style={{ textAlign: "center", padding: "30px 20px" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🍷</div>
              <h2 style={{ fontSize: 22, fontFamily: "Playfair Display,serif", color: C.cream, fontWeight: 400, marginBottom: 8 }}>Découvertes du Jour</h2>
              <button onClick={loadVivinoSuggestions} style={{ background: `linear-gradient(135deg,${C.terra},${C.terraD})`, color: "#fff", border: "none", padding: "16px 32px", borderRadius: 50, fontSize: 14, letterSpacing: ".2em", textTransform: "uppercase", fontFamily: "Cormorant Garamond,serif", fontWeight: 700 }}>
                Voir la sélection →
              </button>
            </div>
          )}
          {(vivinoPhase === "generating" || vivinoPhase === "fetching") && <LoadingWine msg={vivinoMsg} elapsed={elapsed} phase={vivinoPhase} />}
          {vivinoPhase === "done" && vivinoWines && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {vivinoWines.map((w, i) => <VivinoCard key={i} wine={w} idx={i} />)}
            </div>
          )}
        </>
      )}

      {mode === "search" &&

