import exp from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "node:http";

import { connectDB } from "./config/db.js";
import { userApp } from "./APIs/UserAPI.js";
import { sellerApp } from "./APIs/SellerAPI.js";
import { categoryApp } from "./APIs/CategoryAPI.js";
import { productApp } from "./APIs/ProductAPI.js";
import { cartApp } from "./APIs/CartAPI.js";
import { wishlistApp } from "./APIs/WishlistAPI.js";
import { orderApp } from "./APIs/OrderAPI.js";
import { returnApp } from "./APIs/ReturnAPI.js";
import { reviewApp } from "./APIs/ReviewAPI.js";
import { couponApp } from "./APIs/CouponAPI.js";
import { supportApp } from "./APIs/SupportAPI.js";
import { deliveryApp } from "./APIs/DeliveryAPI.js";
import { analyticsApp } from "./APIs/AnalyticsAPI.js";
import { aiApp } from "./APIs/AIAPI.js";

config();

const app = exp();

const server = createServer(app);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));

app.use(exp.json());
app.use(cookieParser());
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/user-api", userApp);
app.use("/seller-api", sellerApp);
app.use("/category-api", categoryApp);
app.use("/product-api", productApp);
app.use("/cart-api", cartApp);
app.use("/wishlist-api", wishlistApp);
app.use("/order-api", orderApp);
app.use("/return-api", returnApp);
app.use("/review-api", reviewApp);
app.use("/coupon-api", couponApp);
app.use("/support-api", supportApp);
app.use("/delivery-api", deliveryApp);
app.use("/analytics-api", analyticsApp);
app.use("/ai-api", aiApp);

// Basic route
app.get("/", (req, res) => {
    res.send("ShopSphere API is running");
});

// to handle invalid path
app.use((req, res, next) => {
    console.log(req.url);
    res.status(404).json({ message: `Path ${req.url} is invalid` });
});

// Error handling middleware
app.use((err, req, res, next) => {
    // console.log("Error name:", err.name);
    // console.log("Error code:", err.code);
    // console.log("Error cause:", err.cause);
    // console.log("Full error:", JSON.stringify(err, null, 2));
    console.log(err);

    // ValidationError
    if (err.name === "ValidationError") {
        return res.status(400).json({ message: "error occurred", error: err.message });
    }

    // CastError
    if (err.name === "CastError") {
        return res.status(400).json({ message: "error occurred", error: err.message });
    }

    const errCode = err.code ?? err.cause?.code ?? err.errorResponse?.code;
    const keyValue = err.keyValue ?? err.cause?.keyValue ?? err.errorResponse?.keyValue;

    if (errCode === 11000) {
        const field = Object.keys(keyValue)[0];
        const value = keyValue[field];
        return res.status(409).json({
            message: "error occurred",
            error: `${field} "${value}" already exists`,
        });
    }

    // send server side error
    res.status(err.status || err.statusCode || 500).json({ message: "error occurred", error: err.message ?? err.body });
});

// Database + Server
const PORT = parseInt(process.env.PORT, 10) || 3000;

const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

startServer();
