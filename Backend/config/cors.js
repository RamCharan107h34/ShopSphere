// Cross-origin policy for the API.
//
// The frontend is a static build that calls Express directly, so every request
// is cross-origin: the browser withholds the response from the app unless we
// echo the caller's origin in `Access-Control-Allow-Origin`. Two different
// mistakes both surface in the browser as the same message, "No
// 'Access-Control-Allow-Origin' header is present on the requested resource":
//
//   1. The origin the deployed frontend runs on is not in this allow-list.
//   2. The API base URL the frontend was built with is not this server at all,
//      so the request never reaches Express. No header we send can help — see
//      DEPLOYMENT.md.
//
// `FRONTEND_URL` therefore accepts a comma-separated allow-list, and each entry
// may contain `*` so a single entry can cover a family of preview deployments:
//
//   FRONTEND_URL=https://shop-sphere-lilac-eight.vercel.app,https://shop-sphere-*.vercel.app
//
// Exact origins are still the safest thing to write. The wildcard form exists
// because every preview deploy gets a fresh hostname, and a list that has to be
// hand-edited on each deploy is how this breaks in production.

import { isDeployed } from "../utils/isDeployed.js";

// Local dev servers are always allowed off-platform so an unset or edited
// FRONTEND_URL can never stop `npm run dev` from working.
const DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Browsers ignore a trailing slash when they send `Origin`, but a string
// comparison would not, so normalise it away on both sides of the check.
const normalizeOrigin = (origin) => String(origin).trim().replace(/\/+$/, "");

export const parseAllowedOrigins = (raw) =>
    String(raw ?? "")
        .split(",")
        .map(normalizeOrigin)
        .filter(Boolean);

const toMatcher = (entry) => {
    if (!entry.includes("*")) return (origin) => origin === entry;

    const pattern = new RegExp(`^${entry.split("*").map(escapeRegExp).join(".*")}$`);
    return (origin) => pattern.test(origin);
};

export const buildCorsOptions = ({ env = process.env } = {}) => {
    const configured = parseAllowedOrigins(env.FRONTEND_URL);
    const entries = isDeployed(env) ? configured : [...configured, ...DEV_ORIGINS];
    const allowed = [...new Set(entries)].map(toMatcher);
    const describe = () => entries.join(", ") || "(none)";

    if (!configured.length) {
        console.warn(
            "[cors] FRONTEND_URL is not set, so no deployed origin is allowed. " +
                "Set it on the host to the frontend's origin — e.g. " +
                "FRONTEND_URL=https://your-app.vercel.app — and restart."
        );
    } else {
        // Printed on every boot: the Render/Vercel logs are the fastest place to
        // see what this process actually believes its allow-list is.
        console.log(`[cors] allowing origins: ${describe()}`);
    }

    return {
        origin(origin, callback) {
            // No Origin header at all: same-origin, curl, health checks,
            // server-to-server. Nothing to allow or deny.
            if (!origin) return callback(null, true);

            const candidate = normalizeOrigin(origin);
            if (allowed.some((isAllowed) => isAllowed(candidate))) return callback(null, true);

            // Refuse by omitting the header rather than by throwing. The browser
            // blocks the response either way, but an error would surface as a 500
            // and hide the cause; a warning here names it exactly.
            console.warn(`[cors] blocked origin ${origin} — allowed: ${describe()}`);
            return callback(null, false);
        },
        credentials: true,
    };
};
