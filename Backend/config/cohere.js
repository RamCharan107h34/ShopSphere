// Cohere API helpers (v2 REST API via fetch - no SDK needed)
//
// Required env var:
//   COHERE_API_KEY=your_trial_or_production_key
//
// Optional env vars (sensible defaults below):
//   COHERE_CHAT_MODEL=command-r-plus-08-2024
//   COHERE_RERANK_MODEL=rerank-v3.5

const COHERE_API_URL = "https://api.cohere.com/v2";

const CHAT_MODEL = process.env.COHERE_CHAT_MODEL || "command-r-plus-08-2024";
const RERANK_MODEL = process.env.COHERE_RERANK_MODEL || "rerank-v3.5";

// Small wrapper around fetch: adds auth headers and turns HTTP errors into readable Errors
const callCohere = async (endpoint, body) => {
    const response = await fetch(`${COHERE_API_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.COHERE_API_KEY}`
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
        const reason = data?.message || data?.error?.message || JSON.stringify(data);
        throw new Error(`Cohere API error (${response.status}): ${reason}`);
    }

    return data;
};

// Feature 1 - Product description generator
// Takes product attributes, asks the model for JSON, returns { description, sellingPoints }
export const generateProductDescription = async (attributes) => {
    const {
        title,
        category,
        brand,
        price,
        targetAudience,
        material,
        keywords
    } = attributes;

    const prompt = `
You are a product copywriter for ShopSphere, an e-commerce marketplace.

Write a compelling product listing based ONLY on these details:
- Product title: ${title || "Not provided"}
- Category: ${category || "Not provided"}
- Brand: ${brand || "Not provided"}
- Price: ${price || "Not provided"}
- Target audience: ${targetAudience || "General shoppers"}
- Material/features: ${material || "Not provided"}
- Extra keywords: ${keywords ? keywords.join(", ") : "Not provided"}

Return ONLY valid JSON with exactly this shape (no extra text, no markdown):
{
  "description": "2-3 persuasive, honest sentences a customer would read on a product page",
  "sellingPoints": ["up to 5 short key selling points / benefits, each under 12 words"]
}
`;

    const data = await callCohere("/chat", {
        model: CHAT_MODEL,
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: "json_object" }
    });

    // Extract the model's text reply (v2 shape: message.content[0].text)
    let rawText = "";
    if (Array.isArray(data.message?.content)) {
        rawText = data.message.content.map((block) => block.text || "").join("");
    } else if (typeof data.text === "string") {
        rawText = data.text; // v1 fallback shape
    }

    if (!rawText) {
        throw new Error("Cohere returned an empty response");
    }

    // Cohere's JSON mode should return clean JSON, but strip any fences just in case
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
        description: parsed.description || "",
        sellingPoints: Array.isArray(parsed.sellingPoints) ? parsed.sellingPoints : []
    };
};

// Feature 2 - Semantic search
// Takes a natural-language query + candidate product documents, returns them ranked by relevance
export const rankProductsByRelevance = async (query, documents, topN = 10) => {
    const data = await callCohere("/rerank", {
        model: RERANK_MODEL,
        query,
        documents,
        top_n: topN
    });

    // results: [{ index, relevance_score }] where index maps back to the documents array
    return data.results || [];
};
