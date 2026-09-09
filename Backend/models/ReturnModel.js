import mongoose from "mongoose";

export const returnSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true
        },
        subOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        reason: {
            type: String,
            required: true,
            enum: [
                "Defective / Damaged item",
                "Wrong item delivered",
                "Item not as described",
                "Changed mind",
                "Other"
            ]
        },
        description: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["requested", "approved", "rejected", "completed"],
            default: "requested"
        },
        refundAmount: {
            type: Number,
            required: true,
            min: 0
        },
        adminNote: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

export const ReturnModel = mongoose.model("Return", returnSchema);
