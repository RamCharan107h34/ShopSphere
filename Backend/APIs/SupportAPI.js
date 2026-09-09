import exp from "express";

import { SupportModel } from "../models/SupportModel.js";
import { OrderModel } from "../models/OrderModel.js";
import { UserModel } from "../models/UserModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";

export const supportApp = exp.Router();

// 1. Any logged-in user: Raise a Support Ticket
supportApp.post("/tickets", verifyToken, async (req, res) => {
    const { category = "general", subject, description, orderId, subOrderId, priority = "medium" } = req.body;

    if (!subject || !description) {
        return res.status(400).json({
            message: "Subject and description are required"
        });
    }

    // If the ticket is linked to an order, the order must belong to the creator
    if (orderId && req.user.role !== "admin") {
        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }
        if (order.customerId.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Access forbidden: You can only raise tickets for your own orders"
            });
        }
    }

    const ticketDoc = new SupportModel({
        customerId: req.user.id,
        category,
        subject: subject.trim(),
        description,
        orderId: orderId || null,
        subOrderId: subOrderId || null,
        priority
    });

    const savedTicket = await ticketDoc.save();

    res.status(201).json({
        message: "Support ticket created successfully",
        payload: savedTicket
    });
});

// 2. Logged-in user: Get My Own Tickets
supportApp.get("/my-tickets", verifyToken, async (req, res) => {
    const { status } = req.query;
    const filter = { customerId: req.user.id };
    if (status) filter.status = status;

    const tickets = await SupportModel.find(filter)
        .populate("orderId", "orderNumber totalAmount")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "My support tickets",
        payload: tickets
    });
});

// 3. Support / Admin: View All Tickets (with optional status & category filters)
supportApp.get("/tickets", verifyToken, verifyRole("support", "admin"), async (req, res) => {
    const { status, category, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const tickets = await SupportModel.find(filter)
        .populate("customerId", "name email phone")
        .populate("orderId", "orderNumber totalAmount")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "Support tickets list",
        payload: tickets
    });
});

// 4. Support / Admin / Owner: Get Single Ticket Details
supportApp.get("/tickets/:id", verifyToken, async (req, res) => {
    const ticket = await SupportModel.findById(req.params.id)
        .populate("customerId", "name email phone")
        .populate("orderId", "orderNumber totalAmount")
        .populate("assignedTo", "name email");

    if (!ticket) {
        return res.status(404).json({
            message: "Ticket not found"
        });
    }

    // Support staff can view all tickets; everyone else only their own
    const isStaff = ["support", "admin"].includes(req.user.role);
    const isOwner = ticket.customerId._id.toString() === req.user.id;

    if (!isStaff && !isOwner) {
        return res.status(403).json({
            message: "Access forbidden: You can only view your own tickets"
        });
    }

    res.status(200).json({
        message: "Support ticket details",
        payload: ticket
    });
});

// 5. Support / Admin: List Available Support Agents (for assignment)
supportApp.get("/agents", verifyToken, verifyRole("support", "admin"), async (req, res) => {
    const agents = await UserModel.find({ role: "support", isActive: true })
        .select("name email phone");

    res.status(200).json({
        message: "Support agents list",
        payload: agents
    });
});

// 6. Support / Admin: Assign Ticket to a Support Agent
supportApp.put("/tickets/:id/assign", verifyToken, verifyRole("support", "admin"), async (req, res) => {
    const { supportAgentId } = req.body;

    if (!supportAgentId) {
        return res.status(400).json({
            message: "supportAgentId is required"
        });
    }

    const agent = await UserModel.findById(supportAgentId);
    if (!agent || agent.role !== "support") {
        return res.status(400).json({
            message: "Invalid support agent. Pick an active user with role 'support'."
        });
    }

    const ticket = await SupportModel.findById(req.params.id);
    if (!ticket) {
        return res.status(404).json({
            message: "Ticket not found"
        });
    }

    ticket.assignedTo = agent._id;
    await ticket.save();

    res.status(200).json({
        message: `Ticket assigned to ${agent.name}`,
        payload: ticket
    });
});

// 7. Support / Admin: Update Ticket Status (with state machine guards)
supportApp.put("/tickets/:id/status", verifyToken, verifyRole("support", "admin"), async (req, res) => {
    const { status, resolutionNote } = req.body;

    const validStatuses = ["open", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
        });
    }

    const ticket = await SupportModel.findById(req.params.id);
    if (!ticket) {
        return res.status(404).json({
            message: "Ticket not found"
        });
    }

    // State machine guards
    const allowedTransitions = {
        open: ["in_progress", "closed"],
        in_progress: ["resolved", "closed"],
        resolved: ["closed"],
        closed: ["open"]
    };

    if (!allowedTransitions[ticket.status].includes(status)) {
        return res.status(400).json({
            message: `Invalid state transition from '${ticket.status}' to '${status}'`
        });
    }

    ticket.status = status;

    // Auto-assign the acting support agent when a ticket is picked up
    if (status === "in_progress" && !ticket.assignedTo && req.user.role === "support") {
        ticket.assignedTo = req.user.id;
    }

    if (resolutionNote) {
        ticket.resolutionNote = resolutionNote;
    }

    await ticket.save();

    res.status(200).json({
        message: `Ticket status updated to '${status}'`,
        payload: ticket
    });
});

// 8. Owner / Support / Admin: Reply on a Ticket (conversation thread)
supportApp.post("/tickets/:id/replies", verifyToken, async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({
            message: "Message is required"
        });
    }

    const ticket = await SupportModel.findById(req.params.id);
    if (!ticket) {
        return res.status(404).json({
            message: "Ticket not found"
        });
    }

    // Customers can reply only on their own tickets; support/admin on any ticket
    const isOwner = ticket.customerId.toString() === req.user.id;
    const isStaff = ["support", "admin"].includes(req.user.role);

    if (!isOwner && !isStaff) {
        return res.status(403).json({
            message: "Access forbidden: You are not a participant in this ticket"
        });
    }

    ticket.messages.push({
        senderId: req.user.id,
        senderName: req.user.name,
        senderRole: req.user.role,
        message: message.trim()
    });

    await ticket.save();

    res.status(201).json({
        message: "Reply added successfully",
        payload: ticket
    });
});
