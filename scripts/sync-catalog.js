const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// --- DICTIONNAIRES DE RÉGIONS (L'intelligence du Sommelier) ---
const REGION_MAPS = {
  'Bordeaux': ['pomerol', 'saint-emilion', 'medoc', 'margaux', 'pauillac', 'graves', 'pessac', 'sauternes', 'saint-julien', 'saint-estephe', 'canon-fronsac', 'moulis', 'listrac', 'entre-deux-mers', 'bourg', 'blaye'],
  'Bourgogne': ['chablis', 'meursault', 'cote de nuits', 'cote de beaune', 'gevrey-chambertin', 'puligny', 'chassagne', 'macon', 'pouilly-fuisse', 'mercurey', 'pommard', 'volnay', 'nuits-saint-georges'],
  'Rhône': ['chateauneuf', 'gigondas', 'crozes-hermitage', 'hermitage', 'condrieu', 'cote-rotie', 'vacqueyras', 'saint-joseph', 'cornas', 'luberon', 'ventoux', 'beaumes-de-venise'],
  'Loire': ['sancerre', 'pouilly-fume', 'chinon', 'saumur', 'vouvray', 'muscadet', 'anjou', 'touraine', 'menetou-salon'],
  'Alsace': ['riesling', 'gewurztraminer', 'pinot gris', 'sylvaner'],
  'Champagne': ['montagne de reims', 'cote des blancs', 'vallee de la marne'],
  'Italie': ['toscana', 'piemonte', 'barolo', 'barbaresco', 'brunello', 'chianti', 'sicilia', 'puglia', 'veneto', 'amarene', 'prosecco'],
  'Espagne': ['rioja', 'ribera', 'priorat', 'rías baixas', 'rueda', 'jerez', 'cava']
};

function detectRegion(p) {
  const tagsStr = Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '');
  const haystack = (p.title + ' ' + tagsStr + ' ' + (p.vendor || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // 1. Vérification par mot-clé spécifique (Sous-appellations)
  for (const [region, keywords] of Object.entries(REGION_MAPS)) {
    if (keywords.some(key => haystack.includes(key))) return region;
  }
  
  // 2. Vérification par nom de région direct
  const regions = Object.keys(REGION_MAPS);
  for (const r of regions) {
    if (haystack.includes(r.toLowerCase())) return r;
  }
  
  // 3. Fallback Chateau (souvent Bordeaux)
  if (haystack.includes('chateau') && !haystack.includes('bourgogne')) return 'Bordeaux';
  
  return 'Autre';
}

async function fetchBoirCatalog() {
  console.log('🍇 Récupération du catalogue complet...');
  let allProducts = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const url = "https://boir.be/collections/all/products.json?limit=250&page=" + page;
    const res = await fetch(url, { headers: { 'User-Agent': 'Unwine-D/10.0' } });
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

  const searchFn = `
export function searchBoirLocal(query, limit = 500) {
  if (!query || query.length < 2) return [];
  const terms = query.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').split(/\\s+/);
  return BOIR_CATALOG.map(w => {
    let score = 0;
    const r = (w.r || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
    const t = (w.t || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
    const v = (w.v || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
    terms.forEach(term => {
      if (r === term || r.includes(term)) score += 100; // Match Région
      if (t.includes(term)) score += 20; // Match Titre
      if (v.includes(term)) score += 10; // Match Vendeur
    });
    return { ...w, score };
  })
  .filter(w => w.score > 0).sort((a, b) => b.score - a.score).slice(0, limit)
  .map(({ score, ...w }) => ({ title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, region: w.r, type: w.type }));
}`;

  const header = "// Catalogue Universel Unwine-D - " + finalCatalog.length + " vins\n";
  const content = "export const BOIR_CATALOG = " + JSON.stringify(finalCatalog, null, 2) + ";\n";
  
  fs.writeFileSync(CATALOG_PATH, header + content + searchFn, 'utf8');
  console.log('✅ ' + finalCatalog.length + ' vins synchronisés et classés par région.');
}

updateCatalog().catch(err => { console.error(err); process.exit(1); });
