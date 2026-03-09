/**
 * UNWINE-D V4
 * Thème clair beige/terracota · Logo Unwine-D · Suggestions rotatives
 */
import React, { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS — thème clair beige / terracota
═══════════════════════════════════════════════════════════════ */
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
═══════════════════════════════════════════════════════════════ */
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
═══════════════════════════════════════════════════════════════ */
const haptic=(p=50)=>{try{if(navigator.vibrate)navigator.vibrate(p);}catch(_){}};
const typeColor =(id)=>WINE_TYPES.find(t=>t.id===id)?.color||C.gold;
const typeLight =(id)=>WINE_TYPES.find(t=>t.id===id)?.light||"rgba(184,134,42,.1)";
const typeEmoji =(id)=>WINE_TYPES.find(t=>t.id===id)?.emoji||"🍷";

async function callClaude(messages, maxTokens=600) {
  const r = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({model:"claude-sonnet-4-20250514", max_tokens:maxTokens, messages})
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
═══════════════════════════════════════════════════════════════ */
const Tag=({children,color})=>(
  <span style={{fontSize:14,color:color||C.accent,background:color?`${color}18`:"rgba(139,90,60,.1)",border:`1px solid ${color||C.accent}33`,borderRadius:20,padding:"4px 11px",fontFamily:"Cormorant Garamond,serif",lineHeight:1}}>{children}</span>
);

const StarRating=({value,onChange,size=32})=>(
  <div style={{display:"flex",gap:8,justifyContent:"center"}}>
    {[0,1,2,3,4,5].map(n=>(
      <button key={n} onClick={()=>onChange(n)} style={{width:size+8,height:size+8,borderRadius:"50%",background:n<=value?`linear-gradient(135deg,${C.terra},${C.gold})`:`rgba(139,90,60,.1)`,border:n<=value?"none":`1px solid rgba(184,134,42,.3)`,color:n<=value?"#fff":C.muted,fontSize:n===0?13:17,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>{n===0?"✗":"★"}</button>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   WINE INFO CARD — lookup en ligne
═══════════════════════════════════════════════════════════════ */
const WineInfoCard=({wine})=>{
  const [info,setInfo]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(false);
  const q=[wine.producer,wine.name,wine.region,wine.country,wine.year].filter(Boolean).join(" ");
  const fetch_info=async()=>{setLoading(true);setError(false);try{setInfo(await lookupWineOnline(wine));}catch{setError(true);}finally{setLoading(false);}};
  if(!info&&!loading)return(
    <button onClick={fetch_info} style={{width:"100%",background:"rgba(184,134,42,.08)",border:`1px solid rgba(184,134,42,.25)`,borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:14,transition:"all .2s"}}>
      <span style={{fontSize:20}}>🌐</span>
      <div style={{textAlign:"left"}}>
        <div style={{fontSize:14,color:C.gold,fontFamily:"Playfair Display,serif",fontWeight:500}}>Fiche en ligne</div>
        <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",marginTop:2}}>Prix, accord, apogée, note critique…</div>
      </div>
      <span style={{marginLeft:"auto",color:C.gold,fontSize:16}}>→</span>
    </button>
  );
  if(loading)return(
    <div style={{background:"rgba(184,134,42,.06)",border:`1px solid rgba(184,134,42,.18)`,borderRadius:14,padding:"16px",marginBottom:14,textAlign:"center"}}>
      <div style={{width:22,height:22,border:`2px solid rgba(184,134,42,.2)`,borderTopColor:C.gold,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 8px"}}/>
      <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>Consultation des bases de données…</div>
    </div>
  );
  if(error)return(
    <div style={{background:"rgba(200,80,58,.06)",border:`1px solid rgba(200,80,58,.2)`,borderRadius:14,padding:"12px 16px",marginBottom:14}}>
      <span style={{fontSize:14,color:C.terra,fontFamily:"Cormorant Garamond,serif"}}>Impossible de récupérer les infos. </span>
      <button onClick={fetch_info} style={{color:C.gold,textDecoration:"underline",fontSize:14,fontFamily:"Cormorant Garamond,serif"}}>Réessayer</button>
    </div>
  );
  return(
    <div style={{background:"rgba(184,134,42,.07)",border:`1px solid rgba(184,134,42,.22)`,borderRadius:16,padding:"16px",marginBottom:14,animation:"fadeIn .4s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:14,color:C.gold,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>🌐 Fiche en ligne</div>
        {info.score&&<div style={{fontSize:14,color:C.gold,fontFamily:"Playfair Display,serif",fontWeight:600}}>{info.score}</div>}
      </div>
      {info.description&&<p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.8,marginBottom:12}}>{info.description}</p>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {info.grapes&&<div style={{background:"rgba(139,90,60,.06)",borderRadius:10,padding:"8px 10px"}}><div style={{fontSize:10,color:C.muted,letterSpacing:".15em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginBottom:3}}>Cépages</div><div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>{info.grapes}</div></div>}
        {info.price_range&&<div style={{background:"rgba(139,90,60,.06)",borderRadius:10,padding:"8px 10px"}}><div style={{fontSize:10,color:C.muted,letterSpacing:".15em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginBottom:3}}>Prix</div><div style={{fontSize:14,color:C.gold,fontFamily:"Playfair Display,serif",fontWeight:600}}>{info.price_range}</div></div>}
        {info.serving&&<div style={{background:"rgba(139,90,60,.06)",borderRadius:10,padding:"8px 10px"}}><div style={{fontSize:10,color:C.muted,letterSpacing:".15em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginBottom:3}}>Service</div><div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>{info.serving}</div></div>}
        {info.peak&&<div style={{background:"rgba(139,90,60,.06)",borderRadius:10,padding:"8px 10px"}}><div style={{fontSize:10,color:C.muted,letterSpacing:".15em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginBottom:3}}>Apogée</div><div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>{info.peak}</div></div>}
      </div>
      <a href={`https://www.wine-searcher.com/find/${encodeURIComponent((info.search_query||q).replace(/[\s]+/g,"+"))}`} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:`rgba(200,80,58,.12)`,border:`1px solid rgba(200,80,58,.3)`,borderRadius:20,padding:"7px 16px",textDecoration:"none",color:C.terra,fontSize:10,letterSpacing:".12em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>🔍 Wine-Searcher</a>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   FORMULAIRE D'AJOUT (5 étapes)
═══════════════════════════════════════════════════════════════ */
const AddWineForm=({onSave,onCancel})=>{
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({type:"",country:"",region:"",year:new Date().getFullYear(),producer:"",name:"",tasted:null,rating:null,storage:false,notes:""});
  const LABELS=["","Type de vin","Pays","Région","Détails","Dégustation"];
  const totalSteps=5;
  const up=(k,v)=>setForm(f=>({...f,[k]:v}));
  const canNext=()=>step===1?!!form.type:step===2?!!form.country:step===3?!!form.region:step===4?!!form.year:true;
  const handleSave=()=>{haptic(60);const s=generateStory(form);onSave({...form,id:Date.now(),story:s.story,anecdote:s.anecdote,addedAt:new Date().toLocaleDateString("fr-FR")});};

  const inp=(filled)=>({width:"100%",background:filled?"rgba(200,80,58,.07)":"rgba(139,90,60,.06)",border:`1px solid ${filled?"rgba(200,80,58,.35)":"rgba(139,90,60,.2)"}`,borderRadius:12,padding:"13px 15px",color:C.cream,fontSize:15,fontFamily:"Cormorant Garamond,serif",transition:"border-color .25s"});
  const lbl={fontSize:14,color:C.accent,letterSpacing:".25em",textTransform:"uppercase",marginBottom:8,fontFamily:"Cormorant Garamond,serif",display:"block"};

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"36px 20px 0",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button onClick={onCancel} style={{width:36,height:36,borderRadius:"50%",background:"rgba(139,90,60,.1)",border:`1px solid rgba(139,90,60,.2)`,color:C.accent,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
          <div>
            <div style={{fontSize:14,color:C.muted,letterSpacing:".3em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>Étape {step} / {totalSteps}</div>
            <div style={{fontSize:16,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400}}>{LABELS[step]}</div>
          </div>
        </div>
        <div style={{height:3,background:"rgba(139,90,60,.1)",borderRadius:2,marginBottom:28}}>
          <div style={{height:"100%",width:`${(step/totalSteps)*100}%`,borderRadius:2,background:`linear-gradient(90deg,${C.terra},${C.gold})`,transition:"width .4s ease"}}/>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"0 20px 120px"}}>
        {step===1&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8,lineHeight:1.2}}>Quel type de vin<br/>souhaitez-vous ajouter ?</h2>
            <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:28}}>Commençons par le commencement.</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {WINE_TYPES.map((t,i)=>(
                <button key={t.id} onClick={()=>{haptic(30);up("type",t.id);}} style={{background:form.type===t.id?typeLight(t.id):"rgba(139,90,60,.05)",border:`1px solid ${form.type===t.id?t.color+"66":"rgba(139,90,60,.15)"}`,borderRadius:16,padding:"16px 18px",display:"flex",alignItems:"center",gap:14,animation:`fadeUp .3s ease ${i*.06}s both`,opacity:0,transition:"all .2s"}}>
                  <div style={{width:44,height:44,borderRadius:"50%",flexShrink:0,background:form.type===t.id?t.color+"22":"rgba(139,90,60,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,border:`1px solid ${form.type===t.id?t.color+"55":"rgba(139,90,60,.15)"}`}}>{t.emoji}</div>
                  <div style={{fontSize:16,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400}}>{t.label}</div>
                  {form.type===t.id&&<div style={{marginLeft:"auto",width:20,height:20,borderRadius:"50%",background:t.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",fontWeight:700}}>✓</div>}
                </button>
              ))}
            </div>
          </div>
        )}
        {step===2&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8,lineHeight:1.2}}>De quel pays<br/>vient ce vin ?</h2>
            <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:28}}>Le terroir raconte toujours une histoire.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {Object.entries(COUNTRIES).map(([country,data])=>(
                <button key={country} onClick={()=>{haptic(20);up("country",country);up("region","");}} style={{background:form.country===country?"rgba(184,134,42,.15)":"rgba(139,90,60,.05)",border:`1px solid ${form.country===country?"rgba(184,134,42,.5)":"rgba(139,90,60,.15)"}`,borderRadius:12,padding:"11px 10px",display:"flex",alignItems:"center",gap:8,transition:"all .2s"}}>
                  <span style={{fontSize:18}}>{data.flag}</span>
                  <span style={{fontSize:14,color:form.country===country?C.gold:C.subtext,fontFamily:"Cormorant Garamond,serif",fontWeight:form.country===country?600:400}}>{country}</span>
                  {form.country===country&&<span style={{marginLeft:"auto",color:C.gold,fontSize:12}}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}
        {step===3&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8,lineHeight:1.2}}>Quelle région ?</h2>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(184,134,42,.1)",border:"1px solid rgba(184,134,42,.3)",borderRadius:20,padding:"6px 14px",marginBottom:22}}>
              <span style={{fontSize:16}}>{COUNTRIES[form.country]?.flag}</span>
              <span style={{fontSize:14,color:C.gold,fontFamily:"Cormorant Garamond,serif"}}>{form.country}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {COUNTRIES[form.country]?.regions.map(r=>(
                <button key={r} onClick={()=>{haptic(20);up("region",r);}} style={{background:form.region===r?"rgba(200,80,58,.12)":"rgba(139,90,60,.05)",border:`1px solid ${form.region===r?"rgba(200,80,58,.45)":"rgba(139,90,60,.15)"}`,borderRadius:12,padding:"12px 16px",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .2s"}}>
                  <span style={{fontSize:14,color:form.region===r?C.cream:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>{r}</span>
                  {form.region===r&&<span style={{color:C.terra,fontSize:13}}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}
        {step===4&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8,lineHeight:1.2}}>Quelques précisions…</h2>
            <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:28}}>Plus vous en dites, mieux je vous connais.</p>
            <div style={{marginBottom:16}}><label style={lbl}>Millésime</label><input type="number" value={form.year} onChange={e=>up("year",parseInt(e.target.value)||new Date().getFullYear())} min={1900} max={new Date().getFullYear()} style={inp(form.year)}/></div>
            <div style={{marginBottom:16}}><label style={lbl}>Maison / Domaine / Château</label><input type="text" value={form.producer} onChange={e=>up("producer",e.target.value)} placeholder="Ex: Château Margaux, Domaine Leroy…" style={inp(form.producer)}/></div>
            <div style={{marginBottom:16}}><label style={lbl}>Nom du vin <span style={{color:C.muted,fontWeight:300}}>(optionnel)</span></label><input type="text" value={form.name} onChange={e=>up("name",e.target.value)} placeholder="Ex: Cuvée Prestige, Grand Cru…" style={inp(form.name)}/></div>
          </div>
        )}
        {step===5&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8,lineHeight:1.2}}>L'avez-vous<br/>déjà goûté ?</h2>
            <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:28}}>Votre mémoire gustative est précieuse.</p>
            <div style={{display:"flex",gap:12,marginBottom:24}}>
              {[{val:true,label:"Oui, je l'ai bu",emoji:"✓",c:C.sauge},{val:false,label:"Non, pas encore",emoji:"○",c:C.gold}].map(opt=>(
                <button key={String(opt.val)} onClick={()=>{haptic(40);up("tasted",opt.val);up("storage",!opt.val);}} style={{flex:1,padding:"18px 10px",background:form.tasted===opt.val?`${opt.c}18`:"rgba(139,90,60,.05)",border:`1px solid ${form.tasted===opt.val?opt.c+"55":"rgba(139,90,60,.15)"}`,borderRadius:16,display:"flex",flexDirection:"column",alignItems:"center",gap:10,transition:"all .25s"}}>
                  <div style={{width:42,height:42,borderRadius:"50%",background:form.tasted===opt.val?opt.c+"22":"rgba(139,90,60,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,color:form.tasted===opt.val?opt.c:C.muted,fontWeight:700}}>{opt.emoji}</div>
                  <span style={{fontSize:14,color:form.tasted===opt.val?C.cream:C.subtext,fontFamily:"Cormorant Garamond,serif",textAlign:"center",lineHeight:1.3}}>{opt.label}</span>
                </button>
              ))}
            </div>
            {form.tasted===true&&(
              <div style={{background:"rgba(200,80,58,.07)",border:`1px solid rgba(200,80,58,.2)`,borderRadius:16,padding:"20px 16px",marginBottom:14,animation:"fadeUp .3s ease"}}>
                <div style={{fontSize:10,color:C.terra,letterSpacing:".22em",textTransform:"uppercase",marginBottom:6,fontFamily:"Cormorant Garamond,serif",textAlign:"center"}}>Votre note sur 5</div>
                <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",textAlign:"center",marginBottom:16}}>0 = à éviter · 5 = expérience absolue</div>
                <StarRating value={form.rating??-1} onChange={v=>{haptic(30);up("rating",v);}} size={32}/>
                {form.rating!==null&&<div style={{textAlign:"center",marginTop:12,fontSize:14,color:C.cream,fontFamily:"Playfair Display,serif",fontStyle:"italic",animation:"fadeIn .3s ease"}}>{["À éviter 🚫","Décevant 😕","Correct 😐","Bien 🙂","Très bon ⭐","Exceptionnel ✨"][form.rating]}</div>}
                <div style={{marginTop:16}}>
                  <label style={{...lbl}}>Notes <span style={{color:C.muted}}>(optionnel)</span></label>
                  <textarea value={form.notes} onChange={e=>up("notes",e.target.value)} placeholder="Un souvenir, un accord, une émotion…" rows={3} style={{...inp(form.notes),resize:"none",lineHeight:1.65,fontStyle:"italic"}}/>
                </div>
              </div>
            )}
            {form.tasted===false&&(
              <div style={{background:"rgba(184,134,42,.08)",border:`1px solid rgba(184,134,42,.22)`,borderRadius:16,padding:"16px",animation:"fadeUp .3s ease"}}>
                <div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.7,textAlign:"center"}}>Ce vin sera stocké dans votre cave.<br/><span style={{color:C.gold}}>Vous pourrez l'évaluer plus tard.</span></div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"12px 20px 32px",background:`linear-gradient(transparent,${C.bg} 35%)`}}>
        {step<5?(
          <button onClick={()=>{if(canNext()){haptic(40);setStep(s=>s+1);}}} style={{width:"100%",padding:"16px",background:canNext()?`linear-gradient(135deg,${C.terra},${C.terraD})`:"rgba(139,90,60,.12)",color:canNext()?"#fff":"rgba(61,43,26,.3)",border:"none",borderRadius:50,fontSize:14,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:700,boxShadow:canNext()?`0 8px 28px rgba(200,80,58,.3)`:"none",transition:"all .3s"}}>Continuer →</button>
        ):(
          <button onClick={handleSave} disabled={form.tasted===null||(form.tasted===true&&form.rating===null)} style={{width:"100%",padding:"16px",background:(form.tasted!==null&&(form.tasted===false||form.rating!==null))?`linear-gradient(135deg,${C.sauge},#4a7a2e)`:"rgba(139,90,60,.12)",color:(form.tasted!==null&&(form.tasted===false||form.rating!==null))?"#fff":"rgba(61,43,26,.3)",border:"none",borderRadius:50,fontSize:14,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:700,transition:"all .3s"}}>✓ Ajouter à ma cave</button>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DÉTAIL D'UN VIN
═══════════════════════════════════════════════════════════════ */
const WineDetail=({wine,onBack,onUpdateRating})=>{
  const [rating,setRating]=useState(wine.rating??null);
  const [showRate,setShowRate]=useState(false);
  const tc=typeColor(wine.type);
  const tl=typeLight(wine.type);
  const handleRate=(r)=>{haptic(50);setRating(r);onUpdateRating(wine.id,r);setShowRate(false);};
  return(
    <div style={{minHeight:"100vh",background:C.bg,overflowY:"auto"}}>
      <div style={{background:`linear-gradient(160deg,${tl} 0%,transparent 40%)`,minHeight:"100vh"}}>
        <div style={{padding:"36px 20px 0",display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <button onClick={onBack} style={{width:38,height:38,borderRadius:"50%",background:"rgba(139,90,60,.12)",border:`1px solid rgba(139,90,60,.2)`,color:C.accent,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
          <div>
            <div style={{fontSize:14,color:C.muted,letterSpacing:".25em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>{typeEmoji(wine.type)} {WINE_TYPES.find(t=>t.id===wine.type)?.label}</div>
            <div style={{fontSize:16,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,maxWidth:280,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{wine.producer||wine.name||"Vin sans nom"}</div>
          </div>
        </div>
        <div style={{padding:"0 20px 80px"}}>
          <div style={{background:C.bgCard,border:`1px solid ${tc}33`,borderRadius:22,padding:"22px",marginBottom:14,boxShadow:`0 4px 24px rgba(139,90,60,.1)`}}>
            <div style={{fontSize:52,textAlign:"center",marginBottom:14,filter:`drop-shadow(0 4px 12px ${tc}44)`}}>{typeEmoji(wine.type)}</div>
            <h2 style={{fontSize:24,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,textAlign:"center",marginBottom:6,lineHeight:1.2}}>{wine.producer||"Domaine inconnu"}</h2>
            {wine.name&&<div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",textAlign:"center",marginBottom:12}}>{wine.name}</div>}
            <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
              {[wine.region&&`📍 ${wine.region}`,wine.country&&`${COUNTRIES[wine.country]?.flag||"🌍"} ${wine.country}`,wine.year&&`📅 ${wine.year}`].filter(Boolean).map(tag=>(
                <span key={tag} style={{fontSize:14,color:C.subtext,background:"rgba(139,90,60,.07)",border:"1px solid rgba(139,90,60,.15)",borderRadius:20,padding:"5px 12px",fontFamily:"Cormorant Garamond,serif"}}>{tag}</span>
              ))}
            </div>
          </div>

          <div style={{background:C.bgCard,border:C.border,borderRadius:18,padding:"18px",marginBottom:14,boxShadow:`0 2px 12px rgba(139,90,60,.06)`}}>
            {wine.tasted&&rating!==null?(<div style={{textAlign:"center"}}><div style={{fontSize:10,color:C.gold,letterSpacing:".22em",textTransform:"uppercase",marginBottom:10,fontFamily:"Cormorant Garamond,serif"}}>Votre note</div><div style={{fontSize:44,fontFamily:"Playfair Display,serif",color:tc,fontWeight:600,lineHeight:1}}>{rating}<span style={{fontSize:18,color:C.muted}}>/5</span></div><div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginTop:6}}>{["À éviter 🚫","Décevant 😕","Correct 😐","Bien 🙂","Très bon ⭐","Exceptionnel ✨"][rating]}</div><button onClick={()=>setShowRate(true)} style={{marginTop:10,background:"none",color:"rgba(184,134,42,.6)",fontSize:10,fontFamily:"Cormorant Garamond,serif",letterSpacing:".1em",textDecoration:"underline"}}>Modifier ma note</button></div>
            ):wine.tasted&&rating===null?(<div><div style={{fontSize:10,color:C.gold,letterSpacing:".22em",textTransform:"uppercase",marginBottom:14,fontFamily:"Cormorant Garamond,serif",textAlign:"center"}}>Notez ce vin</div><StarRating value={-1} onChange={handleRate}/></div>
            ):(<div style={{textAlign:"center"}}><div style={{fontSize:30,marginBottom:8}}>🗄️</div><div style={{fontSize:14,color:C.cream,fontFamily:"Playfair Display,serif",marginBottom:6}}>En cave</div><div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:14}}>Stocké pour plus tard</div><button onClick={()=>setShowRate(true)} style={{background:`linear-gradient(135deg,${C.terra},${C.terraD})`,color:"#fff",border:"none",padding:"10px 22px",borderRadius:50,fontSize:14,letterSpacing:".15em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>Je l'ai goûté !</button></div>)}
          </div>

          <WineInfoCard wine={wine}/>

          {wine.story&&(<div style={{background:"rgba(200,80,58,.06)",borderLeft:`3px solid ${C.terra}`,borderRadius:"0 14px 14px 0",padding:"14px 16px",marginBottom:14}}><div style={{fontSize:14,color:C.terra,letterSpacing:".22em",textTransform:"uppercase",marginBottom:8,fontFamily:"Cormorant Garamond,serif"}}>Le Récit du Terroir</div><p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.85}}>{wine.story}</p></div>)}
          {wine.anecdote&&(<div style={{background:"rgba(184,134,42,.07)",border:`1px solid rgba(184,134,42,.2)`,borderRadius:14,padding:"13px 15px",marginBottom:14}}><div style={{fontSize:14,color:C.gold,letterSpacing:".18em",textTransform:"uppercase",marginBottom:6,fontFamily:"Cormorant Garamond,serif"}}>✦ Le saviez-vous ?</div><p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",lineHeight:1.75}}>{wine.anecdote}</p></div>)}
          {wine.notes&&(<div style={{background:C.bgCard,border:C.border,borderRadius:14,padding:"13px 15px"}}><div style={{fontSize:14,color:C.muted,letterSpacing:".18em",textTransform:"uppercase",marginBottom:6,fontFamily:"Cormorant Garamond,serif"}}>Ma note personnelle</div><p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.75}}>{wine.notes}</p></div>)}
        </div>
      </div>

      {showRate&&(<div style={{position:"fixed",inset:0,zIndex:800,display:"flex",alignItems:"flex-end",background:"rgba(61,43,26,.5)"}} onClick={e=>{if(e.target===e.currentTarget)setShowRate(false);}}>
        <div style={{background:C.bgCard,border:`1px solid rgba(139,90,60,.2)`,borderRadius:"24px 24px 0 0",width:"100%",padding:"22px 20px 44px",animation:"slideUp .3s ease"}}>
          <div style={{width:32,height:3,background:"rgba(139,90,60,.2)",borderRadius:2,margin:"0 auto 18px"}}/>
          <div style={{fontSize:10,color:C.gold,letterSpacing:".22em",textTransform:"uppercase",marginBottom:14,fontFamily:"Cormorant Garamond,serif",textAlign:"center"}}>Notez ce vin</div>
          <StarRating value={rating??-1} onChange={handleRate} size={36}/>
        </div>
      </div>)}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SMART SCANNER
═══════════════════════════════════════════════════════════════ */
const SmartScanner=({db,onResult,onBack})=>{
  const [phase,setPhase]=useState("idle");
  const [result,setResult]=useState(null);
  const [errMsg,setErrMsg]=useState("");

  const processImage=async(file)=>{
    if(!file)return;
    setPhase("scanning");
    const reader=new FileReader();
    reader.onload=async(ev)=>{
      const img=new Image();
      img.onload=async()=>{
        const canvas=document.createElement("canvas");
        const scale=Math.min(1,900/Math.max(img.width,img.height));
        canvas.width=img.width*scale;canvas.height=img.height*scale;
        canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
        let quality=0.65,b64=canvas.toDataURL("image/jpeg",quality).split(",")[1];
        while(b64.length>400000&&quality>0.2){quality-=0.1;b64=canvas.toDataURL("image/jpeg",quality).split(",")[1];}
        const liked=db.filter(w=>w.tasted&&w.rating>=3).map(w=>`${w.type} ${w.region} (${w.rating}/5)`).join(", ");
        const disliked=db.filter(w=>w.tasted&&w.rating<=1).map(w=>`${w.type} ${w.region}`).join(", ");
        const prompt=`Sommelier expert. Analyse cette image étiquette/carte des vins.
${liked?`Aime : ${liked}`:""}${disliked?` N'aime pas : ${disliked}`:""}
Réponds UNIQUEMENT en JSON :
{"topPick":{"name":"","producer":"","type":"rouge|blanc|rose|mousseux|autre","country":"","region":"","year":2020,"match":85,"why":"2 phrases poétiques","story":"3 phrases terroir","emoji":"🍷","grapes":"","price_range":""}}`;
        try{
          const r=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:"image/jpeg",data:b64}},{type:"text",text:prompt}]}]})});
          const d=await r.json();
          if(!r.ok)throw new Error(d.error?.message||`HTTP ${r.status}`);
          const txt=d.content.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
          setResult(safeJson(txt, {}));setPhase("result");
        }catch(e){setErrMsg(e.message?.slice(0,120)||"Erreur");setPhase("error");}
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  if(phase==="scanning")return(<div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:22,padding:32}}><div style={{position:"relative",width:72,height:72}}><div style={{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid rgba(184,134,42,.2)`}}/><div style={{position:"absolute",inset:0,borderRadius:"50%",border:"2px solid transparent",borderTopColor:C.gold,animation:"spin 1.2s linear infinite"}}/><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>🔍</div></div><div style={{textAlign:"center"}}><div style={{fontSize:18,fontFamily:"Playfair Display,serif",color:C.cream,marginBottom:6}}>Analyse en cours…</div><div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>Le Sommelier lit l'étiquette</div></div></div>);

  if(phase==="error")return(<div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:18,padding:32,textAlign:"center"}}><div style={{fontSize:48}}>⚠️</div><div style={{fontSize:15,fontFamily:"Playfair Display,serif",color:C.cream}}>{errMsg}</div><button onClick={()=>setPhase("idle")} style={{background:`rgba(200,80,58,.12)`,border:`1px solid rgba(200,80,58,.35)`,borderRadius:22,padding:"11px 26px",color:C.terra,fontSize:14,fontFamily:"Playfair Display,serif"}}>Réessayer</button><button onClick={onBack} style={{background:"none",color:C.muted,fontSize:14,fontFamily:"Cormorant Garamond,serif"}}>← Retour</button></div>);

  if(phase==="result"&&result){
    const p=result.topPick;
    const tc=typeColor(p.type);
    const wineObj={type:p.type||"rouge",country:p.country||"",region:p.region||"",year:p.year||new Date().getFullYear(),producer:p.producer||"",name:p.name||"",story:p.story||"",anecdote:""};
    return(
      <div style={{minHeight:"100vh",background:C.bg,overflowY:"auto"}}>
        <div style={{background:`linear-gradient(160deg,${typeLight(p.type)} 0%,transparent 40%)`}}>
          <div style={{padding:"36px 20px 80px"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}><button onClick={onBack} style={{width:38,height:38,borderRadius:"50%",background:"rgba(139,90,60,.12)",border:`1px solid rgba(139,90,60,.2)`,color:C.accent,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button><span style={{fontSize:10,color:C.muted,letterSpacing:".25em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>Étiquette analysée</span></div>
            <div style={{background:C.bgCard,border:`1px solid ${tc}33`,borderRadius:22,padding:"22px",marginBottom:14,boxShadow:`0 4px 24px rgba(139,90,60,.1)`}}>
              <div style={{fontSize:14,color:C.gold,letterSpacing:".3em",textTransform:"uppercase",marginBottom:12,fontFamily:"Cormorant Garamond,serif",textAlign:"center"}}>Recommandation du Sommelier</div>
              <div style={{fontSize:46,textAlign:"center",marginBottom:12}}>{p.emoji||typeEmoji(p.type)}</div>
              <h2 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,textAlign:"center",marginBottom:4}}>{p.name}</h2>
              <div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",textAlign:"center",marginBottom:14}}>{p.producer}</div>
              <div style={{background:"rgba(139,90,60,.06)",borderRadius:14,padding:"12px",textAlign:"center",marginBottom:14}}>
                <div style={{fontSize:32,fontFamily:"Playfair Display,serif",color:C.gold,fontWeight:600,lineHeight:1}}>{p.match}%</div>
                <div style={{fontSize:14,color:C.muted,letterSpacing:".15em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginTop:2}}>match avec vos goûts</div>
                <div style={{height:3,background:"rgba(139,90,60,.1)",borderRadius:2,marginTop:10}}><div style={{height:"100%",width:`${p.match}%`,borderRadius:2,background:`linear-gradient(90deg,${C.terra},${C.gold})`}}/></div>
              </div>
              <div style={{display:"flex",gap:7,justifyContent:"center",flexWrap:"wrap",marginBottom:12}}>
                {[WINE_TYPES.find(t=>t.id===p.type)?.label,p.region,p.country,p.year&&String(p.year)].filter(Boolean).map(tag=>(
                  <span key={tag} style={{fontSize:14,color:C.subtext,background:"rgba(139,90,60,.07)",border:"1px solid rgba(139,90,60,.15)",borderRadius:20,padding:"4px 11px",fontFamily:"Cormorant Garamond,serif"}}>{tag}</span>
                ))}
              </div>
              {p.grapes&&<div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",textAlign:"center",marginBottom:8}}>🍇 {p.grapes}</div>}
              {p.price_range&&<div style={{fontSize:14,color:C.gold,fontFamily:"Playfair Display,serif",textAlign:"center",marginBottom:10,fontWeight:600}}>{p.price_range}</div>}
              <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.8,textAlign:"center"}}>{p.why}</p>
            </div>
            <WineInfoCard wine={wineObj}/>
            {p.story&&<div style={{background:"rgba(200,80,58,.06)",borderLeft:`3px solid ${C.terra}`,borderRadius:"0 14px 14px 0",padding:"14px 16px",marginBottom:14}}><div style={{fontSize:14,color:C.terra,letterSpacing:".2em",textTransform:"uppercase",marginBottom:8,fontFamily:"Cormorant Garamond,serif"}}>Le Récit</div><p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.85}}>{p.story}</p></div>}
            <button onClick={()=>{haptic(60);onResult({id:Date.now(),...wineObj,tasted:false,storage:true,rating:null,notes:"",addedAt:new Date().toLocaleDateString("fr-FR")});}} style={{width:"100%",background:`linear-gradient(135deg,${C.terra},${C.terraD})`,color:"#fff",border:"none",padding:"16px",borderRadius:50,fontSize:14,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:700,marginBottom:10,boxShadow:`0 8px 28px rgba(200,80,58,.25)`}}>+ Ajouter à ma cave</button>
            <button onClick={()=>setPhase("idle")} style={{width:"100%",background:"rgba(139,90,60,.08)",border:`1px solid rgba(139,90,60,.2)`,color:C.muted,padding:"12px",borderRadius:50,fontSize:14,letterSpacing:".15em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>↺ Scanner une autre</button>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px"}}>
      <button onClick={onBack} style={{position:"absolute",top:48,left:20,width:38,height:38,borderRadius:"50%",background:"rgba(139,90,60,.1)",border:`1px solid rgba(139,90,60,.2)`,color:C.accent,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
      <div style={{fontSize:68,marginBottom:14,animation:"pulse 2s ease-in-out infinite"}}>📸</div>
      <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,textAlign:"center",marginBottom:8,fontWeight:400}}>Smart Scanner</h2>
      <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",textAlign:"center",marginBottom:36,lineHeight:1.7,fontStyle:"italic"}}>Scannez une étiquette de bouteille<br/>ou une carte des vins au restaurant.</p>
      <label style={{width:"100%",maxWidth:320,display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:"26px 22px",background:`rgba(200,80,58,.08)`,border:`2px solid rgba(200,80,58,.3)`,borderRadius:22,cursor:"pointer"}}>
        <input type="file" accept="image/*" capture="environment" onChange={e=>processImage(e.target.files?.[0])} style={{display:"none"}}/>
        <span style={{fontSize:30}}>📷</span>
        <span style={{fontFamily:"Playfair Display,serif",fontSize:16,color:C.cream}}>Prendre une photo</span>
        <span style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif"}}>Ouvre l'appareil photo</span>
      </label>
      <label style={{display:"flex",alignItems:"center",gap:10,marginTop:12,padding:"11px 20px",background:"rgba(139,90,60,.06)",border:`1px solid rgba(139,90,60,.18)`,borderRadius:16,cursor:"pointer"}}>
        <input type="file" accept="image/*" onChange={e=>processImage(e.target.files?.[0])} style={{display:"none"}}/>
        <span style={{fontSize:17}}>🖼️</span>
        <span style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>Choisir depuis la galerie</span>
      </label>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MA CAVE
═══════════════════════════════════════════════════════════════ */
const MaCave=({db,onOpenWine,onAdd})=>{
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [typeFilter,setTypeFilter]=useState(null);
  const displayed=db.filter(w=>{
    const s=search.toLowerCase();
    if(s&&!`${w.producer} ${w.name} ${w.region} ${w.country}`.toLowerCase().includes(s))return false;
    if(typeFilter&&w.type!==typeFilter)return false;
    if(filter==="cave")return!w.tasted;
    if(filter==="tasted")return w.tasted;
    if(filter==="top")return w.tasted&&w.rating>=4;
    if(filter==="avoid")return w.tasted&&w.rating<=1;
    return true;
  });
  const stats={total:db.length,inCave:db.filter(w=>!w.tasted).length,tasted:db.filter(w=>w.tasted).length,avg:db.filter(w=>w.tasted&&w.rating!==null).length?((db.filter(w=>w.tasted&&w.rating!==null).reduce((a,w)=>a+w.rating,0)/db.filter(w=>w.tasted&&w.rating!==null).length).toFixed(1)):"—"};

  if(db.length===0)return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center"}}>
      <div style={{fontSize:60,marginBottom:14,opacity:.25}}>🗄️</div>
      <h3 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8}}>Votre cave est vide</h3>
      <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:26,lineHeight:1.7}}>Commencez par ajouter un vin<br/>pour constituer votre collection.</p>
      <button onClick={onAdd} style={{background:`linear-gradient(135deg,${C.terra},${C.terraD})`,color:"#fff",border:"none",padding:"15px 30px",borderRadius:50,fontSize:14,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:600,boxShadow:`0 8px 24px rgba(200,80,58,.25)`}}>+ Ajouter mon premier vin</button>
    </div>
  );

  return(
    <div style={{flex:1,overflowY:"auto",padding:"14px 16px 100px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
        {[[stats.total,"Vins",C.cream],[stats.inCave,"En cave",C.gold],[stats.tasted,"Goûtés",C.terra],[stats.avg,"Moy.",C.sauge]].map(([v,l,col])=>(
          <div key={l} style={{background:C.bgCard,border:C.border,borderRadius:14,padding:"11px 7px",textAlign:"center",boxShadow:`0 2px 8px rgba(139,90,60,.08)`}}>
            <div style={{fontSize:19,fontFamily:"Playfair Display,serif",color:col,fontWeight:600,lineHeight:1}}>{v}</div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher…" style={{width:"100%",background:C.bgCard,border:`1px solid rgba(139,90,60,.2)`,borderRadius:14,padding:"11px 14px",color:C.cream,fontSize:14,fontFamily:"Cormorant Garamond,serif",marginBottom:10,boxShadow:`0 2px 8px rgba(139,90,60,.06)`}}/>
      <div style={{display:"flex",gap:6,marginBottom:8,overflowX:"auto",paddingBottom:3}}>
        <button onClick={()=>setTypeFilter(null)} style={{background:!typeFilter?C.terra:"rgba(139,90,60,.08)",border:`1px solid ${!typeFilter?C.terra:"rgba(139,90,60,.18)"}`,borderRadius:20,padding:"6px 12px",fontSize:10,color:!typeFilter?"#fff":C.subtext,whiteSpace:"nowrap",fontFamily:"Cormorant Garamond,serif"}}>Tous</button>
        {WINE_TYPES.map(t=>(
          <button key={t.id} onClick={()=>setTypeFilter(typeFilter===t.id?null:t.id)} style={{background:typeFilter===t.id?typeLight(t.id):"rgba(139,90,60,.05)",border:`1px solid ${typeFilter===t.id?t.color+"66":"rgba(139,90,60,.15)"}`,borderRadius:20,padding:"6px 12px",fontSize:10,color:typeFilter===t.id?C.terra:C.subtext,whiteSpace:"nowrap",fontFamily:"Cormorant Garamond,serif"}}>{t.emoji} {t.label}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:3}}>
        {[["all","Tous"],["cave","En cave"],["tasted","Goûtés"],["top","⭐ Top"],["avoid","🚫 Éviter"]].map(([id,l])=>(
          <button key={id} onClick={()=>setFilter(id)} style={{background:filter===id?"rgba(184,134,42,.15)":"rgba(139,90,60,.05)",border:`1px solid ${filter===id?"rgba(184,134,42,.4)":"rgba(139,90,60,.15)"}`,borderRadius:20,padding:"6px 12px",fontSize:10,color:filter===id?C.gold:C.subtext,whiteSpace:"nowrap",fontFamily:"Cormorant Garamond,serif"}}>{l}</button>
        ))}
      </div>
      {displayed.length===0?(<div style={{textAlign:"center",padding:"40px 0",color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",fontSize:14}}>Aucun vin dans cette catégorie.</div>):(
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {displayed.map((wine,i)=>{const tc=typeColor(wine.type);const tl=typeLight(wine.type);return(
            <button key={wine.id} onClick={()=>{haptic(30);onOpenWine(wine);}} style={{background:C.bgCard,border:`1px solid ${tc}22`,borderRadius:16,padding:"14px",textAlign:"left",transition:"all .2s",animation:`fadeUp .35s ease ${i*.04}s both`,opacity:0,display:"flex",alignItems:"center",gap:12,boxShadow:`0 2px 10px rgba(139,90,60,.07)`}}>
              <div style={{width:46,height:46,borderRadius:"50%",flexShrink:0,background:tl,border:`1px solid ${tc}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21}}>{typeEmoji(wine.type)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{wine.producer||wine.name||"Vin sans nom"}</div>
                <div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{[wine.region,wine.country,wine.year].filter(Boolean).join(" · ")}</div>
              </div>
              <div style={{flexShrink:0,textAlign:"right"}}>
                {wine.tasted&&wine.rating!==null?(<div><div style={{fontSize:17,fontFamily:"Playfair Display,serif",color:wine.rating>=4?C.sauge:wine.rating>=2?C.gold:C.terra,fontWeight:600}}>{wine.rating}/5</div><div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif"}}>{"★".repeat(wine.rating)}{"☆".repeat(5-wine.rating)}</div></div>):!wine.tasted?(<div style={{fontSize:14,color:C.gold,background:"rgba(184,134,42,.1)",border:"1px solid rgba(184,134,42,.25)",borderRadius:10,padding:"4px 8px",fontFamily:"Cormorant Garamond,serif"}}>🗄️ Cave</div>):(<div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif"}}>Non noté</div>)}
              </div>
            </button>
          );})}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   HELPER — Suggestions via Claude + lien Vivino
   Claude génère les vins,
   chaque carte a un lien direct vers Wine-Searcher.
═══════════════════════════════════════════════════════════════ */

// Claude génère une sélection de vins avec liens Vivino
async function fetchVivinoSuggestions(db, opts = {}) {
  const liked    = db.filter(w=>w.tasted&&w.rating>=3).map(w=>`${w.type} ${w.region}`).join(", ");
  const disliked = db.filter(w=>w.tasted&&w.rating<=1).map(w=>w.type).join(", ");
  const query    = opts.query || null;

  const prompt = query
    ? `Tu es sommelier expert. Recherche : "${query}".${liked?` Goûts : ${liked}.`:""}
Propose 5 vins réels qui correspondent. JSON strict sans markdown :
[{"name":"Château X","producer":"Domaine Y","type":"rouge","region":"Bordeaux","country":"France","year":2019,"rating":"4.2","ratings_count":"52000","price_range":"25-35€","grapes":"Merlot, Cabernet","description":"2 phrases arômes et style","search_query":"Château X 2019"}]`
    : `Tu es sommelier. Propose 5 vins diversifiés et excellents.${liked?` Pour quelqu'un qui aime : ${liked}.`:""}${disliked?` Éviter : ${disliked}.`:""}
Vins variés (pays, types, prix différents). JSON strict sans markdown :
[{"name":"Château X","producer":"Domaine Y","type":"rouge","region":"Bordeaux","country":"France","year":2019,"rating":"4.2","ratings_count":"52000","price_range":"25-35€","grapes":"Merlot, Cabernet","description":"2 phrases arômes et style","search_query":"Château X 2019"}]`;

  const txt = await callClaude([{role:"user",content:prompt}], 1200);
  const arr = safeJson(txt, []);
  const wines = Array.isArray(arr) ? arr : (arr.wines || []);

  // Construire le lien Vivino pour chaque vin
  return wines.map(w => ({
    ...w,
    type: w.type||"autre",
    wine_url: `https://www.wine-searcher.com/find/${encodeURIComponent((w.search_query||(`${w.name} ${w.year||""}`.trim())).replace(/\s+/g,"+"))}`,
    image: null,
  }));
}
/* ═══════════════════════════════════════════════════════════════
   DÉCOUVRIR — Vivino live + recherche libre
═══════════════════════════════════════════════════════════════ */
const Decouvrir=({db})=>{
  const [mode,setMode]=useState("suggestions");

  // ── Suggestions Vivino ──────────────────────────────────────
  const [vivinoWines,setVivinoWines]=useState(null);   // null=pas encore chargé
  const [vivinoPhase,setVivinoPhase]=useState("idle"); // idle|generating|fetching|done|error
  const [vivinoMsg,setVivinoMsg]=useState("");
  const [vivinoError,setVivinoError]=useState("");
  const [elapsed,setElapsed]=useState(0);

  // Timer d'élapsed pendant le chargement
  useEffect(()=>{
    if(vivinoPhase==="generating"||vivinoPhase==="fetching"){
      const t=setInterval(()=>setElapsed(e=>e+1),1000);
      return()=>clearInterval(t);
    }
  },[vivinoPhase]);

  const loadVivinoSuggestions=async()=>{
    setVivinoPhase("generating"); setVivinoError(""); setElapsed(0);
    setVivinoMsg("Le Sommelier compose votre sélection…");
    try {
      const wines = await fetchVivinoSuggestions(db);
      setVivinoWines(wines);
      setVivinoPhase("done");
    } catch(e) {
      setVivinoError(e.message||"Erreur inconnue");
      setVivinoPhase("error");
    }
  };

  // ── Recherche libre ─────────────────────────────────────────
  const [query,setQuery]=useState("");
  const [searchPhase,setSearchPhase]=useState("idle"); // idle|searching|vivino|done|error
  const [searchResults,setSearchResults]=useState(null);
  const [searchError,setSearchError]=useState("");
  const [searchElapsed,setSearchElapsed]=useState(0);

  useEffect(()=>{
    if(searchPhase==="searching"||searchPhase==="vivino"){
      const t=setInterval(()=>setSearchElapsed(e=>e+1),1000);
      return()=>clearInterval(t);
    }
  },[searchPhase]);

  const doSearch=async()=>{
    if(!query.trim())return;
    setSearchPhase("searching"); setSearchError(""); setSearchResults(null); setSearchElapsed(0);
    try {
      setSearchPhase("vivino");
      const wines = await fetchVivinoSuggestions(db, {query});
      setSearchResults(wines);
      setSearchPhase("done");
    } catch(e) {
      setSearchError(e.message||"Erreur");
      setSearchPhase("error");
    }
  };

  // ── Carte vin Vivino ────────────────────────────────────────
  const VivinoCard=({wine,idx})=>{
    const tc=typeColor(wine.type||"rouge");
    const tl=typeLight(wine.type||"rouge");
    return(
      <div style={{background:C.bgCard,border:`1px solid ${tc}28`,borderRadius:18,padding:"16px",animation:`fadeUp .4s ease ${idx*.07}s both`,opacity:0,boxShadow:`0 3px 14px rgba(139,90,60,.07)`}}>
        <div style={{display:"flex",gap:12,marginBottom:12}}>
          {/* Image ou emoji */}
          {wine.image?(
            <img src={wine.image} alt={wine.name} style={{width:52,height:52,borderRadius:10,objectFit:"cover",flexShrink:0,border:`1px solid ${tc}33`}}
              onError={e=>{e.target.style.display="none";}}/>
          ):(
            <div style={{width:52,height:52,borderRadius:10,flexShrink:0,background:tl,border:`1px solid ${tc}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{typeEmoji(wine.type||"rouge")}</div>
          )}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,lineHeight:1.3,marginBottom:3}}>{wine.name}</div>
            <div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>{[wine.producer,wine.year].filter(Boolean).join(" · ")}</div>
          </div>
          {/* Note estimée */}
          {wine.rating&&(
            <div style={{flexShrink:0,textAlign:"right"}}>
              <div style={{fontSize:20,fontFamily:"Playfair Display,serif",color:C.gold,fontWeight:600,lineHeight:1}}>{parseFloat(wine.rating).toFixed(1)}</div>
              <div style={{fontSize:10,color:C.muted,fontFamily:"Cormorant Garamond,serif",letterSpacing:".06em"}}>/ 5.0</div>
              {wine.ratings_count&&<div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif"}}>{wine.ratings_count.toLocaleString()} avis</div>}
            </div>
          )}
        </div>

        {/* Tags */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {[WINE_TYPES.find(t=>t.id===wine.type)?.label,wine.region,wine.country].filter(Boolean).map(tag=>(<Tag key={tag}>{tag}</Tag>))}
          {wine.grapes&&<Tag>{wine.grapes.split(",")[0].trim()}</Tag>}
        </div>

        {/* Description */}
        {wine.description&&(
          <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.75,marginBottom:10}}>{wine.description.slice(0,200)}{wine.description.length>200?"…":""}</p>
        )}

        {/* Prix + profil gustatif */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,alignItems:"center"}}>
          {wine.price_range&&(
            <div style={{fontSize:14,color:C.gold,fontFamily:"Playfair Display,serif",fontWeight:600}}>{wine.price_range}</div>
          )}
          {[wine.acidity&&`Acidité ${wine.acidity}`,wine.tannin&&`Tanin ${wine.tannin}`,wine.sweetness&&`Douceur ${wine.sweetness}`].filter(Boolean).map(t=>(
            <span key={t} style={{fontSize:10,color:C.muted,background:"rgba(139,90,60,.06)",border:"1px solid rgba(139,90,60,.15)",borderRadius:20,padding:"3px 9px",fontFamily:"Cormorant Garamond,serif"}}>{t}</span>
          ))}
        </div>

        {/* Lien Vivino */}
        <a href={wine.wine_url||`https://www.wine-searcher.com/find/${encodeURIComponent((wine.name+" "+(wine.year||"")).trim().replace(/\s+/g,"+"))}`}
          target="_blank" rel="noopener noreferrer"
          style={{display:"inline-flex",alignItems:"center",gap:7,
            background:`linear-gradient(135deg,rgba(200,80,58,.12),rgba(184,134,42,.08))`,
            border:`1px solid rgba(200,80,58,.3)`,borderRadius:18,padding:"8px 16px",
            textDecoration:"none",color:C.terra,fontSize:10,letterSpacing:".12em",
            textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:600}}>
          <span style={{fontSize:14}}>🔍</span> Wine-Searcher
        </a>
      </div>
    );
  };

  // ── Loader avec progression ─────────────────────────────────
  const LoadingWine=({msg,elapsed,phase})=>{
    const steps=[
      {id:"generating",label:"Le Sommelier compose votre sélection",done:phase==="done"},
    ];
    return(
      <div style={{textAlign:"center",padding:"40px 20px"}}>
        {/* Verre animé */}
        <div style={{fontSize:56,marginBottom:20,animation:"pulse 1.5s ease-in-out infinite"}}>🍷</div>
        <div style={{fontSize:16,fontFamily:"Playfair Display,serif",color:C.cream,marginBottom:6}}>{msg}</div>
        <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:28}}>{elapsed}s…</div>

        {/* Étapes */}
        <div style={{display:"flex",flexDirection:"column",gap:10,maxWidth:280,margin:"0 auto 24px"}}>
          {steps.map((s,i)=>{
            const active=(s.id===phase)||(s.id==="fetching"&&phase==="fetching");
            return(
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,
                  background:s.done?`linear-gradient(135deg,${C.sauge},#4a7a2e)`:active?"rgba(200,80,58,.15)":"rgba(139,90,60,.06)",
                  border:`1px solid ${s.done?C.sauge:active?C.terra:"rgba(139,90,60,.2)"}`,
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {s.done?(
                    <span style={{fontSize:14,color:"#fff"}}>✓</span>
                  ):active?(
                    <div style={{width:10,height:10,borderRadius:"50%",border:`1.5px solid ${C.terra}`,borderTopColor:"transparent",animation:"spin 0.8s linear infinite"}}/>
                  ):(
                    <div style={{width:6,height:6,borderRadius:"50%",background:"rgba(139,90,60,.3)"}}/>
                  )}
                </div>
                <span style={{fontSize:14,color:s.done?C.sauge:active?C.terra:C.muted,fontFamily:"Cormorant Garamond,serif",fontWeight:active||s.done?600:400}}>{s.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>
          Sélection personnalisée en cours…
        </div>
      </div>
    );
  };

  const liked=db.filter(w=>w.tasted&&w.rating>=4);

  return(
    <div style={{flex:1,overflowY:"auto",padding:"14px 16px 100px"}}>
      {/* Toggle */}
      <div style={{display:"flex",background:"rgba(139,90,60,.08)",border:`1px solid rgba(139,90,60,.15)`,borderRadius:14,padding:4,gap:4,marginBottom:18}}>
        {[["suggestions","✦ Découvrir"],["search","🔍 Recherche"]].map(([id,l])=>(
          <button key={id} onClick={()=>setMode(id)} style={{flex:1,padding:"10px",borderRadius:11,background:mode===id?`linear-gradient(135deg,${C.terra},${C.terraD})`:"transparent",color:mode===id?"#fff":C.subtext,fontSize:14,letterSpacing:".06em",fontFamily:"Cormorant Garamond,serif",transition:"all .25s"}}>{l}</button>
        ))}
      </div>

      {/* ── MODE SUGGESTIONS VIVINO ── */}
      {mode==="suggestions"&&(
        <>
          {vivinoPhase==="idle"&&(
            <div style={{textAlign:"center",padding:"30px 20px"}}>
              <div style={{fontSize:64,marginBottom:16}}>🍷</div>
              <h2 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8}}>Découvertes du Jour</h2>
              <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.7,marginBottom:8}}>
                {liked.length>0
                  ? `Basé sur vos ${liked.length} vins préférés, votre sommelier compose une sélection personnalisée.`
                  : "Votre sommelier compose une sélection du jour."}
              </p>
              <p style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",marginBottom:28}}>⏱ Environ 30–60 secondes</p>
              <button onClick={loadVivinoSuggestions} style={{background:`linear-gradient(135deg,${C.terra},${C.terraD})`,color:"#fff",border:"none",padding:"16px 32px",borderRadius:50,fontSize:14,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:700,boxShadow:`0 8px 28px rgba(200,80,58,.3)`}}>
                Voir la sélection →
              </button>
            </div>
          )}

          {(vivinoPhase==="generating"||vivinoPhase==="fetching")&&(
            <LoadingWine msg={vivinoMsg} elapsed={elapsed} phase={vivinoPhase}/>
          )}

          {vivinoPhase==="error"&&(
            <div style={{textAlign:"center",padding:"30px 20px"}}>
              <div style={{fontSize:48,marginBottom:14}}>⚠️</div>
              <div style={{fontSize:15,fontFamily:"Playfair Display,serif",color:C.cream,marginBottom:8}}>Oups, une erreur</div>
              <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:24,lineHeight:1.6}}>{vivinoError}</div>
              <button onClick={loadVivinoSuggestions} style={{background:`rgba(200,80,58,.12)`,border:`1px solid rgba(200,80,58,.35)`,borderRadius:22,padding:"11px 26px",color:C.terra,fontSize:14,fontFamily:"Playfair Display,serif"}}>Réessayer</button>
            </div>
          )}

          {vivinoPhase==="done"&&vivinoWines&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:16}}>
                <div>
                  <h2 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:4}}>Sélection du Sommelier</h2>
                  <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>Via Claude · {vivinoWines.length} vins</p>
                </div>
                <button onClick={()=>{setVivinoPhase("idle");setVivinoWines(null);}} style={{flexShrink:0,display:"flex",alignItems:"center",gap:6,background:"rgba(184,134,42,.1)",border:`1px solid rgba(184,134,42,.3)`,borderRadius:22,padding:"8px 14px",color:C.gold,fontSize:14,fontFamily:"Cormorant Garamond,serif"}}>
                  ↺ Nouvelle
                </button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {vivinoWines.map((w,i)=><VivinoCard key={i} wine={w} idx={i}/>)}
              </div>
            </>
          )}
        </>
      )}

      {/* ── MODE RECHERCHE LIBRE ── */}
      {mode==="search"&&(
        <>
          <div style={{marginBottom:16}}>
            <h2 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:4}}>Recherche de Vins</h2>
            <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>Décrivez ce que vous cherchez.</p>
          </div>

          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <input value={query} onChange={e=>setQuery(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&searchPhase==="idle"&&doSearch()}
              placeholder="Ex: Pinot Noir Bourgogne, Malbec argentin…"
              style={{flex:1,background:C.bgCard,border:`1px solid rgba(139,90,60,.22)`,borderRadius:14,padding:"12px 15px",color:C.cream,fontSize:14,fontFamily:"Cormorant Garamond,serif",boxShadow:`0 2px 8px rgba(139,90,60,.06)`}}/>
            <button onClick={doSearch} disabled={searchPhase!=="idle"&&searchPhase!=="done"&&searchPhase!=="error"||!query.trim()}
              style={{background:query.trim()?`linear-gradient(135deg,${C.terra},${C.terraD})`:"rgba(139,90,60,.1)",border:"none",borderRadius:14,padding:"12px 16px",color:query.trim()?"#fff":C.muted,fontSize:14,flexShrink:0,transition:"all .2s"}}>
              {searchPhase==="searching"||searchPhase==="vivino"?"…":"→"}
            </button>
          </div>

          {/* Suggestions rapides */}
          {searchPhase==="idle"&&!searchResults&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:18}}>
              {["Bordeaux puissant","Blanc minéral","Champagne grower","Vin naturel","Malbec argentin","Riesling sec","Sangiovese","Orange wine"].map(s=>(
                <button key={s} onClick={()=>setQuery(s)} style={{background:"rgba(184,134,42,.08)",border:"1px solid rgba(184,134,42,.22)",borderRadius:20,padding:"7px 13px",fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>{s}</button>
              ))}
            </div>
          )}

          {(searchPhase==="searching"||searchPhase==="vivino")&&(
            <LoadingWine
              msg={searchPhase==="searching"?"Claude prépare la recherche…":"Recherche en cours…"}
              elapsed={searchElapsed}
              phase={searchPhase==="searching"||searchPhase==="vivino"?"generating":"done"}
            />
          )}

          {searchPhase==="error"&&(
            <div style={{background:`rgba(200,80,58,.07)`,border:`1px solid rgba(200,80,58,.22)`,borderRadius:14,padding:"13px 16px",textAlign:"center",marginBottom:14}}>
              <div style={{fontSize:14,color:C.terra,fontFamily:"Cormorant Garamond,serif",marginBottom:10}}>{searchError}</div>
              <button onClick={doSearch} style={{color:C.gold,textDecoration:"underline",fontSize:14,fontFamily:"Cormorant Garamond,serif",background:"none"}}>Réessayer</button>
            </div>
          )}

          {searchPhase==="done"&&searchResults&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>{searchResults.length} résultat{searchResults.length>1?"s":""}</div>
                <button onClick={()=>{setSearchResults(null);setSearchPhase("idle");setQuery("");}} style={{fontSize:10,color:C.muted,fontFamily:"Cormorant Garamond,serif",textDecoration:"underline",background:"none"}}>Nouvelle recherche</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {searchResults.map((w,i)=><VivinoCard key={i} wine={w} idx={i}/>)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ACCUEIL — Page d'accueil personnalisée avec 3 vins du jour
═══════════════════════════════════════════════════════════════ */
const Accueil=({db,userName,onSetName,onAdd,onOpenWine})=>{
  const [wines,setWines]=useState(null);
  const [phase,setPhase]=useState("idle"); // idle|loading|done|error
  const [error,setError]=useState("");
  const [editingName,setEditingName]=useState(!userName);
  const [nameInput,setNameInput]=useState(userName||"");

  // Heure du jour pour la salutation
  const hour=new Date().getHours();
  const greeting=hour<12?"Bonjour":hour<18?"Bon après-midi":"Bonsoir";

  // Charger les 3 vins au montage (si nom connu)
  useEffect(()=>{
    if(userName && !wines && phase==="idle") loadWines();
  },[userName]);

  const loadWines=async()=>{
    setPhase("loading"); setError("");
    try {
      const rated = db.filter(w=>w.tasted&&w.rating!=null);
      const liked = rated.filter(w=>w.rating>=4).map(w=>`${w.type} ${w.region||w.country||""}`).join(", ");
      const disliked = rated.filter(w=>w.rating<=1).map(w=>w.type).join(", ");

      const prompt = `Tu es sommelier expert. Réponds UNIQUEMENT avec un tableau JSON valide, rien d'autre, pas de texte avant ou après, pas de markdown.
Propose exactement 3 vins pour ${userName||"cet utilisateur"}.
${liked?`Goûts appréciés : ${liked}.`:"Pas encore de préférences — propose des classiques polyvalents."}
${disliked?`À éviter absolument : ${disliked}.`:""}
1 vin par gamme : budget(10-30€), milieu(30-75€), prestige(75€+).
FORMAT EXACT — commence directement par [ :
[{"name":"Château X","producer":"Domaine Y","type":"rouge","region":"Bordeaux","country":"France","year":2020,"price_range":"18-24€","grapes":"Merlot, Cabernet","description":"2 phrases arômes et style","why":"Raison personnalisée","search_query":"Chateau X 2020","budget":"budget"},{"name":"...","producer":"...","type":"blanc","region":"...","country":"...","year":2021,"price_range":"45-55€","grapes":"...","description":"...","why":"...","search_query":"...","budget":"milieu"},{"name":"...","producer":"...","type":"rouge","region":"...","country":"...","year":2019,"price_range":"90-120€","grapes":"...","description":"...","why":"...","search_query":"...","budget":"prestige"}]`;

      const txt = await callClaude([{role:"user",content:prompt}], 1500);
      const arr = safeJson(txt, []);
      const list = Array.isArray(arr) ? arr : [];
      setWines(list.slice(0,3));
      setPhase("done");
    } catch(e) {
      setError(e.message||"Erreur");
      setPhase("error");
    }
  };

  const saveName=()=>{
    if(!nameInput.trim()) return;
    onSetName(nameInput.trim());
    setEditingName(false);
    setPhase("idle");
    setTimeout(loadWines, 100);
  };

  const BUDGET_LABELS={budget:"10–30€",milieu:"30–75€",prestige:"75€+"};
  const BUDGET_COLORS={budget:C.sauge,milieu:C.gold,prestige:C.terra};

  // Écran saisie du prénom
  if(editingName) return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 28px",textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:20}}>🍷</div>
      <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,marginBottom:8}}>Bienvenue</h2>
      <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:32,lineHeight:1.7}}>Comment puis-je vous appeler ?</p>
      <input
        value={nameInput}
        onChange={e=>setNameInput(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&saveName()}
        placeholder="Votre prénom…"
        autoFocus
        style={{width:"100%",maxWidth:280,background:C.bgCard,border:`1px solid rgba(139,90,60,.25)`,borderRadius:16,padding:"14px 18px",color:C.cream,fontSize:16,fontFamily:"Playfair Display,serif",textAlign:"center",marginBottom:16,outline:"none"}}
      />
      <button onClick={saveName} disabled={!nameInput.trim()} style={{background:`linear-gradient(135deg,${C.terra},${C.terraD})`,color:"#fff",border:"none",padding:"14px 36px",borderRadius:50,fontSize:14,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:700,opacity:nameInput.trim()?1:.4}}>
        Entrer →
      </button>
    </div>
  );

  return(
    <div style={{flex:1,overflowY:"auto",padding:"20px 16px 100px"}}>

      {/* Salutation */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:4}}>{greeting},</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h2 style={{fontSize:30,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400}}>{userName} <span style={{color:C.terra}}>✦</span></h2>
          <button onClick={()=>{setEditingName(true);setNameInput(userName);}} style={{fontSize:14,color:C.muted,background:"none",fontFamily:"Cormorant Garamond,serif",textDecoration:"underline"}}>Changer</button>
        </div>
        <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginTop:6,lineHeight:1.6}}>
          {db.filter(w=>w.tasted).length>0
            ? `Basé sur vos ${db.filter(w=>w.tasted).length} dégustation${db.filter(w=>w.tasted).length>1?"s":""}, voici ma sélection du jour.`
            : "Voici ma sélection du jour — notez des vins pour l'affiner."}
        </p>
      </div>

      {/* Ligne déco */}
      <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.terra}66,transparent)`,marginBottom:24}}/>

      {/* Titre section */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h3 style={{fontSize:18,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400}}>Je vous propose ces 3 vins</h3>
          <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",marginTop:2}}>Une sélection sur 3 gammes de prix</div>
        </div>
        {phase==="done"&&(
          <button onClick={loadWines} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(184,134,42,.1)",border:`1px solid rgba(184,134,42,.3)`,borderRadius:20,padding:"7px 13px",color:C.gold,fontSize:14,fontFamily:"Cormorant Garamond,serif"}}>
            <span style={{fontSize:13}}>↺</span> Autre
          </button>
        )}
      </div>

      {/* Loader */}
      {phase==="loading"&&(
        <div style={{textAlign:"center",padding:"50px 20px"}}>
          <div style={{fontSize:48,marginBottom:16,animation:"pulse 1.5s ease-in-out infinite"}}>🍷</div>
          <div style={{fontSize:15,fontFamily:"Playfair Display,serif",color:C.cream,marginBottom:6}}>Le Sommelier réfléchit…</div>
          <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>Sélection personnalisée en cours</div>
        </div>
      )}

      {/* Erreur */}
      {phase==="error"&&(
        <div style={{textAlign:"center",padding:"30px 16px"}}>
          <div style={{fontSize:14,color:C.terra,fontFamily:"Cormorant Garamond,serif",marginBottom:14}}>{error}</div>
          <button onClick={loadWines} style={{background:`rgba(200,80,58,.1)`,border:`1px solid rgba(200,80,58,.3)`,borderRadius:20,padding:"10px 24px",color:C.terra,fontSize:14,fontFamily:"Playfair Display,serif"}}>Réessayer</button>
        </div>
      )}

      {/* Idle — pas encore chargé */}
      {phase==="idle"&&(
        <div style={{textAlign:"center",padding:"40px 16px"}}>
          <button onClick={loadWines} style={{background:`linear-gradient(135deg,${C.terra},${C.terraD})`,color:"#fff",border:"none",padding:"16px 36px",borderRadius:50,fontSize:14,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:700,boxShadow:`0 8px 24px rgba(200,80,58,.25)`}}>
            Voir ma sélection →
          </button>
        </div>
      )}

      {/* Les 3 vins */}
      {phase==="done"&&wines&&wines.map((wine,i)=>{
        const tc=typeColor(wine.type||"rouge");
        const tl=typeLight(wine.type||"rouge");
        const budgetColor=BUDGET_COLORS[wine.budget]||C.gold;
        const budgetLabel=BUDGET_LABELS[wine.budget]||wine.price_range||"";
        return(
          <div key={i} style={{background:C.bgCard,border:`1px solid ${tc}22`,borderRadius:20,padding:"18px",marginBottom:14,animation:`fadeUp .4s ease ${i*.12}s both`,opacity:0,boxShadow:`0 4px 16px rgba(139,90,60,.07)`}}>

            {/* Badge gamme de prix */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:tl,border:`1px solid ${tc}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{typeEmoji(wine.type||"rouge")}</div>
                <div>
                  <div style={{fontSize:15,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,lineHeight:1.2}}>{wine.name}</div>
                  <div style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif"}}>{wine.producer}</div>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                <div style={{fontSize:14,fontFamily:"Playfair Display,serif",color:budgetColor,fontWeight:700}}>{wine.price_range}</div>
                <div style={{fontSize:14,color:budgetColor,background:`${budgetColor}15`,border:`1px solid ${budgetColor}33`,borderRadius:10,padding:"2px 7px",fontFamily:"Cormorant Garamond,serif",letterSpacing:".06em",marginTop:2}}>{budgetLabel}</div>
              </div>
            </div>

            {/* Tags */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
              {[WINE_TYPES.find(t=>t.id===wine.type)?.label,wine.region,wine.country,wine.year].filter(Boolean).map(tag=>(<Tag key={String(tag)}>{tag}</Tag>))}
              {wine.grapes&&<Tag>{wine.grapes.split(",")[0].trim()}</Tag>}
            </div>

            {/* Why + description */}
            {wine.why&&<p style={{fontSize:14,color:C.terra,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.7,marginBottom:6,fontWeight:600}}>{wine.why}</p>}
            {wine.description&&<p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",lineHeight:1.7,marginBottom:12}}>{wine.description}</p>}

            {/* Bouton Wine-Searcher */}
            <a href={`https://www.wine-searcher.com/find/${encodeURIComponent((wine.search_query||wine.name).replace(/\s+/g,"+"))}`}
              target="_blank" rel="noopener noreferrer"
              style={{display:"inline-flex",alignItems:"center",gap:7,
                background:`linear-gradient(135deg,rgba(200,80,58,.1),rgba(184,134,42,.06))`,
                border:`1px solid rgba(200,80,58,.28)`,borderRadius:18,padding:"8px 16px",
                textDecoration:"none",color:C.terra,fontSize:10,letterSpacing:".12em",
                textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:600}}>
              🔍 Wine-Searcher
            </a>
          </div>
        );
      })}

      {/* CTA cave vide */}
      {phase==="done"&&db.length===0&&(
        <div style={{background:`rgba(184,134,42,.06)`,border:`1px solid rgba(184,134,42,.2)`,borderRadius:16,padding:"16px",marginTop:8,textAlign:"center"}}>
          <p style={{fontSize:14,color:C.subtext,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.7,marginBottom:12}}>Notez vos vins pour affiner la sélection selon vos goûts réels.</p>
          <button onClick={onAdd} style={{background:`linear-gradient(135deg,${C.terra},${C.terraD})`,color:"#fff",border:"none",padding:"11px 24px",borderRadius:30,fontSize:14,letterSpacing:".15em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:600}}>+ Ajouter un vin</button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════ */
export default function UnwinedApp() {
  const [db,setDb]=useState(()=>{try{return JSON.parse(localStorage.getItem("unwined_v4_db"))||[];}catch{return[];}});
  const [userName,setUserName]=useState(()=>localStorage.getItem("unwined_v4_name")||"");
  const [screen,setScreen]=useState("accueil");
  const [selected,setSelected]=useState(null);
  const [tab,setTab]=useState("accueil");

  useEffect(()=>{try{localStorage.setItem("unwined_v4_db",JSON.stringify(db));}catch{}},[db]);
  useEffect(()=>{if(userName)localStorage.setItem("unwined_v4_name",userName);},[userName]);

  const addWine=(wine)=>{setDb(d=>[wine,...d]);setScreen("cave");setTab("cave");};
  const updateRating=(id,rating)=>{setDb(d=>d.map(w=>w.id===id?{...w,tasted:true,rating}:w));if(selected?.id===id)setSelected(s=>({...s,tasted:true,rating}));};
  const openWine=(wine)=>{setSelected(wine);setScreen("detail");};

  const TABS=[{id:"accueil",label:"Accueil",icon:"🏠"},{id:"cave",label:"Ma Cave",icon:"🗄️"},{id:"scan",label:"Scanner",icon:"📷"},{id:"decouvrir",label:"Découvrir",icon:"✦"}];

  return(
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:C.bg,fontFamily:"Cormorant Garamond,Georgia,serif",display:"flex",flexDirection:"column",position:"relative"}}>
      <style dangerouslySetInnerHTML={{__html:GLOBAL_CSS}}/>

      {/* ── HEADER ── */}
      {!["detail","scan"].includes(screen)&&(
        <div style={{padding:"28px 20px 0",flexShrink:0}}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:14,color:C.muted,letterSpacing:".38em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginBottom:8}}>Votre sommelier personnel</div>
            {/* Logo Unwine-D centré avec tiret stylisé */}
            <div style={{display:"inline-flex",alignItems:"center",gap:10,justifyContent:"center"}}>
              <span style={{fontSize:22,animation:"pulse 3s ease-in-out infinite",filter:`drop-shadow(0 3px 8px rgba(200,80,58,.3))`}}>🍷</span>
              <h1 style={{fontSize:36,fontFamily:"Playfair Display,serif",fontWeight:600,letterSpacing:".03em",lineHeight:1}}>
                <span style={{color:C.cream}}>Unwine</span>
                <span style={{color:C.terra}}>-D</span>
              </h1>
            </div>
          </div>
          <div style={{height:1,background:`linear-gradient(90deg,transparent 0%,${C.terra}88 30%,${C.terra}88 70%,transparent 100%)`}}/>
        </div>
      )}

      {/* ── SCREENS ── */}
      {screen==="add"&&<AddWineForm onSave={addWine} onCancel={()=>{setScreen("cave");setTab("cave");}}/>}
      {screen==="detail"&&selected&&<WineDetail wine={selected} onBack={()=>setScreen("cave")} onUpdateRating={updateRating}/>}
      {screen==="scan"&&<SmartScanner db={db} onResult={wine=>addWine(wine)} onBack={()=>setScreen("cave")}/>}

      {!["detail","scan"].includes(screen)&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {tab==="accueil"&&<Accueil db={db} userName={userName} onSetName={setUserName} onAdd={()=>setScreen("add")} onOpenWine={openWine}/>}
          {tab==="cave"&&<MaCave db={db} onOpenWine={openWine} onAdd={()=>setScreen("add")}/>}
          {tab==="decouvrir"&&<Decouvrir db={db}/>}
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      {!["detail","scan"].includes(screen)&&(
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:100,background:`linear-gradient(transparent,${C.bg} 35%)`,padding:"8px 14px 22px"}}>
          <div style={{display:"flex",background:"rgba(255,252,248,.95)",border:`1px solid rgba(139,90,60,.18)`,borderRadius:22,padding:"4px",gap:2,boxShadow:`0 -4px 20px rgba(139,90,60,.1)`}}>
            {TABS.map(t=>{
              const isActive=tab===t.id;
              return(
                <button key={t.id} onClick={()=>{haptic(30);if(t.id==="scan"){setScreen("scan");}else{setTab(t.id);setScreen(t.id);}}} style={{flex:1,background:isActive?`linear-gradient(135deg,${C.terra},${C.terraD})`:"transparent",border:"none",borderRadius:18,padding:"11px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .25s"}}>
                  <span style={{fontSize:t.id==="add"?20:15,lineHeight:1}}>{t.icon}</span>
                  <span style={{fontSize:10,letterSpacing:".06em",textTransform:"uppercase",color:isActive?"#fff":C.muted,fontFamily:"Cormorant Garamond,serif",lineHeight:1}}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
