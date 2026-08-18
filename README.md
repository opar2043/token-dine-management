# Token Dine — Frontend

Restaurant management dashboard for **Token Dine**. Built with **Next.js 14 (App Router) + TypeScript + Tailwind CSS**. Three role-based dashboards (Admin / Manager / Worker), fully wired to the live REST backend.

- **Backend API:** `https://tokendinerestaurent.vercel.app`
- **Stack:** Next.js 14 · React 18 · TypeScript · Tailwind CSS · Axios
- **Theming:** Light / Dark mode toggle (persisted)
- **Font:** Inter via `next/font/google`
- **Design System:** See [design.md](./design.md) for full spec

---
<img width="1363" height="638" alt="image" src="https://github.com/user-attachments/assets/31604ff4-128f-44c7-902a-866be5aceb46" />

## 1. Project Overview

Token Dine digitizes the day-to-day operations of a restaurant that runs on a **prepaid token system**: clients buy tokens, workers redeem them against menu items, and managers/admins track sales, attendance, inventory, bonuses, complaints, and referrals.

The frontend is **fully connected to the live backend** — there is no more mock data. Every page loads from the API on mount and writes through service objects.

### Roles

| Role        | Login                            | Dashboard                                        |
| ----------- | -------------------------------- | ------------------------------------------------ |
| **Admin**   | email + password                 | Full control — users, clients, products, analytics |
| **Manager** | mobile + password                | Team, daily progress, inventory, tables          |
| **Worker**  | mobile + password / PIN          | Sell tokens, attendance, clients, complaints     |
| **Client**  | does not log in                  | Record-only — managed by workers/admin           |

### Business flow

1. A worker searches for a client by mobile or NID.
2. If new, the worker creates the client (optional referral mobile → referrer gets bonus tokens).
3. Worker sells tokens to the client (`POST /sales`).
4. Worker records menu purchases (`POST /clients/:id/purchases`) — stock decrements, token balance deducts.
5. Manager logs daily token-given vs token-sold per worker (negative balances flagged red).
6. Admin reviews revenue, profit, attendance, and assigns bonuses.

### Referral bonus

When a new client is registered with `referral = <existing-client-mobile>`, the referrer is auto-credited (default 5 tokens, configurable on the backend via `REFERRAL_BONUS_TOKENS`).

### Bonus recommendation rule

The manager's *Bonuses* page auto-flags a worker as **Recommend bonus** when:

```
attendanceRate ≥ 90%  AND  tokensSold ≥ 250  AND  rating ≥ 4
```

### Inventory status (derived from stock on the backend)

| Status         | Condition           |
| -------------- | ------------------- |
| `in-stock`     | `stock ≥ 10`        |
| `low-stock`    | `1 ≤ stock < 10`    |
| `out-of-stock` | `stock = 0`         |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  React Component (e.g. AdminClientsPage)                    │
│  └─ useEffect ▶ clientsService.getClients()                 │
└─────────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  lib/services/clients.route.ts                              │
│  └─ exports clientsService = { getClients, createClients… } │
└─────────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  lib/api.ts                                                 │
│  └─ axios instance (baseURL, timeout, error interceptor)    │
└─────────────────────────────────────────────────────────────┘
                          ▼
        https://tokendinerestaurent.vercel.app/clients
```

Every backend resource has a matching `*.route.ts` service file. Pages never call `axios` directly — they always go through a service. Cross-entity name lookups (worker name for a sale, etc.) are joined client-side via a small `buildLookup` helper in [lib/format.ts](./lib/format.ts).

---

## 3. Authentication

> **Note:** This is **custom authentication**, not full authorization. Login returns a user object which is persisted to `localStorage` (`restaurant-auth-user`); no JWT or session token is issued, and the backend does not currently gate endpoints by role. Suitable for an internal demo / prototype.

| Identifier      | Endpoint                  | Stored as            |
| --------------- | ------------------------- | -------------------- |
| Admin email     | `POST /auth/login/admin`  | `restaurant-auth-user` (localStorage) |
| Staff mobile    | `POST /auth/login/staff`  | `restaurant-auth-user` (localStorage) |
| Registration    | `POST /auth/register`     | same                 |
| Logout          | `POST /auth/logout`       | cleared              |

Theme preference is stored under `restaurant-theme`. Blocked accounts (`status: "blocked"`) cannot log in.

---

## 4. Tech Stack

- **Next.js 14** (App Router, React Server Components disabled per-page via `"use client"`)
- **TypeScript** strict mode
- **Tailwind CSS** with `darkMode: "class"`
- **Axios** for HTTP, with a response interceptor that normalizes backend `{ error }` payloads into proper `Error` messages
- **React Context** for auth + theme; `localStorage` for persistence
- **Inter** via `next/font/google`
- **Design system** — detailed in [`design.md`](./design.md)
- No external UI library — all primitives are hand-built in `components/`

---

## 5. Getting Started

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build (all 31 routes prerender)
npm run start        # serve the production build
npm run lint         # next lint
```

