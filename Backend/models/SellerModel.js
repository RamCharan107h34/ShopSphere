import mongoose from "mongoose";

export const sellerSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true
        },
        businessRegistrationNumber: {
            type: String,
            default: ""
        },
        taxId: {
            type: String,
            default: ""
        },
        bankDetails: {
            accountHolderName: { type: String, default: "" },
            accountNumber: { type: String, default: "" },
            bankName: { type: String, default: "" },
            routingNumber: { type: String, default: "" }
        },
        applicationNotes: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

export const SellerModel = mongoose.model("Seller", sellerSchema);
