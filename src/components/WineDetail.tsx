import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { C, WINE_TYPES, COUNTRIES } from "../lib/constants";
import { t } from "../lib/i18n";
import { haptic, typeColor, typeLight, typeEmoji } from "../lib/helpers";
import { Tag, StarRating } from "./UI";
import html2canvas from "html2canvas";

async function fetchVivinoData(wine: any) {
  const query = [wine.producer, wine.name, wine.region, wine.year].filter(Boolean).join(" ");
  if (!query || query.length < 4) return null;
  try {
    const r = await fetch("/api/vivino", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, country: "BE", limit: 1, minRatings: 10 })
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.wines?.[0] || null;
  } catch {
    return null;
  }
}

const WineDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { db, updateWine, deleteWine } = useStore();
  const wine = db.find((w) => String(w.id) === id);
  const cardRef = useRef<HTMLDivElement>(null);

  const [rating, setRating] = useState(wine?.rating ?? null);
  const [showRate, setShowRate] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [vivino, setVivino] = useState<any>(null);
  const [vivinoLoading, setVivinoLoading] = useState(false);

  useEffect(() => {
    if (!wine) return;
    // Ne pas rappeler Vivino si on a déjà les données enrichies
    if (wine.vivinoRating || wine.grapes) return;
    setVivinoLoading(true);
    fetchVivinoData(wine).then((data) => {
      setVivino(data);
      // Sauvegarder dans le store pour ne pas rappeler à la prochaine ouverture
      if (data) {
        updateWine(wine.id, {
          vivinoRating: data.rating,
          vivinoRatingsCount: data.ratings_count,
          grapes: data.grapes,
          description: data.description,
          vivinoUrl: data.vivino_url,
        });
      }
      setVivinoLoading(false);
    });
  }, [wine?.id]);

  if (!wine) {
    return (
      <div className="py-10 px-5 text-center text-[var(--color-muted-text)] font-['Cormorant_Garamond',serif]">
        Vin introuvable.
        <br /><br />
        <button onClick={() => navigate(-1)} className="text-[var(--color-gold)] bg-transparent border border-[var(--color-gold)] py-2 px-4 rounded-full cursor-pointer">Retour</button>
      </div>
    );
  }

  const tc = typeColor(wine.type);
  const tl = typeLight(wine.type);
  const handleRate = (r: number) => { haptic(50); setRating(r); updateWine(wine.id, { rating: r, tasted: true }); setShowRate(false); };
  const lowThreshold = Number(wine.lowStockThreshold ?? 1);
  const qty = Number(wine.quantity ?? 0);
  const isLow = qty <= lowThreshold;
  const onBack = () => navigate(-1);

  // Données Vivino — depuis le store si déjà chargées, sinon depuis l'état local
  const vivinoRating = wine.vivinoRating || vivino?.rating;
  const vivinoRatingsCount = wine.vivinoRatingsCount || vivino?.ratings_count;
  const grapes = wine.grapes || vivino?.grapes;
  const description = wine.description || vivino?.description;
  const vivinoUrl = wine.vivinoUrl || vivino?.vivino_url;

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      setSharing(true);
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#1c140e",
        scale: 2,
        useCORS: true
      });
      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.9));
      if (!blob) throw new Error("Could not create image");
      const file = new File([blob], "unwined-share.jpg", { type: "image/jpeg" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Mon avis sur ${wine.producer || wine.name}`,
          text: `Découvre ce vin sur Unwine-D !`,
          files: [file]
        });
      } else {
        const link = document.createElement("a");
        link.download = `unwined-${wine.id}.jpg`;
        link.href = canvas.toDataURL("image/jpeg");
        link.click();
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors du partage.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] overflow-y-auto">
      <div className="min-h-screen" style={{ background: `linear-gradient(160deg,${tl} 0%,transparent 40%)` }}>
        <div className="pt-9 px-5 pb-0 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-[38px] h-[38px] rounded-full bg-[#8b5a3c1f] border border-[#8b5a3c33] text-[var(--color-gold)] text-base flex items-center justify-center cursor-pointer">←</button>
            <div className="min-w-0">
              <div className="text-sm text-[var(--color-muted-text)] tracking-[.25em] uppercase font-['Cormorant_Garamond',serif] truncate">{typeEmoji(wine.type)} {WINE_TYPES.find(t => t.id === wine.type)?.label}</div>
              <div className="text-base font-['Playfair_Display',serif] text-[var(--color-cream)] font-normal truncate max-w-[200px]">{wine.producer || wine.name || "Vin sans nom"}</div>
            </div>
          </div>
          <button onClick={handleShare} disabled={sharing} className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[#8b5a3c] text-white flex items-center justify-center cursor-pointer opacity-90 hover:opacity-100 disabled:opacity-50">
            {sharing ? "..." : "📸"}
          </button>
        </div>

        <div className="px-5 pb-20">
          {/* Carte principale */}
          <div ref={cardRef} className="bg-[var(--color-bg-card)] rounded-[22px] p-5.5 mb-3.5 shadow-[0_4px_24px_rgba(139,90,60,.1)]" style={{ border: `1px solid ${tc}33` }}>
            <div className="text-[52px] text-center mb-3.5" style={{ filter: `drop-shadow(0 4px 12px ${tc}44)` }}>{typeEmoji(wine.type)}</div>
            <h2 className="text-[24px] font-['Playfair_Display',serif] text-[var(--color-cream)] font-normal text-center mb-1.5 leading-[1.2]">{wine.producer || "Domaine inconnu"}</h2>
            {wine.name && <div className="text-sm text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic text-center mb-3">{wine.name}</div>}
            <div className="flex gap-2 justify-center flex-wrap">
              {[wine.region && `📍 ${wine.region}`, wine.country && `${COUNTRIES[wine.country]?.flag || "🌍"} ${wine.country}`, wine.year && `📅 ${wine.year}`].filter(Boolean).map(tag => (
                <span key={tag} className="text-sm text-[var(--color-subtext)] bg-[#8b5a3c12] border border-[#8b5a3c26] rounded-full py-1 px-3 font-['Cormorant_Garamond',serif]">{tag}</span>
              ))}
            </div>
          </div>

          {/* Vivino */}
          {vivinoLoading && (
            <div className="bg-[var(--color-bg-card)] border border-[#8b5a3c1f] rounded-[18px] px-5 py-3 mb-3.5 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-transparent border-t-[var(--color-gold)] animate-[spin_1s_linear_infinite]" />
              <span className="text-[12px] text-[var(--color-muted-text)] font-['Cormorant_Garamond',serif] italic">Recherche sur Vivino…</span>
            </div>
          )}
          {(vivinoRating || grapes || description) && (
            <div className="bg-[var(--color-bg-card)] border border-[#8b5a3c1f] rounded-[18px] px-5 py-4 mb-3.5 animate-[fadeUp_0.4s_ease]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] text-[var(--color-gold)] tracking-[.2em] uppercase font-['Cormorant_Garamond',serif]">Vivino</div>
                {vivinoUrl && (
                  <a href={vivinoUrl} target="_blank" rel="noreferrer"
                    className="text-[10px] text-[var(--color-muted-text)] no-underline border border-[#8b5a3c33] rounded-full px-2.5 py-1">
                    Voir sur Vivino →
                  </a>
                )}
              </div>
              {vivinoRating && (
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="text-[28px] font-['Playfair_Display',serif] font-semibold text-[var(--color-gold)]">{vivinoRating}</div>
                  <div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className="text-[14px]" style={{ color: parseFloat(vivinoRating) >= s ? "#e9c176" : "#8b5a3c44" }}>★</span>
                      ))}
                    </div>
                    {vivinoRatingsCount && (
                      <div className="text-[10px] text-[var(--color-muted-text)] mt-0.5">{Number(vivinoRatingsCount).toLocaleString('fr-FR')} avis</div>
                    )}
                  </div>
                </div>
              )}
              {grapes && (
                <div className="text-[13px] text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] mb-2">
                  🍇 {grapes}
                </div>
              )}
              {description && (
                <p className="text-[13px] text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic leading-[1.75]">
                  {description.slice(0, 200)}{description.length > 200 ? "…" : ""}
                </p>
              )}
            </div>
          )}

          {/* Quantité */}
          <div className="bg-[var(--color-bg-card)] border border-[#8b5a3c1f] rounded-[18px] py-4 px-5 mb-3.5 flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] text-[var(--color-muted-text)] tracking-[.2em] uppercase font-['Cormorant_Garamond',serif] mb-2">{t("bottles_in_cave")}</div>
              <div className="flex items-center gap-3">
                <button onClick={() => updateWine(wine.id, { quantity: Math.max(0, (wine.quantity || 0) - 1) })} className="w-[34px] h-[34px] rounded-full bg-[#8b5a3c1a] border border-[#8b5a3c33] text-[var(--color-cream)] text-xl flex items-center justify-center cursor-pointer active:scale-95 transition-transform">−</button>
                <span className="text-[28px] font-['Playfair_Display',serif] text-[var(--color-cream)] min-w-[32px] text-center">{wine.quantity || 0}</span>
                <button onClick={() => updateWine(wine.id, { quantity: (wine.quantity || 0) + 1 })} className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[var(--color-terra)] to-[var(--color-terra-dark)] border-none text-white text-xl flex items-center justify-center cursor-pointer active:scale-95 transition-transform">＋</button>
                <span className="text-[13px] text-[var(--color-muted-text)] font-['Cormorant_Garamond',serif]">{(wine.quantity || 0) > 1 ? t("bottles") : t("bottle")}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-[var(--color-muted-text)] tracking-[.1em] uppercase">Seuil stock bas</span>
                <button onClick={() => updateWine(wine.id, { lowStockThreshold: Math.max(0, lowThreshold - 1) })} className="w-[22px] h-[22px] rounded-full bg-[#8b5a3c1a] border border-[#8b5a3c33] text-[var(--color-cream)] text-sm cursor-pointer active:scale-95 transition-transform">−</button>
                <span className="text-sm text-[var(--color-cream)] min-w-[14px] text-center">{lowThreshold}</span>
                <button onClick={() => updateWine(wine.id, { lowStockThreshold: lowThreshold + 1 })} className="w-[22px] h-[22px] rounded-full bg-[#8b5a3c1a] border border-[#8b5a3c33] text-[var(--color-cream)] text-sm cursor-pointer active:scale-95 transition-transform">+</button>
              </div>
              {isLow && <div className="mt-2 text-xs text-[#ffb68c]">Stock bas: pense à racheter ce vin.</div>}
            </div>
            <button onClick={() => { if (window.confirm(t("confirm_delete"))) { deleteWine(wine.id); navigate(-1); } }} className="bg-transparent border border-[#c8503a40] rounded-full py-2 px-3.5 text-[var(--color-terra)] text-[13px] font-['Cormorant_Garamond',serif] whitespace-nowrap shrink-0 cursor-pointer">🗑 Supprimer</button>
          </div>

          <a href={`https://boir.be/fr/recherche?search_query=${encodeURIComponent((wine.name || wine.producer || "").replace(/\s+/g, "+"))}`}
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 mb-3.5 no-underline bg-[#e9c1761f] border border-[#e9c17659] rounded-full py-2 px-3 text-[var(--color-gold)] text-xs">
            ↗ Racheter sur Boir
          </a>

          {/* Note */}
          <div className="bg-[var(--color-bg-card)] border border-[rgba(139,90,60,.12)] rounded-[18px] p-[18px] mb-[14px] shadow-[0_2px_12px_rgba(139,90,60,.06)]">
            {wine.tasted && rating !== null ? (
              <div className="text-center">
                <div className="text-[10px] text-[var(--color-gold)] tracking-[.22em] uppercase mb-2.5 font-['Cormorant_Garamond',serif]">{t("your_rating")}</div>
                <div className="text-[44px] font-['Playfair_Display',serif] font-semibold leading-none" style={{ color: tc }}>{rating}<span className="text-lg text-[var(--color-muted-text)]">/5</span></div>
                <div className="text-sm text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic mt-1.5">{["À éviter 🚫", "Décevant 😕", "Correct 😐", "Bien 🙂", "Très bon ⭐", "Exceptionnel ✨"][rating]}</div>
                <button onClick={() => setShowRate(true)} className="mt-2.5 bg-transparent text-[#b8862a99] text-[10px] font-['Cormorant_Garamond',serif] tracking-[.1em] underline border-none cursor-pointer">{t("modify_rating")}</button>
              </div>
            ) : wine.tasted && rating === null ? (
              <div>
                <div className="text-[10px] text-[var(--color-gold)] tracking-[.22em] uppercase mb-3.5 font-['Cormorant_Garamond',serif] text-center">{t("rate_wine")}</div>
                <StarRating value={-1} onChange={handleRate} />
              </div>
            ) : (
              <div className="text-center">
                <div className="text-[30px] mb-2">🗄️</div>
                <div className="text-sm text-[var(--color-cream)] font-['Playfair_Display',serif] mb-1.5">En cave</div>
                <div className="text-sm text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic mb-3.5">Stocké pour plus tard</div>
                <button onClick={() => setShowRate(true)} className="bg-gradient-to-br from-[var(--color-terra)] to-[var(--color-terra-dark)] text-white border-none py-2.5 px-5.5 rounded-full text-sm tracking-[.15em] uppercase font-['Cormorant_Garamond',serif] cursor-pointer">Je l'ai goûté !</button>
              </div>
            )}
          </div>

          {wine.story && (
            <div className="bg-[#c8503a0f] border-l-[3px] border-[var(--color-terra)] rounded-r-[14px] p-3.5 mb-3.5">
              <div className="text-[14px] text-[var(--color-terra)] tracking-[.22em] uppercase mb-2 font-['Cormorant_Garamond',serif]">{t("terroir")}</div>
              <p className="text-[14px] text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic leading-[1.85]">{wine.story}</p>
            </div>
          )}
          {wine.anecdote && (
            <div className="bg-[#b8862a12] border border-[#b8862a33] rounded-[14px] p-[13px_15px] mb-3.5">
              <div className="text-[14px] text-[var(--color-gold)] tracking-[.18em] uppercase mb-1.5 font-['Cormorant_Garamond',serif]">✦ Le saviez-vous ?</div>
              <p className="text-[14px] text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] leading-[1.75]">{wine.anecdote}</p>
            </div>
          )}
          {wine.notes && (
            <div className="bg-[var(--color-bg-card)] border border-[rgba(139,90,60,.12)] rounded-[14px] p-[13px_15px]">
              <div className="text-[14px] text-[var(--color-muted-text)] tracking-[.18em] uppercase mb-1.5 font-['Cormorant_Garamond',serif]">Ma note personnelle</div>
              <p className="text-[14px] text-[var(--color-subtext)] font-['Cormorant_Garamond',serif] italic leading-[1.75]">{wine.notes}</p>
            </div>
          )}
        </div>
      </div>

      {showRate && (
        <div className="fixed inset-0 z-[800] flex items-end bg-[rgba(61,43,26,.5)]" onClick={e => { if (e.target === e.currentTarget) setShowRate(false); }}>
          <div className="bg-[var(--color-bg-card)] border border-[#8b5a3c33] rounded-t-[24px] w-full p-[22px_20px_44px] animate-[slideUp_0.3s_ease]">
            <div className="w-8 h-[3px] bg-[#8b5a3c33] rounded-[2px] mx-auto mb-4.5" />
            <div className="text-[10px] text-[var(--color-gold)] tracking-[.22em] uppercase mb-3.5 font-['Cormorant_Garamond',serif] text-center">{t("rate_wine")}</div>
            <StarRating value={rating ?? -1} onChange={handleRate} size={36} />
          </div>
        </div>
      )}
    </div>
  );
};

export { WineDetail };
