import exp from "express";

import { ProductModel } from "../models/ProductModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";
import {
    generateProductDescription,
    rankProductsByRelevance
} from "../config/cohere.js";

export const aiApp = exp.Router();

// 1. AI Product Description Generator (Seller only)
// Seller sends product attributes -> AI returns a ready description + key selling points
aiApp.post("/generate-description", verifyToken, verifyRole("seller"), async (req, res) => {
    const { title, category, brand, price, targetAudience, material, keywords } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({
            message: "Product title is required to generate a description"
        });
    }

    if (!process.env.COHERE_API_KEY) {
        return res.status(503).json({
            message: "COHERE_API_KEY is not configured on the server"
        });
    }

    try {
        const result = await generateProductDescription({
            title,
            category,
            brand,
            price,
            targetAudience,
            material,
            keywords: Array.isArray(keywords) ? keywords : []
        });

        res.status(200).json({
            message: "Product description generated successfully",
            payload: result // { description, sellingPoints }
        });
    } catch (error) {
        console.error("AI description generation failed:", error.message);
        res.status(502).json({
            message: "AI generation failed",
            error: error.message
        });
    }
});

// 2. AI Semantic Product Search (Public - works for customers & guests)
// Customer types a natural-language query -> AI ranks the most relevant products
aiApp.post("/search", async (req, res) => {
    const { query, limit = 10 } = req.body;

    if (!query || !query.trim()) {
        return res.status(400).json({
            message: "Search query is required"
        });
    }

    const topN = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 25);

    // Step 1: cheap keyword prefilter (0 AI calls) to build a small candidate pool
    const tokens = query.trim().split(/\s+/).filter((token) => token.length > 2);

    let filter = { status: "active" };
    if (tokens.length > 0) {
        const regex = tokens.join("|");
        filter.$or = [
            { title: { $regex: regex, $options: "i" } },
            { description: { $regex: regex, $options: "i" } },
            { brand: { $regex: regex, $options: "i" } }
        ];
    }

    let candidates = await ProductModel.find(filter).limit(40).lean();

    // No keyword hits? Widen the pool with recent products so the AI can
    // still find matches by meaning (e.g. "comfy running shoes" -> "athletic sneakers")
    if (candidates.length === 0) {
        candidates = await ProductModel.find({ status: "active" })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();
    }

    // Step 2: semantic ranking via Cohere Rerank (1 AI call)
    if (process.env.COHERE_API_KEY) {
        try {
            const documents = candidates.map((product) =>
                `${product.title}. ${product.brand}. ${(product.description || "").slice(0, 800)}`
            );

            const results = await rankProductsByRelevance(query.trim(), documents, topN);

            // Keep only meaningfully relevant matches, drop noise near 0.0.
            // Note: Cohere rerank-v3.5 returns absolute scores that sit low
            // even for exact matches (e.g. "phone" -> smartphone ~0.13), so
            // the floor must be modest or the AI mode silently degrades to
            // keyword mode for most queries. Default 0.05 keeps real matches
            // (usually 0.1+) while dropping unrelated noise (~0.02-0.04).
            const floor = Number(process.env.COHERE_RELEVANCE_FLOOR) || 0.05;
            const ranked = results
                .filter((result) => result.relevance_score >= floor)
                .slice(0, topN);

            const productIds = ranked.map((result) => candidates[result.index]._id);
            const products = await ProductModel.find({ _id: { $in: productIds } })
                .populate("category", "name slug")
                .populate("storeId", "storeName logo")
                .lean();

            const productById = Object.fromEntries(
                products.map((product) => [product._id.toString(), product])
            );

            const orderedProducts = ranked
                .map((result, position) => {
                    const product = productById[candidates[result.index]._id.toString()];
                    if (!product) return null;
                    return { ...product, relevanceScore: result.relevance_score, rank: position + 1 };
                })
                .filter(Boolean);

            // Semantic ranking succeeded and found matches — return them.
            if (orderedProducts.length > 0) {
                return res.status(200).json({
                    message: `Found ${orderedProducts.length} relevant products`,
                    payload: {
                        mode: "semantic",
                        query: query.trim(),
                        products: orderedProducts
                    }
                });
            }

            // The rerank dropped every candidate below the relevance floor
            // (common for short queries like "phone"). If the cheap keyword
            // prefilter DID find real string matches, fall back to those
            // instead of returning "0 results" for something we can see.
            console.log(
                `AI search: rerank returned no results above threshold for "${query}", falling back to ${candidates.length} keyword matches`
            );
        } catch (error) {
            // Fall through to keyword results so search never breaks during a demo
            console.error("Semantic search failed, using keyword fallback:", error.message);
        }
    }

    // Step 3 (fallback): keyword results. When the rerank ran but produced
    // no results above the floor, re-order the keyword pool by the rerank's
    // scores (they are still a meaningful relevance signal, just below floor).
    const scoreById = new Map(
        (results || []).map((result) => [candidates[result.index]?._id?.toString(), result.relevance_score])
    );
    const products = [...candidates]
        .sort((a, b) => (scoreById.get(b._id.toString()) ?? -1) - (scoreById.get(a._id.toString()) ?? -1))
        .slice(0, topN);
    const populated = await ProductModel.find({ _id: { $in: products.map((p) => p._id) } })
        .populate("category", "name slug")
        .populate("storeId", "storeName logo")
        .lean();

    const productById = Object.fromEntries(
        populated.map((product) => [product._id.toString(), product])
    );

    res.status(200).json({
        message: "Keyword results (AI search not configured or unavailable)",
        payload: {
            mode: "keyword",
            query: query.trim(),
            products: products
                .map((product) => productById[product._id.toString()])
                .filter(Boolean)
        }
    });
});
