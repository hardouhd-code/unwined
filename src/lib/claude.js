export async function callClaude(messages, maxTokens=600) {
  const r = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: maxTokens, messages })
  });
  const d = await r.json();
  if(!r.ok) throw new Error(d.error?.message || "HTTP " + r.status);
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
  if(start >= 0) { try { return JSON.parse(txt.slice(start)); } catch {} }
  return fallback;
}

export async function lookupWineOnline(wine) {
  const q = [wine.producer, wine.name, wine.region, wine.country, wine.year].filter(Boolean).join(" ");
  const txt = await callClaude([{role:"user", content:"Tu es expert vin. Infos sur : \""+q+"\". JSON uniquement sans markdown : {description,grapes,serving,price_range,peak,score,search_query}"}], 500);
  return safeJson(txt, {});
}

