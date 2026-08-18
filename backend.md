# Backend Specification — Restaurant Token & Staff Management

This document is the contract the **MongoDB backend** must satisfy for the existing Next.js frontend to drop in. It describes the recommended stack, data models, REST endpoints, auth flow, role-based access, and the exact integration points in the frontend that need to be re-wired once the API is live.

---

## 1. Tech Stack (recommended)

| Layer            | Choice                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Runtime          | Node.js 20+                                                           |
| Framework        | Express 4 (or Fastify) — alternatively Next.js Route Handlers         |
| Database         | MongoDB 7 (Atlas or self-hosted)                                      |
| ODM              | Mongoose 8                                                            |
| Auth             | JSON Web Tokens (jsonwebtoken) + bcrypt for password hashing          |
| Validation       | Zod or Joi                                                            |
| Uploads (images) | Multer + Cloudinary / S3                                              |
| Logging          | pino / morgan                                                         |
| Env              | dotenv                                                                |
| Lint / format    | ESLint + Prettier                                                     |

Hosting suggestion: Railway / Render / Fly.io for the API, MongoDB Atlas for the database.

---

## 2. Suggested Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts                 # mongoose.connect
│   │   └── env.ts                # typed env getter
│   ├── models/
│   │   ├── User.ts
│   │   ├── Client.ts
│   │   ├── Product.ts
│   │   ├── TokenSale.ts
│   │   ├── ClientPurchase.ts
│   │   ├── Attendance.ts
│   │   ├── Complaint.ts
│   │   ├── Bonus.ts
│   │   ├── TableAssignment.ts
│   │   └── DailyProgress.ts
│   ├── middleware/
│   │   ├── auth.ts               # requireAuth, requireRole(...)
│   │   ├── error.ts              # central error handler
│   │   └── validate.ts           # zod -> 400
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── clients.routes.ts
│   │   ├── products.routes.ts
│   │   ├── sales.routes.ts
│   │   ├── attendance.routes.ts
│   │   ├── complaints.routes.ts
│   │   ├── bonuses.routes.ts
│   │   ├── tables.routes.ts
│   │   ├── progress.routes.ts
│   │   └── analytics.routes.ts
│   ├── controllers/              # mirrors routes/
│   ├── services/                 # business rules (referral bonus, stock, etc.)
│   ├── utils/                    # token, hash, pagination
│   └── index.ts                  # app bootstrap
├── .env
├── package.json
└── tsconfig.json
```

---

## 3. MongoDB Models

All collections share `createdAt` / `updatedAt` via Mongoose `timestamps: true`. IDs returned to the frontend should be the Mongo `_id` (string) — the frontend treats `id` as a string.

### 3.1 `users` — admins, managers, workers

```ts
{
  _id: ObjectId,
  name: string,
  email?: string,            // required for admin, optional for staff
  mobile?: string,           // required for manager / worker
  passwordHash: string,      // bcrypt
  role: 'admin' | 'manager' | 'worker',
  status: 'active' | 'blocked',
  joinedOn: Date,
  // worker-only operational fields
  table?: string,
  attendanceRate?: number,   // computed snapshot
  tokensSold?: number,
  bonus?: number,
  rating?: number,
}
```

Indexes: unique `email`, unique `mobile`.

### 3.2 `clients`

```ts
{
  _id, name, mobile, nid,
  email?, address?, gender?: 'male'|'female'|'other',
  referral?: string,         // mobile of referrer
  rating: number,            // 0..5
  tokensBought: number,
  tokensSpent: number,
  balance: number,           // derived = tokensBought - tokensSpent + bonusTokens
  createdAt
}
```

Indexes: unique `mobile`, unique `nid`. Compound index on `(name, mobile, nid)` for search.

### 3.3 `products`

```ts
{
  _id, name, image?: string,
  category: string,
  costPrice: number, sellingPrice: number,
  stock: number,
  status: 'in-stock' | 'low-stock' | 'out-of-stock',  // auto-derived from stock
  addedOn: Date, updatedOn: Date
}
```

Pre-save hook: `status = stock <= 0 ? 'out-of-stock' : stock < 10 ? 'low-stock' : 'in-stock'`.

### 3.4 `tokenSales` — when a worker sells tokens to a client

```ts
{ _id, clientId, workerId, tokens: number, amount: number, date: Date }
```

### 3.5 `clientPurchases` — items a client buys with their tokens

```ts
{
  _id, clientId, productId, productName,
  qty: number, tokensUsed: number, amount: number, date: Date
}
```

### 3.6 `attendance`

```ts
{ _id, workerId, date: Date, status: 'present'|'absent'|'late' }
```

Unique compound index on `(workerId, date)` to prevent duplicates per day.

### 3.7 `complaints`

```ts
{ _id, byId, subject: string, date: Date, status: 'open'|'in-progress'|'resolved' }
```

### 3.8 `bonuses`

```ts
{ _id, workerId, amount: number, date: Date, reason: string }
```

### 3.9 `tableAssignments`

```ts
{ _id, table: string, workerId?: ObjectId, assignedOn?: Date, status: 'active'|'free' }
```

### 3.10 `dailyProgress`

```ts
{
  _id, workerId, table: string,
  tokenGiven: number, tokenSold: number,
  balance: number,                  // = tokenGiven - tokenSold (can be negative)
  date: Date, notes?: string
}
```

---

## 4. Authentication

### 4.1 Password storage

`bcrypt.hashSync(password, 12)` on create. Compare with `bcrypt.compareSync`.

### 4.2 JWT

```ts
sign({ sub: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
```

Return `{ token, user }` on successful login. Frontend stores both in localStorage (key `restaurant-auth-user` — already used by `context/AuthContext.tsx`).

### 4.3 Middleware

```ts
requireAuth     // verifies token, attaches req.user
requireRole(...roles)   // 403 if req.user.role not in roles
```

### 4.4 Endpoints

| Method | Path                          | Body                                            | Auth      |
| ------ | ----------------------------- | ----------------------------------------------- | --------- |
| POST   | `/api/auth/login/admin`       | `{ email, password }`                           | public    |
| POST   | `/api/auth/login/staff`       | `{ mobile, password }`                          | public    |
| POST   | `/api/auth/register`          | `{ name, mobile, email?, password, role }`      | public    |
| GET    | `/api/auth/me`                | —                                               | any       |
| POST   | `/api/auth/logout`            | —                                               | any       |

Notes:
- `register` only allows `role` in `['worker','manager']`. Creating admins is done via a seed script or by an existing admin (`POST /api/users` below).
- Blocked accounts respond `403`, not `401`, so the UI can distinguish.

---

## 5. REST Endpoints

All paths assume `/api` prefix. List endpoints support `?page=&limit=&q=` pagination + search.

### 5.1 Users — admin only

| Method | Path                    | Body / params                       | Roles  |
| ------ | ----------------------- | ----------------------------------- | ------ |
| GET    | `/users`                | filter by `?role=`                  | admin  |
| POST   | `/users`                | `{ name, mobile, email?, password, role: 'manager'\|'worker', status? }` | admin |
| GET    | `/users/:id`            |                                     | admin  |
| PATCH  | `/users/:id`            | partial fields, including `role`    | admin  |
| PATCH  | `/users/:id/status`     | `{ status: 'active'\|'blocked' }`   | admin  |
| DELETE | `/users/:id`            |                                     | admin  |

### 5.2 Clients

| Method | Path                                     | Body / params                                       | Roles                    |
| ------ | ---------------------------------------- | --------------------------------------------------- | ------------------------ |
| GET    | `/clients`                               | `?q=` matches name / mobile / nid                   | admin, manager, worker   |
| POST   | `/clients`                               | full client payload                                 | admin, worker            |
| GET    | `/clients/:id`                           |                                                     | admin, manager, worker   |
| PATCH  | `/clients/:id`                           | partial                                             | admin                    |
| DELETE | `/clients/:id`                           |                                                     | admin                    |
| GET    | `/clients/:id/purchases`                 | `?range=today\|week\|month\|all`                    | admin, manager           |
| POST   | `/clients/:id/purchases`                 | `{ productId, qty, tokensUsed }` — server computes `amount`, updates client balance and product stock atomically | admin, worker |

### 5.3 Products

| Method | Path                  | Body                                                                   | Roles            |
| ------ | --------------------- | ---------------------------------------------------------------------- | ---------------- |
| GET    | `/products`           | `?category=&status=`                                                   | admin, manager, worker |
| POST   | `/products`           | `{ name, image?, category, costPrice, sellingPrice, stock }`           | admin, manager   |
| PATCH  | `/products/:id`       | partial — `updatedOn` set server-side                                  | admin, manager   |
| DELETE | `/products/:id`       |                                                                        | admin            |

### 5.4 Token sales

| Method | Path           | Body                                                                       | Roles          |
| ------ | -------------- | -------------------------------------------------------------------------- | -------------- |
| GET    | `/sales`       | `?workerId=&clientId=&from=&to=`                                           | admin, manager |
| POST   | `/sales`       | `{ clientId, tokens, amount }` — workerId from JWT; increments `client.balance` | worker, admin |

### 5.5 Attendance

| Method | Path                       | Body                          | Roles                         |
| ------ | -------------------------- | ----------------------------- | ----------------------------- |
| GET    | `/attendance`              | `?workerId=&date=`            | admin, manager                |
| POST   | `/attendance/checkin`      | —                             | worker (workerId from JWT)    |
| PATCH  | `/attendance/:id/status`   | `{ status }`                  | manager, admin                |

### 5.6 Complaints

| Method | Path                     | Body / params                  | Roles                         |
| ------ | ------------------------ | ------------------------------ | ----------------------------- |
| GET    | `/complaints`            | `?status=`                     | admin, manager                |
| POST   | `/complaints`            | `{ subject }` — `byId` from JWT | worker, manager              |
| PATCH  | `/complaints/:id/status` | `{ status }`                   | admin, manager                |

### 5.7 Bonuses

| Method | Path           | Body                                | Roles            |
| ------ | -------------- | ----------------------------------- | ---------------- |
| GET    | `/bonuses`     | `?workerId=`                        | admin, manager   |
| POST   | `/bonuses`     | `{ workerId, amount, reason }`      | admin            |

### 5.8 Tables

| Method | Path                | Body                                       | Roles            |
| ------ | ------------------- | ------------------------------------------ | ---------------- |
| GET    | `/tables`           |                                            | admin, manager   |
| POST   | `/tables/assign`    | `{ table, workerId }` (sets status active) | admin, manager   |
| POST   | `/tables/release`   | `{ table }` (sets status free, clears worker) | admin, manager |

### 5.9 Daily progress

| Method | Path                  | Body                                                                                   | Roles          |
| ------ | --------------------- | -------------------------------------------------------------------------------------- | -------------- |
| GET    | `/progress`           | `?workerId=&date=`                                                                     | admin, manager, worker (own only) |
| POST   | `/progress`           | `{ workerId, table, tokenGiven, tokenSold, notes? }` — server computes `balance`       | manager, admin |

### 5.10 Analytics

| Method | Path                        | Returns                                                                  | Roles  |
| ------ | --------------------------- | ------------------------------------------------------------------------ | ------ |
| GET    | `/analytics/overview`       | revenue (total/day/week/month), tokensSold, activeClients, stockAlerts, referralCount, profitEstimate | admin  |
| GET    | `/analytics/worker/:id`     | tokensSold, revenue, attendanceRate, rating                              | admin, manager, worker (self) |

---

## 6. Cross-Cutting Business Rules

These must live in the **service layer** so they apply regardless of caller.

1. **Referral bonus** — on `POST /clients`, if `referral` matches an existing client's mobile, credit that referrer with a configurable bonus tokens count (default `5`). Record an `auditLog` entry.
2. **Stock decrement** — `POST /clients/:id/purchases` decrements `product.stock` by `qty` in the same transaction. If insufficient stock, return `409`.
3. **Balance** — `client.balance` is server-authoritative. Never trust client-supplied balance values.
4. **Product status** — derived from `stock` on every save, not stored by the client.
5. **Daily progress balance** — `balance = tokenGiven - tokenSold` server-side; negative values allowed (frontend renders them red).
6. **Blocked users** — `requireAuth` rejects with `403` if `req.user.status === 'blocked'`.
7. **Rate limit** auth endpoints (e.g. `express-rate-limit`, 10 req / 15 min / IP) to prevent brute force.

---

## 7. Environment Variables (`.env`)

```
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<random 32+ char string>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
BCRYPT_ROUNDS=12
REFERRAL_BONUS_TOKENS=5
LOW_STOCK_THRESHOLD=10
```

---

## 8. Seed Script

Provide `pnpm seed` that:
1. Drops `users`, `clients`, `products`.
2. Inserts the admin: `admin@restaurant.com` / `12345` (hashed).
3. Inserts 2 managers + 3 workers matching the frontend demo (mobiles `01710000001`, `01710000002`, `01810000001…3`).
4. Inserts the demo products from `frontend/lib/mockData.ts`.

This keeps the demo credentials in `frontend/README.md` valid the moment the backend is connected.

---

## 9. Frontend Integration Points

The frontend is currently mock-backed via `localStorage`. To swap to the real API, change only these files:

### 9.1 `context/AuthContext.tsx`

Replace the three handlers with `fetch`:

```ts
const loginAdmin = async (email, password) => {
  const r = await fetch(`${API}/auth/login/admin`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) return null;
  const { token, user } = await r.json();
  localStorage.setItem('restaurant-token', token);
  persist(user);
  return user;
};
// loginStaff(mobile, password)  -> /auth/login/staff
// register(payload)              -> /auth/register
```

Add an auth-aware fetch helper:

```ts
export async function api(path: string, init: RequestInit = {}) {
  const token = localStorage.getItem('restaurant-token');
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}
```

### 9.2 Each page that imports from `lib/mockData.ts`

Replace the static array import with a `useEffect` + `api('/<resource>')` call (or use SWR / TanStack Query for caching). The component shapes already match the schemas above — no UI rewrites needed.

Files to migrate (one resource each):
- `app/dashboard/admin/users/page.tsx`
- `app/dashboard/admin/clients/page.tsx`
- `app/dashboard/admin/products/page.tsx`
- `app/dashboard/admin/transactions/page.tsx`
- `app/dashboard/admin/attendance/page.tsx`
- `app/dashboard/admin/complaints/page.tsx`
- `app/dashboard/admin/bonuses/page.tsx`
- `app/dashboard/admin/tables/page.tsx`
- `app/dashboard/admin/page.tsx` (overview → `/analytics/overview`)
- equivalent manager + worker pages

### 9.3 Env

In `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 9.4 CORS

Backend must whitelist `CORS_ORIGIN` (default `http://localhost:3000`) and respond to preflight.

---

## 10. Suggested Build Order

1. Bootstrap Express + Mongoose, connect to Atlas, healthcheck `/api/health`.
2. `User` model + `auth` endpoints + JWT middleware. Test with the existing frontend login.
3. `Client` + `Product` (most-used resources).
4. `TokenSale` + `ClientPurchase` (the business-critical flow).
5. `Attendance` + `Complaint`.
6. `Bonus` + `TableAssignment` + `DailyProgress`.
7. `Analytics` overview aggregation.
8. Seed script + integration tests (supertest).
9. Deploy.

---

## 11. Status Codes Reference

| Code | When                                                                              |
| ---- | --------------------------------------------------------------------------------- |
| 200  | Successful read / update                                                          |
| 201  | Successful create (return the created resource)                                   |
| 204  | Successful delete (no body)                                                       |
| 400  | Validation error — return `{ error, details: [...] }`                             |
| 401  | Missing / invalid token                                                           |
| 403  | Authenticated but role not permitted, **or** account `status: 'blocked'`          |
| 404  | Not found                                                                         |
| 409  | Conflict (duplicate mobile / NID, insufficient stock)                             |
| 422  | Semantically invalid (e.g. selling price < cost price)                            |
| 500  | Unhandled — return `{ error: 'Internal error' }`, log full stack server-side      |

---

## 12. Open Decisions

These were left open so the backend author can choose:

- **Real-time updates** — none required initially; the frontend re-fetches on action. If you want live tables / dashboards, add Socket.IO and emit events on writes.
- **File uploads** — product `image` is currently an emoji. If you want real photos, accept `multipart/form-data` on `POST /products` and store the returned URL in `image`.
- **Audit log** — optional collection `auditLogs` recording who did what when. Recommended for admin actions (block user, delete client, assign bonus).
- **Soft delete** — recommended for `clients` and `users` (`deletedAt: Date`). Filter from default lists; keep history intact for analytics.

Once these are decided, update this document and the frontend types accordingly.
