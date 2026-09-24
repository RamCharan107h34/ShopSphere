import mongoose from "mongoose";

// One ledger row per vendor sub-order. Created when the sub-order is delivered
// so the commission split is recorded against a completed sale, then flipped to
// "paid" when the platform actually pays the seller out.
//
// grossAmount - commissionAmount = netPayable
export const settlementSchema = new mongoose.Schema(
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
        orderNumber: {
            type: String,
            default: ""
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
        grossAmount: {
            type: Number,
            required: true,
            min: 0
        },
        // Snapshot of the store rate at delivery time — a later rate change must
        // never retroactively rewrite an already-earned settlement.
        commissionRate: {
            type: Number,
            required: true,
            min: 0
        },
        commissionAmount: {
            type: Number,
            required: true,
            min: 0
        },
        netPayable: {
            type: Number,
            required: true,
            min: 0
        },
        itemCount: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ["pending", "eligible", "paid", "cancelled"],
            default: "pending"
        },
        // When the funds clear the platform's hold window and can be paid out
        eligibleAt: {
            type: Date,
            default: null
        },
        paidAt: {
            type: Date,
            default: null
        },
        payoutReference: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// A sub-order can only ever produce one settlement row (delivery API is
// re-entrant, so this keeps generation idempotent under retries).
settlementSchema.index({ subOrderId: 1 }, { unique: true });
settlementSchema.index({ sellerId: 1, status: 1, createdAt: -1 });
settlementSchema.index({ status: 1, createdAt: -1 });

export const SettlementModel = mongoose.model("Settlement", settlementSchema);
