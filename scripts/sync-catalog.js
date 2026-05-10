import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');
const BASE_URL = 'https://boir.be/collections/all/products.json?limit=250&page=';
const COLLECTION_VIN_URL = 'https://boir.be/fr/collections/vin?page=';
const MAX_PAGES = 40;
const DELAY_MS = 400;

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
  'rode wijn', 'witte wijn', 'rose wijn', 'schuimwijn',
  'zoete wijn', 'versterkte wijn', 'oranje wijn', 'all', 'bio'
]);

const KNOWN_WINE_VENDORS = [
  // Afrique du Sud
  'kanonkop', 'meerlust', 'boschendal', 'stellenrust', 'warwick', 'rustenberg',
  'spier', 'waterford', 'klein constantia', 'hamilton russell', 'bouchard finlayson',
  'mullineux', 'leeu', 'sadie', 'boekenhoutskloof', 'creation wines', 'ataraxia',
  'delheim', 'grangehurst', 'jordan', 'neil ellis', 'simonsig', 'thelema',
  // Nouvelle-Zélande
  'cloudy bay', 'villa maria', 'saint clair', 'greywacke', 'dog point',
  'seresin', 'craggy range', 'te mata', 'felton road',
  // Australie
  'penfolds', 'henschke', 'leeuwin', 'grosset', 'jim barry', 'd arenberg',
  'torbreck', 'two hands', 'yalumba', 'peter lehmann', 'wolf blass', 'jacob s creek',
  'shaw smith', 'mount langhi', 'jasper hill', 'bass phillip',
  // Argentine
  'catena', 'achaval ferrer', 'clos de los siete', 'zuccardi', 'trapiche',
  'norton', 'luigi bosca', 'alta vista', 'clos de chacras',
  // Chili
  'concha y toro', 'almaviva', 'montes', 'errazuriz', 'vina maipo',
  'casa lapostolle', 'ventisquero', 'emiliana',
  // Georgie
  'pheasant s tears', 'orgo', 'gotsa', 'iago', 'jakeli', 'teliani valley',
];

