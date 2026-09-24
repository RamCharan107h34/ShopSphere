import { ProductModel } from "../models/ProductModel.js";

// Atomic inventory operations.
//
// The previous implementation read the product, subtracted in JS, then saved —
// two concurrent checkouts could both read stock: 1 and both succeed, overselling
// the item. Every mutation here is a single conditional `findOneAndUpdate`, so
// MongoDB applies the check and the decrement as one indivisible operation.
//
// The `$gte` guard also doubles as the availability check: a `null` return means
// "not enough stock" (or the product went inactive), never "unknown error".

// Take `quantity` units out of stock. Returns the updated product, or null when
// there is not enough stock.
export const reserveStock = async (productId, variantId, quantity) => {
    const qty = Number(quantity);
    if (!productId || !Number.isFinite(qty) || qty < 1) return null;

    const filter = { _id: productId, status: "active" };
    const update = { $inc: { stock: -qty } };

    if (variantId) {
        // Both the variant bucket and the product total are decremented in the
        // same atomic update, matching how the catalog has always counted them.
        filter["variants._id"] = variantId;
        filter["variants.stock"] = { $gte: qty };
        update.$inc["variants.$.stock"] = -qty;
    } else {
        filter.stock = { $gte: qty };
    }

    return ProductModel.findOneAndUpdate(filter, update, { new: true });
};

// Put `quantity` units back (cancellation, return, failed payment).
export const releaseStock = async (productId, variantId, quantity) => {
    const qty = Number(quantity);
    if (!productId || !Number.isFinite(qty) || qty < 1) return null;

    const update = { $inc: { stock: qty } };

    if (variantId) {
        update.$inc["variants.$.stock"] = qty;
        return ProductModel.findOneAndUpdate(
            { _id: productId, "variants._id": variantId },
            update,
            { new: true }
        );
    }

    return ProductModel.findByIdAndUpdate(productId, update, { new: true });
};

// Release every item of a set of order items. Used by the cancel/return paths,
// which previously restocked with the same racy read-then-save pattern.
export const releaseOrderItems = async (items = []) => {
    for (const item of items) {
        await releaseStock(item.productId, item.variantId, item.quantity);
    }
};

// How many units of a product (or one of its variants) are sellable right now.
export const availableStock = (product, variantId) => {
    if (!product) return 0;
    if (variantId) {
        const variant = product.variants?.id?.(variantId);
        if (variant) return variant.stock;
    }
    return product.stock;
};
