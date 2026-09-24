import jwt from "jsonwebtoken";

import { UserModel } from "../models/UserModel.js";

export const verifyToken = async (req, res, next) => {
    try {
        let token = null;

        // 1. Check Authorization header
        const authHeader = req.headers["authorization"] || req.headers["Authorization"];
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else if (req.cookies && req.cookies.token) {
            // 2. Check cookies
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                message: "Authentication token missing. Please log in."
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // The token carries the role it was issued with at login time, but roles
        // change while a token is still valid (e.g. a customer becomes a seller
        // the moment an admin approves their store application). Re-read the
        // account so authorization always uses the current role.
        const account = await UserModel.findById(decoded.id).select("role isActive");
        if (!account) {
            return res.status(401).json({
                message: "Account no longer exists. Please log in again."
            });
        }

        if (!account.isActive) {
            return res.status(403).json({
                message: "Your account is inactive or suspended. Contact support."
            });
        }

        req.user = { ...decoded, role: account.role };
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token. Please log in again.",
            error: error.message
        });
    }
};
