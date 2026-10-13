# ML Delivery Prediction — Architecture

QuickShip includes exactly **one** genuine machine learning module: a Random Forest Regressor that predicts delivery time. The other two intelligent features in the project — Weighted Staff Recommendation and the Virtual Help Assistant — are explicitly rule-based and do not claim to be AI/ML.

## 1. Algorithm
**Random Forest Regressor**, via the `ml-random-forest` npm package (pure JavaScript, runs inside the existing Node backend — no separate Python service or external API).

## 2. Features Used

| Feature | Source |
|---|---|
| Distance (km) | Haversine formula between source and destination coordinates |
| Parcel weight (kg) | User input at booking |
| Delivery type | Air = 1, Vehicle = 0 |
| Delivery priority | Express = 1, Standard = 0 |

**Target:** actual delivery time in hours — `delivery.delivered_at − parcel.booking_date`.

## 3. Dataset
Every parcel that has actually been delivered (`delivery.delivered_at` is set) becomes one training row. No synthetic or placeholder data ships with the application — the model starts untrained on a fresh install and learns purely from real bookings as they complete.

**Minimum data requirement:** 15 delivered parcels. Below this, training is refused outright (with the reason reported to the admin) rather than fitting a model on too little data.

## 4. Training Process
1. Build the dataset from delivered parcels (see above).
2. Apply a deterministic (seeded) shuffle for reproducibility.
3. Train the final production model on the **entire** dataset — maximizing use of real data for actual predictions.
4. Separately, evaluate generalization using **k-fold cross-validation** (k = 3–5, scaled to dataset size): the data is split into folds, and every fold takes a turn being predicted by a model trained only on the other folds. Every parcel gets exactly one genuine out-of-fold prediction, and MAE/RMSE/R² are computed over all of them.
5. Trees are regularized (`maxDepth: 8`, `minNumSamples: 4`, `nEstimators: 100`) to reduce overfitting on a limited dataset.

### Why k-fold cross-validation instead of a single train/test split
With a small dataset, a single 80/20 train/test split leaves very few samples in the test set, making R² highly unstable — one atypical delivery can swing it dramatically, even for a good model. Splitting the data once and evaluating on a small held-out slice risks reporting a metric that says more about which parcels happened to land in the test set than about the model itself. K-fold cross-validation avoids this: it uses the *entire* dataset for evaluation (each point predicted exactly once, out-of-fold, by a model that never saw it during training), which gives a more stable, defensible metric — and one that is recomputed fresh from whatever real data exists at the time of training, rather than quoted from a fixed prior run.

## 5. Model Evaluation
- **MAE** (Mean Absolute Error) and **RMSE** (Root Mean Squared Error) are always computed directly from pooled out-of-fold predictions vs. actuals.
- **R²** is computed only when the evaluated set has non-zero variance. R² is mathematically undefined (division by zero) when every actual value in the evaluation set is identical — in that case the API returns `r2: null` and the UI shows "Not available" with an explanation, instead of guessing or defaulting to 0.
- No metric is ever fabricated. If the model hasn't been trained (insufficient data), no metrics are shown at all — the status explicitly says why.

## 6. Fallback Behavior
Until the model is trained, delivery time predictions use a simple, clearly-labeled rule-based estimate (distance/type tiers, similar in spirit to the existing ETA calculator, with an adjustment for Express priority). Every prediction stored in the database records which method produced it (`prediction_source`: `'ml'` or `'fallback'`), so the Delivery Accuracy Report and ML Prediction page are always honest about which predictions came from the trained model.

## 7. Where Predictions Are Used
- Stored on the parcel at booking time (`predicted_delivery_hours`)
- Shown on the Booking Confirmation panel
- Shown on the Tracking page
- Shown on the Parcel/Booking Details modal
- Shown on the Admin ML Prediction page (model status + metrics) and Delivery Accuracy Report (predicted vs. actual vs. difference, per parcel)

## 8. Retraining
Training is manually triggered by an admin from the ML Prediction page (`POST /api/delivery-prediction/train`). There is no automatic background retraining — this keeps behavior predictable and easy to explain/demonstrate in a viva.

## 9. Model Persistence
The trained forest is serialized to `server/ml/model.json`, with its evaluation metrics in `server/ml/metrics.json`. Both are reloaded automatically on server restart, so training only needs to happen once (or whenever the admin wants to retrain on newer data). These files are generated at runtime and are not part of the source code deliverable.
