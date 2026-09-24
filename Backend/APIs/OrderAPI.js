import exp from "express";

import { OrderModel } from "../models/OrderModel.js";
import { CartModel } from "../models/CartModel.js";
import { ProductModel } from "../models/ProductModel.js";
import { StoreModel } from "../models/StoreModel.js";
import { CouponModel } from "../models/CouponModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";
import { validate } from "../middlewares/validate.js";
import { reserveStock, releaseOrderItems } from "../utils/stock.js";
import { notify, notifyMany } from "../utils/notify.js";
import { recordAudit } from "../utils/audit.js";
import { checkoutSchema } from "../validators/schemas.js";

export const orderApp = exp.Router();

// 1. Checkout: Place Order with Multi-Vendor Splitting & Atomic Stock Decrement
orderApp.post("/checkout", verifyToken, validate({ body: checkoutSchema }), async (req, res) => {
    const { shippingAddress, paymentMethod = "COD", couponCode } = req.body;

    // Get user's cart
    const cart = await CartModel.findOne({ userId: req.user.id }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
        return res.status(400).json({
            message: "Your cart is empty"
        });
    }

    // Step A: Reserve stock atomically and group items by vendor store.
    //
    // Each reservation is one conditional update, so two customers racing for
    // the last unit can no longer both succeed (the old read-then-save could).
    // If any line fails we release everything already taken and abort, leaving
    // the cart untouched for the customer to fix.
    const vendorMap = new Map();
    const reserved = [];

    for (const item of cart.items) {
        const product = await reserveStock(item.productId, item.variantId, item.quantity);

        if (!product) {
            await releaseOrderItems(reserved);

            const stale = await ProductModel.findById(item.productId).select("title status");
            return res.status(409).json({
                message: stale
                    ? `Insufficient stock for '${stale.title}'. Please adjust your cart and try again.`
                    : "One of the items in your cart is no longer available"
            });
        }

        reserved.push({
            productId: product._id,
            variantId: item.variantId || null,
            quantity: item.quantity
        });

        // Group by store
        const storeKey = item.storeId.toString();
        if (!vendorMap.has(storeKey)) {
            vendorMap.set(storeKey, {
                storeId: item.storeId,
                sellerId: product.sellerId,
                items: [],
                subtotal: 0
            });
        }

        const vendorGroup = vendorMap.get(storeKey);
        vendorGroup.items.push({
            productId: product._id,
            title: product.title,
            image: product.images[0] || "",
            variantId: item.variantId || null,
            variantName: item.variantName || "",
            quantity: item.quantity,
            price: item.price
        });
        vendorGroup.subtotal += item.price * item.quantity;
    }

    // Format vendor sub-orders
    const vendorOrders = Array.from(vendorMap.values()).map(group => ({
        storeId: group.storeId,
        sellerId: group.sellerId,
        items: group.items,
        subtotal: group.subtotal,
        status: "placed"
    }));

    const rawSubtotal = vendorOrders.reduce((acc, vo) => acc + vo.subtotal, 0);

    // Step C: Coupon Validation & Discount Calculation (Optional)
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
        const coupon = await CouponModel.findOne({ code: couponCode.trim().toUpperCase() });
        if (!coupon) {
            return res.status(400).json({ message: "Invalid coupon code" });
        }

        const discountResult = coupon.calculateDiscount(rawSubtotal);
        if (!discountResult.valid) {
            return res.status(400).json({ message: discountResult.message });
        }

        discountAmount = discountResult.discount;
        appliedCoupon = coupon;
    }

    const totalAmount = Math.max(0, Number((rawSubtotal - discountAmount).toFixed(2)));
    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderDoc = new OrderModel({
        orderNumber,
        customerId: req.user.id,
        vendorOrders,
        totalAmount,
        discountAmount,
        couponCode: appliedCoupon ? appliedCoupon.code : "",
        shippingAddress,
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "pending" : "completed",
        overallStatus: "placed"
    });

    const savedOrder = await orderDoc.save();

    // Increment coupon usage
    if (appliedCoupon) {
        appliedCoupon.usedCount += 1;
        await appliedCoupon.save();
    }

    // Clear cart after successful checkout
    cart.items = [];
    cart.subtotal = 0;
    cart.totalItems = 0;
    await cart.save();

    // Tell the buyer their order landed, and tell every affected seller that
    // they have something to fulfil.
    await notify({
        recipientId: req.user.id,
        type: "order",
        title: `Order ${orderNumber} placed`,
        message: `${savedOrder.vendorOrders.length} shipment(s) confirmed - total ${totalAmount.toFixed(2)}.`,
        link: `/account/orders/${savedOrder._id}`,
        entityId: savedOrder._id
    });

    await notifyMany(
        savedOrder.vendorOrders.map((vo) => vo.sellerId),
        {
            type: "order",
            title: `New order ${orderNumber}`,
            message: "A customer placed an order containing your products.",
            link: "/seller/orders",
            entityId: savedOrder._id
        }
    );

    res.status(201).json({
        message: "Order placed successfully",
        payload: savedOrder
    });
});

