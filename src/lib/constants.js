const C = {
  bg:       "#F2EBE0",   // beige chaud fond principal
  bgDeep:   "#E8DDD0",   // beige légèrement plus foncé (cards)
  bgCard:   "#FFFFFF",   // cartes blanches
  bgMuted:  "rgba(139,90,60,0.07)",
  border:   "rgba(180,120,80,0.22)",
  borderAct:"rgba(200,100,65,0.55)",
  terra:    "#C8503A",   // terracota principal
  terraL:   "#E07055",   // terracota clair
  terraD:   "#9B3A26",   // terracota foncé
  gold:     "#B8862A",   // or ambré
  goldL:    "#D4A84B",
  cream:    "#3D2B1A",   // texte principal (brun foncé sur fond clair)
  muted:    "rgba(61,43,26,0.55)",
  subtext:  "rgba(61,43,26,0.72)",
  faint:    "rgba(61,43,26,0.06)",
  sauge:    "#5C8A3C",
  saugeL:   "#7AAD56",
  accent:   "#8B5A3C",   // brun terracota accent
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
  html,body{background:#F2EBE0;overscroll-behavior:none;-webkit-overflow-scrolling:touch;}
  button{border:none;background:none;cursor:pointer;touch-action:manipulation;}
  button:focus,input:focus,select:focus,textarea:focus{outline:none;}
  ::-webkit-scrollbar{width:0;}
  input::placeholder,textarea::placeholder{color:rgba(61,43,26,0.35);}
  select option{background:#F2EBE0;color:#3D2B1A;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
  @keyframes shimmer{0%,100%{opacity:.5}50%{opacity:1}}
`;

/* ═══════════════════════════════════════════════════════════════
   DATA

const COUNTRIES = {
  "France":{flag:"🇫🇷",regions:["Bordeaux","Bourgogne","Rhône","Loire","Alsace","Champagne","Provence","Languedoc-Roussillon","Sud-Ouest","Beaujolais","Jura","Savoie","Corse"]},
  "Italie":{flag:"🇮🇹",regions:["Toscane","Piémont","Vénétie","Sicile","Campanie","Ombrie","Lombardie","Sardaigne","Puglia"]},
  "Espagne":{flag:"🇪🇸",regions:["Rioja","Priorat","Ribera del Duero","Galice","Jerez","Cava","Catalogne","Castille"]},
  "Portugal":{flag:"🇵🇹",regions:["Douro","Alentejo","Vinho Verde","Dão","Bairrada","Setúbal"]},
  "Allemagne":{flag:"🇩🇪",regions:["Moselle","Rheingau","Pfalz","Bade","Franconie","Rheinhessen"]},
  "Argentine":{flag:"🇦🇷",regions:["Mendoza","Salta","Patagonie","San Juan","La Rioja"]},
  "Chili":{flag:"🇨🇱",regions:["Maipo","Colchagua","Casablanca","Maule","Aconcagua"]},
  "Australie":{flag:"🇦🇺",regions:["Barossa Valley","McLaren Vale","Margaret River","Yarra Valley","Clare Valley"]},
  "Afrique du Sud":{flag:"🇿🇦",regions:["Stellenbosch","Swartland","Franschhoek","Paarl","Walker Bay"]},
  "États-Unis":{flag:"🇺🇸",regions:["Napa Valley","Sonoma","Willamette Valley","Central Coast","Washington State"]},
  "Nouvelle-Zélande":{flag:"🇳🇿",regions:["Marlborough","Hawke's Bay","Central Otago","Martinborough"]},
  "Grèce":{flag:"🇬🇷",regions:["Santorin","Péloponnèse","Macédoine","Crète","Thessalie"]},
  "Autre":{flag:"🌍",regions:["Géorgie","Autriche","Hongrie","Slovénie","Liban","Israël","Japon","Maroc","Autre"]},
};

const WINE_TYPES = [
  {id:"rouge",   label:"Rouge",    emoji:"🍷", color:"#C8503A", light:"rgba(200,80,58,.15)"},
  {id:"blanc",   label:"Blanc",    emoji:"🥂", color:"#B8862A", light:"rgba(184,134,42,.12)"},
  {id:"rose",    label:"Rosé",     emoji:"🌸", color:"#D4607A", light:"rgba(212,96,122,.12)"},
  {id:"mousseux",label:"Mousseux", emoji:"🍾", color:"#7A9B5C", light:"rgba(122,155,92,.12)"},
  {id:"autre",   label:"Autre",    emoji:"🫗", color:"#8B5A3C", light:"rgba(139,90,60,.12)"},
];

// Grande base de suggestions — 30 vins pour la rotation
const SUGGESTIONS_DB = [
  {name:"Château Pichon Baron",country:"France",region:"Bordeaux",type:"rouge",year:2016,producer:"AXA Millésimes",why:"Deuxième Grand Cru Classé d'une précision remarquable — cassis, crayon, structure irréprochable.",grapes:"Cabernet Sauvignon, Merlot",price_range:"80-120€"},
  {name:"Sancerre Rouge Henri Bourgeois",country:"France",region:"Loire",type:"rouge",year:2021,producer:"Henri Bourgeois",why:"Un Pinot Noir de Loire frais et minéral, aux arômes de framboise et de silex — rare et délicieux.",grapes:"Pinot Noir",price_range:"25-35€"},
  {name:"Penfolds Bin 389",country:"Australie",region:"Barossa Valley",type:"rouge",year:2020,producer:"Penfolds",why:"Un Shiraz/Cabernet de légende, surnommé le 'bébé Grange'. Opulent, épicé, inoubliable.",grapes:"Shiraz, Cabernet Sauvignon",price_range:"55-75€"},
  {name:"Tignanello",country:"Italie",region:"Toscane",type:"rouge",year:2019,producer:"Antinori",why:"Le Super-Toscan original. Sangiovese + Cabernet = élégance et puissance réunies.",grapes:"Sangiovese, Cabernet",price_range:"90-130€"},
  {name:"Vega Sicilia Unico",country:"Espagne",region:"Ribera del Duero",type:"rouge",year:2012,producer:"Vega Sicilia",why:"Le vin espagnol le plus mythique — élevé 10 ans, tabac, cerise noire, temps suspendu.",grapes:"Tempranillo, Cabernet",price_range:"200-350€"},
  {name:"Ornellaia",country:"Italie",region:"Toscane",type:"rouge",year:2018,producer:"Marchesi de' Frescobaldi",why:"La réponse italienne aux grands Bordeaux. Cassis, graphite, cèdre — une nuit à la mer en bouteille.",grapes:"Cabernet Sauvignon, Merlot",price_range:"120-180€"},
  {name:"Chablis Premier Cru Montée de Tonnerre",country:"France",region:"Bourgogne",type:"blanc",year:2021,producer:"Domaine Pinson",why:"La minéralité la plus pure de Chablis — iode, silex, citron zesté. Un blanc d'une tension rare.",grapes:"Chardonnay",price_range:"30-45€"},
  {name:"Barolo Brunate",country:"Italie",region:"Piémont",type:"rouge",year:2017,producer:"Giuseppe Rinaldi",why:"Tannins de soie, rose séchée, éternité. Le Roi des vins italiens dans sa plénitude.",grapes:"Nebbiolo",price_range:"80-120€"},
  {name:"Riesling Clos Sainte Hune",country:"France",region:"Alsace",type:"blanc",year:2020,producer:"Trimbach",why:"Peut-être le plus grand Riesling de France — citron confit, minéralité de cristal, longévité infinie.",grapes:"Riesling",price_range:"90-140€"},
  {name:"Amarone della Valpolicella",country:"Italie",region:"Vénétie",type:"rouge",year:2016,producer:"Allegrini",why:"Né de raisins séchés — concentration extrême, chocolat noir, cerise à l'eau-de-vie. Un vin hors du temps.",grapes:"Corvina, Rondinella",price_range:"55-80€"},
  {name:"Cloudy Bay Sauvignon Blanc",country:"Nouvelle-Zélande",region:"Marlborough",type:"blanc",year:2023,producer:"Cloudy Bay",why:"L'archétype du Sauvignon néo-zélandais — fruits de la passion, agrumes vifs, fraîcheur absolue.",grapes:"Sauvignon Blanc",price_range:"20-30€"},
  {name:"Sassicaia",country:"Italie",region:"Toscane",type:"rouge",year:2018,producer:"Tenuta San Guido",why:"Le premier Super-Toscan de l'histoire. Cabernet de Bolgheri à son apogée absolu.",grapes:"Cabernet Sauvignon, Cabernet Franc",price_range:"150-220€"},
  {name:"Priorat Clos Mogador",country:"Espagne",region:"Priorat",type:"rouge",year:2019,producer:"René Barbier",why:"Les ardoises noires de la Llicorella donnent à la Garnacha une profondeur minérale unique au monde.",grapes:"Grenache, Syrah, Cabernet",price_range:"45-65€"},
  {name:"Gewurztraminer Vendanges Tardives",country:"France",region:"Alsace",type:"blanc",year:2019,producer:"Hugel",why:"Un parfum liquide — rose, litchi, gingembre confit. Envoûtant, presque mystique.",grapes:"Gewurztraminer",price_range:"40-60€"},
  {name:"Château d'Yquem",country:"France",region:"Bordeaux",type:"blanc",year:2015,producer:"LVMH",why:"Le Sauternes absolu. Miel, abricot confit, safran — une bouteille pour l'éternité.",grapes:"Sémillon, Sauvignon Blanc",price_range:"300-600€"},
  {name:"Brunello di Montalcino Riserva",country:"Italie",region:"Toscane",type:"rouge",year:2015,producer:"Biondi-Santi",why:"Le vin du siècle toscan — austère et grandiose, il récompense une décennie de patience.",grapes:"Sangiovese Grosso",price_range:"180-300€"},
  {name:"Château Rayas",country:"France",region:"Rhône",type:"rouge",year:2017,producer:"Emmanuel Reynaud",why:"Le Grenache à son sommet. Châteauneuf-du-Pape d'une pureté et d'une profondeur légendaires.",grapes:"Grenache",price_range:"200-400€"},
  {name:"Condrieu La Doriane",country:"France",region:"Rhône",type:"blanc",year:2022,producer:"E. Guigal",why:"La Viognier dans toute sa splendeur — abricot frais, violette, rondeur solaire du couloir rhodanien.",grapes:"Viognier",price_range:"50-70€"},
  {name:"Domaine Weinbach Schlossberg Grand Cru",country:"France",region:"Alsace",type:"blanc",year:2020,producer:"Domaine Weinbach",why:"Sur le granit du Schlossberg, le Riesling atteint une élégance aristocratique et une tension remarquable.",grapes:"Riesling",price_range:"55-80€"},
  {name:"Château Léoville-Las Cases",country:"France",region:"Bordeaux",type:"rouge",year:2014,producer:"Delon",why:"Le 'Super-Second' bordelais par excellence — structure de fer, fruits noirs intenses, garde exceptionnelle.",grapes:"Cabernet Sauvignon, Merlot",price_range:"120-180€"},
  {name:"Pingus",country:"Espagne",region:"Ribera del Duero",type:"rouge",year:2018,producer:"Peter Sisseck",why:"La biodynamie au service du Tempranillo — concentré, velouté, d'une profondeur qui laisse sans voix.",grapes:"Tempranillo",price_range:"250-400€"},
  {name:"Cune Imperial Gran Reserva",country:"Espagne",region:"Rioja",type:"rouge",year:2015,producer:"CVNE",why:"Vanille, fraise confite, cuir fin — la Rioja traditionnelle à son meilleur, abordable et majestueuse.",grapes:"Tempranillo",price_range:"30-45€"},
  {name:"Domaine de la Romanée-Conti Echézeaux",country:"France",region:"Bourgogne",type:"rouge",year:2019,producer:"DRC",why:"Un Grand Cru bourguignon d'une finesse absolue — cerise, épices douces, longeur infinie en bouche.",grapes:"Pinot Noir",price_range:"600-1200€"},
  {name:"Quinta do Crasto Reserva",country:"Portugal",region:"Douro",type:"rouge",year:2018,producer:"Quinta do Crasto",why:"Sur les schistes du Douro — fruits noirs concentrés, tanins soyeux, une profondeur à prix doux.",grapes:"Touriga Nacional, Tinta Roriz",price_range:"18-28€"},
  {name:"Masi Costasera Amarone",country:"Italie",region:"Vénétie",type:"rouge",year:2017,producer:"Masi",why:"L'Amarone accessible — chocolat, prune sèche, notes boisées élégantes. Un monument à portée de cave.",grapes:"Corvina, Rondinella, Molinara",price_range:"35-55€"},
  {name:"Cullen Diana Madeline",country:"Australie",region:"Margaret River",type:"rouge",year:2019,producer:"Cullen Wines",why:"Le Bordeaux australien biodynamique — cabernet de Margaret River d'une précision et d'une fraîcheur rares.",grapes:"Cabernet Sauvignon, Merlot",price_range:"80-120€"},
  {name:"Caymus Cabernet Sauvignon",country:"États-Unis",region:"Napa Valley",type:"rouge",year:2021,producer:"Caymus Vineyards",why:"La générosité californienne dans un verre — cassis opulent, vanille, structure veloutée et flatteuse.",grapes:"Cabernet Sauvignon",price_range:"60-85€"},
  {name:"Domaine Leflaive Puligny-Montrachet",country:"France",region:"Bourgogne",type:"blanc",year:2020,producer:"Domaine Leflaive",why:"Le Chardonnay à son sommet bourguignon — beurre noisette, amande, tension et longueur extraordinaires.",grapes:"Chardonnay",price_range:"90-140€"},
  {name:"Zind-Humbrecht Rangen Grand Cru",country:"France",region:"Alsace",type:"blanc",year:2019,producer:"Zind-Humbrecht",why:"Sur le volcan du Rangen, le Pinot Gris exprime fumée, épices et une profondeur tellurique unique.",grapes:"Pinot Gris",price_range:"60-90€"},
  {name:"Penfolds Grange",country:"Australie",region:"Barossa Valley",type:"rouge",year:2018,producer:"Penfolds",why:"L'Icône australienne. Shiraz de légende — opulent, épicé, chocolaté, conçu pour traverser les décennies.",grapes:"Shiraz",price_range:"500-800€"},
];

const REGION_STORIES = {
  "Bordeaux":"Les rives de la Gironde distillent depuis des siècles une élégance structurée, où le Cabernet Sauvignon tisse sa trame tannique sur fond de terroir argilo-calcaire.",
  "Bourgogne":"Terre de moines et de mystère, la Bourgogne révèle dans chaque parcelle une expression unique — le terroir y parle plus fort que la main du vigneron.",
  "Rhône":"Entre Alpes et Méditerranée, la vallée du Rhône offre des vins de caractère — solaires au sud avec le Grenache, épicés et élancés au nord avec la Syrah.",
  "Loire":"Le jardin de la France livre ses vins avec légèreté et franchise — le Chenin Blanc y atteint des sommets de tension et de minéralité incomparables.",
  "Alsace":"À la croisée des cultures française et germanique, l'Alsace produit des vins aromatiques d'une précision rare, portés par des cépages nobles sur granit et calcaire.",
  "Champagne":"La plus célèbre des appellations transforme une acidité rigoureuse en bulles de fête — chaque flûte raconte trois ans de patience souterraine.",
  "Toscane":"Le cyprès, l'olive et la vigne composent ce paysage parfait. Le Sangiovese s'y exprime avec une acidité vive et une élégance méditative.",
  "Piémont":"Au pied des Alpes, le Nebbiolo s'impose comme le cépage le plus exigeant d'Italie — tannins de fer, rose séchée et un potentiel de vieillissement sans égal.",
  "Rioja":"La Tempranillo de Rioja vieillit en fûts américains pour révéler vanille, fraise confite et une structure qui traverse les décennies.",
  "Mendoza":"À 1400 mètres sous le soleil andin, le Malbec acquiert une profondeur violette et épicée que ni le Lot ni Bordeaux ne peuvent égaler.",
  "Barossa Valley":"Les plus vieilles vignes de Shiraz du monde plongent leurs racines depuis 1847 dans ces sols rouges australiens — concentrés, épicés, inoubliables.",
  "Napa Valley":"La vallée californienne produit des Cabernets opulents et précis, boisés avec luxe, qui rivalisent ouvertement avec les grands Bordeaux.",
  "Douro":"Les terrasses de schiste du Douro donnent naissance aux plus grands vins de Porto et, depuis peu, à des rouges secs d'une profondeur remarquable.",
};

function generateStory(wine) {
  const regionStory = REGION_STORIES[wine.region]
    || `Les vignes de ${wine.region||wine.country} expriment un terroir singulier, façonné par des générations de vignerons passionnés.`;
  const anecdotes = {
    "Bordeaux":"Le mot 'claret' utilisé par les Anglais remonte au XIIe siècle, quand la région appartenait à la couronne anglaise.",
    "Bourgogne":"La Romanée-Conti ne produit que 5 000 à 6 000 bouteilles par an pour le monde entier.",
    "Champagne":"La pression dans une bouteille de Champagne est trois fois celle d'un pneu de voiture — environ 6 bars.",
    "Mendoza":"Le Malbec argentin descend directement des plants exportés depuis Cahors au XIXe siècle.",
    "Barossa Valley":"Certaines vignes de la Barossa Valley ont plus de 170 ans — parmi les plus vieilles en production au monde.",
    "Toscane":"Le Chianti était historiquement vendu dans des fiasques, interdites en 1993 pour améliorer l'image du vin.",
    "Douro":"Le Porto est né d'une ruse commerciale : au XVIIe siècle, on ajoutait de l'eau-de-vie pour stabiliser le vin.",
  };
  return {
    story: `${regionStory} Ce vin porte l'empreinte de son lieu de naissance avec une sincérité rare.`,
    anecdote: anecdotes[wine.region] || `La région de ${wine.region||wine.country} compte parmi les terroirs les plus respectés au monde.`,
  };
}

/* ─── Suggestions rotatives ─────────────────────────────────
   Seed stocké en localStorage, change à chaque ouverture d'app
   ou quand l'utilisateur clique "Nouvelles découvertes"
────────────────────────────────────────────────────────────── */
function getRotatingSuggestions(db, seed) {
  const liked    = db.filter(w=>w.tasted&&w.rating>=3);
  const disliked = db.filter(w=>w.tasted&&w.rating<=1);
  const likedTypes     = [...new Set(liked.map(w=>w.type))];
  const likedCountries = [...new Set(liked.map(w=>w.country))];
  const likedRegions   = [...new Set(liked.map(w=>w.region))];
  const dislikedRegions= [...new Set(disliked.map(w=>w.region))];

  // Exclure ceux déjà en cave et ceux de régions détestées
  let pool = SUGGESTIONS_DB
    .filter(s => !db.some(w => w.name?.toLowerCase()===s.name.toLowerCase()))
    .filter(s => !dislikedRegions.includes(s.region))
    .map(s => {
      let score = 0;
      if(likedTypes.includes(s.type))     score += 30;
      if(likedCountries.includes(s.country)) score += 20;
      if(likedRegions.includes(s.region)) score += 35;
      if(!likedCountries.includes(s.country)) score += 5; // diversité
      return {...s, matchScore: Math.min(99, 50+score)};
    })
    .sort((a,b) => b.matchScore - a.matchScore);

  // Shuffle déterministe avec le seed
  const shuffled = [...pool];
  let s = seed;
  for(let i=shuffled.length-1;i>0;i--){
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i+1);
    [shuffled[i],shuffled[j]] = [shuffled[j],shuffled[i]];
  }
  return shuffled.slice(0,5);
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS

const haptic=(p=50)=>{try{if(navigator.vibrate)navigator.vibrate(p);}catch(_){}};
const typeColor =(id)=>WINE_TYPES.find(t=>t.id===id)?.color||C.gold;
const typeLight =(id)=>WINE_TYPES.find(t=>t.id===id)?.light||"rgba(184,134,42,.1)";
const typeEmoji =(id)=>WINE_TYPES.find(t=>t.id===id)?.emoji||"🍷";

async function callClaude(messages, maxTokens=600) {
  const r = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({model:"claude-sonnet-4-5", max_tokens:maxTokens, messages})
  });
  const d = await r.json();
  if(!r.ok) throw new Error(d.error?.message||`HTTP ${r.status}`);
  return d.content.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
}

