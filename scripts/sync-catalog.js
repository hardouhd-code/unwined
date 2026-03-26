const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');
const MAX_NEW_PER_RUN = 20; 

const sleep = ms => new Promise(r => setTimeout(r, ms));

const KNOWN_REGIONS = [
  'Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne', 'Jura', 'Savoie', 
  'Languedoc-Roussillon', 'Provence', 'Sud-Ouest', 'Beaujolais', 'Corse', 'Crémant',
  'Piémont', 'Toscane', 'Vénétie', 'Campanie', 'Sicile', 'Pouilles', 'Abruzzes', 'Sardaigne',
  'Rioja', 'Ribera del Duero', 'Priorat', 'Rías Baixas', 'Rueda', 'Jerez', 'Cava',
  'Porto', 'Douro', 'Alentejo', 'Vinho Verde', 'Madère', 'Wachau', 'Kamptal', 'Burgenland', 
  'Moselle', 'Rheingau', 'Stellenbosch', 'Marlborough', 'Chili', 'Mendoza', 'Napa', 'Sonoma', 
  'Hongrie', 'Grèce', 'Liban', 'Géorgie'
];

function detectRegion(p) {
  const tagsStr = Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '');
  const haystack = (p.title + ' ' + tagsStr).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const r of KNOWN_REGIONS) {
    const search = r.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (haystack.includes(search)) return r;
  }
  if (haystack.includes('chateau') && !haystack.includes('bourgogne')) return 'Bordeaux';
  return '';
}

async function fetchBoirCatalog() {
  console.log('🍇 Récupération des données sur Boir.be...');
  let allProducts = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const url = "https://boir.be/collections/all/products.json?limit=250&page=" + page;
    const res = await fetch(url, { headers: { 'User-Agent': 'Unwine-D/6.0' } });
    const data = await res.json();
    if (data.products && data.products.length > 0) {
      allProducts = [...allProducts, ...data.products];
      console.log('  Page ' + page + ' : ' + data.products.length + ' produits.');
      page++;
    } else { hasMore = false; }
    await sleep(300);
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

  const searchFn = 'export function searchBoirLocal(query, limit = 100) {\n' +
    '  if (!query || query.length < 2) return [];\n' +
    '  const terms = query.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").split(/\\s+/);\n' +
    '  return BOIR_CATALOG.map(w => {\n' +
    '    let score = 0;\n' +
    '    const r = (w.r || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");\n' +
    '    const t = (w.t || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");\n' +
    '    terms.forEach(term => {\n' +
    '      if (r === term || r.includes(term)) score += 100;\n' +
    '      if (t.includes(term)) score += 10;\n' +
    '    });\n' +
    '    return { ...w, score };\n' +
    '  }).filter(w => w.score > 0).sort((a, b) => b.score - a.score).slice(0, limit)\n' +
    '  .map(({ score, ...w }) => ({ title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, region: w.r, type: w.type }));\n' +
    '}';

  const header = "// Catalogue Boir.be - " + finalCatalog.length + " vins\n";
  const content = "export const BOIR_CATALOG = " + JSON.stringify(finalCatalog, null, 2) + ";\n";
  
  fs.writeFileSync(CATALOG_PATH, header + content + searchFn, 'utf8');
  console.log('✅ ' + finalCatalog.length + ' vins enregistrés avec succès !');
}

updateCatalog().catch(err => { console.error(err); process.exit(1); });
