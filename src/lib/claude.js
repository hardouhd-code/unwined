// Claude API helpers

export async function callClaude(messages, maxTokens=600) {
  const r = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: maxTokens, messages })
  });
  const d = await r.json();
  if(!r.ok) throw new Error(d.error?.message || `HTTP ${r.status}`);
  return d.content.map(b => b.text||"").join("").replace(/```json|```/g,"").trim();
}

export function safeJson(txt, fallback={}) {
  if(!txt) return fallback;
  try { return JSON.parse(txt.trim()); } catch {}
  const arrMatch = txt.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if(arrMatch) { try { return JSON.parse(arrMatch[0]); } catch {} }
  const objMatch = txt.match(/\{[\s\S]*\}/);
  if(objMatch) { try { return JSON.parse(objMatch[0]); } catch {} }
  const start = txt.search(/[\[{]/);
  if(start >= 0) {
    try { return JSON.parse(txt.slice(start)); } catch {}
    try { return JSON.parse(txt.slice(start).replace(/[\x00-\x1F\x7F-\x9F]/g," ")); } catch {}
  }
  return fallback;
}

export async function lookupWineOnline(wine) {
  const q = [wine.producer, wine.name, wine.region, wine.country, wine.year].filter(Boolean).join(" ");
  const txt = await callClaude([{role:"user", content:`Tu es expert vin. Infos précises sur : "${q}". Réponds UNIQUEMENT en JSON sans markdown :
{"description":"2-3 phrases style/arômes/structure","grapes":"cépages","serving":"température et accord mets","price_range":"fourchette prix ex: 15-25€","peak":"fenêtre dégustation","score":"note critique si connue","search_query":"termes de recherche Wine-Searcher"}`}], 500);
  return safeJson(txt, {});
}

export async function searchWines(query, db) {
  const liked = db.filter(w=>w.tasted&&w.rating>=3).map(w=>`${w.type} ${w.region}`).join(", ");
  const txt = await callClaude([{role:"user", content:`Tu es sommelier expert. Recherche : "${query}". ${liked?`Goûts utilisateur : ${liked}.`:""}
Propose 4 vins. UNIQUEMENT JSON sans markdown :
[{"name":"","producer":"","type":"rouge|blanc|rose|mousseux|autre","country":"","region":"","year":2020,"why":"2 phrases poétiques","grapes":"","price_range":""}]`}], 800);
  return safeJson(txt, []);
}
