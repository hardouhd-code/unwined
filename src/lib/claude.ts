export async function callClaude(messages, maxTokens=600) {
  const r = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: maxTokens, messages })
  });
  const contentType = r.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Serveur API hors-ligne (Veuillez lancer l'application avec 'npx vercel dev' au lieu de npm run dev).");
  }
  const d = await r.json();
  if(!r.ok) throw new Error(d.error?.message || "HTTP " + r.status);
  return d.content.map(b => b.text||"").join("").replace(/```json|```/g,"").trim();
}

export function safeJson(txt, fallback={}) {
  if(!txt) return fallback;
  try { return JSON.parse(txt.trim()); } catch { /* ignore */ }
  const arrMatch = txt.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if(arrMatch) { try { return JSON.parse(arrMatch[0]); } catch { /* ignore */ } }
  const objMatch = txt.match(/\{[\s\S]*\}/);
  if(objMatch) { try { return JSON.parse(objMatch[0]); } catch { /* ignore */ } }
  const start = txt.search(/[[{]/);
  if(start >= 0) { try { return JSON.parse(txt.slice(start)); } catch { /* ignore */ } }
  return fallback;
}

export async function lookupWineOnline(wine) {
  const q = [wine.producer, wine.name, wine.region, wine.country, wine.year].filter(Boolean).join(" ");
  const txt = await callClaude([{role:"user", content:"Tu es expert vin. Infos sur : \""+q+"\". JSON uniquement sans markdown : {description,grapes,serving,price_range,peak,score,search_query}"}], 500);
  return safeJson(txt, {});
}

export async function askSommelier(history, inventory, userName) {
  const systemPrompt = `Tu es le "Sommelier Unwine-D", un assistant expert en vin, amical, élégant et concis. 
L'utilisateur s'appelle ${userName || "l'utilisateur"}.
Voici l'inventaire actuel de sa cave (au format JSON) :
${JSON.stringify(inventory)}

RÈGLES IMPORTANTES :
1. Sois très concis et chaleureux.
2. Si l'utilisateur demande quel vin boire (ex: avec un plat), CHERCHE TOUJOURS d'abord dans son inventaire fourni ci-dessus. Recommande 1 ou 2 vins spécifiques de SA cave s'ils correspondent. 
3. S'il n'a rien de pertinent en cave, suggère un type de vin ou une appellation de manière générale.
4. N'invente pas de vins dans sa cave.
5. Ne montre pas le JSON à l'utilisateur.`;

  const messages = [
    { role: "user", content: systemPrompt },
    { role: "assistant", content: "Entendu, je serai un sommelier concis et je me baserai en priorité sur votre cave." },
    ...history
  ];

  return await callClaude(messages, 800);
}

