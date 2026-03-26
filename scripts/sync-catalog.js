const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// --- LA MATRICE DES RÉGIONS (Lien Parent-Enfant) ---
const REGIONS_MAP = {
  'Bordeaux': ['pomerol', 'saint-emilion', 'medoc', 'margaux', 'pauillac', 'graves', 'pessac', 'sauternes', 'saint-julien', 'saint-estephe', 'fronsac', 'moulis', 'listrac', 'entre-deux-mers', 'bourg', 'blaye', 'castillon', 'haut-medoc', 'chateau'],
  'Bourgogne': ['chablis', 'meursault', 'montrachet', 'gevrey', 'pommard', 'volnay', 'nuits-saint-georges', 'beaune', 'macon', 'pouilly-fuisse', 'mercurey', 'givry', 'cote de nuits', 'cote de beaune'],
  'Rhône': ['chateauneuf', 'gigondas', 'hermitage', 'condrieu', 'cote-rotie', 'vacqueyras', 'saint-joseph', 'cornas', 'crozes', 'luberon', 'ventoux', 'du pape'],
  'Loire': ['sancerre', 'pouilly-fume', 'chinon', 'saumur', 'vouvray', 'muscadet', 'anjou', 'touraine'],
  'Alsace': ['riesling', 'gewurztraminer', 'pinot gris', 'sylvaner'],
  'Champagne': ['reims', 'epernay', 'ay', 'brut', 'blanc de blancs'],
  'Italie': ['toscana', 'piemonte', 'barolo', 'brunello', 'chianti', 'sicilia', 'puglia', 'veneto', 'amarene', 'prosecco', 'nebbiolo', 'sangiovese'],
  'Espagne': ['rioja', 'ribera', 'priorat', 'rías baixas', 'rueda', 'cava', 'tempranillo']
};

function detectRegion(p) {
  const tagsStr = Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '');
  const haystack = (p.title + ' ' + tagsStr + ' ' + (p.vendor || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  for (const [parent, subs] of Object.entries(REGIONS_MAP)) {
    if (subs.some(sub => haystack.includes(sub)) || haystack.includes(parent.toLowerCase())) {
      return parent;
    }
  }
  return 'Autre';
}

async function fetchBoirCatalog() {
  console.log('📡 Scan exhaustif de Boir.be...');
  let allProducts = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const url = "https://boir.be/collections/all/products.json?limit=250&page=" + page;
    const res = await fetch(url, { headers: { 'User-Agent': 'Unwine-D/11.0' } });
    const data = await res.json();
    if (data.products && data.products.length > 0) {
      allProducts = [...allProducts, ...data.products];
      console.log(`  Page ${page} récupérée (${data.products.length} produits)`);
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
      const isAcc = ['bouchon','verre','glas','spuwemmer','carafe','stopper','dop','klem','sac','etui','capsule'].some(k => n.includes(k));
      return p.variants?.some(v => v.available) && !isAcc;
    })
    .map(p => {
      const region = detectRegion(p);
      const tags = Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '');
      return {
        t: p.title, 
        p: p.variants[0]?.price ? parseFloat(p.variants[0].price) : 0,
        v: p.vendor || '', 
        u: "https://boir.be/fr/products/" + p.handle,
        img: p.images[0]?.src || null, 
        r: region,
        // On crée une chaîne de recherche ultra-complète
        s: (p.title + ' ' + region + ' ' + p.vendor + ' ' + tags).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      };
    });

  const searchFn = `
export function searchBoirLocal(query, limit = 500) {
  if (!query || query.length < 2) return [];
  const term = query.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
  
  return BOIR_CATALOG
    .filter(w => w.s.includes(term))
    .sort((a, b) => {
      // Priorité si le terme est exactement la région
      if (a.r.toLowerCase() === term) return -1;
      if (b.r.toLowerCase() === term) return 1;
      return 0;
    })
    .slice(0, limit)
    .map(w => ({ title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, region: w.r }));
}`;

  const header = "// Catalogue Global Unwine-D - " + finalCatalog.length + " vins\n";
  const content = "export const BOIR_CATALOG = " + JSON.stringify(finalCatalog, null, 2) + ";\n";
  
  fs.writeFileSync(CATALOG_PATH, header + content + searchFn, 'utf8');
  console.log('✅ ' + finalCatalog.length + ' vins indexés avec succès !');
}

updateCatalog().catch(err => { console.error(err); process.exit(1); });
