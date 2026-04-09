const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');
const BASE_URL = 'https://boir.be/collections/all/products.json?limit=250&page=';
const COLLECTION_VIN_URL = 'https://boir.be/fr/collections/vin?page=';
const MAX_PAGES = 40;

const EXCLUDE = [
  'thermometer', 'kurkentrekker', 'glas', 'shaker', 'cadeaubon', 'ijsemmer',
  'karaf', 'label', 'dop', 'gift card', 'jigger', 'strainer', 'muddler',
  'cadeautas', 'box', 'spuwemmer', 'degustatie', 'voucher', 'sac isotherme',
  'tire-bouchon', 'verre', 'seau a glace', 'bucket', 'coffret cadeau'
];

const NON_WINE_HINTS = [
  'kombucha', 'spritz', 'aperitif', 'apero', 'mocktail', 'gin', 'whisky',
  'rhum', 'vodka', 'liqueur', 'biere', 'beer', 'cidre', 'cider', 'sake',
  'eau', 'water', 'jus', 'sirop', 'distillery', 'masterclass',
  'lambiek', 'caribbean cane', 'oss craft', 'dok brewing', 'brasserie'
];

const WINE_PRODUCT_TYPES = new Set([
  'rode wijn',
  'witte wijn',
  'rose wijn',
  'schuimwijn',
  'zoete wijn',
  'versterkte wijn',
  'oranje wijn',
  'all',
  'bio'
]);

const COUNTRY_RULES = [
  { country: 'France', keys: ['france', 'bordeaux', 'bourgogne', 'rhone', 'loire', 'alsace', 'champagne', 'provence', 'languedoc'] },
  { country: 'Italie', keys: ['italie', 'italia', 'toscane', 'toscana', 'piemont', 'piemonte', 'veneto', 'venetie', 'sicile', 'sicilia', 'puglia', 'barolo', 'chianti', 'brunello'] },
  { country: 'Espagne', keys: ['espagne', 'espana', 'rioja', 'priorat', 'ribera del duero', 'jerez', 'cava', 'rueda', 'ribeiro'] },
  { country: 'Portugal', keys: ['portugal', 'douro', 'dao', 'alentejo', 'vinho verde', 'bairrada'] },
  { country: 'Argentine', keys: ['argentine', 'argentina', 'mendoza', 'salta', 'patagonie', 'malbec'] },
  { country: 'Chili', keys: ['chili', 'chile', 'maipo', 'colchagua', 'casablanca valley'] },
  { country: 'Allemagne', keys: ['allemagne', 'germany', 'mosel', 'moselle', 'rheingau', 'pfalz'] },
  { country: 'Afrique du Sud', keys: ['afrique du sud', 'south africa', 'stellenbosch', 'paarl', 'franschhoek'] },
  { country: 'États-Unis', keys: ['usa', 'united states', 'etats-unis', 'napa', 'sonoma', 'oregon'] },
  { country: 'Nouvelle-Zélande', keys: ['new zealand', 'nouvelle-zelande', 'marlborough', 'central otago'] },
  { country: 'Belgique', keys: ['belgique', 'belgie'] }
];

const REGION_RULES = [
  { region: 'Bordeaux', keys: ['bordeaux', 'margaux', 'pauillac', 'saint emilion', 'st emilion', 'pomerol', 'medoc', 'haut medoc', 'sauternes', 'pessac leognan', 'graves'] },
  { region: 'Bourgogne', keys: ['bourgogne', 'chablis', 'beaune', 'gevrey', 'chambertin', 'meursault', 'montrachet', 'nuits saint georges', 'pommard', 'volnay', 'macon'] },
  { region: 'Rhône', keys: ['rhone', 'cote rotie', 'hermitage', 'crozes hermitage', 'condrieu', 'chateauneuf du pape', 'gigondas', 'vacqueyras', 'lirac', 'ventoux'] },
  { region: 'Loire', keys: ['loire', 'sancerre', 'pouilly fum', 'chinon', 'saumur', 'vouvray', 'muscadet', 'anjou'] },
  { region: 'Alsace', keys: ['alsace', 'riesling', 'gewurztraminer', 'pinot gris alsace'] },
  { region: 'Champagne', keys: ['champagne', 'blanc de blancs', 'blanc de noirs'] },
  { region: 'Languedoc-Roussillon', keys: ['languedoc', 'roussillon', 'corbieres', 'minervois', 'fitou', 'faugeres', 'pic saint loup'] },
  { region: 'Provence', keys: ['provence', 'bandol', 'cassis', 'coteaux d aix'] },
  { region: 'Beaujolais', keys: ['beaujolais', 'fleurie', 'morgon', 'brouilly', 'moulin a vent', 'juli', 'regnie', 'saint amour'] },
  { region: 'Piémont', keys: ['piemont', 'piemonte', 'barolo', 'barbaresco', 'gavi'] },
  { region: 'Toscane', keys: ['toscane', 'toscana', 'chianti', 'brunello', 'montalcino', 'bolgheri', 'vino nobile di montepulciano'] },
  { region: 'Vénétie', keys: ['venetie', 'veneto', 'amarone', 'valpolicella', 'soave', 'prosecco'] },
  { region: 'Sicile', keys: ['sicile', 'sicilia', 'etna', 'marsala'] },
  { region: 'Rioja', keys: ['rioja'] },
  { region: 'Ribera del Duero', keys: ['ribera del duero'] },
  { region: 'Priorat', keys: ['priorat'] },
  { region: 'Douro', keys: ['douro'] },
  { region: 'Alentejo', keys: ['alentejo'] },
  { region: 'Mendoza', keys: ['mendoza'] }
];

