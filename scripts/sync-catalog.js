const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// --- LA CARTE DES PARENTS (Pour que "Bordeaux" trouve tout) ---
const REGIONS_DEFINITION = {
  'Bordeaux': ['pomerol', 'saint-emilion', 'medoc', 'margaux', 'pauillac', 'graves', 'pessac', 'sauternes', 'saint-julien', 'saint-estephe', 'fronsac', 'moulis', 'listrac', 'entre-deux-mers', 'bourg', 'blaye', 'castillon'],
  'Bourgogne': ['chablis', 'meursault', 'montrachet', 'gevrey', 'pommard', 'volnay', 'nuits-saint-georges', 'beaune', 'macon', 'pouilly-fuisse', 'mercurey', 'givry', 'bouzeron'],
  'Rhône': ['chateauneuf', 'gigondas', 'hermitage', 'condrieu', 'cote-rotie', 'vacqueyras', 'saint-joseph', 'cornas', 'crozes', 'luberon', 'ventoux'],
  'Loire': ['sancerre', 'pouilly-fume', 'chinon', 'saumur', 'vouvray', 'muscadet'],
  'Italie': ['toscana', 'piemonte', 'barolo', 'brunello', 'chianti', 'sicilia', 'puglia', 'veneto', 'amarene'],
  'Espagne': ['rioja', 'ribera', 'priorat', 'rías baixas']
};

function detectRegion(p) {
  const tagsStr = Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '');
  const haystack = (p.title + ' ' + tagsStr + ' ' + (p.vendor || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // On cherche la sous-appellation précise
  for (const [parent, subs] of Object.entries(REGIONS_DEFINITION)) {
    if (subs.some(sub => haystack.includes(sub))) return parent;
    if (haystack.includes(parent.toLowerCase())) return parent;
  }
  
  if (haystack.includes('chateau') && !haystack.includes('bourgogne')) return 'Bordeaux';
  return 'Autre';
}

async function fetchBoirCatalog() {
  console.log('🍇 Récupération profonde du catalogue...');
  let allProducts = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const url = "https://boir.be/collections/all/products.json?limit=250&page=" + page;
    const res = await fetch(url, { headers: { 'User-Agent': 'Unwine-D/Master' } });
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
      const isAcc = ['bouchon','verre','glas','spuwemmer','carafe','stopper','dop','klem'].some(k => n.includes(k));
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

  // LA RECHERCHE INTELLIGENTE (Injectée dans le fichier final)
  const searchFn = `
export function searchBoirLocal(query, limit = 500) {
  if (!query || query.length < 2) return [];
  const terms = query.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').split(/\\s+/);
  
  return BOIR_CATALOG.map(w => {
    let score = 0;
    const r = (w.r || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
    const t = (w.t || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
    
    terms.forEach(term => {
      // Si on cherche "Bordeaux", on matche TOUS les vins dont la région est Bordeaux
      if (r === term || (term === 'bordeaux' && r === 'bordeaux')) score += 100;
      else if (r.includes(term)) score += 80;
      
      if (t.includes(term)) score += 20;
    });
    return { ...w, score };
  })
  .filter(w => w.score > 0).sort((a, b) => b.score - a.score).slice(0, limit)
  .map(({ score, ...w }) => ({ ...w, title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, region: w.r }));
}`;

  const header = "// Catalogue Unwine-D - " + finalCatalog.length + " vins\n";
  const content = "export const BOIR_CATALOG = " + JSON.stringify(finalCatalog, null, 2) + ";\n";
  
  fs.writeFileSync(CATALOG_PATH, header + content + searchFn, 'utf8');
  console.log('✅ ' + finalCatalog.length + ' vins synchronisés avec succès.');
}

updateCatalog().catch(err => { console.error(err); process.exit(1); });
