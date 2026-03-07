export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY manquante" });

  const { image } = req.body;
  if (!image) return res.status(400).json({ error: "Image manquante" });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Tu es un expert en vins. Analyse cette étiquette de bouteille et réponds UNIQUEMENT en JSON strict :
{"name":"Nom complet du vin","domaine":"Producteur","grape":"Cépage(s)","region":"Région, Pays","year":2020,"vivinoRating":4.1,"priceEst":"35 €","aeration":30,"pH":3.85,"tannins":7,"glycerol":7,"malo":true,"story":"2-3 phrases poétiques","emoji":"🍷","vibe":"cocon"}
vibe = cocon|orage|secret|heure-bleue|evasion|patrimoine|impro|revolte
Si illisible: {"error":"illisible"}` },
              { inline_data: { mime_type: "image/jpeg", data: image } }
            ]
          }],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.3
          }
        })
      }
    );

    const data = await response.json();

    // Gestion quota et erreurs Gemini
    if (data.error) {
      const code = data.error.code;
      return res.status(code === 429 ? 429 : 500).json({ error: data.error.message });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) return res.status(500).json({ error: "Réponse vide de Gemini" });

    res.status(200).json(JSON.parse(aiText));
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: error.message });
  }
}
