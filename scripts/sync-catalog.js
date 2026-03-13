// scripts/sync-catalog.js
// Synchronise le catalogue Boir.be et enrichit les nouveaux vins avec Claude
// Usage: node scripts/sync-catalog.js
// Env: ANTHROPIC_API_KEY

const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../src/lib/boirCatalog.js');
const MODEL = 'claude-sonnet-4-5-20251001'; // Nom officiel API — claude-sonnet-4-5
const BATCH_SIZE = 10; // Vins par appel Claude
const MAX_NEW_PER_RUN = 20; // Enrichis par Claude par nuit (les autres sont gardés bruts)
const DELAY_MS = 500; // Entre les appels API

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Helpers ────────────────────────────────────────────────────────────────

function inferType(name, productType) {
  const n = (name + ' ' + (productType || '')).toLowerCase();
  if (n.includes('rosé') || n.includes('rose') && (n.includes('tavel') || n.includes('bandol') || n.includes('provence'))) return 'rosé';
  if (n.includes('champagne') || n.includes('crémant') || n.includes('cremant') || n.includes('prosecco') || n.includes('cava') || n.includes('pétillant') || n.includes('petillant') || n.includes('brut') || n.includes('blanc de blancs')) return 'effervescent';
  if (n.includes('sauternes') || n.includes('barsac') || n.includes('vendanges tardives') || n.includes('vin jaune') || n.includes('madeira') || n.includes('tawny') || n.includes('port') || n.includes('muscat') || n.includes('bual') || n.includes('layon')) return 'doux';
  const whiteKeys = ['blanc','chardonnay','sauvignon blanc','riesling','gewürztraminer','viognier','pinot gris','pinot grigio','meursault','chablis','pouilly','muscadet','soave','alvarinho','albariño','albarino','gavi','lugana','falanghina','catarratto','apremont','savagnin','grüner','gruner','veltliner','condrieu','roussanne'];
  if (whiteKeys.some(k => n.includes(k)) && !n.includes('rouge')) return 'blanc';
  return 'rouge';
}

function inferCountry(name, vendor) {
  const n = (name + ' ' + (vendor || '')).toLowerCase();
  if (['barolo','barbaresco','brunello','chianti','amarone','valpolicella','soave','lugana','gavi','falanghina','aglianico','montepulciano','salento','bolgheri','toscana','dolcetto','nebbiolo','nizza','langhe'].some(k => n.includes(k))) return 'Italie';
  if (['rioja','ribera','priorat','cava','albariño','albarino','lafou','finca museum','el coto','marqués de vargas'].some(k => n.includes(k))) return 'Espagne';
  if (['malbec','atamisque','catena','argento','escorihuela','mendoza'].some(k => n.includes(k))) return 'Argentine';
  if (['kanonkop','saronsberg','sutherland','thelema','stellenbosch'].some(k => n.includes(k))) return 'Afrique du Sud';
  if (['rapaura','marlborough'].some(k => n.includes(k))) return 'Nouvelle-Zélande';
  if (['cono sur','emiliana','perez cruz'].some(k => n.includes(k))) return 'Chili';
  if (['rheingau','rüdesheim','corvers'].some(k => n.includes(k))) return 'Allemagne';
  if (['winzer krems','allram','grüner veltliner','gruner','zweigelt','krems'].some(k => n.includes(k))) return 'Autriche';
  if (['quinta do noval','casal amado','cossart gordon','madeira','porto','port'].some(k => n.includes(k))) return 'Portugal';
  if (['raymond vineyards','dry creek','fog mountain','california'].some(k => n.includes(k))) return 'États-Unis';
  return 'France';
}

