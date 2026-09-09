import mongoose from "mongoose";

export const cartItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        variantName: {
            type: String,
            default: ""
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        }
    },
    { _id: true }
);

export const cartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        items: [cartItemSchema],
        subtotal: {
            type: Number,
            default: 0
        },
        totalItems: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Method to recalculate cart subtotal and totalItems
cartSchema.methods.recalculateTotals = function () {
    this.totalItems = this.items.reduce((acc, item) => acc + item.quantity, 0);
    this.subtotal = this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
};

export const CartModel = mongoose.model("Cart", cartSchema);
