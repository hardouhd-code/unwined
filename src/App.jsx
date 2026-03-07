/**
 * UNWINE-D — Application complète & finale
 * React · Android WebView optimisé
 * Modules : Onboarding → Quiz → Profil → Vibes → Cave → Rituel → Duo Fusion
 *
 * CORRECTIONS ANDROID :
 * - Tous les clipPath ids sont uniques (suffixe uid)
 * - Un seul bloc <style> global injecté à la racine
 * - onMouseEnter/Leave retirés (inutiles sur touch)
 * - backdropFilter avec fallback background opaque
 * - navigator.vibrate wrappé en try/catch
 * - Pas de position:sticky (remplacé par fixed ou normal flow)
 * - -webkit-tap-highlight-color désactivé
 * - overscroll-behavior:none pour éviter le rubber-band
 * - WebkitLineClamp pour les textes tronqués
 */
import React, { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════ */
const C = {
  beige:"#F5F5DC", cream:"#FAF8F0",
  terra:"#E2725B", lieDeVin:"#4A0E0E",
  dark:"#120303",  gold:"#C4A55A",  sauge:"#87A96B",
  muted:"rgba(245,245,220,0.45)",
  faint:"rgba(245,245,220,0.10)",
  faintest:"rgba(245,245,220,0.05)",
  mudMuted:"rgba(74,30,30,0.5)",
  mudFaint:"rgba(74,30,30,0.12)",
};

/* ═══════════════════════════════════════════════════════════════
   GLOBAL CSS — injecté une seule fois
═══════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
  html, body { background:${C.dark}; overscroll-behavior:none; -webkit-overflow-scrolling:touch; }
  button { border:none; background:none; cursor:pointer; touch-action:manipulation; -webkit-tap-highlight-color:transparent; }
  button:focus, input:focus, textarea:focus { outline:none; }
  ::-webkit-scrollbar { width:0; height:0; }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp   { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes shimmer   { 0%,100%{opacity:.3} 50%{opacity:1} }
  @keyframes pulse     { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
  @keyframes goldAura  { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:.9;transform:scale(1.1)} }
  @keyframes auraFloat { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.12)} }
  @keyframes revealUp  { from{opacity:0;transform:translateY(20px) scale(.95)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes goldGlow  { 0%,100%{box-shadow:0 0 0 rgba(196,165,90,0)} 50%{box-shadow:0 0 24px rgba(196,165,90,.3)} }
`;

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
const haptic = (p=80) => { try { if(navigator.vibrate) navigator.vibrate(p); } catch(_){} };

const Grain = () => (
  <div aria-hidden style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999,opacity:.032,
    backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    backgroundSize:"256px"}}/>
);

/* ═══════════════════════════════════════════════════════════════
   SVG COMPONENTS — unique ids via uid prop
═══════════════════════════════════════════════════════════════ */
const WineGlass = React.memo(({fill=.5, color=C.terra, size=72, uid="g"}) => (
  <svg viewBox="0 0 60 100" width={size} height={size*100/60}
    style={{filter:`drop-shadow(0 6px 18px ${color}55)`,flexShrink:0,display:"block"}}>
    <defs><clipPath id={`wg-${uid}`}>
      <path d="M14,7 Q4,36 4,50 Q4,67 30,72 Q56,67 56,50 Q56,36 46,7Z"/>
    </clipPath></defs>
    <path d="M14,7 Q4,36 4,50 Q4,67 30,72 Q56,67 56,50 Q56,36 46,7Z"
      fill="none" stroke="rgba(245,245,220,.2)" strokeWidth="1.2"/>
    <rect x="4" y={7+65*(1-fill)} width="52" height={65*fill}
      fill={color} opacity=".88" clipPath={`url(#wg-${uid})`}
      style={{transition:"y .6s ease,height .6s ease"}}/>
    <path d="M28,72 L28,90 Q20,90 20,94 L40,94 Q40,90 32,90 L32,72"
      fill="none" stroke="rgba(245,245,220,.18)" strokeWidth="1.2"/>
    <line x1="20" y1="94" x2="40" y2="94" stroke="rgba(245,245,220,.18)" strokeWidth="1.2"/>
  </svg>
));

const BottleSVG = ({color=C.lieDeVin, glowing=false, opened=false, size=72}) => (
  <div style={{position:"relative",width:size,flexShrink:0}}>
    {glowing && <div style={{position:"absolute",inset:-14,borderRadius:"50%",
      background:"radial-gradient(circle,rgba(196,165,90,.2) 0%,transparent 70%)",
      animation:"goldAura 2.5s ease-in-out infinite",pointerEvents:"none"}}/>}
    <svg viewBox="0 0 40 100" width={size*.55} height={size} style={{display:"block",margin:"0 auto"}}>
      <rect x="15" y="0" width="10" height="18" rx="3"
        fill={opened?"rgba(245,245,220,.15)":color} opacity={opened?.5:1}/>
      <path d="M11,28 Q10,18 15,18 L25,18 Q30,18 29,28 Z"
        fill={opened?"rgba(245,245,220,.15)":color} opacity={opened?.5:1}/>
      <rect x="10" y="28" width="20" height="65" rx="4"
        fill={opened?"rgba(245,245,220,.15)":color} opacity={opened?.5:1}/>
      <rect x="12" y="38" width="16" height="28" rx="2" fill="rgba(245,245,220,.09)"/>
      <line x1="14" y1="44" x2="26" y2="44" stroke="rgba(245,245,220,.18)" strokeWidth=".8"/>
      <line x1="14" y1="48" x2="26" y2="48" stroke="rgba(245,245,220,.12)" strokeWidth=".8"/>
      <line x1="14" y1="52" x2="22" y2="52" stroke="rgba(245,245,220,.1)"  strokeWidth=".8"/>
      <rect x="13" y="0" width="14" height="6" rx="2" fill="rgba(196,165,90,.45)"/>
      {opened && <line x1="20" y1="0" x2="20" y2="-6" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round"/>}
    </svg>
  </div>
);

const HourglassSVG = ({progress=0, done=false, uid="h"}) => {
  const W=60,H=90,cx=30;
  const topH=(1-progress)*32, botH=progress*32;
  return(
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}
      style={{filter:"drop-shadow(0 6px 18px rgba(74,14,14,.5))"}}>
      <defs>
        <clipPath id={`ht-${uid}`}><rect x="12" y="6" width="36" height="34"/></clipPath>
        <clipPath id={`hb-${uid}`}><rect x="12" y="48" width="36" height="34"/></clipPath>
      </defs>
      <path d={`M10,4 L${W-10},4 L${cx+3},${H/2-2} L${W-10},${H-4} L10,${H-4} L${cx-3},${H/2+2} Z`}
        fill="none" stroke="rgba(245,245,220,.2)" strokeWidth="1.2" strokeLinejoin="round"/>
      <rect x="12" y={6} width="36" height={topH}
        fill={C.lieDeVin} opacity=".8" clipPath={`url(#ht-${uid})`}
        style={{transition:"height 1s ease"}}/>
      <rect x="12" y={48+(32-botH)} width="36" height={botH}
        fill={C.terra} opacity=".9" clipPath={`url(#hb-${uid})`}
        style={{transition:"height 1s ease,y 1s ease"}}/>
      {!done && progress>0 && progress<1 &&
        <circle cx={cx} cy={H/2} r="1.8" fill={C.terra} opacity=".9"
          style={{animation:"pulse 1.2s ease-in-out infinite"}}/>}
      {done && <circle cx={cx} cy={H/2} r="3" fill={C.gold}/>}
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TYPEWRITER
═══════════════════════════════════════════════════════════════ */
const Typewriter = ({text, speed=22, color, size=15, italic=true, onDone}) => {
  const [disp, setDisp] = useState("");
  const [idx, setIdx]   = useState(0);
  const doneRef = useRef(false);
  useEffect(()=>{ setDisp(""); setIdx(0); doneRef.current=false; }, [text]);
  useEffect(()=>{
    if(!text || idx>=text.length){
      if(idx>=(text?.length||0) && !doneRef.current){ doneRef.current=true; onDone?.(); }
      return;
    }
    const d = speed + (text[idx]==="."?260:text[idx]===","?100:0);
    const t = setTimeout(()=>{ setDisp(p=>p+text[idx]); setIdx(i=>i+1); }, d);
    return ()=>clearTimeout(t);
  }, [idx, text, speed, onDone]);
  return(
    <span style={{color:color||"rgba(245,245,220,.78)", fontSize:size, lineHeight:1.85,
      fontFamily:"Cormorant Garamond,Georgia,serif", fontStyle:italic?"italic":"normal"}}>
      {disp}
      {idx<(text?.length||0) &&
        <span style={{display:"inline-block",width:1.5,height:"1em",background:C.terra,
          marginLeft:2,verticalAlign:"text-bottom",animation:"cursorBlink .7s step-end infinite"}}/>}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DATA — PROFILES
═══════════════════════════════════════════════════════════════ */
const PROFILES = {
  A:{ id:"velours-noir", name:"Velours Noir", emoji:"🖤",
      grad:"linear-gradient(160deg,#1a0505,#4A0E0E,#2d0808)", aura:"rgba(74,14,14,.8)",
      tagline:"Vous cherchez la structure, la puissance et la profondeur.",
      desc:"Votre palais est une architecture. Vous aimez les vins qui résistent, qui imposent leur présence, qui laissent une empreinte durable. Les tannins fondus sont votre langage.",
      wines:["Cahors — Malbec de Caractère","Amarone della Valpolicella","Priorat Grand Cru","Madiran Vieilles Vignes"],
      traits:["Tannins polymérisés","pH élevé","Glycérol généreux","Malo-lactique complète"] },
  B:{ id:"cristal-pur",  name:"Cristal Pur",  emoji:"💎",
      grad:"linear-gradient(160deg,#0a1a2e,#1a3a5c,#2a5a7a)", aura:"rgba(42,74,107,.8)",
      tagline:"Vous vivez pour la tension, la fraîcheur et la minéralité.",
      desc:"Votre palais est un tranchant. Vous aimez les vins qui éveillent, qui piquent légèrement, qui laissent une sensation de pierre humide.",
      wines:["Chablis Premier Cru","Muscadet sur Lie","Pouilly-Fumé","Ribolla Gialla"],
      traits:["Acidité vive","Minéralité pure","Corps léger","Fraîcheur persistante"] },
  C:{ id:"soie-rose",   name:"Soie Rose",   emoji:"🌸",
      grad:"linear-gradient(160deg,#2a0a14,#6b2535,#9a3a50)", aura:"rgba(107,37,53,.8)",
      tagline:"Vous aimez l'élégance, la finesse et le fruit délicat.",
      desc:"Votre palais est une aquarelle. Vous aimez les vins qui murmurent, qui caressent, qui laissent une sensation florale.",
      wines:["Pinot Noir de Bourgogne","Champagne Blanc de Blancs","Rosé de Provence","Barolo Classique"],
      traits:["Finesse aromatique","Fruit délicat","Acidité équilibrée","Tannins soyeux"] },
  D:{ id:"or-liquide",  name:"Or Liquide",  emoji:"✨",
      grad:"linear-gradient(160deg,#1a1400,#4a3800,#6b5200)", aura:"rgba(74,56,0,.8)",
      tagline:"Vous adorez l'onctuosité, le sucre noble et la richesse.",
      desc:"Votre palais est une caresse. Vous aimez les vins qui enveloppent, qui fondent, qui laissent une longueur dorée.",
      wines:["Sauternes","Gewurztraminer Vendanges Tardives","Marsala Superiore","Porto Vintage"],
      traits:["Sucrosité noble","Corps opulent","Douceur persistante","Arômes confits"] },
  MIX:{ id:"aventurier",name:"L'Aventurier",emoji:"🧭",
        grad:"linear-gradient(160deg,#0a1a05,#2a4a1a,#3a6a2a)", aura:"rgba(42,74,26,.8)",
        tagline:"Votre palais est curieux — vous aimez les vins atypiques.",
        desc:"Votre palais est une boussole. Vous refusez les cases, vous cherchez la surprise, l'inattendu.",
        wines:["Jura Ouillé","Pét-Nat de Chenin","Orange Wine Géorgien","Verdelho des Açores"],
        traits:["Curiosité sensorielle","Ouverture aux styles","Vins de caractère","Terroirs rares"] },
};

/* ═══════════════════════════════════════════════════════════════
   DATA — QUESTIONS
═══════════════════════════════════════════════════════════════ */
const QUESTIONS = [
  { id:1, icon:"☕", title:"Le réveil des sens",   question:"Comment préférez-vous votre café ou thé ?",
    options:[{id:"A",label:"Noir, serré, sans sucre",   sub:"L'amertume franche",     emoji:"⚫"},
             {id:"B",label:"Thé vert ou eau citronnée", sub:"La fraîcheur pure",       emoji:"🍋"},
             {id:"C",label:"Latte ou Earl Grey",         sub:"La douceur et l'équilibre",emoji:"🥛"},
             {id:"D",label:"Chocolat chaud épais",       sub:"La gourmandise absolue",  emoji:"🍫"}]},
  { id:2, icon:"🍫", title:"Le péché mignon",      question:"Quel chocolat choisissez-vous ?",
    options:[{id:"A",label:"Noir 85%",                  sub:"La puissance sèche",      emoji:"🖤"},
             {id:"B",label:"Noir aux zestes d'orange",  sub:"Le peps et l'acidité",    emoji:"🍊"},
             {id:"C",label:"Chocolat au lait fondant",  sub:"La rondeur rassurante",   emoji:"🤎"},
             {id:"D",label:"Chocolat blanc ou praliné", sub:"L'onctuosité pure",       emoji:"🌟"}]},
  { id:3, icon:"🧵", title:"La texture idéale",    question:"Les yeux fermés, quel tissu vous apaise ?",
    options:[{id:"A",label:"Velours épais et lourd",    sub:"Dense, enveloppant",      emoji:"🖤"},
             {id:"B",label:"Lin frais et craquant",      sub:"Minéral, tonique",        emoji:"🌬️"},
             {id:"C",label:"Soie fluide et légère",      sub:"Élégante, délicate",      emoji:"🕊️"},
             {id:"D",label:"Cachemire chaud",            sub:"Doux, généreux",          emoji:"🌙"}]},
  { id:4, icon:"🍇", title:"Le fruit parfait",     question:"Dans quel fruit croquez-vous avec plaisir ?",
    options:[{id:"A",label:"Mûre ou figue noire",       sub:"Très mûre, confite",      emoji:"🫐"},
             {id:"B",label:"Pomme Granny Smith",         sub:"Acide, fraîche, croquante",emoji:"🍏"},
             {id:"C",label:"Framboise ou cerise",        sub:"Acidulée et fruitée",     emoji:"🍒"},
             {id:"D",label:"Mangue ou abricot confit",   sub:"Juteuse, sucrée, solaire",emoji:"🥭"}]},
  { id:5, icon:"🌍", title:"L'esprit du lieu",     question:"Où vous sentez-vous vraiment vous-même ?",
    options:[{id:"A",label:"Bibliothèque ancienne",     sub:"Bois, cuir, silence",     emoji:"📚"},
             {id:"B",label:"Sommet d'une montagne",      sub:"Vent frais, clarté",      emoji:"⛰️"},
             {id:"C",label:"Jardin printanier",          sub:"Fleurs, légèreté",        emoji:"🌸"},
             {id:"D",label:"Feu de cheminée",            sub:"Plaid, chaleur, cocon",   emoji:"🔥"}]},
];

/* ═══════════════════════════════════════════════════════════════
   DATA — WINE DATABASE (8 vins)
═══════════════════════════════════════════════════════════════ */
const WINE_DB = [
  { id:"amarone",    name:"Allegrini Amarone 2017",       domaine:"Famille Allegrini", grape:"Corvina",    region:"Valpolicella, Vénétie",    year:2017, vibe:"cocon",       baseCompat:88, price:"€€€", emoji:"🕯️", aeration:60, pH:3.95, tannins:9,  glycerol:10, malo:true,  playlist:"Lo-Fi Beats & Acoustic",
    story:"Chaque grain de Corvina a été séché quatre mois sur des claies de bambou dans les greniers de Valpolicella. La concentration est extrême, presque une méditation. Ce vin n'est pas pressé — et vous ne devriez pas l'être non plus.",
    anecdote:"L'Amarone naît d'une erreur : un Recioto oublié a continué à fermenter jusqu'à l'assèchement total. Le résultat était si bouleversant qu'on ne s'est plus jamais arrêté.",
    note:"", addedAt:"12 jan 2025", openedAt:null },
  { id:"cahors",     name:"Clos Triguedina 2019",          domaine:"Famille Baldès",    grape:"Malbec",     region:"Cahors, Sud-Ouest",        year:2019, vibe:"orage",       baseCompat:80, price:"€€",  emoji:"⚡",  aeration:55, pH:3.82, tannins:9,  glycerol:7,  malo:true,  playlist:"Dark Classical & Cello",
    story:"Né sur les terrasses calcaires du Lot, ce vin a puisé sa force noire dans la pierre. Le vigneron l'a élevé dans le silence du chêne pour apprivoiser sa puissance tellurique. Il attend maintenant votre premier regard.",
    anecdote:"Le Malbec de Cahors est l'ancêtre du Malbec argentin — exporté au XIXe siècle par les émigrants du Sud-Ouest.",
    note:"Bu un soir d'orage. Parfait avec du jazz manouche.", addedAt:"3 fév 2025", openedAt:"14 fév 2025" },
  { id:"priorat",    name:"Clos Mogador 2018",              domaine:"René Barbier",      grape:"Garnacha",   region:"Priorat, Catalogne",       year:2018, vibe:"secret",      baseCompat:85, price:"€€€", emoji:"🌹",  aeration:45, pH:3.88, tannins:9,  glycerol:9,  malo:true,  playlist:"Late Night Deep House",
    story:"Les vignes s'agrippent aux ardoises noires de la Llicorella comme des mains qui refusent de lâcher. Le soleil catalan brûle tout — sauf l'essence. Ce qui reste dans le verre est pur comme une larme de pierre.",
    anecdote:"Le Priorat fut quasiment abandonné dans les années 70. Une poignée de vignerons l'ont ressuscité à partir de 1989. C'est l'un des deux seuls Gran Cru espagnols.",
    note:"", addedAt:"20 fév 2025", openedAt:null },
  { id:"madiran",    name:"Château Montus Prestige 2015",   domaine:"Alain Brumont",     grape:"Tannat",     region:"Madiran, Pyrénées",        year:2015, vibe:"patrimoine",  baseCompat:86, price:"€€",  emoji:"🏛️", aeration:60, pH:3.90, tannins:10, glycerol:8,  malo:true,  playlist:"Classical Greats",
    story:"Le Tannat est l'enfant sauvage des Pyrénées, que les vignerons du Madiran ont mis des générations à apprivoiser. Château Montus l'a dompté avec de la patience et du bois. Ce soir, il est à vous.",
    anecdote:"Le Tannat contient l'une des plus fortes concentrations de polyphénols de tous les vins rouges — les cardiologues gascons y voient le secret de la longévité locale.",
    note:"", addedAt:"5 mar 2025", openedAt:null },
  { id:"barossa",    name:"Penfolds Bin 389 Shiraz 2020",   domaine:"Penfolds",          grape:"Shiraz",     region:"Barossa Valley, Australie",year:2020, vibe:"evasion",     baseCompat:83, price:"€€",  emoji:"🌏",  aeration:30, pH:3.92, tannins:8,  glycerol:9,  malo:true,  playlist:"World Fusion & Desert Blues",
    story:"Dans la Barossa Valley, les ceps de Shiraz ont plus de cent ans. Ils ont bu la pluie de deux guerres mondiales et dix sécheresses. Ce vin est une archive vivante — opulente, épicée, inoubliable.",
    anecdote:"Les plus vieilles vignes de Shiraz du monde se trouvent en Barossa. Certaines datent de 1847 et survivent sans irrigation depuis des décennies.",
    note:"Soirée asiatique. Accord parfait avec canard laqué.", addedAt:"1 mar 2025", openedAt:"8 mar 2025" },
  { id:"sagrantino", name:"Arnaldo Caprai 25 Anni 2016",    domaine:"Marco Caprai",      grape:"Sagrantino", region:"Montefalco, Ombrie",       year:2016, vibe:"impro",       baseCompat:82, price:"€€",  emoji:"🎲",  aeration:50, pH:3.70, tannins:10, glycerol:7,  malo:true,  playlist:"Eclectic Global Grooves",
    story:"Le Sagrantino pousse sur les collines ombrées de Montefalco depuis l'époque franciscaine. Personne ne l'a jamais domestiqué complètement — c'est ce qui le rend inoubliable. Donnez-lui le temps, il vous donnera l'éternité.",
    anecdote:"Le Sagrantino était utilisé pour les messes franciscaines au Moyen Âge — son tanin intense symbolisait l'effort et la pénitence.",
    note:"", addedAt:"12 mar 2025", openedAt:null },
  { id:"tannat",     name:"Garzón Tannat Reserve 2021",     domaine:"Bodega Garzón",     grape:"Tannat",     region:"Montevideo, Uruguay",      year:2021, vibe:"revolte",     baseCompat:84, price:"€€",  emoji:"🔥",  aeration:40, pH:3.85, tannins:9,  glycerol:8,  malo:true,  playlist:"Alternative Rock & Rebel",
    story:"Le Tannat a traversé l'Atlantique dans les valises d'émigrants basques au XIXe siècle. Il a trouvé dans l'Uruguay un soleil qu'il n'avait jamais connu. Cette version est son aboutissement — puissante et libre.",
    anecdote:"L'Uruguay est le seul pays au monde où le Tannat est le cépage national officiel.",
    note:"Révélation. À partager avec quelqu'un qui ne connaît pas le vin.", addedAt:"18 mar 2025", openedAt:null },
  { id:"malbec-arg", name:"Achaval Ferrer Quimera 2019",    domaine:"Achaval Ferrer",    grape:"Malbec",     region:"Mendoza, Argentine",       year:2019, vibe:"heure-bleue", baseCompat:81, price:"€€",  emoji:"🌙",  aeration:25, pH:3.88, tannins:8,  glycerol:8,  malo:true,  playlist:"Blue Note Jazz Essentials",
    story:"À 1400 mètres d'altitude, les nuits andines refroidissent les raisins pendant qu'ils mûrissent sous le soleil impitoyable. Cette tension entre chaleur et fraîcheur est l'âme du Mendoza. Un velours suspendu entre deux mondes.",
    anecdote:"Mendoza reçoit moins de 200mm de pluie par an. Sans l'irrigation des Andes, aucun vin n'existerait ici.",
    note:"", addedAt:"22 mar 2025", openedAt:null },
];

const VIBES_META = {
  "cocon":      {name:"Le Cocon",      emoji:"🕯️", grad:"linear-gradient(160deg,#2a0808,#4A0E0E,#6b1a1a)"},
  "orage":      {name:"L'Orage",       emoji:"⚡",  grad:"linear-gradient(160deg,#0d0d0d,#1a0a1a,#2d0505)"},
  "secret":     {name:"Le Secret",     emoji:"🌹",  grad:"linear-gradient(160deg,#1a0510,#2d0a1a,#4a0e2a)"},
  "evasion":    {name:"L'Évasion",     emoji:"🌏",  grad:"linear-gradient(160deg,#1a0a00,#3d1500,#6b2500)"},
  "patrimoine": {name:"Le Patrimoine", emoji:"🏛️", grad:"linear-gradient(160deg,#0d0800,#1a1000,#2d1a00)"},
  "impro":      {name:"L'Impro",       emoji:"🎲",  grad:"linear-gradient(160deg,#1a0a2e,#2d1044,#4a1a5e)"},
  "revolte":    {name:"La Révolte",    emoji:"🔥",  grad:"linear-gradient(160deg,#0d0000,#2d0505,#4A0E0E)"},
  "heure-bleue":{name:"L'Heure Bleue",emoji:"🌙",  grad:"linear-gradient(160deg,#1a1a3e,#2d1b4e,#4A0E0E)"},
};

/* ═══════════════════════════════════════════════════════════════
   PRIX — 3 catégories
═══════════════════════════════════════════════════════════════ */
const PRICE_TIERS = [
  { id:"decouverte", label:"Découverte", symbol:"€",   range:"1 – 30 €",
    desc:"Pépites accessibles, vignerons montants",
    grad:"linear-gradient(135deg,#2a1200,#5a2a00)", border:"rgba(196,165,90,.2)" },
  { id:"heritage",   label:"Héritage",   symbol:"€€",  range:"31 – 75 €",
    desc:"Domaines reconnus, profondeur de terroir",
    grad:"linear-gradient(135deg,#1a0808,#4A0E0E)", border:"rgba(226,114,91,.35)" },
  { id:"exception",  label:"Exception",  symbol:"€€€", range:"75 € +",
    desc:"Grands Crus, millésimes rares, flacons de collection",
    grad:"linear-gradient(135deg,#0d0d0d,#2a1a00)", border:"rgba(196,165,90,.6)" },
];

/* ═══════════════════════════════════════════════════════════════
   DYNAMIC RECO ENGINE — Question + Budget par Vibe
═══════════════════════════════════════════════════════════════ */
const VIBE_RECO = {
  "cocon":{ q:"Quelle texture cherchez-vous ce soir ?",
    opts:[{id:"epice",label:"Chaleur épicée",emoji:"🌶️",tags:"oak,spices,warm"},
          {id:"fruit", label:"Douceur de fruit confit",emoji:"🍇",tags:"jammy,round,sweet"}],
    search:{"epice":{"decouverte":"Primitivo di Puglia","heritage":"Amarone Classico","exception":"Quintarelli Amarone"},
            "fruit": {"decouverte":"Zinfandel Sonoma","heritage":"Châteauneuf-du-Pape","exception":"Pomerol Grand Cru"}}},
  "orage":{ q:"Quelle intensité vous attire ?",
    opts:[{id:"tanins",label:"Tannins qui accrochent",emoji:"⚓",tags:"tannic,bold,grippy"},
          {id:"alcool",label:"Puissance qui envahit", emoji:"🌊",tags:"high-alcohol,dense,lush"}],
    search:{"tanins":{"decouverte":"Cahors Malbec","heritage":"Madiran Tannat","exception":"Barolo Nebbiolo"},
            "alcool": {"decouverte":"Minervois La Livinière","heritage":"Châteauneuf Grenache","exception":"Sine Qua Non Syrah"}}},
  "secret":{ q:"Quel mystère préférez-vous ?",
    opts:[{id:"mineral",label:"Minéralité sombre",emoji:"🪨",tags:"mineral,schist,earthy"},
          {id:"opulent",label:"Fruit noir concentré",emoji:"🖤",tags:"opulent,dark-fruit,velvet"}],
    search:{"mineral":{"decouverte":"Côtes du Roussillon","heritage":"Priorat Garnacha","exception":"Clos Erasmus Priorat"},
            "opulent": {"decouverte":"Napa Cabernet entry","heritage":"Napa Valley Cabernet","exception":"Opus One Napa"}}},
  "evasion":{ q:"Vers quel horizon voguer ?",
    opts:[{id:"nouveau",label:"Nouveau Monde épicé",emoji:"🌅",tags:"new-world,spicy,bold"},
          {id:"ancien", label:"Vieux Monde élégant",emoji:"🏰",tags:"old-world,earthy,complex"}],
    search:{"nouveau":{"decouverte":"Shiraz McLaren Vale","heritage":"Penfolds Bin Shiraz","exception":"Grange Penfolds"},
            "ancien":  {"decouverte":"Côtes du Rhône Villages","heritage":"Crozes-Hermitage Syrah","exception":"Hermitage Paul Jaboulet"}}},
  "patrimoine":{ q:"Quelle mémoire ressusciter ?",
    opts:[{id:"gascon",label:"Puissance gasconne",emoji:"⚔️",tags:"southwest,tannat,rustic"},
          {id:"bourguignon",label:"Élégance bourguignonne",emoji:"🎻",tags:"burgundy,pinot,elegant"}],
    search:{"gascon":{"decouverte":"Bergerac Rouge","heritage":"Madiran Château Montus","exception":"Pétrus Pomerol"},
            "bourguignon":{"decouverte":"Bourgogne Pinot Noir","heritage":"Gevrey-Chambertin","exception":"Romanée-Conti Monopole"}}},
  "impro":{ q:"Quel terrain explorer ce soir ?",
    opts:[{id:"nature",label:"Vins nature vivants",emoji:"🌱",tags:"natural,biodynamic,funky"},
          {id:"rare",  label:"Cépages oubliés",   emoji:"📜",tags:"indigenous,rare,obscure"}],
    search:{"nature":{"decouverte":"Pét-Nat Chenin Loire","heritage":"Jura Ouillé Savagnin","exception":"Clos Rougeard Saumur"},
            "rare":   {"decouverte":"Trousseau Jura","heritage":"Sagrantino Montefalco","exception":"Taurasi Campania"}}},
  "revolte":{ q:"Comment briser les règles ?",
    opts:[{id:"punk",  label:"Vins d'avant-garde",emoji:"⚡",tags:"avant-garde,unconventional,rebel"},
          {id:"power", label:"Pure puissance brute",emoji:"💥",tags:"powerful,extracted,bold"}],
    search:{"punk":  {"decouverte":"Orange Wine Géorgien","heritage":"Tannat Uruguay","exception":"Rayas Châteauneuf Blanc"},
            "power": {"decouverte":"Malbec Mendoza Reserva","heritage":"Zinfandel Dry Creek","exception":"Sine Qua Non Estate"}}},
  "heure-bleue":{ q:"Quel soyeux pour la tombée du soir ?",
    opts:[{id:"merlot", label:"Rondeur soyeuse Merlot",emoji:"🫐",tags:"merlot,silky,round"},
          {id:"pinot",  label:"Finesse aérienne Pinot",emoji:"🌬️",tags:"pinot-noir,airy,delicate"}],
    search:{"merlot":{"decouverte":"Saint-Émilion Grand Cru","heritage":"Pomerol Vieux Château","exception":"Le Pin Pomerol"},
            "pinot": {"decouverte":"Bourgogne Pinot Noir","heritage":"Chambolle-Musigny","exception":"Musigny Grand Cru"}}},
};

/* ═══════════════════════════════════════════════════════════════
   SPOTIFY PLAYLISTS — par style × vibe
═══════════════════════════════════════════════════════════════ */
const SPOTIFY_POOL = {
  "cocon-epice":[
    {name:"Fireplace & Spice",         url:"https://open.spotify.com/search/fireplace%20jazz%20spice",              desc:"Jazz chaud, crépitement"},
    {name:"Midnight Soul",             url:"https://open.spotify.com/search/midnight%20soul%20slow",                desc:"Soul lente, chaleur épicée"},
    {name:"Cello & Candlelight",       url:"https://open.spotify.com/search/cello%20candlelight%20classical",       desc:"Classique intimiste"},
    {name:"Norah Jones Cozy",          url:"https://open.spotify.com/search/norah%20jones%20cozy%20intimate",       desc:"Piano-voix, soirée douce"},
    {name:"Silk & Spice Lounge",       url:"https://open.spotify.com/search/silk%20spice%20lounge%20warm",          desc:"Lounge épicé, velours"},
    {name:"Bourbon Street Blues",      url:"https://open.spotify.com/search/bourbon%20street%20blues%20jazz",       desc:"Jazz de la Nouvelle-Orléans"},
    {name:"Winter Hearth Sessions",    url:"https://open.spotify.com/search/winter%20hearth%20acoustic%20warm",     desc:"Folk acoustique, foyer"},
    {name:"Arabic Jazz Fusion",        url:"https://open.spotify.com/search/arabic%20jazz%20oriental%20fusion",     desc:"Jazz oriental, épices du monde"},
  ],
  "cocon-fruit":[
    {name:"Velvet Evening",            url:"https://open.spotify.com/search/velvet%20soul%20evening",               desc:"Soul douce, notes sucrées"},
    {name:"Slow Burn R&B",             url:"https://open.spotify.com/search/slow%20burn%20rnb%20sensual",           desc:"R&B soyeux, fruit confit"},
    {name:"Jazz Bossa Nova",           url:"https://open.spotify.com/search/bossa%20nova%20jazz%20smooth",          desc:"Rondeur brésilienne"},
    {name:"Sunday Morning Soul",       url:"https://open.spotify.com/search/sunday%20morning%20soul%20warm",        desc:"Soul du dimanche, douceur"},
    {name:"Marvin Gaye & Friends",     url:"https://open.spotify.com/search/marvin%20gaye%20smooth%20soul",         desc:"Soul classique, sensualité"},
    {name:"Neo Soul Brunch",           url:"https://open.spotify.com/search/neo%20soul%20brunch%20mellow",          desc:"Neo-soul fruité, aérien"},
    {name:"Sade & Velvet",             url:"https://open.spotify.com/search/sade%20smooth%20jazz%20soul",           desc:"Sade, nuit de soie"},
    {name:"Tropical Jazz",             url:"https://open.spotify.com/search/tropical%20jazz%20brazil%20mellow",     desc:"Jazz tropical, fruits exotiques"},
  ],
  "orage-tanins":[
    {name:"Dark Classical",            url:"https://open.spotify.com/search/dark%20classical%20cello",              desc:"Cordes sombres, tension"},
    {name:"Doom Jazz",                 url:"https://open.spotify.com/search/doom%20jazz%20dark%20atmosphere",       desc:"Jazz sombre et tendu"},
    {name:"Requiem & Intensity",       url:"https://open.spotify.com/search/requiem%20dark%20orchestral",           desc:"Orchestral puissant"},
    {name:"Beethoven Tempête",         url:"https://open.spotify.com/search/beethoven%20tempest%20storm%20sonata",  desc:"Sonate Tempête, orage intérieur"},
    {name:"Nordic Black Metal Ambient",url:"https://open.spotify.com/search/nordic%20black%20metal%20ambient",      desc:"Ambiances nordiques, obscurité"},
    {name:"Shostakovich String Quartet",url:"https://open.spotify.com/search/shostakovich%20string%20quartet%20dark",desc:"Quatuors sombres, âme slave"},
    {name:"Cave Sessions Dark Jazz",   url:"https://open.spotify.com/search/cave%20sessions%20dark%20jazz%20noir",  desc:"Jazz de cave, ombres portées"},
    {name:"Tango Oscuro",              url:"https://open.spotify.com/search/tango%20oscuro%20dark%20piazzolla",     desc:"Piazzolla, tango sombre"},
  ],
  "orage-alcool":[
    {name:"Blues Électrique",          url:"https://open.spotify.com/search/electric%20blues%20raw",                desc:"Guitare brûlante, puissance"},
    {name:"Stoner Rock",               url:"https://open.spotify.com/search/stoner%20rock%20heavy%20riff",          desc:"Riffs lourds, chaleur"},
    {name:"Southern Rock & Whiskey",   url:"https://open.spotify.com/search/southern%20rock%20whiskey",             desc:"Rock du Sud, intensité"},
    {name:"Hendrix & Fire",            url:"https://open.spotify.com/search/jimi%20hendrix%20electric%20fire",      desc:"Hendrix, électricité pure"},
    {name:"Deep Purple Machine",       url:"https://open.spotify.com/search/deep%20purple%20classic%20rock%20hard", desc:"Hard rock classique, orgue Hammond"},
    {name:"Tom Waits Barroom",         url:"https://open.spotify.com/search/tom%20waits%20barroom%20raw",           desc:"Tom Waits, alcool et poésie"},
    {name:"ZZ Top Lowrider",           url:"https://open.spotify.com/search/zz%20top%20blues%20rock%20lowrider",    desc:"Blues-rock texan, groove lourd"},
    {name:"Nick Cave Intense",         url:"https://open.spotify.com/search/nick%20cave%20bad%20seeds%20intense",   desc:"Nick Cave, intensité dramatique"},
  ],
  "secret-mineral":[
    {name:"Minuit Cinéma",             url:"https://open.spotify.com/search/midnight%20cinema%20noir",              desc:"Bande-son feutrée, mystère"},
    {name:"Dark Ambient",              url:"https://open.spotify.com/search/dark%20ambient%20ethereal",             desc:"Textures sombres, pierre"},
    {name:"Film Noir Soundtracks",     url:"https://open.spotify.com/search/film%20noir%20soundtrack%20jazz",       desc:"Jazz cinématique"},
    {name:"Angelo Badalamenti Twin Peaks",url:"https://open.spotify.com/search/angelo%20badalamenti%20twin%20peaks",desc:"Twin Peaks, mystère et brume"},
    {name:"Iceland Ambient Sigur Ros", url:"https://open.spotify.com/search/sigur%20ros%20iceland%20ambient",       desc:"Post-rock islandais, minéral"},
    {name:"Miles Davis Sketches",      url:"https://open.spotify.com/search/miles%20davis%20sketches%20spain",      desc:"Miles Davis, impressionnisme jazz"},
    {name:"Zen Garden Koto",           url:"https://open.spotify.com/search/zen%20garden%20koto%20japanese",        desc:"Koto japonais, silence pierreux"},
    {name:"Arvo Part Minimalism",      url:"https://open.spotify.com/search/arvo%20part%20tintinnabuli%20minimalist",desc:"Pärt, tintinnabuli, épure"},
  ],
  "secret-opulent":[
    {name:"Late Night Jazz",           url:"https://open.spotify.com/search/late%20night%20jazz%20dark",            desc:"Piano solo, nuit profonde"},
    {name:"Slow Jazz Piano",           url:"https://open.spotify.com/search/slow%20jazz%20piano%20bar",             desc:"Piano-bar feutré"},
    {name:"Neo Soul Nights",           url:"https://open.spotify.com/search/neo%20soul%20nights%20velvet",          desc:"Neo-soul opulent"},
    {name:"Ella Fitzgerald Velvet",    url:"https://open.spotify.com/search/ella%20fitzgerald%20velvet%20jazz",     desc:"Ella Fitzgerald, velours vocal"},
    {name:"Oscar Peterson Trio",       url:"https://open.spotify.com/search/oscar%20peterson%20trio%20piano%20jazz",desc:"Peterson, virtuosité dorée"},
    {name:"Erykah Badu Soul",          url:"https://open.spotify.com/search/erykah%20badu%20soul%20opulent",        desc:"Erykah Badu, âme et mystère"},
    {name:"Massive Attack Mezzanine",  url:"https://open.spotify.com/search/massive%20attack%20mezzanine%20dark",   desc:"Trip-hop opulent, profondeur"},
    {name:"Portishead Glory Box",      url:"https://open.spotify.com/search/portishead%20trip%20hop%20mysterious",  desc:"Portishead, mélancolie luxueuse"},
  ],
  "evasion-nouveau":[
    {name:"Desert Blues",              url:"https://open.spotify.com/search/desert%20blues%20world",                desc:"World music, grands espaces"},
    {name:"Outback & Sun",             url:"https://open.spotify.com/search/australian%20folk%20outback",           desc:"Folk australien, soleil"},
    {name:"Afrobeat Grooves",          url:"https://open.spotify.com/search/afrobeat%20grooves%20modern",           desc:"Rythmes africains, liberté"},
    {name:"Fela Kuti Lagos",           url:"https://open.spotify.com/search/fela%20kuti%20afrobeat%20lagos",        desc:"Fela Kuti, rébellion africaine"},
    {name:"Khruangbin World Groove",   url:"https://open.spotify.com/search/khruangbin%20world%20groove%20psych",   desc:"Khruangbin, psychédélisme mondial"},
    {name:"Tinariwen Desert Rock",     url:"https://open.spotify.com/search/tinariwen%20desert%20rock%20tuareg",    desc:"Tinariwen, blues du Sahara"},
    {name:"Brazilian Tropicalia",      url:"https://open.spotify.com/search/tropicalia%20brazil%20caetano%20veloso",desc:"Tropicália brésilienne, couleurs"},
    {name:"New Zealand Maori Folk",    url:"https://open.spotify.com/search/maori%20folk%20new%20zealand%20acoustic",desc:"Folk maori, terres nouvelles"},
  ],
  "evasion-ancien":[
    {name:"Baroque & Terroir",         url:"https://open.spotify.com/search/baroque%20acoustic%20terroir",          desc:"Classique intime, élégance"},
    {name:"Medieval & Wine",           url:"https://open.spotify.com/search/medieval%20folk%20lute%20wine",         desc:"Luth, Moyen-Âge, patrimoine"},
    {name:"Gregorian & Silence",       url:"https://open.spotify.com/search/gregorian%20chant%20silence",           desc:"Grégorien contemplatif"},
    {name:"Bach Cello Suites",         url:"https://open.spotify.com/search/bach%20cello%20suites%20yo%20yo%20ma",  desc:"Bach, infinité du violoncelle"},
    {name:"Monteverdi Madrigals",      url:"https://open.spotify.com/search/monteverdi%20madrigals%20renaissance",  desc:"Madrigaux de la Renaissance"},
    {name:"Celtic Harp Ancient",       url:"https://open.spotify.com/search/celtic%20harp%20ancient%20ireland",     desc:"Harpe celtique, légendes"},
    {name:"Vivaldi Four Seasons",      url:"https://open.spotify.com/search/vivaldi%20four%20seasons%20baroque",    desc:"Vivaldi, baroque solaire"},
    {name:"Lute Songs Elizabethan",    url:"https://open.spotify.com/search/elizabethan%20lute%20songs%20dowland", desc:"Dowland, mélancolie élisabéthaine"},
  ],
  "patrimoine-gascon":[
    {name:"Gascogne Folk",             url:"https://open.spotify.com/search/folk%20gascogne%20southwest",           desc:"Folk du Sud-Ouest, racines"},
    {name:"Occitan & Guitar",          url:"https://open.spotify.com/search/occitan%20guitar%20traditional",        desc:"Guitare occitane, terroir"},
    {name:"Manouche Jazz",             url:"https://open.spotify.com/search/jazz%20manouche%20gypsy%20swing",       desc:"Jazz manouche, gaieté"},
    {name:"Francis Cabrel Coteaux",    url:"https://open.spotify.com/search/francis%20cabrel%20occitan%20folk",     desc:"Cabrel, vignes et poésie"},
    {name:"Claude Nougaro Toulouse",   url:"https://open.spotify.com/search/claude%20nougaro%20toulouse%20jazz",    desc:"Nougaro, jazz toulousain"},
    {name:"Basque Txalaparta",         url:"https://open.spotify.com/search/basque%20txalaparta%20traditional",     desc:"Percussions basques ancestrales"},
    {name:"Armagnac Sessions",         url:"https://open.spotify.com/search/armagnac%20gascon%20folk%20guitar",     desc:"Folk gascon, eau-de-vie"},
    {name:"Django Reinhardt Swing",    url:"https://open.spotify.com/search/django%20reinhardt%20hot%20club%20swing",desc:"Django, swing manouche originel"},
  ],
  "patrimoine-bourguignon":[
    {name:"Impressions",               url:"https://open.spotify.com/search/debussy%20ravel%20impressionist",       desc:"Debussy, Ravel, profondeur"},
    {name:"Chopin Nocturnes",          url:"https://open.spotify.com/search/chopin%20nocturnes%20piano",            desc:"Nocturnes, silence bourguignon"},
    {name:"French Chanson Classique",  url:"https://open.spotify.com/search/french%20chanson%20classic%20brel",     desc:"Brel, Brassens, élégance"},
    {name:"Burgundy String Quartet",   url:"https://open.spotify.com/search/burgundy%20string%20quartet%20french",  desc:"Quatuor à cordes, raffinement"},
    {name:"Fauré Requiem",             url:"https://open.spotify.com/search/faure%20requiem%20peaceful%20french",   desc:"Fauré, sérénité lumineuse"},
    {name:"Jacques Brel Ne Me Quitte", url:"https://open.spotify.com/search/jacques%20brel%20ne%20me%20quitte%20pas",desc:"Brel, intensité belge-française"},
    {name:"Satie Gymnopédies",         url:"https://open.spotify.com/search/satie%20gymnopedie%20piano%20french",   desc:"Satie, lenteur contemplative"},
    {name:"Juliette Greco Existential",url:"https://open.spotify.com/search/juliette%20greco%20existentialisme%20paris",desc:"Gréco, Paris rive gauche"},
  ],
  "impro-nature":[
    {name:"Free Jazz Sessions",        url:"https://open.spotify.com/search/free%20jazz%20improvisation",           desc:"Jazz libre, vibrations vives"},
    {name:"Post-Rock & Nature",        url:"https://open.spotify.com/search/post%20rock%20nature%20ambient",        desc:"Post-rock, textures organiques"},
    {name:"Biodynamic Sounds",         url:"https://open.spotify.com/search/biodynamic%20ambient%20organic",        desc:"Sons naturels, vivant"},
    {name:"John Coltrane A Love Supreme",url:"https://open.spotify.com/search/john%20coltrane%20love%20supreme",    desc:"Coltrane, quête spirituelle"},
    {name:"Bon Iver Forest",           url:"https://open.spotify.com/search/bon%20iver%20forest%20folk%20indie",    desc:"Bon Iver, forêt et brume"},
    {name:"Animal Collective Nature",  url:"https://open.spotify.com/search/animal%20collective%20nature%20psychedelic",desc:"Psych-folk organique, vivant"},
    {name:"Godspeed You Black Emperor",url:"https://open.spotify.com/search/godspeed%20you%20black%20emperor%20post%20rock",desc:"Post-rock cinématique, liberté"},
    {name:"ECM Records Nordic Jazz",   url:"https://open.spotify.com/search/ecm%20records%20nordic%20jazz%20ambient",desc:"ECM, jazz scandinave épuré"},
  ],
  "impro-rare":[
    {name:"Eclectic Sounds",           url:"https://open.spotify.com/search/eclectic%20world%20unusual",            desc:"Sons rares, aventure sonore"},
    {name:"Microtonal Explorations",   url:"https://open.spotify.com/search/microtonal%20experimental%20music",     desc:"Musique expérimentale"},
    {name:"Armenian Jazz",             url:"https://open.spotify.com/search/armenian%20jazz%20world%20fusion",      desc:"Jazz arménien, profondeur"},
    {name:"Oud & Double Bass",         url:"https://open.spotify.com/search/oud%20double%20bass%20world%20jazz",    desc:"Oud arabe, contrebasse jazz"},
    {name:"Mongolian Throat Singing",  url:"https://open.spotify.com/search/mongolian%20throat%20singing%20overtone",desc:"Chant diphonique, steppes"},
    {name:"Gamelan Indonesia",         url:"https://open.spotify.com/search/gamelan%20indonesia%20traditional",     desc:"Gamelan balinais, transe douce"},
    {name:"Gnawa Morocco Fusion",      url:"https://open.spotify.com/search/gnawa%20morocco%20fusion%20jazz",       desc:"Gnawa marocain, rituels sonores"},
    {name:"Bulgarian Women Choir",     url:"https://open.spotify.com/search/bulgarian%20women%20choir%20le%20mystere",desc:"Le Mystère des Voix Bulgares"},
  ],
  "revolte-punk":[
    {name:"Post-Punk Revival",         url:"https://open.spotify.com/search/post%20punk%20revival%20dark",          desc:"Énergie brute, rébellion"},
    {name:"Garage Rock Anthems",       url:"https://open.spotify.com/search/garage%20rock%20anthems%20raw",         desc:"Garage rock, authenticité"},
    {name:"Noise & Feedback",          url:"https://open.spotify.com/search/noise%20rock%20feedback%20distort",     desc:"Distorsion, chaos contrôlé"},
    {name:"The Clash London Calling",  url:"https://open.spotify.com/search/the%20clash%20london%20calling%20punk", desc:"The Clash, punk politique"},
    {name:"Patti Smith Horses",        url:"https://open.spotify.com/search/patti%20smith%20horses%20punk%20poetry",desc:"Patti Smith, punk poétique"},
    {name:"Bauhaus Gothic Post-Punk",  url:"https://open.spotify.com/search/bauhaus%20gothic%20post%20punk",        desc:"Bauhaus, noirceur gothique"},
    {name:"Iggy Pop Raw Power",        url:"https://open.spotify.com/search/iggy%20pop%20raw%20power%20punk",       desc:"Iggy Pop, énergie primitive"},
    {name:"Sonic Youth Dissonance",    url:"https://open.spotify.com/search/sonic%20youth%20dissonance%20noise%20rock",desc:"Sonic Youth, dissonance créatrice"},
  ],
  "revolte-power":[
    {name:"Hard Rock Classics",        url:"https://open.spotify.com/search/hard%20rock%20classic%20power",         desc:"Riffs puissants, adrénaline"},
    {name:"Metal & Tannins",           url:"https://open.spotify.com/search/metal%20heavy%20dark%20power",          desc:"Metal sombre, puissance brute"},
    {name:"Queens of the Stone Age",   url:"https://open.spotify.com/search/queens%20stone%20age%20grunge",         desc:"Grunge lourd, énergie"},
    {name:"Black Sabbath Doom",        url:"https://open.spotify.com/search/black%20sabbath%20doom%20heavy%20metal",desc:"Black Sabbath, naissance du metal"},
    {name:"Led Zeppelin Kashmir",      url:"https://open.spotify.com/search/led%20zeppelin%20kashmir%20epic%20rock",desc:"Led Zep, épopée rock"},
    {name:"Tool Progressive Metal",    url:"https://open.spotify.com/search/tool%20progressive%20metal%20complex", desc:"Tool, métal progressif cérébral"},
    {name:"Mastodon Leviathan",        url:"https://open.spotify.com/search/mastodon%20leviathan%20sludge%20metal", desc:"Mastodon, metal océanique"},
    {name:"Gojira French Metal",       url:"https://open.spotify.com/search/gojira%20french%20metal%20environmental",desc:"Gojira, metal français engagé"},
  ],
  "heure-bleue-merlot":[
    {name:"Blue Note Lounge",          url:"https://open.spotify.com/search/blue%20note%20jazz%20lounge",           desc:"Jazz velours, crépuscule"},
    {name:"Chet Baker Sings",          url:"https://open.spotify.com/search/chet%20baker%20trumpet%20mellow",       desc:"Trompette douce, soyeuse"},
    {name:"Miles Davis Mellow",        url:"https://open.spotify.com/search/miles%20davis%20kind%20blue%20jazz",    desc:"Kind of Blue, crépuscule"},
    {name:"Bill Evans Moonbeams",      url:"https://open.spotify.com/search/bill%20evans%20moonbeams%20piano%20trio",desc:"Bill Evans, impressionnisme pianistique"},
    {name:"Diana Krall Quiet Nights",  url:"https://open.spotify.com/search/diana%20krall%20quiet%20nights%20jazz", desc:"Diana Krall, voix crépusculaire"},
    {name:"Stan Getz Bossa Twilight",  url:"https://open.spotify.com/search/stan%20getz%20bossa%20nova%20twilight", desc:"Getz, bossa nova du soir"},
    {name:"Melody Gardot Twilight",    url:"https://open.spotify.com/search/melody%20gardot%20twilight%20jazz",     desc:"Melody Gardot, jazz intime"},
    {name:"John Coltrane Ballads",     url:"https://open.spotify.com/search/john%20coltrane%20ballads%20tender",    desc:"Coltrane en mode ballade, douceur"},
  ],
  "heure-bleue-pinot":[
    {name:"Acoustic Dusk",             url:"https://open.spotify.com/search/acoustic%20dusk%20melancholic",         desc:"Guitare acoustique, mélancolie"},
    {name:"Nick Drake & Wine",         url:"https://open.spotify.com/search/nick%20drake%20folk%20acoustic",        desc:"Folk intimiste, douceur"},
    {name:"Twilight Strings",          url:"https://open.spotify.com/search/twilight%20strings%20violin%20soft",    desc:"Violon aérien, finesse"},
    {name:"Elliot Smith Tender",       url:"https://open.spotify.com/search/elliott%20smith%20tender%20acoustic",   desc:"Elliott Smith, fragilité lumineuse"},
    {name:"Sufjan Stevens Pinot",      url:"https://open.spotify.com/search/sufjan%20stevens%20delicate%20folk",    desc:"Sufjan Stevens, folk délicat"},
    {name:"Iron & Wine Dusk",          url:"https://open.spotify.com/search/iron%20and%20wine%20dusk%20folk",       desc:"Iron & Wine, murmures du soir"},
    {name:"Damien Rice Fragile",       url:"https://open.spotify.com/search/damien%20rice%20fragile%20acoustic",    desc:"Damien Rice, émotions à vif"},
    {name:"Feist Intimacy",            url:"https://open.spotify.com/search/feist%20intimacy%20indie%20folk",       desc:"Feist, intimité nordique"},
  ],
  "default":[
    {name:"Sommelier's Choice",        url:"https://open.spotify.com/search/wine%20jazz%20evening",                 desc:"Jazz & vin, harmonie"},
    {name:"Evening Ritual",            url:"https://open.spotify.com/search/evening%20ritual%20chill%20jazz",       desc:"Rituel du soir"},
    {name:"Cave à Vins Sessions",      url:"https://open.spotify.com/search/cave%20vin%20jazz%20france",            desc:"Jazz de cave, profondeur"},
    {name:"Wine & Piano Bar",          url:"https://open.spotify.com/search/wine%20piano%20bar%20smooth",           desc:"Piano-bar, atmosphère feutrée"},
    {name:"French Café Acoustique",    url:"https://open.spotify.com/search/french%20cafe%20acoustic%20guitar",     desc:"Café français, guitare douce"},
    {name:"Ambient Wine Cellar",       url:"https://open.spotify.com/search/ambient%20wine%20cellar%20atmospheric", desc:"Ambiance de cave, profondeur"},
  ],
};
// Helper : sélection aléatoire dans le pool
const getUniquePlaylist=(vibe,styleId,seen=[])=>{
  const pool=SPOTIFY_POOL[`${vibe}-${styleId}`]||SPOTIFY_POOL["default"];
  const available=pool.filter(p=>!seen.includes(p.url));
  const src=available.length>0?available:pool;
  return src[Math.floor(Math.random()*src.length)];
};
// Compat alias
const getPlaylist=getUniquePlaylist;

/* ─── Banque locale de vins — variété garantie ──────────────── */
const WINE_BANK={
  "cocon":{
    "epice":{
      "decouverte":[
        {name:"Primitivo di Puglia IGT 2022",domaine:"Cantine Due Palme",grape:"Primitivo",region:"Puglia, Italie",year:2022,vivinoRating:4.0,priceEst:"18 \u20ac",aeration:20,emoji:"\uD83D\uDD6F\uFE0F",story:"Sous le soleil apulien, ce primitivo s\u2019\u00e9panouit comme une braise douce. Ses \u00e9pices douces r\u00e9chauffent chaque gorg\u00e9e."},
        {name:"C\u00f4tes du Rh\u00f4ne Spice Route 2021",domaine:"Ch\u00e2teau Gigognan",grape:"Grenache/Syrah",region:"Rh\u00f4ne, France",year:2021,vivinoRating:3.9,priceEst:"14 \u20ac",aeration:15,emoji:"\uD83C\uDF42",story:"Le Grenache apporte sa rondeur solaire, la Syrah sa trame poivr\u00e9e. Un duo du Rh\u00f4ne qui embrase le palais sans le br\u00fbler."},
        {name:"Zinfandel Lodi Old Vine 2021",domaine:"Gnarly Head",grape:"Zinfandel",region:"Lodi, Californie",year:2021,vivinoRating:3.8,priceEst:"16 \u20ac",aeration:15,emoji:"\uD83C\uDF36\uFE0F",story:"Ces vignes centenaires de Lodi distillent un Zinfandel aux \u00e9pices confites et aux tanins velout\u00e9s. Un vin californien qui porte l\u2019histoire."},
      ],
      "heritage":[
        {name:"Amarone della Valpolicella 2018",domaine:"Zenato",grape:"Corvina",region:"V\u00e9n\u00e9tie, Italie",year:2018,vivinoRating:4.4,priceEst:"55 \u20ac",aeration:60,emoji:"\uD83D\uDD6F\uFE0F",story:"Les raisins s\u00e9ch\u00e9s sur les claies de paille offrent \u00e0 cet Amarone une densit\u00e9 rare. Chocolat noir, cerise \u00e0 l\u2019eau-de-vie, poivre long \u2014 un vin de m\u00e9ditation."},
        {name:"Ch\u00e2teauneuf-du-Pape La Bernadine 2020",domaine:"M. Chapoutier",grape:"Grenache",region:"Rh\u00f4ne, France",year:2020,vivinoRating:4.3,priceEst:"48 \u20ac",aeration:45,emoji:"\u2600\uFE0F",story:"Sur les galets roul\u00e9s du Ch\u00e2teauneuf, le Grenache s\u2019empreint de garrigue et de soleil captif. G\u00e9n\u00e9rosit\u00e9 m\u00e9ridionale, finale \u00e9pic\u00e9e interminable."},
        {name:"Priorat Clos Petita 2019",domaine:"Clos Mogador",grape:"Garnacha",region:"Priorat, Espagne",year:2019,vivinoRating:4.2,priceEst:"42 \u20ac",aeration:40,emoji:"\u26F0\uFE0F",story:"Les llicorelles noires du Priorat transmettent aux vignes un stress min\u00e9ral unique. Dense, \u00e9pic\u00e9, min\u00e9ral \u2014 une bouteille \u00e0 ouvrir en plein silence."},
      ],
      "exception":[
        {name:"Quintarelli Amarone Classico 2013",domaine:"Giuseppe Quintarelli",grape:"Corvina/Rondinella",region:"Valpolicella, V\u00e9n\u00e9tie",year:2013,vivinoRating:4.8,priceEst:"220 \u20ac",aeration:90,emoji:"\uD83D\uDC51",story:"Quintarelli \u00e9levait ses vins comme on \u00e9l\u00e8ve des enfants \u2014 avec patience et amour absolu. Ce 2013 est un monument d\u2019\u00e9pices, tabac et cerise noire s\u00e9ch\u00e9e."},
        {name:"Penfolds Grange 2018",domaine:"Penfolds",grape:"Shiraz",region:"Australie du Sud",year:2018,vivinoRating:4.7,priceEst:"850 \u20ac",aeration:120,emoji:"\uD83E\uDD85",story:"Le Grange est l\u2019\u00e9quivalent australien d\u2019un Premier Grand Cru. Cr\u00e9\u00e9 en secret par Max Schubert, il incarne l\u2019obsession pour la grandeur. Poivre, m\u00fbre, truffe."},
      ],
    },
    "fruit":{
      "decouverte":[
        {name:"Luberon Fruits Rouges 2022",domaine:"Ch\u00e2teau La Canorgue",grape:"Grenache/Syrah",region:"Luberon, France",year:2022,vivinoRating:3.9,priceEst:"15 \u20ac",aeration:10,emoji:"\uD83C\uDF53",story:"Dans les collines du Luberon bain\u00e9es de lavande, ce rouge livre ses fruits avec g\u00e9n\u00e9rosit\u00e9. Fraise des bois, cerise, une touche de poivre rose."},
        {name:"Dolcetto d\u2019Alba 2022",domaine:"Pecchenino",grape:"Dolcetto",region:"Pi\u00e9mont, Italie",year:2022,vivinoRating:3.9,priceEst:"17 \u20ac",aeration:15,emoji:"\uD83AB0",story:"Dolcetto signifie petite douceur en pi\u00e9montais. M\u00fbre, prune, une amertume fine en finale qui vous fait revenir."},
        {name:"Fleurie Village 2022",domaine:"Georges Duboeuf",grape:"Gamay",region:"Beaujolais, France",year:2022,vivinoRating:3.8,priceEst:"14 \u20ac",aeration:10,emoji:"\uD83C\uDF38",story:"Fleurie, la plus f\u00e9minine des appellations du Beaujolais. Un Gamay \u00e0 la robe pivoine, aux parfums de violette et de framboise \u00e9cras\u00e9e."},
      ],
      "heritage":[
        {name:"Pomerol Ch\u00e2teau Bonalgue 2019",domaine:"Pierre Bourotte",grape:"Merlot",region:"Pomerol, Bordeaux",year:2019,vivinoRating:4.2,priceEst:"38 \u20ac",aeration:30,emoji:"\uD83C\uDF52",story:"Sur les argiles bleues de Pomerol, le Merlot atteint une profondeur charnelle incomparable. Cerise noire, truffe naissante, velout\u00e9e qui cajole le palais."},
        {name:"Rioja Reserva Vi\u00f1a Ardanza 2016",domaine:"La Rioja Alta",grape:"Tempranillo",region:"Rioja, Espagne",year:2016,vivinoRating:4.3,priceEst:"45 \u20ac",aeration:35,emoji:"\uD83C\uDF53",story:"Six ans d\u2019\u00e9levage dont trois en f\u00fbts am\u00e9ricains ont sculpt\u00e9 ce Reserva. Fraise confite, vanille, \u00e9l\u00e9gance castillane qui traverse les g\u00e9n\u00e9rations."},
        {name:"Fleurie La Madone 2021",domaine:"Domaine de la Madone",grape:"Gamay",region:"Beaujolais, France",year:2021,vivinoRating:4.1,priceEst:"32 \u20ac",aeration:20,emoji:"\uD83C\uDF38",story:"La Madone veille sur ses vignes du haut de la colline. Ce Gamay d\u00e9ploie pivoine, framboise et violette \u2014 un bouquet qui n\u2019appartient qu\u2019\u00e0 ce terroir b\u00e9ni."},
      ],
      "exception":[
        {name:"P\u00e9trus 2015",domaine:"Moueix",grape:"Merlot",region:"Pomerol, Bordeaux",year:2015,vivinoRating:4.9,priceEst:"3200 \u20ac",aeration:120,emoji:"\uD83D\uDC8E",story:"Il n\u2019y a pas de mots pour P\u00e9trus. Juste un silence respectueux devant l\u2019une des plus grandes expressions du Merlot sur Terre. Fruits noirs parfaits, truffe blanche."},
        {name:"La T\u00e2che Grand Cru 2017",domaine:"Domaine de la Roman\u00e9e-Conti",grape:"Pinot Noir",region:"Vosne-Roman\u00e9e, Bourgogne",year:2017,vivinoRating:4.8,priceEst:"2800 \u20ac",aeration:90,emoji:"\uD83D\uDC51",story:"La T\u00e2che est un monopole sacr\u00e9 que le DRC cultive comme un jardin secret. Cerise, rose, terre, \u00e9ternit\u00e9 \u2014 chaque millésime raconte une histoire unique."},
      ],
    },
  },
  "orage":{
    "tanins":{
      "decouverte":[
        {name:"Madiran Tradition 2020",domaine:"Ch\u00e2teau Bouscass\u00e9",grape:"Tannat",region:"Madiran, France",year:2020,vivinoRating:4.0,priceEst:"14 \u20ac",aeration:40,emoji:"\uD83C\uDF29\uFE0F",story:"Le Tannat de Madiran est le c\u00e9page le plus tannique de France. Noir d\u2019encre, sauvage, magn\u00e9tique. Un vin de temp\u00eate int\u00e9rieure."},
        {name:"Cahors Malbec Expression 2021",domaine:"Ch\u00e2teau Lagrezette",grape:"Malbec",region:"Cahors, France",year:2021,vivinoRating:3.9,priceEst:"16 \u20ac",aeration:30,emoji:"\u26A1",story:"Le Malbec de Cahors est plus sombre que son cousin argentin, portant la roche calcaire dans sa chair. Un vin de caract\u00e8re pour les temp\u00eates int\u00e9rieures."},
        {name:"Sagrantino di Montefalco 2019",domaine:"Arnaldo Caprai",grape:"Sagrantino",region:"Ombrie, Italie",year:2019,vivinoRating:4.1,priceEst:"28 \u20ac",aeration:60,emoji:"\u26C8\uFE0F",story:"Le Sagrantino poss\u00e8de la plus haute concentration en tanins de tous les c\u00e9pages italiens. Aus\u00e8re, min\u00e9ral, fait pour durer des d\u00e9cennies."},
      ],
      "heritage":[
        {name:"Barolo Serralunga d\u2019Alba 2018",domaine:"Fontanafredda",grape:"Nebbiolo",region:"Barolo, Pi\u00e9mont",year:2018,vivinoRating:4.4,priceEst:"58 \u20ac",aeration:75,emoji:"\u26A1",story:"Le roi des vins italiens na\u00eet sur les collines de Langhe. Tanins de fer, rose s\u00e9ch\u00e9e, goudron. Il vous d\u00e9fie, puis vous subjugue."},
        {name:"C\u00f4te-R\u00f4tie La Turque 2019",domaine:"Guigal",grape:"Syrah",region:"C\u00f4te-R\u00f4tie, Rh\u00f4ne",year:2019,vivinoRating:4.6,priceEst:"180 \u20ac",aeration:60,emoji:"\uD83C\uDF0B",story:"La Turque est \u00e9lev\u00e9e 42 mois en f\u00fbts neufs. Olive noire, violette, fum\u00e9e \u2014 une Syrah qui ressemble \u00e0 un tremblement de terre lent."},
      ],
      "exception":[
        {name:"Barolo Brunate 2016",domaine:"Giuseppe Rinaldi",grape:"Nebbiolo",region:"Barolo, Pi\u00e9mont",year:2016,vivinoRating:4.7,priceEst:"320 \u20ac",aeration:120,emoji:"\uD83D\uDC51",story:"Rinaldi est le dernier des grands traditionalistes de Barolo. Macération longue, f\u00fbts anciens, et un vin qui \u00e9volue sur 30 ans. La Brunate 2016 est d\u00e9j\u00e0 une l\u00e9gende."},
      ],
    },
    "alcool":{
      "decouverte":[
        {name:"Shiraz McLaren Vale 2021",domaine:"d\u2019Arenberg",grape:"Shiraz",region:"McLaren Vale, Australie",year:2021,vivinoRating:4.0,priceEst:"19 \u20ac",aeration:20,emoji:"\uD83D\uDD25",story:"McLaren Vale produit les Shiraz les plus solaires d\u2019Australie. M\u00fbre, chocolat, eucalyptus \u2014 14.5% qui r\u00e9chauffent sans br\u00fbler gr\u00e2ce \u00e0 l\u2019\u00e9quilibre parfait de d\u2019Arenberg."},
        {name:"Grenache du Roussillon 2021",domaine:"Mas Amiel",grape:"Grenache",region:"Roussillon, France",year:2021,vivinoRating:3.9,priceEst:"17 \u20ac",aeration:15,emoji:"\u2600\uFE0F",story:"Le Roussillon est la Catalogne fran\u00e7aise \u2014 soleil violent, vents forts, vignes centenaires. Ce Grenache concentr\u00e9 porte toute la puissance m\u00e9diterran\u00e9enne."},
        {name:"Nero d\u2019Avola Sicilia 2021",domaine:"Cusumano",grape:"Nero d\u2019Avola",region:"Sicile, Italie",year:2021,vivinoRating:3.9,priceEst:"14 \u20ac",aeration:15,emoji:"\uD83C\uDF0B",story:"Le Nero d\u2019Avola est volcanique, concentr\u00e9, prune noire et chocolat amer. Une version accessible qui ne renie pas ses origines brutales."},
      ],
      "heritage":[
        {name:"Ch\u00e2teauneuf-du-Pape Ch\u00e2teau Rayas 2018",domaine:"Emmanuel Reynaud",grape:"Grenache",region:"Ch\u00e2teauneuf, Rh\u00f4ne",year:2018,vivinoRating:4.6,priceEst:"140 \u20ac",aeration:45,emoji:"\uD83C\uDF1E",story:"Rayas est une \u00e9nigme. Un Grenache pur \u00e0 15% qui ressemble \u00e0 rien d\u2019autre \u2014 soyeux, profond, presque bourguignon. Emmanuel Reynaud garde un myst\u00e8re viticole."},
      ],
      "exception":[
        {name:"Sine Qua Non Rattlesnake 2013",domaine:"Manfred Krankl",grape:"Syrah",region:"Californie",year:2013,vivinoRating:4.8,priceEst:"500 \u20ac",aeration:90,emoji:"\uD83D\uDC0D",story:"Chaque cuv\u00e9e porte un nom d\u2019animal et une \u00e9tiquette peinte \u00e0 la main. Le Rattlesnake est venimeux \u2014 d\u2019un velours d\u00e9vastateur qui envahit silencieusement."},
      ],
    },
  },
  "secret":{
    "mineral":{
      "decouverte":[
        {name:"Chablis Premier Cru Mont\u00e9e de Tonnerre 2021",domaine:"Domaine Pinson",grape:"Chardonnay",region:"Chablis, Bourgogne",year:2021,vivinoRating:4.1,priceEst:"26 \u20ac",aeration:15,emoji:"\uD83C\uDF39",story:"Le Mont\u00e9e de Tonnerre est le cru le plus min\u00e9ral de Chablis \u2014 iode, silex, citron zest\u00e9. Un vin qui parle de la craie kimm\u00e9ridgienne comme nulle part ailleurs."},
        {name:"Sancerre Blanc La Bourgeoise 2022",domaine:"Henri Bourgeois",grape:"Sauvignon Blanc",region:"Sancerre, Loire",year:2022,vivinoRating:4.0,priceEst:"24 \u20ac",aeration:10,emoji:"\uD83D\uDCA7",story:"Les silex du Sancerre donnent au Sauvignon une signature inimitable \u2014 pierre \u00e0 fusil, pamplemousse, herbe fra\u00eeche. Bourgeois en extrait la quintessence depuis des g\u00e9n\u00e9rations."},
        {name:"Assyrtiko Santorini 2022",domaine:"Domaine Sigalas",grape:"Assyrtiko",region:"Santorin, Gr\u00e8ce",year:2022,vivinoRating:4.1,priceEst:"22 \u20ac",aeration:0,emoji:"\uD83C\uDFFA",story:"Les vignes de Santorin tress\u00e9es en paniers pour r\u00e9sister au vent de la mer \u00c9g\u00e9e. L\u2019Assyrtiko qui en na\u00eet \u2014 citron, sel marin, minéralit\u00e9 volcanique unique."},
      ],
      "heritage":[
        {name:"Pouilly-Fum\u00e9 Baron de L 2021",domaine:"De Ladoucette",grape:"Sauvignon Blanc",region:"Pouilly-Fum\u00e9, Loire",year:2021,vivinoRating:4.3,priceEst:"65 \u20ac",aeration:10,emoji:"\uD83C\uDFF0",story:"La tour de Nozet domine la Loire depuis le XVIIe si\u00e8cle. De Ladoucette en tire un Pouilly-Fum\u00e9 d\u2019une pr\u00e9cision glaciale \u2014 min\u00e9ral, tendu, aristocratique."},
        {name:"Riesling Clos Sainte Hune 2020",domaine:"Trimbach",grape:"Riesling",region:"Alsace, France",year:2020,vivinoRating:4.5,priceEst:"120 \u20ac",aeration:0,emoji:"\uD83D\uDCA8",story:"Le Clos Sainte Hune est peut-\u00eatre le plus grand Riesling de France. P\u00e9trol naissant, citron confit, min\u00e9ralit\u00e9 de cristal. Il faudra l\u2019attendre 10 ans encore."},
      ],
      "exception":[
        {name:"Montrachet Grand Cru 2019",domaine:"Domaine Leflaive",grape:"Chardonnay",region:"Puligny-Montrachet, Bourgogne",year:2019,vivinoRating:4.9,priceEst:"1800 \u20ac",aeration:30,emoji:"\uD83D\uDC51",story:"Dumas \u00e9crivait qu\u2019on devait d\u00e9guster le Montrachet \u00e0 genoux, chapeau bas. Beurre de noisette, miel d\u2019acacia, une min\u00e9ralit\u00e9 transcendante."},
      ],
    },
    "opulent":{
      "decouverte":[
        {name:"Viognier Pays d\u2019Oc 2022",domaine:"G\u00e9rard Bertrand",grape:"Viognier",region:"Languedoc, France",year:2022,vivinoRating:3.9,priceEst:"13 \u20ac",aeration:10,emoji:"\uD83C\uDF3A",story:"Le Viognier est le c\u00e9page de l\u2019opulence \u2014 abricot, p\u00eache blanche, fleurs d\u2019oranger. Bertrand en livre une version solaire et accessible."},
        {name:"Gewurztraminer Vendanges Tardives 2020",domaine:"Hugel",grape:"Gewurztraminer",region:"Alsace, France",year:2020,vivinoRating:4.2,priceEst:"28 \u20ac",aeration:0,emoji:"\uD83C\uDF39",story:"Un parfum liquide \u2014 rose, litchi, gingembre confit. Moelleux sans \u00eatre lourd, secret et env\u00fbtant comme un souk oriental."},
        {name:"Viognier Condrieu d\u00e9couvertes 2022",domaine:"Yves Cuilleron",grape:"Viognier",region:"Condrieu, Rh\u00f4ne",year:2022,vivinoRating:4.1,priceEst:"25 \u20ac",aeration:10,emoji:"\u2728",story:"Cuilleron vinifie le Viognier avec une finesse florale incomparable. Abricot m\u00fbr, acacia, une texture grasse mais fra\u00eeche qui tient en \u00e9quilibre parfait."},
      ],
      "heritage":[
        {name:"Condrieu Coteau de Vernon 2021",domaine:"Georges Vernay",grape:"Viognier",region:"Condrieu, Rh\u00f4ne",year:2021,vivinoRating:4.5,priceEst:"95 \u20ac",aeration:15,emoji:"\u2728",story:"Vernay a sauv\u00e9 le Condrieu de l\u2019extinction dans les ann\u00e9es 60. Ce terroir unique donne un Viognier d\u2019une complexit\u00e9 florale vertigineuse \u2014 abricot, fleur d\u2019acacia, pierre chaude."},
      ],
      "exception":[
        {name:"Ch\u00e2teau d\u2019Yquem 2015",domaine:"LVMH",grape:"S\u00e9millon/Sauvignon",region:"Sauternes, Bordeaux",year:2015,vivinoRating:4.9,priceEst:"650 \u20ac",aeration:0,emoji:"\uD83D\uDC9B",story:"L\u2019unique Premier Cru Sup\u00e9rieur de Sauternes. Chaque grappe choisie une par une. Miel, safran, abricot sec, l\u2019immortalit\u00e9 en verre."},
      ],
    },
  },
  "heure-bleue":{
    "merlot":{
      "decouverte":[
        {name:"Saint-\u00c9milion Grand Cru 2020",domaine:"Ch\u00e2teau Rocheyron",grape:"Merlot",region:"Saint-\u00c9milion, Bordeaux",year:2020,vivinoRating:4.0,priceEst:"22 \u20ac",aeration:20,emoji:"\uD83C\uDF19",story:"Prune m\u00fbre, chocolat au lait, tanins velout\u00e9s. Rocheyron produit un grand cru accessible qui ne trahit pas son appellation."},
        {name:"Merlot Friuli 2021",domaine:"Livio Felluga",grape:"Merlot",region:"Frioul, Italie",year:2021,vivinoRating:3.9,priceEst:"18 \u20ac",aeration:15,emoji:"\uD83AB0",story:"Le Frioul produit des Merlot d\u2019une \u00e9l\u00e9gance nordique \u2014 moins charnus que Bordeaux, plus tendus, avec une acidit\u00e9 qui les rend digestibles et r\u00eeveurs."},
        {name:"Pomerol Les Hauts Conseillants 2019",domaine:"Ch\u00e2teau Les Hauts Conseillants",grape:"Merlot",region:"Lalande de Pomerol, Bordeaux",year:2019,vivinoRating:4.1,priceEst:"24 \u20ac",aeration:25,emoji:"\uD83C\uDF52",story:"Lalande de Pomerol offre une alternative accessible au Pomerol mythique. Velout\u00e9 et charnu, avec cette texture soyeuse qui rend le Merlot bordelais inoubliable."},
      ],
      "heritage":[
        {name:"Ornellaia 2018",domaine:"Marchesi de\u2019 Frescobaldi",grape:"Cabernet Sauvignon/Merlot",region:"Bolgheri, Toscane",year:2018,vivinoRating:4.6,priceEst:"145 \u20ac",aeration:60,emoji:"\uD83C\uDF0A",story:"Ornellaia est la r\u00e9ponse italienne aux grands Bordeaux. Cassis, graphite, c\u00e8dre. Une nuit \u00e0 la mer en bouteille."},
      ],
      "exception":[
        {name:"Masseto 2017",domaine:"Ornellaia",grape:"Merlot",region:"Bolgheri, Toscane",year:2017,vivinoRating:4.8,priceEst:"680 \u20ac",aeration:90,emoji:"\uD83C\uDF19",story:"Masseto est le P\u00e9trus italien \u2014 Merlot pur sur des argiles bleues uniques \u00e0 Bolgheri. Velours noir, truffe blanche, chocolat fondu. Un vin cr\u00e9pusculaire d\u2019une complexit\u00e9 infinie."},
      ],
    },
    "pinot":{
      "decouverte":[
        {name:"Bourgogne Pinot Noir 2021",domaine:"Louis Jadot",grape:"Pinot Noir",region:"Bourgogne, France",year:2021,vivinoRating:3.8,priceEst:"19 \u20ac",aeration:15,emoji:"\uD83C\uDF52",story:"Jadot distille l\u2019essence bourguignonne \u2014 cerise, terre humide, une l\u00e9g\u00e8ret\u00e9 qui n\u2019exclut pas la profondeur. Le Pinot Noir dans sa forme la plus accessible."},
        {name:"Pinot Noir Willamette Valley 2021",domaine:"Elk Cove",grape:"Pinot Noir",region:"Oregon, USA",year:2021,vivinoRating:4.0,priceEst:"28 \u20ac",aeration:15,emoji:"\uD83C\uDF32",story:"L\u2019Oregon est la Bourgogne du Nouveau Monde. Elk Cove produit un Pinot fragile et intense \u2014 canneberge, eucalyptus, champignon des bois."},
        {name:"Pinot Noir Alsace Kientzheim 2021",domaine:"Blanck",grape:"Pinot Noir",region:"Alsace, France",year:2021,vivinoRating:3.9,priceEst:"22 \u20ac",aeration:15,emoji:"\uD83C\uDF39",story:"L\u2019Alsace produit des Pinots Noirs souvent m\u00e9connus mais d\u2019une \u00e9l\u00e9gance nordique. Blanck en livre un fruiti, soyeux, avec une fraicheur alsacienne in\u00e9galable."},
      ],
      "heritage":[
        {name:"Gevrey-Chambertin Vieilles Vignes 2020",domaine:"Rossignol-Trapet",grape:"Pinot Noir",region:"Gevrey-Chambertin, Bourgogne",year:2020,vivinoRating:4.4,priceEst:"72 \u20ac",aeration:30,emoji:"\uD83C\uDF39",story:"Les vieilles vignes de Gevrey portent en elles la m\u00e9moire de la c\u00f4te. Rose fan\u00e9e, framboise, sous-bois \u2014 un bouquet unique \u00e0 Gevrey."},
      ],
      "exception":[
        {name:"Chambolle-Musigny Les Amoureuses 2018",domaine:"Comte Georges de Vog\u00fc\u00e9",grape:"Pinot Noir",region:"Chambolle-Musigny, Bourgogne",year:2018,vivinoRating:4.8,priceEst:"780 \u20ac",aeration:45,emoji:"\uD83D\uDC9C",story:"Les Amoureuses \u2014 un Premier Cru qui touche au Grand Cru. Pivoine, framboise fra\u00eeche, une soie qui s\u2019\u00e9tire sur des minutes. La sensualit\u00e9 absolue de Chambolle."},
      ],
    },
  },
  "evasion":{
    "nouveau":{
      "decouverte":[
        {name:"Malbec Mendoza Reserva 2021",domaine:"Achaval Ferrer",grape:"Malbec",region:"Mendoza, Argentine",year:2021,vivinoRating:4.0,priceEst:"19 \u20ac",aeration:20,emoji:"\uD83C\uDF0E",story:"Violet intense, myrtille, une structure tannique qui \u00e9voque la cordill\u00e8re des Andes. Le Malbec argentin dans sa forme la plus s\u00e9duisante."},
        {name:"Carm\u00e9n\u00e8re Gran Reserva 2021",domaine:"Concha y Toro",grape:"Carm\u00e9n\u00e8re",region:"Colchagua, Chili",year:2021,vivinoRating:4.0,priceEst:"17 \u20ac",aeration:20,emoji:"\uD83E\uDD9C",story:"Le Carm\u00e9n\u00e8re \u00e9tait perdu, confondu avec le Merlot pendant des d\u00e9cennies. Le Chili l\u2019a red\u00e9couvert \u2014 poivron rouge, m\u00fbre, texture charmeuse et unique."},
        {name:"Tannat Garz\u00f3n Reserve 2021",domaine:"Bodega Garz\u00f3n",grape:"Tannat",region:"Montevideo, Uruguay",year:2021,vivinoRating:4.0,priceEst:"19 \u20ac",aeration:25,emoji:"\uD83E\uDD86",story:"L\u2019Uruguay ne fait pas de compromis avec son Tannat \u2014 tanins puissants, couleur d\u2019encre. Garz\u00f3n sur ses collines de granit prouve que la r\u00e9bellion peut \u00eatre \u00e9l\u00e9gante."},
      ],
      "heritage":[
        {name:"Penfolds Bin 389 Shiraz 2019",domaine:"Penfolds",grape:"Shiraz/Cabernet",region:"Australie du Sud",year:2019,vivinoRating:4.3,priceEst:"55 \u20ac",aeration:30,emoji:"\uD83E\uDD98",story:"Surnomm\u00e9 le b\u00e9b\u00e9 Grange, le Bin 389 est \u00e9lev\u00e9 dans les m\u00eames f\u00fbts que le Grange l\u2019ann\u00e9e pr\u00e9c\u00e9dente. M\u00fbre, chocolat noir, eucalyptus australien."},
        {name:"Pinotage Kanonkop Estate 2019",domaine:"Kanonkop",grape:"Pinotage",region:"Stellenbosch, Afrique du Sud",year:2019,vivinoRating:4.4,priceEst:"48 \u20ac",aeration:40,emoji:"\uD83E\uDD81",story:"Le Pinotage est l\u2019enfant unique de l\u2019Afrique du Sud. Kanonkop en extrait un vin fum\u00e9, charnel, avec une min\u00e9ralit\u00e9 de granit du Cap."},
      ],
      "exception":[
        {name:"Opus One 2018",domaine:"Robert Mondavi & Rothschild",grape:"Cabernet Sauvignon",region:"Napa Valley, Californie",year:2018,vivinoRating:4.7,priceEst:"380 \u20ac",aeration:90,emoji:"\uD83C\uDFBC",story:"N\u00e9e de l\u2019alliance d\u2019un baron bordelais et d\u2019un pionnier californien, Opus One est la symphonie de Napa. Cassis, tabac blond, graphite \u2014 une grandeur qui r\u00e9concilie deux mondes."},
      ],
    },
    "ancien":{
      "decouverte":[
        {name:"Ribera del Duero Crianza 2019",domaine:"Bodegas Pesquera",grape:"Tempranillo",region:"Ribera del Duero, Espagne",year:2019,vivinoRating:4.0,priceEst:"16 \u20ac",aeration:20,emoji:"\uD83C\uDFF0",story:"Sur le plateau castillan \u00e0 850 m\u00e8tres, le Tempranillo acquiert une profondeur que Rioja ne peut \u00e9galer. Pesquera incarne cette tradition s\u00e9culaire \u2014 fruit rouge, cuir, tabac doux."},
        {name:"Bandol Rouge Tradition 2019",domaine:"Domaine Tempier",grape:"Mour\u00e8vdre",region:"Bandol, Provence",year:2019,vivinoRating:4.1,priceEst:"29 \u20ac",aeration:45,emoji:"\uD83C\uDF0A",story:"Bandol est la Provence s\u00e9rieuse. Domin\u00e9 par le Mour\u00e8vdre, ce vin porte la garrigue, le thym et la mer. Tempier d\u00e9fend ce terroir unique depuis des d\u00e9cennies."},
        {name:"Ribera del Duero Perfil 2020",domaine:"Legaris",grape:"Tempranillo",region:"Ribera del Duero, Espagne",year:2020,vivinoRating:3.9,priceEst:"18 \u20ac",aeration:20,emoji:"\uD83C\uDF3F",story:"Un Ribera abordable et authentique. Cerises noires, \u00e9pices douces, la minéralit\u00e9 du plateau castillan en bouteille."},
      ],
      "heritage":[
        {name:"Brunello di Montalcino 2017",domaine:"Biondi-Santi",grape:"Sangiovese Grosso",region:"Montalcino, Toscane",year:2017,vivinoRating:4.5,priceEst:"110 \u20ac",aeration:60,emoji:"\uD83C\uDFDB\uFE0F",story:"Biondi-Santi a invent\u00e9 le Brunello en 1888. Chaque bouteille porte l\u2019h\u00e9ritage de cinq g\u00e9n\u00e9rations \u2014 tanins de soie et d\u2019acier, finesse toscane incomparable."},
      ],
      "exception":[
        {name:"Vega Sicilia Unico 2010",domaine:"Vega Sicilia",grape:"Tempranillo/Cabernet",region:"Ribera del Duero, Espagne",year:2010,vivinoRating:4.9,priceEst:"420 \u20ac",aeration:120,emoji:"\uD83D\uDC51",story:"Vega Sicilia Unico \u00e9lev\u00e9 10 ans en barrique et foudre. Tabac, cerise noire, c\u00e8dre, temps suspendu. L\u2019Espagne absolue."},
      ],
    },
  },
  "patrimoine":{
    "gascon":{
      "decouverte":[
        {name:"Madiran Caves de Crouseilles 2020",domaine:"Crouseilles",grape:"Tannat",region:"Madiran, Gascogne",year:2020,vivinoRating:3.8,priceEst:"12 \u20ac",aeration:30,emoji:"\uD83C\uDFDB\uFE0F",story:"Les coteaux gascons entre Pau et Tarbes donnent ce Tannat rustique et sinc\u00e8re. Pruneaux, violette, tanins puissants \u2014 le vin des mousquetaires."},
        {name:"Gaillac Braucol 2021",domaine:"Robert Plageoles",grape:"Braucol",region:"Gaillac, Tarn",year:2021,vivinoRating:4.0,priceEst:"16 \u20ac",aeration:20,emoji:"\uD83C\uDF3F",story:"Plageoles est le gardien des c\u00e9pages oubli\u00e9s du Tarn. Le Braucol, inconnu \u00e0 50km, livre un vin \u00e9pic\u00e9 et sauvage qui ne ressemble \u00e0 rien d\u2019autre."},
        {name:"Pach\u00e9renc du Vic-Bilh Sec 2022",domaine:"Ch\u00e2teau Bouscass\u00e9",grape:"Petit Manseng",region:"Gascogne, France",year:2022,vivinoRating:3.9,priceEst:"14 \u20ac",aeration:10,emoji:"\uD83C\uDF3C",story:"Le Petit Manseng du Pacherenc est la face cach\u00e9e de Gascogne \u2014 floral, acidul\u00e9, avec une tension aromatique \u00e9tonnante pour un blanc du Sud-Ouest."},
      ],
      "heritage":[
        {name:"Ch\u00e2teau Montus Cuv\u00e9e Prestige 2016",domaine:"Alain Brumont",grape:"Tannat",region:"Madiran, France",year:2016,vivinoRating:4.4,priceEst:"52 \u20ac",aeration:60,emoji:"\u2694\uFE0F",story:"Brumont a m\u00e9tamorphos\u00e9 le Madiran en r\u00e9volutionnant la vinification du Tannat. Cassis, r\u00e9glisse, une charpente monumentale. Un vin de caract\u00e8re."},
      ],
      "exception":[
        {name:"Ch\u00e2teau d\u2019Yquem 2016",domaine:"LVMH",grape:"S\u00e9millon/Sauvignon Blanc",region:"Sauternes, Bordeaux",year:2016,vivinoRating:4.9,priceEst:"600 \u20ac",aeration:0,emoji:"\uD83D\uDC51",story:"Yquem incarne le patrimoine viticole fran\u00e7ais absolu. Chaque grappe choisie une par une. Miel, safran, abricot sec, l\u2019immortalit\u00e9 en verre."},
      ],
    },
    "bourguignon":{
      "decouverte":[
        {name:"Bourgogne Pinot Noir Couvent 2021",domaine:"Patriarche",grape:"Pinot Noir",region:"Bourgogne, France",year:2021,vivinoRating:3.8,priceEst:"18 \u20ac",aeration:10,emoji:"\uD83C\uDFDB\uFE0F",story:"Patriarche veille sur ses caves depuis 1780 sous les remparts de Beaune. Cerise, terre, l\u00e9g\u00e8ret\u00e9 bourguignonne \u2014 toute l\u2019\u00e9l\u00e9gance d\u2019une appellation s\u00e9culaire."},
        {name:"M\u00e2con-Villages Chardonnay 2022",domaine:"Louis Jadot",grape:"Chardonnay",region:"M\u00e2connais, Bourgogne",year:2022,vivinoRating:3.9,priceEst:"15 \u20ac",aeration:10,emoji:"\uD83C\uDF3E",story:"Le M\u00e2connais est la porte d\u2019entr\u00e9e de la Bourgogne blanche \u2014 abordable, floral, beurr\u00e9 avec l\u00e9g\u00e8ret\u00e9."},
        {name:"Givry Premier Cru Clos du Cellier 2020",domaine:"Domaine Joblot",grape:"Pinot Noir",region:"Givry, Bourgogne",year:2020,vivinoRating:4.0,priceEst:"24 \u20ac",aeration:15,emoji:"\uD83C\uDF39",story:"Givry est le secret bien gard\u00e9 de la C\u00f4te Chalonnaise \u2014 \u00e9l\u00e9gance bourguignonne, prix accessible, terroir authentique. Joblot est son amibassadeur id\u00e9al."},
      ],
      "heritage":[
        {name:"Meursault Les Charmes 2020",domaine:"Domaine Buisson-Charles",grape:"Chardonnay",region:"Meursault, Bourgogne",year:2020,vivinoRating:4.4,priceEst:"78 \u20ac",aeration:20,emoji:"\u2728",story:"Les Charmes de Meursault portent bien leur nom \u2014 noisette grillet\u00e9e, beurre de ferme, pomme dor\u00e9e. Buisson-Charles cultive en biodynamie et le vin le dit."},
      ],
      "exception":[
        {name:"Corton-Charlemagne Grand Cru 2019",domaine:"Bonneau du Martray",grape:"Chardonnay",region:"Corton, Bourgogne",year:2019,vivinoRating:4.7,priceEst:"280 \u20ac",aeration:30,emoji:"\uD83D\uDC51",story:"Charlemagne aurait plant\u00e9 de la vigne ici pour que sa barbe ne soit plus tach\u00e9e de rouge. Bonneau du Martray perp\u00e9tue cette l\u00e9gende \u2014 min\u00e9ral, beurr\u00e9, d\u2019une longueur imp\u00e9riale."},
      ],
    },
  },
  "impro":{
    "nature":{
      "decouverte":[
        {name:"Vin Nature Mac\u00e9ration 2022",domaine:"La Grapperie",grape:"Pineau d\u2019Aunis",region:"Sarthe, Loire",year:2022,vivinoRating:3.9,priceEst:"18 \u20ac",aeration:0,emoji:"\uD83C\uDFB2",story:"Renaud Guettier vinifie sans soufre, sans filtration. Son Pineau d\u2019Aunis part dans toutes les directions \u2014 poivre blanc, cerise fra\u00eeche, une l\u00e9g\u00e8ret\u00e9 qui flirte avec l\u2019impermanence."},
        {name:"P\u00e9t-Nat Gamay Sauvage 2022",domaine:"Domaine Mosse",grape:"Gamay",region:"Anjou, Loire",year:2022,vivinoRating:3.8,priceEst:"16 \u20ac",aeration:0,emoji:"\uD83E\uDEE7",story:"Un p\u00e9t-nat c\u2019est le jazz des vins. Mosse laisse le Gamay improviser \u2014 framboise, brioche, bulles folles qui dansent."},
        {name:"Juran\u00e7on Sec Ur\u00f5ulat 2022",domaine:"Dom. Cauhap\u00e9",grape:"Gros Manseng",region:"Jura\u00e7on, Pays Basque",year:2022,vivinoRating:4.0,priceEst:"19 \u20ac",aeration:0,emoji:"\uD83C\uDFB8",story:"Cauhap\u00e9 produit les meilleurs Jurançon secs de la r\u00e9gion basque \u2014 vifs, fleuris, avec une tension agrume qui r\u00e9velle les papilles. Un blanc plein de vie et d\u2019audace."},
      ],
      "heritage":[
        {name:"Clos Rougeard Le Bourg 2019",domaine:"Foucault",grape:"Cabernet Franc",region:"Saumur-Champigny, Loire",year:2019,vivinoRating:4.6,priceEst:"120 \u20ac",aeration:30,emoji:"\uD83C\uDFB8",story:"Les fr\u00e8res Foucault sont les dieux discrets de la Loire. Graphite, violette, poivron rouge sublim\u00e9. Un classique du vin nature d\u2019une pr\u00e9cision chirurgicale."},
      ],
      "exception":[
        {name:"Coul\u00e9e de Serrant 2019",domaine:"Nicolas Joly",grape:"Chenin Blanc",region:"Saveni\u00e8res, Loire",year:2019,vivinoRating:4.5,priceEst:"85 \u20ac",aeration:30,emoji:"\uD83C\uDF3F",story:"Nicolas Joly est le pape de la biodynamie viticole. Chenin Blanc d\u2019une densit\u00e9 m\u00e9ditative, cire d\u2019abeille, pomme cuite, iode. Un vin-philosophie hors du temps."},
      ],
    },
    "rare":{
      "decouverte":[
        {name:"Assyrtiko Santorini 2022",domaine:"Domaine Sigalas",grape:"Assyrtiko",region:"Santorin, Gr\u00e8ce",year:2022,vivinoRating:4.1,priceEst:"22 \u20ac",aeration:0,emoji:"\uD83C\uDFFA",story:"Les vignes tress\u00e9es en paniers pour r\u00e9sister au m\u00e9lt\u00e9mi. L\u2019Assyrtiko \u2014 citron, sel marin, min\u00e9ralit\u00e9 volcanique qu\u2019on ne trouve nulle part ailleurs."},
        {name:"Gr\u00fcner Veltliner Federspiel 2022",domaine:"Dom\u00e4ne Wachau",grape:"Gr\u00fcner Veltliner",region:"Wachau, Autriche",year:2022,vivinoRating:4.0,priceEst:"19 \u20ac",aeration:0,emoji:"\uD83C\uDF3F",story:"Le Gr\u00fcner est l\u2019\u00e2me de l\u2019Autriche \u2014 poivre blanc caract\u00e9ristique, agrumes, fra\u00eecheur alpestre. Les vignes accroch\u00e9es aux terrasses de granit au-dessus du Danube."},
        {name:"Txakoli Getariako 2022",domaine:"Txomin Etxaniz",grape:"Hondarrabi Zuri",region:"Getaria, Pays Basque",year:2022,vivinoRating:3.9,priceEst:"15 \u20ac",aeration:0,emoji:"\uD83C\uDF0A",story:"Le Txakoli est la joie basque en bouteille \u2014 petites bulles naturelles, citron vif, salinit\u00e9 iod\u00e9e. On le verse de haut pour l\u2019a\u00e9rer, tradition imm\u00e9moriale."},
      ],
      "heritage":[
        {name:"Jura Savagnin Ouill\u00e9 2020",domaine:"Domaine Ganevat",grape:"Savagnin",region:"Jura, France",year:2020,vivinoRating:4.5,priceEst:"65 \u20ac",aeration:15,emoji:"\uD83E\uDDC0",story:"Jean-Fran\u00e7ois Ganevat est le g\u00e9nie m\u00e9connu du Jura. Son Savagnin ouill\u00e9 r\u00e9v\u00e8le un c\u00e9page myst\u00e9rieux \u2014 citron confit, miel, nervosit\u00e9 unique aux marnes bleues jurassiennes."},
      ],
      "exception":[
        {name:"Vin Jaune Ch\u00e2teau-Chalon 2015",domaine:"Domaine Berthet-Bondet",grape:"Savagnin",region:"Ch\u00e2teau-Chalon, Jura",year:2015,vivinoRating:4.6,priceEst:"95 \u20ac",aeration:0,emoji:"\uD83C\uDFFA",story:"Six ans sous voile dans les f\u00fbts du Jura. Noix fra\u00eeche, curry, miel de montagne. Un vin qui vit hors du temps, dans un clavelin de 62cl unique au monde."},
      ],
    },
  },
  "revolte":{
    "punk":{
      "decouverte":[
        {name:"Monastrell Jumilla Organic 2021",domaine:"Casa de la Ermita",grape:"Monastrell",region:"Jumilla, Espagne",year:2021,vivinoRating:3.9,priceEst:"14 \u20ac",aeration:20,emoji:"\uD83C\uDF35",story:"Le Monastrell dans la chaleur s\u00e8che de Jumilla sans compromis. M\u00fbre noire, r\u00e9glisse, une puissance sourde qui ne s\u2019excuse pas."},
        {name:"Tannat Garz\u00f3n Reserve 2021",domaine:"Bodega Garz\u00f3n",grape:"Tannat",region:"Montevideo, Uruguay",year:2021,vivinoRating:4.0,priceEst:"19 \u20ac",aeration:25,emoji:"\uD83D\uDD25",story:"L\u2019Uruguay ne fait pas de compromis avec son Tannat \u2014 tanins puissants, couleur d\u2019encre, \u00e9nergie brute. Garz\u00f3n prouve que la r\u00e9bellion peut \u00eatre \u00e9l\u00e9gante."},
        {name:"Pinotage Boland Cellar 2021",domaine:"Boland Cellar",grape:"Pinotage",region:"Paarl, Afrique du Sud",year:2021,vivinoRating:3.8,priceEst:"13 \u20ac",aeration:20,emoji:"\uD83E\uDD81",story:"Le Pinotage cru de Paarl \u2014 fum\u00e9, charnu, avec cette note caract\u00e9ristique qui divise. Mais quelle puissance. Un vin pour ceux qui ne reculent pas."},
      ],
      "heritage":[
        {name:"Priorat Clos Erasmus 2018",domaine:"Daphne Glorian",grape:"Garnacha/Cabernet",region:"Priorat, Catalogne",year:2018,vivinoRating:4.6,priceEst:"135 \u20ac",aeration:60,emoji:"\uD83D\uDCA5",story:"Daphne Glorian est venue de Suisse avec une id\u00e9e folle \u2014 faire le meilleur vin d\u2019Espagne dans un terroir impossible. Dense, min\u00e9ral, r\u00e9volt\u00e9, magnifique."},
      ],
      "exception":[
        {name:"Sassicaia 2018",domaine:"Tenuta San Guido",grape:"Cabernet Sauvignon",region:"Bolgheri, Toscane",year:2018,vivinoRating:4.8,priceEst:"280 \u20ac",aeration:90,emoji:"\uD83D\uDE80",story:"En 1968, un aristocrate toscan planta du Cabernet alors que c\u2019\u00e9tait interdit. Il a chang\u00e9 l\u2019Italie viticole pour toujours. Cassis, c\u00e8dre, graphite immortel."},
      ],
    },
    "power":{
      "decouverte":[
        {name:"Nero d\u2019Avola Sicilia 2021",domaine:"Cusumano",grape:"Nero d\u2019Avola",region:"Sicile, Italie",year:2021,vivinoRating:3.9,priceEst:"14 \u20ac",aeration:15,emoji:"\uD83C\uDF0B",story:"Le Nero d\u2019Avola est volcanique, concentr\u00e9, prune noire et chocolat amer. Cusumano en livre une version accessible qui ne renie pas ses origines brutales."},
        {name:"Aglianico Campania IGT 2020",domaine:"Feudi di San Gregorio",grape:"Aglianico",region:"Campanie, Italie",year:2020,vivinoRating:3.9,priceEst:"16 \u20ac",aeration:35,emoji:"\uD83C\uDF0B",story:"L\u2019Aglianico est le Barolo du Sud \u2014 tanins puissants, acide vif, une structure qui demande du courage mais r\u00e9compense la patience."},
        {name:"Shiraz Barossa Old Block 2020",domaine:"Turkey Flat",grape:"Shiraz",region:"Barossa Valley, Australie",year:2020,vivinoRating:4.1,priceEst:"28 \u20ac",aeration:30,emoji:"\uD83D\uDD25",story:"Les vieilles vignes du Barossa ont des racines qui plongent \u00e0 10 m\u00e8tres de profondeur. Ce Shiraz est n\u00e9 de leur r\u00e9silience \u2014 concentr\u00e9, puissant, indompté."},
      ],
      "heritage":[
        {name:"Aglianico del Vulture Titolo 2018",domaine:"Elena Fucci",grape:"Aglianico",region:"Basilicate, Italie",year:2018,vivinoRating:4.5,priceEst:"55 \u20ac",aeration:60,emoji:"\uD83D\uDD25",story:"Elena Fucci vinifie seule sur les pentes du Vulture. Son Titolo est une b\u00eate magnifique \u2014 tanins de lave, cerise noire, une longueur qui s\u2019\u00e9tire comme une coul\u00e9e."},
      ],
      "exception":[
        {name:"Petite Sirah The Prisoner 2019",domaine:"The Prisoner Wine Company",grape:"Petite Sirah",region:"Napa Valley, Californie",year:2019,vivinoRating:4.4,priceEst:"65 \u20ac",aeration:30,emoji:"\u26D3\uFE0F",story:"Un assemblage h\u00e9r\u00e9tique qui m\u00eale Zinfandel, Cabernet, Petite Sirah. Sombre, concentr\u00e9, audacieux. Une prison de velours dont on ne cherche pas \u00e0 s\u2019\u00e9chapper."},
      ],
    },
  },
};

const pickFromBank=(vibe,styleId,budget,attempt=0)=>{
  const byBudget=(WINE_BANK[vibe]?.[styleId]?.[budget])
    ||(WINE_BANK[vibe]?.[styleId]?.["heritage"])
    ||(WINE_BANK[vibe]?.[Object.keys(WINE_BANK[vibe]||{})[0]]?.["heritage"])
    ||[];
  if(!byBudget.length) return null;
  const idx=attempt%byBudget.length;
  const w=byBudget[idx];
  const tier=PRICE_TIERS.find(t=>t.id===budget)||PRICE_TIERS[1];
  return{...w,id:`bank-${vibe}-${styleId}-${budget}-${attempt}-${Date.now()}`,
    vibe,baseCompat:85,price:tier.symbol,pH:3.85,tannins:8,glycerol:8,malo:true,
    note:"",addedAt:new Date().toLocaleDateString("fr-FR"),openedAt:null};
};

/* \u2500\u2500\u2500 G\u00e9n\u00e9ration IA via Claude API (fallback sur banque locale) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
const RECO_SYSTEM=`Tu es le Moteur de Recommandation Vivino d'Unwine-d.
Pour une vibe, une r\u00e9ponse utilisateur et un budget, g\u00e9n\u00e8re exactement 1 recommandation de vin R\u00c9EL disponible sur Vivino.
R\u00e9ponds UNIQUEMENT en JSON strict :
{"name":"Nom complet du vin","domaine":"Producteur","grape":"C\u00e9page","region":"R\u00e9gion, Pays","year":2019,"vivinoRating":4.2,"priceEst":"42 \u20ac","aeration":45,"pH":3.85,"tannins":8,"glycerol":8,"malo":true,"playlist":"Nom playlist","story":"3 phrases po\u00e9tiques","anecdote":"1 fait surprenant","emoji":"\uD83C\uDF77"}
- vivinoRating entre 3.5 et 4.8
- Le vin doit VRAIMENT exister et \u00eatre trouvable sur Vivino
- Style : po\u00e9tique, jamais technique dans story/anecdote`;

const fetchVibeReco=async(vibe,styleId,budget,profileId,attempt=0)=>{
  const vm=VIBES_META[vibe];
  const tier=PRICE_TIERS.find(t=>t.id===budget)||PRICE_TIERS[1];
  try{
    const r=await fetch("/api/claude",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,
        system:RECO_SYSTEM,
        messages:[{role:"user",content:`Vibe: ${vm?.name||vibe}, Style: ${styleId}, Budget: ${tier.label} (${tier.range}), Profil: ${profileId||"velours-noir"}, Seed: ${Math.random().toString(36).slice(2,9)}-n${attempt}. ${attempt>0?"Diff\u00e9rent des suggestions pr\u00e9c\u00e9dentes \u2014 autre r\u00e9gion ou c\u00e9page.":""}`}]})
    });
    const d=await r.json();
    const txt=d.content.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
    const parsed=JSON.parse(txt);
    return{...parsed,id:`ai-${vibe}-${Date.now()}`,vibe,baseCompat:85,
      price:tier.symbol,note:"",addedAt:new Date().toLocaleDateString("fr-FR"),openedAt:null};
  }catch(e){
    return pickFromBank(vibe,styleId,budget,attempt)||{id:`fb-${Date.now()}`,
      name:"S\u00e9lection du Sommelier",domaine:"Domaine \u00e0 d\u00e9couvrir",grape:"Blend",
      region:"France",year:2020,vibe,vivinoRating:4.1,priceEst:tier.range,
      aeration:35,pH:3.85,tannins:8,glycerol:8,malo:true,
      story:"Ce vin attend de vous r\u00e9v\u00e9ler ses secrets. Laissez-le s\u2019ouvrir.",emoji:"\uD83C\uDF77",
      baseCompat:82,price:tier.symbol,note:"",
      addedAt:new Date().toLocaleDateString("fr-FR"),openedAt:null};
  }
};

/* ═══════════════════════════════════════════════════════════════
   COMPATIBILITY ENGINE
═══════════════════════════════════════════════════════════════ */
const scoreWine = (wine, profileId="velours-noir", feedback=[]) => {
  let s = wine.baseCompat;
  if(profileId==="velours-noir"){
    if(wine.pH>=3.8) s+=8; else if(wine.pH>=3.6) s+=4; else s-=10;
    if(wine.tannins>=8) s+=7; else if(wine.tannins>=6) s+=3; else s-=8;
    if(wine.glycerol>=8) s+=5; else if(wine.glycerol>=6) s+=2;
    if(wine.malo) s+=5;
    const mache=(wine.tannins*wine.glycerol)/10;
    s+=Math.round(mache*.8);
    feedback.forEach(fb=>{
      if(fb.wineId===wine.id){
        if(fb.note==="trop-dur")  s-=8;
        if(fb.note==="trop-plat") s+=3;
        if(fb.note==="parfait")   s+=6;
        if(typeof fb.rating==="number"){
          if(fb.rating>=9) s+=15;
          else if(fb.rating>=8) s+=10;
          else if(fb.rating>=6) s+=4;
          else if(fb.rating<=3) s-=12;
        }
      } else {
        // Boost vins similaires si vin noté >=8
        if(typeof fb.rating==="number" && fb.rating>=8){
          const ratedWine=WINE_DB.find(w=>w.id===fb.wineId);
          if(ratedWine){
            if(ratedWine.grape===wine.grape) s+=5;
            if(ratedWine.region===wine.region) s+=3;
            if(Math.abs(ratedWine.tannins-wine.tannins)<=1) s+=2;
          }
        }
      }
    });
  }
  return Math.min(99,Math.max(40,Math.round(s)));
};

/* ═══════════════════════════════════════════════════════════════
   DUO FUSION DATA
═══════════════════════════════════════════════════════════════ */
const PROFILES_SIMPLE = {
  "velours-noir":{name:"Velours Noir",emoji:"🖤"},
  "cristal-pur": {name:"Cristal Pur", emoji:"💎"},
  "soie-rose":   {name:"Soie Rose",   emoji:"🌸"},
  "or-liquide":  {name:"Or Liquide",  emoji:"✨"},
  "aventurier":  {name:"L'Aventurier",emoji:"🧭"},
};
const DUO_MATRIX = [
  {p:["velours-noir","soie-rose"],   wine:"Chambolle-Musigny Premier Cru",  region:"Bourgogne, France",  emoji:"🌹", grad:"linear-gradient(160deg,#3d0a1a,#6b1a35)", why:"La structure du Velours Noir rencontre la finesse de la Soie Rose dans ce Pinot Noir de légende."},
  {p:["velours-noir","cristal-pur"], wine:"Barbera d'Asti Superiore",        region:"Piémont, Italie",    emoji:"⚡", grad:"linear-gradient(160deg,#1a0a2e,#4a1a6e)", why:"Le Barbera réunit l'acidité vive du Cristal Pur et la profondeur fruitée du Velours Noir."},
  {p:["velours-noir","or-liquide"],  wine:"Recioto della Valpolicella",      region:"Vénétie, Italie",    emoji:"🍯", grad:"linear-gradient(160deg,#2a1a00,#8a5a00)", why:"Puissant pour le Velours Noir, mais avec une sucrosité naturelle qui ravira l'Or Liquide."},
  {p:["cristal-pur","soie-rose"],    wine:"Sancerre Rouge",                  region:"Loire, France",      emoji:"💎", grad:"linear-gradient(160deg,#0a1a2e,#3a5a4a)", why:"Frais et minéral pour le Cristal Pur, délicat et fruité pour la Soie Rose."},
  {p:["soie-rose","or-liquide"],     wine:"Gewurztraminer Vendanges Tardives",region:"Alsace, France",    emoji:"🌸", grad:"linear-gradient(160deg,#3d1520,#c4608a)", why:"Aromatique pour la Soie Rose, opulent pour l'Or Liquide — un poème à deux voix."},
  {p:["cristal-pur","or-liquide"],   wine:"Vouvray Moelleux",                region:"Loire, France",      emoji:"🌿", grad:"linear-gradient(160deg,#0a1a0a,#2a5a3a)", why:"Vibrant d'acidité et généreux en sucre — une parfaite dualité entre les deux profils."},
];
const findDuo=(p1,p2)=>DUO_MATRIX.find(d=>d.p.includes(p1)&&d.p.includes(p2))||
  {wine:"Côtes du Rhône Villages",region:"Rhône, France",emoji:"🧭",
   grad:"linear-gradient(160deg,#1a0a00,#6b2500)",
   why:"Quand deux palais divergent radicalement, le Rhône réconcilie tout le monde."};

/* ═══════════════════════════════════════════════════════════════
   AI STORY GENERATOR
═══════════════════════════════════════════════════════════════ */
const SOMMELIER_SYSTEM=`Tu es le Sommelier Narrateur d'Unwine-d, une app premium.
Pour chaque vin, génère exactement 3 phrases poétiques :
Ligne 1 : l'origine géographique et le sol.
Ligne 2 : le geste du vigneron ou le secret du terroir.
Ligne 3 : la promesse sensorielle pour l'utilisateur.
Plus une anecdote vraie et surprenante en 1 phrase.
Réponds UNIQUEMENT en JSON strict : {"story":"...","anecdote":"..."}
Style : poétique, intime, métaphores sensorielles, jamais technique.`;

const generateAIStory=async(wine)=>{
  try{
    const r=await fetch("/api/claude",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,
        system:SOMMELIER_SYSTEM,
        messages:[{role:"user",content:`Domaine:${wine.domaine}\nVin:${wine.name}\nCépage:${wine.grape}\nRégion:${wine.region}`}]})
    });
    const d=await r.json();
    const txt=d.content.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
    return JSON.parse(txt);
  }catch{
    return{story:"Ce flacon garde encore sa part de mystère. Laissez-le s'ouvrir pour qu'il vous raconte lui-même son voyage. Certains vins préfèrent le silence à la promesse.",anecdote:null};
  }
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN — ONBOARDING
═══════════════════════════════════════════════════════════════ */
const Onboarding=({onDone})=>{
  const [out,setOut]=useState(false);
  const go=()=>{haptic(60);setOut(true);setTimeout(onDone,520);};
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",
      background:`radial-gradient(ellipse at 28% 18%,#3d0808,${C.dark} 65%)`,
      transition:"opacity .52s",opacity:out?0:1,padding:"0 32px"}}>
      {[480,320,180].map((r,i)=>(
        <div key={i} aria-hidden style={{position:"absolute",width:r,height:r,borderRadius:"50%",
          border:`1px solid rgba(196,165,90,${.03+i*.015})`,top:"50%",left:"50%",
          transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>
      ))}
      <div style={{marginBottom:28,animation:"float 3.2s ease-in-out infinite",
        filter:`drop-shadow(0 0 32px rgba(196,165,90,.18))`}}>
        <WineGlass fill={.62} size={72} uid="launch"/>
      </div>
      <div style={{fontSize:9,letterSpacing:".38em",color:C.gold,textTransform:"uppercase",
        marginBottom:10,fontFamily:"Cormorant Garamond,serif",textAlign:"center"}}>Bienvenue sur</div>
      <h1 style={{fontSize:54,fontFamily:"Playfair Display,serif",color:C.beige,
        marginBottom:6,lineHeight:1,fontWeight:400,textAlign:"center",letterSpacing:".04em"}}>Unwine‑d</h1>
      <div style={{width:48,height:2,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,
        borderRadius:1,margin:"10px auto 18px"}}/>
      <p style={{color:"rgba(245,245,220,.48)",fontSize:14,lineHeight:1.78,marginBottom:48,
        fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",textAlign:"center",maxWidth:280}}>
        L'intelligence émotionnelle du vin.<br/>Votre palais a une empreinte unique.
      </p>
      <button onClick={go} style={{
        width:"100%",maxWidth:320,
        background:`linear-gradient(135deg,${C.terra},#c45a45)`,
        color:C.beige,border:"none",padding:"18px 0",borderRadius:50,fontSize:12,
        letterSpacing:".22em",textTransform:"uppercase",cursor:"pointer",marginBottom:14,
        fontFamily:"Cormorant Garamond,serif",
        boxShadow:`0 12px 38px ${C.terra}44`,fontWeight:600}}>
        Découvrir mon profil gustatif
      </button>
      <button onClick={go} style={{background:"transparent",border:"none",
        color:"rgba(245,245,220,.32)",fontSize:11,cursor:"pointer",
        fontFamily:"Cormorant Garamond,serif",letterSpacing:".08em"}}>
        Déjà un compte ?{" "}<span style={{color:C.gold,textDecoration:"underline"}}>Se connecter</span>
      </button>
      <div style={{position:"absolute",bottom:36,left:0,right:0,
        display:"flex",justifyContent:"center",gap:22}}>
        {[["🧬","Profil IA"],["📖","Sommelier"],["⏳","Rituel"]].map(([e,l])=>(
          <div key={l} style={{textAlign:"center"}}>
            <div style={{fontSize:16,marginBottom:3}}>{e}</div>
            <div style={{fontSize:8,color:"rgba(245,245,220,.22)",letterSpacing:".12em",
              textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN — CRÉER UN COMPTE / CONNEXION / MODE INVITÉ
═══════════════════════════════════════════════════════════════ */
const CreateAccount=({profile,onDone,onGuest})=>{
  const [tab,    setTab]   = useState("signup"); // "signup" | "login" | "guest"
  const [name,   setName]  = useState("");
  const [email,  setEmail] = useState("");
  const [pwd,    setPwd]   = useState("");
  const [show,   setShow]  = useState(false);
  const [err,    setErr]   = useState("");
  const [loading,setLoad]  = useState(false);

  const validSignup = name.trim().length>=2 && email.includes("@") && pwd.length>=6;
  const validLogin  = email.includes("@") && pwd.length>=4;

  const submit=()=>{
    const ok = tab==="signup"?validSignup:validLogin;
    if(!ok){setErr("Merci de remplir tous les champs correctement.");return;}
    setErr("");setLoad(true);haptic(60);
    setTimeout(()=>{setLoad(false);onDone();},1200);
  };

  const inputStyle=(val)=>({
    width:"100%",background:"rgba(74,14,14,.22)",
    border:`1px solid rgba(196,165,90,${val?"0.35":"0.12"})`,
    borderRadius:14,padding:"14px 16px",color:"#F5F5DC",fontSize:14,
    fontFamily:"Cormorant Garamond,serif",transition:"border-color .25s",
  });

  const TABS=[
    {id:"signup", label:"Créer un compte"},
    {id:"login",  label:"Se connecter"},
    {id:"guest",  label:"Mode invité"},
  ];

  return(
    <div style={{minHeight:"100vh",background:`radial-gradient(ellipse at 30% 10%,#3d0808,#120303 60%)`,
      display:"flex",flexDirection:"column",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>

      {/* Profil badge */}
      <div style={{padding:"40px 24px 0",textAlign:"center",animation:"fadeUp .5s ease"}}>
        <div style={{fontSize:9,color:"rgba(245,245,220,.3)",letterSpacing:".28em",
          textTransform:"uppercase",marginBottom:8,fontFamily:"Cormorant Garamond,serif"}}>
          Profil détecté
        </div>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,
          background:"rgba(74,14,14,.45)",border:"1px solid rgba(196,165,90,.25)",
          borderRadius:20,padding:"10px 18px",marginBottom:24}}>
          <span style={{fontSize:22}}>{profile?.emoji||"🍷"}</span>
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:14,fontFamily:"Playfair Display,serif",color:"#F5F5DC",lineHeight:1}}>
              {profile?.name||"Sommelier"}
            </div>
            <div style={{fontSize:9,color:"#C4A55A",letterSpacing:".12em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif",marginTop:2}}>Votre empreinte gustative</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",background:"rgba(74,14,14,.3)",borderRadius:16,
          padding:4,gap:2,marginBottom:28}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setErr("");haptic(30);}} style={{
              flex:1,padding:"11px 4px",borderRadius:13,border:"none",
              background:tab===t.id?"rgba(226,114,91,.85)":"transparent",
              color:tab===t.id?"#FAF8F0":"rgba(245,245,220,.38)",
              fontSize:10,letterSpacing:".06em",
              fontFamily:"Cormorant Garamond,serif",
              transition:"all .25s",fontWeight:tab===t.id?600:400}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* FORM AREA */}
      <div style={{padding:"0 24px 44px",flex:1,animation:"fadeUp .4s ease .08s both",opacity:0}}>

        {/* ── SIGNUP ── */}
        {tab==="signup"&&(
          <div>
            {[
              {label:"Prénom",value:name,set:setName,type:"text",ph:"Jean-Baptiste"},
              {label:"Email", value:email,set:setEmail,type:"email",ph:"votre@email.com"},
            ].map(({label,value,set,type,ph})=>(
              <div key={label} style={{marginBottom:14}}>
                <div style={{fontSize:9,color:"#C4A55A",letterSpacing:".2em",textTransform:"uppercase",
                  marginBottom:7,fontFamily:"Cormorant Garamond,serif"}}>{label}</div>
                <input type={type} value={value} onChange={e=>set(e.target.value)} placeholder={ph}
                  style={inputStyle(value)}/>
              </div>
            ))}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:9,color:"#C4A55A",letterSpacing:".2em",textTransform:"uppercase",
                marginBottom:7,fontFamily:"Cormorant Garamond,serif"}}>Mot de passe</div>
              <div style={{position:"relative"}}>
                <input type={show?"text":"password"} value={pwd} onChange={e=>setPwd(e.target.value)}
                  placeholder="6 caractères minimum"
                  style={{...inputStyle(pwd),paddingRight:46}}/>
                <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:14,
                  top:"50%",transform:"translateY(-50%)",background:"none",border:"none",
                  color:"rgba(245,245,220,.3)",fontSize:14,padding:4}}>{show?"🙈":"👁️"}</button>
              </div>
              {pwd.length>0&&(
                <div style={{marginTop:7}}>
                  <div style={{height:2,background:"rgba(245,245,220,.07)",borderRadius:1}}>
                    <div style={{height:"100%",borderRadius:1,transition:"width .3s,background .3s",
                      width:`${Math.min(pwd.length/12*100,100)}%`,
                      background:pwd.length<6?"rgba(226,114,91,.5)":pwd.length<10?"#C4A55A":"#87A96B"}}/>
                  </div>
                  <div style={{fontSize:9,color:"rgba(245,245,220,.25)",fontFamily:"Cormorant Garamond,serif",
                    marginTop:4,textAlign:"right"}}>
                    {pwd.length<6?"Trop court":pwd.length<10?"Acceptable":"Fort ✓"}
                  </div>
                </div>
              )}
            </div>
            {err&&<div style={{background:"rgba(226,114,91,.12)",border:"1px solid rgba(226,114,91,.3)",
              borderRadius:12,padding:"11px 14px",marginBottom:14,fontSize:11,color:"#E2725B",
              fontFamily:"Cormorant Garamond,serif"}}>{err}</div>}
            <button onClick={submit} disabled={!validSignup||loading} style={{
              width:"100%",
              background:validSignup?`linear-gradient(135deg,#E2725B,#c45a45)`:"rgba(245,245,220,.06)",
              color:validSignup?"#FAF8F0":"rgba(245,245,220,.25)",
              border:validSignup?"none":"1px solid rgba(245,245,220,.1)",
              padding:"17px",borderRadius:50,fontSize:12,letterSpacing:".2em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif",marginBottom:16,
              boxShadow:validSignup?"0 10px 32px rgba(226,114,91,.44)":"none",
              fontWeight:validSignup?600:400,transition:"all .3s"}}>
              {loading?(<span style={{display:"inline-flex",alignItems:"center",gap:8}}>
                <span style={{width:13,height:13,border:"1.5px solid rgba(245,245,220,.3)",
                  borderTopColor:"#FAF8F0",borderRadius:"50%",display:"inline-block",
                  animation:"spin 1s linear infinite"}}/>Création…</span>
              ):"Créer mon compte"}
            </button>
            <p style={{textAlign:"center",fontSize:9,color:"rgba(245,245,220,.18)",
              fontFamily:"Cormorant Garamond,serif",marginTop:8,lineHeight:1.6}}>
              En créant votre compte, vous acceptez les{" "}
              <span style={{color:"rgba(245,245,220,.35)",textDecoration:"underline"}}>CGU</span>{" "}
              et la{" "}
              <span style={{color:"rgba(245,245,220,.35)",textDecoration:"underline"}}>Politique de confidentialité</span>.
            </p>
          </div>
        )}

        {/* ── LOGIN ── */}
        {tab==="login"&&(
          <div>
            {[
              {label:"Email", value:email,set:setEmail,type:"email",ph:"votre@email.com"},
            ].map(({label,value,set,type,ph})=>(
              <div key={label} style={{marginBottom:14}}>
                <div style={{fontSize:9,color:"#C4A55A",letterSpacing:".2em",textTransform:"uppercase",
                  marginBottom:7,fontFamily:"Cormorant Garamond,serif"}}>{label}</div>
                <input type={type} value={value} onChange={e=>set(e.target.value)} placeholder={ph}
                  style={inputStyle(value)}/>
              </div>
            ))}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:9,color:"#C4A55A",letterSpacing:".2em",textTransform:"uppercase",
                marginBottom:7,fontFamily:"Cormorant Garamond,serif"}}>Mot de passe</div>
              <div style={{position:"relative"}}>
                <input type={show?"text":"password"} value={pwd} onChange={e=>setPwd(e.target.value)}
                  placeholder="Votre mot de passe"
                  style={{...inputStyle(pwd),paddingRight:46}}/>
                <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:14,
                  top:"50%",transform:"translateY(-50%)",background:"none",border:"none",
                  color:"rgba(245,245,220,.3)",fontSize:14,padding:4}}>{show?"🙈":"👁️"}</button>
              </div>
            </div>
            <button style={{background:"none",border:"none",color:"rgba(196,165,90,.55)",
              fontSize:10,fontFamily:"Cormorant Garamond,serif",letterSpacing:".08em",
              marginBottom:20,cursor:"pointer",textDecoration:"underline",display:"block",textAlign:"right",
              width:"100%"}}>Mot de passe oublié ?</button>
            {err&&<div style={{background:"rgba(226,114,91,.12)",border:"1px solid rgba(226,114,91,.3)",
              borderRadius:12,padding:"11px 14px",marginBottom:14,fontSize:11,color:"#E2725B",
              fontFamily:"Cormorant Garamond,serif"}}>{err}</div>}
            <button onClick={submit} disabled={!validLogin||loading} style={{
              width:"100%",
              background:validLogin?`linear-gradient(135deg,#E2725B,#c45a45)`:"rgba(245,245,220,.06)",
              color:validLogin?"#FAF8F0":"rgba(245,245,220,.25)",
              border:validLogin?"none":"1px solid rgba(245,245,220,.1)",
              padding:"17px",borderRadius:50,fontSize:12,letterSpacing:".2em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif",marginBottom:16,
              boxShadow:validLogin?"0 10px 32px rgba(226,114,91,.44)":"none",
              fontWeight:validLogin?600:400,transition:"all .3s"}}>
              {loading?(<span style={{display:"inline-flex",alignItems:"center",gap:8}}>
                <span style={{width:13,height:13,border:"1.5px solid rgba(245,245,220,.3)",
                  borderTopColor:"#FAF8F0",borderRadius:"50%",display:"inline-block",
                  animation:"spin 1s linear infinite"}}/>Connexion…</span>
              ):"Se connecter"}
            </button>
          </div>
        )}

        {/* ── MODE INVITÉ ── */}
        {tab==="guest"&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            {/* Info card */}
            <div style={{background:"rgba(74,14,14,.3)",border:"1px solid rgba(196,165,90,.18)",
              borderRadius:18,padding:"20px 18px",marginBottom:20,textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12}}>🥂</div>
              <div style={{fontSize:15,fontFamily:"Playfair Display,serif",color:"#F5F5DC",
                marginBottom:8,fontWeight:400}}>Explorer sans s'engager</div>
              <p style={{fontSize:12,color:"rgba(245,245,220,.45)",fontFamily:"Cormorant Garamond,serif",
                fontStyle:"italic",lineHeight:1.75,margin:0}}>
                Accédez aux Vibes, au Sommelier IA et aux Rituels. Votre cave et votre profil ne seront pas sauvegardés.
              </p>
            </div>

            {/* What you get */}
            {[
              ["✅","Vibes & recommandations IA","Accès complet"],
              ["✅","Sommelier Narrateur","Récits générés pour chaque vin"],
              ["✅","Rituel d'aération","Minuteur + haptique"],
              ["⚠️","Cave personnelle","Non sauvegardée"],
              ["⚠️","Profil & historique","Perdu à la fermeture"],
              ["❌","Duo Fusion","Réservé aux membres"],
            ].map(([ic,label,sub])=>(
              <div key={label} style={{display:"flex",alignItems:"center",gap:12,
                padding:"10px 0",borderBottom:"1px solid rgba(245,245,220,.05)"}}>
                <span style={{fontSize:14,width:20,flexShrink:0}}>{ic}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:ic==="❌"?"rgba(245,245,220,.28)":"#F5F5DC",
                    fontFamily:"Cormorant Garamond,serif"}}>{label}</div>
                  <div style={{fontSize:10,color:"rgba(245,245,220,.28)",
                    fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>{sub}</div>
                </div>
              </div>
            ))}

            <button onClick={()=>{haptic(50);onGuest&&onGuest();}} style={{
              width:"100%",marginTop:24,
              background:"rgba(245,245,220,.06)",
              border:"1px solid rgba(245,245,220,.18)",
              color:"rgba(245,245,220,.7)",
              padding:"16px",borderRadius:50,fontSize:12,letterSpacing:".18em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif",marginBottom:12,transition:"all .25s"}}>
              Continuer en mode invité
            </button>
            <p style={{textAlign:"center",fontSize:10,color:"rgba(245,245,220,.2)",
              fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>
              Vous pourrez créer un compte à tout moment depuis l'app.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
/* ═══════════════════════════════════════════════════════════════
   SCREEN — QUIZ
═══════════════════════════════════════════════════════════════ */
const calcProfile=answers=>{
  const counts={A:0,B:0,C:0,D:0};
  Object.values(answers).forEach(a=>counts[a]++);
  const max=Math.max(...Object.values(counts));
  const leaders=Object.entries(counts).filter(([,v])=>v===max).map(([k])=>k);
  return leaders.length>1?PROFILES.MIX:PROFILES[leaders[0]];
};

const Quiz=({onComplete})=>{
  const [qIdx,setQIdx]=useState(0);
  const [answers,setAnswers]=useState({});
  const [animOut,setAnimOut]=useState(false);
  const q=QUESTIONS[qIdx];
  const glassF=Object.keys(answers).length/QUESTIONS.length;
  const sel=answers[qIdx];

  const choose=optId=>{
    haptic(40);
    const next={...answers,[qIdx]:optId};
    setAnswers(next);
    if(qIdx<QUESTIONS.length-1){
      setAnimOut(true);
      setTimeout(()=>{setQIdx(i=>i+1);setAnimOut(false);},300);
    } else {
      setTimeout(()=>onComplete(next),450);
    }
  };

  return(
    <div style={{minHeight:"100vh",background:`radial-gradient(ellipse at 30% 20%,#3d0808,${C.dark})`}}>
      {/* Progress header */}
      <div style={{padding:"28px 22px 0",display:"flex",alignItems:"center",gap:14}}>
        <div style={{animation:"float 3s ease-in-out infinite",flexShrink:0}}>
          <WineGlass fill={glassF} size={42} color={C.terra} uid="quiz"/>
        </div>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:9,color:"rgba(245,245,220,.3)",letterSpacing:".22em",
              textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>
              Q {qIdx+1} / {QUESTIONS.length}
            </span>
            <span style={{fontSize:9,color:C.gold,fontFamily:"Playfair Display,serif"}}>
              {Math.round(glassF*100)}%
            </span>
          </div>
          <div style={{height:3,background:"rgba(245,245,220,.07)",borderRadius:2}}>
            <div style={{height:"100%",width:`${qIdx/QUESTIONS.length*100}%`,borderRadius:2,
              background:`linear-gradient(90deg,${C.terra},${C.gold})`,transition:"width .5s ease"}}/>
          </div>
        </div>
      </div>
      {/* Question */}
      <div style={{padding:"28px 22px 20px",transition:"opacity .28s,transform .28s",
        opacity:animOut?0:1,transform:animOut?"translateY(-10px)":"translateY(0)"}}>
        <div style={{fontSize:10,color:C.gold,letterSpacing:".28em",textTransform:"uppercase",
          marginBottom:10,fontFamily:"Cormorant Garamond,serif"}}>{q.icon} {q.title}</div>
        <h2 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:C.beige,
          fontWeight:400,lineHeight:1.3,marginBottom:22}}>{q.question}</h2>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {q.options.map(opt=>{
            const isSel=sel===opt.id;
            return(
              <button key={opt.id} onClick={()=>choose(opt.id)} style={{
                width:"100%",background:isSel?"rgba(74,14,14,.55)":C.faintest,
                border:isSel?"1px solid rgba(196,165,90,.4)":`1px solid ${C.faint}`,
                borderRadius:20,padding:"14px 16px",textAlign:"left",
                display:"flex",alignItems:"center",gap:14,transition:"all .25s",
                transform:isSel?"scale(1.01)":"scale(1)"}}>
                <div style={{width:42,height:42,borderRadius:"50%",flexShrink:0,
                  background:isSel?`linear-gradient(135deg,${C.terra},${C.gold})`:"rgba(245,245,220,.07)",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                  {opt.emoji}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontFamily:"Playfair Display,serif",color:C.beige,marginBottom:2}}>{opt.label}</div>
                  <div style={{fontSize:11,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>{opt.sub}</div>
                </div>
                <div style={{width:18,height:18,borderRadius:"50%",flexShrink:0,
                  background:isSel?C.gold:"transparent",
                  border:isSel?"none":"1px solid rgba(245,245,220,.18)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:10,color:C.dark,transition:"all .25s"}}>
                  {isSel&&"✓"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {/* Dots */}
      <div style={{display:"flex",gap:6,justifyContent:"center",paddingBottom:24}}>
        {QUESTIONS.map((_,i)=>(
          <div key={i} style={{width:i===qIdx?20:answers[i]?8:6,height:6,borderRadius:3,
            background:i===qIdx?C.terra:answers[i]?C.gold:"rgba(245,245,220,.14)",transition:"all .3s"}}/>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN — QUIZ RESULT
═══════════════════════════════════════════════════════════════ */
const QuizResult=({profile,answers,onContinue})=>{
  const [stage,setStage]=useState(0);
  const counts={A:0,B:0,C:0,D:0};
  Object.values(answers).forEach(a=>counts[a]++);
  useEffect(()=>{
    const t1=setTimeout(()=>setStage(1),1800);
    const t2=setTimeout(()=>setStage(2),3000);
    return()=>{clearTimeout(t1);clearTimeout(t2);};
  },[]);
  return(
    <div style={{minHeight:"100vh",background:profile.grad,position:"relative",overflow:"hidden"}}>
      {["rgba(74,14,14,.55)","rgba(74,14,14,.28)","rgba(196,165,90,.08)"].map((c,i)=>(
        <div key={i} aria-hidden style={{position:"absolute",width:280-i*50,height:280-i*50,borderRadius:"50%",
          background:`radial-gradient(circle,${c} 0%,transparent 70%)`,
          top:"38%",left:"50%",transform:"translate(-50%,-50%)",
          animation:`auraFloat ${3+i*.8}s ease-in-out ${i*.4}s infinite`,pointerEvents:"none",filter:"blur(14px)"}}/>
      ))}
      <div style={{position:"relative",zIndex:2,padding:"56px 26px 44px",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
        {stage===0&&(
          <div style={{textAlign:"center",animation:"fadeUp .6s ease"}}>
            <div style={{fontSize:11,color:"rgba(245,245,220,.45)",letterSpacing:".28em",
              textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginBottom:20}}>
              Analyse de votre empreinte…
            </div>
            <div style={{display:"flex",gap:14,justifyContent:"center"}}>
              {Object.entries(counts).filter(([,v])=>v>0).map(([k,v])=>(
                <div key={k} style={{textAlign:"center"}}>
                  <div style={{width:38+v*9,height:38+v*9,borderRadius:"50%",margin:"0 auto 5px",
                    background:`radial-gradient(circle,${PROFILES[k]?.aura||C.terra} 0%,transparent 70%)`,
                    filter:"blur(4px)",animation:`auraFloat ${2+v*.5}s ease-in-out infinite`}}/>
                  <span style={{fontSize:9,color:"rgba(245,245,220,.35)",fontFamily:"Cormorant Garamond,serif"}}>{v}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {stage>=1&&(
          <div style={{textAlign:"center",animation:"revealUp .8s cubic-bezier(.34,1.56,.64,1) forwards"}}>
            <div style={{fontSize:10,color:"rgba(245,245,220,.35)",letterSpacing:".32em",
              textTransform:"uppercase",marginBottom:14,fontFamily:"Cormorant Garamond,serif"}}>
              Votre profil gustatif
            </div>
            <div style={{fontSize:64,marginBottom:8}}>{profile.emoji}</div>
            <h1 style={{fontSize:40,fontFamily:"Playfair Display,serif",color:C.beige,
              fontWeight:400,marginBottom:8,lineHeight:1.12}}>{profile.name}</h1>
            <p style={{fontSize:14,color:"rgba(245,245,220,.65)",fontFamily:"Cormorant Garamond,serif",
              fontStyle:"italic",maxWidth:270,margin:"0 auto",lineHeight:1.72}}>{profile.tagline}</p>
          </div>
        )}
        {stage>=2&&(
          <div style={{width:"100%",maxWidth:370,marginTop:26,animation:"fadeUp .6s ease .1s both"}}>
            {/* Palais breakdown */}
            <div style={{background:"rgba(0,0,0,.32)",border:"1px solid rgba(245,245,220,.1)",
              borderRadius:18,padding:"18px",marginBottom:12}}>
              <div style={{fontSize:9,color:"rgba(245,245,220,.32)",letterSpacing:".2em",
                textTransform:"uppercase",marginBottom:12,fontFamily:"Cormorant Garamond,serif"}}>
                Répartition de votre palais
              </div>
              {Object.entries(counts).map(([k,v])=>(
                <div key={k} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                    <span style={{fontSize:11,color:"rgba(245,245,220,.55)",fontFamily:"Cormorant Garamond,serif"}}>
                      {PROFILES[k]?.emoji} {PROFILES[k]?.name}
                    </span>
                    <span style={{fontSize:11,color:v>0?C.gold:C.muted,fontFamily:"Playfair Display,serif"}}>{v}/5</span>
                  </div>
                  <div style={{height:2,background:"rgba(245,245,220,.07)",borderRadius:1}}>
                    <div style={{height:"100%",width:`${v/5*100}%`,borderRadius:1,
                      background:`linear-gradient(90deg,${C.terra},${C.gold})`,transition:"width 1s ease"}}/>
                  </div>
                </div>
              ))}
            </div>
            {/* Description + traits */}
            <div style={{background:"rgba(0,0,0,.28)",border:"1px solid rgba(245,245,220,.08)",
              borderRadius:18,padding:"18px",marginBottom:16}}>
              <p style={{color:"rgba(245,245,220,.62)",fontSize:13,lineHeight:1.78,
                fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",marginBottom:14}}>
                "{profile.desc}"
              </p>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {profile.traits.map(t=>(
                  <span key={t} style={{background:"rgba(196,165,90,.1)",border:"1px solid rgba(196,165,90,.22)",
                    borderRadius:20,padding:"5px 12px",fontSize:10,color:C.gold,
                    fontFamily:"Cormorant Garamond,serif"}}>{t}</span>
                ))}
              </div>
            </div>
            <button onClick={()=>{haptic(60);onContinue(profile);}} style={{
              width:"100%",background:`linear-gradient(135deg,${C.terra},#c45a45)`,
              color:C.beige,border:"none",padding:"18px",borderRadius:50,fontSize:12,
              letterSpacing:".2em",textTransform:"uppercase",cursor:"pointer",
              fontFamily:"Cormorant Garamond,serif",boxShadow:`0 10px 36px ${C.terra}44`}}>
              Entrer dans Unwine‑d
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN — VIBE SCOUT (Question → Budget → Reco IA)
═══════════════════════════════════════════════════════════════ */
const VibeScout=({vibe,profile,onResult,onBack})=>{
  const [step,setStep]=useState("question"); // "question"|"budget"|"loading"|"result"
  const [styleId,setStyleId]=useState(null);
  const [budget,setBudget]=useState(null);
  const [wine,setWine]=useState(null);
  const [playlist,setPlaylist]=useState(null);
  const [seenPlaylists,setSeenPlaylists]=useState([]);
  const [dots,setDots]=useState(0);
  const [attempt,setAttempt]=useState(0);

  const vm=VIBES_META[vibe]||{name:vibe,emoji:"🍷",grad:"linear-gradient(160deg,#1a0808,#3d0808)"};
  const recoData=VIBE_RECO[vibe];
  const profileId=profile?.id||"velours-noir";

  // Dots animation pendant loading
  useEffect(()=>{
    if(step!=="loading") return;
    const t=setInterval(()=>setDots(d=>(d+1)%4),420);
    return()=>clearInterval(t);
  },[step]);

  const pickStyle=(id)=>{ haptic(40); setStyleId(id); setStep("budget"); };

  const pickBudget=async(tier)=>{
    haptic(50); setBudget(tier.id);
    // Playlist choisie UNE FOIS au clic, stockée dans le state
    const p=getUniquePlaylist(vibe,styleId,seenPlaylists);
    setPlaylist(p);
    setSeenPlaylists(prev=>[...prev,p.url]);
    setStep("loading");
    const result=await fetchVibeReco(vibe,styleId,tier.id,profileId,attempt);
    setWine(result);
    setStep("result");
  };

  const loadingMessages=[
    "Interrogation des terroirs…",
    "Croisement avec votre profil…",
    "Sélection de la pépite…",
    "Affinement par le Sommelier…",
  ];
  const [msgIdx,setMsgIdx]=useState(0);
  useEffect(()=>{
    if(step!=="loading") return;
    const t=setInterval(()=>setMsgIdx(i=>(i+1)%loadingMessages.length),900);
    return()=>clearInterval(t);
  },[step]);

  return(
    <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",flexDirection:"column",
      background:`radial-gradient(ellipse at 20% 10%, ${vm.grad.match(/#[0-9a-f]+/gi)?.[1]||"#3d0808"} 0%, #120303 70%)`,
      overflowY:"auto",WebkitOverflowScrolling:"touch"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",padding:"48px 20px 0",gap:14,flexShrink:0}}>
        <button onClick={onBack} style={{background:"rgba(245,245,220,.06)",border:"1px solid rgba(245,245,220,.12)",
          borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",
          color:"rgba(245,245,220,.5)",fontSize:16,cursor:"pointer",flexShrink:0}}>←</button>
        <div>
          <div style={{fontSize:9,color:"rgba(196,165,90,.6)",letterSpacing:".28em",textTransform:"uppercase",
            fontFamily:"Cormorant Garamond,serif"}}>{vm.emoji} {vm.name}</div>
          <div style={{fontSize:12,color:"rgba(245,245,220,.4)",fontFamily:"Cormorant Garamond,serif",
            fontStyle:"italic"}}>Votre Sommelier vous guide</div>
        </div>
      </div>

      {/* ── STEP: QUESTION ── */}
      {step==="question"&&recoData&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",
          padding:"32px 24px",animation:"fadeUp .4s ease"}}>
          <div style={{textAlign:"center",marginBottom:36}}>
            <span style={{fontSize:44}}>{vm.emoji}</span>
            <h2 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:"#F5F5DC",
              fontWeight:400,marginTop:16,lineHeight:1.3,marginBottom:0}}>
              {recoData.q}
            </h2>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {recoData.opts.map((opt,i)=>(
              <button key={opt.id} onClick={()=>pickStyle(opt.id)} style={{
                background:"rgba(74,14,14,.35)",
                border:"1px solid rgba(196,165,90,.2)",
                borderRadius:18,padding:"20px 22px",textAlign:"left",cursor:"pointer",
                animation:`fadeUp .35s ease ${i*.08}s both`,opacity:0,
                transition:"border-color .2s,background .2s"}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <span style={{fontSize:26,width:36,textAlign:"center",flexShrink:0}}>{opt.emoji}</span>
                  <div>
                    <div style={{fontSize:14,fontFamily:"Playfair Display,serif",color:"#F5F5DC",
                      marginBottom:3,fontWeight:400}}>{opt.label}</div>
                    <div style={{fontSize:10,color:"rgba(245,245,220,.32)",
                      fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>{opt.tags}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP: BUDGET ── */}
      {step==="budget"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",
          padding:"32px 24px",animation:"fadeUp .4s ease"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <h2 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:"#F5F5DC",
              fontWeight:400,lineHeight:1.3}}>Quel est votre horizon de prix ?</h2>
            <p style={{fontSize:12,color:"rgba(245,245,220,.35)",fontFamily:"Cormorant Garamond,serif",
              fontStyle:"italic",marginTop:8}}>Le Sommelier ajuste sa sélection</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {PRICE_TIERS.map((tier,i)=>(
              <button key={tier.id} onClick={()=>pickBudget(tier)} style={{
                background:tier.grad,border:`1px solid ${tier.border}`,
                borderRadius:20,padding:"22px 24px",cursor:"pointer",textAlign:"left",
                animation:`fadeUp .35s ease ${i*.09}s both`,opacity:0,
                boxShadow:`0 8px 24px rgba(0,0,0,.3)`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                    <span style={{fontSize:22,fontFamily:"Playfair Display,serif",color:"#C4A55A",
                      fontWeight:600,letterSpacing:".08em"}}>{tier.symbol}</span>
                    <span style={{fontSize:16,fontFamily:"Playfair Display,serif",color:"#F5F5DC",
                      fontWeight:400}}>{tier.label}</span>
                  </div>
                  <span style={{fontSize:11,color:"rgba(196,165,90,.7)",fontFamily:"Cormorant Garamond,serif",
                    fontStyle:"italic"}}>{tier.range}</span>
                </div>
                <p style={{fontSize:11,color:"rgba(245,245,220,.42)",fontFamily:"Cormorant Garamond,serif",
                  fontStyle:"italic",lineHeight:1.55,margin:0,whiteSpace:"pre-line"}}>{tier.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP: LOADING ── */}
      {step==="loading"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
          justifyContent:"center",padding:"32px 24px",gap:28}}>
          <div style={{position:"relative",width:110,height:110,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{position:"absolute",inset:0,borderRadius:"50%",
              border:"1.5px solid rgba(196,165,90,.1)"}}/>
            <div style={{position:"absolute",inset:0,borderRadius:"50%",
              border:"2px solid transparent",borderTopColor:"#C4A55A",
              animation:"spin 1.2s linear infinite"}}/>
            <WineGlass fill={.55} size={52} uid="scout-load"/>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:14,fontFamily:"Playfair Display,serif",color:"#F5F5DC",
              marginBottom:6}}>Recherche en cours{"."
              .repeat(dots+1)}</div>
            <div style={{fontSize:11,color:"rgba(245,245,220,.35)",fontFamily:"Cormorant Garamond,serif",
              fontStyle:"italic",animation:"fadeUp .4s ease",minHeight:20}}>
              {loadingMessages[msgIdx]}
            </div>
          </div>
          <div style={{display:"flex",gap:6,marginTop:8}}>
            {["Profil","Vibe","Budget","Terroir"].map((l,i)=>(
              <div key={l} style={{fontSize:7,color:"rgba(196,165,90,.4)",letterSpacing:".1em",
                textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",
                background:"rgba(74,14,14,.3)",borderRadius:20,padding:"4px 8px"}}>
                {l} ✓
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP: RESULT ── */}
      {step==="result"&&wine&&playlist&&(()=>{
        return(
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",
          padding:"20px 18px 48px"}}>

          {/* ── Entête vin ── */}
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:9,color:"#C4A55A",letterSpacing:".32em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif",marginBottom:12,opacity:.8}}>
              Sélection Sommelier
            </div>
            <div style={{fontSize:44,marginBottom:14,filter:"drop-shadow(0 4px 16px rgba(196,165,90,.3))"}}>{wine.emoji||"🍷"}</div>
            <h3 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:"#FAF8F0",
              fontWeight:500,marginBottom:6,lineHeight:1.25,letterSpacing:".01em"}}>{wine.name}</h3>
            <div style={{fontSize:13,color:"rgba(245,245,220,.6)",fontFamily:"Cormorant Garamond,serif",
              marginBottom:4}}>{wine.domaine}</div>
            <div style={{fontSize:11,color:"rgba(245,245,220,.38)",fontFamily:"Cormorant Garamond,serif",
              letterSpacing:".06em",textTransform:"uppercase"}}>{wine.region}</div>
          </div>

          {/* ── Badges prix + note ── */}
          <div style={{display:"flex",gap:10,marginBottom:20}}>
            <div style={{flex:1,background:"rgba(74,14,14,.7)",border:"1px solid rgba(196,165,90,.3)",
              borderRadius:16,padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:20,color:"#C4A55A",fontFamily:"Playfair Display,serif",
                fontWeight:700,letterSpacing:".04em",marginBottom:3}}>
                {"★".repeat(Math.round(wine.vivinoRating||4))}
              </div>
              <div style={{fontSize:15,color:"#FAF8F0",fontFamily:"Playfair Display,serif",
                fontWeight:600,marginBottom:2}}>{wine.vivinoRating||"4.1"} / 5</div>
              <div style={{fontSize:9,color:"rgba(245,245,220,.4)",letterSpacing:".1em",
                textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>Vivino</div>
            </div>
            <div style={{flex:1,background:"rgba(74,14,14,.7)",border:"1px solid rgba(226,114,91,.35)",
              borderRadius:16,padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:20,color:"#E2725B",fontFamily:"Playfair Display,serif",
                fontWeight:700,marginBottom:3}}>{wine.price||"€€"}</div>
              <div style={{fontSize:15,color:"#FAF8F0",fontFamily:"Playfair Display,serif",
                fontWeight:600,marginBottom:2}}>{wine.priceEst||"~45 €"}</div>
              <div style={{fontSize:9,color:"rgba(245,245,220,.4)",letterSpacing:".1em",
                textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>Prix moyen</div>
            </div>
          </div>

          {/* ── Tags cépage / millésime / aération ── */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
            {[wine.grape, wine.year&&`Millésime ${wine.year}`, wine.aeration&&`${wine.aeration} min d'aération`].filter(Boolean).map(t=>(
              <span key={t} style={{fontSize:11,color:"#F5F5DC",letterSpacing:".04em",
                fontFamily:"Cormorant Garamond,serif",
                background:"rgba(196,165,90,.12)",border:"1px solid rgba(196,165,90,.2)",
                borderRadius:20,padding:"6px 14px"}}>{t}</span>
            ))}
          </div>

          {/* ── Histoire ── */}
          {wine.story&&(
            <div style={{background:"rgba(0,0,0,.35)",border:"1px solid rgba(245,245,220,.07)",
              borderRadius:18,padding:"18px 20px",marginBottom:20}}>
              <div style={{fontSize:9,color:"rgba(196,165,90,.6)",letterSpacing:".22em",
                textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginBottom:10}}>
                Le récit
              </div>
              <p style={{fontSize:14,color:"rgba(245,245,220,.85)",fontFamily:"Cormorant Garamond,serif",
                fontStyle:"italic",lineHeight:1.8,margin:0}}>
                {wine.story}
              </p>
            </div>
          )}

          {/* ── Playlist Spotify ── */}
          <a href={playlist.url} target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",gap:14,
              background:"linear-gradient(135deg,rgba(30,215,96,.12),rgba(30,215,96,.06))",
              border:"1px solid rgba(30,215,96,.3)",
              borderRadius:18,padding:"16px 18px",marginBottom:20,textDecoration:"none"}}>
            <div style={{width:44,height:44,borderRadius:12,flexShrink:0,
              background:"#1DB954",display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:"0 4px 14px rgba(29,185,84,.35)"}}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,color:"#FAF8F0",fontFamily:"Playfair Display,serif",
                fontWeight:500,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",
                whiteSpace:"nowrap"}}>{playlist.name}</div>
              <div style={{fontSize:11,color:"rgba(245,245,220,.5)",
                fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>{playlist.desc}</div>
            </div>
            <div style={{fontSize:10,color:"#1DB954",fontFamily:"Cormorant Garamond,serif",
              letterSpacing:".08em",textTransform:"uppercase",flexShrink:0}}>Ouvrir →</div>
          </a>

          {/* ── Actions ── */}
          <a href={`https://www.vivino.com/search/wines?q=${encodeURIComponent(wine.name)}`}
            target="_blank" rel="noopener noreferrer" style={{
              display:"block",textAlign:"center",
              background:"linear-gradient(135deg,#7b1a1a,#C4A55A)",
              color:"#FAF8F0",padding:"17px",borderRadius:50,
              fontSize:12,letterSpacing:".2em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif",marginBottom:12,
              textDecoration:"none",fontWeight:700,
              boxShadow:"0 8px 28px rgba(196,165,90,.3)"}}>
            🛒 Voir sur Vivino
          </a>

          <button onClick={()=>{haptic(60);onResult(wine);}} style={{
            width:"100%",background:"rgba(226,114,91,.18)",
            border:"1px solid rgba(226,114,91,.45)",
            color:"#FAF8F0",padding:"16px",borderRadius:50,fontSize:12,
            letterSpacing:".2em",textTransform:"uppercase",
            fontFamily:"Cormorant Garamond,serif",marginBottom:14,
            fontWeight:600}}>
            + Ajouter à ma cave
          </button>

          {/* ── Nouvelle sélection — visible ── */}
          <button onClick={()=>{haptic(30);setAttempt(a=>a+1);setStep("question");setStyleId(null);setBudget(null);setWine(null);setPlaylist(null);setSeenPlaylists(s=>s.length>=8?[]:s);}}
            style={{width:"100%",
              background:"rgba(245,245,220,.07)",
              border:"1px solid rgba(245,245,220,.18)",
              color:"rgba(245,245,220,.7)",
              padding:"14px",borderRadius:50,fontSize:11,
              letterSpacing:".16em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif"}}>
            ↺ Nouvelle sélection
          </button>

        </div>
        );
      })()}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN — DASHBOARD (Vibes + Cave)
═══════════════════════════════════════════════════════════════ */
const Dashboard=({profile,cave,onAddCave,feedback,onOpenWine,onOpenDuo,isGuest,onCreateAccount})=>{
  const [tab,setTab]=useState("vibes");
  const [vibeFilter,setVibeFilter]=useState(null);
  const [caveFilter,setCaveFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [activeVibe,setActiveVibe]=useState(null); // vibe id en cours de scout
  const [scannerOpen,setScannerOpen]=useState(false);

  const profileId=profile?.id||"velours-noir";
  const scored=WINE_DB.map(w=>({...w,score:scoreWine(w,profileId,feedback)}));
  const goldCount=cave.filter(w=>scoreWine(w,profileId,feedback)>=90).length;
  const pendingCount=cave.filter(w=>!w.openedAt).length;
  const uniqueVibes=[...new Set(cave.map(w=>w.vibe))];

  const displayedCave=scored.filter(w=>{
    if(!cave.some(c=>c.id===w.id)) return false;
    const s=search.toLowerCase();
    if(s && !w.name.toLowerCase().includes(s) && !w.region.toLowerCase().includes(s)) return false;
    if(vibeFilter && w.vibe!==vibeFilter) return false;
    const cw=cave.find(c=>c.id===w.id);
    if(caveFilter==="top")     return w.score>=90;
    if(caveFilter==="pending") return !cw?.openedAt;
    if(caveFilter==="opened")  return !!cw?.openedAt;
    return true;
  }).map(w=>{const cw=cave.find(c=>c.id===w.id);return{...w,...(cw||{})};});

  const isCave=tab==="cave";
  const bg=isCave?C.cream:C.dark;
  const txtColor=isCave?C.lieDeVin:C.beige;
  const subColor=isCave?C.mudMuted:C.muted;

  return(
    <div style={{minHeight:"100vh",background:bg,paddingBottom:90}}>

      {/* Bannière mode invité */}
      {isGuest&&(
        <div style={{background:"linear-gradient(90deg,rgba(74,14,14,.95),rgba(196,165,90,.15),rgba(74,14,14,.95))",
          borderBottom:"1px solid rgba(196,165,90,.2)",
          padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:14,flexShrink:0}}>🥂</span>
          <div style={{flex:1}}>
            <span style={{fontSize:10,color:"rgba(245,245,220,.6)",fontFamily:"Cormorant Garamond,serif",
              fontStyle:"italic"}}>Mode invité — données non sauvegardées</span>
          </div>
          <button onClick={onCreateAccount} style={{
            background:"linear-gradient(135deg,#E2725B,#c45a45)",border:"none",
            borderRadius:20,padding:"6px 14px",fontSize:9,color:"#FAF8F0",
            letterSpacing:".1em",textTransform:"uppercase",
            fontFamily:"Cormorant Garamond,serif",cursor:"pointer",flexShrink:0,fontWeight:600}}>
            Créer un compte
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"22px 20px 0",background:bg}}>
        <div>
          <div style={{fontSize:20,fontFamily:"Playfair Display,serif",color:txtColor,fontWeight:400}}>Unwine‑d</div>
          <div style={{fontSize:9,color:subColor,letterSpacing:".18em",textTransform:"uppercase",
            fontFamily:"Cormorant Garamond,serif"}}>{profile?.emoji} {profile?.name}</div>
        </div>
        <button onClick={onOpenDuo} style={{
          background:"rgba(74,14,14,.4)",border:"1px solid rgba(196,165,90,.25)",
          borderRadius:12,padding:"9px 13px",cursor:"pointer",
          display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:14}}>👥</span>
          <span style={{fontSize:9,color:C.gold,letterSpacing:".12em",textTransform:"uppercase",
            fontFamily:"Cormorant Garamond,serif"}}>Duo</span>
        </button>
      </div>

      {/* VIBES */}
      {tab==="vibes"&&(
        <div>
          <div style={{textAlign:"center",padding:"22px 22px 16px"}}>
            <div style={{fontSize:10,color:C.gold,letterSpacing:".28em",textTransform:"uppercase",
              marginBottom:7,fontFamily:"Cormorant Garamond,serif"}}>Ce soir, vous êtes…</div>
            <h2 style={{fontSize:24,fontFamily:"Playfair Display,serif",color:C.beige,fontWeight:400}}>
              Quelle est votre Vibe ?
            </h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,padding:"0 14px 100px"}}>
            {Object.entries(VIBES_META).map(([vibeId, vm])=>{
              // Score par vibe = affinité profil × ambiance, pas compatibilité vin brute
              const VIBE_PROFILE_AFFINITY = {
                "velours-noir":  {"cocon":96,"orage":94,"secret":88,"patrimoine":85,"revolte":82,"impro":78,"evasion":74,"heure-bleue":70},
                "cristal-pur":   {"heure-bleue":95,"secret":90,"evasion":87,"impro":84,"cocon":72,"orage":68,"revolte":65,"patrimoine":60},
                "soie-rose":     {"heure-bleue":93,"secret":88,"evasion":85,"cocon":80,"impro":77,"patrimoine":74,"orage":65,"revolte":58},
                "or-liquide":    {"cocon":91,"patrimoine":89,"heure-bleue":86,"evasion":83,"secret":79,"impro":72,"orage":65,"revolte":55},
                "aventurier":    {"evasion":95,"impro":92,"revolte":88,"orage":84,"secret":78,"cocon":72,"heure-bleue":68,"patrimoine":62},
                "default":       {"cocon":82,"orage":78,"secret":75,"evasion":72,"patrimoine":70,"impro":68,"revolte":65,"heure-bleue":80},
              };
              const affinityMap = VIBE_PROFILE_AFFINITY[profile?.id] || VIBE_PROFILE_AFFINITY["default"];
              const matchScore = affinityMap[vibeId] || 75;
              return(
                <button key={vibeId}
                  onClick={()=>{ haptic(40); setActiveVibe(vibeId); }}
                  style={{
                    background:vm.grad,
                    border:"1px solid rgba(196,165,90,.25)",
                    borderRadius:18,
                    padding:"18px 14px",
                    textAlign:"left",
                    cursor:"pointer",
                    WebkitTapHighlightColor:"rgba(0,0,0,0)",
                    outline:"none",
                    appearance:"none",
                    WebkitAppearance:"none",
                    minHeight:120,
                    width:"100%",
                    display:"flex",
                    flexDirection:"column",
                    justifyContent:"space-between",
                    position:"relative",
                    zIndex:1,
                    touchAction:"manipulation",
                  }}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <span style={{fontSize:28,lineHeight:1,display:"block"}}>{vm.emoji}</span>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:12,fontFamily:"Playfair Display,serif",color:C.gold,fontWeight:700}}>{matchScore}%</div>
                      <div style={{fontSize:8,color:"rgba(196,165,90,.55)",letterSpacing:".06em",
                        fontFamily:"Cormorant Garamond,serif",textTransform:"uppercase"}}>match</div>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:14,fontFamily:"Playfair Display,serif",color:C.beige,
                      fontWeight:400,marginBottom:5,lineHeight:1.2}}>{vm.name}</div>
                    <div style={{fontSize:9,color:"rgba(245,245,220,.4)",fontFamily:"Cormorant Garamond,serif",
                      fontStyle:"italic",letterSpacing:".04em"}}>Toucher →</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CAVE */}
      {tab==="cave"&&(
        <div style={{padding:"16px 18px 0"}}>
          {/* Stats */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div>
              <div style={{fontSize:10,color:C.terra,letterSpacing:".22em",textTransform:"uppercase",
                marginBottom:4,fontFamily:"Cormorant Garamond,serif"}}>Ma Réserve</div>
              <h2 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:C.lieDeVin,fontWeight:400}}>d'Instants</h2>
            </div>
            <div style={{display:"flex",gap:10}}>
              {[[cave.length,"caves",C.lieDeVin],[goldCount,"or",C.gold],[pendingCount,"ouvrir",C.terra]].map(([n,l,c])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <div style={{fontSize:20,fontFamily:"Playfair Display,serif",color:c,fontWeight:500}}>{n}</div>
                  <div style={{fontSize:7,color:C.mudMuted,letterSpacing:".07em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{height:1,background:`linear-gradient(90deg,${C.terra},rgba(226,114,91,.1))`,marginBottom:12}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Chercher…"
            style={{width:"100%",background:"rgba(74,14,14,.07)",border:"1px solid rgba(74,14,14,.15)",
              borderRadius:12,padding:"10px 14px",color:C.lieDeVin,fontSize:13,
              fontFamily:"Cormorant Garamond,serif",marginBottom:10}}/>
          {/* Filters */}
          <div style={{display:"flex",gap:7,marginBottom:8,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            {[["all","Toute","🗄️"],["top","Pépites","✦"],["pending","À ouvrir","⏳"],["opened","Dégustées","✓"]].map(([id,l,ic])=>(
              <button key={id} onClick={()=>setCaveFilter(id)} style={{
                background:caveFilter===id?C.lieDeVin:"rgba(74,14,14,.06)",
                border:caveFilter===id?"none":"1px solid rgba(74,14,14,.15)",
                borderRadius:20,padding:"6px 12px",fontSize:10,
                color:caveFilter===id?C.beige:C.mudMuted,whiteSpace:"nowrap",
                fontFamily:"Cormorant Garamond,serif"}}>
                {ic} {l}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <button onClick={()=>setVibeFilter(null)} style={{
              background:!vibeFilter?C.terra:"transparent",
              border:`1px solid ${!vibeFilter?C.terra:"rgba(74,14,14,.2)"}`,
              borderRadius:20,padding:"4px 10px",fontSize:9,
              color:!vibeFilter?C.beige:C.mudMuted,whiteSpace:"nowrap",
              fontFamily:"Cormorant Garamond,serif"}}>Toutes</button>
            {uniqueVibes.map(v=>{const vm=VIBES_META[v];return(
              <button key={v} onClick={()=>setVibeFilter(vibeFilter===v?null:v)} style={{
                background:vibeFilter===v?C.terra:"transparent",
                border:`1px solid ${vibeFilter===v?C.terra:"rgba(74,14,14,.2)"}`,
                borderRadius:20,padding:"4px 10px",fontSize:9,
                color:vibeFilter===v?C.beige:C.mudMuted,whiteSpace:"nowrap",
                fontFamily:"Cormorant Garamond,serif"}}>{vm?.emoji} {vm?.name}</button>
            );})}
          </div>
          <div style={{height:1,background:"rgba(226,114,91,.12)",marginBottom:12}}/>
          {/* Grid */}
          {cave.length===0?(
            <div style={{textAlign:"center",padding:"56px 0"}}>
              <div style={{fontSize:40,marginBottom:10,opacity:.25}}>🍾</div>
              <p style={{color:C.mudMuted,fontSize:13,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>
                Votre cave est vide.<br/>Ajoutez des vins depuis les Vibes.
              </p>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {displayedCave.map((w,i)=>{
                const isGold=w.score>=90;
                return(
                  <button key={w.id} onClick={()=>{haptic(40);onOpenWine(w);}}
                    style={{background:w.openedAt?"rgba(245,245,220,.04)":"rgba(74,14,14,.18)",
                      border:`1px solid ${isGold?"rgba(196,165,90,.25)":"rgba(74,30,30,.3)"}`,
                      borderRadius:18,padding:"16px 12px 14px",textAlign:"center",
                      position:"relative",overflow:"hidden",
                      animation:`fadeUp .4s ease ${i*.05}s both`,opacity:0}}>
                    {isGold&&<div aria-hidden style={{position:"absolute",inset:0,
                      background:"radial-gradient(ellipse at 50% 0%,rgba(196,165,90,.07) 0%,transparent 70%)",
                      pointerEvents:"none"}}/>}
                    {isGold&&<div style={{position:"absolute",top:8,right:8,
                      background:"rgba(196,165,90,.15)",border:"1px solid rgba(196,165,90,.3)",
                      borderRadius:10,padding:"2px 6px",fontSize:8,color:C.gold,
                      fontFamily:"Cormorant Garamond,serif"}}>{w.score}%</div>}
                    <div style={{display:"flex",justifyContent:"center",marginBottom:10}}>
                      <BottleSVG color={w.openedAt?"rgba(74,14,14,.3)":C.lieDeVin}
                        glowing={isGold&&!w.openedAt} opened={!!w.openedAt} size={68}/>
                    </div>
                    <div style={{fontSize:11,marginBottom:2}}>{w.emoji}</div>
                    <div style={{fontSize:11,fontFamily:"Playfair Display,serif",
                      color:w.openedAt?"rgba(74,14,14,.4)":C.lieDeVin,lineHeight:1.3,
                      overflow:"hidden",display:"-webkit-box",
                      WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{w.name}</div>
                    <div style={{fontSize:8,color:C.mudMuted,fontFamily:"Cormorant Garamond,serif",marginTop:2}}>
                      {w.region.split(",")[0]} · {w.year}
                    </div>
                    {w.note&&<div aria-hidden style={{position:"absolute",bottom:8,left:"50%",
                      transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:C.sauge}}/>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:430,zIndex:20,
        background:`linear-gradient(transparent,${bg} 28%)`,padding:"10px 16px 24px"}}>
        <div style={{display:"flex",
          background:isCave?"rgba(200,190,165,.95)":"rgba(18,3,3,.94)",
          border:`1px solid ${isCave?"rgba(74,14,14,.15)":"rgba(196,165,90,.14)"}`,
          borderRadius:22,padding:"4px",gap:2}}>
          {[{id:"vibes",label:"Vibes",icon:"🍷"},{id:"cave",label:"Ma Cave",icon:"🗄️"},{id:"scan",label:"Scanner",icon:"📷"}].map(t=>(
            <button key={t.id} onClick={()=>{ if(t.id==="scan"){setScannerOpen(true);}else{setTab(t.id);} }} style={{flex:1,
              background:tab===t.id?`linear-gradient(135deg,${C.terra},#c45a45)`:"transparent",
              border:"none",borderRadius:18,padding:"12px 8px",transition:"all .28s",
              display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:18}}>{t.icon}</span>
              <span style={{fontSize:9,letterSpacing:".1em",textTransform:"uppercase",
                color:tab===t.id?C.beige:isCave?C.mudMuted:C.muted,
                fontFamily:"Cormorant Garamond,serif"}}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* VibeScout overlay — inside Dashboard scope */}
      {activeVibe&&(
        <VibeScout
          vibe={activeVibe}
          profile={profile}
          onBack={()=>setActiveVibe(null)}
          onResult={w=>{onAddCave(w);setActiveVibe(null);onOpenWine(w);}}
        />
      )}

      {/* SmartScanner overlay */}
      {scannerOpen&&(
        <SmartScanner
          profile={profile}
          onBack={()=>setScannerOpen(false)}
          onResult={w=>{onAddCave(w);setScannerOpen(false);onOpenWine(w);}}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN — WINE DETAIL
═══════════════════════════════════════════════════════════════ */
const WineDetail=({wine,profile,feedback,cave,onAddCave,onFeedback,onBack,onMarkOpened,onUpdateNote})=>{
  const [fill,setFill]=useState(0);
  const [ritualOpen,setRitualOpen]=useState(false);
  const [feedbackOpen,setFeedbackOpen]=useState(false);
  const [aiStory,setAiStory]=useState(null);
  const [aiLoading,setAiLoading]=useState(false);
  const [storyDone,setStoryDone]=useState(false);
  const [showAnec,setShowAnec]=useState(false);
  const [editNote,setEditNote]=useState(false);
  const [noteVal,setNoteVal]=useState(wine.note||"");

  const inCave=cave.some(c=>c.id===wine.id);
  const score=scoreWine(wine,profile?.id||"velours-noir",feedback);
  const vm=VIBES_META[wine.vibe];

  useEffect(()=>{setTimeout(()=>setFill(.65),300);},[wine.id]);
  useEffect(()=>{
    setAiStory(null);setAiLoading(true);setStoryDone(false);setShowAnec(false);
    generateAIStory(wine).then(d=>{setAiStory(d);setAiLoading(false);});
  },[wine.id]);

  const story = aiStory?.story || wine.story;
  const anec  = aiStory?.anecdote || wine.anecdote;

  return(
    <div style={{minHeight:"100vh",background:vm?.grad||`radial-gradient(ellipse at 30%15%,#3d0808,${C.dark})`,position:"relative"}}>
      {/* Nav */}
      <div style={{display:"flex",alignItems:"center",padding:"20px 20px 0",gap:14}}>
        <button onClick={onBack} style={{background:"rgba(245,245,220,.07)",
          border:"1px solid rgba(245,245,220,.14)",borderRadius:12,padding:"10px 14px",
          color:C.beige,fontSize:18,lineHeight:1}}>←</button>
        <div style={{flex:1,overflow:"hidden"}}>
          <div style={{fontSize:9,color:"rgba(245,245,220,.3)",letterSpacing:".2em",
            textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>
            {vm?`${vm.emoji} ${vm.name}`:""}
          </div>
          <div style={{fontSize:15,fontFamily:"Playfair Display,serif",color:C.beige,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{wine.name}</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:24,fontFamily:"Playfair Display,serif",color:C.gold,fontWeight:600,lineHeight:1}}>{score}</div>
          <div style={{fontSize:8,color:C.muted,fontFamily:"Cormorant Garamond,serif",textTransform:"uppercase",letterSpacing:".08em"}}>velours</div>
        </div>
      </div>

      {/* Glass */}
      <div style={{display:"flex",justifyContent:"center",padding:"18px 0 6px"}}>
        <WineGlass fill={fill} uid={`wd-${wine.id}`}/>
      </div>

      {/* Detail card */}
      <div style={{margin:"0 12px",background:"rgba(8,1,1,.72)",
        borderRadius:"22px 22px 0 0",border:"1px solid rgba(196,165,90,.14)",
        borderBottom:"none",padding:"20px 18px 56px"}}>

        {/* Compat bar */}
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:9,color:C.muted,letterSpacing:".16em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif"}}>Compatibilité Velours Noir</span>
            <span style={{fontSize:12,color:C.gold,fontFamily:"Playfair Display,serif",fontWeight:600}}>{score}%</span>
          </div>
          <div style={{height:3,background:"rgba(245,245,220,.07)",borderRadius:2}}>
            <div style={{height:"100%",width:`${score}%`,borderRadius:2,
              background:`linear-gradient(90deg,${C.terra},${C.gold})`,transition:"width 1.2s ease"}}/>
          </div>
        </div>

        <h2 style={{fontSize:20,fontFamily:"Playfair Display,serif",color:C.beige,fontWeight:400,lineHeight:1.3,marginBottom:4}}>{wine.name}</h2>
        <div style={{fontSize:10,color:"rgba(245,245,220,.33)",letterSpacing:".1em",textTransform:"uppercase",
          marginBottom:5,fontFamily:"Cormorant Garamond,serif"}}>{wine.region}</div>
        <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:C.muted,fontFamily:"Cormorant Garamond,serif"}}>{wine.year} · {wine.grape}</span>
          <span style={{color:"rgba(245,245,220,.2)"}}>·</span>
          <span style={{fontSize:12,color:C.gold,fontFamily:"Cormorant Garamond,serif"}}>{wine.price}</span>
          {wine.openedAt&&(
            <span style={{fontSize:9,color:C.sauge,background:"rgba(87,169,107,.1)",
              border:"1px solid rgba(87,169,107,.22)",borderRadius:10,padding:"2px 8px",
              fontFamily:"Cormorant Garamond,serif"}}>✓ Dégustée</span>
          )}
        </div>

        {/* Physio markers */}
        <div style={{background:"rgba(74,14,14,.3)",border:"1px solid rgba(196,165,90,.1)",
          borderRadius:14,padding:"13px 15px",marginBottom:14}}>
          <div style={{fontSize:9,color:C.gold,letterSpacing:".2em",textTransform:"uppercase",
            marginBottom:11,fontFamily:"Cormorant Garamond,serif"}}>Marqueurs Physiologiques</div>
          {[["🧪","pH",wine.pH,4.2,v=>v>=3.6],["🍇","Tannins",wine.tannins,10,v=>v>=6],["💧","Glycérol",wine.glycerol,10,v=>v>=6]].map(([e,l,v,mx,g])=>(
            <div key={l} style={{marginBottom:7}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:9,
                color:C.muted,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>
                <span>{e} {l}</span>
                <span style={{color:g(v)?C.gold:"rgba(226,114,91,.55)"}}>{v} {g(v)?"✓":"✗"}</span>
              </div>
              <div style={{height:2,background:"rgba(245,245,220,.07)",borderRadius:1}}>
                <div style={{height:"100%",width:`${v/mx*100}%`,borderRadius:1,
                  background:g(v)?`linear-gradient(90deg,${C.terra},${C.gold})`:"rgba(226,114,91,.35)"}}/>
              </div>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:9,
            color:C.muted,fontFamily:"Cormorant Garamond,serif"}}>
            <span>⚗️ Malo-Lactique</span>
            <span style={{color:wine.malo?C.gold:"rgba(226,114,91,.45)"}}>{wine.malo?"Complète ✓":"Partielle ✗"}</span>
          </div>
          {/* Mâche index */}
          <div style={{marginTop:9,background:"rgba(196,165,90,.06)",border:"1px solid rgba(196,165,90,.14)",
            borderRadius:10,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:8,color:C.muted,letterSpacing:".14em",textTransform:"uppercase",
                fontFamily:"Cormorant Garamond,serif",marginBottom:2}}>Indice de Mâche</div>
              <div style={{fontSize:11,color:C.gold,fontFamily:"Playfair Display,serif",fontStyle:"italic"}}>
                {wine.tannins*wine.glycerol/10>=7?"Exceptionnel":wine.tannins*wine.glycerol/10>=5?"Élevé":"Modéré"}
              </div>
            </div>
            <div style={{fontSize:20,fontFamily:"Playfair Display,serif",color:C.gold,fontWeight:600}}>
              {Math.round(wine.tannins*wine.glycerol/10*10)/10}
            </div>
          </div>
        </div>

        {/* Story */}
        <div style={{background:"rgba(74,14,14,.26)",borderRadius:14,padding:"13px 15px",
          marginBottom:14,borderLeft:`3px solid ${C.terra}`}}>
          <div style={{fontSize:9,color:C.terra,letterSpacing:".22em",textTransform:"uppercase",
            marginBottom:10,fontFamily:"Cormorant Garamond,serif"}}>L'Âme du Vin</div>
          {aiLoading?(
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0"}}>
              <div style={{width:14,height:14,border:`1.5px solid rgba(196,165,90,.3)`,
                borderTopColor:C.gold,borderRadius:"50%",animation:"spin 1s linear infinite",flexShrink:0}}/>
              <span style={{color:C.muted,fontSize:12,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",
                animation:"shimmer 1.5s ease infinite"}}>Le Sommelier compose votre récit…</span>
            </div>
          ):(
            <div style={{paddingLeft:14,borderLeft:"2px solid rgba(226,114,91,.22)",position:"relative"}}>
              <div style={{position:"absolute",left:-5,top:2,width:7,height:7,borderRadius:"50%",background:C.terra}}/>
              <Typewriter text={story} speed={20}
                onDone={()=>{setStoryDone(true);if(anec)setTimeout(()=>setShowAnec(true),550);}}/>
            </div>
          )}
          {anec&&showAnec&&(
            <div style={{background:"rgba(196,165,90,.06)",border:"1px solid rgba(196,165,90,.14)",
              borderRadius:11,padding:"10px 13px",marginTop:12,animation:"fadeUp .6s ease"}}>
              <div style={{fontSize:8,color:C.gold,letterSpacing:".18em",textTransform:"uppercase",
                marginBottom:5,fontFamily:"Cormorant Garamond,serif"}}>✦ Le saviez-vous ?</div>
              <Typewriter text={anec} speed={16} italic={false} color="rgba(245,245,220,.55)" size={12}/>
            </div>
          )}
        </div>

        {/* Note */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:9,color:"rgba(245,245,220,.26)",letterSpacing:".18em",textTransform:"uppercase",
            marginBottom:7,fontFamily:"Cormorant Garamond,serif"}}>Ma note personnelle</div>
          {editNote?(
            <div>
              <textarea value={noteVal} onChange={e=>setNoteVal(e.target.value)} rows={3}
                placeholder="Une soirée, un accord, un souvenir…"
                style={{width:"100%",background:"rgba(74,14,14,.25)",border:`1px solid rgba(196,165,90,.3)`,
                  borderRadius:11,padding:"11px 13px",color:C.beige,fontSize:13,resize:"none",
                  fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",lineHeight:1.65}}/>
              <div style={{display:"flex",gap:8,marginTop:7}}>
                <button onClick={()=>{onUpdateNote(wine.id,noteVal);setEditNote(false);}} style={{
                  background:`linear-gradient(135deg,${C.terra},#c45a45)`,color:C.beige,border:"none",
                  padding:"9px 18px",borderRadius:20,fontSize:10,letterSpacing:".12em",
                  textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>Enregistrer</button>
                <button onClick={()=>setEditNote(false)} style={{background:"transparent",color:C.muted,
                  border:"none",padding:"9px",fontSize:10,fontFamily:"Cormorant Garamond,serif"}}>Annuler</button>
              </div>
            </div>
          ):(
            <button onClick={()=>setEditNote(true)} style={{width:"100%",background:"rgba(74,14,14,.14)",
              border:"1px dashed rgba(196,165,90,.18)",borderRadius:11,padding:"11px 13px",textAlign:"left"}}>
              {noteVal?(
                <p style={{color:"rgba(245,245,220,.58)",fontSize:12,lineHeight:1.65,
                  fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",margin:0}}>{noteVal}</p>
              ):(
                <p style={{color:"rgba(245,245,220,.22)",fontSize:11,fontFamily:"Cormorant Garamond,serif",
                  fontStyle:"italic",margin:0}}>+ Ajouter une note personnelle…</p>
              )}
            </button>
          )}
        </div>

        {/* Playlist */}
        <div style={{display:"flex",alignItems:"center",gap:12,background:"rgba(245,245,220,.04)",
          borderRadius:13,padding:"11px 13px",border:"1px solid rgba(245,245,220,.06)",marginBottom:18}}>
          <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,
            background:`linear-gradient(135deg,${C.lieDeVin},${C.terra})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>♪</div>
          <div>
            <div style={{fontSize:8,color:"rgba(245,245,220,.26)",letterSpacing:".14em",textTransform:"uppercase",
              marginBottom:2,fontFamily:"Cormorant Garamond,serif"}}>Playlist suggérée</div>
            <div style={{fontSize:12,color:C.beige,fontFamily:"Cormorant Garamond,serif"}}>{wine.playlist||"Jazz Essentials"}</div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{display:"flex",gap:9,marginBottom:9}}>
          <button onClick={()=>{haptic(60);setRitualOpen(true);}} style={{flex:2,
            background:`linear-gradient(135deg,${C.gold},#a8893d)`,color:C.dark,border:"none",
            padding:"14px",borderRadius:50,fontSize:11,letterSpacing:".13em",textTransform:"uppercase",
            fontFamily:"Cormorant Garamond,serif",fontWeight:600,
            boxShadow:`0 8px 24px rgba(196,165,90,.28)`}}>⏳ Préparer le Rituel</button>
          <button onClick={()=>{haptic(40);setFeedbackOpen(true);}} style={{width:48,height:48,borderRadius:"50%",
            background:"rgba(245,245,220,.06)",border:"1px solid rgba(245,245,220,.12)",
            color:C.beige,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>★</button>
        </div>
        <div style={{display:"flex",gap:9}}>
          {!inCave?(
            <button onClick={()=>{haptic(40);onAddCave(wine);}} style={{flex:1,
              background:`linear-gradient(135deg,${C.terra},#c45a45)`,color:C.beige,border:"none",
              padding:"13px",borderRadius:50,fontSize:11,letterSpacing:".13em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif"}}>+ Ajouter à ma cave</button>
          ):(
            <div style={{flex:1,background:"rgba(87,169,107,.12)",border:"1px solid rgba(87,169,107,.25)",
              borderRadius:50,padding:"13px",textAlign:"center",fontSize:11,color:C.sauge,
              letterSpacing:".1em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>
              ✓ Dans ma cave
            </div>
          )}
          {inCave&&!wine.openedAt&&(
            <button onClick={()=>{haptic(40);onMarkOpened(wine.id);}} style={{
              background:"rgba(87,169,107,.12)",color:C.sauge,
              border:"1px solid rgba(87,169,107,.25)",padding:"13px 14px",borderRadius:50,fontSize:11,
              letterSpacing:".08em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>
              ✓ Dégustée
            </button>
          )}
        </div>
      </div>

      {ritualOpen&&<RitualOverlay wine={wine} onClose={()=>setRitualOpen(false)}/>}
      {feedbackOpen&&<FeedbackSheet wine={wine} onSave={(wid,note)=>{onFeedback(wid,note);setFeedbackOpen(false);}} onClose={()=>setFeedbackOpen(false)}/>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   RITUAL OVERLAY
═══════════════════════════════════════════════════════════════ */
const RitualOverlay=({wine,onClose})=>{
  const [elapsed,setElapsed]=useState(0);
  const [running,setRunning]=useState(false);
  const [done,setDone]=useState(false);
  const ref=useRef(null);
  const total=wine.aeration||30;
  const progress=Math.min(elapsed/total,1);

  const start=useCallback(()=>{
    if(running||done) return;
    setRunning(true);haptic(80);
    ref.current=setInterval(()=>{
      setElapsed(e=>{
        if(e+1>=total){clearInterval(ref.current);setDone(true);setRunning(false);
          haptic([200,100,200,100,500]);return total;}
        return e+1;
      });
    },1000);
  },[running,done,total]);
  useEffect(()=>()=>clearInterval(ref.current),[]);

  return(
    <div style={{position:"fixed",inset:0,zIndex:700,display:"flex",alignItems:"center",
      justifyContent:"center",background:"rgba(0,0,0,.82)"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#160404",border:`1px solid ${done?"rgba(196,165,90,.45)":"rgba(196,165,90,.2)"}`,
        borderRadius:28,padding:"30px 26px 34px",maxWidth:310,width:"90%",textAlign:"center",
        animation:"fadeUp .4s ease",transition:"border-color .5s",
        boxShadow:done?"0 0 32px rgba(196,165,90,.15)":"none"}}>
        <div style={{fontSize:9,color:C.gold,letterSpacing:".28em",textTransform:"uppercase",
          marginBottom:8,fontFamily:"Cormorant Garamond,serif"}}>Rituel d'Aération</div>
        <div style={{fontSize:14,fontFamily:"Playfair Display,serif",color:C.beige,marginBottom:22,fontWeight:400}}>{wine.name}</div>
        <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
          <HourglassSVG progress={progress} done={done} uid={`ro-${wine.id}`}/>
        </div>
        {!done?(
          <>
            <div style={{fontSize:30,fontFamily:"Playfair Display,serif",color:C.beige,fontWeight:400,lineHeight:1,marginBottom:4}}>
              {Math.max(0,total-elapsed)}<span style={{fontSize:12,color:C.muted,marginLeft:3}}>min</span>
            </div>
            <div style={{fontSize:9,color:"rgba(245,245,220,.28)",letterSpacing:".12em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif",marginBottom:14}}>
              {running?`${Math.round(progress*100)}% écoulé`:"Prêt à démarrer"}
            </div>
            {running&&(
              <div style={{height:2,background:"rgba(245,245,220,.07)",borderRadius:1,marginBottom:14}}>
                <div style={{height:"100%",width:`${progress*100}%`,borderRadius:1,
                  background:`linear-gradient(90deg,${C.terra},${C.gold})`,transition:"width 1s ease"}}/>
              </div>
            )}
            <button onClick={start} disabled={running} style={{
              background:running?"rgba(245,245,220,.05)":`linear-gradient(135deg,${C.terra},#c45a45)`,
              color:running?C.muted:C.beige,border:running?`1px solid ${C.faint}`:"none",
              padding:"13px 32px",borderRadius:50,fontSize:11,letterSpacing:".14em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif"}}>
              {running?"Sablier en cours…":"Démarrer"}
            </button>
          </>
        ):(
          <div style={{animation:"fadeUp .5s ease"}}>
            <div style={{fontSize:26,marginBottom:8}}>✨</div>
            <div style={{fontSize:16,fontFamily:"Playfair Display,serif",color:C.gold,marginBottom:7}}>Prêt à être servi</div>
            <div style={{fontSize:11,color:"rgba(245,245,220,.45)",fontFamily:"Cormorant Garamond,serif",
              fontStyle:"italic",lineHeight:1.7,marginBottom:18}}>Versez lentement, en spirale dans le verre</div>
            <button onClick={onClose} style={{background:`linear-gradient(135deg,${C.gold},#a8893d)`,
              color:C.dark,border:"none",padding:"12px 30px",borderRadius:50,fontSize:11,
              letterSpacing:".14em",textTransform:"uppercase",fontWeight:600,
              fontFamily:"Cormorant Garamond,serif"}}>Parfait</button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   FEEDBACK SHEET
═══════════════════════════════════════════════════════════════ */
const FeedbackSheet=({wine,onSave,onClose})=>{
  const [rating,setRating]=useState(7);
  const [note,setNote]=useState("");
  const ratingColor = rating>=9?"#87A96B":rating>=7?C.gold:rating>=5?C.terra:"rgba(226,114,91,.6)";
  const ratingLabel = rating===10?"Chef-d'œuvre":rating>=9?"Exceptionnel":rating>=8?"Remarquable":rating>=7?"Très bon":rating>=6?"Bon":rating>=5?"Correct":rating>=4?"Décevant":rating>=3?"Difficile":"Pas pour moi";
  return(
    <div style={{position:"fixed",inset:0,zIndex:800,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.65)"}} onClick={onClose}/>
      <div style={{position:"relative",background:"#1a0404",border:"1px solid rgba(196,165,90,.2)",
        borderRadius:"24px 24px 0 0",padding:"24px 20px 48px",animation:"slideUp .35s ease"}}>
        <div style={{width:34,height:3,background:"rgba(245,245,220,.14)",borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{fontSize:9,color:C.gold,letterSpacing:".26em",textTransform:"uppercase",
          marginBottom:5,fontFamily:"Cormorant Garamond,serif",textAlign:"center"}}>Mon Journal de Dégustation</div>
        <h3 style={{fontSize:15,fontFamily:"Playfair Display,serif",color:C.beige,textAlign:"center",
          marginBottom:22,fontWeight:400,lineHeight:1.3}}>{wine.name}</h3>

        {/* Note grande */}
        <div style={{textAlign:"center",marginBottom:18}}>
          <div style={{fontSize:56,fontFamily:"Playfair Display,serif",fontWeight:700,
            color:ratingColor,lineHeight:1,transition:"color .3s"}}>{rating}</div>
          <div style={{fontSize:10,color:"rgba(245,245,220,.4)",letterSpacing:".1em",fontFamily:"Cormorant Garamond,serif",
            textTransform:"uppercase",marginTop:2}}>/10</div>
          <div style={{fontSize:13,color:ratingColor,fontFamily:"Cormorant Garamond,serif",
            fontStyle:"italic",marginTop:4,transition:"color .3s"}}>{ratingLabel}</div>
        </div>

        {/* Sélecteur 1–10 */}
        <div style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            {[1,2,3,4,5,6,7,8,9,10].map(n=>(
              <button key={n} onClick={()=>{haptic(20);setRating(n);}} style={{
                width:28,height:28,borderRadius:"50%",border:"none",
                background:n<=rating?ratingColor:"rgba(245,245,220,.08)",
                color:n<=rating?"#120303":"rgba(245,245,220,.3)",
                fontSize:10,fontWeight:700,transition:"all .18s",
                fontFamily:"Cormorant Garamond,serif"}}>
                {n}
              </button>
            ))}
          </div>
          <div style={{height:3,background:"rgba(245,245,220,.07)",borderRadius:2}}>
            <div style={{height:"100%",borderRadius:2,transition:"width .25s, background .3s",
              width:`${rating*10}%`,background:ratingColor}}/>
          </div>
        </div>

        {/* Note texte optionnelle */}
        <textarea value={note} onChange={e=>setNote(e.target.value)}
          placeholder="Une impression, une anecdote… (optionnel)"
          rows={2}
          style={{width:"100%",background:"rgba(74,14,14,.25)",
            border:"1px solid rgba(196,165,90,.15)",borderRadius:14,
            padding:"12px 14px",color:C.beige,fontSize:12,
            fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",
            resize:"none",marginBottom:16}}/>

        <button onClick={()=>onSave(wine.id,rating,note)} style={{
          width:"100%",background:`linear-gradient(135deg,${C.terra},#c45a45)`,
          color:C.beige,border:"none",
          padding:"16px",borderRadius:50,fontSize:11,letterSpacing:".18em",textTransform:"uppercase",
          fontFamily:"Cormorant Garamond,serif",fontWeight:700,
          boxShadow:`0 8px 28px ${C.terra}44`}}>
          Enregistrer dans mon journal
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN — SMART SCANNER (caméra + IA)
═══════════════════════════════════════════════════════════════ */
const SmartScanner=({profile,onResult,onBack})=>{
  const videoRef=React.useRef(null);
  const [phase,setPhase]=useState("camera"); // camera|scanning|result|error
  const [wine,setWine]=useState(null);
  const [errMsg,setErrMsg]=useState("");
  const [dots,setDots]=useState(0);
  const [camErr,setCamErr]=useState(false);

  React.useEffect(()=>{
    navigator.mediaDevices?.getUserMedia({video:{facingMode:"environment"}})
      .then(stream=>{ if(videoRef.current){ videoRef.current.srcObject=stream; } })
      .catch(()=>setCamErr(true));
    return()=>{ try{ videoRef.current?.srcObject?.getTracks().forEach(t=>t.stop()); }catch(e){} };
  },[]);

  React.useEffect(()=>{
    if(phase!=="scanning") return;
    const t=setInterval(()=>setDots(d=>(d+1)%4),380);
    return()=>clearInterval(t);
  },[phase]);

  const scan=async()=>{
    haptic(80); setPhase("scanning");
    try{
      // Capturer la frame vidéo — taille réduite pour éviter timeout
      let imageBase64=null;
      if(videoRef.current && !camErr){
        const canvas=document.createElement("canvas");
        // Résolution réduite : max 800px pour rester sous 1MB
        const maxW=800;
        const ratio=videoRef.current.videoHeight/videoRef.current.videoWidth;
        canvas.width=maxW;
        canvas.height=Math.round(maxW*ratio)||600;
        canvas.getContext("2d").drawImage(videoRef.current,0,0,canvas.width,canvas.height);
        // Qualité 0.6 = ~200-400KB en base64
        imageBase64=canvas.toDataURL("image/jpeg",0.6).split(",")[1];
        console.log("Image size:", Math.round(imageBase64.length/1024)+"KB");
      }

      const body={
        model:"claude-sonnet-4-20250514",
        max_tokens:600,
        messages: imageBase64
          ? [{role:"user",content:[
              {type:"image",source:{type:"base64",media_type:"image/jpeg",data:imageBase64}},
              {type:"text",text:`Expert en vins. Lis cette étiquette et réponds UNIQUEMENT en JSON :
{"name":"Nom du vin","domaine":"Producteur","grape":"Cépage","region":"Région, Pays","year":2020,"vivinoRating":4.1,"priceEst":"35 €","aeration":30,"pH":3.85,"tannins":7,"glycerol":7,"malo":true,"story":"2 phrases poétiques","emoji":"🍷","vibe":"cocon"}
vibe = cocon|orage|secret|heure-bleue|evasion|patrimoine|impro|revolte`}
            ]}]
          : [{role:"user",content:'{"name":"Test","domaine":"Test","grape":"Test","region":"France","year":2020,"vivinoRating":4.0,"priceEst":"30 €","aeration":20,"pH":3.8,"tannins":7,"glycerol":7,"malo":true,"story":"Vin test.","emoji":"🍷","vibe":"cocon"}'}]
      };

      const r=await fetch("/api/claude",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body)
      });

      // Log la réponse brute pour débugger
      const rawText=await r.text();
      console.log("API status:", r.status);
      console.log("API response:", rawText.slice(0,300));

      if(!r.ok){
        throw new Error(`HTTP ${r.status}: ${rawText.slice(0,200)}`);
      }

      const d=JSON.parse(rawText);
      if(d.error) throw new Error(d.error.message||JSON.stringify(d.error));

      const txt=d.content.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(txt);
      setWine({...parsed,
        id:`scan-${Date.now()}`,
        baseCompat:85,
        price:parsed.price||"€€",
        note:"",
        addedAt:new Date().toLocaleDateString("fr-FR"),
        openedAt:null
      });
    }catch(e){
      console.error("Scanner error:", e);
      const msg=e?.message||"";
      if(msg.includes("401")||msg.includes("auth")||msg.includes("API_KEY")){
        setErrMsg("Clé API invalide — vérifie ANTHROPIC_API_KEY dans Vercel");
      } else if(msg.includes("HTTP 5")){
        setErrMsg(`Erreur serveur: ${msg}`);
      } else if(msg.includes("Failed to fetch")||msg.includes("network")){
        setErrMsg("Connexion impossible. Vérifie internet.");
      } else if(msg.includes("JSON")||msg.includes("parse")){
        setErrMsg("Réponse illisible. Rapproche l'étiquette et réessaie.");
      } else {
        setErrMsg(`Erreur: ${msg.slice(0,80)||"inconnue"}`);
      }
      setPhase("error");
      return;
    }
    setPhase("result");
  };

    if(phase==="error"){
    return(
      <div style={{position:"fixed",inset:0,zIndex:600,background:"radial-gradient(ellipse at 50% 30%,#2a0808,#120303)",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px"}}>
        <div style={{fontSize:52,marginBottom:24}}>📷</div>
        <div style={{fontSize:18,fontFamily:"Playfair Display,serif",color:"#FAF8F0",
          textAlign:"center",marginBottom:12,lineHeight:1.4}}>{errMsg||"Scan impossible"}</div>
        <div style={{fontSize:13,color:"rgba(245,245,220,.4)",fontFamily:"Cormorant Garamond,serif",
          textAlign:"center",marginBottom:36}}>Le Sommelier IA n'a pas pu lire cette étiquette.</div>
        <button onClick={()=>setPhase("camera")} style={{background:"rgba(196,165,90,.15)",
          border:"1px solid rgba(196,165,90,.4)",borderRadius:24,padding:"12px 32px",
          color:"#C4A55A",fontSize:14,fontFamily:"Playfair Display,serif",marginBottom:16}}>
          Réessayer
        </button>
        <button onClick={onBack} style={{background:"none",border:"none",
          color:"rgba(245,245,220,.35)",fontSize:13,fontFamily:"Cormorant Garamond,serif"}}>
          Retour
        </button>
      </div>
    );
  }

  if(phase==="result"&&wine){
    const playlist=getPlaylist(wine.vibe, Object.keys(VIBE_RECO[wine.vibe]?.search||{})[0]||"epice");
    return(
      <div style={{position:"fixed",inset:0,zIndex:600,
        background:`radial-gradient(ellipse at 20% 10%,#3d0808,#120303 65%)`,
        overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{padding:"48px 20px 48px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
            <button aria-label="Retour" onClick={onBack} style={{background:"rgba(245,245,220,.07)",border:"1px solid rgba(245,245,220,.12)",
              borderRadius:"50%",width:38,height:38,color:"rgba(245,245,220,.5)",fontSize:16,flexShrink:0}}>←</button>
            <div style={{fontSize:9,color:"#C4A55A",letterSpacing:".28em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif"}}>📷 Analyse de l'étiquette</div>
          </div>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:48,marginBottom:12}}>{wine.emoji||"🍷"}</div>
            <h3 style={{fontSize:22,fontFamily:"Playfair Display,serif",color:"#FAF8F0",
              fontWeight:500,marginBottom:5,lineHeight:1.25}}>{wine.name}</h3>
            <div style={{fontSize:13,color:"rgba(245,245,220,.55)",fontFamily:"Cormorant Garamond,serif"}}>
              {wine.domaine} · {wine.region}
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:18}}>
            <div style={{flex:1,background:"rgba(74,14,14,.7)",border:"1px solid rgba(196,165,90,.3)",
              borderRadius:16,padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:18,color:"#C4A55A",fontWeight:700,marginBottom:2}}>
                {"★".repeat(Math.round(wine.vivinoRating||4))}
              </div>
              <div style={{fontSize:15,color:"#FAF8F0",fontFamily:"Playfair Display,serif",
                fontWeight:600}}>{wine.vivinoRating||"4.1"}/5</div>
              <div style={{fontSize:9,color:"rgba(245,245,220,.4)",letterSpacing:".1em",
                textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>Vivino</div>
            </div>
            <div style={{flex:1,background:"rgba(74,14,14,.7)",border:"1px solid rgba(226,114,91,.3)",
              borderRadius:16,padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:18,color:"#E2725B",fontWeight:700,marginBottom:2}}>{wine.price||"€€"}</div>
              <div style={{fontSize:15,color:"#FAF8F0",fontFamily:"Playfair Display,serif",
                fontWeight:600}}>{wine.priceEst||"~45 €"}</div>
              <div style={{fontSize:9,color:"rgba(245,245,220,.4)",letterSpacing:".1em",
                textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>Prix moyen</div>
            </div>
          </div>
          {wine.story&&(
            <div style={{background:"rgba(0,0,0,.35)",border:"1px solid rgba(245,245,220,.07)",
              borderRadius:18,padding:"18px 20px",marginBottom:16}}>
              <div style={{fontSize:9,color:"rgba(196,165,90,.6)",letterSpacing:".22em",textTransform:"uppercase",
                fontFamily:"Cormorant Garamond,serif",marginBottom:10}}>Le récit du Sommelier</div>
              <p style={{fontSize:14,color:"rgba(245,245,220,.85)",fontFamily:"Cormorant Garamond,serif",
                fontStyle:"italic",lineHeight:1.8,margin:0}}>{wine.story}</p>
            </div>
          )}
          <a href={playlist.url} target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",gap:12,
              background:"rgba(30,215,96,.08)",border:"1px solid rgba(30,215,96,.25)",
              borderRadius:16,padding:"14px 16px",marginBottom:16,textDecoration:"none"}}>
            <div style={{width:36,height:36,borderRadius:10,background:"#1DB954",
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,color:"#FAF8F0",fontFamily:"Playfair Display,serif",marginBottom:2}}>{playlist.name}</div>
              <div style={{fontSize:10,color:"rgba(245,245,220,.45)",fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>{playlist.desc}</div>
            </div>
          </a>
          <button onClick={()=>{onResult(wine);}} style={{
            width:"100%",background:`linear-gradient(135deg,${C.terra},#c45a45)`,
            color:"#FAF8F0",border:"none",padding:"16px",borderRadius:50,
            fontSize:12,letterSpacing:".18em",textTransform:"uppercase",
            fontFamily:"Cormorant Garamond,serif",marginBottom:12,fontWeight:700,
            boxShadow:"0 8px 28px rgba(226,114,91,.35)"}}>
            + Ajouter à ma cave
          </button>
          <button onClick={()=>{setPhase("camera");setWine(null);}} style={{
            width:"100%",background:"rgba(245,245,220,.07)",border:"1px solid rgba(245,245,220,.18)",
            color:"rgba(245,245,220,.65)",padding:"14px",borderRadius:50,fontSize:11,
            letterSpacing:".14em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif"}}>
            ↺ Scanner une autre bouteille
          </button>
        </div>
      </div>
    );
  }

  return(
    <div style={{position:"fixed",inset:0,zIndex:600,background:"#000",
      display:"flex",flexDirection:"column"}}>

      {/* Viewfinder */}
      {!camErr?(
        <video ref={videoRef} autoPlay playsInline muted
          style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
      ):(
        <div style={{position:"absolute",inset:0,background:"#0d0d0d",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
          <div style={{fontSize:44}}>📷</div>
          <div style={{fontSize:14,color:"rgba(245,245,220,.6)",fontFamily:"Cormorant Garamond,serif",
            textAlign:"center",padding:"0 40px",fontStyle:"italic",lineHeight:1.7}}>
            L'accès caméra n'est pas disponible dans cet environnement.
            Déployez l'app sur votre téléphone pour scanner une étiquette.
          </div>
          <button onClick={scan} style={{
            background:`linear-gradient(135deg,${C.terra},#c45a45)`,border:"none",
            borderRadius:50,padding:"14px 32px",color:"#FAF8F0",fontSize:12,
            letterSpacing:".16em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",
            marginTop:8}}>
            Simuler un scan IA →
          </button>
        </div>
      )}

      {/* Cadre de visée */}
      {!camErr&&phase==="camera"&&(
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
          pointerEvents:"none"}}>
          <div style={{width:220,height:320,border:"2px solid #C4A55A",borderRadius:16,
            boxShadow:"0 0 0 2000px rgba(0,0,0,.45)"}}>
            {[[0,0],[0,"auto"],["auto",0],["auto","auto"]].map(([t,b],i)=>(
              <div key={i} style={{position:"absolute",top:t===0?-1:undefined,bottom:b==="auto"?undefined:b===0?-1:undefined,
                left:i%2===0?-1:undefined,right:i%2===1?-1:undefined,
                width:20,height:20,
                borderTop:t===0?"2px solid #C4A55A":undefined,
                borderBottom:b===0?"2px solid #C4A55A":undefined,
                borderLeft:i%2===0?"2px solid #C4A55A":undefined,
                borderRight:i%2===1?"2px solid #C4A55A":undefined}}/>
            ))}
          </div>
          <div style={{position:"absolute",bottom:"38%",fontSize:11,color:"rgba(245,245,220,.55)",
            fontFamily:"Cormorant Garamond,serif",fontStyle:"italic",letterSpacing:".08em"}}>
            Centrez l'étiquette dans le cadre
          </div>
        </div>
      )}

      {/* Loading scan */}
      {phase==="scanning"&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.8)",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}>
          <div style={{position:"relative",width:90,height:90,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{position:"absolute",inset:0,borderRadius:"50%",
              border:"2px solid transparent",borderTopColor:"#C4A55A",
              animation:"spin 1s linear infinite"}}/>
            <div style={{fontSize:32}}>🍷</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:15,color:"#FAF8F0",fontFamily:"Playfair Display,serif",marginBottom:6}}>
              Analyse en cours{".".repeat(dots+1)}
            </div>
            <div style={{fontSize:11,color:"rgba(196,165,90,.6)",fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>
              Le Sommelier IA lit l'étiquette…
            </div>
          </div>
        </div>
      )}

      {/* Contrôles */}
      {phase==="camera"&&(
        <div style={{position:"absolute",bottom:0,left:0,right:0,
          background:"linear-gradient(transparent,rgba(0,0,0,.8))",
          padding:"20px 24px 48px",
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={onBack} style={{background:"rgba(245,245,220,.12)",border:"none",
            borderRadius:50,padding:"10px 20px",color:"#FAF8F0",fontSize:12,
            fontFamily:"Cormorant Garamond,serif",letterSpacing:".1em"}}>Annuler</button>
          <button onClick={scan} style={{
            width:72,height:72,borderRadius:"50%",
            background:`linear-gradient(135deg,${C.terra},#c45a45)`,border:"4px solid rgba(245,245,220,.8)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,
            boxShadow:"0 8px 28px rgba(226,114,91,.5)"}}>
            📷
          </button>
          <div style={{width:72}}/>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DUO FUSION OVERLAY
═══════════════════════════════════════════════════════════════ */
const DuoFusion=({profile,onClose})=>{
  const [friendId,setFriendId]=useState(null);
  const me=PROFILES_SIMPLE[profile?.id]||PROFILES_SIMPLE["aventurier"];
  const result=friendId?findDuo(profile?.id,friendId):null;
  const friend=friendId?PROFILES_SIMPLE[friendId]:null;

  return(
    <div style={{position:"fixed",inset:0,zIndex:700,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.74)"}} onClick={onClose}/>
      <div style={{position:"relative",background:"#160404",border:"1px solid rgba(196,165,90,.2)",
        borderRadius:"28px 28px 0 0",maxHeight:"88vh",overflowY:"auto",
        WebkitOverflowScrolling:"touch",animation:"slideUp .38s ease"}}>
        <div style={{width:34,height:3,background:"rgba(245,245,220,.14)",borderRadius:2,margin:"13px auto 0"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px 0"}}>
          <div>
            <div style={{fontSize:9,color:C.gold,letterSpacing:".25em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif",marginBottom:3}}>La Fusion des Palais</div>
            <h2 style={{fontSize:19,fontFamily:"Playfair Display,serif",color:C.beige,fontWeight:400}}>Déguster à Deux</h2>
          </div>
          <button onClick={onClose} style={{background:"rgba(245,245,220,.07)",
            border:"1px solid rgba(245,245,220,.12)",borderRadius:10,padding:"7px 10px",
            color:C.muted,fontSize:14}}>✕</button>
        </div>

        {!friendId?(
          <div style={{padding:"18px 20px 40px"}}>
            <div style={{background:"rgba(74,14,14,.4)",border:"1px solid rgba(196,165,90,.18)",
              borderRadius:14,padding:"13px",marginBottom:18,display:"flex",alignItems:"center",gap:11}}>
              <div style={{fontSize:24}}>{me.emoji||"🍷"}</div>
              <div>
                <div style={{fontSize:9,color:C.muted,letterSpacing:".16em",textTransform:"uppercase",
                  fontFamily:"Cormorant Garamond,serif",marginBottom:2}}>Votre profil</div>
                <div style={{fontSize:13,fontFamily:"Playfair Display,serif",color:C.beige}}>{me.name}</div>
              </div>
            </div>
            <div style={{fontSize:9,color:C.muted,letterSpacing:".2em",textTransform:"uppercase",
              fontFamily:"Cormorant Garamond,serif",marginBottom:12,textAlign:"center"}}>Profil de votre ami ?</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {Object.entries(PROFILES_SIMPLE).map(([id,p])=>(
                <button key={id} onClick={()=>{haptic(40);setFriendId(id);}} style={{
                  background:"rgba(74,14,14,.22)",border:"1px solid rgba(196,165,90,.1)",
                  borderRadius:14,padding:"13px 15px",
                  display:"flex",alignItems:"center",gap:12,textAlign:"left",transition:"all .2s"}}>
                  <div style={{fontSize:21}}>{p.emoji}</div>
                  <div style={{fontSize:12,fontFamily:"Playfair Display,serif",color:C.beige}}>{p.name}</div>
                </button>
              ))}
            </div>
          </div>
        ):(
          <div style={{padding:"18px 20px 44px",animation:"fadeUp .5s ease"}}>
            {/* Profiles merge visual */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:18}}>
              {[{...me,sub:"Vous"},{emoji:"→",name:""},{...friend,sub:"Ami"},{emoji:"=",name:""},{emoji:result?.emoji,name:"Fusion"}].map((p,i)=>(
                <div key={i} style={{textAlign:"center"}}>
                  <div style={{fontSize:i===2?18:i===4?22:20}}>{p.emoji}</div>
                  {p.sub&&<div style={{fontSize:8,color:C.muted,fontFamily:"Cormorant Garamond,serif",marginTop:3}}>{p.sub}</div>}
                </div>
              ))}
            </div>
            {result&&(
              <div style={{background:result.grad||"rgba(74,14,14,.4)",border:"1px solid rgba(196,165,90,.2)",
                borderRadius:16,padding:"16px",marginBottom:13}}>
                <div style={{fontSize:9,color:"rgba(245,245,220,.35)",letterSpacing:".2em",textTransform:"uppercase",
                  fontFamily:"Cormorant Garamond,serif",marginBottom:5}}>Votre vin de compromis</div>
                <h3 style={{fontSize:17,fontFamily:"Playfair Display,serif",color:C.beige,fontWeight:400,marginBottom:3}}>{result.wine}</h3>
                <div style={{fontSize:10,color:"rgba(245,245,220,.35)",fontFamily:"Cormorant Garamond,serif",
                  marginBottom:10,letterSpacing:".07em"}}>{result.region}</div>
                <p style={{color:"rgba(245,245,220,.68)",fontSize:12,lineHeight:1.72,
                  fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>"{result.why}"</p>
              </div>
            )}
            <div style={{display:"flex",gap:9}}>
              <button onClick={()=>setFriendId(null)} style={{flex:1,
                background:"rgba(245,245,220,.06)",color:C.muted,border:`1px solid rgba(245,245,220,.1)`,
                padding:"12px",borderRadius:50,fontSize:10,letterSpacing:".12em",textTransform:"uppercase",
                fontFamily:"Cormorant Garamond,serif"}}>Changer</button>
              <button onClick={onClose} style={{flex:2,
                background:`linear-gradient(135deg,${C.terra},#c45a45)`,color:C.beige,border:"none",
                padding:"12px",borderRadius:50,fontSize:10,letterSpacing:".12em",textTransform:"uppercase",
                fontFamily:"Cormorant Garamond,serif"}}>Parfait, on prend ça</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ROOT — APP STATE MACHINE
═══════════════════════════════════════════════════════════════ */
export default function UnwinedApp() {
  // Chargement intelligent depuis localStorage
  const [profile,  setProfile] = useState(()=>{ try{ const p=localStorage.getItem("unwined_profile"); return p?JSON.parse(p):null; }catch(e){return null;} });
  const [caveIds,  setCaveIds] = useState(()=>{ try{ const c=localStorage.getItem("unwined_caveIds"); return c?JSON.parse(c):[]; }catch(e){return [];} });
  const [caveExt,  setCaveExt] = useState(()=>{ try{ const c=localStorage.getItem("unwined_caveExt"); return c?JSON.parse(c):{};  }catch(e){return {};} });
  const [feedback, setFeedback]= useState(()=>{ try{ const f=localStorage.getItem("unwined_feedback"); return f?JSON.parse(f):[];  }catch(e){return [];} });
  const [screen,   setScreen]  = useState(()=>{ try{ return localStorage.getItem("unwined_profile")?"main":"onboarding"; }catch(e){return "onboarding";} });
  const [isGuest,  setIsGuest] = useState(false);
  const [quizAns,  setQuizAns] = useState(null);
  const [selWine,  setSelWine] = useState(null);
  const [duoOpen,  setDuoOpen] = useState(false);

  // Sauvegarde automatique
  const {useEffect}=React;
  useEffect(()=>{ try{ if(profile) localStorage.setItem("unwined_profile",JSON.stringify(profile)); }catch(e){} },[profile]);
  useEffect(()=>{ try{ localStorage.setItem("unwined_caveIds",JSON.stringify(caveIds)); }catch(e){} },[caveIds]);
  useEffect(()=>{ try{ localStorage.setItem("unwined_caveExt",JSON.stringify(caveExt)); }catch(e){} },[caveExt]);
  useEffect(()=>{ try{ localStorage.setItem("unwined_feedback",JSON.stringify(feedback)); }catch(e){} },[feedback]);

  // Build full cave objects
  const cave = WINE_DB
    .filter(w=>caveIds.includes(w.id))
    .map(w=>({...w,...(caveExt[w.id]||{})}));

  const addCave   = w  => { if(!caveIds.includes(w.id)) setCaveIds(p=>[...p,w.id]); };
  const updateNote= (id,note)    => setCaveExt(p=>({...p,[id]:{...(p[id]||{}),note}}));
  const markOpened= id           => setCaveExt(p=>({...p,[id]:{...(p[id]||{}),openedAt:new Date().toLocaleDateString("fr-FR")}}));
  const saveFb    = (wid,rating,note) => { setFeedback(p=>[...p.filter(f=>f.wineId!==wid),{wineId:wid,rating:Number(rating),note:note||""}]); if(note) updateNote(wid,note); };

  const openWine  = w => {
    // Merge cave ext data
    const ext=caveExt[w.id]||{};
    setSelWine({...w,...ext});
    setScreen("wine-detail");
  };

  return(
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:C.dark,
      fontFamily:"Cormorant Garamond,Georgia,serif",position:"relative"}}>

      {/* Global styles — injected once */}
      <style dangerouslySetInnerHTML={{__html:GLOBAL_CSS}}/>
      <Grain/>

      {screen==="onboarding" && (
        <Onboarding onDone={()=>setScreen("quiz")}/>
      )}

      {screen==="quiz" && (
        <Quiz onComplete={ans=>{setQuizAns(ans);setScreen("quiz-result");}}/>
      )}

      {screen==="quiz-result" && quizAns && (
        <QuizResult
          profile={calcProfile(quizAns)}
          answers={quizAns}
          onContinue={p=>{setProfile(p);setScreen("signup");}}
        />
      )}

      {screen==="signup" && profile && (
        <CreateAccount
          profile={profile}
          onDone={()=>setScreen("main")}
          onGuest={()=>{setIsGuest(true);setScreen("main");}}
        />
      )}

      {screen==="main" && (
        <Dashboard
          profile={profile}
          cave={cave}
          onAddCave={addCave}
          feedback={feedback}
          onOpenWine={openWine}
          onOpenDuo={()=>setDuoOpen(true)}
          isGuest={isGuest}
          onCreateAccount={()=>setScreen("signup")}
        />
      )}

      {screen==="wine-detail" && selWine && (
        <WineDetail
          wine={selWine}
          profile={profile}
          feedback={feedback}
          cave={cave}
          onAddCave={addCave}
          onFeedback={saveFb}
          onBack={()=>setScreen("main")}
          onMarkOpened={markOpened}
          onUpdateNote={updateNote}
        />
      )}

      {duoOpen && profile && (
        <DuoFusion profile={profile} onClose={()=>setDuoOpen(false)}/>
      )}
    </div>
  );
}
