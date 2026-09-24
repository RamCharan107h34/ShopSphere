import mongoose from "mongoose";

// In-app notification. One row per recipient so read state is per-user.
export const notificationSchema = new mongoose.Schema(
    {
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        type: {
            type: String,
            enum: ["order", "delivery", "ticket", "product", "seller", "payout", "system"],
            default: "system"
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            default: ""
        },
        // Frontend route to open when the notification is clicked
        link: {
            type: String,
            default: ""
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        readAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, readAt: 1 });

export const NotificationModel = mongoose.model("Notification", notificationSchema);
