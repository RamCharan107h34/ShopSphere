# ShopSphere Backend

Express + MongoDB (Mongoose) API for the ShopSphere multi-vendor marketplace.

## Stack

- **Express 5** — REST API
- **Mongoose 9** — MongoDB ODM
- **JWT + bcrypt** — auth (5 roles: customer, seller, admin, support, delivery)
- **Multer + Cloudinary** — image uploads
- **Cohere API** — AI product descriptions + semantic search
- **Pure-JS DSA utilities** — MaxHeap (top picks + personalized recommendations), mergeSort/binarySearch (price position), hash map (bulk stock)
- **Personalization** — recently viewed categories (recorded per user) plus purchased categories rerank the home carousel; guests fall back to top-rated

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
| `/product-api` | Products, categories, uploads, top-picks, recommendations, price-position, bulk-stock |
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

Sellers own fulfilment up to packing: `placed → confirmed → packed`, then hand the packed sub-order to a delivery partner (a user with the `delivery` role). The partner owns the delivery leg: shipment `assigned → shipped (picked up from seller) → out_for_delivery → delivered`, which mirrors onto the sub-order. Each transition is validated; delivering the last vendor sub-order auto-updates the order to `delivered`.

## Dev utilities

- `node --env-file=.env reset-test-passwords.js <pw>` — resets seeded `@test.com` accounts to a known password.

## Test accounts

| Role | Email | Password | Lands on |
|---|---|---|---|
| Customer | customer@test.com | Test@1234 | storefront + /account |
| Seller | seller@test.com | Test@1234 | /seller dashboard |
| Admin | admin@test.com | Test@1234 | /admin dashboard |
| Support agent | agent_1788582441711@test.com | Test@1234 | /support desk |
| Delivery partner | delivery@test.com | Test@1234 | /delivery dashboard |
mongodb+srv://<db_username>:jy64y61cRAkPFsH6@shopsphere-01.elwg8sc.mongodb.net/?appName=ShopSphere-01