### Demo credentials

These are seeded by `POST https://tokendinerestaurent.vercel.app/seed` (destructive — wipes & reseeds users/clients/products):


| Role    | Identifier             | Password |
| ------- | ---------------------- | -------- |
| Admin   | `admin@restaurant.com` | `12345`  |
| Manager | `01710000001` (mobile) | `12345`  |
| Manager | `01710000002`          | `12345`  |

| Worker  | `01810000001`          | `12345`  |
| Worker  | `01810000002`          | `12345`  |
| Worker  | `01810000003`          | `12345`  *(blocked — login denied)* |

---

## 6. Project Structure

```
frontend/
├── app/
│   ├── layout.tsx                      Root layout + Inter + Theme + Auth providers
│   ├── page.tsx                        Entry redirect (→ /login or /dashboard/<role>)
│   ├── globals.css                     Tailwind layers + .card / .input / .btn-* / .badge
│   ├── login/page.tsx                  Admin (email) + Staff (mobile) tabbed login
│   ├── register/page.tsx               Worker / Manager self-registration
│   └── dashboard/
│       ├── admin/                      9 pages: overview, users, clients, products,
│       │                                       tables, transactions, attendance,
│       │                                       bonuses, complaints
│       ├── manager/                    8 pages: overview, workers, daily-progress,
│       │                                       tables, attendance, inventory, sales,
│       │                                       bonuses
│       └── worker/                     8 pages: overview, clients, new-client,
│                                               sell-token, sales, progress,
│                                               attendance, complaints
├── components/
│   ├── DashboardShell.tsx              Sidebar + Header layout + role guard
│   ├── Sidebar.tsx                     Role-aware navigation
│   ├── Header.tsx                      Welcome strip + theme toggle + logout
│   ├── DataTable.tsx                   Reusable table + StatusBadge
│   ├── Modal.tsx                       Backdrop, ESC close, body lock
│   ├── StatCard.tsx                    KPI card
│   ├── ThemeToggle.tsx
│   └── icons.tsx                       Eye / Edit / Trash / Plus SVGs
├── context/
│   ├── AuthContext.tsx                 user state, async login/register/logout
│   └── ThemeContext.tsx                light/dark with localStorage persistence
├── lib/
│   ├── api.ts                          Shared axios instance + error interceptor
│   ├── services/                       One *.route.ts per backend resource
│   │   ├── index.ts                    Barrel export
│   │   ├── auth.route.ts               authService
│   │   ├── users.route.ts              usersService
│   │   ├── clients.route.ts            clientsService
│   │   ├── products.route.ts           productsService
│   │   ├── sales.route.ts              salesService
│   │   ├── attendance.route.ts         attendanceService
│   │   ├── complaints.route.ts         complaintsService
│   │   ├── bonuses.route.ts            bonusesService
│   │   ├── tables.route.ts             tablesService
│   │   ├── progress.route.ts           progressService
│   │   └── analytics.route.ts          analyticsService
│   ├── types.ts                        Single source of truth for entity types
│   └── format.ts                       formatDate, formatId, buildLookup helpers
├── design.md                           Design system specification
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
├── package.json
└── README.md                           this file
```

---

## 7. API Services

All HTTP calls go through `lib/services/*.route.ts`. Import either the specific service or use the barrel:

```ts
import { clientsService, usersService } from "@/lib/services";

const { items } = await clientsService.getClients({ q: "Arif", limit: 50 });
const user = await usersService.createUsers({ name, mobile, password, role: "worker" });
```

| Service               | Methods                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| `authService`         | `loginAdmin`, `loginStaff`, `register`, `logout`                                                           |
| `usersService`        | `getUsers`, `getUser`, `createUsers`, `updateUsers`, `updateUserStatus`, `deleteUsers`                     |
| `clientsService`      | `getClients`, `getClient`, `createClients`, `updateClients`, `deleteClients`, `getClientPurchases`, `addClientPurchase` |
| `productsService`     | `getProducts`, `createProducts`, `updateProducts`, `deleteProducts`                                        |
| `salesService`        | `getSales`, `createSales`                                                                                  |
| `attendanceService`   | `getAttendance`, `checkInAttendance`, `updateAttendanceStatus`                                             |
| `complaintsService`   | `getComplaints`, `createComplaints`, `updateComplaintStatus`                                               |
| `bonusesService`      | `getBonuses`, `createBonuses`                                                                              |
| `tablesService`       | `getTables`, `assignTables`, `releaseTables`                                                               |
| `progressService`     | `getProgress`, `createProgress`                                                                            |
| `analyticsService`    | `getOverview`, `getWorkerAnalytics`                                                                        |

Every service method returns a typed Promise. Errors bubble up as `Error` instances with the backend's `error` message attached — pages catch and render them.

---

## 8. Feature Map by Role

### 8.1 Admin (`/dashboard/admin`)

