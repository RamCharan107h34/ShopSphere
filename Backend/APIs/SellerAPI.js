import exp from "express";

import { StoreModel } from "../models/StoreModel.js";
import { SellerModel } from "../models/SellerModel.js";
import { UserModel } from "../models/UserModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";
import { upload } from "../config/upload.js";
import { uploadToCloudinary } from "../config/cloudinaryUpload.js";
import { recordAudit } from "../utils/audit.js";
import { notify, notifyMany } from "../utils/notify.js";

export const sellerApp = exp.Router();

// Only these payout keys may be written by a seller — anything else in the body
// is ignored rather than persisted verbatim.
const pickPayoutDetails = (input = {}) => {
    const allowed = ["accountHolder", "bankName", "accountNumberLast4", "ifsc", "upiId"];
    const picked = {};
    for (const key of allowed) {
        if (input[key] !== undefined) picked[key] = String(input[key]).trim();
    }
    return picked;
};

// 1. Submit Seller & Store Application (Authenticated Customer)
sellerApp.post("/apply", verifyToken, async (req, res) => {
    const {
        storeName,
        description,
        logo,
        banner,
        contactEmail,
        contactPhone,
        address,
        businessRegistrationNumber,
        taxId,
        bankDetails,
        applicationNotes
    } = req.body;

    if (!storeName) {
        return res.status(400).json({
            message: "Store name is required"
        });
    }

    const existingStore = await StoreModel.findOne({ sellerId: req.user.id });
    if (existingStore) {
        return res.status(400).json({
            message: `You already have an application with status: ${existingStore.status}`
        });
    }

    const nameTaken = await StoreModel.findOne({ storeName: storeName.trim() });
    if (nameTaken) {
        return res.status(400).json({
            message: "A store with this name already exists. Choose a unique name."
        });
    }

    const storeDoc = new StoreModel({
        sellerId: req.user.id,
        storeName: storeName.trim(),
        description: description || "",
        logo: logo || "",
        banner: banner || "",
        contactEmail: contactEmail || req.user.email,
        contactPhone: contactPhone || "",
        address: address || {},
        status: "pending"
    });

    const savedStore = await storeDoc.save();

    const sellerDoc = new SellerModel({
        userId: req.user.id,
        storeId: savedStore._id,
        businessRegistrationNumber: businessRegistrationNumber || "",
        taxId: taxId || "",
        bankDetails: bankDetails || {},
        applicationNotes: applicationNotes || ""
    });

    await sellerDoc.save();

    // Let every admin know there is something in the approval queue.
    const admins = await UserModel.find({ role: "admin" }).select("_id");
    await notifyMany(
        admins.map((admin) => admin._id),
        {
            type: "seller",
            title: "New seller application",
            message: `${savedStore.storeName} is awaiting review.`,
            link: "/admin/sellers",
            entityId: savedStore._id
        }
    );

    res.status(201).json({
        message: "Seller application submitted successfully. Awaiting platform admin approval.",
        payload: savedStore
    });
});

// 2. Get All Approved Stores (Public)
sellerApp.get("/stores", async (req, res) => {
    const stores = await StoreModel.find({ status: "approved" })
        .select("-commissionRate -payoutDetails")
        .populate("sellerId", "name email");

    res.status(200).json({
        message: "Approved stores list",
        payload: stores
    });
});

// 3. Get Store By ID (Public)
sellerApp.get("/stores/:id", async (req, res) => {
    const store = await StoreModel.findById(req.params.id)
        .select("-commissionRate -payoutDetails")
        .populate("sellerId", "name email");

    if (!store) {
        return res.status(404).json({
            message: "Store not found"
        });
    }

    res.status(200).json({
        message: "Store details",
        payload: store
    });
});

// 4. Get Current Logged-in Seller's Store (Seller only)
sellerApp.get("/my-store", verifyToken, verifyRole("seller", "admin"), async (req, res) => {
    const store = await StoreModel.findOne({ sellerId: req.user.id });
    if (!store) {
        return res.status(404).json({
            message: "No store found for this seller account"
        });
    }

    const sellerDetails = await SellerModel.findOne({ storeId: store._id });

    res.status(200).json({
        message: "Seller store profile fetched",
        payload: {
            store,
            sellerDetails
        }
    });
});

// 5. Update Current Seller's Store Profile (Seller only)
sellerApp.put("/my-store", verifyToken, verifyRole("seller"), async (req, res) => {
    const { storeName, description, logo, banner, contactEmail, contactPhone, address, payoutDetails } = req.body;

    const updatedStore = await StoreModel.findOneAndUpdate(
        { sellerId: req.user.id },
        {
            $set: {
                ...(storeName && { storeName: storeName.trim() }),
                ...(description !== undefined && { description }),
                ...(logo && { logo }),
                ...(banner && { banner }),
                ...(contactEmail && { contactEmail }),
                ...(contactPhone !== undefined && { contactPhone }),
                ...(address && { address }),
                ...(payoutDetails && { payoutDetails: pickPayoutDetails(payoutDetails) })
            }
        },
        { returnDocument: "after" }
    );

    if (!updatedStore) {
        return res.status(404).json({
            message: "Store profile not found"
        });
    }

    res.status(200).json({
        message: "Store profile updated successfully",
        payload: updatedStore
    });
});

// 6. Upload Store Image - logo or banner (Seller only)
sellerApp.post("/upload-image", verifyToken, verifyRole("seller"), upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: "No image file uploaded. Send the file in a field named 'image'."
        });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    res.status(200).json({
        message: "Image uploaded successfully",
        payload: {
            imageUrl: result.secure_url
        }
    });
});

// 7. View All Seller Applications (Admin only)
sellerApp.get("/admin/applications", verifyToken, verifyRole("admin"), async (req, res) => {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const applications = await StoreModel.find(filter)
        .populate("sellerId", "name email role createdAt")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "Seller applications list",
        payload: applications
    });
});

// 8. Moderate Seller Application: Approve or Reject (Admin only)
sellerApp.put("/admin/moderate/:storeId", verifyToken, verifyRole("admin"), async (req, res) => {
    const { status, rejectionReason, commissionRate } = req.body;

    if (!["approved", "rejected", "pending"].includes(status)) {
        return res.status(400).json({
            message: "Status must be 'approved', 'rejected', or 'pending'"
        });
    }

    const store = await StoreModel.findById(req.params.storeId);
    if (!store) {
        return res.status(404).json({
            message: "Store not found"
        });
    }

    store.status = status;
    if (rejectionReason) store.rejectionReason = rejectionReason;
    if (commissionRate !== undefined) store.commissionRate = commissionRate;

    await store.save();

    if (status === "approved") {
        await UserModel.findByIdAndUpdate(store.sellerId, { role: "seller" });
    }

    await recordAudit({
        req,
        action: `seller.${status}`,
        targetType: "Store",
        targetId: store._id,
        description: `${store.storeName} ${status} by admin`,
        metadata: {
            storeName: store.storeName,
            status,
            rejectionReason: store.rejectionReason || "",
            commissionRate: store.commissionRate
        }
    });

    await notify({
        recipientId: store.sellerId,
        type: "seller",
        title: `Store application ${status}`,
        message:
            status === "approved"
                ? "Your store is live. You can start listing products."
                : status === "rejected"
                  ? `Reason: ${store.rejectionReason || "Not specified"}`
                  : "Your application has been moved back to pending review.",
        link: "/seller/store",
        entityId: store._id
    });

    res.status(200).json({
        message: `Seller application has been ${status}`,
        payload: store
    });
});
