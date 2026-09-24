import exp from "express";

import { SettlementModel } from "../models/SettlementModel.js";
import { StoreModel } from "../models/StoreModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";
import { recordAudit } from "../utils/audit.js";
import { notify } from "../utils/notify.js";
import { summariseSettlements } from "../utils/settlement.js";

export const settlementApp = exp.Router();

const pageParams = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
    return { page, limit, skip: (page - 1) * limit };
};

// Promote any settled row whose hold window has elapsed. Run lazily on read so
// the ledger is always current without needing a cron worker.
const promoteEligible = async () => {
    await SettlementModel.updateMany(
        { status: "pending", eligibleAt: { $lte: new Date() } },
        { $set: { status: "eligible" } }
    );
};

// 1. Seller: my settlement ledger (paged, filterable by status)
settlementApp.get(
    "/seller/settlements",
    verifyToken,
    verifyRole("seller"),
    async (req, res) => {
        await promoteEligible();

        const { page, limit, skip } = pageParams(req.query);

        const filter = { sellerId: req.user.id };
        if (req.query.status) filter.status = req.query.status;

        const [settlements, totalCount] = await Promise.all([
            SettlementModel.find(filter)
                .populate("storeId", "storeName")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            SettlementModel.countDocuments(filter)
        ]);

        res.status(200).json({
            message: "Settlements fetched",
            payload: {
                settlements,
                totalCount,
                totalPages: Math.ceil(totalCount / limit) || 1,
                currentPage: page
            }
        });
    }
);

// 2. Seller: payout summary — lifetime totals plus a weekly series for the
//    "weekly or on-demand" report the PRD asks for.
settlementApp.get(
    "/seller/settlements/summary",
    verifyToken,
    verifyRole("seller"),
    async (req, res) => {
        await promoteEligible();

        const rows = await SettlementModel.find({ sellerId: req.user.id }).lean();
        const store = await StoreModel.findOne({ sellerId: req.user.id }).select("storeName commissionRate");

        const weekly = await SettlementModel.aggregate([
            { $match: { sellerId: req.user._id } },
            {
                $group: {
                    _id: { $dateToString: { format: "%G-W%V", date: "$createdAt" } },
                    gross: { $sum: "$grossAmount" },
                    commission: { $sum: "$commissionAmount" },
                    net: { $sum: "$netPayable" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 8 }
        ]);

        res.status(200).json({
            message: "Payout summary",
            payload: {
                store: store ? { storeName: store.storeName, commissionRate: store.commissionRate } : null,
                totals: summariseSettlements(rows),
                weekly: weekly.map((week) => ({
                    period: week._id,
                    gross: Number(week.gross.toFixed(2)),
                    commission: Number(week.commission.toFixed(2)),
                    net: Number(week.net.toFixed(2)),
                    count: week.count
                }))
            }
        });
    }
);

// 3. Admin: platform-wide ledger with seller/store context
settlementApp.get(
    "/admin/settlements",
    verifyToken,
    verifyRole("admin"),
    async (req, res) => {
        await promoteEligible();

        const { page, limit, skip } = pageParams(req.query);

        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.sellerId) filter.sellerId = req.query.sellerId;

        const [settlements, totalCount, allRows] = await Promise.all([
            SettlementModel.find(filter)
                .populate("sellerId", "name email")
                .populate("storeId", "storeName")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            SettlementModel.countDocuments(filter),
            SettlementModel.find(filter).lean()
        ]);

        res.status(200).json({
            message: "Platform settlements",
            payload: {
                settlements,
                totals: summariseSettlements(allRows),
                totalCount,
                totalPages: Math.ceil(totalCount / limit) || 1,
                currentPage: page
            }
        });
    }
);

// 4. Admin: mark a settlement paid (the actual payout action)
settlementApp.put(
    "/admin/settlements/:id/mark-paid",
    verifyToken,
    verifyRole("admin"),
    async (req, res) => {
        const settlement = await SettlementModel.findById(req.params.id);

        if (!settlement) {
            return res.status(404).json({ message: "Settlement not found" });
        }

        if (settlement.status === "paid") {
            return res.status(400).json({ message: "This settlement has already been paid out" });
        }

        if (settlement.status === "cancelled") {
            return res.status(400).json({ message: "This settlement was cancelled and cannot be paid" });
        }

        settlement.status = "paid";
        settlement.paidAt = new Date();
        settlement.payoutReference =
            req.body?.payoutReference?.trim() || `PAY-${Date.now().toString(36).toUpperCase()}`;

        await settlement.save();

        await recordAudit({
            req,
            action: "settlement.payout",
            targetType: "Settlement",
            targetId: settlement._id,
            description: `Paid ${settlement.netPayable.toFixed(2)} to seller for order ${settlement.orderNumber}`,
            metadata: {
                orderNumber: settlement.orderNumber,
                netPayable: settlement.netPayable,
                commissionAmount: settlement.commissionAmount,
                payoutReference: settlement.payoutReference
            }
        });

        await notify({
            recipientId: settlement.sellerId,
            type: "payout",
            title: "Payout sent",
            message: `${settlement.netPayable.toFixed(2)} for order ${settlement.orderNumber} has been paid out (ref ${settlement.payoutReference}).`,
            link: "/seller/earnings",
            entityId: settlement._id
        });

        res.status(200).json({
            message: "Settlement marked paid",
            payload: settlement
        });
    }
);
