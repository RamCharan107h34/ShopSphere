import exp from "express";

import { DeliveryModel } from "../models/DeliveryModel.js";
import { OrderModel } from "../models/OrderModel.js";
import { StoreModel } from "../models/StoreModel.js";
import { UserModel } from "../models/UserModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";
import { recordAudit } from "../utils/audit.js";
import { notify } from "../utils/notify.js";
import { createSettlementForSubOrder } from "../utils/settlement.js";

export const deliveryApp = exp.Router();

// 1. Seller / Admin: Hand a Packed Vendor Sub-Order to a Delivery Partner
// Sellers stop at "packed"; the delivery partner owns everything after that
// (shipped → out_for_delivery → delivered).
deliveryApp.post("/assignments", verifyToken, verifyRole("seller", "admin"), async (req, res) => {
    const { orderId, subOrderId, deliveryPartnerId, note } = req.body;

    if (!orderId || !subOrderId || !deliveryPartnerId) {
        return res.status(400).json({
            message: "orderId, subOrderId, and deliveryPartnerId are required"
        });
    }

    // Delivery partner must be an active user with role 'delivery'
    const partner = await UserModel.findById(deliveryPartnerId);
    if (!partner || partner.role !== "delivery" || !partner.isActive) {
        return res.status(400).json({
            message: "Invalid delivery partner. Pick an active user with role 'delivery'."
        });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
        return res.status(404).json({
            message: "Order not found"
        });
    }

    const subOrder = order.vendorOrders.id(subOrderId);
    if (!subOrder) {
        return res.status(404).json({
            message: "Vendor sub-order not found"
        });
    }

    // If seller, verify they own this sub-order
    if (req.user.role === "seller" && subOrder.sellerId.toString() !== req.user.id) {
        return res.status(403).json({
            message: "Access forbidden: You can only assign deliveries for your own sub-orders"
        });
    }

    // Only packed sub-orders can be handed to a delivery partner
    if (subOrder.status !== "packed") {
        return res.status(400).json({
            message: `Delivery can only be assigned to 'packed' sub-orders. Current status: '${subOrder.status}'`
        });
    }

    // Guard against duplicate active assignment
    const activeAssignment = await DeliveryModel.findOne({
        orderId,
        subOrderId,
        status: { $ne: "delivered" }
    });

    if (activeAssignment) {
        return res.status(400).json({
            message: `A delivery assignment already exists with status: '${activeAssignment.status}'`
        });
    }

    const store = await StoreModel.findById(subOrder.storeId);
    const customer = await UserModel.findById(order.customerId).select("name");

    const deliveryDoc = new DeliveryModel({
        orderId,
        subOrderId,
        storeId: subOrder.storeId,
        sellerId: subOrder.sellerId,
        deliveryPartnerId,
        // The assignment itself is the first history entry — the partner is
        // notified the moment the row exists.
        statusHistory: [{ status: "assigned", note: note || "" }],
        items: subOrder.items.map(item => ({
            productId: item.productId,
            title: item.title,
            image: item.image,
            quantity: item.quantity
        })),
        pickupAddress: {
            storeName: store ? store.storeName : "",
            phone: store ? store.contactPhone : "",
            street: store ? store.address.street : "",
            city: store ? store.address.city : "",
            state: store ? store.address.state : "",
            pincode: store ? store.address.pincode : ""
        },
        deliveryAddress: {
            customerName: customer ? customer.name : "",
            phone: order.shippingAddress.phone || "",
            street: order.shippingAddress.street || "",
            city: order.shippingAddress.city || "",
            state: order.shippingAddress.state || "",
            pincode: order.shippingAddress.pincode || ""
        },
        note: note || ""
    });

    const savedDelivery = await deliveryDoc.save();

    // Link the partner on the vendor sub-order
    subOrder.deliveryPartnerId = deliveryPartnerId;
    await order.save();

    await recordAudit({
        req,
        action: "delivery.assign",
        targetType: "Delivery",
        targetId: savedDelivery._id,
        description: `Assigned order ${order.orderNumber} to ${partner.name}`,
        metadata: {
            orderNumber: order.orderNumber,
            subOrderId: String(subOrder._id),
            deliveryPartnerId: String(deliveryPartnerId)
        }
    });

    await notify({
        recipientId: deliveryPartnerId,
        type: "delivery",
        title: "New pickup assigned",
        message: `Order ${order.orderNumber} is ready for pickup at ${store ? store.storeName : "the seller"}.`,
        link: `/delivery/deliveries/${savedDelivery._id}`,
        entityId: savedDelivery._id
    });

    res.status(201).json({
        message: `Handover complete — ${partner.name} will pick up this shipment`,
        payload: savedDelivery
    });
});

// 2. Seller / Admin: List Available Delivery Partners
deliveryApp.get("/partners", verifyToken, verifyRole("seller", "admin"), async (req, res) => {
    const partners = await UserModel.find({ role: "delivery", isActive: true })
        .select("name email phone");

    res.status(200).json({
        message: "Delivery partners list",
        payload: partners
    });
});

