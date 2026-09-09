import mongoose from "mongoose";

// One message inside a support ticket conversation
export const supportMessageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        senderName: {
            type: String,
            required: true
        },
        senderRole: {
            type: String,
            default: ""
        },
        message: {
            type: String,
            required: true
        }
    },
    { _id: true, timestamps: true }
);

export const supportSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        category: {
            type: String,
            enum: ["general", "order_issue", "dispute", "refund"],
            default: "general"
        },
        subject: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null
        },
        subOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        status: {
            type: String,
            enum: ["open", "in_progress", "resolved", "closed"],
            default: "open"
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        resolutionNote: {
            type: String,
            default: ""
        },
        messages: [supportMessageSchema]
    },
    {
        timestamps: true
    }
);

export const SupportModel = mongoose.model("SupportTicket", supportSchema);