| Page             | What it does                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Overview         | Revenue (total / day / week / month), active clients, workers, tokens sold, stock alerts, referrals, profit estimate |
| Users            | List/add admins, managers, workers + clients. Role tabs adapt fields                                  |
| Clients          | Full CRUD + view modal with purchase history (today / week / month / all)                            |
| Products         | Add / edit / delete with emoji image picker and category dropdown                                     |
| Tables           | Read-only view of worker-table assignments                                                            |
| Transactions     | Every token sale across all workers (with client + worker names resolved)                            |
| Attendance       | All worker attendance entries                                                                         |
| Bonuses          | History + total/count/average + "Assign new bonus" modal                                              |
| Complaints       | Filed complaints + inline status dropdown (open / in-progress / resolved)                            |

### 8.2 Manager (`/dashboard/manager`)

| Page             | What it does                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Overview         | Active workers, average attendance, total sales, tables assigned                                      |
| Workers          | Performance: computed attendance %, tokens sold, bonus paid, rating                                  |
| Daily Progress   | Form: worker / table / tokens given / tokens sold → auto balance (negative = red)                    |
| Tables           | Assign workers to tables + release                                                                    |
| Attendance       | All attendance entries                                                                                |
| Inventory        | Stock list with low/out-of-stock banner                                                              |
| Sales            | Token sales handled by the team                                                                       |
| Bonuses          | Auto-recommendation table + history of bonuses paid                                                  |

### 8.3 Worker (`/dashboard/worker`)

| Page             | What it does                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Overview         | Personal: clients served, tokens sold, sales total, attendance %, recent sales                       |
| Clients          | Search clients by name / mobile / NID                                                                 |
| New Client       | Register a walk-in customer (mobile + NID validation, optional referral)                             |
| Sell Token       | Pick a client → enter tokens → optional cart of menu items → finalize (creates sale + purchases)     |
| Sales            | Worker's own sales history                                                                            |
| My Progress      | Personal stats + daily token-balance history                                                          |
| Attendance       | Single-click "Mark me present" (auto late after 10 am)                                               |
| Complaints       | File a complaint, view all (with submitter resolved by id)                                           |

---

## 9. Data Model

All types live in [lib/types.ts](./lib/types.ts) and mirror the MongoDB schemas exposed by the backend:

- `User` — admin / manager / worker
- `Client`
- `Product` — `costPrice`, `sellingPrice`, `stock`, derived `status`
- `TokenSale` — `clientId` + `workerId` (names resolved client-side)
- `ClientPurchase` — items a client bought with tokens
- `AttendanceEntry` — `workerId`, `date`, `status: present | absent | late`
- `Complaint` — `byId`, status `open | in-progress | resolved`
- `Bonus`
- `TableAssignment` — `workerId`, status `active | free`
- `DailyProgress` — `workerId`, `tokenGiven`, `tokenSold`, computed `balance`
- `AnalyticsOverview`, `WorkerAnalytics`

IDs are MongoDB ObjectIds returned as strings under the `id` field (plus `_id` for compatibility).

---

## 10. UI / UX

- **Inter** font family — clean, modern, geometric
- **Light/dark** theme toggle persisted to `localStorage`
- Fully responsive (360 px → 1440 px); sidebar collapses behind a hamburger on `< lg`
- Reusable primitives in `globals.css`: `.card`, `.input`, `.btn-primary`, `.btn-ghost`, `.badge`
- Reusable components: `DataTable` + `StatusBadge`, `Modal`, `StatCard`, `Sidebar` (icon chips + pastel backgrounds), `Header`, `DashboardShell`, `ThemeToggle`
- **Currency:** BDT (`৳`) for product pricing, TK (`tkn`) for token amounts
- **Design tokens** defined in `tailwind.config.ts` — accent (violet), success (emerald), card shadows, large radius

---

## 11. Roadmap

The frontend is feature-complete against the live backend. Potential next steps:

1. **Real authorization** — issue JWT on login, send as `Authorization: Bearer …`, verify in Express middleware, hash passwords with bcrypt.
2. **Charts** on the admin overview (recharts is a good fit).
3. **Product image uploads** (currently emoji).
4. **Sockets / live updates** for tables and inventory.
5. **PWA + offline cache** for workers in low-connectivity areas.
6. **Multi-branch** support via a `branchId` field on every collection.

---
---

Token Dine is a full-stack restaurant management dashboard built with Next.js 14, TypeScript, and Tailwind CSS. It digitizes the complete operations of a prepaid token-based restaurant: workers sell tokens to clients, redeem them against menu items, and track attendance; managers monitor daily progress, inventory, sales, and worker performance; admins oversee users, clients, products, analytics, bonuses, and complaints.
The frontend is fully wired to a live REST API (Axios + service-layer architecture), features a referral system with auto bonus credits, smart bonus-recommendation logic, and a role-based UI with light/dark theming. With 25+ responsive pages across three role dashboards, it's a complete, production-ready prototype demonstrating modern React patterns, real-time data flow, and clean, scalable design.

---
## 12. License

Internal project — no public license.
