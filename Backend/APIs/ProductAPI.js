import exp from "express";

import { ProductModel } from "../models/ProductModel.js";
import { StoreModel } from "../models/StoreModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";
import { upload } from "../config/upload.js";
import { uploadToCloudinary } from "../config/cloudinaryUpload.js";
import {
    MaxHeap,
    mergeSort,
    binarySearch,
    countLessThan,
    buildIdMap
} from "../utils/dsa.js";

export const productApp = exp.Router();

// 1. Get All Products with Search, Filter, Sort & Pagination (Public)
productApp.get("/products", async (req, res) => {
    const {
        search,
        category,
        store,
        minPrice,
        maxPrice,
        inStock,
        sort,
        page = 1,
        limit = 12
    } = req.query;

    const filter = { status: "active" };

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { brand: { $regex: search, $options: "i" } }
        ];
    }

    if (category) filter.category = category;
    if (store) filter.storeId = store;

    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (inStock === "true") {
        filter.stock = { $gt: 0 };
    }

    let sortOptions = { createdAt: -1 };
    if (sort === "price_asc") sortOptions = { price: 1 };
    if (sort === "price_desc") sortOptions = { price: -1 };
    if (sort === "rating") sortOptions = { rating: -1 };
    if (sort === "popular") sortOptions = { reviewsCount: -1 };

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const skip = (pageNumber - 1) * pageSize;

    const totalCount = await ProductModel.countDocuments(filter);
    const products = await ProductModel.find(filter)
        .populate("category", "name slug")
        .populate("storeId", "storeName logo")
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize);

    res.status(200).json({
        message: "Products list",
        payload: {
            products,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: pageNumber
        }
    });
});

// 2. Get Seller Low Stock Products (Seller only - Place before /:id)
productApp.get("/seller/low-stock", verifyToken, verifyRole("seller"), async (req, res) => {
    const lowStockProducts = await ProductModel.find({
        sellerId: req.user.id,
        $expr: { $lte: ["$stock", "$lowStockThreshold"] }
    }).populate("category", "name slug");

    res.status(200).json({
        message: "Low stock products list",
        payload: lowStockProducts
    });
});

// 3. Get Current Seller's Products (Seller only)
productApp.get("/seller/my-products", verifyToken, verifyRole("seller"), async (req, res) => {
    const products = await ProductModel.find({ sellerId: req.user.id })
        .populate("category", "name slug")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "Seller products list",
        payload: products
    });
});

// 4. Get Product By ID (Public)
productApp.get("/products/:id", async (req, res) => {
    const product = await ProductModel.findById(req.params.id)
        .populate("category", "name slug")
        .populate("storeId", "storeName logo description")
        .populate("sellerId", "name email");

    if (!product) {
        return res.status(404).json({
            message: "Product not found"
        });
    }

    res.status(200).json({
        message: "Product details",
        payload: product
    });
});

// 5. Create Product (Seller only)
productApp.post("/products", verifyToken, verifyRole("seller"), async (req, res) => {
    const store = await StoreModel.findOne({ sellerId: req.user.id });

    if (!store) {
        return res.status(400).json({
            message: "You must create a store before listing products"
        });
    }

    if (store.status !== "approved") {
        return res.status(403).json({
            message: "Your store must be approved by the admin before listing products"
        });
    }

    const {
        title,
        sku,
        description,
        price,
        originalPrice,
        category,
        stock,
        lowStockThreshold,
        images,
        brand,
        variants,
        attributes,
        aiGeneratedFeatures
    } = req.body;

    if (!title || !description || price === undefined || !category) {
        return res.status(400).json({
            message: "Title, description, price, and category are required"
        });
    }

    const productDoc = new ProductModel({
        title: title.trim(),
        sku: sku ? sku.trim() : "",
        description,
        price,
        originalPrice: originalPrice || price,
        category,
        storeId: store._id,
        sellerId: req.user.id,
        stock: stock !== undefined ? Math.max(0, stock) : 0,
        lowStockThreshold: lowStockThreshold !== undefined ? lowStockThreshold : 5,
        images: images && images.length > 0 ? images : [],
        brand: brand || "",
        variants: variants || [],
        attributes: attributes || [],
        aiGeneratedFeatures: aiGeneratedFeatures || [],
        status: "active"
    });

    const savedProduct = await productDoc.save();

    res.status(201).json({
        message: "Product created successfully",
        payload: savedProduct
    });
});

