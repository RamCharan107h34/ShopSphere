import exp from "express";

import { ReturnModel } from "../models/ReturnModel.js";
import { OrderModel } from "../models/OrderModel.js";
import { ProductModel } from "../models/ProductModel.js";
import { StoreModel } from "../models/StoreModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";
import { validate } from "../middlewares/validate.js";
import { returnRequestSchema } from "../validators/schemas.js";
import { recordAudit } from "../utils/audit.js";
import { notify } from "../utils/notify.js";
import { releaseStock } from "../utils/stock.js";

export const returnApp = exp.Router();

// 1. Customer: Submit a Return Request
returnApp.post("/request", verifyToken, validate({ body: returnRequestSchema }), async (req, res) => {
    const { orderId, subOrderId, productId, quantity = 1, reason, description } = req.body;

    const order = await OrderModel.findById(orderId);
    if (!order) {
        return res.status(404).json({
            message: "Order not found"
        });
    }

    if (order.customerId.toString() !== req.user.id) {
        return res.status(403).json({
            message: "Access forbidden: You can only request returns for your own orders"
        });
    }

    const subOrder = order.vendorOrders.id(subOrderId);
    if (!subOrder) {
        return res.status(404).json({
            message: "Vendor sub-order not found"
        });
    }

    if (subOrder.status !== "delivered") {
        return res.status(400).json({
            message: `Returns can only be requested on 'delivered' orders. Current status: '${subOrder.status}'`
        });
    }

    const item = subOrder.items.find(i => i.productId.toString() === productId);
    if (!item) {
        return res.status(404).json({
            message: "Product not found in this sub-order"
        });
    }

    const returnQty = Math.min(parseInt(quantity, 10), item.quantity);

    // Check if already requested
    const existing = await ReturnModel.findOne({
        orderId,
        productId,
        status: { $in: ["requested", "approved", "completed"] }
    });

    if (existing) {
        return res.status(400).json({
            message: `A return request already exists with status: '${existing.status}'`
        });
    }

    const returnDoc = new ReturnModel({
        orderId,
        subOrderId,
        customerId: req.user.id,
        storeId: subOrder.storeId,
        productId,
        quantity: returnQty,
        reason,
        description: description || "",
        status: "requested",
        refundAmount: item.price * returnQty
    });

    const savedReturn = await returnDoc.save();

    subOrder.status = "return_requested";
    await order.save();

    await notify({
        recipientId: subOrder.sellerId,
        type: "order",
        title: "New return request",
        message: `A customer requested a return on order ${order.orderNumber}. Reason: ${reason}.`,
        link: "/seller/returns",
        entityId: savedReturn._id
    });

    res.status(201).json({
        message: "Return request submitted successfully",
        payload: savedReturn
    });
});

// 2. Customer: Get My Return Requests
returnApp.get("/customer/my-returns", verifyToken, async (req, res) => {
    const returns = await ReturnModel.find({ customerId: req.user.id })
        .populate("productId", "title images price")
        .populate("storeId", "storeName logo")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "My returns list",
        payload: returns
    });
});

// 3. Seller: View Return Requests for My Store
returnApp.get("/seller/returns", verifyToken, verifyRole("seller"), async (req, res) => {
    const store = await StoreModel.findOne({ sellerId: req.user.id });
    if (!store) {
        return res.status(404).json({
            message: "Store not found"
        });
    }

    const returns = await ReturnModel.find({ storeId: store._id })
        .populate("customerId", "name email phone")
        .populate("productId", "title images price")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "Seller return requests",
        payload: returns
    });
});

// 4. Seller / Admin: Update Return Status (Approve / Reject / Complete with Restock)
returnApp.put("/seller/returns/:returnId/status", verifyToken, verifyRole("seller", "admin"), async (req, res) => {
    const { status, adminNote } = req.body;

    if (!["approved", "rejected", "completed"].includes(status)) {
        return res.status(400).json({
            message: "Status must be 'approved', 'rejected', or 'completed'"
        });
    }

    const returnDoc = await ReturnModel.findById(req.params.returnId);
    if (!returnDoc) {
        return res.status(404).json({
            message: "Return request not found"
        });
    }

    // If seller, verify store ownership
    if (req.user.role === "seller") {
        const store = await StoreModel.findOne({ sellerId: req.user.id });
        if (!store || returnDoc.storeId.toString() !== store._id.toString()) {
            return res.status(403).json({
                message: "Access forbidden: You can only manage returns for your store"
            });
        }
    }

    // Loaded once and reused by both the restock branch and the audit trail, so
    // the recorded description always names the real order number.
    const order = await OrderModel.findById(returnDoc.orderId);

    // If status is completed (item received back and refund processed), restock the inventory.
    // Atomic increment rather than read-modify-write: a return can land while a
    // checkout is decrementing the same SKU, and a lost update there means stock
    // that never comes back.
    if (status === "completed" && returnDoc.status !== "completed") {
        await releaseStock(returnDoc.productId, returnDoc.variantId, returnDoc.quantity);

        // Update sub-order status to returned
        if (order) {
            const subOrder = order.vendorOrders.id(returnDoc.subOrderId);
            if (subOrder) {
                subOrder.status = "returned";
                await order.save();
            }
        }
    }

    returnDoc.status = status;
    if (adminNote) returnDoc.adminNote = adminNote;
    await returnDoc.save();

    await recordAudit({
        req,
        action: `return.${status}`,
        targetType: "Return",
        targetId: returnDoc._id,
        description: `Return for order ${order?.orderNumber || returnDoc.orderId} marked '${status}' with a refund of ${returnDoc.refundAmount}`,
        metadata: {
            orderId: String(returnDoc.orderId),
            refundAmount: returnDoc.refundAmount,
            quantity: returnDoc.quantity
        }
    });

    await notify({
        recipientId: returnDoc.customerId,
        type: "order",
        title: `Return ${status}`,
        message:
            status === "completed"
                ? `Your return was completed and ${returnDoc.refundAmount} has been refunded.`
                : `Your return request was ${status}.`,
        link: "/account/returns",
        entityId: returnDoc._id
    });

    res.status(200).json({
        message: `Return request marked as '${status}'`,
        payload: returnDoc
    });
});