const COUNTRY_RULES = [
  { country: 'France', keys: ['france', 'bordeaux', 'bourgogne', 'rhone', 'loire', 'alsace', 'champagne', 'provence', 'languedoc', 'roussillon', 'sud-ouest', 'jura', 'savoie'] },
  { country: 'Italie', keys: ['italie', 'italia', 'toscane', 'toscana', 'piemont', 'piemonte', 'veneto', 'venetie', 'sicile', 'sicilia', 'puglia', 'barolo', 'chianti', 'brunello', 'amarone', 'prosecco', 'soave', 'gavi'] },
  { country: 'Afrique du Sud', keys: [
    'afrique du sud', 'south africa', 'stellenbosch', 'paarl', 'franschhoek',
    'swartland', 'constantia', 'walker bay', 'elgin', 'robertson', 'hemel en aarde',
    'kanonkop', 'meerlust', 'boschendal', 'stellenrust', 'warwick', 'rustenberg',
    'spier', 'waterford', 'klein constantia', 'hamilton russell', 'bouchard finlayson',
    'mullineux', 'boekenhoutskloof', 'delheim', 'jordan', 'neil ellis', 'simonsig',
    'thelema', 'pinotage', 'cape blend', 'western cape'
  ]},
  { country: 'Espagne', keys: ['espagne', 'espana', 'rioja', 'priorat', 'ribera del duero', 'jerez', 'cava', 'rueda', 'ribeiro', 'rias baixas', 'penedes', 'navarra'] },
  { country: 'Belgique', keys: ['belgique', 'belgie', 'belgium'] },
  { country: 'Portugal', keys: ['portugal', 'douro', 'dao', 'alentejo', 'vinho verde', 'bairrada', 'setubal', 'madeira', 'porto'] },
  { country: 'Argentine', keys: ['argentine', 'argentina', 'mendoza', 'salta', 'patagonie', 'malbec argentin', 'catena', 'achaval', 'zuccardi', 'trapiche', 'norton', 'luigi bosca'] },
  { country: 'Australie', keys: [
    'australie', 'australia', 'barossa', 'clare valley', 'eden valley', 'mclaren vale',
    'margaret river', 'hunter valley', 'yarra valley', 'coonawarra', 'adelaide hills',
    'penfolds', 'henschke', 'leeuwin', 'grosset', 'jim barry', 'd arenberg',
    'torbreck', 'two hands', 'yalumba', 'peter lehmann', 'wolf blass', 'shaw smith',
    'shiraz australia', 'cabernet australia'
  ]},
  { country: 'Nouvelle-Zélande', keys: [
    'new zealand', 'nouvelle-zelande', 'marlborough', 'central otago',
    'hawkes bay', 'waipara', 'cloudy bay', 'villa maria', 'saint clair',
    'greywacke', 'dog point', 'seresin', 'craggy range', 'te mata', 'felton road'
  ]},
  { country: 'Autriche', keys: ['autriche', 'austria', 'gruner veltliner', 'gruner', 'weinviertel', 'wachau', 'kamptal', 'burgenland', 'blaufrankisch', 'zweigelt'] },
  { country: 'Chili', keys: ['chili', 'chile', 'maipo', 'colchagua', 'casablanca valley', 'concha y toro', 'almaviva', 'montes', 'errazuriz', 'casa lapostolle'] },
  { country: 'Allemagne', keys: ['allemagne', 'germany', 'mosel', 'moselle', 'rheingau', 'pfalz', 'nahe', 'ahr', 'franken', 'spatlese', 'auslese'] },
  { country: 'États-Unis', keys: ['usa', 'united states', 'etats-unis', 'napa', 'sonoma', 'oregon', 'washington state', 'willamette', 'paso robles'] },
  { country: 'Georgie', keys: [
    'georgie', 'georgia', 'georgian wine', 'kakheti', 'kartli', 'imereti', 'racha',
    'rkatsiteli', 'saperavi', 'qvevri', 'kvevri', 'amber wine georgia',
    'pheasant s tears', 'orgo', 'gotsa', 'iago', 'jakeli', 'teliani'
  ]},
  { country: 'Grèce', keys: ['grece', 'greece', 'assyrtiko', 'santorini', 'nemea', 'xinomavro', 'moschofilero', 'naoussa', 'crete'] },
  { country: 'Luxembourg', keys: ['luxembourg', 'luxemburg', 'moselle luxembourgeoise', 'remich', 'grevenmacher', 'auxerrois luxembourg', 'rivaner'] },
];

