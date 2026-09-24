import exp from "express";
import bcrypt from "bcryptjs";

import { UserModel } from "../models/UserModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";
import { validate } from "../middlewares/validate.js";
import { authLimiter, refreshLimiter } from "../middlewares/rateLimit.js";
import { registerSchema, loginSchema } from "../validators/schemas.js";
import { recordAudit } from "../utils/audit.js";
import {
    signAccessToken,
    generateRefreshToken,
    hashToken,
    refreshTokenExpiry,
    refreshCookieOptions,
    ACCESS_TOKEN_TTL
} from "../utils/tokens.js";

export const userApp = exp.Router();

const accessCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 60 * 1000
});

// Start a new refresh session for an account and return the raw token.
// Expired entries are pruned here so the array cannot grow without bound.
const issueRefreshSession = async (user, userAgent = "") => {
    const token = generateRefreshToken();
    const now = new Date();

    user.refreshTokens = (user.refreshTokens || []).filter((entry) => entry.expiresAt > now);
    user.refreshTokens.push({
        tokenHash: hashToken(token),
        userAgent: String(userAgent || "").slice(0, 200),
        expiresAt: refreshTokenExpiry()
    });
    await user.save();

    return token;
};

// 1. Register User
// Rate limited as an auth route; the schema enforces email shape and a minimum
// password length, and role is never taken from the body.
userApp.post("/register", authLimiter, validate({ body: registerSchema }), async (req, res) => {
    const { name, email, password, phone, address } = req.body;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (duplicate email automatically handled by error middleware via code 11000)
    // Role is ALWAYS server-assigned — never trust a client-supplied role, otherwise
    // anyone could self-register as admin/seller.
    const userDoc = new UserModel({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "customer",
        phone: phone || "",
        address: address || {}
    });

    const savedUser = await userDoc.save();

    res.status(201).json({
        message: "User registered successfully",
        payload: {
            _id: savedUser._id,
            name: savedUser.name,
            email: savedUser.email,
            role: savedUser.role
        }
    });
});

// 2. Login User
userApp.post("/login", authLimiter, validate({ body: loginSchema }), async (req, res) => {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    if (!user.isActive) {
        return res.status(403).json({
            message: "Your account is inactive or suspended. Contact support."
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    const payload = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    };

    // Short-lived access token + long-lived rotating refresh token.
    const token = signAccessToken(payload);
    const refreshToken = await issueRefreshSession(user, req.headers["user-agent"]);

    res.cookie("token", token, accessCookieOptions());
    res.cookie("refreshToken", refreshToken, refreshCookieOptions());

    res.status(200).json({
        message: "Login successful",
        token,
        refreshToken,
        expiresIn: ACCESS_TOKEN_TTL,
        payload: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address
        }
    });
});

// 2b. Refresh Access Token
//
// Rotating refresh tokens: the presented token is retired as it is exchanged, so
// a stolen copy stops working the moment the legitimate client refreshes.
userApp.post("/refresh", refreshLimiter, async (req, res) => {
    const presented = req.body?.refreshToken || req.cookies?.refreshToken;

    if (!presented) {
        return res.status(401).json({
            message: "No refresh token provided. Please sign in again."
        });
    }

    const presentedHash = hashToken(presented);
    const user = await UserModel.findOne({ "refreshTokens.tokenHash": presentedHash });

    if (!user) {
        return res.status(401).json({
            message: "Invalid refresh token. Please sign in again."
        });
    }

    if (!user.isActive) {
        return res.status(403).json({
            message: "Your account is inactive or suspended. Contact support."
        });
    }

    const now = new Date();
    const session = user.refreshTokens.find(
        (entry) => entry.tokenHash === presentedHash && entry.expiresAt > now
    );

    if (!session) {
        return res.status(401).json({
            message: "Refresh token has expired. Please sign in again."
        });
    }

    const rotated = generateRefreshToken();
    user.refreshTokens = user.refreshTokens.filter(
        (entry) => entry.expiresAt > now && entry.tokenHash !== presentedHash
    );
    user.refreshTokens.push({
        tokenHash: hashToken(rotated),
        userAgent: session.userAgent || "",
        expiresAt: refreshTokenExpiry()
    });
    await user.save();

    const token = signAccessToken({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    });

    res.cookie("token", token, accessCookieOptions());
    res.cookie("refreshToken", rotated, refreshCookieOptions());

    res.status(200).json({
        message: "Token refreshed",
        token,
        refreshToken: rotated,
        expiresIn: ACCESS_TOKEN_TTL,
        payload: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address
        }
    });
});

