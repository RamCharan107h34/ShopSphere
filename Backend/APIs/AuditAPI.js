import exp from "express";

import { AuditLogModel } from "../models/AuditLogModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";

export const auditApp = exp.Router();

const pageParams = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 25, 1), 100);
    return { page, limit, skip: (page - 1) * limit };
};

// 1. Admin: paginated audit trail with the filters an investigation actually
//    needs (who, what action, what kind of target, which record, when).
//    Read-only by design — the collection is append-only from the app's side.
auditApp.get("/admin/audit-logs", verifyToken, verifyRole("admin"), async (req, res) => {
    const { page, limit, skip } = pageParams(req.query);

    const filter = {};
    if (req.query.actorId) filter.actorId = req.query.actorId;
    if (req.query.actorRole) filter.actorRole = req.query.actorRole;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.targetType) filter.targetType = req.query.targetType;
    if (req.query.targetId) filter.targetId = req.query.targetId;

    if (req.query.search) {
        // Escaped so a user-typed "(" cannot break the regex.
        const safe = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const rx = new RegExp(safe, "i");
        filter.$or = [{ description: rx }, { actorName: rx }, { action: rx }];
    }

    if (req.query.from || req.query.to) {
        filter.createdAt = {};
        if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
        if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }

    const [logs, totalCount] = await Promise.all([
        AuditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        AuditLogModel.countDocuments(filter)
    ]);

    res.status(200).json({
        message: "Audit logs fetched",
        payload: {
            logs,
            totalCount,
            totalPages: Math.ceil(totalCount / limit) || 1,
            currentPage: page
        }
    });
});

// 2. Admin: the distinct action verbs present, so the viewer can offer a
//    filter dropdown built from real data rather than a hardcoded list.
auditApp.get("/admin/audit-logs/actions", verifyToken, verifyRole("admin"), async (req, res) => {
    const actions = await AuditLogModel.distinct("action");

    res.status(200).json({
        message: "Audit actions",
        payload: actions.sort()
    });
});
