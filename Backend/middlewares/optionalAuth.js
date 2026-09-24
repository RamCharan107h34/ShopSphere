import jwt from "jsonwebtoken";

import { UserModel } from "../models/UserModel.js";

// Non-blocking sibling of verifyToken, for public endpoints that simply get
// better when a session is present (personalized recommendations, view history).
// A valid token attaches req.user; a missing, expired, invalid, or inactive-account
// token is not an error — the request continues as an anonymous guest with
// req.user undefined. Never use this for authorization, only for personalization.
export const optionalAuth = async (req, res, next) => {
    try {
        let token = null;

        const authHeader = req.headers["authorization"] || req.headers["Authorization"];
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Re-read the account like verifyToken does, so a role change or a
            // deactivated account is respected even mid-token.
            const account = await UserModel.findById(decoded.id).select("role isActive");
            if (account && account.isActive) {
                req.user = { ...decoded, role: account.role };
            }
        }
    } catch {
        // Any token problem is fine here — fall through as a guest.
    }

    next();
};
