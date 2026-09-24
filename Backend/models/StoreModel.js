import mongoose from "mongoose";

export const storeSchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        storeName: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        description: {
            type: String,
            default: ""
        },
        logo: {
            type: String,
            default: ""
        },
        banner: {
            type: String,
            default: ""
        },
        contactEmail: {
            type: String,
            trim: true
        },
        contactPhone: {
            type: String,
            default: ""
        },
        address: {
            street: { type: String, default: "" },
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            pincode: { type: String, default: "" }
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },
        commissionRate: {
            type: Number,
            default: 10, // 10% platform fee default
            min: 0,
            max: 100
        },
        // Where the platform pays this seller. Stored on the store (not the
        // user) so a seller's payout routing is part of their vendor profile.
        // Never returned by the public store list endpoints.
        payoutDetails: {
            accountHolder: { type: String, default: "", trim: true },
            bankName: { type: String, default: "", trim: true },
            accountNumberLast4: { type: String, default: "", trim: true },
            ifsc: { type: String, default: "", trim: true },
            upiId: { type: String, default: "", trim: true }
        },
        rejectionReason: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

export const StoreModel = mongoose.model("Store", storeSchema);
