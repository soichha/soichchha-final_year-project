# 1. Project Title

**QuickShip – Courier Management and Delivery Prediction System**

# 2. Project Overview

QuickShip is a full-stack courier/parcel delivery management system. Customers book and track parcels, staff manage and deliver them, and administrators oversee operations, staff assignment, and delivery performance. The system uses three explainable algorithms — geographic distance calculation, machine-learning delivery-time prediction, and weighted staff recommendation — plus a rule-based customer support assistant.

# 3. Main Objectives

- Provide a working end-to-end courier management workflow (booking → assignment → delivery → tracking → payment).
- Predict delivery time using real historical data with a genuine, evaluated machine learning model.
- Recommend the most suitable delivery staff member using a transparent, deterministic formula.
- Give customers self-service support through a knowledge-based assistant.
- Keep the system honest: no fabricated metrics, no inflated "AI" claims beyond what is technically true.

# 4. User Roles

| Role | Access |
|---|---|
| **Admin** | Dashboard, Parcels, Staff Management, Customers, Feedback, Analytics, ML Prediction, Delivery Accuracy, Activity Log, Profile |
| **Staff** | Dashboard, Assigned Parcels, Delivery History, My Feedback, Profile |
| **Customer** | Home, Book Parcel, Track Parcel, My Bookings, Profile |

# 5. Main Features

- Registration, login, JWT authentication, role-based authorization, self-service password reset (email verified server-side, no email link)
- Parcel booking with live cost breakdown and delivery-time estimate
- Parcel tracking by tracking ID or QR code scan
- Delivery status lifecycle: Booked → Assigned → Picked Up → In Transit → Out for Delivery → Delivered, with Delivery Attempt Failed / Rescheduled as exception states
- Delivery Confirmation (receiver name + remarks, no OTP) and Delivery Exception & Rescheduling (record a failed attempt, optionally set a new delivery date)
- Admin Activity Log — audit trail of staff/admin actions (assignment, status changes, delivery attempts, deliveries)
- Payments: eSewa (online, with server-side signature generation and verification) and Cash on Delivery, with Pending/Completed/Failed status
- Customer feedback (1–5 star rating + comment) per delivered parcel
- Admin: parcel/staff/customer management, weighted staff recommendation, analytics, ML prediction dashboard, delivery accuracy report, activity log
- QuickShip Virtual Help Assistant (rule/intent-based customer support)

# 6. Three Algorithms

1. **Haversine Formula** — geographic distance between source and destination coordinates. Used for delivery-time estimation, cost calculation, and staff distance scoring.
2. **Random Forest Regression** — predicts delivery time in hours from historical delivered parcels.
3. **Weighted Staff Assignment Algorithm** — recommends the most suitable staff member using a transparent weighted score.

# 7. Random Forest ML Explanation

The system trains a Random Forest Regressor (`ml-random-forest` npm package) on parcels that have actually been delivered, using the recorded delivery time as the training target. Training is manually triggered by an admin from the ML Prediction page. At least **15** delivered parcels with a recorded delivery time are required before training is attempted; below that, the system clearly reports the exact sample count available and uses a labeled rule-based fallback estimate instead of a trained model.

# 8. ML Features and Target

**Input features:**
- Distance (km, via Haversine)
- Parcel weight (kg)
- Delivery type (Vehicle / Air)
- Priority (Standard / Express)

**Target:** actual delivery time in hours (`delivered_at − booking_date`)

# 9. ML Evaluation Metrics

- **MAE** (Mean Absolute Error)
- **RMSE** (Root Mean Squared Error)
- **R²** — computed via out-of-fold predictions from k-fold cross-validation, not a single train/test split. If the target has zero variance in the evaluation set, R² is reported as unavailable rather than a fabricated or misleading number.

All metrics are computed from real data at training time. No metric is hardcoded.

# 10. Virtual Help Assistant Explanation

The QuickShip Virtual Help Assistant is a rule/intent-based customer support feature — it is **not** a large language model and makes **no** external AI API calls (no OpenAI, no Claude, no other LLM). It matches the customer's message against a fixed set of known intents (tracking, bookings, delivery charges, delivery time, payment methods including COD/eSewa, QR tracking, delivery statuses, account help, FAQs) and answers using live data queried from the database. If no intent matches, it returns a clear fallback message listing what it can help with.

# 11. System Architecture

```
React (Vite) client  ──HTTP/JSON──▶  Express API server  ──Sequelize ORM──▶  MySQL database
       │                                    │
       └─ role-based routing          ─ JWT auth middleware
       └─ Recharts (Analytics)        ─ Random Forest model (server/ml/)
       └─ QR generation/scanning      ─ Rule-based chatbot service
```

# 12. Technology Stack

- **Frontend:** React 18, Vite, React Router, Tailwind (utility classes), Recharts, lucide-react, axios, react-hook-form
- **Backend:** Node.js, Express, Sequelize ORM
- **Database:** MySQL
- **ML:** `ml-random-forest` (npm package)
- **Auth:** JWT, bcryptjs
- **Other:** nodemailer (email), qrcode (QR generation)

