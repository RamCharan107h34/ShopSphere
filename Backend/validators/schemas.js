import { z } from "zod";

// Central request schemas.
//
// These validate and coerce the fields that matter for safety/consistency. Most
// are `.passthrough()` so the handler still receives the rest of the body it
// expects — validation should reject bad input, not silently reshape good input.

export const objectId = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "must be a valid id");

const email = z
    .string()
    .trim()
    .toLowerCase()
    .email("must be a valid email address");

// ---- Auth ---------------------------------------------------------------

export const registerSchema = z
    .object({
        name: z.string().trim().min(2, "must be at least 2 characters").max(80),
        email,
        password: z.string().min(6, "must be at least 6 characters").max(100),
        phone: z.string().trim().max(20).optional(),
        address: z
            .object({
                street: z.string().max(200).optional(),
                city: z.string().max(80).optional(),
                state: z.string().max(80).optional(),
                pincode: z.string().max(12).optional()
            })
            .passthrough()
            .optional()
    })
    .passthrough();

export const loginSchema = z
    .object({
        email,
        password: z.string().min(1, "is required")
    })
    .passthrough();

// ---- Catalog ------------------------------------------------------------

export const productCreateSchema = z
    .object({
        title: z.string().trim().min(3, "must be at least 3 characters").max(160),
        description: z.string().trim().min(10, "must be at least 10 characters"),
        price: z.coerce.number().min(0, "cannot be negative"),
        originalPrice: z.coerce.number().min(0).optional(),
        category: objectId,
        stock: z.coerce.number().int().min(0).optional(),
        lowStockThreshold: z.coerce.number().int().min(0).optional(),
        images: z.array(z.string().trim()).optional(),
        brand: z.string().trim().max(80).optional(),
        sku: z.string().trim().max(60).optional(),
        variants: z
            .array(
                z
                    .object({
                        name: z.string().trim().min(1),
                        sku: z.string().trim().optional(),
                        price: z.coerce.number().min(0),
                        stock: z.coerce.number().int().min(0)
                    })
                    .passthrough()
            )
            .optional(),
        attributes: z
            .array(z.object({ name: z.string().trim(), value: z.string().trim() }).passthrough())
            .optional(),
        aiGeneratedFeatures: z.array(z.string().trim()).optional()
    })
    .passthrough();

export const stockUpdateSchema = z
    .object({
        stock: z.coerce.number().int().min(0).optional(),
        lowStockThreshold: z.coerce.number().int().min(0).optional(),
        variantId: objectId.optional()
    })
    .passthrough()
    .refine((data) => data.stock !== undefined || data.lowStockThreshold !== undefined, {
        message: "stock or lowStockThreshold is required"
    });

// ---- Cart & checkout ----------------------------------------------------

export const cartItemSchema = z
    .object({
        productId: objectId,
        variantId: objectId.optional().nullable(),
        quantity: z.coerce.number().int().min(1).max(99).optional()
    })
    .passthrough();

export const cartQuantitySchema = z
    .object({
        quantity: z.coerce.number().int().min(0).max(99),
        variantId: objectId.optional().nullable()
    })
    .passthrough();

export const checkoutSchema = z
    .object({
        shippingAddress: z
            .object({
                street: z.string().trim().min(3, "is required"),
                city: z.string().trim().min(2, "is required"),
                state: z.string().trim().min(2, "is required"),
                pincode: z.string().trim().min(3, "is required"),
                phone: z.string().trim().min(6, "is required")
            })
            .passthrough(),
        paymentMethod: z.enum(["COD", "CARD", "UPI", "NET_BANKING"]).optional(),
        couponCode: z.string().trim().max(40).optional()
    })
    .passthrough();

// ---- Coupons ------------------------------------------------------------

// Field names mirror the Coupon model (discountType/discountValue), not the
// abstract type/value the PRD sketches — validating a shape the API never
// accepts would reject every real request.
export const couponSchema = z
    .object({
        code: z.string().trim().toUpperCase().min(3, "must be at least 3 characters").max(40),
        discountType: z.enum(["percentage", "fixed"]),
        discountValue: z.coerce.number().positive("must be greater than 0"),
        minOrderAmount: z.coerce.number().min(0).optional(),
        maxDiscount: z.coerce.number().min(0).optional(),
        expiryDate: z.coerce.date({ message: "must be a valid date" }),
        usageLimit: z.coerce.number().int().positive().optional()
    })
    .passthrough()
    .refine(
        (data) => data.discountType !== "percentage" || data.discountValue <= 100,
        { message: "a percentage discount cannot exceed 100", path: ["discountValue"] }
    );

// ---- Returns ------------------------------------------------------------

export const returnRequestSchema = z
    .object({
        orderId: objectId,
        subOrderId: objectId,
        productId: objectId,
        quantity: z.coerce.number().int().min(1).optional(),
        reason: z.string().trim().min(3, "is required").max(120),
        description: z.string().trim().max(1000).optional()
    })
    .passthrough();

// ---- Reviews ------------------------------------------------------------

export const reviewSchema = z
    .object({
        rating: z.coerce.number().min(1, "must be at least 1").max(5, "must be at most 5"),
        comment: z.string().trim().min(3, "must be at least 3 characters").max(2000),
        orderId: objectId
    })
    .passthrough();

// ---- Support ------------------------------------------------------------

export const ticketSchema = z
    .object({
        subject: z.string().trim().min(3, "must be at least 3 characters").max(160),
        description: z.string().trim().min(5, "must be at least 5 characters").max(4000),
        category: z.enum(["general", "order_issue", "dispute", "refund"]).optional(),
        orderId: objectId.optional().nullable(),
        subOrderId: objectId.optional().nullable(),
        priority: z.enum(["low", "medium", "high"]).optional()
    })
    .passthrough();

// ---- AI ----------------------------------------------------------------

export const aiDescriptionSchema = z
    .object({
        title: z.string().trim().min(2, "is required"),
        category: z.string().trim().max(80).optional(),
        brand: z.string().trim().max(80).optional(),
        price: z.union([z.coerce.number(), z.string().trim()]).optional(),
        targetAudience: z.string().trim().max(200).optional(),
        material: z.string().trim().max(400).optional(),
        keywords: z.array(z.string().trim()).optional()
    })
    .passthrough();

export const aiSearchSchema = z
    .object({
        query: z.string().trim().min(1, "is required").max(400),
        limit: z.coerce.number().int().min(1).max(25).optional()
    })
    .passthrough();
