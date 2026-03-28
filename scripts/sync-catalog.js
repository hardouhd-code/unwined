const fs = require('fs');
const path = require('path');
const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');

const EXCLUDE = ['thermometer', 'kurkentrekker', 'glas', 'shaker', 'cadeaubon', 'ijsemmer', 'karaf', 'label', 'dop', 'gift card', 'jigger', 'strainer', 'muddler', 'cadeautas', 'box', 'ade ', 'spuwemmer'];

function detect(p) {
  const h = (p.title + ' ' + (p.tags || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  let res = { region: 'Autre', country: 'France' };
  if (h.includes('italie') || h.includes('toscana')) res.country = 'Italie';
  else if (h.includes('espagne') || h.includes('rioja')) res.country = 'Espagne';
  
  const RULES = {
    'Bordeaux': ['pomerol', 'saint-emilion', 'medoc', 'margaux', 'pauillac', 'graves', 'pessac', 'sauternes', 'saint-julien', 'saint-estephe', 'bordeaux'],
    'Bourgogne': ['chablis', 'meursault', 'montrachet', 'gevrey', 'pommard', 'volnay', 'nuits-saint-georges', 'beaune', 'macon', 'rully'],
    'Rhône': ['chateauneuf', 'gigondas', 'hermitage', 'condrieu', 'cote-rotie', 'vacqueyras'],
    'Loire': ['sancerre', 'pouilly-fume', 'chinon', 'saumur', 'vouvray']
  };

  for (const [reg, keys] of Object.entries(RULES)) {
    if (keys.some(k => h.includes(k))) { res.region = reg; break; }
  }
  return res;
}

async function update() {
  let all = []; let page = 1;
  while (page < 10) {
    const res = await fetch(`https://boir.be/collections/all/products.json?limit=250&page=${page}`);
    const data = await res.json();
    if (data.products?.length > 0) { all = [...all, ...data.products]; page++; } else break;
  }
  
  const clean = all.filter(p => {
    const t = p.title.toLowerCase();
    return p.variants?.some(v => v.available) && !EXCLUDE.some(w => t.includes(w));
  }).map(p => {
    const loc = detect(p);
    return { t: p.title, p: parseFloat(p.variants[0].price), v: p.vendor, u: `https://boir.be/fr/products/${p.handle}`, img: p.images[0]?.src || "", r: loc.region, c: loc.country };
  });

  const content = `export const BOIR_CATALOG = ${JSON.stringify(clean, null, 2)};
export function searchBoirLocal(query) {
  if (!query || query.length < 2) return [];
  const term = query.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, "");
  return BOIR_CATALOG.filter(w => (w.t + " " + w.r).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, "").includes(term))
    .map(w => ({ ...w, title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, region: w.r, country: w.c }));
}
export function getRandomWines(n = 3) {
  return [...BOIR_CATALOG].sort(() => 0.5 - Math.random()).slice(0, n).map(w => ({ ...w, title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, region: w.r, country: w.c }));
}`;
  fs.writeFileSync(CATALOG_PATH, content);
}
update();
