import mongoose from "mongoose";

// Snapshot of one product travelling in the shipment
export const deliveryItemSchema = new mongoose.Schema(
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
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    },
    { _id: false }
);

export const deliverySchema = new mongoose.Schema(
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
        deliveryPartnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["assigned", "picked_up", "in_transit", "delivered"],
            default: "assigned"
        },
        items: [deliveryItemSchema],
        pickupAddress: {
            storeName: { type: String, default: "" },
            phone: { type: String, default: "" },
            street: { type: String, default: "" },
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            pincode: { type: String, default: "" }
        },
        deliveryAddress: {
            customerName: { type: String, default: "" },
            phone: { type: String, default: "" },
            street: { type: String, default: "" },
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            pincode: { type: String, default: "" }
        },
        deliveredAt: {
            type: Date,
            default: null
        },
        note: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

export const DeliveryModel = mongoose.model("Delivery", deliverySchema);