const AOP_RULES = [
  'aop', 'aoc', 'docg', 'doc', 'igp', 'vin de france', 'vin de pays',
  'saint emilion', 'margaux', 'pauillac', 'pomerol', 'chablis', 'chablis premier cru',
  'chateauneuf du pape', 'gigondas', 'condrieu', 'crozes hermitage', 'cote rotie',
  'sancerre', 'chinon', 'vouvray', 'muscadet', 'champagne', 'cremant de bourgogne',
  'alsace grand cru', 'barolo', 'barbaresco', 'chianti classico', 'brunello di montalcino',
  'amarone della valpolicella', 'valpolicella', 'prosecco', 'rioja', 'ribera del duero',
  'priorat', 'douro', 'dao', 'vinho verde', 'mendoza'
];

function normalize(text = '') {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchFirst(ruleSet, haystack, fallback = 'Autre') {
  for (const rule of ruleSet) {
    if (rule.keys.some((key) => haystack.includes(normalize(key)))) {
      return rule[Object.keys(rule)[0]];
    }
  }
  return fallback;
}

function detectType(haystack) {
  if (/(champagne|cremant|prosecco|cava|mousseux|effervescent|pet nat|petillant|schuimwijn|sparkling)/.test(haystack)) return 'Effervescent';
  if (/(rose|rosado|rosato|rose wijn)/.test(haystack)) return 'Rosé';
  if (/(blanc|white|bianco|witte wijn|vin blanc)/.test(haystack)) return 'Blanc';
  if (/(rouge|red|rosso|rode wijn|vin rouge)/.test(haystack)) return 'Rouge';
  return 'Autre';
}

function detectAop(haystack) {
  for (const term of AOP_RULES) {
    const n = normalize(term);
    if (haystack.includes(n)) {
      return term.toUpperCase();
    }
  }
  const m = haystack.match(/\b([a-z]{3,}(?:\s+[a-z]{3,}){0,3})\s+(aop|aoc|docg|doc|igp)\b/i);
  if (m) {
    return `${m[1]} ${m[2]}`.replace(/\s+/g, ' ').toUpperCase();
  }
  return 'N/A';
}

function detectWineMeta(product) {
  const haystack = normalize([
    product.title,
    product.vendor,
    ...(Array.isArray(product.tags) ? product.tags : [(product.tags || '')]),
    product.product_type,
    product.body_html
  ].join(' '));

  const country = matchFirst(COUNTRY_RULES, haystack, 'France');
  const region = matchFirst(REGION_RULES, haystack, 'Autre');
  const aop = detectAop(haystack);
  const type = detectType(haystack);

  return { country, region, aop, type, haystack };
}

function isWine(product) {
  const title = normalize(product.title || '');
  const productType = normalize(product.product_type || '');
  const tags = normalize((Array.isArray(product.tags) ? product.tags.join(' ') : product.tags) || '');
  const vendor = normalize(product.vendor || '');
  const bag = `${title} ${productType} ${tags}`;

  const isAccessory = EXCLUDE.some((word) => bag.includes(normalize(word)));
  const hasNonWineHints = NON_WINE_HINTS.some((word) => bag.includes(normalize(word)));
  const explicitNonWineType = /(non food|bier|beer|aperitif|spirits|spiritueux|tools|accessoires|accessory)/.test(productType);
  const explicitWineType = /(wijn|wine|vin|rode wijn|witte wijn|rose wijn|schuimwijn|versterkte wijn|zoete wijn|oranje wijn)/.test(productType);
  const trustedWineType = WINE_PRODUCT_TYPES.has(productType);
  const looksLikeWine = /(vin|wine|rouge|blanc|rose|champagne|cremant|barolo|chianti|bordeaux|bourgogne|rhone|rioja|douro|prosecco|pinot|cabernet|syrah|riesling|sauvignon|nebbiolo|sangiovese)/.test(bag);
  const hasWineHintsInVendor = /(domaine|chateau|winery|wines|vineyards|vigneron)/.test(vendor);
  const isBoxSet = /(box|boir-box|themabox|inspiratiebox|degustatiebox|coffret)/.test(title);
  const explicitNonWineTitle = /(masterclass|distillery|lambiek|kombucha|mesamis|arensbak|opius|siegfried|dok brewing|far & son|caribbean cane)/.test(bag);

  if (isAccessory || explicitNonWineType || explicitNonWineTitle) return false;
  if (isBoxSet) return false;
  if (trustedWineType) return true;
  if (explicitWineType) return true;
  return (looksLikeWine && !hasNonWineHints) || (hasWineHintsInVendor && !hasNonWineHints);
}

async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = `${BASE_URL}${page}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Erreur Boir.be page ${page}: ${res.status}`);
    }
    const data = await res.json();
    const products = data?.products || [];
    if (!products.length) break;
    all.push(...products);
    console.log(`Page ${page} récupérée (${products.length} produits)`);
  }
  return all;
}

