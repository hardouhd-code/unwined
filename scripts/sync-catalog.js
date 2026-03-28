const fs = require('fs');
const path = require('path');
const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Mots-clés à exclure pour ne garder que le vin
const EXCLUDE_KEYWORDS = [
  'thermometer', 'kurkentrekker', 'glas', 'shaker', 'cadeaubon', 
  'ijsemmer', 'karaf', 'label', 'dop', 'gift card', 'jigger', 
  'strainer', 'muddler', 'cadeautas', 'box', 'ade '
];

function detectLocation(p) {
  // Correction de la Regex (suppression du double backslash qui bloquait GitHub)
  const haystack = (p.title + ' ' + (p.tags || '') + ' ' + (p.vendor || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  let res = { region: 'Autre', country: 'France' };
  
  if (haystack.includes('italie') || haystack.includes('toscana') || haystack.includes('piemonte')) res.country = 'Italie';
  else if (haystack.includes('espagne') || haystack.includes('rioja')) res.country = 'Espagne';
  else if (haystack.includes('argentine') || haystack.includes('mendoza')) res.country = 'Argentine';
  else if (haystack.includes('portugal') || haystack.includes('douro')) res.country = 'Portugal';
  
  const regions = ['Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne', 'Provence'];
  for (const r of regions) {
    if (haystack.includes(r.toLowerCase())) { res.region = r; break; }
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
    const title = p.title.toLowerCase();
    const isAvailable = p.variants?.some(v => v.available);
    // On vérifie si le titre contient un mot interdit
    const isAccessory = EXCLUDE_KEYWORDS.some(word => title.includes(word));
    return isAvailable && !isAccessory;
  }).map(p => {
    const loc = detectLocation(p);
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
  return BOIR_CATALOG.filter(w => (w.t + " " + w.v + " " + w.r).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, "").includes(term));
}
export function getRandomWines(n = 3) {
  if (!BOIR_CATALOG || BOIR_CATALOG.length === 0) return [];
  return [...BOIR_CATALOG].sort(() => 0.5 - Math.random()).slice(0, n);
}`;

  fs.writeFileSync(CATALOG_PATH, content);
}
update();
