export const verifyRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                message: "Unauthorized: User information not found"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Forbidden: Access restricted to [${allowedRoles.join(", ")}]`
            });
        }

        next();
    };
};