const REGION_RULES = [
  { region: 'Bordeaux', keys: ['bordeaux', 'margaux', 'pauillac', 'saint emilion', 'st emilion', 'pomerol', 'medoc', 'haut medoc', 'sauternes', 'pessac leognan', 'graves', 'barsac', 'fronsac'] },
  { region: 'Bourgogne', keys: ['bourgogne', 'chablis', 'beaune', 'gevrey', 'chambertin', 'meursault', 'montrachet', 'nuits saint georges', 'pommard', 'volnay', 'macon', 'givry', 'rully', 'mercurey'] },
  { region: 'Rhône', keys: ['rhone', 'cote rotie', 'hermitage', 'crozes hermitage', 'condrieu', 'chateauneuf du pape', 'gigondas', 'vacqueyras', 'lirac', 'ventoux', 'luberon', 'costières de nimes'] },
  { region: 'Loire', keys: ['loire', 'sancerre', 'pouilly fum', 'chinon', 'saumur', 'vouvray', 'muscadet', 'anjou', 'bourgueil', 'touraine', 'savennieres'] },
  { region: 'Alsace', keys: ['alsace', 'gewurztraminer', 'pinot gris alsace', 'alsace grand cru'] },
  { region: 'Champagne', keys: ['champagne', 'blanc de blancs', 'blanc de noirs', 'brut nature', 'extra brut'] },
  { region: 'Languedoc-Roussillon', keys: ['languedoc', 'roussillon', 'corbieres', 'minervois', 'fitou', 'faugeres', 'pic saint loup', 'saint chinian', 'picpoul', 'muscat de rivesaltes'] },
  { region: 'Provence', keys: ['provence', 'bandol', 'cassis', 'coteaux d aix', 'les baux', 'palette'] },
  { region: 'Beaujolais', keys: ['beaujolais', 'fleurie', 'morgon', 'brouilly', 'moulin a vent', 'julienas', 'regnie', 'saint amour', 'chiroubles', 'chenas'] },
  { region: 'Piémont', keys: ['piemont', 'piemonte', 'barolo', 'barbaresco', 'gavi', 'barbera', 'dolcetto', 'moscato d asti', 'asti'] },
  { region: 'Toscane', keys: ['toscane', 'toscana', 'chianti', 'brunello', 'montalcino', 'bolgheri', 'vino nobile di montepulciano', 'morellino', 'vernaccia'] },
  { region: 'Vénétie', keys: ['venetie', 'veneto', 'amarone', 'valpolicella', 'soave', 'prosecco', 'bardolino', 'pinot grigio veneto'] },
  { region: 'Sicile', keys: ['sicile', 'sicilia', 'etna', 'marsala', 'nero d avola', 'grillo', 'catarratto'] },
  { region: 'Rioja', keys: ['rioja'] },
  { region: 'Ribera del Duero', keys: ['ribera del duero'] },
  { region: 'Priorat', keys: ['priorat'] },
  { region: 'Douro', keys: ['douro', 'porto', 'port'] },
  { region: 'Alentejo', keys: ['alentejo'] },
  { region: 'Mendoza', keys: ['mendoza', 'lujan de cuyo'] },
  // Afrique du Sud
  { region: 'Stellenbosch', keys: ['stellenbosch'] },
  { region: 'Franschhoek', keys: ['franschhoek'] },
  { region: 'Paarl', keys: ['paarl'] },
  { region: 'Swartland', keys: ['swartland'] },
  { region: 'Walker Bay', keys: ['walker bay', 'hemel en aarde'] },
  { region: 'Constantia', keys: ['constantia', 'klein constantia'] },
  { region: 'Elgin', keys: ['elgin south africa'] },
  // Australie
  { region: 'Barossa Valley', keys: ['barossa'] },
  { region: 'Clare Valley', keys: ['clare valley'] },
  { region: 'McLaren Vale', keys: ['mclaren vale'] },
  { region: 'Margaret River', keys: ['margaret river'] },
  { region: 'Yarra Valley', keys: ['yarra valley'] },
  { region: 'Adelaide Hills', keys: ['adelaide hills'] },
  // Nouvelle-Zélande
  { region: 'Marlborough', keys: ['marlborough'] },
  { region: 'Central Otago', keys: ['central otago'] },
  { region: "Hawke's Bay", keys: ['hawkes bay'] },
  // Georgie
  { region: 'Kakheti', keys: ['kakheti'] },
  { region: 'Imereti', keys: ['imereti'] },
  // Luxembourg
  { region: 'Moselle Luxembourgeoise', keys: ['moselle luxembourgeoise', 'luxembourg moselle'] },
];

