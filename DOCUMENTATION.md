# TEAnest — FineLEAF Project Documentation

> **Last updated:** 2026-06-26  
> **Project:** Tea Estate Management System  
> **Repo root:** `FineLEAF/`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Backend](#4-backend)
   - 4.1 [Entry Point — server.js](#41-entry-point--serverjs)
   - 4.2 [Database Config](#42-database-config)
   - 4.3 [Models](#43-models)
   - 4.4 [Controllers](#44-controllers)
   - 4.5 [Routes & API Reference](#45-routes--api-reference)
   - 4.6 [Validators](#46-validators)
5. [Frontend](#5-frontend)
   - 5.1 [Entry & Routing — App.jsx](#51-entry--routing--appjsx)
   - 5.2 [API Layer](#52-api-layer)
   - 5.3 [Layout & Shell Components](#53-layout--shell-components)
   - 5.4 [Pages](#54-pages)
   - 5.5 [Merchant Sub-Components](#55-merchant-sub-components)
   - 5.6 [Shared Components](#56-shared-components)
6. [Business Logic — Calculation Chain](#6-business-logic--calculation-chain)
7. [Authentication Flow](#7-authentication-flow)
8. [Environment Variables](#8-environment-variables)
9. [Running the Project](#9-running-the-project)
10. [Changelog](#10-changelog)

---

## 1. Project Overview

**TEAnest** is a full-stack Tea Estate Management System built for tea garden owners and managers. It tracks:

| Module | Purpose |
|---|---|
| **Merchant (Procurement)** | Record tea procurement transactions from merchants, track quantity, rate, labor deductions, advance payments, and outstanding balances. |
| **Factory (Sales)** | Track tea sales to buyers, manage payment instalments, and calculate dues. |
| **Labor** | Manage estate workforce — pluckers, factory workers, supervisors, etc. |
| **Payments** | General payment ledger — salary, bonus, advances, supplier payments. |
| **Dashboard** | Overview of production batches and KPIs (currently uses static demo data). |

---

## 2. Tech Stack

### Backend
| Dependency | Version | Role |
|---|---|---|
| Node.js + Express | 4.x | HTTP server & routing |
| MongoDB + Mongoose | 7.x | Database & ORM |
| bcryptjs | 3.x | Password hashing |
| jsonwebtoken | 9.x | JWT auth token generation |
| express-validator | 7.x | Request body validation |
| dotenv | 16.x | Environment configuration |
| cors | 2.x | Cross-origin requests |
| nodemon | 3.x (dev) | Auto-restart on file change |

### Frontend
| Dependency | Version | Role |
|---|---|---|
| React | 18.x | UI library |
| Vite | 5.x | Build tool & dev server |
| React Router DOM | 7.x | Client-side routing |
| Axios | 1.7.x | HTTP client |
| react-hot-toast | 2.4.x | Toast notifications |
| Tailwind CSS | 3.x | Utility-first styling |

---

## 3. Directory Structure

```
FineLEAF/
├── backend/
│   ├── config/
│   │   └── db.js                        # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js            # Register / Login / Reset password
│   │   ├── merchantController.js        # Tea batch (legacy merchant) CRUD
│   │   ├── merchantTransactionController.js  # Procurement transactions CRUD
│   │   ├── merchantPaymentController.js # Payments against transactions
│   │   ├── factoryController.js         # Factory sales CRUD + payments
│   │   ├── laborController.js           # Workforce CRUD
│   │   └── paymentController.js         # General payment ledger CRUD
│   ├── models/
│   │   ├── User.js
│   │   ├── TeaMerchant.js               # Legacy batch model
│   │   ├── MerchantTransaction.js       # Procurement transaction model
│   │   ├── MerchantPayment.js           # Payment sub-document model
│   │   ├── Factory.js                   # Factory sales model
│   │   ├── Labor.js                     # Worker model
│   │   └── Payment.js                   # General payment ledger model
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── merchantRoutes.js
│   │   ├── merchantTransactionRoutes.js
│   │   ├── merchantPaymentRoutes.js
│   │   ├── factoryRoutes.js
│   │   ├── laborRoutes.js
│   │   └── paymentRoutes.js
│   ├── validators/
│   │   ├── merchantValidator.js
│   │   ├── merchantTransactionValidator.js
│   │   ├── factoryValidator.js
│   │   ├── laborValidator.js
│   │   └── paymentValidator.js
│   ├── .env                             # Not committed — see §8
│   ├── package.json
│   └── server.js                        # App entry point
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── api/
    │   │   ├── authApi.js
    │   │   ├── merchantApi.js           # Axios instance + merchant endpoints
    │   │   ├── merchantTransactionApi.js # Txn endpoints + client-side compute
    │   │   ├── laborApi.js
    │   │   ├── factoryApi.js
    │   │   └── paymentsApi.js
    │   ├── components/
    │   │   ├── Layout.jsx               # App shell (header + sidebar + outlet)
    │   │   ├── Sidebar.jsx              # Nav links + logout
    │   │   ├── Header.jsx               # Top bar (if used separately)
    │   │   ├── ConfirmationModal.jsx    # Reusable confirm dialog
    │   │   ├── TransactionDetailModal.jsx # Slide-in drawer for txn details + payments
    │   │   └── merchant/
    │   │       ├── MerchantStatCards.jsx
    │   │       ├── MerchantTableFilters.jsx
    │   │       ├── MerchantTransactionForm.jsx
    │   │       ├── MerchantTransactionTable.jsx
    │   │       └── CustomDateRangeModal.jsx
    │   ├── contexts/                    # (empty — no global context yet)
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── ForgotPasswordPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── MerchantPage.jsx
    │   │   ├── LaborPage.jsx
    │   │   ├── FactoryPage.jsx
    │   │   ├── PaymentsPage.jsx
    │   │   └── PlaceholderPages.jsx     # ReportsPage stub
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── style.css
    ├── index.html
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 4. Backend

### 4.1 Entry Point — `server.js`

- Loads env vars via `dotenv.config()`
- Calls `connectDB()` to connect to MongoDB
- **One-time migration**: On the first DB `open` event, drops the stale unique `orderId` index from the `factory` collection (left over from the old schema design) to prevent `E11000` duplicate key errors.
- Registers all route groups under `/api/*`
- Exposes a health-check endpoint: `GET /api/health → { status: 'ok', project: 'TEAnest' }`
- Catches unmatched routes with a `404` JSON response
- Starts on `PORT` from env or defaults to **5000**

---

### 4.2 Database Config

**File:** `backend/config/db.js`

```js
mongoose.connect(process.env.MONGO_URI)
```

Exits the process (`process.exit(1)`) if the connection fails. On success it logs the connected host.

---

### 4.3 Models

#### `User`
**Collection:** `users`

| Field | Type | Constraints |
|---|---|---|
| name | String | required, trim |
| phone | String | required, unique, trim |
| password | String | required (stored as bcrypt hash) |
| role | String | enum: `['Admin', 'Manager']`, default: `'Manager'` |
| timestamps | — | createdAt, updatedAt |

---

#### `TeaMerchant` (Legacy Batch Model)
**Collection:** `teamerchants`

| Field | Type | Constraints |
|---|---|---|
| batchId | String | required, unique, uppercase |
| teaType | String | required, enum: `['Green Tea','CTC','Other']` |
| quantity | Number | required, min: 0 |
| unit | String | enum: `['kg','g','lb']`, default: `'kg'` |
| pricePerUnit | Number | required, min: 0 |
| harvestDate | Date | required |
| name | String | required, trim |
| notes | String | maxlength: 500 |

**Virtual:** `totalValue = quantity × pricePerUnit` (included in JSON via `toJSON: { virtuals: true }`)

---

#### `MerchantTransaction` ⭐ (Core Procurement Model)
**Collection:** `merchanttransactions`

**Stored raw inputs:**

| Field | Type | Default | Notes |
|---|---|---|---|
| transactionId | String | auto-generated (`TXN-*`) | unique, uppercase, indexed |
| merchantName | String | — | required |
| teaType | String | — | enum: `['Green Tea','CTC','Other']` |
| transactionDate | Date | `Date.now` | required |
| grossQty | Number | — | required, min: 0 |
| lessPercent | Number | 0 | min: 0, max: 100 |
| ratePerKg | Number | — | required, min: 0 |
| laborCount | Number | 0 | min: 0 |
| laborChargePerWorker | Number | 0 | min: 0 |
| advancePayment | Number | 0 | min: 0 |
| notes | String | — | maxlength: 500 |

**Persisted calculated fields** (see [§6 Calculation Chain](#6-business-logic--calculation-chain)):

| Field | Default |
|---|---|
| lessQty | 0 |
| netQty | 0 |
| grossAmount | 0 |
| totalLaborCharges | 0 |
| netPayable | 0 |
| finalPayable | 0 |
| balance | 0 |

**Hooks:**
- `pre('save')` — calls `_recalculate()` to update all derived fields. For **existing** docs it also fetches all `MerchantPayment` records and recomputes `balance = finalPayable − totalPaid`.
- `pre('findOneAndUpdate')` — same recalculation applied to update operations, also fetches payments to keep `balance` in sync.

**Static method:** `MerchantTransaction.computeFields(data)` — pure function, callable from controllers without a model instance.

---

#### `MerchantPayment`
**Collection:** `merchantpayments`

| Field | Type | Constraints |
|---|---|---|
| transaction | ObjectId (ref: MerchantTransaction) | required, indexed |
| paymentId | String | unique, uppercase, auto-generated (`PAY-*`) |
| amount | Number | required, min: 1 |
| paymentDate | Date | required, default: `Date.now` |
| paymentMode | String | enum: `['Cash','Bank Transfer','Cheque','UPI','Other']`, default: `'Cash'` |
| notes | String | maxlength: 500 |

After every payment create/delete the parent transaction's `balance` is recalculated and saved.

---

#### `Factory`
**Collection:** `factories`

| Field | Type | Notes |
|---|---|---|
| date | Date | default: `Date.now` |
| buyerName | String | required |
| totalQuantity | Number | required, min: 0 |
| lessPercentage | Number | default: 0 |
| rate | Number | required (₹/kg) |
| advance | Number | default: 0 |
| payments | [PaymentSchema] | array of embedded sub-documents |
| dueDate | Date | optional |
| remarks | String | maxlength: 500 |

**Embedded `paymentSchema`:** `{ date, amount, mode: ['Cash','Online','Cheque'] }`

**Virtuals** (all use `|| 0` fallbacks for legacy docs):

| Virtual | Formula |
|---|---|
| lessQuantity | totalQuantity × lessPercentage / 100 |
| netQuantity | totalQuantity − lessQuantity |
| totalAmount | netQuantity × rate |
| totalPaid | sum of `payments[].amount` |
| due | totalAmount − advance − totalPaid |

Virtuals exposed via `toJSON` and `toObject`.

---

#### `Labor`
**Collection:** `labors`

| Field | Type | Constraints |
|---|---|---|
| name | String | required |
| role | String | enum: `['Plucker','Factory Worker','Supervisor','Maintenance','Other']` |
| contact | String | optional |
| dailyWage | Number | required, min: 0 |
| joinDate | Date | required, default: `Date.now` |
| status | String | enum: `['Active','Inactive','On Leave']`, default: `'Active'` |
| notes | String | maxlength: 500 |

---

#### `Payment` (General Ledger)
**Collection:** `payments`

| Field | Type | Constraints |
|---|---|---|
| payeeName | String | required |
| paymentType | String | enum: `['Salary','Advance','Bonus','Supplier','Other']` |
| amount | Number | required, min: 0 |
| paymentDate | Date | required, default: `Date.now` |
| status | String | enum: `['Pending','Completed','Failed']`, default: `'Pending'` |
| referenceId | String | optional |
| notes | String | maxlength: 500 |

---

### 4.4 Controllers

All controllers follow the same pattern:
- `async (req, res)` functions
- Return `{ success: true, data: ... }` on success
- Return `{ success: false, message: ... }` on failure
- Use `try/catch` with appropriate HTTP status codes

#### `authController.js`

| Function | Description |
|---|---|
| `registerUser` | Hash password with bcrypt (salt=10), create user, return JWT token |
| `loginUser` | Find user by phone, compare password with bcrypt, return JWT |
| `resetPassword` | Find user by phone, hash new password, save |

JWT token expiry: **30 days**  
Secret: `process.env.JWT_SECRET` (falls back to `'fallback_secret'` if not set)

> ⚠️ **Note:** Routes are not JWT-protected middleware-wise yet — the token is issued but not verified on protected routes. Auth is only enforced client-side via `localStorage.getItem('token')` check in `ProtectedRoute`.

---

#### `merchantController.js` (Legacy Batch Controller)

| Function | Method | Description |
|---|---|---|
| `getAll` | GET | Filter by `teaType`, `search` (name regex), paginate |
| `getStats` | GET | Aggregate: total batches, quantity, value, avg price; breakdown by tea type |
| `getById` | GET | Find single batch by MongoDB `_id` |
| `create` | POST | Auto-generate `batchId` if not provided (`BTH-*`), validate, create |
| `update` | PUT | Update with validators, return updated doc |
| `remove` | DELETE | Find by ID and delete |

---

#### `merchantTransactionController.js` ⭐

| Function | Method | Description |
|---|---|---|
| `getAll` | GET | Filter by `teaType`, `merchantName`, `search`, date range (`startDate`/`endDate`), paginate. End date is set to `23:59:59.999` to include the full day. |
| `getStats` | GET | Aggregate totals: transactions, quantities, amounts, balance; breakdown by tea type; last 5 recent entries |
| `getById` | GET | Find by `_id` |
| `create` | POST | Auto-generate `transactionId` (`TXN-*`); call `computeFields()` before save for double-safety |
| `update` | PUT | Fetch existing doc, **merge** with request body, recalculate derived fields, update |
| `remove` | DELETE | Delete by `_id` |

---

#### `merchantPaymentController.js`

| Function | Method | Description |
|---|---|---|
| `getForTransaction` | GET | Returns transaction + all payments + live summary (finalPayable, totalPaid, remainingBalance, isPaidFull) |
| `create` | POST | Validates amount doesn't exceed remaining balance; auto-generates `paymentId`; updates parent transaction's `balance` |
| `remove` | DELETE | Deletes specific payment; recalculates and saves updated balance on parent transaction |

---

#### `factoryController.js`

| Function | Method | Description |
|---|---|---|
| `getAll` | GET | Search by `buyerName`, paginate (default limit: 50) |
| `getStats` | GET | Iterates all records to sum `totalAmount`, `advance`, `totalPaid`, `due` using `safe()` to avoid NaN on old docs |
| `getById` | GET | Find by `_id` |
| `create` | POST | Validate + create |
| `update` | PUT | Validate + update |
| `remove` | DELETE | Delete |
| `addPayment` | POST | Push new payment to `payments[]` array and save |
| `removePayment` | DELETE | Splice payment by index from `payments[]` and save |

---

#### `laborController.js`

| Function | Method | Description |
|---|---|---|
| `getAll` | GET | Filter by `role`, `status`, `search` (name regex), paginate |
| `getStats` | GET | Aggregate: total workers, active workers, avg wage; breakdown by role |
| `getById` | GET | — |
| `create` | POST | — |
| `update` | PUT | — |
| `remove` | DELETE | — |

---

#### `paymentController.js`

| Function | Method | Description |
|---|---|---|
| `getAll` | GET | Filter by `paymentType`, `status`, `search` (payeeName regex), paginate |
| `getStats` | GET | Aggregate: total transactions, total amount; breakdown by type |
| `getById` / `create` / `update` / `remove` | — | Standard CRUD |

---

### 4.5 Routes & API Reference

**Base URL:** `http://localhost:5000/api`

#### Auth — `/api/auth`

| Method | Path | Controller | Description |
|---|---|---|---|
| POST | `/register` | `registerUser` | Create new user account |
| POST | `/login` | `loginUser` | Login, receive JWT |
| POST | `/reset-password` | `resetPassword` | Reset password by phone |

---

#### Merchant (Legacy Batches) — `/api/merchant`

| Method | Path | Controller |
|---|---|---|
| GET | `/` | `getAll` |
| GET | `/stats` | `getStats` |
| GET | `/:id` | `getById` |
| POST | `/` | `create` |
| PUT | `/:id` | `update` |
| DELETE | `/:id` | `remove` |

**Query params for `GET /`:** `teaType`, `search`, `sort`, `page`, `limit`

---

#### Merchant Transactions — `/api/merchant-transactions`

| Method | Path | Controller |
|---|---|---|
| GET | `/stats` | `getStats` |
| GET | `/` | `getAll` |
| GET | `/:id` | `getById` |
| POST | `/` | `create` |
| PUT | `/:id` | `update` |
| DELETE | `/:id` | `remove` |

**Query params for `GET /`:** `merchantName`, `teaType`, `search`, `startDate`, `endDate`, `sort`, `page`, `limit`

> ⚠️ `/stats` is declared **before** `/:id` to prevent Express from capturing `"stats"` as an `id` param.

---

#### Merchant Payments — `/api/merchant-transactions/:txnId/payments`

| Method | Path | Controller |
|---|---|---|
| GET | `/` | `getForTransaction` |
| POST | `/` | `create` |
| DELETE | `/:payId` | `remove` |

Uses `Router({ mergeParams: true })` to access `:txnId` from the parent router.

---

#### Factory — `/api/factory`

| Method | Path | Controller |
|---|---|---|
| GET | `/stats` | `getStats` |
| GET | `/` | `getAll` |
| GET | `/:id` | `getById` |
| POST | `/` | `create` |
| PUT | `/:id` | `update` |
| DELETE | `/:id` | `remove` |
| POST | `/:id/payments` | `addPayment` |
| DELETE | `/:id/payments/:paymentId` | `removePayment` |

---

#### Labor — `/api/labor`

| Method | Path | Controller |
|---|---|---|
| GET | `/stats` | `getStats` |
| GET | `/` | `getAll` |
| GET | `/:id` | `getById` |
| POST | `/` | `create` |
| PUT | `/:id` | `update` |
| DELETE | `/:id` | `remove` |

---

#### Payments — `/api/payments`

| Method | Path | Controller |
|---|---|---|
| GET | `/stats` | `getStats` |
| GET | `/` | `getAll` |
| GET | `/:id` | `getById` |
| POST | `/` | `create` |
| PUT | `/:id` | `update` |
| DELETE | `/:id` | `remove` |

---

### 4.6 Validators

All validators use `express-validator`'s `body()` chains.

#### `merchantTransactionValidator.js`

**`createRules`:** `merchantName` (required), `teaType` (required, enum), `transactionDate` (ISO8601), `grossQty` (float ≥ 0), `lessPercent` (0–100), `ratePerKg` (float ≥ 0), `laborCount` (int ≥ 0), `laborChargePerWorker` (float ≥ 0), `advancePayment` (float ≥ 0), `notes` (max 500)

**`updateRules`:** All fields optional with same type checks.

---

#### `factoryValidator.js`

**`createRules`:** `date` (ISO8601, optional), `buyerName` (required), `totalQuantity` (float > 0), `lessPercentage` (0–100, optional), `rate` (float > 0), `advance` (float ≥ 0, optional), `dueDate` (ISO8601, optional), `remarks` (string max 500, optional)

**`paymentRules`:** `date` (ISO8601, optional), `amount` (float > 0.01), `mode` (enum: Cash/Online/Cheque)

---

#### `laborValidator.js`

**`createRules`:** `name` (required), `role` (required, enum), `contact` (optional), `dailyWage` (float ≥ 0), `joinDate` (ISO8601, optional), `status` (enum, optional)

---

#### `paymentValidator.js`

**`createRules`:** `payeeName` (required), `paymentType` (required, enum), `amount` (float ≥ 0), `paymentDate` (ISO8601, optional), `status` (enum, optional), `referenceId` (optional)

---

## 5. Frontend

### 5.1 Entry & Routing — `App.jsx`

**Route structure:**

```
/login              → LoginPage (public)
/register           → RegisterPage (public)
/forgot-password    → ForgotPasswordPage (public)
/                   → ProtectedRoute (checks localStorage 'token')
  └── Layout (Sidebar + Header shell)
       ├── /dashboard   → DashboardPage
       ├── /merchant    → MerchantPage
       ├── /labor       → LaborPage
       ├── /factory     → FactoryPage
       ├── /payments    → PaymentsPage
       └── /reports     → ReportsPage (placeholder)
* → redirect to /login
```

**`ProtectedRoute`:** Checks for `token` in `localStorage`. If absent, redirects to `/login`.

**Toaster config:** top-right, green `#1b5e20` background, 3-second duration, 12px border-radius.

---

### 5.2 API Layer

All API modules live in `frontend/src/api/`. The **shared Axios instance** is created in `merchantApi.js`:

```js
axios.create({ baseURL: 'http://localhost:5000/api' })
```

`merchantTransactionApi.js` creates its **own** Axios instance with an **interceptor** that attaches `Authorization: Bearer <token>` from `localStorage` on every request.

> ⚠️ Other API modules (`laborApi.js`, `factoryApi.js`, `paymentsApi.js`) re-use the base instance from `merchantApi.js` (imported as `API`) — **no auth interceptor** on those requests.

#### API modules summary

| File | Exported object | Endpoints covered |
|---|---|---|
| `authApi.js` | `authAPI` | login, register, resetPassword |
| `merchantApi.js` | `merchantAPI` + default `API` | merchant batch CRUD + stats |
| `merchantTransactionApi.js` | `merchantTxnAPI` + default `API` | txn CRUD + stats + payments sub-resource + **client-side `compute()`** |
| `laborApi.js` | `laborAPI` | labor CRUD + stats |
| `factoryApi.js` | `factoryAPI` | factory CRUD + stats + payments |
| `paymentsApi.js` | `paymentsAPI` | general payments CRUD + stats |

#### `merchantTxnAPI.compute(data)` — Client-side Mirror

This pure function mirrors the backend `computeFields()` logic for **instant UI feedback** without a network round-trip:

```
lessQty           = grossQty × (lessPercent / 100)
netQty            = grossQty − lessQty
grossAmount       = netQty × ratePerKg
totalLaborCharges = laborCount × laborChargePerWorker
netPayable        = grossAmount − totalLaborCharges
finalPayable      = netPayable − advancePayment
balance           = finalPayable
```

All values are rounded to 2 decimal places (`Math.round(n * 100) / 100`).

---

### 5.3 Layout & Shell Components

#### `Layout.jsx`
- Detects mobile breakpoint (`window.innerWidth < 768`) and stores as state
- **Mobile:** Sidebar is off-canvas (fixed, slide in/out) with a backdrop overlay
- **Desktop:** Sidebar is collapsible (72px icon-only vs 288px full)
- Toggle button in the header controls sidebar open/close state
- Renders `<Outlet />` in the main scrollable content area
- Decorative leaf SVG in the background (opacity 3%)

#### `Sidebar.jsx`
- Nav items: Dashboard, Merchant, Labor, Factory, Payments, Reports
- Active link highlighted with `bg-primary/10 text-primary`
- Labels slide in/out smoothly on collapse with CSS transitions
- Logout triggers a `ConfirmationModal`; on confirm clears `localStorage` (`isAuthenticated` + `token`) and navigates to `/login`

---

### 5.4 Pages

#### `DashboardPage.jsx`
- Currently **static demo data** — no API calls
- Shows 4 KPI stat cards: Daily Harvest, Batches Today, Quality Index, Revenue MTD
- Shows a "Recent Production Batches" table (4 hardcoded rows)
- Pagination controls present but non-functional

> ⚠️ This page needs to be connected to real API data in a future update.

---

#### `MerchantPage.jsx`
The most feature-complete page. Manages procurement transactions.

**State managed:**
- `transactions` — array from API
- `stats` — summary stats from API
- `form` — current form field values
- `editing` — `_id` of the transaction being edited (or `null` for create)
- `submitting` — prevents double submission
- `search`, `filterType`, `datePreset` — filter state
- `customDates` — `{ start, end }` for custom date range filter
- `showDateModal` — whether the custom date picker modal is open
- `detailTxnId` — which transaction to show in the detail drawer

**Key behaviors:**
- `loadData()` — fetches both transactions and stats in parallel
- On `datePreset` change to `'custom'`, opens the `CustomDateRangeModal`
- Date presets (`today`, `5day`) compute `startDate`/`endDate` locally before calling the API
- On create/edit submit: calls `merchantTxnAPI.create()` or `.update()`, shows toast, resets form
- On delete: shows `ConfirmationModal`, then calls `.remove()`
- Real-time calculation preview: `merchantTxnAPI.compute(form)` is called on every `form` change

---

#### `LaborPage.jsx`
- Full CRUD for labor records
- Filters: role, status, search
- Inline form (no separate modal) for create/edit
- Stats bar showing total/active workers and avg daily wage

---

#### `FactoryPage.jsx`
- Full CRUD for factory sale records
- Embedded payment history (add/remove payments per sale)
- Detailed view shows virtual calculations (lessQuantity, netQuantity, totalAmount, due)
- Very large page (~54 KB) — contains all factory UI logic inline

---

#### `PaymentsPage.jsx`
- General payment ledger
- Filters: paymentType, status, search
- CRUD with status management (Pending → Completed → Failed)

---

#### `LoginPage.jsx`
- Phone + password form
- Calls `authAPI.login()`, stores token in `localStorage`
- Redirects to `/dashboard` on success

#### `RegisterPage.jsx`
- Name + phone + password + role selection
- Calls `authAPI.register()`

#### `ForgotPasswordPage.jsx`
- Phone + new password form
- Calls `authAPI.resetPassword()`

---

### 5.5 Merchant Sub-Components

#### `MerchantStatCards.jsx`

Displays 4 summary cards using data from `stats.summary`:

| Card | Field |
|---|---|
| Total Transactions | `totalTransactions` |
| Net Qty Purchased | `totalNetQty` |
| Total Gross Amount | `totalGrossAmount` |
| Outstanding Balance | `totalBalance` |

---

#### `MerchantTableFilters.jsx`

**Props:**

| Prop | Type | Description |
|---|---|---|
| search | string | Current search query |
| filterType | string | Tea type filter value |
| datePreset | string | `''`, `'today'`, `'5day'`, `'custom'` |
| onSearchChange | fn(string) | Search input change handler |
| onFilterTypeChange | fn(string) | Tea type select change handler |
| onDatePresetChange | fn(string) | Date preset select change handler |

---

#### `MerchantTransactionForm.jsx`

Handles both create and edit modes.

**Props:**

| Prop | Type | Description |
|---|---|---|
| form | object | All form field values |
| editing | string\|null | `_id` when editing, `null` when creating |
| calc | object | Live-calculated values from `merchantTxnAPI.compute()` |
| submitting | boolean | Disables submit button during API call |
| onFieldChange | fn(name, value) | Field change handler |
| onSubmit | fn(event) | Form submit handler |
| onCancel | fn() | Cancel/reset handler |

**Internal components:**
- `InputField` — reusable labeled `<input>` with read-only styling support
- `CalcRow` — two-column label/value row in the calculation summary box

Derived display-only fields (Less Qty, Net Qty, Total Labor) are shown as non-editable boxes styled differently from inputs.

---

#### `MerchantTransactionTable.jsx`

**Props:**

| Prop | Type | Description |
|---|---|---|
| items | array | Transaction objects from API |
| loading | boolean | Shows spinner when true |
| onViewDetails | fn(id) | Opens detail drawer |
| onEdit | fn(item) | Populates form for editing |
| onDelete | fn(id) | Triggers delete confirmation |

**Columns:** Sl. No., Date, Merchant, Type, Gross Qty, Net Qty, Rate/kg, Gross Amt, Workers, Labor Total, Advance, Balance, Action

**`BalanceBadge`** component:
- `balance > 0` → 🟠 "Amount Due"
- `balance < 0` → 🔴 "Overpaid"
- `balance === 0` → 🟢 "Paid"

---

#### `CustomDateRangeModal.jsx`

Accessible modal for picking a date range.

**Props:**

| Prop | Type | Description |
|---|---|---|
| isOpen | boolean | Controls visibility |
| tempDates | `{start, end}` | Controlled date values |
| onChange | fn({start, end}) | Date change handler |
| onApply | fn() | Apply filter |
| onReset | fn() | Clear dates and close |
| onCancel | fn() | Close without applying |

- Closes on `Escape` key (via `useEffect` event listener)
- Closes on backdrop click
- Apply button disabled until both start and end dates are set
- `end` date picker has `min={tempDates.start}` to prevent invalid ranges

---

### 5.6 Shared Components

#### `TransactionDetailModal.jsx`

A right-side slide-in drawer (`animate-slide-in-right`) that shows full transaction details and manages payments.

**Props:** `txnId` (string), `onClose` (fn)

**Sections:**
1. **Merchant Info** — name, tea type, transaction date, transaction ID
2. **Quantity Breakdown** — grossQty, less %, lessQty, netQty, rate
3. **Financial Breakdown** — grossAmount, labor deduction, netPayable, advance, finalPayable
4. **Payment Summary** — finalPayable, totalPaid, remainingBalance (green if fully paid, orange if pending)
5. **Record Payment button** — only shown when not fully paid; pre-fills remaining balance; toggling hides/shows the payment form
6. **Payment Form** — amount (capped at remainingBalance), date, mode (Cash/Bank Transfer/Cheque/UPI/Other), notes
7. **Payment History** — chronological list of payments; each shows date, mode, notes, amount; delete button with `ConfirmationModal`

**State:** `data`, `loading`, `payForm`, `submitting`, `showPayForm`, `showDeleteConfirm`, `deletePayId`

**Data flow:**
1. `load()` calls `merchantTxnAPI.getPayments(txnId)` → sets `data = { transaction, payments, summary }`
2. `handlePay()` calls `merchantTxnAPI.addPayment()` → reloads
3. `handleConfirmDeletePayment()` calls `merchantTxnAPI.deletePayment()` → reloads

---

#### `ConfirmationModal.jsx`

Generic confirm/cancel dialog.

**Props:** `isOpen`, `title`, `message`, `confirmText`, `cancelText`, `isDangerous` (red confirm button), `onConfirm`, `onCancel`

---

## 6. Business Logic — Calculation Chain

> This logic is implemented in **three places** and must stay in sync:
> 1. `MerchantTransaction.js` model (`computeFields()` function)
> 2. `merchantTransactionController.js` (calls `computeFields()` on create/update)
> 3. `merchantTransactionApi.js` frontend (`compute()` method for live UI preview)

```
Given raw inputs:
  grossQty, lessPercent, ratePerKg, laborCount, laborChargePerWorker, advancePayment

Step 1:  lessQty           = grossQty × (lessPercent / 100)
Step 2:  netQty            = grossQty − lessQty
Step 3:  grossAmount       = netQty × ratePerKg
Step 4:  totalLaborCharges = laborCount × laborChargePerWorker
Step 5:  netPayable        = grossAmount − totalLaborCharges
Step 6:  finalPayable      = netPayable − advancePayment
Step 7:  balance           = finalPayable − totalPaid
          (totalPaid = sum of all MerchantPayment.amount for this transaction)
```

All intermediate results are **rounded to 2 decimal places** using:
```js
Math.round(n * 100) / 100
```

**`balance` semantics:**
- `balance > 0` → merchant is still owed money
- `balance < 0` → merchant has been overpaid
- `balance === 0` → fully settled

The `balance` field on the transaction document is recalculated and saved whenever:
- A new payment is added (`merchantPaymentController.create`)
- A payment is deleted (`merchantPaymentController.remove`)
- The transaction itself is saved or updated (`MerchantTransaction` pre-save/pre-findOneAndUpdate hooks)

---

## 7. Authentication Flow

```
1. User submits phone + password on /login
2. Frontend calls POST /api/auth/login
3. Backend: find user by phone → bcrypt.compare(password, hash)
4. On success: JWT signed with { id: user._id }, expires in 30 days
5. Frontend stores token in localStorage('token')
6. ProtectedRoute checks localStorage('token') on every navigation
7. merchantTransactionApi.js attaches token as Authorization header
8. On logout: localStorage.removeItem('token') + navigate('/login')
```

> ⚠️ **Current limitation:** The backend does **not** verify JWT on any route. Middleware for `protect` / `authenticate` is not yet implemented. All API routes are currently unprotected.

---

## 8. Environment Variables

**File:** `backend/.env` (not committed to git)

| Variable | Description | Example |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/teanest` |
| `JWT_SECRET` | Secret key for JWT signing | `your_secret_key_here` |
| `PORT` | Server port (optional) | `5000` |

---

## 9. Running the Project

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally or connection string to Atlas

### Backend
```bash
cd backend
npm install
# Create .env with MONGO_URI and JWT_SECRET
npm run dev        # nodemon (auto-restart)
# or
npm start          # plain node
```
Server starts on `http://localhost:5000`

### Frontend
```bash
cd frontend
npm install
npm run dev        # Vite dev server
```
App opens on `http://localhost:5173` (default Vite port)

> **⚠️ Common URL Mistake:**
> When copying the terminal output, use **either** the Local URL (`http://localhost:5173`) **or** the Network URL (e.g., `http://10.5.x.x:5173`).
> **Do not combine them** (e.g., `http://localhost:10.5.0.2:5005`). Doing so creates an invalid URL and will cause your browser to perform a Google search instead of loading the app.

---

## 10. Changelog

> Update this section whenever logic is changed.

| Date | Area | Change |
|---|---|---|
| 2026-06-26 | Docs | Initial complete documentation created |
| 2026-06-26 | frontend/src/components/merchant/MerchantProfileDrawer.jsx | **[NEW]** Merchant Profile Drawer — when "View Details" is clicked for any transaction, slides in a right-side drawer that fetches ALL transactions for that merchant (by `merchantName` query), shows a 4-card summary (total net qty, gross amount, final payable, outstanding balance), then lists each transaction as a collapsible accordion card. Each card expands to show quantity/financial breakdown + inline payment history + "Record Payment" form. Payments can be added or deleted from within each card. |
| 2026-06-26 | frontend/src/components/merchant/MerchantTransactionTable.jsx | `onViewDetails` now passes the **full item object** (not just `item._id`) so the parent can extract `merchantName`. Button tooltip updated to "View Merchant History". |
| 2026-06-26 | frontend/src/pages/MerchantPage.jsx | Replaced `TransactionDetailModal` with `MerchantProfileDrawer`. Renamed `selectedTxnId` state to `selectedMerchant` (stores `merchantName` string). `onViewDetails` handler now calls `setSelectedMerchant(item.merchantName)`. |

| 2026-06-26 | backend/models/MerchantTransaction.js | **[BUG FIX]** `pre('findOneAndUpdate')` hook: old version called `computeFields(data)` on only the `$set` partial update — missing fields (e.g. `grossQty`) were `undefined → 0 → finalPayable = 0 → balance = 0 → "Paid" badge`. Fix: hook now fetches the existing document and merges it with the incoming update before computing, so all fields are always present. Also added `try/catch` so a hook error never blocks the update. |
| 2026-06-26 | backend/controllers/merchantTransactionController.js | **[BUG FIX]** Added `MerchantPayment` import. `update()` controller now explicitly fetches all existing payments, computes `balance = finalPayable − totalPaid`, and passes it directly in the `findByIdAndUpdate` payload (`{ ...req.body, ...calc, balance }`). This is a belt-and-suspenders fix — balance is now set in both the controller AND the model hook, guaranteeing it is always correct regardless of Mongoose version internals. |

| 2026-06-26 | backend/models/Labor.js | **[REDESIGN]** Removed `contact`, `dailyWage`, `status` (Active/Inactive/On Leave). Added `laborCharge: Number` (amount owed to worker) and `paymentStatus: 'Due' \| 'Paid'` (default `'Due'`). |
| 2026-06-26 | backend/controllers/laborController.js | Updated `getAll` to filter by `paymentStatus` instead of old `status`. Updated `getStats` aggregate to compute `dueWorkers`, `paidWorkers`, `totalDue`, `totalCharge`. Added `togglePay` controller that flips `paymentStatus` between `'Due'` and `'Paid'`. |
| 2026-06-26 | backend/routes/laborRoutes.js | Added `PATCH /:id/pay` → `togglePay` route. |
| 2026-06-26 | backend/validators/laborValidator.js | Removed `contact`, `dailyWage`, `status` rules. Added `laborCharge` (float ≥ 0) and `paymentStatus` (enum) validation. |
| 2026-06-26 | frontend/src/api/laborApi.js | Added `togglePay(id)` method → `PATCH /labor/:id/pay`. |
| 2026-06-26 | frontend/src/pages/LaborPage.jsx | **[REDESIGN]** Removed contact/dailyWage/status fields from form and table. Added `laborCharge` input. Table now shows: Name, Role, Labor Charge (₹), Payment Status, Join Date, Actions. Actions: **Pay Now** (green gradient, sets Paid) and **Mark Due** (orange outline, reverts to Due) — both optimistically update the row without full reload. Stats cards updated: Total Workers, Due to Pay, Paid, Total Due (₹). |
| 2026-06-28 | backend/controllers/invoiceController.js | **[NEW]** Separate invoice controller created. Contains two exports: (1) `generateInvoice` — generates a PDF for a single `MerchantTransaction` by `_id`; (2) `generateInvoiceByMerchantDate` — fetches ALL transactions for a given `merchantName` on a specific `date` and generates a combined multi-row DOOARS GREEN FPO PAYMENT VOUCHER PDF. Logo is embedded as base64 from `backend/assets/logo.png` (watermark + header). Amount in words uses an Indian number system (Lakhs/Crores). PDF generated via `html-pdf-node`. Both endpoints support `?format=html` for browser preview. |
| 2026-06-28 | backend/assets/logo.png | **[NEW]** DOOARS GREEN FPO MCS LTD. company logo saved for invoice embedding. |
| 2026-06-28 | backend/routes/merchantTransactionRoutes.js | Added two invoice routes: `GET /invoice/by-merchant-date` (→ `generateInvoiceByMerchantDate`, must be declared before `/:id` to avoid param capture) and `GET /:id/invoice` (→ `generateInvoice`). |
| 2026-06-28 | backend/package.json | Added `html-pdf-node` dependency for PDF generation from HTML templates. |
| 2026-06-28 | frontend/src/api/merchantTransactionApi.js | Added three new invoice API methods: `invoiceUrlByDate(merchantName, date)` — returns a direct token-authenticated URL; `getInvoiceHtmlByDate(merchantName, date)` — fetches HTML string for iframe preview; `getInvoiceBlob(txnId)` — fetches single-txn PDF as a Blob URL. |
| 2026-06-28 | frontend/src/components/merchant/MerchantProfileDrawer.jsx | **[NEW FEATURE]** Added `InvoiceSection` sub-component inside the drawer. Flow: (1) User picks a date range ("From Date" and "To Date", defaults to today). (2) Clicks "Check Entries" → API call counts transactions for that merchant in that period, shows count badge or "no data" warning. (3) "Preview Invoice" button fetches HTML from backend, opens a full-screen iframe modal with a dark header bar and "Save PDF" button. (4) "Save as PDF" button triggers a `fetch` download of the PDF blob, saved as `invoice-<MERCHANT>-<DATE_RANGE>.pdf`. Invoice PDFs use the company logo as a background watermark (15% opacity). |

| 2026-06-28 | Docs | Updated §3 Directory Structure, §4.4 Controllers, §4.5 Routes, §5.2 API Layer, §5.5 Merchant Sub-Components to reflect invoice feature additions. |

---

*End of documentation. Please update §10 Changelog and the relevant section(s) whenever logic changes are made.*
