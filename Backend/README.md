# ShopSphere Backend

Express + MongoDB (Mongoose) API for the ShopSphere multi-vendor marketplace.

## Stack

- **Express 5** — REST API
- **Mongoose 9** — MongoDB ODM
- **JWT + bcrypt** — auth (5 roles: customer, seller, admin, support, delivery)
- **Multer + Cloudinary** — image uploads
- **Cohere API** — AI product descriptions + semantic search
- **Pure-JS DSA utilities** — MaxHeap (top picks), mergeSort/binarySearch (price position), hash map (bulk stock)

## Setup

```bash
cp .env.example .env   # if present; otherwise copy Backend/.env from an existing checkout
npm install
npm run dev            # nodemon, port 4000
```

Requires a running MongoDB at `DB_URL` (default `mongodb://127.0.0.1:27017/shopsphere_db`).

## Environment (`.env`)

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | no | Default 3000 |
| `DB_URL` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Token signing |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | for uploads | Product/store images |
| `COHERE_API_KEY` | for AI | Description generation + semantic search |

## API prefixes

| Prefix | Area |
|---|---|
| `/user-api` | Register, login, profile, admin user management |
| `/product-api` | Products, categories, uploads, top-picks, price-position, bulk-stock |
| `/category-api` | Categories |
| `/cart-api`, `/wishlist-api` | Customer cart & wishlist |
| `/order-api` | Checkout, order status flow (customer/seller/admin) |
| `/review-api` | Reviews (verified purchases) |
| `/return-api` | Return requests & refunds |
| `/coupon-api` | Coupon admin + validation |
| `/delivery-api` | Delivery assignments & shipment status |
| `/support-api` | Support tickets |
| `/analytics-api` | Seller/admin dashboards |
| `/ai-api` | Description generation, semantic search |

All routes mount under these prefixes in `server.js`; unknown paths return 404, errors return `{ message, error }`.

## Order status flow

`placed → confirmed → packed → shipped` (seller) → delivery: `assigned → picked_up → in_transit → delivered`. Each transition is validated; delivering the last vendor sub-order auto-updates the order to `delivered`.

## Dev utilities

- `node --env-file=.env reset-test-passwords.js <pw>` — resets seeded `@test.com` accounts to a known password.