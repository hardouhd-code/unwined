// Boir.be catalog — auto-generated 2026-03-13T11:40:19.022Z
// 0 vins en stock
// Ne pas modifier manuellement — fichier géré par scripts/sync-catalog.js
export const BOIR_CATALOG = [];

export function searchBoirLocal(query, limit = 5) {
  if (!query || query.length < 2) return [];
  const terms = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 1);
  return BOIR_CATALOG
    .map(w => {
      const hay = [w.t, w.c, w.grapes, w.aromas, w.type]
        .join(' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const score = terms.reduce((s, t) => s + (hay.includes(t) ? 2 : 0), 0);
      return { ...w, score };
    })
    .filter(w => w.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score, ...w }) => ({
      title: w.t,
      year: w.y,
      price: w.p,
      vendor: w.v,
      url: w.u,
      image: w.img,
      country: w.c,
      type: w.type,
      grapes: w.grapes,
      aromas: w.aromas,
      pairings: w.pairings,
      service: w.service,
      aging: w.aging,
      profile: w.profile
    }));
}
