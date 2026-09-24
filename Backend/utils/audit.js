import { AuditLogModel } from "../models/AuditLogModel.js";

// Fire-and-forget audit writer.
//
// Recording history must never be able to break the action it is recording, so
// every failure is swallowed and logged. Callers can `await` it (to keep the
// write ordered relative to the response) without wrapping it in try/catch.
export const recordAudit = async ({
    req,
    action,
    targetType = "",
    targetId = null,
    description = "",
    metadata = {}
} = {}) => {
    try {
        return await AuditLogModel.create({
            actorId: req?.user?.id ?? null,
            actorName: req?.user?.name ?? "",
            actorRole: req?.user?.role ?? "",
            action,
            targetType,
            targetId: targetId || null,
            description,
            metadata,
            ip: req?.ip || req?.headers?.["x-forwarded-for"] || ""
        });
    } catch (error) {
        console.error("Audit log write failed:", error.message);
        return null;
    }
};
