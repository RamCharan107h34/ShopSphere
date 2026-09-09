import exp from "express";

import { CouponModel } from "../models/CouponModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";

export const couponApp = exp.Router();

// 1. Admin: View All Coupons
couponApp.get("/coupons", verifyToken, verifyRole("admin"), async (req, res) => {
    const coupons = await CouponModel.find().sort({ createdAt: -1 });

    res.status(200).json({
        message: "Coupons list",
        payload: coupons
    });
});

// 2. Admin: Create Coupon
couponApp.post("/coupons", verifyToken, verifyRole("admin"), async (req, res) => {
    const {
        code,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscount,
        expiryDate,
        usageLimit
    } = req.body;

    if (!code || !discountType || !discountValue || !expiryDate) {
        return res.status(400).json({
            message: "code, discountType, discountValue, and expiryDate are required"
        });
    }

    if (!["percentage", "fixed"].includes(discountType)) {
        return res.status(400).json({
            message: "discountType must be either 'percentage' or 'fixed'"
        });
    }

    const couponDoc = new CouponModel({
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : 0,
        expiryDate: new Date(expiryDate),
        usageLimit: usageLimit ? Number(usageLimit) : 100
    });

    const savedCoupon = await couponDoc.save();

    res.status(201).json({
        message: "Coupon created successfully",
        payload: savedCoupon
    });
});

// 3. Admin: Update Coupon
couponApp.put("/coupons/:id", verifyToken, verifyRole("admin"), async (req, res) => {
    const updateData = { ...req.body };
    if (updateData.code) updateData.code = updateData.code.trim().toUpperCase();

    const updatedCoupon = await CouponModel.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { returnDocument: "after" }
    );

    if (!updatedCoupon) {
        return res.status(404).json({
            message: "Coupon not found"
        });
    }

    res.status(200).json({
        message: "Coupon updated successfully",
        payload: updatedCoupon
    });
});

// 4. Admin: Delete Coupon
couponApp.delete("/coupons/:id", verifyToken, verifyRole("admin"), async (req, res) => {
    const deletedCoupon = await CouponModel.findByIdAndDelete(req.params.id);

    if (!deletedCoupon) {
        return res.status(404).json({
            message: "Coupon not found"
        });
    }

    res.status(200).json({
        message: "Coupon deleted successfully",
        payload: deletedCoupon
    });
});

// 5. Customer: Validate Coupon against an Order Amount
couponApp.post("/validate", verifyToken, async (req, res) => {
    const { code, orderAmount } = req.body;

    if (!code || orderAmount === undefined) {
        return res.status(400).json({
            message: "Coupon code and orderAmount are required"
        });
    }

    const coupon = await CouponModel.findOne({ code: code.trim().toUpperCase() });
    if (!coupon) {
        return res.status(404).json({
            message: "Invalid coupon code"
        });
    }

    const validation = coupon.calculateDiscount(Number(orderAmount));

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    res.status(200).json({
        message: "Coupon applied successfully",
        payload: {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discount: validation.discount,
            finalAmount: validation.finalAmount
        }
    });
});