const AOP_RULES = [
  'aop', 'aoc', 'docg', 'doc', 'igp', 'vin de france', 'vin de pays',
  'saint emilion', 'margaux', 'pauillac', 'pomerol', 'chablis', 'chablis premier cru',
  'chateauneuf du pape', 'gigondas', 'condrieu', 'crozes hermitage', 'cote rotie',
  'sancerre', 'chinon', 'vouvray', 'muscadet', 'champagne', 'cremant de bourgogne',
  'alsace grand cru', 'barolo', 'barbaresco', 'chianti classico', 'brunello di montalcino',
  'amarone della valpolicella', 'valpolicella', 'prosecco', 'rioja', 'ribera del duero',
  'priorat', 'douro', 'dao', 'vinho verde', 'mendoza', 'stellenbosch wo', 'western cape wo'
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalize(text = '') {
  return text.toString().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
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
  if (/(champagne|cremant|prosecco|cava|mousseux|effervescent|pet nat|petillant|schuimwijn|sparkling|cap classique)/.test(haystack)) return 'Effervescent';
  if (/(rose|rosado|rosato|rose wijn|blush)/.test(haystack)) return 'Rosé';
  if (/(blanc|white|bianco|witte wijn|vin blanc|chenin|sauvignon blanc|chardonnay|riesling|viognier|gruner|pinot gris|gewurz|albarino|vermentino|rkatsiteli|assyrtiko|auxerrois|rivaner|gruner veltliner)/.test(haystack)) return 'Blanc';
  if (/(rouge|red|rosso|rode wijn|vin rouge|pinotage|cabernet|syrah|shiraz|merlot|malbec|pinot noir|nebbiolo|sangiovese|tempranillo|grenache|mourvedre|saperavi|xinomavro|blaufrankisch|zweigelt)/.test(haystack)) return 'Rouge';
  return 'Autre';
}

function detectAop(haystack) {
  for (const term of AOP_RULES) {
    if (haystack.includes(normalize(term))) return term.toUpperCase();
  }
  const m = haystack.match(/\b([a-z]{3,}(?:\s+[a-z]{3,}){0,3})\s+(aop|aoc|docg|doc|igp|wo)\b/i);
  if (m) return `${m[1]} ${m[2]}`.replace(/\s+/g, ' ').toUpperCase();
  return 'N/A';
}

function detectWineMeta(product) {
  const haystack = normalize([
    product.title, product.vendor,
    ...(Array.isArray(product.tags) ? product.tags : [(product.tags || '')]),
    product.product_type, product.body_html
  ].join(' '));
  return {
    country: matchFirst(COUNTRY_RULES, haystack, 'France'),
    region: matchFirst(REGION_RULES, haystack, 'Autre'),
    aop: detectAop(haystack),
    type: detectType(haystack)
  };
}

function isWine(product) {
  const title = normalize(product.title || '');
  const productType = normalize(product.product_type || '');
  const tags = normalize((Array.isArray(product.tags) ? product.tags.join(' ') : product.tags) || '');
  const vendor = normalize(product.vendor || '');
  const bag = `${title} ${productType} ${tags} ${vendor}`;

  if (EXCLUDE.some((w) => bag.includes(normalize(w)))) return false;
  if (/(non food|bier|beer|aperitif|spirits|spiritueux|tools|accessoires|accessory)/.test(productType)) return false;
  if (/(masterclass|distillery|lambiek|kombucha|mesamis|arensbak|opius|siegfried|dok brewing|far & son|caribbean cane)/.test(bag)) return false;
  if (/(box|boir-box|themabox|inspiratiebox|degustatiebox|coffret)/.test(title)) return false;

  const hasNonWineHints = NON_WINE_HINTS.some((w) => bag.includes(normalize(w)));
  if (hasNonWineHints) return false;

  if (WINE_PRODUCT_TYPES.has(productType)) return true;
  if (/(wijn|wine|vin|rode wijn|witte wijn|rose wijn|schuimwijn|versterkte wijn|zoete wijn|oranje wijn)/.test(productType)) return true;

  const isKnownWineVendor = KNOWN_WINE_VENDORS.some(v => vendor.includes(normalize(v)));
  if (isKnownWineVendor) return true;

  const looksLikeWine = /(vin|wine|rouge|blanc|rose|champagne|cremant|barolo|chianti|bordeaux|bourgogne|rhone|rioja|douro|prosecco|pinot|cabernet|syrah|shiraz|riesling|sauvignon|nebbiolo|sangiovese|malbec|pinotage|chenin|viognier|chardonnay|tempranillo|grenache|mourvedre|zinfandel|cap classique|stellenbosch|marlborough|mendoza|barossa|saperavi|rkatsiteli|assyrtiko|gruner|blaufrankisch|zweigelt|auxerrois|rivaner)/.test(bag);
  const hasWineVendor = /(domaine|chateau|winery|wines|vineyards|vigneron|estate|cellars|vignerons|cave|mas|clos|bodega|cantina|weingut|quinta)/.test(vendor);

  return looksLikeWine || hasWineVendor;
}

async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(`${BASE_URL}${page}`);
    if (!res.ok) throw new Error(`Erreur Boir.be page ${page}: ${res.status}`);
    const data = await res.json();
    const products = data?.products || [];
    if (!products.length) break;
    all.push(...products);
    console.log(`Page ${page} récupérée (${products.length} produits)`);
    await sleep(DELAY_MS);
  }
  return all;
}

