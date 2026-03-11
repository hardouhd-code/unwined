import { WINE_TYPES } from "./constants";

export const haptic = (p=50) => { try { if(navigator.vibrate) navigator.vibrate(p); } catch(_) {} };
export const typeColor = (id) => WINE_TYPES.find(t=>t.id===id)?.color || "#B8862A";
export const typeLight = (id) => WINE_TYPES.find(t=>t.id===id)?.light || "rgba(184,134,42,.1)";
export const typeEmoji = (id) => WINE_TYPES.find(t=>t.id===id)?.emoji || "🍷";
