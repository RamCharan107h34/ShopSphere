import exp from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { UserModel } from "../models/UserModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";

export const userApp = exp.Router();

// 1. Register User
userApp.post("/register", async (req, res) => {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email, and password are required"
        });
    }

    if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters long"
        });
    }

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
userApp.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

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

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
        message: "Login successful",
        token,
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
    const userList = await UserModel.find().select("-password");
    res.status(200).json({
        message: "Users list",
        payload: userList
    });
});

// 6. Get User By ID (Admin only)
userApp.get("/users/:id", verifyToken, verifyRole("admin"), async (req, res) => {
    const user = await UserModel.findById(req.params.id).select("-password");
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
    ).select("-password");

    if (!updatedUser) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    res.status(200).json({
        message: "User updated",
        payload: updatedUser
    });
});

// 8. Delete User (Admin only)
userApp.delete("/users/:id", verifyToken, verifyRole("admin"), async (req, res) => {
    const deletedUser = await UserModel.findByIdAndDelete(req.params.id).select("-password");

    if (!deletedUser) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    res.status(200).json({
        message: "User deleted",
        payload: deletedUser
    });
});
