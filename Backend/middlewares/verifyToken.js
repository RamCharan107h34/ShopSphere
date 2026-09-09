import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
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
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token. Please log in again.",
            error: error.message
        });
    }
};
