/**
 * UNWINE-D — /api/vivino
 * Proxy direct vers l'API publique non-officielle de Vivino.
 * Endpoint : https://www.vivino.com/api/explore
 * Aucune clé API requise. Résultats en ~1-2s.
 *
 * POST { query: "malbec argentin", country: "FR", minRating: 3.5, limit: 5 }
 * → { wines: [...] }
 */

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const {
    query = "",
    country = "FR",
    minRating = 3.5,
    minRatings = 50,
    limit = 6,
  } = req.body || {};

  if (!query.trim())
    return res.status(400).json({ error: "query requis" });

  try {
    const params = new URLSearchParams({
      country_code:                country,
      order_by:                    "ratings_average",
      order:                       "desc",
      page:                        1,
      per_page:                    limit,
      min_price:                   0,
      max_price:                   9999,
      minimum_ratings:             minRatings,
      ratings_average_range_min:   minRating,
      q:                           query,
    });

    const url = `https://www.vivino.com/api/explore?${params}`;

    const response = await fetch(url, {
      headers: {
        "Accept":           "application/json, text/javascript, */*; q=0.01",
        "Accept-Language":  "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "User-Agent":       "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Referer":          "https://www.vivino.com/",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    if (!response.ok) {
      return res.status(502).json({
        error: `Vivino HTTP ${response.status}`,
        fallback: true,
      });
    }

    const data = await response.json();

    // Structure Vivino : data.explore_vintage.matches[]
    const matches = data?.explore_vintage?.matches || [];

    const wines = matches.map(m => {
      const vintage  = m.vintage         || {};
      const wine     = vintage.wine       || {};
      const winery   = wine.winery        || {};
      const region   = wine.region        || {};
      const country_ = region.country     || {};
      const price    = m.price            || {};
      const stats    = vintage.statistics || {};

      const priceVal = price.amount;
      return {
        name:          wine.name         || "",
        producer:      winery.name       || "",
        type:          normalizeType(wine.type_id),
        region:        region.name       || "",
        country:       country_.name     || "",
        year:          vintage.year      || null,
        rating:        stats.ratings_average ? parseFloat(stats.ratings_average).toFixed(1) : null,
        ratings_count: stats.ratings_count || null,
        price:         priceVal || null,
        price_range:   priceVal ? formatPrice(priceVal, price.currency) : null,
        grapes:        (wine.grapes || []).map(g => g.name).join(", "),
        description:   wine.seo_description || wine.description || "",
        image:         buildImageUrl(vintage.image || wine.image),
        vivino_url:    buildVivinoUrl(wine, vintage),
        wine_id:       wine.id || null,
      };
    });

    return res.status(200).json({ wines, total: matches.length });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Erreur inconnue" });
  }
};

// Vivino type_id : 1=rouge, 2=blanc, 3=mousseux, 4=rosé, 7=dessert, 24=fortifié
function normalizeType(typeId) {
  const map = {1:"rouge",2:"blanc",3:"mousseux",4:"rose",7:"dessert",24:"fortifie"};
  return map[typeId] || "autre";
}

function formatPrice(amount, currency = "EUR") {
  const n = parseFloat(amount);
  if (isNaN(n)) return null;
  const sym = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency;
  return `${n.toFixed(2)} ${sym}`;
}

function buildImageUrl(img) {
  if (!img) return null;
  if (img.location) {
    const loc = img.location.replace("{image_version}", "pb_x300");
    return loc.startsWith("//") ? "https:" + loc : loc;
  }
  return null;
}

function buildVivinoUrl(wine, vintage) {
  if (wine.seo_name) {
    const yr = vintage?.year ? `/w/${wine.id}?year=${vintage.year}` : "";
    return `https://www.vivino.com/${wine.seo_name}${yr}`;
  }
  const q = [wine.name, vintage?.year].filter(Boolean).join(" ");
  return `https://www.vivino.com/search/wines?q=${encodeURIComponent(q)}`;
}
