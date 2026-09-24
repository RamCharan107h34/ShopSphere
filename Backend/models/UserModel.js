import mongoose from "mongoose";

export const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: [
                "customer",
                "seller",
                "admin",
                "support",
                "delivery"
            ],
            default: "customer"
        },

        phone: {
            type: String,
            default: ""
        },

        address: {
            street: { type: String, default: "" },
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            pincode: { type: String, default: "" }
        },


        isActive: {
            type: Boolean,
            default: true
        },

        // Products this customer most recently opened, newest first. Kept on the
        // user document so the home carousel can personalize without a separate
        // collection: PUT /product-api/products/:id/view appends here (deduped,
        // capped at 20) and GET /product-api/recommendations reads it.
        recentlyViewed: {
            type: [
                {
                    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
                    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
                    viewedAt: { type: Date, default: Date.now }
                }
            ],
            default: []
        },

        // Active refresh-token sessions. Only the SHA-256 hash is stored, so a
        // leaked database dump cannot be replayed as a login. Multiple entries
        // let one account stay signed in on several devices independently.
        refreshTokens: {
            type: [
                {
                    tokenHash: { type: String, required: true },
                    userAgent: { type: String, default: "" },
                    expiresAt: { type: Date, required: true },
                    createdAt: { type: Date, default: Date.now }
                }
            ],
            default: []
        }
    },
    {
        timestamps: true,
        // Safety net: credentials must never reach a response, even if a future
        // handler forgets the `.select("-password")` that every route uses today.
        toJSON: {
            transform: (doc, ret) => {
                delete ret.password;
                delete ret.refreshTokens;
                return ret;
            }
        }
    }
);

// Refresh tokens are looked up by hash on every /refresh call.
userSchema.index({ "refreshTokens.tokenHash": 1 });

export const UserModel = mongoose.model("User", userSchema);
