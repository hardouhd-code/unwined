// api/boir-search.js — Vercel serverless
// Proxy vers l'API Shopify publique de boir.be (pas de clé requise)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: "Query trop courte", results: [] });
  }

  try {
    // Endpoint Shopify public — pas de clé, pas de auth
    const url = `https://boir.be/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=5&resources[fields]=title,handle,price,image,product_type,vendor`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; UnwineD/1.0)",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`boir.be HTTP ${response.status}`);
    }

    const data = await response.json();
    const products = data?.resources?.results?.products || [];

    // Normaliser les résultats
    const results = products.map(p => ({
      title:      p.title || "",
      handle:     p.handle || "",
      url:        `https://boir.be/fr/products/${p.handle}`,
      price:      p.price ? `${(parseInt(p.price) / 100).toFixed(2)}€` : null,
      image:      p.featured_image?.url || null,
      type:       p.product_type || "",
      vendor:     p.vendor || "",
      available:  p.available !== false,
    }));

    return res.status(200).json({ q, results });

  } catch (err) {
    console.error("boir-search error:", err.message);
    // On retourne un tableau vide proprement — l'app continue sans crash
    return res.status(200).json({ q, results: [], error: err.message });
  }
}
