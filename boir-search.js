// api/boir-search.js — Vercel serverless

export default async function handler(req, res) {
  // 1. Tuer absolument TOUS les caches (Vercel, Navigateur, Edge)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: "Query trop courte", results: [] });
  }

  try {
    const searchTerm = q.toLowerCase().trim();
    
    // On demande 20 résultats à Shopify, en ajoutant un timestamp (?_t=...) 
    // pour être sûr que Shopify ne nous donne pas une vieille réponse en cache
    const url = `https://boir.be/search/suggest.json?q=${encodeURIComponent(searchTerm)}&resources[type]=product&resources[limit]=100&_t=${Date.now()}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; UnwineD/2.0)",
        "Accept": "application/json",
      },
      cache: "no-store" // Force le serveur à refaire la requête
    });

    if (!response.ok) {
      throw new Error(`boir.be HTTP ${response.status}`);
    }

    const data = await response.json();
    const products = data?.resources?.results?.products || [];

    // 2. FILTRE INTRAITABLE : On supprime les Sancerre, Rully, etc.
    const filteredProducts = products.filter(p => {
      // On regroupe tout le texte du produit
      const text = `${p.title} ${p.vendor} ${p.product_type}`.toLowerCase();
      // Si le mot "bordeaux" n'est pas dans le texte, on le jette !
      return text.includes(searchTerm);
    });

    // 3. Normaliser les résultats
    const results = filteredProducts.map(p => {
      let formattedPrice = null;
      if (p.price) {
        const priceNum = String(p.price).includes('.') ? parseFloat(p.price) : parseInt(p.price) / 100;
        formattedPrice = `${priceNum.toFixed(2)}€`;
      }

      return {
        title:      p.title || "",
        handle:     p.handle || "",
        url:        p.url ? `https://boir.be${p.url}` : `https://boir.be/fr/products/${p.handle}`,
        price:      formattedPrice,
        image:      p.featured_image?.url || p.image || null,
        type:       p.product_type || "",
        vendor:     p.vendor || "",
        available:  p.available !== false,
      };
    });

    // On renvoie les résultats filtrés
    return res.status(200).json({ q, results });

  } catch (err) {
    console.error("boir-search error:", err.message);
    return res.status(200).json({ q, results: [], error: err.message });
  }
}
