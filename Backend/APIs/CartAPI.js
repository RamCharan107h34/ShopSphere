import exp from "express";

import { CartModel } from "../models/CartModel.js";
import { ProductModel } from "../models/ProductModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { validate } from "../middlewares/validate.js";
import { cartItemSchema, cartQuantitySchema } from "../validators/schemas.js";

export const cartApp = exp.Router();

// 1. Get Current User's Cart
cartApp.get("/cart", verifyToken, async (req, res) => {
    let cart = await CartModel.findOne({ userId: req.user.id })
        .populate("items.productId", "title images price stock status brand")
        .populate("items.storeId", "storeName logo");

    if (!cart) {
        cart = new CartModel({
            userId: req.user.id,
            items: [],
            subtotal: 0,
            totalItems: 0
        });
        await cart.save();
    }

    res.status(200).json({
        message: "Cart fetched successfully",
        payload: cart
    });
});

// 2. Add Item to Cart
cartApp.post("/cart", verifyToken, validate({ body: cartItemSchema }), async (req, res) => {
    const { productId, variantId, quantity = 1 } = req.body;

    const qtyToAdd = Math.max(1, parseInt(quantity, 10));

    // Find product
    const product = await ProductModel.findById(productId);
    if (!product) {
        return res.status(404).json({
            message: "Product not found"
        });
    }

    if (product.status !== "active") {
        return res.status(400).json({
            message: "Product is currently unavailable"
        });
    }

    // Determine price and available stock
    let itemPrice = product.price;
    let availableStock = product.stock;
    let variantName = "";

    if (variantId) {
        const variant = product.variants.id(variantId);
        if (!variant) {
            return res.status(404).json({
                message: "Product variant not found"
            });
        }
        itemPrice = variant.price;
        availableStock = variant.stock;
        variantName = variant.name;
    }

    // Find or create cart
    let cart = await CartModel.findOne({ userId: req.user.id });
    if (!cart) {
        cart = new CartModel({
            userId: req.user.id,
            items: []
        });
    }

    // Check if item already exists in cart
    const existingIndex = cart.items.findIndex(item => {
        const sameProduct = item.productId.toString() === productId;
        const sameVariant = variantId ? item.variantId && item.variantId.toString() === variantId : !item.variantId;
        return sameProduct && sameVariant;
    });

    let currentInCartQty = existingIndex > -1 ? cart.items[existingIndex].quantity : 0;
    let newTotalQty = currentInCartQty + qtyToAdd;

    if (newTotalQty > availableStock) {
        return res.status(400).json({
            message: `Cannot add more. Only ${availableStock} units available in stock.`
        });
    }

    if (existingIndex > -1) {
        cart.items[existingIndex].quantity = newTotalQty;
        cart.items[existingIndex].price = itemPrice;
    } else {
        cart.items.push({
            productId: product._id,
            storeId: product.storeId,
            variantId: variantId || null,
            variantName,
            quantity: qtyToAdd,
            price: itemPrice
        });
    }

    cart.recalculateTotals();
    await cart.save();

    const populatedCart = await CartModel.findById(cart._id)
        .populate("items.productId", "title images price stock status brand")
        .populate("items.storeId", "storeName logo");

    res.status(200).json({
        message: "Item added to cart",
        payload: populatedCart
    });
});

// 3. Update Cart Item Quantity
cartApp.put("/cart/:itemId", verifyToken, validate({ body: cartQuantitySchema }), async (req, res) => {
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    const cart = await CartModel.findOne({ userId: req.user.id });
    if (!cart) {
        return res.status(404).json({
            message: "Cart not found"
        });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === req.params.itemId);
    if (itemIndex === -1) {
        return res.status(404).json({
            message: "Item not found in cart"
        });
    }

    // If quantity is 0 or less, remove the item
    if (qty <= 0) {
        cart.items.splice(itemIndex, 1);
    } else {
        const item = cart.items[itemIndex];
        const product = await ProductModel.findById(item.productId);

        if (!product) {
            cart.items.splice(itemIndex, 1);
        } else {
            let availableStock = product.stock;
            if (item.variantId) {
                const variant = product.variants.id(item.variantId);
                if (variant) availableStock = variant.stock;
            }

            if (qty > availableStock) {
                return res.status(400).json({
                    message: `Cannot update quantity. Only ${availableStock} items in stock.`
                });
            }

            item.quantity = qty;
        }
    }

    cart.recalculateTotals();
    await cart.save();

    const populatedCart = await CartModel.findById(cart._id)
        .populate("items.productId", "title images price stock status brand")
        .populate("items.storeId", "storeName logo");

    res.status(200).json({
        message: "Cart updated successfully",
        payload: populatedCart
    });
});

// 4. Remove Item from Cart
cartApp.delete("/cart/:itemId", verifyToken, async (req, res) => {
    const cart = await CartModel.findOne({ userId: req.user.id });
    if (!cart) {
        return res.status(404).json({
            message: "Cart not found"
        });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
    cart.recalculateTotals();
    await cart.save();

    const populatedCart = await CartModel.findById(cart._id)
        .populate("items.productId", "title images price stock status brand")
        .populate("items.storeId", "storeName logo");

    res.status(200).json({
        message: "Item removed from cart",
        payload: populatedCart
    });
});

// 5. Clear Entire Cart
cartApp.delete("/cart", verifyToken, async (req, res) => {
    const cart = await CartModel.findOne({ userId: req.user.id });
    if (!cart) {
        return res.status(404).json({
            message: "Cart not found"
        });
    }

    cart.items = [];
    cart.subtotal = 0;
    cart.totalItems = 0;
    await cart.save();

    res.status(200).json({
        message: "Cart cleared successfully",
        payload: cart
    });
});