// 6. Direct Stock Update for Product or Variant (Seller owns product or Admin)
productApp.put("/products/:id/stock", verifyToken, verifyRole("seller", "admin"), async (req, res) => {
    const { stock, variantId, lowStockThreshold } = req.body;

    if (stock === undefined && lowStockThreshold === undefined) {
        return res.status(400).json({
            message: "Stock value or lowStockThreshold is required"
        });
    }

    if (stock !== undefined && stock < 0) {
        return res.status(400).json({
            message: "Stock cannot be negative"
        });
    }

    const product = await ProductModel.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            message: "Product not found"
        });
    }

    if (req.user.role === "seller" && product.sellerId.toString() !== req.user.id) {
        return res.status(403).json({
            message: "Access forbidden: You can only update stock for your own products"
        });
    }

    // Update variant stock if variantId is passed
    if (variantId) {
        const variant = product.variants.id(variantId);
        if (!variant) {
            return res.status(404).json({
                message: "Variant not found"
            });
        }
        if (stock !== undefined) variant.stock = stock;
    } else {
        // Update main product stock
        if (stock !== undefined) product.stock = stock;
    }

    if (lowStockThreshold !== undefined) {
        product.lowStockThreshold = lowStockThreshold;
    }

    await product.save();

    res.status(200).json({
        message: "Stock updated successfully",
        payload: product
    });
});

// 7. Update Entire Product (Seller owns product or Admin)
productApp.put("/products/:id", verifyToken, verifyRole("seller", "admin"), async (req, res) => {
    const product = await ProductModel.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            message: "Product not found"
        });
    }

    if (req.user.role === "seller" && product.sellerId.toString() !== req.user.id) {
        return res.status(403).json({
            message: "Access forbidden: You can only edit your own products"
        });
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
        req.params.id,
        { $set: { ...req.body } },
        { returnDocument: "after" }
    );

    res.status(200).json({
        message: "Product updated successfully",
        payload: updatedProduct
    });
});

// 8. Delete Product (Seller owns product or Admin)
productApp.delete("/products/:id", verifyToken, verifyRole("seller", "admin"), async (req, res) => {
    const product = await ProductModel.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            message: "Product not found"
        });
    }

    if (req.user.role === "seller" && product.sellerId.toString() !== req.user.id) {
        return res.status(403).json({
            message: "Access forbidden: You can only delete your own products"
        });
    }

    const deletedProduct = await ProductModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
        message: "Product deleted successfully",
        payload: deletedProduct
    });
});

// 10. Upload Product Image (Seller/Admin) - returns a URL to put in the images array
productApp.post("/upload-image", verifyToken, verifyRole("seller", "admin"), upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: "No image file uploaded. Send the file in a field named 'image'."
        });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    res.status(200).json({
        message: "Image uploaded successfully",
        payload: {
            imageUrl: result.secure_url
        }
    });
});

// 11. Top Picks (Public) - MaxHeap ranks products by a popularity score,
// so the home page can show the top N without sorting the whole catalog.
productApp.get("/top-picks", async (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 20);

    const products = await ProductModel.find({
        status: "active",
        stock: { $gt: 0 }
    }).select("title price images brand rating reviewsCount createdAt");

    const heap = new MaxHeap();
    const now = Date.now();

    for (const product of products) {
        const ageInDays = (now - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);

        // Weighted popularity score: rating (50) + review count (30) + recency (20)
        const score = Math.round(
            (product.rating / 5) * 50 +
                Math.min(product.reviewsCount, 100) * 0.3 +
                Math.max(0, 1 - ageInDays / 30) * 20
        );

        heap.push({ score, product });
    }

    // Extract the top `limit` picks from the heap in descending score order
    const topPicks = [];
    while (topPicks.length < limit && heap.size() > 0) {
        const { score, product } = heap.pop();
        topPicks.push({ product, score });
    }

    res.status(200).json({
        message: "Top picks by popularity",
        payload: { topPicks }
    });
});