// Parse JSON robuste — ignore tout ce qui n'est pas JSON
function safeJson(txt, fallback={}) {
  if(!txt) return fallback;
  // Essai 1 : parse direct
  try { return JSON.parse(txt.trim()); } catch {}
  // Essai 2 : extraire un tableau [...] 
  const arrMatch = txt.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if(arrMatch) { try { return JSON.parse(arrMatch[0]); } catch {} }
  // Essai 3 : extraire un objet {...}
  const objMatch = txt.match(/\{[\s\S]*\}/);
  if(objMatch) { try { return JSON.parse(objMatch[0]); } catch {} }
  // Essai 4 : depuis le premier [ ou {
  const start = txt.search(/[\[{]/);
  if(start >= 0) {
    try { return JSON.parse(txt.slice(start)); } catch {}
    try { return JSON.parse(txt.slice(start).replace(/[\x00-\x1F\x7F-\x9F]/g," ")); } catch {}
  }
  return fallback;
}


async function lookupWineOnline(wine) {
  const q = [wine.producer,wine.name,wine.region,wine.country,wine.year].filter(Boolean).join(" ");
  const txt = await callClaude([{role:"user",content:`Tu es expert vin. Infos précises sur : "${q}". Réponds UNIQUEMENT en JSON sans markdown :
{"description":"2-3 phrases style/arômes/structure","grapes":"cépages","serving":"température et accord mets","price_range":"fourchette prix ex: 15-25€","peak":"fenêtre dégustation","score":"note critique si connue","search_query":"termes de recherche Wine-Searcher"}`}], 500);
  return safeJson(txt, {});
}

async function searchWines(query, db) {
  const liked = db.filter(w=>w.tasted&&w.rating>=3).map(w=>`${w.type} ${w.region}`).join(", ");
  const txt = await callClaude([{role:"user",content:`Tu es sommelier expert. Recherche : "${query}". ${liked?`Goûts utilisateur : ${liked}.`:""}
Propose 4 vins. UNIQUEMENT JSON sans markdown :
[{"name":"","producer":"","type":"rouge|blanc|rose|mousseux|autre","country":"","region":"","year":2020,"why":"2 phrases poétiques","grapes":"","price_range":""}]`}], 800);
  return safeJson(txt, []);
}

/* ═══════════════════════════════════════════════════════════════
   COMPOSANTS UI RÉUTILISABLES


export { C, GLOBAL_CSS, COUNTRIES, WINE_TYPES, SUGGESTIONS_DB, REGION_STORIES, generateStory, getRotatingSuggestions };