// 3. Delivery Partner: Get My Assigned Deliveries
deliveryApp.get("/my-deliveries", verifyToken, verifyRole("delivery"), async (req, res) => {
    const { status } = req.query;
    const filter = { deliveryPartnerId: req.user.id };
    if (status) filter.status = status;

    const deliveries = await DeliveryModel.find(filter)
        .populate("orderId", "orderNumber")
        .populate("storeId", "storeName")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "My assigned deliveries",
        payload: deliveries
    });
});

// 4. Seller / Admin: View Assignments (Seller sees only own store's)
deliveryApp.get("/assignments", verifyToken, verifyRole("seller", "admin"), async (req, res) => {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    if (req.user.role === "seller") {
        const store = await StoreModel.findOne({ sellerId: req.user.id });
        if (!store) {
            return res.status(404).json({
                message: "Store not found for this seller"
            });
        }
        filter.storeId = store._id;
    }

    const deliveries = await DeliveryModel.find(filter)
        .populate("orderId", "orderNumber")
        .populate("deliveryPartnerId", "name email phone")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "Delivery assignments list",
        payload: deliveries
    });
});

// 5. Delivery Partner / Seller / Admin: Get Delivery Details
deliveryApp.get("/deliveries/:id", verifyToken, async (req, res) => {
    const delivery = await DeliveryModel.findById(req.params.id)
        .populate("orderId", "orderNumber paymentMethod shippingAddress")
        .populate("storeId", "storeName logo")
        .populate("deliveryPartnerId", "name email phone");

    if (!delivery) {
        return res.status(404).json({
            message: "Delivery assignment not found"
        });
    }

    // Delivery partners see only their own; sellers see only their store's
    if (req.user.role === "delivery" && delivery.deliveryPartnerId._id.toString() !== req.user.id) {
        return res.status(403).json({
            message: "Access forbidden: You can only view your own deliveries"
        });
    }

    if (req.user.role === "seller") {
        const store = await StoreModel.findOne({ sellerId: req.user.id });
        if (!store || delivery.storeId.toString() !== store._id.toString()) {
            return res.status(403).json({
                message: "Access forbidden: You can only view your store's deliveries"
            });
        }
    }

    res.status(200).json({
        message: "Delivery details",
        payload: delivery
    });
});

// 6. Delivery Partner / Admin: Update Shipment Status (and auto-deliver the order)
// Partner flow: assigned → shipped (picked up from seller) → out_for_delivery → delivered
deliveryApp.put("/deliveries/:id/status", verifyToken, verifyRole("delivery", "admin"), async (req, res) => {
    const { status, note } = req.body;

    const validStatuses = ["shipped", "out_for_delivery", "delivered"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
        });
    }

    const delivery = await DeliveryModel.findById(req.params.id);
    if (!delivery) {
        return res.status(404).json({
            message: "Delivery assignment not found"
        });
    }

    // Delivery partners can update only their own deliveries
    if (req.user.role === "delivery" && delivery.deliveryPartnerId.toString() !== req.user.id) {
        return res.status(403).json({
            message: "Access forbidden: You can only update your own deliveries"
        });
    }

    // State machine guards
    const allowedTransitions = {
        assigned: ["shipped"],
        shipped: ["out_for_delivery"],
        out_for_delivery: ["delivered"],
        delivered: []
    };

    if (!allowedTransitions[delivery.status].includes(status)) {
        return res.status(400).json({
            message: `Invalid state transition from '${delivery.status}' to '${status}'`
        });
    }

    delivery.status = status;
    if (note) delivery.note = note;
    if (status === "delivered") {
        delivery.deliveredAt = new Date();
    }
    delivery.statusHistory.push({ status, note: note || "" });

    // Mirror the delivery leg onto the vendor sub-order so customers and sellers
    // see live progress (packed → shipped → out_for_delivery → delivered). Never
    // overwrite cancelled sub-orders or ones already in a return flow.
    const order = await OrderModel.findById(delivery.orderId);
    if (order) {
        const subOrder = order.vendorOrders.id(delivery.subOrderId);
        if (subOrder && !["cancelled", "return_requested", "returned", "refunded", "delivered"].includes(subOrder.status)) {
            subOrder.status = status;

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

            // Delivery is the point of no return for a sale, so this is where the
            // seller's money becomes real: write the commission-split ledger row.
            // Only the final sub-order state counts — cancelled/returned
            // sub-orders never reach here, so they never generate a settlement.
            if (status === "delivered") {
                await createSettlementForSubOrder({
                    orderId: order._id,
                    subOrderId: subOrder._id
                });
            }
        }
    }

    await delivery.save();

    await recordAudit({
        req,
        action: "delivery.status_change",
        targetType: "Delivery",
        targetId: delivery._id,
        description: `Shipment for order ${order ? order.orderNumber : delivery.orderId} marked '${status}'`,
        metadata: {
            orderNumber: order ? order.orderNumber : "",
            subOrderId: String(delivery.subOrderId),
            status
        }
    });

    if (order) {
        await notify({
            recipientId: order.customerId,
            type: "delivery",
            title: `Shipment ${status.replace(/_/g, " ")}`,
            message: `Order ${order.orderNumber} is now '${status.replace(/_/g, " ")}'.`,
            link: `/account/orders/${order._id}`,
            entityId: delivery._id
        });
    }

    res.status(200).json({
        message: `Shipment status updated to '${status}'`,
        payload: delivery
    });
});
