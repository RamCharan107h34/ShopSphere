// True when this process is running on a hosting platform rather than a laptop.
//
// NODE_ENV is the conventional way to ask, but it is easy to forget to set on a
// host — and then production quietly behaves like development: cookies are
// issued without `Secure`, cross-site cookies stay `SameSite=Lax` and get
// dropped by the browser, and localhost origins remain allowed. Render and
// Vercel both identify their own processes, so an unset NODE_ENV can no longer
// pass for local.
export const isDeployed = (env = process.env) =>
    env.NODE_ENV === "production" || Boolean(env.RENDER) || Boolean(env.VERCEL);
