// On garde tes données (je ne mets ici que le début, garde tes 300+ vins)
export const BOIR_CATALOG = [
  // ... GARDE TOUS TES VINS ICI ...
];

// 1. RECHERCHE SÉCURISÉE (Correction du crash a.r.toLowerCase)
export function searchBoirLocal(query, limit = 500) {
  if (!query || query.length < 2) return [];
  const term = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  return BOIR_CATALOG.filter(w => {
    // Sécurité : on vérifie que les textes existent avant de chercher dedans
    const textT = (w.t || "").toLowerCase();
    const textR = (w.r || "").toLowerCase();
    const textV = (w.v || "").toLowerCase();
    const hay = (textT + " " + textR + " " + textV).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return hay.includes(term);
  })
  .slice(0, limit)
  .map(w => ({ 
    ...w, 
    title: w.t, 
    price: w.p, 
    vendor: w.v, 
    url: w.u, 
    image: w.img, 
    region: w.r, 
    country: w.c 
  }));
}

// 2. FONCTION POUR HAROLD (Si elle manque, l'app reste beige !)
export function getRandomWines(n = 3) {
  if (!BOIR_CATALOG || BOIR_CATALOG.length === 0) return [];
  return [...BOIR_CATALOG]
    .sort(() => 0.5 - Math.random())
    .slice(0, n)
    .map(w => ({ 
      ...w, 
      title: w.t, 
      price: w.p, 
      vendor: w.v, 
      url: w.u, 
      image: w.img, 
      region: w.r, 
      country: w.c 
    }));
}
