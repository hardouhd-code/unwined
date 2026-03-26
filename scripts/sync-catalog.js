const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const REGIONS_MAP = {
  'Bordeaux': ['pomerol', 'saint-emilion', 'medoc', 'margaux', 'pauillac', 'graves', 'pessac', 'sauternes', 'saint-julien', 'saint-estephe', 'fronsac', 'moulis', 'listrac'],
  'Bourgogne': ['chablis', 'meursault', 'montrachet', 'gevrey', 'pommard', 'volnay', 'nuits-saint-georges', 'beaune', 'macon', 'pouilly-fuisse'],
  'Rhône': ['chateauneuf', 'gigondas', 'hermitage', 'condrieu', 'cote-rotie', 'vacqueyras', 'saint-joseph', 'cornas'],
  'Loire': ['sancerre', 'pouilly-fume', 'chinon', 'saumur', 'vouvray', 'muscadet']
};

const COUNTRY_MAP = {
  'Italie': ['italie', 'toscana', 'piemonte', 'barolo', 'brunello', 'chianti', 'sicilia', 'puglia', 'veneto'],
  'Espagne': ['espagne', 'rioja', 'ribera', 'priorat', 'rías baixas', 'rueda', 'cava', 'jerez'],
  'Portugal': ['portugal', 'douro', 'alentejo', 'porto', 'madeira'],
  'Afrique du Sud': ['afrique du sud', 'stellenbosch', 'paarl', 'swartland'],
  'Argentine': ['argentine', 'mendoza', 'malbec', 'salta'],
  'Chili': ['chili', 'casablanca', 'colchagua', 'maipo'],
  'Allemagne': ['allemagne', 'mosel', 'rheingau', 'pfalz'],
  'Autriche': ['autriche', 'wachau', 'burgenland'],
  'États-Unis': ['etats-unis', 'usa', 'napa', 'sonoma', 'californie'],
  'Grèce': ['grece', 'santorini', 'assyrtiko'],
  'Georgie': ['georgie', 'kakheti', 'saperavi'],
  'Belgique': ['belgique', 'belgie', 'vlaanderen', 'wallonie'],
  'Australie': ['australie', 'barossa', 'hunter valley', 'mclaren'],
  'Nouvelle-Zélande': ['nouvelle-zelande', 'marlborough', 'central otago'],
  'Luxembourg': ['luxembourg'],
  'Norvège': ['norvege']
};

function detectLocation(p) {
  const tagsStr = Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '');
  const haystack = (p.title + ' ' + tagsStr + ' ' + (p.vendor || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let res = { region: 'Autre', country: 'France' };

  for (const [c, keys] of Object.entries(COUNTRY_MAP)) {
    if (keys.some(k => haystack.includes(k))) { res.country = c; break; }
  }
  for (const [r, subs] of Object.entries(REGIONS_MAP)) {
    if (subs.some(s => haystack.includes(s)) || haystack.includes(r.toLowerCase())) {
      res.region = r; 
      if (['Bordeaux','Bourgogne','Rhône','Loire'].includes(r)) res.country = 'France';
      break;
    }
  }
  if (res.region === 'Autre' && haystack.includes('chateau') && !haystack.includes('bourgogne')) {
    res.region = 'Bordeaux'; res.country = 'France';
  }
  return res;
}

async function fetchBoirCatalog() {
  let all = []; let page = 1; let more = true;
  while (more) {
    const res = await fetch(`https://boir.be/collections/all/products.json?limit=250&page=${page}`);
    const data = await res.json();
    if (data.products?.length > 0) { all = [...all, ...data.products]; page++; } else { more = false; }
    await sleep(200);
  }
  return all;
}

async function update() {
  const raw = await fetchBoirCatalog();
  const catalog = raw.filter(p => {
    const n = (p.title || '').toLowerCase();
    const isAcc = ['bouchon','verre','glas','spuwemmer','carafe','stopper','dop','klem','sac','etui'].some(k => n.includes(k));
    return p.variants?.some(v => v.available) && !isAcc;
  }).map(p => {
    const loc = detectLocation(p);
    return {
      t: p.title, p: p.variants[0]?.price ? parseFloat(p.variants[0].price) : 0,
      v: p.vendor || '', u: `https://boir.be/fr/products/${p.handle}`,
      img: p.images[0]?.src || null, r: loc.region, c: loc.country,
      type: (p.title || '').toLowerCase().includes('blanc') ? 'blanc' : 'rouge'
    };
  });

  const searchFn = `export function searchBoirLocal(query, limit = 500) {
    if (!query || query.length < 2) return [];
    const term = query.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    return BOIR_CATALOG.filter(w => {
      const hay = (w.t + " " + w.r + " " + w.c + " " + w.v).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
      return hay.includes(term);
    }).sort((a,b) => (a.r.toLowerCase() === term ? -1 : 0)).slice(0,limit)
    .map(w => ({ ...w, title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, region: w.r, country: w.c }));
  }`;

  fs.writeFileSync(CATALOG_PATH, `export const BOIR_CATALOG = ${JSON.stringify(catalog, null, 2)};\n${searchFn}`);
  console.log(`✅ ${catalog.length} vins synchronisés.`);
}
update().catch(err => { console.error(err); process.exit(1); });