// 12. Price Position (Public) - Where does a price rank in the marketplace?
// Uses mergeSort (price list) + binary search (count cheaper products) in O(log N).
productApp.get("/price-position", async (req, res) => {
    const price = Number(req.query.price);
    const { category, store } = req.query;

    if (isNaN(price) || price < 0) {
        return res.status(400).json({
            message: "A valid numeric price query param is required"
        });
    }

    const filter = { status: "active" };
    if (category) filter.category = category;
    if (store) filter.storeId = store;

    const products = await ProductModel.find(filter).select("price");
    const prices = products.map((p) => p.price);

    if (prices.length === 0) {
        return res.status(200).json({
            message: "No products to compare against",
            payload: { totalProducts: 0, cheaperCount: 0, equalCount: 0, pricierCount: 0 }
        });
    }

    // 1) Sort all prices in memory with merge sort
    const sortedPrices = mergeSort(prices);

    // 2) Binary search: how many products are cheaper than the given price?
    const cheaperCount = countLessThan(sortedPrices, price);
    const foundIndex = binarySearch(sortedPrices, price);

    // Count products at the exact same price (may be several)
    let equalCount = 0;
    if (foundIndex !== -1) {
        let i = foundIndex;
        while (i >= 0 && sortedPrices[i] === price) {
            equalCount++;
            i--;
        }
        i = foundIndex + 1;
        while (i < sortedPrices.length && sortedPrices[i] === price) {
            equalCount++;
            i++;
        }
    }

    const pricierCount = sortedPrices.length - cheaperCount - equalCount;
    const percentileRank = Math.round((cheaperCount / sortedPrices.length) * 1000) / 10;

    res.status(200).json({
        message: "Price position computed",
        payload: {
            price,
            totalProducts: sortedPrices.length,
            cheaperCount,
            equalCount,
            pricierCount,
            // this price is higher than X% of all listed products
            percentileRank
        }
    });
});

// 13. Bulk Stock Update (Seller only) - Update many products at once.
// Uses a hash map for O(1) product lookups instead of querying Mongo per product.
productApp.put("/bulk-stock", verifyToken, verifyRole("seller"), async (req, res) => {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
            message: "updates array is required, e.g. [{ productId, stock }]"
        });
    }

    // Fetch only this seller's products once, then hash them by _id
    const myProducts = await ProductModel.find({ sellerId: req.user.id });
    const productMap = buildIdMap(myProducts);

    const unknownIds = [];
    const invalidStocks = [];

    for (const update of updates) {
        const product = productMap[update.productId];

        if (!product) {
            unknownIds.push(update.productId);
            continue;
        }

        if (update.stock === undefined || !Number.isInteger(update.stock) || update.stock < 0) {
            invalidStocks.push(update.productId);
        }
    }

    if (unknownIds.length > 0) {
        return res.status(404).json({
            message: "Some product IDs do not belong to you or do not exist",
            payload: { unknownIds }
        });
    }

    if (invalidStocks.length > 0) {
        return res.status(400).json({
            message: "stock must be a non-negative integer for every product",
            payload: { invalidStocks }
        });
    }

    // All validated - now apply with O(1) hash lookups and save once
    for (const update of updates) {
        productMap[update.productId].stock = update.stock;
    }

    const savePromises = updates.map((update) => productMap[update.productId].save());
    await Promise.all(savePromises);

    res.status(200).json({
        message: `Stock updated for ${updates.length} products`,
        payload: { updatedCount: updates.length }
    });
});

// 9. Admin: View All Products (for moderation) with optional status filter
productApp.get("/admin/products", verifyToken, verifyRole("admin"), async (req, res) => {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const products = await ProductModel.find(filter)
        .populate("category", "name slug")
        .populate("storeId", "storeName logo")
        .populate("sellerId", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "All products for moderation",
        payload: products
    });
});

// 9b. Moderate Product Status (Admin only)
productApp.put("/admin/moderate/:id", verifyToken, verifyRole("admin"), async (req, res) => {
    const { status } = req.body;

    if (!["active", "inactive", "pending_moderation"].includes(status)) {
        return res.status(400).json({
            message: "Status must be 'active', 'inactive', or 'pending_moderation'"
        });
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
        req.params.id,
        { $set: { status } },
        { returnDocument: "after" }
    );

    if (!updatedProduct) {
        return res.status(404).json({
            message: "Product not found"
        });
    }

    res.status(200).json({
        message: `Product status updated to ${status}`,
        payload: updatedProduct
    });
});
