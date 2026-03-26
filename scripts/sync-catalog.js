const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// On définit les appellations qui font partie de la famille Bordeaux
const BORDEAUX_SUBS = ['saint-emilion', 'pomerol', 'medoc', 'graves', 'pessac', 'margaux', 'pauillac', 'saint-julien', 'saint-estephe', 'sauternes', 'barsac', 'canon-fronsac'];

const KNOWN_REGIONS = [
  'Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne', 'Jura', 'Savoie', 
  'Languedoc-Roussillon', 'Provence', 'Sud-Ouest', 'Beaujolais', 'Corse', 
  'Piémont', 'Toscane', 'Vénétie', 'Rioja', 'Ribera del Duero', 'Porto', 'Douro'
];

function detectRegion(p) {
  const tagsStr = Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '');
  const haystack = (p.title + ' ' + tagsStr).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // On cherche d'abord dans les sous-appellations de Bordeaux
  for (const sub of BORDEAUX_SUBS) {
    if (haystack.includes(sub.replace('-', ' '))) return sub.charAt(0).toUpperCase() + sub.slice(1);
  }

  for (const r of KNOWN_REGIONS) {
    const search = r.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (haystack.includes(search)) return r;
  }
  
  if (haystack.includes('chateau') && !haystack.includes('bourgogne')) return 'Bordeaux';
  return '';
}

async function fetchBoirCatalog() {
  let allProducts = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const url = "https://boir.be/collections/all/products.json?limit=250&page=" + page;
    const res = await fetch(url, { headers: { 'User-Agent': 'Unwine-D/7.0' } });
    const data = await res.json();
    if (data.products && data.products.length > 0) {
      allProducts = [...allProducts, ...data.products];
      page++;
    } else { hasMore = false; }
    await sleep(200);
  }
  return allProducts;
}

async function updateCatalog() {
  const rawProducts = await fetchBoirCatalog();
  const finalCatalog = rawProducts
    .filter(p => {
      const n = (p.title || '').toLowerCase();
      const isAcc = ['bouchon','verre','glas','spuwemmer','carafe','stopper','dop','klem','accessoire'].some(k => n.includes(k));
      return p.variants?.some(v => v.available) && !isAcc;
    })
    .map(p => ({
      t: p.title, 
      p: p.variants[0]?.price ? parseFloat(p.variants[0].price) : 0,
      v: p.vendor || '', 
      u: "https://boir.be/fr/products/" + p.handle,
      img: p.images[0]?.src || null, 
      r: detectRegion(p), 
      type: (p.title || '').toLowerCase().includes('blanc') ? 'blanc' : 'rouge'
    }));

  const searchFn = `
export function searchBoirLocal(query, limit = 100) {
  if (!query || query.length < 2) return [];
  const terms = query.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').split(/\\s+/);
  const bdxSubs = ${JSON.stringify(BORDEAUX_SUBS)};
  
  return BOIR_CATALOG.map(w => {
    let score = 0;
    const r = (w.r || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    const t = (w.t || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    
    terms.forEach(term => {
      // Si on cherche "Bordeaux", on booste aussi les sous-appellations
      const isBdxSub = bdxSubs.some(sub => r.includes(sub.replace('-', ' ')));
      if (term === 'bordeaux' && (r === 'bordeaux' || isBdxSub)) score += 100;
      else if (r.includes(term)) score += 80;
      if (t.includes(term)) score += 20;
    });
    return { ...w, score };
  })
  .filter(w => w.score > 0).sort((a, b) => b.score - a.score).slice(0, limit)
  .map(({ score, ...w }) => ({ title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, region: w.r, type: w.type }));
}`;

  const header = "// Boir.be - " + finalCatalog.length + " vins actifs\n";
  const content = "export const BOIR_CATALOG = " + JSON.stringify(finalCatalog, null, 2) + ";\n";
  fs.writeFileSync(CATALOG_PATH, header + content + searchFn, 'utf8');
  console.log('✅ ' + finalCatalog.length + ' vins synchronisés.');
}

updateCatalog().catch(err => { console.error(err); process.exit(1); });