function extractHandlesFromHtml(html) {
  const handles = new Set();
  const patterns = [
    /\/fr\/products\/([a-z0-9-]+)/gi,
    /\/products\/([a-z0-9-]+)/gi
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      handles.add(match[1].toLowerCase());
    }
  }
  return handles;
}

async function fetchCollectionVinHandles() {
  const handles = new Set();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await fetch(`${COLLECTION_VIN_URL}${page}`);
    if (!res.ok) {
      throw new Error(`Erreur collection vin page ${page}: ${res.status}`);
    }

    const html = await res.text();
    const pageHandles = extractHandlesFromHtml(html);
    const before = handles.size;
    for (const h of pageHandles) handles.add(h);

    // Stop quand la pagination ne ramène plus de nouveaux produits.
    if (page > 1 && handles.size === before) break;
  }

  return handles;
}

function buildReport(catalog) {
  const byCountry = {};
  const byRegion = {};
  const byType = {};
  let withAop = 0;

  for (const wine of catalog) {
    byCountry[wine.c] = (byCountry[wine.c] || 0) + 1;
    byRegion[wine.r] = (byRegion[wine.r] || 0) + 1;
    byType[wine.y] = (byType[wine.y] || 0) + 1;
    if (wine.a && wine.a !== 'N/A') withAop += 1;
  }

  const top = (obj, n = 10) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);

  return {
    total: catalog.length,
    withAop,
    byCountry: top(byCountry, 12),
    byRegion: top(byRegion, 12),
    byType: top(byType, 8)
  };
}

async function update() {
  console.log('Démarrage du scraping Boir.be...');
  const all = await fetchAllProducts();
  console.log(`Produits bruts récupérés: ${all.length}`);
  const collectionHandles = await fetchCollectionVinHandles();
  const useCollectionFilter = collectionHandles.size >= 200;
  console.log(`Handles trouvés dans /collections/vin: ${collectionHandles.size} (${useCollectionFilter ? 'filtre appliqué' : 'filtre ignoré - rendu dynamique'})`);

  const clean = all
    .filter((p) => !useCollectionFilter || collectionHandles.has((p.handle || '').toLowerCase()))
    .filter((p) => p?.variants?.some((v) => v.available))
    .filter(isWine)
    .map((p) => {
      const meta = detectWineMeta(p);
      return {
        t: p.title,
        p: parseFloat(p.variants?.[0]?.price || 0),
        v: p.vendor || 'Inconnu',
        u: `https://boir.be/fr/products/${p.handle}`,
        img: p.images?.[0]?.src || '',
        r: meta.region,
        c: meta.country,
        a: meta.aop,
        y: meta.type
      };
    });

  const content = `export const BOIR_CATALOG = ${JSON.stringify(clean, null, 2)};

export function searchBoirLocal(query) {
  if (!query || query.length < 2) return [];
  const term = query.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, "");

  const score = (wine, q) => {
    const n = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    let pts = 0;
    const title = n(wine.t);
    const aop = n(wine.a);
    const region = n(wine.r);
    const country = n(wine.c);
    const vendor = n(wine.v);
    const type = n(wine.y);

    if (title.includes(q)) pts += 80;
    if (aop.includes(q)) pts += 65;
    if (region.includes(q)) pts += 50;
    if (country.includes(q)) pts += 40;
    if (type.includes(q)) pts += 30;
    if (vendor.includes(q)) pts += 20;
    return pts;
  };

  return BOIR_CATALOG
    .map((w) => ({ w, s: score(w, term) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map(({ w }) => ({
      ...w,
      title: w.t,
      price: w.p,
      vendor: w.v,
      url: w.u,
      image: w.img,
      region: w.r,
      country: w.c,
      aop: w.a,
      type: w.y
    }));
}

export function getRandomWines(n = 3) {
  return [...BOIR_CATALOG]
    .sort(() => 0.5 - Math.random())
    .slice(0, n)
    .map((w) => ({
      ...w,
      title: w.t,
      price: w.p,
      vendor: w.v,
      url: w.u,
      image: w.img,
      region: w.r,
      country: w.c,
      aop: w.a,
      type: w.y
    }));
}`;

  fs.writeFileSync(CATALOG_PATH, content);
  const report = buildReport(clean);
  console.log(`Scraping terminé. ${report.total} vins enregistrés dans le catalogue.`);
  console.log(`AOP détectée: ${report.withAop}/${report.total}`);
  console.log('Répartition pays (top):', report.byCountry);
  console.log('Répartition régions (top):', report.byRegion);
  console.log('Répartition types:', report.byType);
}

update().catch((err) => {
  console.error(err);
  process.exit(1);
});
