const fs = require('fs');
const path = require('path');
const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ON AJOUTE TOUTES LES RÉGIONS ICI POUR QUE LE SCRIPT LES RECONNAISSE
const REGIONS_MAP = {
  'Bordeaux': ['pomerol', 'saint-emilion', 'medoc', 'margaux', 'pauillac', 'graves', 'pessac', 'sauternes', 'saint-julien', 'saint-estephe', 'fronsac', 'moulis', 'listrac'],
  'Bourgogne': ['chablis', 'meursault', 'montrachet', 'gevrey', 'pommard', 'volnay', 'nuits-saint-georges', 'beaune', 'macon'],
  'Rhône': ['chateauneuf', 'gigondas', 'hermitage', 'condrieu', 'cote-rotie', 'vacqueyras', 'saint-joseph', 'cornas'],
  'Loire': ['sancerre', 'pouilly-fume', 'chinon', 'saumur', 'vouvray', 'muscadet'],
  'Alsace': ['alsace', 'riesling', 'gewurztraminer'],
  'Champagne': ['champagne', 'bulle'],
  'Piémont': ['piemonte', 'barolo', 'barbaresco', 'nebbiolo', 'asti'],
  'Toscane': ['toscana', 'brunello', 'chianti', 'bolgheri', 'sassicaia', 'tignanello'],
  'Sicile': ['sicilia', 'etna', 'nerello'],
  'Vénétie': ['veneto', 'amarone', 'valpolicella', 'prosecco'],
  'Rioja': ['rioja'],
  'Ribera del Duero': ['ribera'],
  'Douro': ['douro', 'porto']
};

const COUNTRY_MAP = {
  'Italie': ['italie', 'toscana', 'piemonte', 'sicilia', 'veneto', 'abruzzo', 'campania'],
  'Espagne': ['espagne', 'rioja', 'ribera', 'priorat', 'jerez'],
  'Portugal': ['portugal', 'douro', 'alentejo'],
  'Afrique du Sud': ['afrique du sud', 'stellenbosch'],
  'Argentine': ['argentine', 'mendoza'],
  'Chili': ['chili', 'casablanca'],
  'États-Unis': ['usa', 'californie', 'napa', 'oregon'],
  'Allemagne': ['allemagne', 'mosel', 'rheingau'],
  'Autriche': ['autriche', 'wachau']
};

function detectLocation(p) {
  const tags = Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '');
  const hay = (p.title + ' ' + tags + ' ' + (p.vendor || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let res = { region: 'Autre', country: 'France' };

  for (const [c, keys] of Object.entries(COUNTRY_MAP)) {
    if (keys.some(k => hay.includes(k))) { res.country = c; break; }
  }
  for (const [r, subs] of Object.entries(REGIONS_MAP)) {
    if (subs.some(s => hay.includes(s)) || hay.includes(r.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
      res.region = r;
      // Si c'est une région française connue, on force France
      if (['Bordeaux','Bourgogne','Rhône','Loire','Alsace','Champagne'].includes(r)) res.country = 'France';
      break;
    }
  }
  return res;
}

async function update() {
  let all = []; let page = 1; let more = true;
  while (more) {
    try {
      const res = await fetch(`https://boir.be/collections/all/products.json?limit=250&page=${page}`);
      const data = await res.json();
      if (data.products?.length > 0) { all = [...all, ...data.products]; page++; } else { more = false; }
      await sleep(200);
    } catch(e) { more = false; }
  }
  
  const catalog = all.filter(p => {
    const isAcc = ['bouchon','verre','glas','spuwemmer','carafe','sac','etui'].some(k => p.title.toLowerCase().includes(k));
    return p.variants?.some(v => v.available) && !isAcc;
  }).map(p => {
    const loc = detectLocation(p);
    return {
      t: p.title, p: parseFloat(p.variants[0].price), v: p.vendor,
      u: `https://boir.be/fr/products/${p.handle}`, img: p.images[0]?.src || null,
      r: loc.region, c: loc.country
    };
  });

  const content = `export const BOIR_CATALOG = ${JSON.stringify(catalog, null, 2)};
export function searchBoirLocal(query) {
  if (!query || query.length < 2) return [];
  const term = query.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
  return BOIR_CATALOG.filter(w => {
    const hay = (w.t + " " + w.r + " " + w.c + " " + w.v).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    return hay.includes(term);
  }).map(w => ({ ...w, title: w.t, price: w.p, vendor: w.v, url: w.u, image: w.img, region: w.r, country: w.c }));
}`;

  fs.writeFileSync(CATALOG_PATH, content);
}
update();
