import React, { useState, useEffect } from "react";
import { C, WINE_TYPES } from "../lib/constants";
import { t } from "../lib/i18n";
import { haptic, typeColor, typeLight, typeEmoji } from "../lib/helpers";
import { callClaude, safeJson } from "../lib/claude";
import { Tag } from "./UI";

// ── HELPER ──
async function fetchVivinoSuggestions(db, opts = {}) {
  const liked = db.filter(w => w.tasted && w.rating >= 3).map(w => `${w.type} ${w.region}`).join(", ");
  const query = opts.query || null;
  const prompt = `Tu es sommelier expert. Propose 5 vins réels ${query ? `pour la recherche "${query}"` : "diversifiés"}. ${liked ? `Il aime : ${liked}` : ""}. Réponds UNIQUEMENT en JSON : [{"name":"","producer":"","type":"rouge|blanc|rose|mousseux","region":"","country":"","year":2022,"rating":"4.0","description":"","search_query":""}]`;
  
  try {
    const txt = await callClaude([{ role: "user", content: prompt }], 1000);
    const arr = safeJson(txt, []);
    return arr.map(w => ({
      ...w,
      wine_url: `https://www.wine-searcher.com/find/${encodeURIComponent((w.search_query || w.name).replace(/\s+/g, "+"))}`
    }));
  } catch (e) { throw e; }
}

const Decouvrir = ({ db }) => {
  const [mode, setMode] = useState("suggestions");
  const [query, setQuery] = useState("");
  const [wines, setWines] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | loading | done | error
  const [error, setError] = useState("");

  const load = async (isSearch = false) => {
    setPhase("loading"); setError(""); setWines(null);
    try {
      const res = await fetchVivinoSuggestions(db, isSearch ? { query } : {});
      setWines(res);
      setPhase("done");
    } catch (e) {
      setError(e.message);
      setPhase("error");
    }
  };

  const VivinoCard = ({ wine, idx }) => {
    const tc = typeColor(wine.type || "rouge");
    const tl = typeLight(wine.type || "rouge");
    return (
      <div style={{ background: C.bgCard, border: `1px solid ${tc}28`, borderRadius: 18, padding: 16, marginBottom: 12, animation: `fadeUp .4s ease ${idx * .07}s both`, opacity: 0 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: tl, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, border: `1px solid ${tc}33` }}>{typeEmoji(wine.type)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontFamily: "Playfair Display, serif", color: C.cream }}>{wine.name}</div>
            <div style={{ fontSize: 13, color: C.subtext }}>{wine.producer} · {wine.year}</div>
          </div>
          {wine.rating && <div style={{ textAlign: "right", color: C.gold, fontSize: 18, fontFamily: "Playfair Display, serif", fontWeight: 600 }}>{wine.rating}</div>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {[wine.region, wine.country].filter(Boolean).map(tag => <Tag key={tag}>{tag}</Tag>)}
        </div>
        <p style={{ fontSize: 13, color: C.subtext, fontStyle: "italic", marginBottom: 12, lineHeight: 1.5 }}>{wine.description}</p>
        <a href={wine.wine_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: C.terra, textTransform: "uppercase", letterSpacing: ".1em", textDecoration: "none", fontWeight: 700, border: `1px solid ${C.terra}44`, padding: "6px 12px", borderRadius: 12 }}>🔍 Wine-Searcher</a>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 100px" }}>
      {/* Toggle */}
      <div style={{ display: "flex", background: "rgba(139,90,60,.08)", borderRadius: 14, padding: 4, gap: 4, marginBottom: 18 }}>
        {["suggestions", "search"].map(m => (
          <button key={m} onClick={() => { setMode(m); setWines(null); setPhase("idle"); }} style={{ flex: 1, padding: 10, borderRadius: 11, border: "none", background: mode === m ? `linear-gradient(135deg,${C.terra},${C.terraD})` : "transparent", color: mode === m ? "#fff" : C.subtext, fontSize: 14 }}>
            {m === "suggestions" ? "✦ Suggestions" : "🔍 Recherche"}
          </button>
        ))}
      </div>

      {mode === "suggestions" && phase === "idle" && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 50, marginBottom: 16 }}>🍷</div>
          <h3 style={{ color: C.cream, fontFamily: "Playfair Display, serif", marginBottom: 20 }}>Découvertes du Jour</h3>
          <button onClick={() => load(false)} style={{ background: `linear-gradient(135deg,${C.terra},${C.terraD})`, color: "#fff", border: "none", padding: "14px 28px", borderRadius: 30, fontWeight: 700 }}>VOIR LA SÉLECTION</button>
        </div>
      )}

      {mode === "search" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ex: Bordeaux, Riesling..." style={{ flex: 1, background: C.bgCard, border: `1px solid rgba(139,90,60,.2)`, borderRadius: 12, padding: "10px 14px", color: C.cream }} />
          <button onClick={() => load(true)} style={{ background: C.terra, color: "#fff", border: "none", borderRadius: 12, padding: "0 16px" }}>→</button>
        </div>
      )}

      {phase === "loading" && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ width: 30, height: 30, border: `3px solid ${C.terra}22`, borderTopColor: C.terra, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ color: C.muted, fontStyle: "italic" }}>Le Sommelier réfléchit...</div>
        </div>
      )}

      {phase === "error" && <div style={{ color: C.terra, textAlign: "center", padding: 20 }}>{error}</div>}

      {wines && wines.map((w, i) => <VivinoCard key={i} wine={w} idx={i} />)}
    </div>
  );
};

export { Decouvrir };
