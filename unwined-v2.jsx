/**
 * UNWINE-D V2 — Cave Intelligente
 * Formulaire structuré + Scanner + Suggestions IA
 */
import React, { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════ */
const C = {
  dark:    "#0D0208",
  card:    "#160610",
  border:  "rgba(196,165,90,0.15)",
  borderHover: "rgba(196,165,90,0.45)",
  terra:   "#E2725B",
  gold:    "#C4A55A",
  cream:   "#F5F0E8",
  muted:   "rgba(245,240,232,0.38)",
  faint:   "rgba(245,240,232,0.07)",
  sauge:   "#87A96B",
  lieDeVin:"#5C1A2E",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Bebas+Neue&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
  html, body { background:${C.dark}; overscroll-behavior:none; -webkit-overflow-scrolling:touch; }
  button { border:none; background:none; cursor:pointer; touch-action:manipulation; }
  button:focus, input:focus, select:focus, textarea:focus { outline:none; }
  ::-webkit-scrollbar { width:0; }
  select option { background:#1a0812; color:#F5F0E8; }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes slideUp  { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes shimmer  { 0%,100%{opacity:.4} 50%{opacity:1} }
  @keyframes pulse    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
  @keyframes goldGlow { 0%,100%{box-shadow:0 0 0 rgba(196,165,90,0)} 50%{box-shadow:0 0 20px rgba(196,165,90,.25)} }
`;

/* ═══════════════════════════════════════════════════════════════
   DATA — Pays & Régions
═══════════════════════════════════════════════════════════════ */
const COUNTRIES = {
  "France": {
    flag: "🇫🇷",
    regions: ["Bordeaux","Bourgogne","Rhône","Loire","Alsace","Champagne","Provence","Languedoc-Roussillon","Sud-Ouest","Beaujolais","Jura","Savoie","Corse"]
  },
  "Italie": {
    flag: "🇮🇹",
    regions: ["Toscane","Piémont","Vénétie","Sicile","Campanie","Ombrie","Lombardie","Sardaigne","Puglia","Calabre"]
  },
  "Espagne": {
    flag: "🇪🇸",
    regions: ["Rioja","Priorat","Ribera del Duero","Galice","Jerez","Cava","Catalogne","Castille"]
  },
  "Portugal": {
    flag: "🇵🇹",
    regions: ["Douro","Alentejo","Vinho Verde","Dão","Bairrada","Setúbal","Algarve"]
  },
  "Allemagne": {
    flag: "🇩🇪",
    regions: ["Moselle","Rheingau","Pfalz","Bade","Franconie","Rheinhessen"]
  },
  "Argentine": {
    flag: "🇦🇷",
    regions: ["Mendoza","Salta","Patagonie","San Juan","La Rioja"]
  },
  "Chili": {
    flag: "🇨🇱",
    regions: ["Maipo","Colchagua","Casablanca","Maule","Aconcagua"]
  },
  "Australie": {
    flag: "🇦🇺",
    regions: ["Barossa Valley","McLaren Vale","Margaret River","Yarra Valley","Clare Valley"]
  },
  "Afrique du Sud": {
    flag: "🇿🇦",
    regions: ["Stellenbosch","Swartland","Franschhoek","Paarl","Walker Bay"]
  },
  "États-Unis": {
    flag: "🇺🇸",
    regions: ["Napa Valley","Sonoma","Willamette Valley","Central Coast","Washington State"]
  },
  "Nouvelle-Zélande": {
    flag: "🇳🇿",
    regions: ["Marlborough","Hawke's Bay","Central Otago","Martinborough"]
  },
  "Grèce": {
    flag: "🇬🇷",
    regions: ["Santorin","Péloponnèse","Macédoine","Crète","Thessalie"]
  },
  "Autre": {
    flag: "🌍",
    regions: ["Géorgie","Autriche","Hongrie","Slovénie","Liban","Israël","Japon","Maroc","Autre"]
  }
};

const WINE_TYPES = [
  { id:"rouge",    label:"Rouge",    emoji:"🍷", color:"#8B1A2F" },
  { id:"blanc",    label:"Blanc",    emoji:"🥂", color:"#C4A55A" },
  { id:"rose",     label:"Rosé",     emoji:"🌸", color:"#E8839A" },
  { id:"mousseux", label:"Mousseux", emoji:"🍾", color:"#FAF8F0" },
  { id:"autre",    label:"Autre",    emoji:"🫗", color:"#87A96B"  },
];

/* ═══════════════════════════════════════════════════════════════
   TEMPLATES DE TEXTE POÉTIQUE (sans IA)
═══════════════════════════════════════════════════════════════ */
const REGION_STORIES = {
  "Bordeaux": "Les rives de la Gironde distillent depuis des siècles une élégance structurée, où le Cabernet Sauvignon tisse sa trame tannique sur fond de terroir argilo-calcaire.",
  "Bourgogne": "Terre de moines et de mystère, la Bourgogne révèle dans chaque parcelle une expression unique — le terroir y parle plus fort que la main du vigneron.",
  "Rhône": "Entre Alpes et Méditerranée, la vallée du Rhône offre des vins de caractère — solaires au sud avec le Grenache, épicés et élancés au nord avec la Syrah.",
  "Loire": "Le jardin de la France livre ses vins avec légèreté et franchise — le Chenin Blanc y atteint des sommets de tension et de minéralité incomparables.",
  "Alsace": "À la croisée des cultures française et germanique, l'Alsace produit des vins aromatiques d'une précision rare, portés par des cépages nobles sur granit et calcaire.",
  "Champagne": "La plus célèbre des appellations transforme une acidité rigoureuse en bulles de fête — chaque flûte raconte trois ans de patience souterraine.",
  "Toscane": "Le cyprès, l'olive et la vigne composent ce paysage parfait. Le Sangiovese s'y exprime avec une acidité vive et une élégance méditative.",
  "Piémont": "Au pied des Alpes, le Nebbiolo s'impose comme le cépage le plus exigeant d'Italie — tannins de fer, rose séchée et un potentiel de vieillissement sans égal.",
  "Rioja": "La Tempranillo de Rioja vieillit en fûts américains pour révéler vanille, fraise confite et une structure qui traverse les décennies.",
  "Mendoza": "À 1400 mètres sous le soleil andin, le Malbec acquiert une profondeur violette et épicée que ni le Lot ni Bordeaux ne peuvent égaler.",
  "Barossa Valley": "Les plus vieilles vignes de Shiraz du monde plongent leurs racines depuis 1847 dans ces sols rouges australiens — concentrés, épicés, inoubliables.",
  "Napa Valley": "La vallée californienne produit des Cabernets opulents et précis, boisés avec luxe, qui rivalisent ouvertement avec les grands Bordeaux.",
  "Douro": "Les terrasses de schiste du Douro donnent naissance aux plus grands vins de Porto et, depuis peu, à des rouges secs d'une profondeur remarquable.",
};

const GRAPE_BY_TYPE_REGION = {
  "rouge": { "Bordeaux":"Cabernet Sauvignon, Merlot", "Bourgogne":"Pinot Noir", "Rhône":"Syrah, Grenache", "Toscane":"Sangiovese", "Piémont":"Nebbiolo", "Rioja":"Tempranillo", "Mendoza":"Malbec", "Barossa Valley":"Shiraz", "Douro":"Touriga Nacional" },
  "blanc": { "Bourgogne":"Chardonnay", "Loire":"Chenin Blanc, Sauvignon Blanc", "Alsace":"Riesling, Gewurztraminer", "Rhône":"Viognier, Marsanne", "Bordeaux":"Sauvignon Blanc, Sémillon" },
  "rose":  { "Provence":"Grenache, Cinsault", "Loire":"Cabernet Franc", "Bordeaux":"Merlot, Cabernet" },
  "mousseux": { "Champagne":"Chardonnay, Pinot Noir, Meunier", "Catalogne":"Macabeo, Xarel·lo (Cava)", "Lombardie":"Glera (Prosecco)" },
};

function generateStory(wine) {
  const regionStory = REGION_STORIES[wine.region] || `Les vignes de ${wine.region||wine.country} expriment un terroir singulier, façonné par des générations de vignerons passionnés.`;
  const grapes = GRAPE_BY_TYPE_REGION[wine.type]?.[wine.region] || "";
  const grapeLine = grapes ? `Porté par ${grapes}, ce vin` : "Ce vin";
  const year = wine.year;
  const ageLine = year ? `Le millésime ${year} s'inscrit dans le temps` : "Ce flacon";

  return {
    story: `${regionStory} ${grapeLine} porte l'empreinte de son lieu de naissance avec une sincérité rare. ${ageLine} avec la promesse d'une expérience qui engage tous les sens.`,
    anecdote: getAnecdote(wine),
  };
}

function getAnecdote(wine) {
  const anecdotes = {
    "Bordeaux": "Le mot 'claret' utilisé par les Anglais pour désigner le Bordeaux rouge remonte au XIIe siècle, époque où la région appartenait à la couronne anglaise.",
    "Bourgogne": "La Romanée-Conti, joyau de Bourgogne, ne produit que 5 000 à 6 000 bouteilles par an pour le monde entier.",
    "Champagne": "La pression dans une bouteille de Champagne est trois fois celle d'un pneu de voiture — environ 6 bars.",
    "Mendoza": "Le Malbec argentin descend directement des plants exportés depuis Cahors (France) au XIXe siècle par des émigrants gascons.",
    "Barossa Valley": "Certaines vignes de Shiraz de la Barossa Valley ont plus de 170 ans — parmi les plus vieilles vignes en production au monde.",
    "Douro": "Le Porto est né d'une ruse commerciale : au XVIIe siècle, des marchands anglais ajoutaient de l'eau-de-vie pour stabiliser le vin pendant le transport maritime.",
    "Toscane": "Le Chianti était historiquement vendu dans des fiasques (bouteilles pantelées), interdites en 1993 pour améliorer l'image du vin.",
    "Rioja": "La Rioja utilise des fûts américains depuis le XIXe siècle, une tradition née lorsque les marchands bordelais fuyaient le phylloxéra.",
  };
  return anecdotes[wine.region] || `La région de ${wine.region||wine.country} compte parmi les terroirs les plus respectés au monde, avec une histoire viticole qui remonte souvent à l'Antiquité romaine.`;
}

/* ═══════════════════════════════════════════════════════════════
   SUGGESTIONS ENGINE
═══════════════════════════════════════════════════════════════ */
const SUGGESTIONS_DB = [
  { name:"Penfolds Bin 389", country:"Australie", region:"Barossa Valley", type:"rouge", year:2020, producer:"Penfolds", why:"Un Shiraz/Cabernet de légende, surnommé le 'bébé Grange'. Opulent, épicé, inoubliable." },
  { name:"Chablis Premier Cru Montée de Tonnerre", country:"France", region:"Bourgogne", type:"blanc", year:2021, producer:"Domaine Pinson", why:"La minéralité la plus pure de Chablis — iode, silex, citron zesté. Incomparable." },
  { name:"Tignanello", country:"Italie", region:"Toscane", type:"rouge", year:2019, producer:"Antinori", why:"Le Super-Toscan original, né d'une révolution. Sangiovese + Cabernet = élégance et puissance réunies." },
  { name:"Vega Sicilia Unico", country:"Espagne", region:"Ribera del Duero", type:"rouge", year:2012, producer:"Vega Sicilia", why:"Le vin espagnol le plus mythique — élevé 10 ans, tabac, cerise noire, temps suspendu." },
  { name:"Cloudy Bay Sauvignon Blanc", country:"Nouvelle-Zélande", region:"Marlborough", type:"blanc", year:2023, producer:"Cloudy Bay", why:"L'archétype du Sauvignon néo-zélandais — fruits de la passion, agrumes, fraîcheur absolue." },
  { name:"Ornellaia", country:"Italie", region:"Toscane", type:"rouge", year:2018, producer:"Marchesi de' Frescobaldi", why:"La réponse italienne aux grands Bordeaux. Cassis, graphite, cèdre — une nuit à la mer en bouteille." },
  { name:"Pouilly-Fumé Baron de L", country:"France", region:"Loire", type:"blanc", year:2021, producer:"De Ladoucette", why:"La minéralité de la Loire à son sommet. Silex, groseille à maquereau, tension aristocratique." },
  { name:"Barolo Brunate", country:"Italie", region:"Piémont", type:"rouge", year:2017, producer:"Giuseppe Rinaldi", why:"Le Roi des vins italiens dans sa version la plus traditionnelle. Tannins de soie, rose séchée, éternité." },
  { name:"Château Pichon Baron", country:"France", region:"Bordeaux", type:"rouge", year:2016, producer:"AXA Millésimes", why:"Deuxième Grand Cru Classé d'une précision remarquable — cassis, crayon, structure irréprochable." },
  { name:"Sancerre Rouge Henri Bourgeois", country:"France", region:"Loire", type:"rouge", year:2021, producer:"Henri Bourgeois", why:"Un Pinot Noir de Loire frais, minéral, aux arômes de framboise et de silex — rare et délicieux." },
  { name:"Priorat Clos Mogador", country:"Espagne", region:"Priorat", type:"rouge", year:2019, producer:"René Barbier", why:"Les ardoises noires de la Llicorella donnent à la Garnacha une profondeur minérale unique en Espagne." },
  { name:"Riesling Clos Sainte Hune", country:"France", region:"Alsace", type:"blanc", year:2020, producer:"Trimbach", why:"Peut-être le plus grand Riesling de France — pétrol naissant, citron confit, minéralité de cristal." },
  { name:"Tannat Garzón Reserve", country:"Autre", region:"Autre", type:"rouge", year:2021, producer:"Bodega Garzón", why:"L'Uruguay prouve que le Tannat peut être élégant — puissant, charnel, avec une minéralité granitique surprenante." },
  { name:"Gewurztraminer Vendanges Tardives", country:"France", region:"Alsace", type:"blanc", year:2019, producer:"Hugel", why:"Un parfum liquide — rose, litchi, gingembre confit. Moelleux sans être lourd, envoûtant comme un souk oriental." },
  { name:"Amarone della Valpolicella", country:"Italie", region:"Vénétie", type:"rouge", year:2016, producer:"Allegrini", why:"Né de raisins séchés 4 mois sur des claies — concentration extrême, chocolat noir, cerise à l'eau-de-vie." },
];

function getSuggestions(db) {
  if (db.length === 0) return SUGGESTIONS_DB.slice(0, 4);

  const liked = db.filter(w => w.tasted && w.rating >= 3);
  const disliked = db.filter(w => w.tasted && w.rating <= 1);

  const likedTypes    = [...new Set(liked.map(w => w.type))];
  const likedCountries= [...new Set(liked.map(w => w.country))];
  const likedRegions  = [...new Set(liked.map(w => w.region))];
  const dislikedRegions = [...new Set(disliked.map(w => w.region))];

  return SUGGESTIONS_DB
    .filter(s => !db.some(w => w.name?.toLowerCase() === s.name.toLowerCase()))
    .filter(s => !dislikedRegions.includes(s.region))
    .map(s => {
      let score = 0;
      if (likedTypes.includes(s.type))         score += 30;
      if (likedCountries.includes(s.country))  score += 20;
      if (likedRegions.includes(s.region))     score += 35;
      // Bonus diversité — suggérer aussi des pays non explorés
      if (!likedCountries.includes(s.country)) score += 10;
      return { ...s, matchScore: Math.min(99, 50 + score) };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS UI
═══════════════════════════════════════════════════════════════ */
const haptic = (p=50) => { try { if(navigator.vibrate) navigator.vibrate(p); } catch(_){} };

const Loader = () => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
    <div style={{width:32,height:32,border:`2px solid rgba(196,165,90,.2)`,
      borderTopColor:C.gold,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
  </div>
);

const StarRating = ({ value, onChange, size=32 }) => (
  <div style={{display:"flex",gap:8,justifyContent:"center"}}>
    {[0,1,2,3,4,5].map(n => (
      <button key={n} onClick={()=>onChange(n)} style={{
        width:size+8, height:size+8, borderRadius:"50%",
        background: n <= value ? `linear-gradient(135deg,${C.terra},${C.gold})` : C.faint,
        border: n <= value ? "none" : `1px solid rgba(196,165,90,.2)`,
        color: n <= value ? C.dark : C.muted,
        fontSize: n === 0 ? 14 : 18,
        fontWeight: 700, transition:"all .2s",
        display:"flex",alignItems:"center",justifyContent:"center",
      }}>
        {n === 0 ? "✗" : "★"}
      </button>
    ))}
  </div>
);

const typeColor = (typeId) => WINE_TYPES.find(t=>t.id===typeId)?.color || C.gold;
const typeEmoji = (typeId) => WINE_TYPES.find(t=>t.id===typeId)?.emoji || "🍷";

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT — FORMULAIRE D'AJOUT
═══════════════════════════════════════════════════════════════ */
const AddWineForm = ({ onSave, onCancel }) => {
  const [step, setStep] = useState(1); // 1=type, 2=lieu, 3=details, 4=degustation
  const [form, setForm] = useState({
    type:"", country:"", region:"", year: new Date().getFullYear(),
    producer:"", name:"", tasted:null, rating:null, storage:false, notes:""
  });

  // step 2a = pays, step 2b = région (on les sépare visuellement)
  // On mappe : 1=type, 2=pays, 3=région, 4=détails, 5=dégustation
  const STEP_LABELS = ["","Type de vin","Pays","Région","Détails","Dégustation"];
  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const up = (key, val) => setForm(f => ({...f, [key]: val}));

  const canNext = () => {
    if (step===1) return !!form.type;
    if (step===2) return !!form.country;
    if (step===3) return !!form.region;
    if (step===4) return !!form.year;
    return true;
  };

  const handleSave = () => {
    if (!canNext()) return;
    haptic(60);
    const story = generateStory(form);
    onSave({ ...form, id: Date.now(), story: story.story, anecdote: story.anecdote,
      addedAt: new Date().toLocaleDateString("fr-FR") });
  };

  const inputStyle = (filled) => ({
    width:"100%", background:"rgba(92,26,46,.18)",
    border:`1px solid rgba(196,165,90,${filled?".4":".12"})`,
    borderRadius:14, padding:"14px 16px", color:C.cream,
    fontSize:15, fontFamily:"Cormorant Garamond,serif",
    transition:"border-color .25s",
  });

  const labelStyle = {
    fontSize:10, color:C.gold, letterSpacing:".25em",
    textTransform:"uppercase", marginBottom:8,
    fontFamily:"Cormorant Garamond,serif", display:"block",
  };

  return (
    <div style={{minHeight:"100vh", background:`radial-gradient(ellipse at 30% 10%, #2a0515, ${C.dark} 60%)`,
      display:"flex", flexDirection:"column"}}>

      {/* Header */}
      <div style={{padding:"32px 20px 0", flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button onClick={onCancel} style={{width:36,height:36,borderRadius:"50%",
            background:C.faint, border:`1px solid rgba(245,240,232,.1)`,
            color:C.muted, fontSize:16, display:"flex",alignItems:"center",justifyContent:"center"}}>
            ←
          </button>
          <div>
            <div style={{fontSize:9,color:C.muted,letterSpacing:".3em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif"}}>Étape {step} / {totalSteps}</div>
            <div style={{fontSize:16,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400}}>
              {STEP_LABELS[step]}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{height:2, background:"rgba(245,240,232,.07)", borderRadius:1, marginBottom:28}}>
          <div style={{height:"100%", width:`${progress}%`, borderRadius:1,
            background:`linear-gradient(90deg,${C.terra},${C.gold})`, transition:"width .4s ease"}}/>
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1, overflowY:"auto", padding:"0 20px 120px", WebkitOverflowScrolling:"touch"}}>

        {/* ÉTAPE 1 — TYPE */}
        {step===1 && (
          <div style={{animation:"fadeUp .4s ease"}}>
            <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,
              fontWeight:400,marginBottom:8,lineHeight:1.2}}>
              Quel type de vin<br/>souhaitez-vous ajouter ?
            </h2>
            <p style={{fontSize:13,color:C.muted,fontFamily:"Cormorant Garamond,serif",
              fontStyle:"italic",marginBottom:28}}>Commençons par le commencement.</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {WINE_TYPES.map((t,i) => (
                <button key={t.id} onClick={()=>{haptic(30);up("type",t.id);}} style={{
                  background: form.type===t.id
                    ? `linear-gradient(135deg,${t.color}33,${t.color}18)`
                    : C.faint,
                  border:`1px solid ${form.type===t.id ? t.color+"88" : "rgba(245,240,232,.08)"}`,
                  borderRadius:18, padding:"18px 20px",
                  display:"flex", alignItems:"center", gap:16,
                  animation:`fadeUp .35s ease ${i*.06}s both`, opacity:0,
                  transition:"all .25s", transform:form.type===t.id?"scale(1.01)":"scale(1)"}}>
                  <div style={{width:46,height:46,borderRadius:"50%",flexShrink:0,
                    background: form.type===t.id ? t.color+"44" : "rgba(245,240,232,.05)",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,
                    border:`1px solid ${form.type===t.id?t.color+"66":"rgba(245,240,232,.08)"}`}}>
                    {t.emoji}
                  </div>
                  <div style={{textAlign:"left"}}>
                    <div style={{fontSize:17,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400}}>
                      {t.label}
                    </div>
                  </div>
                  {form.type===t.id && (
                    <div style={{marginLeft:"auto",width:20,height:20,borderRadius:"50%",
                      background:t.color,display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:11,color:C.dark,fontWeight:700}}>✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ÉTAPE 2 — PAYS */}
        {step===2 && (
          <div style={{animation:"fadeUp .4s ease"}}>
            <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,
              fontWeight:400,marginBottom:8,lineHeight:1.2}}>
              De quel pays<br/>vient ce vin ?
            </h2>
            <p style={{fontSize:13,color:C.muted,fontFamily:"Cormorant Garamond,serif",
              fontStyle:"italic",marginBottom:28}}>Le terroir raconte toujours une histoire.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {Object.entries(COUNTRIES).map(([country, data]) => (
                <button key={country} onClick={()=>{haptic(20);up("country",country);up("region","");}} style={{
                  background:form.country===country?`rgba(196,165,90,.15)`:C.faint,
                  border:`1px solid ${form.country===country?"rgba(196,165,90,.45)":"rgba(245,240,232,.07)"}`,
                  borderRadius:12, padding:"11px 10px",
                  display:"flex",alignItems:"center",gap:8,
                  transition:"all .2s"}}>
                  <span style={{fontSize:18}}>{data.flag}</span>
                  <span style={{fontSize:12,color:form.country===country?C.gold:C.muted,
                    fontFamily:"Cormorant Garamond,serif",fontWeight:form.country===country?600:400}}>
                    {country}
                  </span>
                  {form.country===country && <span style={{marginLeft:"auto",color:C.gold,fontSize:13}}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ÉTAPE 3 — RÉGION */}
        {step===3 && (
          <div style={{animation:"fadeUp .4s ease"}}>
            <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,
              fontWeight:400,marginBottom:8,lineHeight:1.2}}>
              Quelle région ?
            </h2>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,
              background:"rgba(196,165,90,.08)",border:"1px solid rgba(196,165,90,.2)",
              borderRadius:20,padding:"6px 14px",marginBottom:22}}>
              <span style={{fontSize:18}}>{COUNTRIES[form.country]?.flag}</span>
              <span style={{fontSize:12,color:C.gold,fontFamily:"Cormorant Garamond,serif"}}>{form.country}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {COUNTRIES[form.country]?.regions.map(r => (
                <button key={r} onClick={()=>{haptic(20);up("region",r);}} style={{
                  background:form.region===r?`rgba(226,114,91,.15)`:C.faint,
                  border:`1px solid ${form.region===r?"rgba(226,114,91,.45)":"rgba(245,240,232,.07)"}`,
                  borderRadius:12, padding:"12px 16px", textAlign:"left",
                  display:"flex",justifyContent:"space-between",alignItems:"center",
                  transition:"all .2s"}}>
                  <span style={{fontSize:14,color:form.region===r?C.cream:C.muted,
                    fontFamily:"Cormorant Garamond,serif"}}>{r}</span>
                  {form.region===r && <span style={{color:C.terra,fontSize:13}}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ÉTAPE 4 — MILLÉSIME & DOMAINE */}
        {step===4 && (
          <div style={{animation:"fadeUp .4s ease"}}>
            <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,
              fontWeight:400,marginBottom:8,lineHeight:1.2}}>
              Quelques<br/>précisions…
            </h2>
            <p style={{fontSize:13,color:C.muted,fontFamily:"Cormorant Garamond,serif",
              fontStyle:"italic",marginBottom:28}}>Plus vous en dites, mieux je vous connais.</p>

            <div style={{marginBottom:18}}>
              <label style={labelStyle}>Millésime (année)</label>
              <input type="number" value={form.year}
                onChange={e=>up("year",parseInt(e.target.value)||new Date().getFullYear())}
                min={1900} max={new Date().getFullYear()}
                style={inputStyle(form.year)}/>
            </div>

            <div style={{marginBottom:18}}>
              <label style={labelStyle}>Maison / Domaine / Château</label>
              <input type="text" value={form.producer}
                onChange={e=>up("producer",e.target.value)}
                placeholder="Ex: Château Margaux, Domaine Leroy…"
                style={inputStyle(form.producer)}/>
            </div>

            <div style={{marginBottom:18}}>
              <label style={labelStyle}>Nom du vin <span style={{color:C.muted,fontWeight:300}}>(optionnel)</span></label>
              <input type="text" value={form.name}
                onChange={e=>up("name",e.target.value)}
                placeholder="Ex: Cuvée Prestige, Grand Cru…"
                style={inputStyle(form.name)}/>
            </div>
          </div>
        )}

        {/* ÉTAPE 5 — DÉGUSTATION */}
        {step===5 && (
          <div style={{animation:"fadeUp .4s ease"}}>
            <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,
              fontWeight:400,marginBottom:8,lineHeight:1.2}}>
              L'avez-vous<br/>déjà goûté ?
            </h2>
            <p style={{fontSize:13,color:C.muted,fontFamily:"Cormorant Garamond,serif",
              fontStyle:"italic",marginBottom:28}}>Votre mémoire gustative est précieuse.</p>

            <div style={{display:"flex",gap:12,marginBottom:24}}>
              {[{val:true,label:"Oui, je l'ai bu",emoji:"✓",color:C.sauge},
                {val:false,label:"Non, pas encore",emoji:"○",color:C.gold}].map(opt=>(
                <button key={String(opt.val)} onClick={()=>{haptic(40);up("tasted",opt.val);up("storage",!opt.val);}} style={{
                  flex:1, padding:"20px 12px",
                  background:form.tasted===opt.val?`${opt.color}22`:C.faint,
                  border:`1px solid ${form.tasted===opt.val?opt.color+"66":"rgba(245,240,232,.08)"}`,
                  borderRadius:18, display:"flex",flexDirection:"column",
                  alignItems:"center",gap:10,transition:"all .25s",
                  transform:form.tasted===opt.val?"scale(1.02)":"scale(1)"}}>
                  <div style={{width:44,height:44,borderRadius:"50%",
                    background:form.tasted===opt.val?opt.color+"33":C.faint,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:20,color:form.tasted===opt.val?opt.color:C.muted,fontWeight:700}}>
                    {opt.emoji}
                  </div>
                  <span style={{fontSize:13,color:form.tasted===opt.val?C.cream:C.muted,
                    fontFamily:"Cormorant Garamond,serif",textAlign:"center",lineHeight:1.3}}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Si bu → note */}
            {form.tasted===true && (
              <div style={{background:"rgba(92,26,46,.25)",border:`1px solid rgba(196,165,90,.2)`,
                borderRadius:18,padding:"22px 18px",marginBottom:16,animation:"fadeUp .3s ease"}}>
                <div style={{fontSize:10,color:C.gold,letterSpacing:".22em",textTransform:"uppercase",
                  marginBottom:6,fontFamily:"Cormorant Garamond,serif",textAlign:"center"}}>
                  Votre note sur 5
                </div>
                <div style={{fontSize:11,color:C.muted,fontFamily:"Cormorant Garamond,serif",
                  fontStyle:"italic",textAlign:"center",marginBottom:18}}>
                  0 = à ne plus jamais croiser · 5 = expérience absolue
                </div>
                <StarRating value={form.rating??-1} onChange={v=>{haptic(30);up("rating",v);}} size={34}/>
                {form.rating!==null && (
                  <div style={{textAlign:"center",marginTop:14,fontSize:14,
                    color:C.cream,fontFamily:"Playfair Display,serif",fontStyle:"italic",
                    animation:"fadeIn .3s ease"}}>
                    {["À éviter absolument 🚫","Décevant 😕","Correct sans plus 😐","Bien, j'y reviendrais 🙂","Très bon ! ⭐","Exceptionnel, inoubliable ✨"][form.rating]}
                  </div>
                )}
                <div style={{marginTop:18}}>
                  <label style={{...labelStyle,textAlign:"left"}}>Notes personnelles <span style={{color:C.muted}}>(optionnel)</span></label>
                  <textarea value={form.notes} onChange={e=>up("notes",e.target.value)}
                    placeholder="Un souvenir, un accord, une émotion…"
                    rows={3}
                    style={{...inputStyle(form.notes),resize:"none",lineHeight:1.65,fontStyle:"italic"}}/>
                </div>
              </div>
            )}

            {/* Si pas bu → cave */}
            {form.tasted===false && (
              <div style={{background:"rgba(196,165,90,.08)",border:`1px solid rgba(196,165,90,.2)`,
                borderRadius:18,padding:"18px",animation:"fadeUp .3s ease"}}>
                <div style={{fontSize:13,color:C.cream,fontFamily:"Cormorant Garamond,serif",
                  fontStyle:"italic",lineHeight:1.7,textAlign:"center"}}>
                  Ce vin sera stocké dans votre cave.<br/>
                  <span style={{color:C.gold}}>Vous pourrez l'évaluer plus tard.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:430,padding:"12px 20px 32px",
        background:`linear-gradient(transparent, ${C.dark} 35%)`}}>
        {step < 5 ? (
          <button onClick={()=>{if(canNext()){haptic(40);setStep(s=>s+1);}}} style={{
            width:"100%", padding:"17px",
            background:canNext()?`linear-gradient(135deg,${C.terra},#c45a45)`:"rgba(245,240,232,.06)",
            color:canNext()?C.cream:"rgba(245,240,232,.22)",
            border:canNext()?"none":`1px solid rgba(245,240,232,.1)`,
            borderRadius:50, fontSize:12, letterSpacing:".2em", textTransform:"uppercase",
            fontFamily:"Cormorant Garamond,serif", fontWeight:600,
            boxShadow:canNext()?`0 10px 32px rgba(226,114,91,.35)`:"none",
            transition:"all .3s"}}>
            Continuer →
          </button>
        ) : (
          <button onClick={handleSave}
            disabled={form.tasted===null || (form.tasted===true && form.rating===null)}
            style={{
              width:"100%", padding:"17px",
              background:(form.tasted!==null&&(form.tasted===false||form.rating!==null))
                ?`linear-gradient(135deg,${C.sauge},#5f7d4a)`:"rgba(245,240,232,.06)",
              color:C.cream, border:"none",
              borderRadius:50, fontSize:12, letterSpacing:".2em", textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif", fontWeight:700,
              boxShadow:`0 10px 32px rgba(135,169,107,.3)`,
              transition:"all .3s"}}>
            ✓ Ajouter à ma cave
          </button>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT — DÉTAIL D'UN VIN
═══════════════════════════════════════════════════════════════ */
const WineDetail = ({ wine, onBack, onUpdateRating }) => {
  const [rating, setRating] = useState(wine.rating ?? null);
  const [showTasted, setShowTasted] = useState(false);
  const tc = typeColor(wine.type);

  const handleRate = (r) => {
    haptic(50);
    setRating(r);
    onUpdateRating(wine.id, r);
    setShowTasted(false);
  };

  return (
    <div style={{minHeight:"100vh",
      background:`radial-gradient(ellipse at 30% 0%, ${tc}22, ${C.dark} 55%)`,
      overflowY:"auto", WebkitOverflowScrolling:"touch"}}>

      {/* Header */}
      <div style={{padding:"32px 20px 0", display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <button onClick={onBack} style={{width:38,height:38,borderRadius:"50%",
          background:C.faint,border:`1px solid rgba(245,240,232,.1)`,
          color:C.muted,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
        <div>
          <div style={{fontSize:9,color:C.muted,letterSpacing:".25em",textTransform:"uppercase",
            fontFamily:"Cormorant Garamond,serif"}}>
            {typeEmoji(wine.type)} {WINE_TYPES.find(t=>t.id===wine.type)?.label}
          </div>
          <div style={{fontSize:16,fontFamily:"Playfair Display,serif",color:C.cream,fontWeight:400,
            maxWidth:280,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {wine.producer || wine.name || "Vin sans nom"}
          </div>
        </div>
      </div>

      <div style={{padding:"0 20px 80px"}}>

        {/* Wine identity card */}
        <div style={{background:`linear-gradient(135deg,${tc}18,${tc}08)`,
          border:`1px solid ${tc}33`,borderRadius:22,padding:"22px",marginBottom:16}}>
          <div style={{fontSize:52,textAlign:"center",marginBottom:14,
            filter:`drop-shadow(0 4px 16px ${tc}44)`}}>
            {typeEmoji(wine.type)}
          </div>
          <h2 style={{fontSize:24,fontFamily:"Playfair Display,serif",color:C.cream,
            fontWeight:400,textAlign:"center",marginBottom:6,lineHeight:1.2}}>
            {wine.producer || "Domaine inconnu"}
          </h2>
          {wine.name && (
            <div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",
              fontStyle:"italic",textAlign:"center",marginBottom:10}}>{wine.name}</div>
          )}
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            {[
              wine.region && `📍 ${wine.region}`,
              wine.country && `${COUNTRIES[wine.country]?.flag||"🌍"} ${wine.country}`,
              wine.year && `📅 ${wine.year}`,
            ].filter(Boolean).map(tag=>(
              <span key={tag} style={{fontSize:12,color:C.muted,
                background:"rgba(245,240,232,.06)",border:"1px solid rgba(245,240,232,.1)",
                borderRadius:20,padding:"5px 12px",fontFamily:"Cormorant Garamond,serif"}}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Note */}
        <div style={{background:C.faint,border:C.border,borderRadius:18,padding:"20px",marginBottom:16}}>
          {wine.tasted && rating !== null ? (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:10,color:C.gold,letterSpacing:".22em",textTransform:"uppercase",
                marginBottom:12,fontFamily:"Cormorant Garamond,serif"}}>Votre note</div>
              <div style={{fontSize:48,fontFamily:"Playfair Display,serif",color:tc,fontWeight:600,lineHeight:1}}>
                {rating}<span style={{fontSize:20,color:C.muted}}>/5</span>
              </div>
              <div style={{fontSize:13,color:C.muted,fontFamily:"Cormorant Garamond,serif",
                fontStyle:"italic",marginTop:6}}>
                {["À éviter absolument 🚫","Décevant 😕","Correct 😐","Bien 🙂","Très bon ⭐","Exceptionnel ✨"][rating]}
              </div>
              <button onClick={()=>setShowTasted(true)} style={{marginTop:12,background:"none",
                color:"rgba(196,165,90,.45)",fontSize:10,fontFamily:"Cormorant Garamond,serif",
                letterSpacing:".1em",textDecoration:"underline"}}>
                Modifier ma note
              </button>
            </div>
          ) : wine.tasted && rating===null ? (
            <div>
              <div style={{fontSize:10,color:C.gold,letterSpacing:".22em",textTransform:"uppercase",
                marginBottom:14,fontFamily:"Cormorant Garamond,serif",textAlign:"center"}}>
                Notez ce vin
              </div>
              <StarRating value={-1} onChange={handleRate}/>
            </div>
          ) : (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:8}}>🗄️</div>
              <div style={{fontSize:14,color:C.cream,fontFamily:"Playfair Display,serif",marginBottom:6}}>
                En cave
              </div>
              <div style={{fontSize:12,color:C.muted,fontFamily:"Cormorant Garamond,serif",
                fontStyle:"italic",marginBottom:14}}>Stocké pour plus tard</div>
              <button onClick={()=>setShowTasted(true)} style={{
                background:`linear-gradient(135deg,${C.terra},#c45a45)`,
                color:C.cream,border:"none",padding:"10px 24px",borderRadius:50,
                fontSize:11,letterSpacing:".15em",textTransform:"uppercase",
                fontFamily:"Cormorant Garamond,serif"}}>
                Je l'ai goûté !
              </button>
            </div>
          )}
        </div>

        {/* Histoire */}
        {wine.story && (
          <div style={{background:"rgba(92,26,46,.2)",borderLeft:`3px solid ${C.terra}`,
            borderRadius:"0 14px 14px 0",padding:"16px 18px",marginBottom:16}}>
            <div style={{fontSize:9,color:C.terra,letterSpacing:".22em",textTransform:"uppercase",
              marginBottom:8,fontFamily:"Cormorant Garamond,serif"}}>Le Récit du Terroir</div>
            <p style={{fontSize:13,color:"rgba(245,240,232,.7)",fontFamily:"Cormorant Garamond,serif",
              fontStyle:"italic",lineHeight:1.85}}>{wine.story}</p>
          </div>
        )}

        {/* Anecdote */}
        {wine.anecdote && (
          <div style={{background:"rgba(196,165,90,.06)",border:`1px solid rgba(196,165,90,.15)`,
            borderRadius:14,padding:"14px 16px",marginBottom:16}}>
            <div style={{fontSize:9,color:C.gold,letterSpacing:".18em",textTransform:"uppercase",
              marginBottom:6,fontFamily:"Cormorant Garamond,serif"}}>✦ Le saviez-vous ?</div>
            <p style={{fontSize:12,color:"rgba(245,240,232,.55)",fontFamily:"Cormorant Garamond,serif",
              lineHeight:1.75}}>{wine.anecdote}</p>
          </div>
        )}

        {/* Notes perso */}
        {wine.notes && (
          <div style={{background:C.faint,border:C.border,borderRadius:14,padding:"14px 16px"}}>
            <div style={{fontSize:9,color:C.muted,letterSpacing:".18em",textTransform:"uppercase",
              marginBottom:6,fontFamily:"Cormorant Garamond,serif"}}>Ma note personnelle</div>
            <p style={{fontSize:13,color:C.muted,fontFamily:"Cormorant Garamond,serif",
              fontStyle:"italic",lineHeight:1.75}}>{wine.notes}</p>
          </div>
        )}
      </div>

      {/* Overlay notation */}
      {showTasted && (
        <div style={{position:"fixed",inset:0,zIndex:800,display:"flex",
          alignItems:"flex-end",background:"rgba(0,0,0,.7)"}}
          onClick={e=>{if(e.target===e.currentTarget)setShowTasted(false);}}>
          <div style={{background:"#1a040e",border:`1px solid rgba(196,165,90,.2)`,
            borderRadius:"24px 24px 0 0",width:"100%",padding:"24px 20px 48px",
            animation:"slideUp .3s ease"}}>
            <div style={{width:32,height:3,background:"rgba(245,240,232,.15)",
              borderRadius:2,margin:"0 auto 20px"}}/>
            <div style={{fontSize:10,color:C.gold,letterSpacing:".22em",textTransform:"uppercase",
              marginBottom:16,fontFamily:"Cormorant Garamond,serif",textAlign:"center"}}>
              Notez ce vin
            </div>
            <StarRating value={rating??-1} onChange={handleRate} size={38}/>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT — SMART SCANNER
═══════════════════════════════════════════════════════════════ */
const SmartScanner = ({ db, onResult, onBack }) => {
  const [phase, setPhase] = useState("idle"); // idle|scanning|result|error
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  const processImage = async (file) => {
    if (!file) return;
    setPhase("scanning");

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 900 / Math.max(img.width, img.height));
        canvas.width  = img.width  * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

        let quality = 0.65;
        let b64 = canvas.toDataURL("image/jpeg", quality).split(",")[1];
        while (b64.length > 400000 && quality > 0.2) {
          quality -= 0.1;
          b64 = canvas.toDataURL("image/jpeg", quality).split(",")[1];
        }

        // Prépare le contexte des goûts
        const liked = db.filter(w => w.tasted && w.rating >= 3).map(w =>
          `${w.type} ${w.region} ${w.country} (${w.rating}/5)`).join(", ");
        const disliked = db.filter(w => w.tasted && w.rating <= 1).map(w =>
          `${w.type} ${w.region}`).join(", ");

        const prompt = `Tu es un sommelier expert. Analyse cette image (étiquette de bouteille ou carte des vins d'un restaurant).

${liked ? `L'utilisateur aime : ${liked}` : ""}
${disliked ? `L'utilisateur n'aime pas : ${disliked}` : ""}

Identifie le(s) vin(s) visible(s) et recommande le meilleur choix selon ces goûts.

Réponds UNIQUEMENT en JSON :
{
  "topPick": {
    "name": "Nom complet",
    "producer": "Domaine/Château",
    "type": "rouge|blanc|rose|mousseux|autre",
    "country": "Pays",
    "region": "Région",
    "year": 2020,
    "match": 85,
    "why": "Explication courte et poétique (2 phrases max)",
    "story": "3 phrases sur le terroir et le vin",
    "emoji": "🍷"
  },
  "isWineList": false,
  "others": []
}`;

        try {
          const r = await fetch("/api/claude", {
            method:"POST", headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
              model:"claude-sonnet-4-20250514", max_tokens:800,
              messages:[{role:"user",content:[
                {type:"image",source:{type:"base64",media_type:"image/jpeg",data:b64}},
                {type:"text",text:prompt}
              ]}]
            })
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error?.message || `HTTP ${r.status}`);
          const txt = d.content.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
          setResult(JSON.parse(txt));
          setPhase("result");
        } catch(e) {
          setErrMsg(e.message?.slice(0,120)||"Erreur d'analyse");
          setPhase("error");
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  if (phase==="scanning") return (
    <div style={{minHeight:"100vh",background:C.dark,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",gap:24,padding:32}}>
      <div style={{position:"relative",width:80,height:80}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",
          border:`2px solid rgba(196,165,90,.1)`}}/>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",
          border:"2px solid transparent",borderTopColor:C.gold,animation:"spin 1.2s linear infinite"}}/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:28}}>🔍</div>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:18,fontFamily:"Playfair Display,serif",color:C.cream,marginBottom:6}}>
          Analyse en cours…
        </div>
        <div style={{fontSize:13,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>
          Le Sommelier lit l'étiquette
        </div>
      </div>
    </div>
  );

  if (phase==="error") return (
    <div style={{minHeight:"100vh",background:C.dark,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",gap:20,padding:32,textAlign:"center"}}>
      <div style={{fontSize:52}}>⚠️</div>
      <div style={{fontSize:16,fontFamily:"Playfair Display,serif",color:C.cream}}>{errMsg}</div>
      <button onClick={()=>setPhase("idle")} style={{background:`rgba(226,114,91,.15)`,
        border:`1px solid rgba(226,114,91,.4)`,borderRadius:24,padding:"12px 28px",
        color:C.terra,fontSize:13,fontFamily:"Playfair Display,serif"}}>Réessayer</button>
      <button onClick={onBack} style={{background:"none",color:C.muted,fontSize:12,
        fontFamily:"Cormorant Garamond,serif"}}>← Retour</button>
    </div>
  );

  if (phase==="result" && result) {
    const p = result.topPick;
    const tc = typeColor(p.type);
    return (
      <div style={{minHeight:"100vh",
        background:`radial-gradient(ellipse at 30% 0%, ${tc}22, ${C.dark} 55%)`,
        overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{padding:"32px 20px 80px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
            <button onClick={onBack} style={{width:38,height:38,borderRadius:"50%",
              background:C.faint,border:`1px solid rgba(245,240,232,.1)`,
              color:C.muted,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
            <span style={{fontSize:10,color:C.muted,letterSpacing:".25em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif"}}>
              {result.isWineList ? "Meilleur choix de la carte" : "Étiquette analysée"}
            </span>
          </div>

          {/* Top pick */}
          <div style={{background:`linear-gradient(135deg,${tc}18,${tc}08)`,
            border:`1px solid ${tc}44`,borderRadius:22,padding:"24px",marginBottom:16}}>
            <div style={{fontSize:9,color:C.gold,letterSpacing:".3em",textTransform:"uppercase",
              marginBottom:12,fontFamily:"Cormorant Garamond,serif"}}>
              Recommandation du Sommelier
            </div>
            <div style={{fontSize:48,textAlign:"center",marginBottom:14}}>{p.emoji||typeEmoji(p.type)}</div>
            <h2 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:C.cream,
              fontWeight:400,textAlign:"center",marginBottom:4}}>{p.name}</h2>
            <div style={{fontSize:13,color:C.muted,fontFamily:"Cormorant Garamond,serif",
              textAlign:"center",marginBottom:14}}>{p.producer}</div>

            {/* Match score */}
            <div style={{background:"rgba(0,0,0,.3)",borderRadius:14,padding:"14px",
              textAlign:"center",marginBottom:14}}>
              <div style={{fontSize:36,fontFamily:"Playfair Display,serif",color:C.gold,
                fontWeight:600,lineHeight:1}}>{p.match}%</div>
              <div style={{fontSize:9,color:C.muted,letterSpacing:".15em",textTransform:"uppercase",
                fontFamily:"Cormorant Garamond,serif",marginTop:2}}>match avec vos goûts</div>
              <div style={{height:3,background:"rgba(245,240,232,.07)",borderRadius:2,marginTop:10}}>
                <div style={{height:"100%",width:`${p.match}%`,borderRadius:2,
                  background:`linear-gradient(90deg,${C.terra},${C.gold})`}}/>
              </div>
            </div>

            <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:14}}>
              {[p.type&&WINE_TYPES.find(t=>t.id===p.type)?.label, p.region, p.country, p.year&&String(p.year)]
                .filter(Boolean).map(tag=>(
                <span key={tag} style={{fontSize:11,color:C.muted,
                  background:"rgba(245,240,232,.06)",border:"1px solid rgba(245,240,232,.1)",
                  borderRadius:20,padding:"4px 11px",fontFamily:"Cormorant Garamond,serif"}}>{tag}</span>
              ))}
            </div>

            <p style={{fontSize:14,color:"rgba(245,240,232,.8)",fontFamily:"Cormorant Garamond,serif",
              fontStyle:"italic",lineHeight:1.8,textAlign:"center"}}>{p.why}</p>
          </div>

          {p.story && (
            <div style={{background:"rgba(92,26,46,.2)",borderLeft:`3px solid ${C.terra}`,
              borderRadius:"0 14px 14px 0",padding:"16px 18px",marginBottom:16}}>
              <div style={{fontSize:9,color:C.terra,letterSpacing:".2em",textTransform:"uppercase",
                marginBottom:8,fontFamily:"Cormorant Garamond,serif"}}>Le Récit</div>
              <p style={{fontSize:13,color:"rgba(245,240,232,.7)",fontFamily:"Cormorant Garamond,serif",
                fontStyle:"italic",lineHeight:1.85}}>{p.story}</p>
            </div>
          )}

          {/* Actions */}
          <button onClick={()=>{
            haptic(60);
            const story = { story:p.story||"", anecdote:"" };
            onResult({
              id:Date.now(), type:p.type||"rouge", country:p.country||"",
              region:p.region||"", year:p.year||new Date().getFullYear(),
              producer:p.producer||"", name:p.name||"",
              tasted:false, storage:true, rating:null, notes:"",
              ...story, addedAt:new Date().toLocaleDateString("fr-FR")
            });
          }} style={{
            width:"100%",background:`linear-gradient(135deg,${C.terra},#c45a45)`,
            color:C.cream,border:"none",padding:"17px",borderRadius:50,
            fontSize:12,letterSpacing:".2em",textTransform:"uppercase",
            fontFamily:"Cormorant Garamond,serif",fontWeight:700,marginBottom:10,
            boxShadow:`0 8px 28px rgba(226,114,91,.35)`}}>
            + Ajouter à ma cave
          </button>
          <button onClick={()=>setPhase("idle")} style={{
            width:"100%",background:C.faint,border:`1px solid rgba(245,240,232,.1)`,
            color:C.muted,padding:"14px",borderRadius:50,
            fontSize:11,letterSpacing:".15em",textTransform:"uppercase",
            fontFamily:"Cormorant Garamond,serif"}}>
            ↺ Scanner une autre
          </button>
        </div>
      </div>
    );
  }

  // Idle — interface de scan
  return (
    <div style={{minHeight:"100vh",
      background:`radial-gradient(ellipse at 50% 20%, #1f0510, ${C.dark})`,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:"32px 24px"}}>
      <button onClick={onBack} style={{position:"absolute",top:48,left:20,
        width:38,height:38,borderRadius:"50%",background:C.faint,
        border:`1px solid rgba(245,240,232,.1)`,color:C.muted,fontSize:16,
        display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>

      <div style={{fontSize:72,marginBottom:16,animation:"pulse 2s ease-in-out infinite"}}>📸</div>
      <h2 style={{fontSize:26,fontFamily:"Playfair Display,serif",color:C.cream,
        textAlign:"center",marginBottom:8,fontWeight:400}}>Smart Scanner</h2>
      <p style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",
        textAlign:"center",marginBottom:40,lineHeight:1.7,fontStyle:"italic"}}>
        Scannez une étiquette de bouteille<br/>ou une carte des vins au restaurant.
      </p>

      <label style={{width:"100%",maxWidth:320,display:"flex",flexDirection:"column",
        alignItems:"center",gap:12,padding:"28px 24px",
        background:`linear-gradient(135deg,rgba(226,114,91,.15),rgba(196,165,90,.08))`,
        border:`2px solid rgba(226,114,91,.35)`,borderRadius:24,cursor:"pointer",
        animation:"goldGlow 2.5s ease-in-out infinite"}}>
        <input type="file" accept="image/*" capture="environment"
          onChange={e=>processImage(e.target.files?.[0])} style={{display:"none"}}/>
        <span style={{fontSize:32}}>📷</span>
        <span style={{fontFamily:"Playfair Display,serif",fontSize:16,color:C.cream}}>
          Prendre une photo
        </span>
        <span style={{fontSize:11,color:C.muted,fontFamily:"Cormorant Garamond,serif"}}>
          Ouvre l'appareil photo
        </span>
      </label>

      <label style={{display:"flex",alignItems:"center",gap:10,marginTop:14,
        padding:"12px 22px",background:C.faint,border:`1px solid rgba(245,240,232,.1)`,
        borderRadius:16,cursor:"pointer"}}>
        <input type="file" accept="image/*"
          onChange={e=>processImage(e.target.files?.[0])} style={{display:"none"}}/>
        <span style={{fontSize:18}}>🖼️</span>
        <span style={{fontSize:13,color:C.muted,fontFamily:"Cormorant Garamond,serif"}}>
          Choisir depuis la galerie
        </span>
      </label>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT — MA CAVE
═══════════════════════════════════════════════════════════════ */
const MaCave = ({ db, onOpenWine, onAdd }) => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(null);

  const displayed = db.filter(w => {
    const s = search.toLowerCase();
    if (s && !`${w.producer} ${w.name} ${w.region} ${w.country}`.toLowerCase().includes(s)) return false;
    if (typeFilter && w.type !== typeFilter) return false;
    if (filter==="cave")    return !w.tasted;
    if (filter==="tasted")  return w.tasted;
    if (filter==="top")     return w.tasted && w.rating >= 4;
    if (filter==="avoid")   return w.tasted && w.rating <= 1;
    return true;
  });

  const stats = {
    total:   db.length,
    inCave:  db.filter(w=>!w.tasted).length,
    tasted:  db.filter(w=>w.tasted).length,
    topRated:db.filter(w=>w.tasted&&w.rating>=4).length,
    avgRating: db.filter(w=>w.tasted&&w.rating!==null).length > 0
      ? (db.filter(w=>w.tasted&&w.rating!==null).reduce((a,w)=>a+w.rating,0) /
         db.filter(w=>w.tasted&&w.rating!==null).length).toFixed(1)
      : "—"
  };

  if (db.length === 0) return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"40px 24px",textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:16,opacity:.3}}>🗄️</div>
      <h3 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:C.cream,
        fontWeight:400,marginBottom:8}}>Votre cave est vide</h3>
      <p style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",
        fontStyle:"italic",marginBottom:28,lineHeight:1.7}}>
        Commencez par ajouter un vin<br/>pour constituer votre collection.
      </p>
      <button onClick={onAdd} style={{
        background:`linear-gradient(135deg,${C.terra},#c45a45)`,
        color:C.cream,border:"none",padding:"16px 32px",borderRadius:50,
        fontSize:12,letterSpacing:".2em",textTransform:"uppercase",
        fontFamily:"Cormorant Garamond,serif",fontWeight:600,
        boxShadow:`0 8px 24px rgba(226,114,91,.3)`}}>
        + Ajouter mon premier vin
      </button>
    </div>
  );

  return (
    <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"16px 18px 100px"}}>
      {/* Stats bar */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
        {[
          [stats.total,  "Vins",    C.cream],
          [stats.inCave, "En cave", C.gold],
          [stats.tasted, "Goûtés",  C.terra],
          [stats.avgRating, "Moy.", C.sauge],
        ].map(([v,l,c])=>(
          <div key={l} style={{background:C.faint,border:C.border,borderRadius:14,
            padding:"12px 8px",textAlign:"center"}}>
            <div style={{fontSize:20,fontFamily:"Playfair Display,serif",color:c,fontWeight:600,lineHeight:1}}>{v}</div>
            <div style={{fontSize:8,color:C.muted,letterSpacing:".1em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="🔍 Rechercher…"
        style={{width:"100%",background:"rgba(92,26,46,.18)",
          border:`1px solid rgba(196,165,90,.12)`,borderRadius:14,
          padding:"11px 14px",color:C.cream,fontSize:14,
          fontFamily:"Cormorant Garamond,serif",marginBottom:10}}/>

      {/* Type filters */}
      <div style={{display:"flex",gap:6,marginBottom:8,overflowX:"auto",WebkitOverflowScrolling:"touch",paddingBottom:4}}>
        <button onClick={()=>setTypeFilter(null)} style={{
          background:!typeFilter?C.terra:"transparent",
          border:`1px solid ${!typeFilter?C.terra:"rgba(245,240,232,.12)"}`,
          borderRadius:20,padding:"6px 12px",fontSize:10,
          color:!typeFilter?C.cream:C.muted,whiteSpace:"nowrap",
          fontFamily:"Cormorant Garamond,serif"}}>Tous</button>
        {WINE_TYPES.map(t=>(
          <button key={t.id} onClick={()=>setTypeFilter(typeFilter===t.id?null:t.id)} style={{
            background:typeFilter===t.id?t.color+"44":"transparent",
            border:`1px solid ${typeFilter===t.id?t.color+"88":"rgba(245,240,232,.12)"}`,
            borderRadius:20,padding:"6px 12px",fontSize:10,
            color:typeFilter===t.id?C.cream:C.muted,whiteSpace:"nowrap",
            fontFamily:"Cormorant Garamond,serif"}}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Status filters */}
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",WebkitOverflowScrolling:"touch",paddingBottom:4}}>
        {[["all","Tous"],["cave","En cave"],["tasted","Goûtés"],["top","⭐ Top"],["avoid","🚫 À éviter"]].map(([id,l])=>(
          <button key={id} onClick={()=>setFilter(id)} style={{
            background:filter===id?"rgba(196,165,90,.2)":"transparent",
            border:`1px solid ${filter===id?"rgba(196,165,90,.4)":"rgba(245,240,232,.1)"}`,
            borderRadius:20,padding:"6px 12px",fontSize:10,
            color:filter===id?C.gold:C.muted,whiteSpace:"nowrap",
            fontFamily:"Cormorant Garamond,serif"}}>
            {l}
          </button>
        ))}
      </div>

      {/* Wine list */}
      {displayed.length === 0 ? (
        <div style={{textAlign:"center",padding:"40px 0",color:C.muted,
          fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",fontSize:14}}>
          Aucun vin dans cette catégorie.
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {displayed.map((wine,i)=>{
            const tc = typeColor(wine.type);
            return (
              <button key={wine.id} onClick={()=>{haptic(30);onOpenWine(wine);}} style={{
                background:`linear-gradient(135deg,${tc}12,${tc}06)`,
                border:`1px solid ${tc}22`,borderRadius:18,padding:"16px",
                textAlign:"left",transition:"all .2s",
                animation:`fadeUp .35s ease ${i*.04}s both`,opacity:0,
                display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:48,height:48,borderRadius:"50%",flexShrink:0,
                  background:`${tc}22`,border:`1px solid ${tc}44`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>
                  {typeEmoji(wine.type)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontFamily:"Playfair Display,serif",color:C.cream,
                    fontWeight:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {wine.producer || wine.name || "Vin sans nom"}
                  </div>
                  <div style={{fontSize:11,color:C.muted,fontFamily:"Cormorant Garamond,serif",
                    marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {[wine.region, wine.country, wine.year].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div style={{flexShrink:0,textAlign:"right"}}>
                  {wine.tasted && wine.rating !== null ? (
                    <div>
                      <div style={{fontSize:18,fontFamily:"Playfair Display,serif",
                        color:wine.rating>=4?C.sauge:wine.rating>=2?C.gold:C.terra,fontWeight:600}}>
                        {wine.rating}/5
                      </div>
                      <div style={{fontSize:9,color:C.muted,fontFamily:"Cormorant Garamond,serif"}}>
                        {"★".repeat(wine.rating)}{"☆".repeat(5-wine.rating)}
                      </div>
                    </div>
                  ) : !wine.tasted ? (
                    <div style={{fontSize:9,color:C.gold,background:"rgba(196,165,90,.1)",
                      border:"1px solid rgba(196,165,90,.25)",borderRadius:10,padding:"4px 8px",
                      fontFamily:"Cormorant Garamond,serif"}}>🗄️ Cave</div>
                  ) : (
                    <div style={{fontSize:9,color:C.muted,fontFamily:"Cormorant Garamond,serif"}}>
                      Non noté
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT — SUGGESTIONS
═══════════════════════════════════════════════════════════════ */
const Suggestions = ({ db }) => {
  const suggestions = getSuggestions(db);
  const liked = db.filter(w => w.tasted && w.rating >= 4);
  const disliked = db.filter(w => w.tasted && w.rating <= 1);

  return (
    <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"16px 18px 100px"}}>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:24,fontFamily:"Playfair Display,serif",color:C.cream,
          fontWeight:400,marginBottom:6}}>Vos Découvertes</h2>
        <p style={{fontSize:13,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.6}}>
          {liked.length > 0
            ? `Basé sur vos ${liked.length} vin${liked.length>1?"s":""} appréciés${disliked.length>0?` et ${disliked.length} évité${disliked.length>1?"s":""}`:""}.`
            : "Ajoutez et notez vos vins pour des suggestions personnalisées."}
        </p>
      </div>

      {liked.length === 0 && (
        <div style={{background:`rgba(196,165,90,.06)`,border:`1px solid rgba(196,165,90,.15)`,
          borderRadius:16,padding:"16px 18px",marginBottom:20}}>
          <div style={{fontSize:9,color:C.gold,letterSpacing:".2em",textTransform:"uppercase",
            marginBottom:6,fontFamily:"Cormorant Garamond,serif"}}>✦ Astuce</div>
          <p style={{fontSize:13,color:C.muted,fontFamily:"Cormorant Garamond,serif",
            fontStyle:"italic",lineHeight:1.7}}>
            Notez vos vins déjà bus (onglet Ma Cave) pour que les suggestions s'adaptent à vos goûts réels.
          </p>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {suggestions.map((s,i)=>{
          const tc = typeColor(s.type);
          return (
            <div key={i} style={{
              background:`linear-gradient(135deg,${tc}14,${tc}06)`,
              border:`1px solid ${tc}28`,borderRadius:20,padding:"18px",
              animation:`fadeUp .4s ease ${i*.07}s both`,opacity:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
                  <div style={{width:40,height:40,borderRadius:"50%",flexShrink:0,
                    background:`${tc}22`,border:`1px solid ${tc}44`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
                    {typeEmoji(s.type)}
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:15,fontFamily:"Playfair Display,serif",color:C.cream,
                      fontWeight:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {s.name}
                    </div>
                    <div style={{fontSize:11,color:C.muted,fontFamily:"Cormorant Garamond,serif",
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {s.producer} · {s.year}
                    </div>
                  </div>
                </div>
                {s.matchScore && (
                  <div style={{flexShrink:0,textAlign:"right",marginLeft:10}}>
                    <div style={{fontSize:18,fontFamily:"Playfair Display,serif",color:C.gold,fontWeight:600}}>
                      {s.matchScore}%
                    </div>
                    <div style={{fontSize:8,color:C.muted,fontFamily:"Cormorant Garamond,serif",
                      letterSpacing:".08em",textTransform:"uppercase"}}>match</div>
                  </div>
                )}
              </div>

              <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>
                {[WINE_TYPES.find(t=>t.id===s.type)?.label, s.region, s.country].filter(Boolean).map(tag=>(
                  <span key={tag} style={{fontSize:10,color:C.muted,
                    background:"rgba(245,240,232,.05)",border:"1px solid rgba(245,240,232,.09)",
                    borderRadius:20,padding:"3px 10px",fontFamily:"Cormorant Garamond,serif"}}>{tag}</span>
                ))}
              </div>

              <p style={{fontSize:13,color:"rgba(245,240,232,.65)",fontFamily:"Cormorant Garamond,serif",
                fontStyle:"italic",lineHeight:1.75}}>{s.why}</p>

              <a href={`https://www.vivino.com/search/wines?q=${encodeURIComponent(s.name)}`}
                target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:12,
                  background:"rgba(122,28,49,.35)",border:"1px solid rgba(196,165,90,.2)",
                  borderRadius:20,padding:"7px 14px",textDecoration:"none",
                  color:C.gold,fontSize:10,letterSpacing:".1em",textTransform:"uppercase",
                  fontFamily:"Cormorant Garamond,serif"}}>
                🔍 Voir sur Vivino
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════ */
export default function UnwinedApp() {
  const [db, setDb] = useState(() => {
    try { return JSON.parse(localStorage.getItem("unwined_v2_db")) || []; } catch { return []; }
  });
  const [screen, setScreen] = useState("cave"); // cave|add|detail|scan|suggestions
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("cave");

  useEffect(() => {
    try { localStorage.setItem("unwined_v2_db", JSON.stringify(db)); } catch {}
  }, [db]);

  const addWine = (wine) => {
    setDb(d => [wine, ...d]);
    setScreen("cave");
    setTab("cave");
  };

  const updateRating = (id, rating) => {
    setDb(d => d.map(w => w.id===id ? {...w, tasted:true, rating} : w));
    if (selected?.id === id) setSelected(s => ({...s, tasted:true, rating}));
  };

  const openWine = (wine) => { setSelected(wine); setScreen("detail"); };

  const TAB_ITEMS = [
    { id:"cave",        label:"Ma Cave",     icon:"🗄️" },
    { id:"add",         label:"Ajouter",     icon:"＋" },
    { id:"scan",        label:"Scanner",     icon:"📷" },
    { id:"suggestions", label:"Découvrir",   icon:"✦" },
  ];

  return (
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",
      background:C.dark,fontFamily:"Cormorant Garamond,Georgia,serif",
      display:"flex",flexDirection:"column",position:"relative"}}>

      <style dangerouslySetInnerHTML={{__html:GLOBAL_CSS}}/>

      {/* ── HEADER ── */}
      {!["add","detail","scan"].includes(screen) && (
        <div style={{padding:"28px 20px 0",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20}}>
            <div>
              <div style={{fontSize:9,color:C.muted,letterSpacing:".35em",
                textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginBottom:4}}>
                Votre sommelier personnel
              </div>
              <h1 style={{fontSize:32,fontFamily:"Playfair Display,serif",color:C.cream,
                fontWeight:400,letterSpacing:".02em",lineHeight:1}}>Unwine‑d</h1>
            </div>
            <div style={{fontSize:32,filter:"drop-shadow(0 4px 12px rgba(226,114,91,.4))",
              animation:"pulse 3s ease-in-out infinite"}}>🍷</div>
          </div>
          <div style={{height:1,background:`linear-gradient(90deg,${C.terra},rgba(226,114,91,.05))`}}/>
        </div>
      )}

      {/* ── SCREENS ── */}
      {screen==="add" && (
        <AddWineForm onSave={addWine} onCancel={()=>setScreen(tab)}/>
      )}

      {screen==="detail" && selected && (
        <WineDetail wine={selected} onBack={()=>setScreen("cave")} onUpdateRating={updateRating}/>
      )}

      {screen==="scan" && (
        <SmartScanner db={db} onResult={wine=>{addWine(wine);}} onBack={()=>setScreen("cave")}/>
      )}

      {!["add","detail","scan"].includes(screen) && (
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {tab==="cave" && (
            <MaCave db={db} onOpenWine={openWine} onAdd={()=>setScreen("add")}/>
          )}
          {tab==="suggestions" && (
            <Suggestions db={db}/>
          )}
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      {!["add","detail","scan"].includes(screen) && (
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:430,zIndex:100,
          background:`linear-gradient(transparent,${C.dark} 30%)`,padding:"8px 16px 24px"}}>
          <div style={{display:"flex",
            background:"rgba(22,6,16,.96)",
            border:`1px solid rgba(196,165,90,.12)`,
            borderRadius:22,padding:"4px",gap:2}}>
            {TAB_ITEMS.map(t=>{
              const isActive = t.id==="add" ? screen==="add" : tab===t.id;
              const isSpecial = t.id==="add";
              return (
                <button key={t.id}
                  onClick={()=>{
                    haptic(30);
                    if(t.id==="add") { setScreen("add"); }
                    else if(t.id==="scan") { setScreen("scan"); }
                    else { setTab(t.id); setScreen(t.id); }
                  }}
                  style={{flex:1,
                    background:isActive
                      ? isSpecial?`linear-gradient(135deg,${C.sauge},#5f7d4a)`:`linear-gradient(135deg,${C.terra},#c45a45)`
                      : "transparent",
                    border:"none",borderRadius:18,padding:"11px 6px",
                    display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                    transition:"all .25s"}}>
                  <span style={{fontSize:isSpecial?22:17,lineHeight:1}}>{t.icon}</span>
                  <span style={{fontSize:8,letterSpacing:".08em",textTransform:"uppercase",
                    color:isActive?C.cream:C.muted,
                    fontFamily:"Cormorant Garamond,serif",lineHeight:1}}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
