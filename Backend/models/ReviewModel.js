import mongoose from "mongoose";

export const reviewSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            required: true,
            trim: true
        },
        sellerReply: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// Compound index to ensure a customer can leave only one review per product per order
reviewSchema.index({ customerId: 1, productId: 1, orderId: 1 }, { unique: true });

export const ReviewModel = mongoose.model("Review", reviewSchema);