// 2. Customer: Get My Orders History
orderApp.get("/customer/my-orders", verifyToken, async (req, res) => {
    const orders = await OrderModel.find({ customerId: req.user.id })
        .populate("vendorOrders.storeId", "storeName logo")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "Order history fetched",
        payload: orders
    });
});

// 3. Customer: Get Single Order Details
orderApp.get("/customer/orders/:id", verifyToken, async (req, res) => {
    const order = await OrderModel.findById(req.params.id)
        .populate("vendorOrders.storeId", "storeName logo contactPhone")
        .populate("vendorOrders.sellerId", "name email");

    if (!order) {
        return res.status(404).json({
            message: "Order not found"
        });
    }

    if (order.customerId.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
            message: "Access forbidden: You can only view your own orders"
        });
    }

    res.status(200).json({
        message: "Order details",
        payload: order
    });
});

// 4. Customer: Cancel Order (Restocks inventory)
orderApp.put("/customer/orders/:id/cancel", verifyToken, async (req, res) => {
    const order = await OrderModel.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            message: "Order not found"
        });
    }

    if (order.customerId.toString() !== req.user.id) {
        return res.status(403).json({
            message: "Access forbidden: You can only cancel your own orders"
        });
    }

    // Guard: Cannot cancel if any vendor sub-order is already with the delivery partner or delivered
    const hasShipped = order.vendorOrders.some(vo => ["shipped", "out_for_delivery", "delivered"].includes(vo.status));
    if (hasShipped) {
        return res.status(400).json({
            message: "Cannot cancel order. One or more shipments are already in transit or delivered."
        });
    }

    // Restock every item with atomic increments, so a simultaneous checkout
    // cannot be lost by a concurrent read-then-save.
    for (const vo of order.vendorOrders) {
        if (vo.status !== "cancelled") {
            await releaseOrderItems(vo.items);
            vo.status = "cancelled";
        }
    }

    order.overallStatus = "cancelled";
    await order.save();

    await notifyMany(
        order.vendorOrders.map((vo) => vo.sellerId),
        {
            type: "order",
            title: `Order ${order.orderNumber} cancelled`,
            message: "The customer cancelled this order. Stock has been restored.",
            link: "/seller/orders",
            entityId: order._id
        }
    );

    res.status(200).json({
        message: "Order cancelled successfully and inventory restocked",
        payload: order
    });
});

// 5. Seller: View My Assigned Vendor Sub-Orders
orderApp.get("/seller/orders", verifyToken, verifyRole("seller"), async (req, res) => {
    const store = await StoreModel.findOne({ sellerId: req.user.id });
    if (!store) {
        return res.status(404).json({
            message: "Store not found for this seller"
        });
    }

    const orders = await OrderModel.find({
        "vendorOrders.storeId": store._id
    })
        .populate("customerId", "name email phone")
        .populate("vendorOrders.deliveryPartnerId", "name email phone")
        .sort({ createdAt: -1 });

    // Filter to return only this seller's specific sub-orders along with order headers
    const sellerOrders = orders.map(order => {
        const mySubOrder = order.vendorOrders.find(
            vo => vo.storeId.toString() === store._id.toString()
        );

        return {
            _id: order._id,
            orderNumber: order.orderNumber,
            createdAt: order.createdAt,
            shippingAddress: order.shippingAddress,
            customer: order.customerId,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            subOrder: mySubOrder
        };
    });

    res.status(200).json({
        message: "Seller orders list",
        payload: sellerOrders
    });
});