# 13. Database Overview

7 tables: `users`, `locations`, `parcels`, `deliveries`, `payments`, `feedbacks`, `tracking_history`.

Key relationships:
- Customer (`users`) → Parcels (1:many)
- Parcel → Delivery (1:1) — staff assignment, delivered_at, receiver name/remarks
- Parcel → Delivery Attempts (1:many) — reason, remarks, next delivery date per attempt
- Parcel → Payment (1:1)
- Parcel → Feedback (1:1, only after delivery)
- Parcel → Tracking History (1:many)

Full column-level details are in `DATABASE_SCHEMA.md`; the runnable schema is in `quickship_schema.sql`.

# 14. Installation Steps

**Prerequisites:** Node.js 18+, npm, a running MySQL server.

```bash
# 1. Clone/extract the project
cd QuickShip

# 2. Install server dependencies
cd server
npm install

# 3. Install client dependencies
cd ../client
npm install
```

# 15. How to Run Frontend

```bash
cd client
npm run dev
```
Runs at `http://localhost:5173` by default.

# 16. How to Run Backend

```bash
cd server
npm start
```
Runs at `http://localhost:5000` by default (see `PORT` in `.env`).

# 17. Database Setup

```bash
mysql -u root -p -e "CREATE DATABASE quickship;"
mysql -u root -p quickship < quickship_schema.sql
```
The server also runs `sequelize.sync()` on startup, which will create any missing tables matching the models — but importing `quickship_schema.sql` first is recommended for a clean, predictable schema.

# 18. Environment Variables Required

Copy `server/.env.example` to `server/.env` and fill in real values:

```
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=quickship
PORT=5000
JWT_SECRET=change_this_secret

ESEWA_PRODUCT_CODE=EPAYTEST
ESEWA_SECRET=your_esewa_secret_key
ESEWA_FORCE_SANDBOX_AMOUNT=true
ESEWA_ALLOW_TEST_OVERRIDE=true

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=QuickShip <no-reply@quickship.com>

CLIENT_URL=http://localhost:5173
```

No real secrets are included anywhere in this package.

# 19. Testing Summary

The following were verified against a live MySQL database and a running server instance during development:

- Client production build — succeeds, no import/route errors
- Backend — full syntax check on every file, clean startup, database sync
- Login for all three roles, including invalid-password rejection
- Full booking flow: distance calculation, cost calculation, ML/fallback prediction, automatic staff assignment
- Staff status lifecycle updates
- Delivery Confirmation (correct receiver-name entry, missing-name validation)
- Delivery Exception & Rescheduling (failed attempt → retry, failed attempt → reschedule with new date)
- Parcel tracking (valid and invalid tracking IDs)
- Delivery Accuracy Report (real predicted-vs-actual comparison with computed MAE/RMSE)
- Customer feedback submission, duplicate prevention, rating validation
- Virtual Help Assistant across multiple intents, including payment/COD/eSewa
- Analytics summary, feedback analytics, manual ML prediction endpoint
- Role-based access control (unauthorized role and invalid token correctly rejected)
- ML training behavior with insufficient historical data (honest refusal, correct sample count reported)
- Admin parcel/staff/customer listing endpoints

# 20. Known Environment-Dependent Tests (NOT TESTED)

These require external services or hardware not available in the development/verification environment and were **not executed**:

- **eSewa payment callback** — requires eSewa sandbox credentials and a live redirect flow. The server-side signature generation (`/initiate-esewa`) and verification (`/verify-esewa`) logic was code-reviewed and syntax/require-checked, but a real sandbox transaction was not executed in this environment (no outbound network access to eSewa from here).
- **QR camera scanning** — requires a browser with camera access. The underlying tracking-ID lookup it depends on was tested and works.
- **MySQL-backed runtime testing** — this environment has no MySQL server available (package installation was blocked by network policy), so `sequelize.sync({ alter: true })` against a real database, and the full request/response cycle for the new and changed endpoints, could not be executed end-to-end here. All new/changed backend files were verified with `node --check` (syntax) and by requiring every module (`models`, all changed `routes/*`, `services/analyticsService.js`) to confirm associations and route registration resolve without errors.

These should be verified against a real database and live eSewa sandbox before a demonstration.

# 21. Final Project Limitations

- No automated test suite (unit/integration); verification was manual and scripted end-to-end testing against a live database, plus static syntax/require checks for the changes in this round (see Section 20 for what could not be run in this environment).
- No explicit rate-limiting on the password-reset or delivery-attempt endpoints (password reset requires knowing the account's registered email; delivery-attempt/deliver endpoints are staff/admin-only and JWT-protected).
- Random Forest prediction accuracy depends on having enough real delivered-parcel history (minimum 15 records); with little data, the system correctly falls back to a rule-based estimate rather than presenting an unreliable model as trustworthy.
- The three environment-dependent flows listed above require manual verification with real credentials/hardware.
