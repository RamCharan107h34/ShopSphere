import { SettlementModel } from "../models/SettlementModel.js";
import { OrderModel } from "../models/OrderModel.js";
import { StoreModel } from "../models/StoreModel.js";

// Fallback when a store has no rate configured. Matches the Store schema default.
const DEFAULT_COMMISSION_RATE = 10;

// Days a settled amount is held before it becomes payable, giving the platform
// a window to absorb returns/chargebacks before money leaves.
const HOLD_DAYS = Number(process.env.SETTLEMENT_HOLD_DAYS) || 7;

// Build the settlement ledger row for one delivered vendor sub-order.
//
// Idempotent by design: the delivery API can be re-entered (retries, admin
// corrections, a duplicate "delivered" call), and a unique index plus the
// duplicate-key catch below guarantee one row per sub-order, never two payouts
// for the same sale.
export const createSettlementForSubOrder = async ({ orderId, subOrderId }) => {
    const existing = await SettlementModel.findOne({ subOrderId });
    if (existing) return existing;

    const order = await OrderModel.findById(orderId);
    if (!order) return null;

    const subOrder = order.vendorOrders?.id?.(subOrderId);
    if (!subOrder) return null;

    const store = await StoreModel.findById(subOrder.storeId).select("storeName commissionRate");

    const commissionRate = Number.isFinite(store?.commissionRate)
        ? store.commissionRate
        : DEFAULT_COMMISSION_RATE;

    const grossAmount = Number(subOrder.subtotal) || 0;
    const commissionAmount = Number(((grossAmount * commissionRate) / 100).toFixed(2));
    const netPayable = Number((grossAmount - commissionAmount).toFixed(2));

    try {
        return await SettlementModel.create({
            orderId: order._id,
            subOrderId: subOrder._id,
            orderNumber: order.orderNumber,
            storeId: subOrder.storeId,
            sellerId: subOrder.sellerId,
            grossAmount,
            commissionRate,
            commissionAmount,
            netPayable,
            itemCount: subOrder.items?.length || 0,
            status: "pending",
            eligibleAt: new Date(Date.now() + HOLD_DAYS * 24 * 60 * 60 * 1000)
        });
    } catch (error) {
        // Lost a race with a concurrent delivery update — return the winner.
        if (error.code === 11000) {
            return SettlementModel.findOne({ subOrderId });
        }
        throw error;
    }
};

// Roll a set of ledger rows up into the summary a payout report needs.
export const summariseSettlements = (rows = []) => {
    const totals = {
        count: rows.length,
        grossAmount: 0,
        commissionAmount: 0,
        netPayable: 0,
        pending: 0,
        eligible: 0,
        paid: 0
    };

    for (const row of rows) {
        totals.grossAmount += row.grossAmount || 0;
        totals.commissionAmount += row.commissionAmount || 0;
        totals.netPayable += row.netPayable || 0;
        if (totals[row.status] !== undefined) totals[row.status] += row.netPayable || 0;
    }

    for (const key of ["grossAmount", "commissionAmount", "netPayable", "pending", "eligible", "paid"]) {
        totals[key] = Number(totals[key].toFixed(2));
    }

    return totals;
};
