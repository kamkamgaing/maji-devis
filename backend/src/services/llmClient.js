const HF_TOKEN = process.env.HF_TOKEN;
const MODEL = "mistralai/Mistral-7B-Instruct-v0.3";
const API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;

const TIMEOUT_MS = 25000;

function buildPrompt(composant, historique, prixFournisseurs, prixPropose) {
  const histStr = historique.length
    ? historique.map((h) => `${h.toFixed(2)} EUR`).join(", ")
    : "Aucun historique disponible";

  const fournStr = Object.entries(prixFournisseurs)
    .map(([nom, prix]) => `- ${nom}: ${prix} EUR`)
    .join("\n");

  return `<s>[INST] Tu es un expert en pricing industriel pour le groupe Maji (Manufacture the Future).

Analyse le prix proposé pour ce composant et détecte les anomalies.

COMPOSANT : ${composant.nom} (réf: ${composant.ref})
CATÉGORIE : ${composant.categorie}

HISTORIQUE DES PRIX (6 derniers mois) : ${histStr}

PRIX FOURNISSEURS ACTUELS :
${fournStr}

PRIX PROPOSÉ PAR LE DEVISEUR : ${prixPropose.toFixed(2)} EUR

Analyse ce prix et réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après :
{
  "prix_recommande": number,
  "fournisseur_recommande": "string",
  "confiance": number entre 0 et 1,
  "anomalie": "ok" ou "attention" ou "critique",
  "justification": "string en français"
} [/INST]`;
}

async function callLLM(prompt) {
  if (!HF_TOKEN) {
    throw new Error("HF_TOKEN non configuré");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.1,
          return_full_text: false,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`HuggingFace API ${res.status}: ${errBody}`);
    }

    const data = await res.json();

    const rawText = Array.isArray(data)
      ? data[0]?.generated_text || ""
      : data.generated_text || "";

    return rawText;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

function parseResponse(rawText) {
  const jsonMatch = rawText.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    throw new Error("Aucun JSON trouvé dans la réponse LLM");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    prix_recommande: typeof parsed.prix_recommande === "number" ? parsed.prix_recommande : null,
    fournisseur_recommande: parsed.fournisseur_recommande || null,
    confiance: Math.max(0, Math.min(1, parseFloat(parsed.confiance) || 0.5)),
    anomalie: ["ok", "attention", "critique"].includes(parsed.anomalie) ? parsed.anomalie : "attention",
    justification: parsed.justification || "Analyse non disponible",
  };
}

async function analyserPrix(composant, historique, prixFournisseurs, prixPropose) {
  const prompt = buildPrompt(composant, historique, prixFournisseurs, prixPropose);

  console.log(`[LLM] Appel HuggingFace pour ${composant.nom} (prix: ${prixPropose})`);
  const startTime = Date.now();

  const rawText = await callLLM(prompt);
  const elapsed = Date.now() - startTime;
  console.log(`[LLM] Réponse en ${elapsed}ms`);

  const result = parseResponse(rawText);

  return {
    ...result,
    prompt,
    raw_response: rawText,
    model: MODEL,
    response_time_ms: elapsed,
  };
}

module.exports = { analyserPrix, buildPrompt, callLLM, parseResponse };
