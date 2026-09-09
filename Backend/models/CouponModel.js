import mongoose from "mongoose";

export const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        discountType: {
            type: String,
            enum: ["percentage", "fixed"],
            required: true
        },
        discountValue: {
            type: Number,
            required: true,
            min: 1
        },
        minOrderAmount: {
            type: Number,
            default: 0
        },
        maxDiscount: {
            type: Number,
            default: 0 // 0 means no cap
        },
        expiryDate: {
            type: Date,
            required: true
        },
        usageLimit: {
            type: Number,
            default: 100 // Maximum total redemptions
        },
        usedCount: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Helper method to validate coupon eligibility against an amount
couponSchema.methods.calculateDiscount = function (orderAmount) {
    if (!this.isActive) {
        return { valid: false, message: "This coupon is currently inactive" };
    }

    if (new Date() > new Date(this.expiryDate)) {
        return { valid: false, message: "This coupon has expired" };
    }

    if (this.usedCount >= this.usageLimit) {
        return { valid: false, message: "This coupon usage limit has been reached" };
    }

    if (orderAmount < this.minOrderAmount) {
        return {
            valid: false,
            message: `Minimum order amount of $${this.minOrderAmount} required to use this coupon`
        };
    }

    let discount = 0;
    if (this.discountType === "percentage") {
        discount = (orderAmount * this.discountValue) / 100;
        if (this.maxDiscount > 0 && discount > this.maxDiscount) {
            discount = this.maxDiscount;
        }
    } else if (this.discountType === "fixed") {
        discount = Math.min(this.discountValue, orderAmount);
    }

    return {
        valid: true,
        discount: Number(discount.toFixed(2)),
        finalAmount: Number((orderAmount - discount).toFixed(2))
    };
};

export const CouponModel = mongoose.model("Coupon", couponSchema);
