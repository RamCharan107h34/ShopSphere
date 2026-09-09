import exp from "express";

import { OrderModel } from "../models/OrderModel.js";
import { ProductModel } from "../models/ProductModel.js";
import { StoreModel } from "../models/StoreModel.js";
import { UserModel } from "../models/UserModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";

export const analyticsApp = exp.Router();

// 1. Seller Analytics Summary (Seller only)
analyticsApp.get("/seller/summary", verifyToken, verifyRole("seller"), async (req, res) => {
    const store = await StoreModel.findOne({ sellerId: req.user.id });
    if (!store) {
        return res.status(404).json({
            message: "Store not found for this seller"
        });
    }

    const storeId = store._id;

    // All orders that contain this store's vendor sub-orders
    const orders = await OrderModel.find({ "vendorOrders.storeId": storeId });

    let totalSales = 0;
    let totalOrders = 0;
    let pendingOrders = 0;

    for (const order of orders) {
        for (const vo of order.vendorOrders) {
            if (vo.storeId.toString() === storeId.toString()) {
                totalOrders += 1;
                if (vo.status === "delivered") {
                    totalSales += vo.subtotal;
                } else if (vo.status !== "cancelled") {
                    pendingOrders += 1;
                }
            }
        }
    }

    // Product inventory stats (computed in JS so low-stock can use each product's own threshold)
    const products = await ProductModel.find(
        { sellerId: req.user.id },
        "title stock lowStockThreshold status"
    );

    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === "active").length;
    const outOfStockProducts = products.filter(p => p.stock === 0).length;
    const lowStockProducts = products.filter(
        p => p.stock > 0 && p.stock <= p.lowStockThreshold
    ).length;

    // Best-selling products by quantity sold (excludes cancelled sub-orders)
    const bestSellers = await OrderModel.aggregate([
        { $match: { "vendorOrders.storeId": storeId } },
        { $unwind: "$vendorOrders" },
        { $match: { "vendorOrders.storeId": storeId, "vendorOrders.status": { $ne: "cancelled" } } },
        { $unwind: "$vendorOrders.items" },
        {
            $group: {
                _id: "$vendorOrders.items.productId",
                title: { $first: "$vendorOrders.items.title" },
                quantitySold: { $sum: "$vendorOrders.items.quantity" },
                revenue: {
                    $sum: {
                        $multiply: ["$vendorOrders.items.price", "$vendorOrders.items.quantity"]
                    }
                }
            }
        },
        { $sort: { quantitySold: -1 } },
        { $limit: 5 }
    ]);

    // Latest 5 orders for this seller's store
    const recentOrders = orders
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map(order => {
            const mySubOrder = order.vendorOrders.find(
                vo => vo.storeId.toString() === storeId.toString()
            );

            return {
                _id: order._id,
                orderNumber: order.orderNumber,
                createdAt: order.createdAt,
                overallStatus: order.overallStatus,
                subOrder: {
                    _id: mySubOrder._id,
                    status: mySubOrder.status,
                    subtotal: mySubOrder.subtotal,
                    itemsCount: mySubOrder.items.length
                }
            };
        });

    res.status(200).json({
        message: "Seller analytics summary",
        payload: {
            totalSales,
            totalOrders,
            pendingOrders,
            totalProducts,
            activeProducts,
            outOfStockProducts,
            lowStockProducts,
            bestSellers,
            recentOrders
        }
    });
});

// 2. Admin Platform Summary (Admin only)
analyticsApp.get("/admin/summary", verifyToken, verifyRole("admin"), async (req, res) => {
    const [
        totalCustomers,
        totalSellers,
        totalProducts,
        activeProducts,
        totalOrders,
        pendingApplications,
        revenueResult,
        orderStatusBreakdown,
        topStores,
        bestSellers
    ] = await Promise.all([
        UserModel.countDocuments({ role: "customer" }),
        UserModel.countDocuments({ role: "seller" }),
        ProductModel.countDocuments(),
        ProductModel.countDocuments({ status: "active" }),
        OrderModel.countDocuments(),
        StoreModel.countDocuments({ status: "pending" }),
        OrderModel.aggregate([
            { $match: { overallStatus: "delivered" } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
        ]),
        OrderModel.aggregate([
            { $group: { _id: "$overallStatus", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),
        OrderModel.aggregate([
            { $unwind: "$vendorOrders" },
            { $match: { "vendorOrders.status": "delivered" } },
            {
                $group: {
                    _id: "$vendorOrders.storeId",
                    revenue: { $sum: "$vendorOrders.subtotal" },
                    ordersCount: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "stores",
                    localField: "_id",
                    foreignField: "_id",
                    as: "store"
                }
            },
            { $unwind: "$store" },
            {
                $project: {
                    storeId: "$_id",
                    storeName: "$store.storeName",
                    revenue: 1,
                    ordersCount: 1
                }
            }
        ]),
        OrderModel.aggregate([
            { $unwind: "$vendorOrders" },
            { $match: { "vendorOrders.status": { $ne: "cancelled" } } },
            { $unwind: "$vendorOrders.items" },
            {
                $group: {
                    _id: "$vendorOrders.items.productId",
                    title: { $first: "$vendorOrders.items.title" },
                    quantitySold: { $sum: "$vendorOrders.items.quantity" },
                    revenue: {
                        $sum: {
                            $multiply: ["$vendorOrders.items.price", "$vendorOrders.items.quantity"]
                        }
                    }
                }
            },
            { $sort: { quantitySold: -1 } },
            { $limit: 5 }
        ])
    ]);

    const totalRevenue = revenueResult.length ? revenueResult[0].totalRevenue : 0;

    // Latest 5 platform orders
    const recentOrders = await OrderModel.find()
        .populate("customerId", "name email")
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderNumber totalAmount overallStatus paymentStatus createdAt customerId");

    res.status(200).json({
        message: "Platform analytics summary",
        payload: {
            totalCustomers,
            totalSellers,
            totalProducts,
            activeProducts,
            totalOrders,
            totalRevenue,
            pendingApplications,
            orderStatusBreakdown,
            topStores,
            bestSellers,
            recentOrders
        }
    });
});