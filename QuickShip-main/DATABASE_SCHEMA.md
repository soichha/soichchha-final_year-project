# Database Schema Summary

MySQL, 9 tables, managed via Sequelize models with `sequelize.sync({ alter: true })` (auto-creates/updates tables on server start). A static `quickship_schema.sql` is also provided for manual import.

## Tables & Relationships

```
users ─┬─< parcels (client_id)
       ├─< deliveries (staff_id, assigned_by, delivered_by)
       ├─< feedbacks (customer_id, staff_id)
       ├─< delivery_attempts (staff_id)
       └─< activity_logs (user_id, nullable)

locations ─┬─< parcels (source_location_id)
           ├─< parcels (destination_location_id)
           └─< tracking_history (current_location_id)

parcels ─┬─1 deliveries (parcel_id, unique — 1:1)
         ├─1 payments (parcel_id, unique — 1:1)
         ├─1 feedbacks (parcel_id, unique — 1:1)
         ├─< tracking_history (parcel_id)
         ├─< delivery_attempts (parcel_id) — 1:many, a parcel can have several failed attempts
         └─< activity_logs (parcel_id, nullable)
```

## Table Details

### `users`
| Column | Type | Notes |
|---|---|---|
| user_id | INT, PK, auto-increment | |
| full_name | STRING | |
| email | STRING | **unique**, validated as email format |
| password | STRING | bcrypt hashed |
| phone | STRING | |
| role | ENUM('client','staff','admin') | default `client` |

Password reset no longer uses a token — see `POST /api/auth/verify-account` and `POST /api/auth/reset-password` in `API_SUMMARY.md`.

### `locations`
| Column | Type | Notes |
|---|---|---|
| location_id | INT, PK | |
| province, district, city_or_area, full_address | STRING | |
| latitude, longitude | FLOAT | used for Haversine distance calculation & ML prediction features |

### `parcels`
| Column | Type | Notes |
|---|---|---|
| parcel_id | INT, PK | |
| client_id | INT, FK → users | |
| source_location_id, destination_location_id | INT, FK → locations | |
| weight | FLOAT | |
| delivery_type | ENUM('Air','Vehicle') | |
| priority | ENUM('Standard','Express') | ML prediction feature |
| total_cost | FLOAT | |
| parcel_status | ENUM(9 states) | Booked → Assigned → Picked Up → In Transit → Out for Delivery → Delivered / Cancelled, with Delivery Attempt Failed / Rescheduled as exception states off "Out for Delivery" |
| booking_date | DATE | |
| receiver_name, receiver_phone, description | STRING | |
| tracking_hash | STRING | **unique**, also encoded into the QR code and used as the eSewa `transaction_uuid` |
| predicted_delivery_hours | FLOAT | ML Delivery Prediction output |
| prediction_source | STRING | `'ml'` or `'fallback'` |

### `deliveries` (1:1 with parcels)
| Column | Type | Notes |
|---|---|---|
| delivery_id | INT, PK | |
| parcel_id | INT, FK, **unique** | enforces 1:1 |
| staff_id | INT, FK → users | |
| assigned_by | INT, FK → users, nullable | null = system auto-assignment |
| assigned_date | DATETIME | when staff was assigned to this parcel |
| delivery_status | VARCHAR | mirrors the parcel's delivery-lifecycle status on the delivery record |
| assignment_type | ENUM('Manual','Auto') | |
| assignment_reason | TEXT | Weighted Staff Recommendation explanation |
| workload_at_assignment | INT | |
| delivered_at | DATE | used for ML training + Delivery Accuracy Report |
| received_by | STRING, nullable | receiver name entered on the Delivery Confirmation form (may differ from `parcels.receiver_name`, the name given at booking) |
| delivery_remarks | TEXT, nullable | remarks entered on the Delivery Confirmation form |
| delivered_by | INT, FK → users, nullable | staff/admin who confirmed delivery |
| next_delivery_date | DATE, nullable | mirrors the latest delivery_attempts.next_delivery_date, for quick display without a join |

### `delivery_attempts` (1:many with parcels)
| Column | Type | Notes |
|---|---|---|
| id | INT, PK | |
| parcel_id | INT, FK | a parcel may have multiple attempts, so this is its own table rather than columns on `deliveries` |
| staff_id | INT, FK → users | |
| reason | ENUM('Receiver unavailable','Wrong address','Phone unreachable','Customer requested reschedule','Other') | |
| remarks | TEXT, nullable | |
| attempted_at | DATETIME | |
| next_delivery_date | DATE, nullable | set only when the attempt results in a reschedule |

### `activity_logs` (append-only)
| Column | Type | Notes |
|---|---|---|
| id | INT, PK | |
| user_id | INT, FK → users, nullable | null for system-initiated actions |
| user_name | STRING, nullable | snapshot of the actor's name at write time |
| role | STRING, nullable | |
| action | STRING | short human-readable description, e.g. "marked parcel QS10234 as Delivered" |
| parcel_id | INT, FK → parcels, nullable | |
| details | TEXT, nullable | |
| created_at | DATETIME | no `updated_at` — the log is never modified after being written |

### `payments` (1:1 with parcels)
| Column | Type | Notes |
|---|---|---|
| payment_id | INT, PK | |
| parcel_id | INT, FK, **unique** | |
| amount | FLOAT | |
| payment_method | ENUM('eSewa','COD') | |
| transaction_reference | STRING, nullable | eSewa's `transaction_code`, set once signature verification succeeds |
| payment_status | ENUM('Pending','Completed','Failed') | |

### `tracking_history` (1:many with parcels)
| Column | Type | Notes |
|---|---|---|
| tracking_id | INT, PK | |
| parcel_id | INT, FK | |
| current_location_id | INT, FK → locations, nullable | |
| status_message | STRING | includes delivery-attempt and reschedule events, e.g. "Delivery Attempt: Receiver unavailable" |
| created_at | DATE | feeds the visual Parcel Timeline |

### `feedbacks` (1:1 with parcels)
| Column | Type | Notes |
|---|---|---|
| feedback_id | INT, PK | |
| parcel_id | INT, FK, **unique** | one feedback per parcel |
| customer_id, staff_id | INT, FK → users | |
| rating | INT | validated 1–5 |
| title, comment | STRING, TEXT | |

## Normalization
The schema is in 3NF: locations are deduplicated into their own table (not repeated per parcel), status/attempt/activity history is append-only rather than overwritten, and each 1:1 relationship is enforced with a unique foreign key rather than duplicating columns across tables.
