# API Summary

Base URL: `http://localhost:5000/api`. All protected routes require `Authorization: Bearer <JWT>`. Role restrictions are noted in brackets.

## Auth — `/api/auth`
| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/signup` | Public | Register a new customer account |
| POST | `/login` | Public | Log in, returns JWT |
| POST | `/verify-account` | Public | Forgot Password step 1 — confirms an account exists for the given email |
| POST | `/reset-password` | Public | Forgot Password step 2 — sets a new password directly (email re-verified server-side; no email/SMTP involved) |

## Users — `/api/users`
| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/staff` | admin, staff | List staff members |
| GET | `/clients` | admin | List customers |
| POST | `/staff` | admin | Create a staff account |
| PUT | `/staff/:id` | admin | Update a staff account |
| DELETE | `/staff/:id` | admin | Remove a staff account |
| DELETE | `/clients/:id` | admin | Remove a customer account |
| GET | `/profile` | any authenticated | Current user's profile |
| PUT | `/profile` | any authenticated | Update own profile |

## Parcels — `/api/parcels`
| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/locations` | Public | List known locations (for booking form) |
| POST | `/` | any authenticated | Book a parcel — computes distance (Haversine), cost, ML delivery-time prediction, triggers Weighted Staff Assignment + booking email |
| GET | `/user/:userId` | any authenticated | Customer's own bookings |
| GET | `/` | admin, staff | All parcels (management view) |
| GET | `/track/:trackingHash` | any authenticated | Track by full or partial tracking ID |
| PUT | `/:id` | any authenticated | Edit a parcel (admin general editor) |
| GET | `/:id/recommend-staff` | admin | Weighted Staff Recommendation for a parcel |
| PUT | `/:id/assign` | admin, staff | Assign/reassign staff to a parcel |
| DELETE | `/:id` | any authenticated | Delete a parcel |
| GET | `/staff/:userId` | staff, admin | Parcels assigned to a staff member |
| PUT | `/:id/status` | staff, admin | Update delivery status along the normal lifecycle (Booked → Assigned → Picked Up → In Transit → Out for Delivery). Enforces the allowed-transition map; rejects "Delivered", "Delivery Attempt Failed", and "Rescheduled" — those go through their own endpoints below. Staff may only update parcels assigned to them. |
| PUT | `/:id/deliver` | staff, admin | Delivery Confirmation — marks a parcel "Delivered" directly (no OTP). Requires `receiverName`, accepts optional `remarks`; only allowed from "Out for Delivery". |
| POST | `/:id/delivery-attempt` | staff, admin | Record Delivery Attempt — logs a failed attempt (`reason`, optional `remarks`) and, if `nextDeliveryDate` is supplied, moves the parcel to "Rescheduled"; otherwise "Delivery Attempt Failed". |

## Activity Log — `/api/activity-log`
| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/` | admin | Paginated audit trail of staff/admin actions (assign, status change, delivery attempt, delivered). Filterable by `role`, `action`, `from`, `to`. |

## Payments — `/api/payments`
| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/initiate-esewa` | any authenticated | Builds and signs the eSewa payment form server-side (amount comes from the Payment record, not the client; the merchant secret never leaves the backend) |
| POST | `/verify-esewa` | Public (callback) | Recomputes and checks eSewa's response signature before marking a payment Completed |
| POST | `/mark-failed` | Public (callback) | Marks a Pending payment as Failed when the customer lands on the failure page |

## Feedback — `/api/feedback`
| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/` | client | Submit feedback for a delivered parcel |
| PUT | `/:id` | client | Edit feedback (within 24h) |
| GET | `/mine` | client | Customer's own submitted feedback |
| GET | `/parcel/:parcelId` | any authenticated | Feedback for a specific parcel |
| GET | `/staff/me` | staff | Staff's own rating summary |
| GET | `/admin/list` | admin | All feedback (moderation) |
| GET | `/admin/analytics` | admin | Feedback analytics for the Analytics page |

## Analytics — `/api/analytics`
| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/summary` | admin | Current-state KPI summary (totals, today's/monthly revenue) |

## Reports — `/api/reports`
| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/generate` | admin | Daily/Weekly/Monthly business report — booking, financial, delivery performance, staff performance, feedback, and business analytics, backing the Analytics page |

## ML Delivery Prediction — `/api/delivery-prediction`
| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/status` | admin | Current model status + last evaluation metrics |
| POST | `/train` | admin | Train/retrain the Random Forest on current historical data |
| POST | `/predict` | admin | Manual prediction for admin-supplied distance/weight/type/priority |
| GET | `/accuracy-report` | admin | Predicted vs. actual delivery time for delivered parcels |

## QuickShip Virtual Help Assistant — `/api/chatbot`
| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/message` | any authenticated | Rule/intent-based assistant reply (role-aware, live data) |