function extractHandlesFromHtml(html) {
  const handles = new Set();
  for (const pattern of [/\/fr\/products\/([a-z0-9-]+)/gi, /\/products\/([a-z0-9-]+)/gi]) {
    let match;
    while ((match = pattern.exec(html)) !== null) handles.add(match[1].toLowerCase());
  }
  return handles;
}

async function fetchCollectionVinHandles() {
  const handles = new Set();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(`${COLLECTION_VIN_URL}${page}`);
    if (!res.ok) throw new Error(`Erreur collection vin page ${page}: ${res.status}`);
    const html = await res.text();
    const pageHandles = extractHandlesFromHtml(html);
    const before = handles.size;
    for (const h of pageHandles) handles.add(h);
    if (page > 1 && handles.size === before) break;
    await sleep(DELAY_MS);
  }
  return handles;
}

function buildReport(catalog) {
  const byCountry = {}, byRegion = {}, byType = {};
  let withAop = 0;
  for (const wine of catalog) {
    byCountry[wine.c] = (byCountry[wine.c] || 0) + 1;
    byRegion[wine.r] = (byRegion[wine.r] || 0) + 1;
    byType[wine.y] = (byType[wine.y] || 0) + 1;
    if (wine.a && wine.a !== 'N/A') withAop++;
  }
  const top = (obj, n = 10) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
  return { total: catalog.length, withAop, byCountry: top(byCountry, 16), byRegion: top(byRegion, 15), byType: top(byType, 10) };
}

async function update() {
  console.log('Démarrage du scraping Boir.be...');
  const all = await fetchAllProducts();
  console.log(`Produits bruts récupérés: ${all.length}`);
  const collectionHandles = await fetchCollectionVinHandles();
  const useCollectionFilter = collectionHandles.size >= 200;
  console.log(`Handles /collections/vin: ${collectionHandles.size} (filtre ${useCollectionFilter ? 'appliqué' : 'ignoré'})`);

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

  const newContent = `export const BOIR_CATALOG = ${JSON.stringify(clean, null, 2)};

export function searchBoirLocal(query) {
  if (!query || query.length < 2) return [];
  const term = query.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, "");

  const score = (wine, q) => {
    const n = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    let pts = 0;
    if (n(wine.t).includes(q)) pts += 80;
    if (n(wine.a).includes(q)) pts += 65;
    if (n(wine.r).includes(q)) pts += 50;
    if (n(wine.c).includes(q)) pts += 40;
    if (n(wine.y).includes(q)) pts += 30;
    if (n(wine.v).includes(q)) pts += 20;
    return pts;
  };

  return BOIR_CATALOG
    .map((w) => ({ w, s: score(w, term) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map(({ w }) => ({ ...w, title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, region: w.r, country: w.c, aop: w.a, type: w.y }));
}

export function getRandomWines(n = 3) {
  return [...BOIR_CATALOG]
    .sort(() => 0.5 - Math.random())
    .slice(0, n)
    .map((w) => ({ ...w, title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, region: w.r, country: w.c, aop: w.a, type: w.y }));
}`;

  let existingContent = '';
  try { existingContent = fs.readFileSync(CATALOG_PATH, 'utf8'); } catch { /* premier run */ }
  const existingCount = (existingContent.match(/"t":/g) || []).length;
  if (existingCount === clean.length) {
    console.log(`Catalogue inchangé (${clean.length} vins). Aucun commit nécessaire.`);
    process.exit(0);
  }

  fs.writeFileSync(CATALOG_PATH, newContent);
  const report = buildReport(clean);
  console.log(`Scraping terminé. ${report.total} vins enregistrés.`);
  console.log(`AOP: ${report.withAop}/${report.total}`);
  console.log('Pays:', report.byCountry);
  console.log('Régions:', report.byRegion);
  console.log('Types:', report.byType);
}

update().catch((err) => { console.error(err); process.exit(1); });
