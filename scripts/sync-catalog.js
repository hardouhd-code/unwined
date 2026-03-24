// scripts/sync-catalog.js
// Synchronisation dynamique du catalogue Boir.be pour Unwine-D
const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');
const MODEL = 'claude-3-5-sonnet-20240620'; // Modèle stable pour l'enrichissement
const BATCH_SIZE = 10; 
const MAX_NEW_PER_RUN = 20; // Limite pour économiser l'API Anthropic
const DELAY_MS = 500;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// 1. Liste des régions pour l'automatisation
const KNOWN_REGIONS = [
  'Bordeaux', 'Bourgogne', 'Rhône', 'Loire', 'Alsace', 'Champagne', 'Jura', 'Savoie', 
  'Languedoc-Roussillon', 'Provence', 'Sud-Ouest', 'Beaujolais', 'Corse', 'Crémant',
  'Piémont', 'Toscane', 'Vénétie', 'Campanie', 'Sicile', 'Pouilles', 'Abruzzes', 'Sardaigne',
  'Rioja', 'Ribera del Duero', 'Priorat', 'Rías Baixas', 'Rueda', 'Jerez', 'Cava',
  'Porto', 'Douro', 'Alentejo', 'Vinho Verde', 'Madère', 'Wachau', 'Kamptal', 'Burgenland', 
  'Moselle', 'Rheingau', 'Stellenbosch', 'Marlborough', 'Chili', 'Mendoza', 'Napa', 'Sonoma', 
  'Hongrie', 'Grèce', 'Liban', 'Géorgie'
];

// ─── Helpers de Classification ──────────────────────────────────────────────

function detectRegion(p) {
  // Fusionne titre et tags (badges Shopify) pour la détection
  const tagsStr = Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '');
  const haystack = (p.title + ' ' + tagsStr).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  for (const r of KNOWN_REGIONS) {
    const search = r.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (haystack.includes(search)) return r;
  }
  // Fallback spécial pour les Châteaux bordelais
  if (haystack.includes('chateau') && !haystack.includes('bourgogne') && !haystack.includes('rhone')) return 'Bordeaux';
  return '';
}

function inferType(name, productType) {
  const n = (name + ' ' + (productType || '')).toLowerCase();
  if (n.includes('rosé') || n.includes('rose')) return 'rosé';
  if (['champagne', 'crémant', 'cremant', 'prosecco', 'cava', 'pétillant', 'brut'].some(k => n.includes(k))) return 'effervescent';
  if (['sauternes', 'barsac', 'vendanges tardives', 'porto', 'port', 'vin doux'].some(k => n.includes(k))) return 'doux';
  if (['blanc', 'chardonnay', 'sauvignon', 'riesling', 'chablis', 'meursault'].some(k => n.includes(k))) return 'blanc';
  return 'rouge';
}

function inferCountry(name, vendor) {
  const n = (name + ' ' + (vendor || '')).toLowerCase();
  if (['italie', 'toscana', 'piemonte', 'barolo', 'chianti'].some(k => n.includes(k))) return 'Italie';
  if (['espagne', 'rioja', 'ribera', 'priorat'].some(k => n.includes(k))) return 'Espagne';
  if (['portugal', 'douro', 'porto'].some(k => n.includes(k))) return 'Portugal';
  return 'France';
}

// ─── Sync Logic ─────────────────────────────────────────────────────────────

async function fetchBoirCatalog() {
  console.log('🍇 Récupération du catalogue Boir.be...');
  let allProducts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `https://boir.be/collections/all/products.json?limit=250&page=${page}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Unwine-D/4.0' } });
    const data = await res.json();
    if (data.products && data.products.length > 0) {
      allProducts = [...allProducts, ...data.products];
      console.log(`  Page ${page}: ${data.products.length} produits récupérés`);
      page++;
    } else {
      hasMore = false;
    }
    await sleep(300);
  }
  return allProducts;
}

async function enrichBatchWithClaude(batch) {
  const wineList = batch.map((w, i) => `${i + 1}. "${w.t}" (${w.r || 'Région inconnue'})`).join('\n');
  const prompt = `Tu es sommelier expert. Pour chaque vin, retourne un tableau JSON avec: "grapes" (cépages), "aromas" (3-4 arômes), "pairings" (accords), "profile" (léger/fruité/charnu/épicé/minéral/complexe).\nVins:\n${wineList}\nRéponds UNIQUEMENT en JSON.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await res.json();
  return JSON.parse(data.content[0].text.trim());
}

