const fs = require('fs');
const path = require('path');
const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// On ajoute 'spuwemmer' et 'ade' pour supprimer les accessoires
const EXCLUDE_KEYWORDS = [
  'thermometer', 'kurkentrekker', 'glas', 'shaker', 'cadeaubon', 
  'ijsemmer', 'karaf', 'label', 'dop', 'gift card', 'jigger', 
  'strainer', 'muddler', 'cadeautas', 'box', 'ade ', 'spuwemmer'
];

function detectLocation(p) {
  // IMPORTANT : On ne cherche QUE dans le titre et les tags, PAS dans le vendeur (vendor)
  const haystack = (p.title + ' ' + (p.tags || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  
  let res = { region: 'Autre', country: 'France' };
  
  if (haystack.includes('italie') || haystack.includes('toscana')) res.country = 'Italie';
  else if (haystack.includes('espagne') || haystack.includes('rioja')) res.country = 'Espagne';
  
  // Règles strictes pour les régions de Bordeaux
  const REGIONS_RULES = {
    'Bordeaux': ['pomerol', 'saint-emilion', 'medoc', 'margaux', 'pauillac', 'graves', 'pessac', 'sauternes', 'saint-julien', 'saint-estephe', 'bordeaux'],
    'Bourgogne': ['chablis', 'meursault', 'montrachet', 'gevrey', 'pommard', 'volnay', 'nuits-saint-georges', 'beaune', 'macon', 'rully', 'chassagne'],
    'Rhône': ['chateauneuf', 'gigondas', 'hermitage', 'condrieu', 'cote-rotie', 'vacqueyras', 'rasteau', 'lirac'],
    'Loire': ['sancerre', 'pouilly-fume', 'chinon', 'saumur', 'vouvray', 'muscadet', 'reuilly']
  };

  for (const [region, keywords] of Object.entries(REGIONS_RULES)) {
    if (keywords.some(k => haystack.includes(k))) {
      res.region = region;
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
    const t = p.title.toLowerCase();
    const isAvailable = p.variants?.some(v => v.available);
    const isAccessory = EXCLUDE_KEYWORDS.some(word => t.includes(word));
    return isAvailable && !isAccessory;
  }).map(p => {
    const loc = detectLocation(p);
    return {
      t: p.title, p: parseFloat(p.variants[0].price), v: p.vendor,
      u: `https://boir.be/fr/products/${p.handle}`, img: p.images[0]?.src || null,
      r: loc.region, c: loc.country
    };
  });

  const content = `export const BOIR_CATALOG = ${JSON.stringify(catalog, null, 2)};
export function searchBoirLocal(query) {
  if (!query || query.length < 2) return [];
  const term = query.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, "");
  return BOIR_CATALOG.filter(w => (w.t + " " + w.r).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, "").includes(term))
    .map(w => ({ ...w, title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, region: w.r, country: w.c }));
}
export function getRandomWines(n = 3) {
  return [...BOIR_CATALOG].sort(() => 0.5 - Math.random()).slice(0, n)
    .map(w => ({ ...w, title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, region: w.r, country: w.c }));
}`;

  fs.writeFileSync(CATALOG_PATH, content);
}
update();