// 6. Seller: Update Sub-Order Status (State machine transition)
// Sellers own fulfilment up to "packed". The delivery leg (shipped →
// out_for_delivery → delivered) belongs to the delivery partner via /delivery-api.
orderApp.put("/seller/orders/:orderId/sub-orders/:subOrderId/status", verifyToken, verifyRole("seller", "admin"), async (req, res) => {
    const { status, trackingNumber } = req.body;

    const validStatuses = ["confirmed", "packed", "cancelled"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
        });
    }

    const order = await OrderModel.findById(req.params.orderId);
    if (!order) {
        return res.status(404).json({
            message: "Order not found"
        });
    }

    const subOrder = order.vendorOrders.id(req.params.subOrderId);
    if (!subOrder) {
        return res.status(404).json({
            message: "Vendor sub-order not found"
        });
    }

    // Verify ownership if role is seller
    if (req.user.role === "seller" && subOrder.sellerId.toString() !== req.user.id) {
        return res.status(403).json({
            message: "Access forbidden: You can only update your own sub-orders"
        });
    }

    // State machine guards
    const currentStatus = subOrder.status;

    const allowedTransitions = {
        placed: ["confirmed", "cancelled"],
        confirmed: ["packed", "cancelled"],
        packed: ["cancelled"],
        shipped: [],
        out_for_delivery: [],
        delivered: ["return_requested"],
        cancelled: []
    };

    if (allowedTransitions[currentStatus] && !allowedTransitions[currentStatus].includes(status)) {
        return res.status(400).json({
            message: `Invalid state transition from '${currentStatus}' to '${status}'`
        });
    }

    // If seller cancels sub-order, restock its items atomically
    if (status === "cancelled" && currentStatus !== "cancelled") {
        await releaseOrderItems(subOrder.items);
    }

    subOrder.status = status;
    if (trackingNumber) subOrder.trackingNumber = trackingNumber;

    // Recalculate master overallStatus
    const allDelivered = order.vendorOrders.every(vo => vo.status === "delivered");
    const allCancelled = order.vendorOrders.every(vo => vo.status === "cancelled");
    const anyShipped = order.vendorOrders.some(vo => ["shipped", "out_for_delivery"].includes(vo.status));

    if (allDelivered) {
        order.overallStatus = "delivered";
    } else if (allCancelled) {
        order.overallStatus = "cancelled";
    } else if (anyShipped) {
        order.overallStatus = "shipped";
    } else {
        order.overallStatus = "processing";
    }

    await order.save();

    // The transition actor IS the audit trail the PRD asks for: who moved the
    // sub-order, from what, to what, and when.
    await recordAudit({
        req,
        action: "order.status_change",
        targetType: "Order",
        targetId: order._id,
        description: `Sub-order ${subOrder._id} moved ${currentStatus} -> ${status} on ${order.orderNumber}`,
        metadata: {
            orderNumber: order.orderNumber,
            subOrderId: String(subOrder._id),
            from: currentStatus,
            to: status,
            trackingNumber: subOrder.trackingNumber || ""
        }
    });

    await notify({
        recipientId: order.customerId,
        type: "order",
        title: `Order ${order.orderNumber}: ${status}`,
        message: `One of your shipments is now '${status}'.`,
        link: `/account/orders/${order._id}`,
        entityId: order._id
    });

    res.status(200).json({
        message: `Sub-order status updated to '${status}'`,
        payload: {
            orderId: order._id,
            subOrder
        }
    });
});

// 7. Admin: View All Platform Orders
orderApp.get("/admin/orders", verifyToken, verifyRole("admin"), async (req, res) => {
    const orders = await OrderModel.find()
        .populate("customerId", "name email")
        .populate("vendorOrders.storeId", "storeName")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "All platform orders",
        payload: orders
    });
});
