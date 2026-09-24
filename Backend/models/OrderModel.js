import mongoose from "mongoose";

// Item within a vendor sub-order
export const orderItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        title: {
            type: String,
            required: true
        },
        image: {
            type: String,
            default: ""
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
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        }
    },
    { _id: true }
);

// Vendor Sub-Order (partitioned per seller)
export const vendorSubOrderSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true
        },
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        items: [orderItemSchema],
        subtotal: {
            type: Number,
            required: true,
            min: 0
        },
        status: {
            type: String,
            enum: [
                "placed",
                "confirmed",
                "packed",
                "shipped",
                "out_for_delivery",
                "delivered",
                "cancelled",
                "return_requested",
                "returned",
                "refunded"
            ],
            default: "placed"
        },
        deliveryPartnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        trackingNumber: {
            type: String,
            default: ""
        }
    },
    { _id: true, timestamps: true }
);

// Master Order (viewed by Customer and Admin)
export const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        vendorOrders: [vendorSubOrderSchema],
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        discountAmount: {
            type: Number,
            default: 0
        },
        couponCode: {
            type: String,
            default: ""
        },
        shippingAddress: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, required: true },
            phone: { type: String, required: true }
        },
        paymentMethod: {
            type: String,
            enum: ["COD", "CARD", "UPI", "NET_BANKING"],
            default: "COD"
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "completed", "failed", "refunded"],
            default: "pending"
        },
        overallStatus: {
            type: String,
            enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
            default: "placed"
        }
    },
    {
        timestamps: true
    }
);

export const OrderModel = mongoose.model("Order", orderSchema);
