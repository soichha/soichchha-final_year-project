# QuickShip — Courier Management and Delivery Prediction System

QuickShip is a full-stack courier / parcel delivery management system built with **React (Vite) + Express + MySQL (Sequelize)**. It combines a complete booking/tracking/payment workflow with three explainable algorithms — Haversine distance calculation, Random Forest delivery-time prediction, and a Weighted Staff Recommendation algorithm — plus a rule-based Virtual Help Assistant.

Built as a BCA 8th Semester Final Year Project.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts, Axios, React Hook Form, html5-qrcode, qrcode, Leaflet |
| Backend | Node.js, Express, Sequelize ORM |
| Database | MySQL |
| Auth | JWT (jsonwebtoken) + bcrypt password hashing |
| Machine Learning | Random Forest Regressor (`ml-random-forest`) — delivery time prediction |
| Email | Nodemailer (SMTP) — booking/assignment/delivered notifications only (not used for password reset or delivery confirmation) |

---

## Folder Structure

```
QuickShip/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── components/        # Reusable UI (modals, QR code/scanner, timeline, invoice, chatbot widget)
│       ├── layouts/           # Admin / Staff / Customer / Public shell layouts
│       ├── pages/             # Route-level pages, grouped by role
│       ├── styles/            # Tailwind layer stylesheets
│       └── utils/             # Client-side helpers (CSV export, distance calc, cost breakdown)
│
└── server/                    # Express backend
    ├── controllers/           # Thin HTTP controllers (Reports)
    ├── models/                # Sequelize models
    ├── ml/                    # Persisted trained model + evaluation metrics (generated, not committed)
    ├── routes/                # Express routers (+ auth/role middleware)
    ├── services/              # Business logic — ML prediction, staff assignment, notifications, reports, chatbot
    ├── utils/                 # Algorithms (Haversine, cost, ETA) & shared constants
    ├── scripts/                # DB seed script (npm run seed)
    └── server.js               # App entry point
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8+ (or MariaDB) running locally or reachable

### 1. Database

```sql
CREATE DATABASE quickship;
```

Or import the provided schema directly:

```bash
mysql -u root -p < quickship_schema.sql
```

Either way, tables are also created/kept in sync automatically by the backend (`sequelize.sync({ alter: true })`) on every server start, so a manual import is optional.

### 2. Backend setup

```bash
cd server
cp .env.example .env      # then edit .env — see Environment Variables below
npm install
npm run seed               # creates an admin account + starter locations
npm run dev                # nodemon, http://localhost:5000
```

Default seeded admin login: `admin@quickship.com` / `admin123` — **change this password after first login.**

### 3. Frontend setup

```bash
cd client
npm install
npm run dev                # http://localhost:5173
```

The frontend calls the API directly at `http://localhost:5000` — make sure the backend is running first.

### 4. Creating staff accounts
Staff accounts can't self-register. Log in as admin → Staff Management → Add Staff.

---

## Environment Variables

See `server/.env.example` for the full list. Copy it to `server/.env` and fill in your own values — **never commit the real `.env` file.**

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` | MySQL connection |
| `PORT` | Backend port (default 5000) |
| `JWT_SECRET` | Required — the server refuses to start without it |
| `ESEWA_*` | eSewa sandbox payment credentials |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | SMTP credentials for booking/staff-assignment/delivered notification emails. If `EMAIL_USER` is left blank, emails are safely skipped (logged to console) instead of failing — useful for local development without a mail account. |
| `CLIENT_URL` | Used to build the eSewa success/failure redirect URLs |

---

## Roles

| Role | Access |
|---|---|
| `client` (customer) | Book parcels, track, QR scan, view bookings/history, pay, view invoice, leave feedback |
| `staff` | View assigned parcels, update delivery status, confirm delivery, record delivery attempts / reschedules, view delivery history/feedback |
| `admin` | Full access — staff/customer/parcel management, Analytics, ML Prediction, Delivery Accuracy Report, Activity Log |

---

## Complete Feature List

**Authentication**
- Registration, Login, Forgot Password / Reset Password (self-service, no email link — email is verified server-side, then the account holder sets a new password directly), JWT authentication, role-based authorization

**Customer**
- Parcel booking with live cost breakdown and ML delivery-time estimate
- Booking history, parcel tracking (manual ID or QR scan), visual delivery timeline (including delivery attempts and reschedules)
- Invoice with QR code, eSewa/COD payment, feedback (star rating + review)

**Staff**
- Assigned parcels, delivery status updates, Delivery Confirmation (receiver name + remarks, no OTP), Record Delivery Attempt / Reschedule, delivery history

**Admin**
- Dashboard, customer/staff/parcel management, Analytics, ML Prediction, Delivery Accuracy Report, Activity Log (audit trail of staff/admin actions)

**Core Features**
- QuickShip Virtual Help Assistant — rule/intent-based, not AI/ML, answers from live data
- Weighted Staff Recommendation — workload + distance + availability + success rate, with a transparent score and admin accept/override
- QR code generation (every parcel) + camera-based QR scanning for tracking
- Email notifications (booking, staff assignment, delivered)
- Delivery Exception & Rescheduling — staff can record a failed delivery attempt (reason + remarks) and, optionally, a new delivery date
- Admin Activity Log — who did what, when, on which parcel
- Delivery charge breakdown (base + weight + distance, shown live and on the invoice)

**Random Forest Delivery-Time Prediction (the one genuine ML module)**
-Implements a Random Forest regression component designed to estimate parcel delivery time.

-Uses features such as distance, parcel weight, delivery type, and express priority.

-The model requires sufficient historical delivery data before training and evaluation.

-Until the model is trained and evaluated, prediction accuracy has not been established.

-A rule-based estimate is used as a fallback when the trained model is unavailable.

See `AI_ARCHITECTURE.md` for full technical detail on the ML pipeline.

---

## Notable Implementation Notes

- Demand Forecasting, sentiment analysis, and recommendation-engine style features were deliberately **not** included — the project uses exactly one real ML module (delivery time prediction) rather than several superficial ones.
- `predicted_delivery_hours` and `prediction_source` (`'ml'` or `'fallback'`) are stored on each parcel so the Delivery Accuracy Report can always show which method produced a given prediction.
- Delivery confirmation no longer requires an OTP — a staff member marks a parcel `Delivered` directly through `PUT /:id/deliver`, entering the receiver name and any remarks. The general status-update endpoint (`PUT /:id/status`) explicitly rejects `Delivered`, `Delivery Attempt Failed`, and `Rescheduled` to keep those transitions going through their dedicated, audited endpoints.
- Parcel status transitions are validated server-side against an explicit allowed-transition map (`server/utils/statusTransitions.js`) so a parcel can't be pushed into a nonsensical state (e.g. `Delivered` back to `Out for Delivery`).
- A staff member can only update, confirm delivery for, or record a delivery attempt on a parcel that is actually assigned to them; this is checked server-side on every relevant endpoint, not just enforced by the UI.
- Shared parcel-status groupings live in `server/utils/constants.js` and are reused across services rather than duplicated.

---

## Known Limitations

- No automated test suite (unit/integration tests) — verification for this project was done through manual and scripted end-to-end testing against a live database.
- No explicit rate-limiting on the password-reset or delivery-attempt endpoints (password reset requires knowing the account's email; delivery-attempt/deliver endpoints are staff/admin-only and JWT-protected).
- The ML model's accuracy improves as more parcels are actually delivered — with a small dataset, predictions lean on the rule-based fallback, which is by design rather than a bug.
- Frontend bundle is a single chunk (~1.4MB) — code-splitting was not applied since it wasn't required for functionality.
