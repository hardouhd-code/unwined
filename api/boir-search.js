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
    // 1. On augmente la limite à 15 et on cache les produits en rupture de stock
    const limit = 15;
    const url = `https://boir.be/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=${limit}&resources[options][unavailable_products]=hide`;

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

    // 2. Filtre de pertinence STRICT
    // On s'assure que ce que l'utilisateur cherche est vraiment dans le titre, le vendeur ou le type.
    // Ça évite à Shopify de nous renvoyer un Sancerre parce qu'il a un tag caché lié à Bordeaux.
    const searchTerms = q.toLowerCase().trim().split(" ");
    
    const filteredProducts = products.filter(p => {
      // On regroupe les infos visibles du produit
      const textToSearch = `${p.title} ${p.vendor} ${p.product_type}`.toLowerCase();
      // On vérifie que TOUS les mots cherchés sont bien présents dans le texte du produit
      return searchTerms.every(term => textToSearch.includes(term));
    });

    // 3. Normaliser les résultats
    const results = filteredProducts.map(p => {
      // Gestion sécurisée du prix (si Shopify renvoie une string ou un entier)
      let formattedPrice = null;
      if (p.price) {
        // Si le prix n'a pas de point/virgule, c'est souvent en centimes sur Shopify
        const priceNum = String(p.price).includes('.') ? parseFloat(p.price) : parseInt(p.price) / 100;
        formattedPrice = `${priceNum.toFixed(2)}€`;
      }

      return {
        title:      p.title || "",
        handle:     p.handle || "",
        // L'URL Shopify
        url:        p.url ? `https://boir.be${p.url}` : `https://boir.be/fr/products/${p.handle}`,
        price:      formattedPrice,
        image:      p.featured_image?.url || p.image || null,
        type:       p.product_type || "",
        vendor:     p.vendor || "",
        available:  p.available !== false,
      };
    });

    return res.status(200).json({ q, results });

  } catch (err) {
    console.error("boir-search error:", err.message);
    // On retourne un tableau vide proprement — l'app continue sans crash
    return res.status(200).json({ q, results: [], error: err.message });
  }
}
