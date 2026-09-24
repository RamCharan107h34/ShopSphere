import rateLimit from "express-rate-limit";

// Shared response shape. Matches the rest of the API so the frontend's
// getErrorMessage() surfaces the message without special-casing 429.
const limited = (message) => (req, res) => res.status(429).json({ message });

// Credential endpoints: tight. 10 attempts / 15 min per IP makes password
// spraying and credential stuffing impractical without locking out a real user
// who simply mistyped twice.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: limited("Too many attempts from this address. Please wait 15 minutes and try again.")
});

// Token refresh is called routinely by the client, so it gets a generous
// ceiling — high enough never to affect a real session, low enough to stop
// token-guessing floods.
export const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: limited("Too many token refreshes. Please sign in again in a moment.")
});

// Baseline protection for write traffic (cart, reviews, tickets...). Wide
// enough that normal browsing never trips it.
export const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    // Safe, idempotent reads should never be throttled.
    skip: (req) => ["GET", "HEAD", "OPTIONS"].includes(req.method),
    handler: limited("You are doing that too quickly. Please slow down and try again.")
});
