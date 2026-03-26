const fs = require('fs');
const path = require('path');
const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Configuration des régions pour éviter les "0 résultats"
const REGIONS_MAP = {
  'Bordeaux': ['pomerol', 'saint-emilion', 'medoc', 'margaux', 'pauillac', 'graves', 'pessac', 'sauternes', 'saint-julien', 'saint-estephe', 'fronsac', 'moulis', 'listrac'],
  'Bourgogne': ['chablis', 'meursault', 'montrachet', 'gevrey', 'pommard', 'volnay', 'nuits-saint-georges', 'beaune', 'macon'],
  'Rhône': ['chateauneuf', 'gigondas', 'hermitage', 'condrieu', 'cote-rotie', 'vacqueyras', 'saint-joseph', 'cornas'],
  'Loire': ['sancerre', 'pouilly-fume', 'chinon', 'saumur', 'vouvray', 'muscadet'],
  'Italie': ['toscana', 'piemonte', 'sicilia', 'veneto', 'barolo', 'chianti', 'brunello']
};

function detectLocation(p) {
  const haystack = (p.title + ' ' + (p.tags || '') + ' ' + (p.vendor || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  let res = { region: 'Autre', country: 'France' };
  
  if (haystack.includes('italie') || haystack.includes('toscana') || haystack.includes('piemonte')) res.country = 'Italie';
  else if (haystack.includes('espagne')) res.country = 'Espagne';
  
  for (const [r, subs] of Object.entries(REGIONS_MAP)) {
    if (subs.some(s => haystack.includes(s)) || haystack.includes(r.toLowerCase())) {
      res.region = r;
      break;
    }
  }
  return res;
}

async function update() {
  let all = []; let page = 1; let more = true;
  while (more) {
    try {
      const res = await fetch(`https://boir.be/collections/all/products.json?limit=250&page=${page}`);
      const data = await res.json();
      if (data.products?.length > 0) { all = [...all, ...data.products]; page++; } else { more = false; }
      await sleep(200);
    } catch(e) { more = false; }
  }
  
  const catalog = all.filter(p => {
    const isAcc = ['bouchon','verre','glas','carafe','sac'].some(k => p.title.toLowerCase().includes(k));
    return p.variants?.some(v => v.available) && !isAcc;
  }).map(p => {
    const loc = detectLocation(p);
    // ON GARDE LES DEUX VERSIONS DE CLÉS POUR LA COMPATIBILITÉ
    return {
      t: p.title, title: p.title,
      p: parseFloat(p.variants[0].price), price: parseFloat(p.variants[0].price),
      v: p.vendor, vendor: p.vendor,
      u: `https://boir.be/fr/products/${p.handle}`, url: `https://boir.be/fr/products/${p.handle}`,
      img: p.images[0]?.src || null, image: p.images[0]?.src || null,
      r: loc.region, region: loc.region,
      c: loc.country, country: loc.country
    };
  });

  const content = `export const BOIR_CATALOG = ${JSON.stringify(catalog, null, 2)};
export function searchBoirLocal(query) {
  if (!query || query.length < 2) return [];
  const term = query.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, "");
  return BOIR_CATALOG.filter(w => {
    const hay = (w.t + " " + w.r + " " + w.c + " " + w.v).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, "");
    return hay.includes(term);
  });
}
// Nouvelle fonction pour Harold
export function getRandomWines(n = 3) {
  return [...BOIR_CATALOG].sort(() => 0.5 - Math.random()).slice(0, n);
}`;

  fs.writeFileSync(CATALOG_PATH, content);
}
update();
