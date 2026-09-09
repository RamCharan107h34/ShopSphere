import exp from "express";

import { WishlistModel } from "../models/WishlistModel.js";
import { ProductModel } from "../models/ProductModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";

export const wishlistApp = exp.Router();

// 1. Get User's Wishlist
wishlistApp.get("/wishlist", verifyToken, async (req, res) => {
    let wishlist = await WishlistModel.findOne({ userId: req.user.id })
        .populate({
            path: "products",
            select: "title images price originalPrice stock status storeId",
            populate: { path: "storeId", select: "storeName logo" }
        });

    if (!wishlist) {
        wishlist = new WishlistModel({
            userId: req.user.id,
            products: []
        });
        await wishlist.save();
    }

    res.status(200).json({
        message: "Wishlist fetched successfully",
        payload: wishlist
    });
});

// 2. Add Product to Wishlist
wishlistApp.post("/wishlist/:productId", verifyToken, async (req, res) => {
    const product = await ProductModel.findById(req.params.productId);
    if (!product) {
        return res.status(404).json({
            message: "Product not found"
        });
    }

    let wishlist = await WishlistModel.findOne({ userId: req.user.id });
    if (!wishlist) {
        wishlist = new WishlistModel({
            userId: req.user.id,
            products: []
        });
    }

    const alreadyAdded = wishlist.products.some(
        id => id.toString() === req.params.productId
    );

    if (!alreadyAdded) {
        wishlist.products.push(product._id);
        await wishlist.save();
    }

    const populatedWishlist = await WishlistModel.findById(wishlist._id)
        .populate({
            path: "products",
            select: "title images price originalPrice stock status storeId",
            populate: { path: "storeId", select: "storeName logo" }
        });

    res.status(200).json({
        message: alreadyAdded ? "Product already in wishlist" : "Product added to wishlist",
        payload: populatedWishlist
    });
});

// 3. Remove Product from Wishlist
wishlistApp.delete("/wishlist/:productId", verifyToken, async (req, res) => {
    const wishlist = await WishlistModel.findOne({ userId: req.user.id });
    if (!wishlist) {
        return res.status(404).json({
            message: "Wishlist not found"
        });
    }

    wishlist.products = wishlist.products.filter(
        id => id.toString() !== req.params.productId
    );

    await wishlist.save();

    const populatedWishlist = await WishlistModel.findById(wishlist._id)
        .populate({
            path: "products",
            select: "title images price originalPrice stock status storeId",
            populate: { path: "storeId", select: "storeName logo" }
        });

    res.status(200).json({
        message: "Product removed from wishlist",
        payload: populatedWishlist
    });
});
