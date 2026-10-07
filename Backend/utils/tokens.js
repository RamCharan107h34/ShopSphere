import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import { isDeployed } from "./isDeployed.js";

// Access tokens are short-lived and stateless — a leaked one is useless within
// minutes. Long-lived sessions come from the refresh token, which is stored
// server-side (hashed) and can be revoked.
//
// Override via env if a different balance is needed.
export const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "30m";
export const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 30;

const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

export const signAccessToken = (payload) =>
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

// Opaque random string — not a JWT. It carries no claims and is only meaningful
// to the server that stored its hash, so it can be revoked instantly.
export const generateRefreshToken = () => crypto.randomBytes(48).toString("hex");

// Refresh tokens are high-entropy random values, so a fast hash is appropriate
// (unlike passwords, where slowness is the point).
export const hashToken = (token) =>
    crypto.createHash("sha256").update(String(token)).digest("hex");

export const refreshTokenExpiry = () => new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

// Both session cookies are written from one place so they can never drift apart.
//
// In a deployment the frontend and this API are different sites (a Vercel origin
// calling a Render service). A browser discards a `SameSite=Lax` cookie that
// arrives in a cross-site response, so the session cookies only take effect with
// `SameSite=None` — which browsers accept solely alongside `Secure`. Local dev
// keeps Lax so the cookie still works over plain http://localhost.
const sessionCookieOptions = ({ maxAge }) => ({
    httpOnly: true,
    secure: isDeployed(),
    sameSite: isDeployed() ? "none" : "lax",
    maxAge,
    path: "/"
});

export const accessCookieOptions = () =>
    sessionCookieOptions({ maxAge: 30 * 60 * 1000 });

export const refreshCookieOptions = () =>
    sessionCookieOptions({ maxAge: REFRESH_TOKEN_TTL_MS });
