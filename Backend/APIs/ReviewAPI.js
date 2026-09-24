import exp from "express";

import { ReviewModel } from "../models/ReviewModel.js";
import { ProductModel } from "../models/ProductModel.js";
import { OrderModel } from "../models/OrderModel.js";
import { StoreModel } from "../models/StoreModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";
import { validate } from "../middlewares/validate.js";
import { reviewSchema } from "../validators/schemas.js";

export const reviewApp = exp.Router();

// Helper function: Recalculate product average rating & review count
const recalculateProductRating = async (productId) => {
    const reviews = await ReviewModel.find({ productId });
    const reviewsCount = reviews.length;
    const avgRating = reviewsCount === 0
        ? 0
        : Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount).toFixed(1));

    await ProductModel.findByIdAndUpdate(productId, {
        rating: avgRating,
        reviewsCount
    });
};

// 1. Customer: Add Review for a Purchased Product (Verified Purchase)
reviewApp.post("/products/:productId", verifyToken, validate({ body: reviewSchema }), async (req, res) => {
    const { rating, comment, orderId } = req.body;
    const { productId } = req.params;

    const ratingNum = Number(rating);

    // Verified Purchase Guard: Check that user purchased this product in this order
    const order = await OrderModel.findOne({
        _id: orderId,
        customerId: req.user.id,
        "vendorOrders.items.productId": productId
    });

    if (!order) {
        return res.status(403).json({
            message: "You can only review products you have purchased in a valid order"
        });
    }

    // Check if user already reviewed this product from this order
    const existingReview = await ReviewModel.findOne({
        customerId: req.user.id,
        productId,
        orderId
    });

    if (existingReview) {
        return res.status(400).json({
            message: "You have already reviewed this product for this order"
        });
    }

    const reviewDoc = new ReviewModel({
        productId,
        customerId: req.user.id,
        orderId,
        rating: ratingNum,
        comment: comment.trim()
    });

    const savedReview = await reviewDoc.save();

    // Recalculate product rating
    await recalculateProductRating(productId);

    res.status(201).json({
        message: "Review submitted successfully",
        payload: savedReview
    });
});

// 2. Public: Get All Reviews for a Product
reviewApp.get("/products/:productId", async (req, res) => {
    const reviews = await ReviewModel.find({ productId: req.params.productId })
        .populate("customerId", "name")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "Product reviews list",
        payload: reviews
    });
});

// 3. Seller: Reply to a Review
reviewApp.put("/reviews/:reviewId/reply", verifyToken, verifyRole("seller"), async (req, res) => {
    const { reply } = req.body;

    if (!reply) {
        return res.status(400).json({
            message: "Reply content is required"
        });
    }

    const review = await ReviewModel.findById(req.params.reviewId);
    if (!review) {
        return res.status(404).json({
            message: "Review not found"
        });
    }

    // Verify seller owns the product
    const product = await ProductModel.findById(review.productId);
    if (!product || product.sellerId.toString() !== req.user.id) {
        return res.status(403).json({
            message: "Access forbidden: You can only reply to reviews on your products"
        });
    }

    review.sellerReply = reply.trim();
    await review.save();

    res.status(200).json({
        message: "Seller reply added",
        payload: review
    });
});

// 4. Customer/Admin: Delete Review
reviewApp.delete("/reviews/:reviewId", verifyToken, async (req, res) => {
    const review = await ReviewModel.findById(req.params.reviewId);

    if (!review) {
        return res.status(404).json({
            message: "Review not found"
        });
    }

    if (review.customerId.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
            message: "Access forbidden: You can only delete your own reviews"
        });
    }

    const productId = review.productId;
    await ReviewModel.findByIdAndDelete(req.params.reviewId);

    // Recalculate product rating after deletion
    await recalculateProductRating(productId);

    res.status(200).json({
        message: "Review deleted successfully"
    });
});
