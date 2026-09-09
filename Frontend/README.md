# ShopSphere Frontend

React 19 + Vite storefront and dashboards for the ShopSphere marketplace (customer, seller, admin, support, delivery roles).

## Stack

- **React 19 + Vite 8** — SPA, react-router-dom v7
- **Tailwind CSS 4** — design system (tokens in `index.css`, UI kit in `src/components/ui`)
- **Framer Motion** — animations
- **Axios** — API client with JWT interceptor (`src/services/api.js`)

## Setup

```bash
cp .env.example .env   # sets VITE_API_URL=http://localhost:4000
npm install
npm run dev            # Vite on http://localhost:5173
```

API calls go straight to the backend via `VITE_API_URL` from `.env` (read by the Axios client in `src/services/api.js`). The backend's CORS config allows the frontend origin.

## Structure

```
src/
  pages/            # Route screens (storefront, account, seller, admin, support, delivery)
  components/       # Layout, UI kit (ui/), catalog, customer, seller, delivery, feedback
  context/          # Auth + Cart providers
  services/         # API clients per area (catalog, shop, account, seller, admin, support, delivery)
  hooks/            # useFetch (loading/error/retry)
  lib/              # utils, format (₹), shared status meta + flow steps
```

## Routing

| Path | Area |
|---|---|
| `/`, `/products`, `/product/:id`, `/cart`, `/checkout` | Storefront |
| `/account/*` | Profile, orders, wishlist, returns |
| `/seller/*` | Seller dashboard |
| `/admin/*` | Admin dashboard |
| `/support/*` | Support desk |
| `/delivery/*` | Delivery partner dashboard |

Role-protected dashboards redirect unauthenticated users to `/login` and show a gate screen for wrong roles.

## Commands

```bash
npm run dev      # dev server
npm run build    # production build
npm run lint     # oxlint
npm run preview  # preview the production build
```

## Notes

- Sign-in persists JWT in `localStorage` (`shopsphere_token`) and attaches it as a Bearer header.
- Product images are served from Cloudinary; cards fall back to a branded tile when no image is available.
- Natural-language search uses `/ai-api/search` and shows an "AI-ranked" indicator with a "Best AI match" sort option.