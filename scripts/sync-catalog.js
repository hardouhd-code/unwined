// scripts/sync-catalog.js
// Version "Expert" pour Unwine-D — Détection par Tags & Recherche Locale Étendue
const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');
const MODEL = 'claude-3-5-sonnet-20240620'; 
const BATCH_SIZE = 10;
const MAX_NEW_PER_RUN = 20; 
const DELAY_MS = 500;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// 1. Liste des 60 régions pour l'automatisation (basée sur votre snapshot)
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
  // On fusionne titre et tags (les badges du site) pour ne rien rater
  const tagsStr = Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '');
  const haystack = (p.title + ' ' + tagsStr).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  for (const r of KNOWN_REGIONS) {
    const search = r.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (haystack.includes(search)) return r;
  }
  // Fallback pour les Châteaux sans tag explicite
  if (haystack.includes('chateau') && !haystack.includes('bourgogne') && !haystack.includes('rhone')) return 'Bordeaux';
  return '';
}

function inferType(name, productType) {
  const n = (name + ' ' + (productType || '')).toLowerCase();
  if (n.includes('rosé') || n.includes('rose')) return 'rosé';
  if (['champagne', 'crémant', 'cremant', 'prosecco', 'cava', 'pétillant', 'brut'].some(k => n.includes(k))) return 'effervescent';
  if (['sauternes', 'barsac', 'vendanges tardives', 'porto', 'vin doux'].some(k => n.includes(k))) return 'doux';
  if (['blanc', 'chardonnay', 'sauvignon', 'riesling', 'chablis'].some(k => n.includes(k))) return 'blanc';
  return 'rouge';
}

function inferCountry(name, vendor) {
  const n = (name + ' ' + (vendor || '')).toLowerCase();
  if (['italie', 'toscana', 'piemonte', 'barolo'].some(k => n.includes(k))) return 'Italie';
  if (['espagne', 'rioja', 'ribera'].some(k => n.includes(k))) return 'Espagne';
  return 'France';
}

// ─── Logique de Synchronisation ─────────────────────────────────────────────

async function fetchBoirCatalog() {
  console.log('🍇 Récupération du catalogue complet Boir.be...');
  let allProducts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `https://boir.be/collections/all/products.json?limit=250&page=${page}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Unwine-D/5.0' } });
    const data = await res.json();
    if (data.products && data.products.length > 0) {
      allProducts = [...allProducts, ...data.products];
      console.log(`  Page ${page}: ${data.products.length} produits trouvés`);
      page++;
    } else {
      hasMore = false;
    }
    await sleep(300);
  }
  return allProducts;
}

async function enrichBatchWithClaude(batch) {
  if (!process.env.ANTHROPIC_API_KEY) return batch;
  const wineList = batch.map((w, i) => `${i + 1}. "${w.t}" (${w.r || 'Région inconnue'})`).join('\n');
  const prompt = `Tu es sommelier. Pour chaque vin, retourne JSON avec: "grapes" (cépages), "aromas" (3-arômes), "pairings" (accords), "profile" (1 mot). Vins:\n${wineList}`;

  try {
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
    return JSON.parse(data.content[0].text);
  } catch (e) {
    console.error('Erreur Claude enrichment:', e.message);
    return batch;
  }
}

async function updateCatalog() {
  console.log('\n🍷 Unwine-D — Mise à jour du catalogue');
  
  let oldCatalog = [];
  if (fs.existsSync(CATALOG_PATH)) {
    try {
      const content = fs.readFileSync(CATALOG_PATH, 'utf8');
      const match = content.match(/export const BOIR_CATALOG = (\[[\s\S]*?\]);/);
      if (match) oldCatalog = JSON.parse(match[1]);
    } catch (err) {}
  }
  const existingUrls = new Set(oldCatalog.map(w => w.u));

  const rawProducts = await fetchBoirCatalog();

  const allInStock = rawProducts
    .filter(p => {
      const n = (p.title || '').toLowerCase();
      // FILTRE ACCESSOIRES : On jette les verres, crachoirs et bouchons
      const isAcc = ['bouchon','verre','glas','spuwemmer','carafe','stopper','dop','klem','sac'].some(k => n.includes(k));
      return p.variants?.some(v => v.available) && !isAcc;
    })
    .map(p => ({
      t: p.title, 
      p: p.variants[0]?.price ? parseFloat(p.variants[0].price) : 0,
      v: p.vendor || '', 
      u: `https://boir.be/fr/products/${p.handle}`,
      img: p.images[0]?.src || null, 
      c: inferCountry(p.title, p.vendor),
      r: detectRegion(p), 
      type: inferType(p.title, p.product_type),
      grapes: '', aromas: '', pairings: '', profile: ''
    }));

  const newWines = allInStock.filter(w => !existingUrls.has(w.u));
  const existingInStock = oldCatalog.filter(w => allInStock.some(nw => nw.u === w.u));

  const toEnrich = newWines.slice(0, MAX_NEW_PER_RUN);
  const toKeepSimple = newWines.slice(MAX_NEW_PER_RUN);

  let enriched = toEnrich;
  if (toEnrich.length > 0 && process.env.ANTHROPIC_API_KEY) {
    enriched = await enrichBatchWithClaude(toEnrich);
    enriched = toEnrich.map((w, i) => ({ ...w, ...enriched[i] }));
  }

  const finalCatalog = [...enriched, ...toKeepSimple, ...existingInStock];

  // LE MOTEUR DE RECHERCHE LOCAL : Cherche enfin dans la RÉGION (w.r) et le VENDEUR (w.v)
  const searchFn = `
export function searchBoirLocal(query, limit = 100) {
  if (!query || query.length < 2) return [];
  const terms = query.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').split(/\\s+/);
  return BOIR_CATALOG
    .map(w => {
      // Zone de recherche étendue : Titre, Vendeur, Pays, Région, Cépages, Profil
      const hay = [w.t, w.v, w.c, w.r, w.grapes, w.aromas, w.type, w.profile, w.pairings]
        .join(' ')
        .toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
      const score = terms.reduce((s, t) => s + (hay.includes(t) ? 2 : 0), 0);
      return { ...w, score };
    })
    .filter(w => w.score > 0).sort((a, b) => b.score - a.score).slice(0, limit)
    .map(({ score, ...w }) => ({
      title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, 
      country: w.c, region: w.r, type: w.type, grapes: w.grapes, aromas: w.aromas, profile: w.profile, pairings: w.pairings
    }));
}`;

  const fileContent = `// Boir.be catalog — ${finalCatalog.length} vins actifs\nexport const BOIR_CATALOG = ${JSON.stringify(finalCatalog, null, 2)};\n${searchFn}`;
  fs.writeFileSync(CATALOG_PATH, fileContent, 'utf8');
  console.log(`✅ Succès : ${finalCatalog.length} vins synchronisés avec détection régionale.`);
}

updateCatalog().catch(err => { console.error(err); process.exit(1); });