async function updateCatalog() {
  console.log('\n🍷 Unwine-D — Lancement de la synchronisation');
  
  // 1. Charger l'ancien catalogue pour ne pas ré-enrichir les mêmes vins
  let oldCatalog = [];
  if (fs.existsSync(CATALOG_PATH)) {
    const content = fs.readFileSync(CATALOG_PATH, 'utf8');
    const match = content.match(/export const BOIR_CATALOG = (\[[\s\S]*?\]);/);
    if (match) oldCatalog = JSON.parse(match[1]);
  }
  const existingUrls = new Set(oldCatalog.map(w => w.u));

  // 2. Fetch & Filter (Supprime les accessoires "glas", "spuwemmer", "dop")
  const rawProducts = await fetchBoirCatalog();
  const allInStock = rawProducts
    .filter(p => {
      const n = (p.title || '').toLowerCase();
      const isAcc = ['bouchon','verre','glas','spuwemmer','carafe','stopper','dop','klem','sac','etui'].some(k => n.includes(k));
      return p.variants?.some(v => v.available) && !isAcc;
    })
    .map(p => ({
      t: p.title, p: p.variants[0]?.price ? parseFloat(p.variants[0].price) : 0,
      v: p.vendor || '', u: `https://boir.be/fr/products/${p.handle}`,
      img: p.images[0]?.src || null, c: inferCountry(p.title, p.vendor),
      r: detectRegion(p), type: inferType(p.title, p.product_type),
      grapes: '', aromas: '', pairings: '', profile: ''
    }));

  // 3. Identifier les nouveaux vins à enrichir
  const newWines = allInStock.filter(w => !existingUrls.has(w.u));
  const existingInStock = oldCatalog.filter(w => allInStock.some(nw => nw.u === w.u));

  const toEnrich = newWines.slice(0, MAX_NEW_PER_RUN);
  const toKeepSimple = newWines.slice(MAX_NEW_PER_RUN); // On garde les 900+ sans IA s'ils dépassent la limite

  let enriched = [];
  if (process.env.ANTHROPIC_API_KEY && toEnrich.length > 0) {
    try {
      enriched = await enrichBatchWithClaude(toEnrich);
      enriched = toEnrich.map((w, i) => ({ ...w, ...enriched[i] }));
    } catch (err) {
      console.error('❌ Erreur Claude, import brut des nouveaux vins');
      enriched = toEnrich;
    }
  } else {
    enriched = toEnrich;
  }

  const finalCatalog = [...enriched, ...toKeepSimple, ...existingInStock];

  // 4. Moteur de recherche local (Cherche dans Titre, Vendeur, Pays et RÉGION)
  const searchFn = `
export function searchBoirLocal(query, limit = 50) {
  if (!query || query.length < 2) return [];
  const terms = query.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').split(/\\s+/);
  return BOIR_CATALOG
    .map(w => {
      const hay = [w.t, w.v, w.c, w.r, w.grapes, w.aromas, w.type, w.profile, w.pairings].join(' ').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
      const score = terms.reduce((s, t) => s + (hay.includes(t) ? 2 : 0), 0);
      return { ...w, score };
    })
    .filter(w => w.score > 0).sort((a, b) => b.score - a.score).slice(0, limit)
    .map(({ score, ...w }) => ({
      title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, 
      country: w.c, region: w.r, type: w.type, grapes: w.grapes, aromas: w.aromas, profile: w.profile, pairings: w.pairings
    }));
}`;

  const fileContent = `// Boir.be catalog — ${finalCatalog.length} vins en stock\nexport const BOIR_CATALOG = ${JSON.stringify(finalCatalog, null, 2)};\n${searchFn}`;
  fs.writeFileSync(CATALOG_PATH, fileContent, 'utf8');
  console.log(`✅ Succès : ${finalCatalog.length} vins synchronisés.`);
}

updateCatalog().catch(err => { console.error(err); process.exit(1); });
