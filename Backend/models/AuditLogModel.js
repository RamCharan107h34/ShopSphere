import mongoose from "mongoose";

// Immutable record of an admin-sensitive action (approvals, moderation,
// refunds, settlement payouts, user changes). Read-only once written.
export const auditLogSchema = new mongoose.Schema(
    {
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        actorName: {
            type: String,
            default: ""
        },
        actorRole: {
            type: String,
            default: ""
        },
        // Dotted verb form keeps grouping/filtering simple: "seller.approve"
        action: {
            type: String,
            required: true,
            trim: true
        },
        targetType: {
            type: String,
            default: ""
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        description: {
            type: String,
            default: ""
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        ip: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ action: 1 });

export const AuditLogModel = mongoose.model("AuditLog", auditLogSchema);