// 2c. Logout — revokes the refresh session server-side, so clearing local
// storage is no longer the only thing standing between a token and reuse.
userApp.post("/logout", async (req, res) => {
    const presented = req.body?.refreshToken || req.cookies?.refreshToken;

    if (presented) {
        await UserModel.updateOne(
            { "refreshTokens.tokenHash": hashToken(presented) },
            { $pull: { refreshTokens: { tokenHash: hashToken(presented) } } }
        );
    }

    res.clearCookie("token");
    res.clearCookie("refreshToken", { path: "/" });

    res.status(200).json({ message: "Logged out" });
});

// 3. Get Current User Profile (Protected)
userApp.get("/profile", verifyToken, async (req, res) => {
    const user = await UserModel.findById(req.user.id).select("-password");
    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    res.status(200).json({
        message: "User profile fetched",
        payload: user
    });
});

// 4. Update Current User Profile (Protected)
userApp.put("/profile", verifyToken, async (req, res) => {
    const { name, phone, address } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
        req.user.id,
        {
            $set: {
                ...(name && { name }),
                ...(phone !== undefined && { phone }),
                ...(address && { address })
            }
        },
        { returnDocument: "after" }
    ).select("-password");

    res.status(200).json({
        message: "Profile updated successfully",
        payload: updatedUser
    });
});

// 5. Get All Users (Admin only)
userApp.get("/users", verifyToken, verifyRole("admin"), async (req, res) => {
    const userList = await UserModel.find().select("-password -refreshTokens");
    res.status(200).json({
        message: "Users list",
        payload: userList
    });
});

// 6. Get User By ID (Admin only)
userApp.get("/users/:id", verifyToken, verifyRole("admin"), async (req, res) => {
    const user = await UserModel.findById(req.params.id).select("-password -refreshTokens");
    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    res.status(200).json({
        message: "User details",
        payload: user
    });
});

// 7. Update User (Admin only)
userApp.put("/users/:id", verifyToken, verifyRole("admin"), async (req, res) => {
    const modifiedData = req.body;
    delete modifiedData.password;

    const updatedUser = await UserModel.findByIdAndUpdate(
        req.params.id,
        { $set: { ...modifiedData } },
        { returnDocument: "after" }
    ).select("-password -refreshTokens");

    if (!updatedUser) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    await recordAudit({
        req,
        action: "user.update",
        targetType: "User",
        targetId: updatedUser._id,
        description: `Updated account ${updatedUser.email}`,
        // Keep the trail useful without dumping the whole document.
        metadata: { fields: Object.keys(modifiedData) }
    });

    res.status(200).json({
        message: "User updated",
        payload: updatedUser
    });
});

// 8. Delete User (Admin only)
userApp.delete("/users/:id", verifyToken, verifyRole("admin"), async (req, res) => {
    const deletedUser = await UserModel.findByIdAndDelete(req.params.id).select("-password -refreshTokens");

    if (!deletedUser) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    await recordAudit({
        req,
        action: "user.delete",
        targetType: "User",
        targetId: deletedUser._id,
        description: `Deleted account ${deletedUser.email} (${deletedUser.role})`
    });

    res.status(200).json({
        message: "User deleted",
        payload: deletedUser
    });
});
