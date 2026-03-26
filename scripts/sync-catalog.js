const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');
const MODEL = 'claude-3-5-sonnet-20240620'; 
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
  if (haystack.includes('chateau') && !haystack.includes('bourgogne') && !haystack.includes('rhone')) return 'Bordeaux';
  return '';
}

function inferType(name, productType) {
  const n = (name + ' ' + (productType || '')).toLowerCase();
  if (n.includes('rosé') || n.includes('rose')) return 'rosé';
  if (['champagne', 'crémant', 'prosecco', 'cava', 'pétillant'].some(k => n.includes(k))) return 'effervescent';
  if (['blanc', 'chardonnay', 'sauvignon', 'riesling', 'chablis'].some(k => n.includes(k))) return 'blanc';
  return 'rouge';
}

function inferCountry(name, vendor) {
  const n = (name + ' ' + (vendor || '')).toLowerCase();
  if (['italie', 'toscana', 'piemonte', 'barolo'].some(k => n.includes(k))) return 'Italie';
  if (['espagne', 'rioja', 'ribera'].some(k => n.includes(k))) return 'Espagne';
  return 'France';
}

async function fetchBoirCatalog() {
  let allProducts = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const url = "https://boir.be/collections/all/products.json?limit=250&page=" + page;
    const res = await fetch(url, { headers: { 'User-Agent': 'Unwine-D/5.0' } });
    const data = await res.json();
    if (data.products && data.products.length > 0) {
      allProducts = [...allProducts, ...data.products];
      page++;
    } else { hasMore = false; }
    await sleep(300);
  }
  return allProducts;
}

async function updateCatalog() {
  let oldCatalog = [];
  if (fs.existsSync(CATALOG_PATH)) {
    const content = fs.readFileSync(CATALOG_PATH, 'utf8');
    const match = content.match(/export const BOIR_CATALOG = (\[[\s\S]*?\]);/);
    if (match) oldCatalog = JSON.parse(match[1]);
  }
  const existingUrls = new Set(oldCatalog.map(w => w.u));
  const rawProducts = await fetchBoirCatalog();

  const allInStock = rawProducts
    .filter(p => {
      const n = (p.title || '').toLowerCase();
      const isAcc = ['bouchon','verre','glas','spuwemmer','carafe','stopper','dop','klem','sac','etui','capsule'].some(k => n.includes(k));
      return p.variants?.some(v => v.available) && !isAcc;
    })
    .map(p => ({
      t: p.title, p: p.variants[0]?.price ? parseFloat(p.variants[0].price) : 0,
      v: p.vendor || '', u: "https://boir.be/fr/products/" + p.handle,
      img: p.images[0]?.src || null, c: inferCountry(p.title, p.vendor),
      r: detectRegion(p), type: inferType(p.title, p.product_type),
      grapes: '', aromas: '', pairings: '', profile: ''
    }));

  const finalCatalog = [...allInStock.filter(w => !existingUrls.has(w.u)), ...oldCatalog.filter(w => allInStock.some(nw => nw.u === w.u))];

  const searchFn = `
export function searchBoirLocal(query, limit = 100) {
  if (!query || query.length < 2) return [];
  const terms = query.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').split(/\\s+/);
  return BOIR_CATALOG
    .map(w => {
      let score = 0;
      const r = (w.r || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
      const t = (w.t || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
      const other = [w.v, w.c, w.grapes, w.aromas, w.type, w.profile, w.pairings].join(' ').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
      terms.forEach(term => {
        if (r === term || r.includes(term)) score += 100;
        if (t.includes(term)) score += 10;
        if (other.includes(term)) score += 1;
      });
      return { ...w, score };
    })
    .filter(w => w.score > 0).sort((a, b) => b.score - a.score).slice(0, limit)
    .map(({ score, ...w }) => ({
      title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, 
      country: w.c, region: w.r, type: w.type, aromas: w.aromas, profile: w.profile
    }));
}`;

  const fileContent = "// Boir.be catalog — " + finalCatalog.length + " vins actifs\nexport const BOIR_CATALOG = " + JSON.stringify(finalCatalog, null, 2) + ";\n" + searchFn;
  fs.writeFileSync(CATALOG_PATH, fileContent, 'utf8');
  console.log('✅ Succès : ' + finalCatalog.length + ' vins synchronisés.');
}

updateCatalog().catch(err => { console.error(err); process.exit(1); });