function inferRegion(name) {
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // ── France ──────────────────────────────────────────────────────────────────
  if (['pauillac','margaux','saint-estephe','saint estephe','saint-julien','saint julien',
       'listrac','moulis','haut-medoc','haut medoc','medoc','pessac-leognan','pessac leognan',
       'graves','sauternes','barsac','saint-emilion','saint emilion','st-emilion','st emilion',
       'pomerol','fronsac','canon-fronsac','cotes de bourg','blaye','entre-deux-mers',
       'bordeaux'].some(k => n.includes(k))) return 'Bordeaux';

  if (['chablis','meursault','puligny','chassagne','montrachet','beaune','pommard','volnay',
       'nuits-saint-georges','nuits saint georges','gevrey','chambolle','vosne','morey',
       'aloxe','corton','santenay','macon','pouilly-fuisse','pouilly fuisse',
       'saint-veran','saint veran','mercurey','givry','rully','montagny','bouzeron',
       'bourgogne','burgundy'].some(k => n.includes(k))) return 'Bourgogne';

  if (['chateauneuf-du-pape','chateauneuf du pape','hermitage','crozes-hermitage',
       'crozes hermitage','cote-rotie','cote rotie','condrieu','gigondas','vacqueyras',
       'lirac','tavel','luberon','ventoux','costieres','saint-joseph','saint joseph',
       'cornas','rasteau','cairanne','cotes du rhone','rhone'].some(k => n.includes(k))) return 'Rhône';

  if (['sancerre','pouilly-fume','pouilly fume','menetou','quincy',
       'chinon','bourgueil','saumur','anjou','muscadet',
       'vouvray','montlouis','touraine','layon','savennieres','loire'].some(k => n.includes(k))) return 'Loire';

  if (['alsace','gewurztraminer','gewurz','cremant d alsace'].some(k => n.includes(k))) return 'Alsace';

  if (['champagne','reims','epernay','blanc de blancs','blanc de noirs'].some(k => n.includes(k))) return 'Champagne';

  if (['cremant de bourgogne','cremant du jura','cremant de loire','cremant de bordeaux'].some(k => n.includes(k))) return 'Crémant';

  if (['cotes du jura','cotes de jura','jura','vin jaune','arbois','savagnin','poulsard','trousseau'].some(k => n.includes(k))) return 'Jura';

  if (['apremont','abymes','savoie','roussette','mondeuse','bugey','cerdon'].some(k => n.includes(k))) return 'Savoie';

  if (['languedoc','roussillon','minervois','corbieres','faugeres','saint-chinian','saint chinian',
       'fitou','pic saint loup','terrasses du larzac','la clape','picpoul','limoux','blanquette'].some(k => n.includes(k))) return 'Languedoc-Roussillon';

  if (['bandol','cassis','palette','les baux','coteaux d aix','cotes de provence','provence'].some(k => n.includes(k))) return 'Provence';

  if (['cahors','bergerac','monbazillac','madiran','jurancon','irouleguy','gaillac',
       'marcillac','fronton','buzet','sud-ouest'].some(k => n.includes(k))) return 'Sud-Ouest';

  if (['morgon','fleurie','moulin-a-vent','moulin a vent','brouilly','chiroubles','julienas',
       'saint-amour','chenas','regnie','beaujolais'].some(k => n.includes(k))) return 'Beaujolais';

  if (['patrimonio','ajaccio','corse'].some(k => n.includes(k))) return 'Corse';

  // ── Italie ──────────────────────────────────────────────────────────────────
  if (['barolo','barbaresco','langhe','barbera d asti','barbera d alba','dolcetto',
       'moscato d asti','gavi','roero','nizza','monferrato','piemonte'].some(k => n.includes(k))) return 'Piémont';

  if (['chianti','brunello','vino nobile','morellino','bolgheri','toscana','tuscany'].some(k => n.includes(k))) return 'Toscane';

  if (['amarone','valpolicella','soave','ripasso','lugana','bardolino','prosecco','veneto'].some(k => n.includes(k))) return 'Vénétie';

  if (['aglianico','taurasi','greco di tufo','fiano','falanghina','campania'].some(k => n.includes(k))) return 'Campanie';

  if (['nero d avola','etna','marsala','grillo','catarratto','sicilia','sicile'].some(k => n.includes(k))) return 'Sicile';

  if (['primitivo','negroamaro','salento','puglia'].some(k => n.includes(k))) return 'Pouilles';

  if (['montepulciano d abruzzo','abruzzo'].some(k => n.includes(k))) return 'Abruzzes';

  if (['cannonau','vermentino sardegna','sardegna','sardaigne'].some(k => n.includes(k))) return 'Sardaigne';

  // ── Espagne ──────────────────────────────────────────────────────────────────
  if (['rioja'].some(k => n.includes(k))) return 'Rioja';
  if (['ribera del duero','ribera duero'].some(k => n.includes(k))) return 'Ribera del Duero';
  if (['priorat','priorato'].some(k => n.includes(k))) return 'Priorat';
  if (['rias baixas','albarino'].some(k => n.includes(k))) return 'Rías Baixas';
  if (['rueda','verdejo'].some(k => n.includes(k))) return 'Rueda';
  if (['jerez','sherry','manzanilla','fino'].some(k => n.includes(k))) return 'Jerez';
  if (['cava'].some(k => n.includes(k))) return 'Cava';

  // ── Portugal ────────────────────────────────────────────────────────────────
  if (['port','porto','tawny','ruby port','vintage port','lbv'].some(k => n.includes(k))) return 'Porto';
  if (['douro','quinta'].some(k => n.includes(k))) return 'Douro';
  if (['alentejo'].some(k => n.includes(k))) return 'Alentejo';
  if (['vinho verde','alvarinho'].some(k => n.includes(k))) return 'Vinho Verde';
  if (['madeira','bual','malmsey','sercial'].some(k => n.includes(k))) return 'Madère';

  // ── Autriche ─────────────────────────────────────────────────────────────────
  if (['wachau','kamptal','kremstal'].some(k => n.includes(k))) return 'Basse-Autriche';
  if (['burgenland','neusiedlersee'].some(k => n.includes(k))) return 'Burgenland';
  if (['gruner veltliner','zweigelt','blaufrankisch'].some(k => n.includes(k))) return 'Autriche';

  // ── Allemagne ────────────────────────────────────────────────────────────────
  if (['mosel','moselle'].some(k => n.includes(k))) return 'Moselle';
  if (['rheingau','rheinhessen','pfalz','nahe','franken','spatburgunder'].some(k => n.includes(k))) return 'Allemagne';

  // ── Afrique du Sud ───────────────────────────────────────────────────────────
  if (['stellenbosch','franschhoek','paarl','swartland','constantia','walker bay','elgin'].some(k => n.includes(k))) return 'Stellenbosch';

  // ── Nouvelle-Zélande ─────────────────────────────────────────────────────────
  if (['marlborough','central otago','hawke','martinborough'].some(k => n.includes(k))) return 'Nouvelle-Zélande';

  // ── Chili ────────────────────────────────────────────────────────────────────
  if (['maipo','colchagua','cachapoal','casablanca valley','limari'].some(k => n.includes(k))) return 'Chili';

  // ── Argentine ────────────────────────────────────────────────────────────────
  if (['mendoza','lujan de cuyo','uco valley','salta','patagonie','patagonia'].some(k => n.includes(k))) return 'Mendoza';

  // ── États-Unis ───────────────────────────────────────────────────────────────
  if (['napa','sonoma','russian river','paso robles','santa barbara','willamette',
       'california','californie'].some(k => n.includes(k))) return 'États-Unis';

  // ── Autres ───────────────────────────────────────────────────────────────────
  if (['tokaj','tokay','eger','villany'].some(k => n.includes(k))) return 'Hongrie';
  if (['santorini','naoussa','nemea','assyrtiko'].some(k => n.includes(k))) return 'Grèce';
  if (['bekaa','musar','ksara'].some(k => n.includes(k))) return 'Liban';
  if (['saperavi','rkatsiteli'].some(k => n.includes(k))) return 'Géorgie';

  return '';
}




