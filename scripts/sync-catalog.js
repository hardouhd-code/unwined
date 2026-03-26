const fs = require('fs');
const path = require('path');
const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');

async function update() {
  console.log("Démarrage du scan...");
  let all = [];
  try {
    const res = await fetch(`https://boir.be/collections/all/products.json?limit=250`);
    const data = await res.json();
    all = data.products || [];
  } catch (e) { console.error("Erreur Fetch", e); }

  const catalog = all.map(p => ({
    t: p.title, 
    p: parseFloat(p.variants[0]?.price || 0),
    v: p.vendor,
    u: `https://boir.be/fr/products/${p.handle}`,
    img: p.images[0]?.src || '',
    r: "Bordeaux", // Par défaut pour le test
    c: "France"
  }));

  const content = `export const BOIR_CATALOG = ${JSON.stringify(catalog, null, 2)};
export function searchBoirLocal(q) {
  const term = q.toLowerCase();
  return BOIR_CATALOG.filter(w => w.t.toLowerCase().includes(term));
}`;

  fs.writeFileSync(CATALOG_PATH, content);
  console.log("✅ Catalogue généré avec " + catalog.length + " vins.");
}
update();
