// On ajoute la fonction de pioche aléatoire pour Harold
export function getRandomWines(n = 3) {
  if (!BOIR_CATALOG || BOIR_CATALOG.length === 0) return [];
  return [...BOIR_CATALOG]
    .sort(() => 0.5 - Math.random())
    .slice(0, n)
    .map(w => ({ 
      ...w, 
      title: w.t || w.title, 
      price: w.p || w.price, 
      vendor: w.v || w.vendor, 
      url: w.u || w.url, 
      image: w.img || w.image, 
      region: w.r || w.region, 
      country: w.c || w.country 
    }));
}
