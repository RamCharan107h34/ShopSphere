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
            default: 10 // 10% platform fee default
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
