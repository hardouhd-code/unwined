const fs = require('fs');
const path = require('path');
const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');

// On dégage tout ce qui n'est pas de la bouteille
const EXCLUDE = ['thermometer', 'kurkentrekker', 'glas', 'shaker', 'cadeaubon', 'ijsemmer', 'karaf', 'label', 'dop', 'gift card', 'jigger', 'strainer', 'muddler', 'cadeautas', 'box', 'ade ', 'spuwemmer', 'degustatie', 'voucher'];

function detect(p) {
  const h = (p.title + ' ' + (p.tags || '') + ' ' + (p.body_html || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  let res = { region: 'Autre', country: 'France' };
  
  // 1. DÉTECTION DU PAYS
  if (h.includes('italie') || h.includes('toscana') || h.includes('piemonte') || h.includes('sicilia') || h.includes('veneto') || h.includes('puglia')) res.country = 'Italie';
  else if (h.includes('espagne') || h.includes('rioja') || h.includes('priorat') || h.includes('ribera')) res.country = 'Espagne';
  else if (h.includes('portugal') || h.includes('douro') || h.includes('alentejo')) res.country = 'Portugal';
  else if (h.includes('argentine') || h.includes('mendoza') || h.includes('malbec')) res.country = 'Argentine';
  else if (h.includes('belgique') || h.includes('belgie')) res.country = 'Belgique';

  // 2. DÉTECTION DE LA RÉGION (Le cerveau expert)
  const RULES = {
    'Bordeaux': ['pomerol', 'emilion', 'medoc', 'margaux', 'pauillac', 'graves', 'pessac', 'sauternes', 'julien', 'estephe', 'bordeaux', 'listrac', 'moulis', 'chateau '],
    'Bourgogne': ['chablis', 'meursault', 'montrachet', 'gevrey', 'pommard', 'volnay', 'nuits', 'beaune', 'macon', 'rully', 'veran', 'bichot', 'morgon', 'brouilly', 'chenas', 'chiroubles', 'fleurie', 'julienas', 'moulin-a-vent', 'regnie', 'saint-amour'],
    'Rhône': ['chateauneuf', 'gigondas', 'hermitage', 'condrieu', 'rotie', 'vacqueyras', 'rasteau', 'lirac', 'ventoux', 'rhone', 'beaumes'],
    'Loire': ['sancerre', 'pouilly', 'chinon', 'saumur', 'vouvray', 'muscadet', 'reuilly', 'loire', 'anjou'],
    'Alsace': ['alsace', 'riesling', 'gewurztraminer', 'pinot gris', 'metz'],
    'Champagne': ['champagne', 'brut', 'extra brut', 'blanc de blancs']
  };

  for (const [reg, keys] of Object.entries(RULES)) {
    if (keys.some(k => h.includes(k))) { 
      res.region = reg; 
      break; 
    }
  }
  return res;
}

async function update() {
  let all = [];
  console.log("Démarrage du scraping complet...");
  
  for (let page = 1; page <= 10; page++) {
    try {
      const res = await fetch(`https://boir.be/collections/all/products.json?limit=250&page=${page}`);
      const data = await res.json();
      if (data.products?.length > 0) {
        all = [...all, ...data.products];
        console.log(`Page ${page} récupérée (${data.products.length} produits)`);
      } else break;
    } catch(e) { break; }
  }
  
  const clean = all.filter(p => {
    const t = p.title.toLowerCase();
    const available = p.variants?.some(v => v.available);
    const notAccessory = !EXCLUDE.some(w => t.includes(w));
    return available && notAccessory;
  }).map(p => {
    const loc = detect(p);
    return {
      t: p.title, 
      p: parseFloat(p.variants[0].price), 
      v: p.vendor, 
      u: `https://boir.be/fr/products/${p.handle}`, 
      img: p.images[0]?.src || "", 
      r: loc.region, 
      c: loc.country 
    };
  });

  const content = `export const BOIR_CATALOG = ${JSON.stringify(clean, null, 2)};

export function searchBoirLocal(query) {
  if (!query || query.length < 2) return [];
  const term = query.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, "");
  return BOIR_CATALOG.filter(w => {
    const content = (w.t + " " + w.r + " " + w.v).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, "");
    return content.includes(term);
  }).map(w => ({ ...w, title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, region: w.r, country: w.c }));
}

export function getRandomWines(n = 3) {
  return [...BOIR_CATALOG].sort(() => 0.5 - Math.random()).slice(0, n).map(w => ({ ...w, title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, region: w.r, country: w.c }));
}`;

  fs.writeFileSync(CATALOG_PATH, content);
  console.log(`Scraping terminé. ${clean.length} vins enregistrés dans le catalogue.`);
}

update();