async function fetchBoirCatalog() {
  console.log('🍇 Récupération du catalogue Boir.be...');
  let allProducts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `https://boir.be/collections/all/products.json?limit=250&page=${page}`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Unwine-D/4.0 catalog-sync' }
      });
      if (!res.ok) {
        console.warn(`⚠ Page ${page}: HTTP ${res.status}, arrêt pagination`);
        hasMore = false;
        break;
      }
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        allProducts = [...allProducts, ...data.products];
        console.log(`  Page ${page}: ${data.products.length} produits (total: ${allProducts.length})`);
        page++;
        if (data.products.length < 250) hasMore = false;
      } else {
        hasMore = false;
      }
    } catch (err) {
      console.error(`❌ Erreur page ${page}:`, err.message);
      hasMore = false;
    }
    await sleep(300);
  }

  console.log(`✅ ${allProducts.length} produits récupérés sur Boir.be`);
  return allProducts;
}

// ─── Enrichissement Claude ───────────────────────────────────────────────────

async function enrichBatchWithClaude(batch) {
  const wineList = batch.map((w, i) => `${i + 1}. "${w.t}" (${w.y || 'N/A'}, ${w.country})`).join('\n');

  const prompt = `Tu es sommelier expert. Pour chaque vin ci-dessous, retourne UNIQUEMENT un tableau JSON valide.
Chaque objet doit avoir exactement ces clés:
- "grapes": cépages principaux (max 3, séparés par ", ")
- "aromas": 3-4 arômes clés en français (ex: "cerise noire, vanille, épices")
- "pairings": 2-3 accords mets courts (ex: "agneau, fromages affinés")
- "service": température de service (ex: "16-18°C")
- "aging": potentiel de garde (ex: "5-10 ans" ou "À boire")
- "profile": UN adjectif parmi: léger/fruité/charnu/épicé/minéral/complexe/doux/pétillant

Vins:
${wineList}

Réponds UNIQUEMENT avec le tableau JSON, sans texte avant ou après, sans balises markdown.`;

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

  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.content[0].text.trim().replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

async function enrichNewWines(wines) {
  if (wines.length === 0) {
    console.log('✨ Aucun nouveau vin à enrichir.');
    return [];
  }
  console.log(`🧠 Enrichissement de ${wines.length} nouveaux vins avec Claude...`);

  const results = [];
  const batches = [];
  for (let i = 0; i < wines.length; i += BATCH_SIZE) {
    batches.push(wines.slice(i, i + BATCH_SIZE));
  }

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    console.log(`  Batch ${bi + 1}/${batches.length} (${batch.length} vins)...`);
    try {
      const enrichments = await enrichBatchWithClaude(batch);
      batch.forEach((w, i) => {
        const e = enrichments[i] || {};
        results.push({
          ...w,
          grapes: e.grapes || '',
          aromas: e.aromas || '',
          pairings: e.pairings || '',
          service: e.service || '',
          aging: e.aging || '',
          profile: e.profile || ''
        });
      });
      console.log(`  ✅ Batch ${bi + 1} enrichi`);
    } catch (err) {
      console.error(`  ❌ Batch ${bi + 1} échoué:`, err.message);
      batch.forEach(w => results.push({ ...w, grapes: '', aromas: '', pairings: '', service: '', aging: '', profile: '' }));
    }
    if (bi < batches.length - 1) await sleep(DELAY_MS);
  }

  return results;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function updateCatalog() {
  console.log('\n🍷 Unwine-D — Synchronisation catalogue Boir.be');
  console.log('='.repeat(50));

  // 1. Charger l'ancien catalogue
  let oldCatalog = [];
  if (fs.existsSync(CATALOG_PATH)) {
    try {
      const content = fs.readFileSync(CATALOG_PATH, 'utf8');
      // Extraction du JSON depuis le fichier JS
      const match = content.match(/export const BOIR_CATALOG = (\[[\s\S]*?\]);/);
      if (match) {
        oldCatalog = JSON.parse(match[1]);
        console.log(`📚 Catalogue existant: ${oldCatalog.length} vins`);
      }
    } catch (err) {
      console.warn('⚠ Impossible de charger l\'ancien catalogue:', err.message);
    }
  }

  const existingUrls = new Set(oldCatalog.map(w => w.u));

  // 2. Récupérer Boir.be
  const rawProducts = await fetchBoirCatalog();

  // 3. Tout garder sauf les accessoires
  const allWines = rawProducts
    .filter(p => {
      const n = (p.title || '').toLowerCase();
      const isAccessory = ['bouchon','tire-bouchon','carafe','verre','stopper','dop','klem'].some(k => n.includes(k));
      const inStock = p.variants && p.variants.some(v => v.available);
      return inStock && !isAccessory;
    })
    .map(p => ({
      t: p.title,
      y: '',
      p: p.variants[0]?.price ? parseFloat(p.variants[0].price) : 0,
      v: p.vendor || '',
      u: `https://boir.be/fr/products/${p.handle}`,
      img: p.images[0]?.src || null,
      c: inferCountry(p.title, p.vendor),
      r: inferRegion(p.title),
      type: inferType(p.title, p.product_type),
      grapes: '', aromas: '', pairings: '', service: '', aging: '', profile: ''
    }));

  console.log(`🍾 ${allWines.length} vins en stock sur Boir.be`);

  // 4. Identifier les nouveaux
  const newWines = allWines.filter(w => !existingUrls.has(w.u));
  const existingInStock = oldCatalog.filter(w => allWines.some(nw => nw.u === w.u));
  console.log(`🆕 ${newWines.length} nouveaux vins (${Math.min(newWines.length, MAX_NEW_PER_RUN)} enrichis par Claude)`);
  console.log(`🔄 ${existingInStock.length} vins existants conservés`);

  // 5. Enrichir seulement les 20 premiers nouveaux, garder les autres sans enrichissement
  const toEnrich    = newWines.slice(0, MAX_NEW_PER_RUN);
  const toKeepRaw   = newWines.slice(MAX_NEW_PER_RUN); // conservés sans IA

  let enrichedNew = [];
  if (process.env.ANTHROPIC_API_KEY && toEnrich.length > 0) {
    enrichedNew = await enrichNewWines(toEnrich);
  } else {
    enrichedNew = toEnrich;
  }

  // 6. Fusionner: enrichis + bruts + anciens en stock = catalogue complet
  const finalCatalog = [...enrichedNew, ...toKeepRaw, ...existingInStock];

  // 7. Générer la fonction de recherche et écrire le fichier
  const searchFn = `
export function searchBoirLocal(query, limit = 12) {
  if (!query || query.length < 2) return [];
  const terms = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .split(/\\s+/)
    .filter(t => t.length > 1);
  return BOIR_CATALOG
    .map(w => {
      const hay = [w.t, w.v, w.c, w.r, w.grapes, w.aromas, w.type, w.profile, w.pairings]
        .join(' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '');
      const score = terms.reduce((s, t) => s + (hay.includes(t) ? 2 : 0), 0);
      return { ...w, score };
    })
    .filter(w => w.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score, ...w }) => ({
      title: w.t,
      year: w.y,
      price: w.p,
      vendor: w.v,
      url: w.u,
      image: w.img,
      country: w.c,
      region: w.r,
      type: w.type,
      grapes: w.grapes,
      aromas: w.aromas,
      pairings: w.pairings,
      service: w.service,
      aging: w.aging,
      profile: w.profile
    }));
}`;

  const fileContent = `// Boir.be catalog — auto-generated ${new Date().toISOString()}
// ${finalCatalog.length} vins en stock
// Ne pas modifier manuellement — fichier géré par scripts/sync-catalog.js
export const BOIR_CATALOG = ${JSON.stringify(finalCatalog, null, 2)};
${searchFn}
`;

  // Créer le dossier si nécessaire
  const dir = path.dirname(CATALOG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(CATALOG_PATH, fileContent, 'utf8');

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Catalogue mis à jour: ${finalCatalog.length} vins`);
  console.log(`   → ${enrichedNew.filter(w => w.grapes).length} nouveaux enrichis par Claude`);
  console.log(`   → Fichier: ${CATALOG_PATH}`);
}

updateCatalog().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
