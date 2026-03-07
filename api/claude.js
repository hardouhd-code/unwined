export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // Ta clé API Google (à ajouter dans les variables Vercel sous GEMINI_API_KEY)
  const apiKey = process.env.GEMINI_API_KEY; 
  const { image, vibe, styleId, budget } = req.body;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `Tu es le Sommelier d'Unwine-d. Analyse ce vin pour une vibe ${vibe}. Réponds UNIQUEMENT en JSON strict.` },
            { inline_data: { mime_type: "image/jpeg", data: image } }
          ]
        }],
        generationConfig: { response_mime_type: "application/json" } // Force le JSON
      })
    });

    const data = await response.json();
    // Gemini renvoie le texte dans candidates[0].content.parts[0].text
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
