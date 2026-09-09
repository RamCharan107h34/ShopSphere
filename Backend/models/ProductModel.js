import mongoose from "mongoose";

export const variantSchema = new mongoose.Schema(
    {
        name: {
            type: String, // e.g., "Size: M, Color: Blue"
            required: true
        },
        sku: {
            type: String,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        }
    },
    { _id: true }
);

export const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        sku: {
            type: String,
            trim: true,
            default: ""
        },
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        originalPrice: {
            type: Number,
            default: 0
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true
        },
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        lowStockThreshold: {
            type: Number,
            default: 5
        },
        images: {
            type: [String],
            default: []
        },
        brand: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["active", "inactive", "pending_moderation"],
            default: "active"
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        reviewsCount: {
            type: Number,
            default: 0
        },
        variants: [variantSchema],
        attributes: {
            type: [
                {
                    name: { type: String, trim: true, default: "" },
                    value: { type: String, trim: true, default: "" }
                }
            ],
            default: []
        },
        aiGeneratedFeatures: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

// Index for search optimization
productSchema.index({ title: "text", description: "text", brand: "text" });

export const ProductModel = mongoose.model("Product", productSchema);
