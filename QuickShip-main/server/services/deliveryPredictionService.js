const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { RandomForestRegression } = require('ml-random-forest');
const db = require('../models');
const { haversine } = require('../utils/costCalculator');

const MODEL_PATH = path.join(__dirname, '../ml/model.json');
const METRICS_PATH = path.join(__dirname, '../ml/metrics.json');

const MIN_TRAIN_SAMPLES = 15;

const MAX_SPEED_KMH = { Vehicle: 80, Air: 600 };
const HANDLING_HOURS = 0.5;

function physicalMinHours(distance, deliveryType) {
    const speed = deliveryType === 'Air' ? MAX_SPEED_KMH.Air : MAX_SPEED_KMH.Vehicle;
    return (Number(distance) || 0) / speed + HANDLING_HOURS;
}

let cachedModel = null;
let cachedStatus = null;

function encodeFeatures({ distance, weight, deliveryType, priority }) {
    return [
        Number(distance) || 0,
        Number(weight) || 0,
        deliveryType === 'Air' ? 1 : 0,
        priority === 'Express' ? 1 : 0
    ];
}

function seededShuffle(array, seed) {
    const result = [...array];
    let state = seed;
    const random = () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

async function buildDataset() {
    const deliveries = await db.Delivery.findAll({
        where: { delivered_at: { [Op.ne]: null } },
        include: [{
            model: db.Parcel,
            as: 'parcel',
            include: [
                { model: db.Location, as: 'sourceLocation' },
                { model: db.Location, as: 'destinationLocation' }
            ]
        }]
    });

    const rows = [];
    for (const delivery of deliveries) {
        const parcel = delivery.parcel;
        if (!parcel || !parcel.booking_date || !delivery.delivered_at) continue;

        const src = parcel.sourceLocation;
        const dst = parcel.destinationLocation;
        if (!src?.latitude || !dst?.latitude) continue;

        const distance = haversine(src.latitude, src.longitude, dst.latitude, dst.longitude);
        const actualHours = (new Date(delivery.delivered_at) - new Date(parcel.booking_date)) / (1000 * 60 * 60);
        if (!(actualHours > 0)) continue;

        rows.push({
            features: encodeFeatures({
                distance,
                weight: parcel.weight,
                deliveryType: parcel.delivery_type,
                priority: parcel.priority
            }),
            meta: { distance, deliveryType: parcel.delivery_type, priority: parcel.priority },
            actualHours
        });
    }
    return rows;
}

async function trainModel() {
    const dataset = await buildDataset();
    const sampleCount = dataset.length;

    if (sampleCount < MIN_TRAIN_SAMPLES) {
        const status = {
            trained: false,
            sampleCount,
            minRequired: MIN_TRAIN_SAMPLES,
            metrics: null,
            trainedAt: null,
            message: `Only ${sampleCount} delivered parcel(s) with a realistic recorded delivery time are available. At least ${MIN_TRAIN_SAMPLES} are needed to train a meaningful Random Forest model. Predictions will use a rule-based fallback until then.`
        };
        fs.writeFileSync(METRICS_PATH, JSON.stringify(status, null, 2));
        removeModelFile();
        cachedModel = null;
        cachedStatus = status;
        return status;
    }

    const shuffled = seededShuffle(dataset, 42);

    const forestOptions = {
        nEstimators: 100,
        seed: 42,
        maxFeatures: 0.8,
        treeOptions: { maxDepth: 8, minNumSamples: 4 }
    };

    const K = Math.min(5, Math.max(3, Math.floor(sampleCount / 8)));
    const foldSize = Math.ceil(shuffled.length / K);
    const outOfFoldPredictions = new Array(shuffled.length).fill(null);

    for (let fold = 0; fold < K; fold++) {
        const start = fold * foldSize;
        const end = Math.min(start + foldSize, shuffled.length);
        if (start >= end) continue;

        const testFold = shuffled.slice(start, end);
        const trainFold = [...shuffled.slice(0, start), ...shuffled.slice(end)];

        const foldModel = new RandomForestRegression({ ...forestOptions, seed: 42 + fold });
        foldModel.train(trainFold.map(r => r.features), trainFold.map(r => r.actualHours));

        const preds = foldModel.predict(testFold.map(r => r.features));
        preds.forEach((pred, i) => { outOfFoldPredictions[start + i] = pred; });
    }

    const actuals = shuffled.map(r => r.actualHours);
    const errors = outOfFoldPredictions.map((pred, i) => pred - actuals[i]);

    const mae = errors.reduce((sum, e) => sum + Math.abs(e), 0) / errors.length;
    const rmse = Math.sqrt(errors.reduce((sum, e) => sum + e * e, 0) / errors.length);

    const meanActual = actuals.reduce((s, v) => s + v, 0) / actuals.length;
    const totalVariance = actuals.reduce((s, v) => s + (v - meanActual) ** 2, 0);
    const r2 = totalVariance > 0
        ? 1 - (errors.reduce((s, e) => s + e * e, 0) / totalVariance)
        : null;

    const fallbackMae = shuffled.reduce((sum, r, i) => {
        const est = fallbackEstimate(r.meta.distance, r.meta.deliveryType, r.meta.priority);
        return sum + Math.abs(est - actuals[i]);
    }, 0) / shuffled.length;

    const metrics = {
        mae: Number(mae.toFixed(2)),
        rmse: Number(rmse.toFixed(2)),
        r2: r2 !== null ? Number(r2.toFixed(3)) : null,
        ruleBasedMae: Number(fallbackMae.toFixed(2)),
        evaluationMethod: `${K}-fold cross-validation`,
        evaluatedSampleCount: shuffled.length
    };

    const modelIsUseful = r2 !== null && r2 > 0 && mae < fallbackMae;

    if (!modelIsUseful) {
        const rejected = {
            trained: false,
            sampleCount,
            minRequired: MIN_TRAIN_SAMPLES,
            kFolds: K,
            metrics,
            trainedAt: new Date().toISOString(),
            message: `The trained model did not outperform the rule-based estimate (model MAE ${metrics.mae} hrs vs rule-based MAE ${metrics.ruleBasedMae} hrs), so predictions keep using the rule-based estimate until more real delivery data is available.`
        };
        fs.writeFileSync(METRICS_PATH, JSON.stringify(rejected, null, 2));
        removeModelFile();
        cachedModel = null;
        cachedStatus = rejected;
        return rejected;
    }

    const model = new RandomForestRegression(forestOptions);
    model.train(shuffled.map(r => r.features), shuffled.map(r => r.actualHours));

    const status = {
        trained: true,
        sampleCount,
        minRequired: MIN_TRAIN_SAMPLES,
        kFolds: K,
        metrics,
        trainedAt: new Date().toISOString()
    };

    fs.writeFileSync(MODEL_PATH, JSON.stringify(model.toJSON()));
    fs.writeFileSync(METRICS_PATH, JSON.stringify(status, null, 2));
    cachedModel = model;
    cachedStatus = status;
    return status;
}

function removeModelFile() {
    try {
        if (fs.existsSync(MODEL_PATH)) fs.unlinkSync(MODEL_PATH);
    } catch (err) {
        console.error('[ML MODEL] Failed to remove stale model file:', err.message);
    }
}

function loadFromDisk() {
    try {
        if (fs.existsSync(METRICS_PATH)) {
            cachedStatus = JSON.parse(fs.readFileSync(METRICS_PATH, 'utf-8'));
        }
        if (cachedStatus?.trained && fs.existsSync(MODEL_PATH)) {
            const json = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf-8'));
            cachedModel = RandomForestRegression.load(json);
        }
    } catch (err) {
        console.error('[ML MODEL] Failed to load persisted model:', err.message);
    }
}
loadFromDisk();

function getStatus() {
    return cachedStatus || {
        trained: false,
        sampleCount: 0,
        minRequired: MIN_TRAIN_SAMPLES,
        metrics: null,
        trainedAt: null,
        message: 'Model has not been trained yet.'
    };
}

function fallbackEstimate(distance, deliveryType, priority) {
    let hours;
    if (deliveryType === 'Air') {
        hours = 24;
    } else if (distance < 30) {
        hours = 24;
    } else if (distance < 100) {
        hours = 48;
    } else {
        hours = 96;
    }
    if (priority === 'Express') hours = Math.round(hours * 0.7);
    return hours;
}

function predictDeliveryTime({ distance, weight, deliveryType, priority }) {
    if (cachedModel) {
        const features = encodeFeatures({ distance, weight, deliveryType, priority });
        const [predicted] = cachedModel.predict([features]);
        if (Number.isFinite(predicted)) {
            const floor = Math.max(1, physicalMinHours(distance, deliveryType));
            return { hours: Number(Math.max(floor, predicted).toFixed(1)), source: 'ml' };
        }
    }
    return { hours: fallbackEstimate(distance, deliveryType, priority), source: 'fallback' };
}

async function getAccuracyReport() {
    const parcels = await db.Parcel.findAll({
        where: { predicted_delivery_hours: { [Op.ne]: null } },
        include: [
            {
                model: db.Delivery,
                as: 'delivery',
                where: { delivered_at: { [Op.ne]: null } },
                required: true
            },
            { model: db.User, as: 'client', attributes: ['full_name'] }
        ],
        order: [['createdAt', 'DESC']]
    });

    const rows = parcels.map(p => {
        const actualHours = (new Date(p.delivery.delivered_at) - new Date(p.booking_date)) / (1000 * 60 * 60);
        const predictedHours = p.predicted_delivery_hours;
        return {
            parcel_id: p.parcel_id,
            tracking_hash: p.tracking_hash,
            client_name: p.client?.full_name || 'N/A',
            delivered_at: p.delivery.delivered_at,
            predicted_hours: Number(predictedHours.toFixed(1)),
            actual_hours: Number(actualHours.toFixed(1)),
            difference: Number((actualHours - predictedHours).toFixed(1)),
            prediction_source: p.prediction_source
        };
    });

    let summary = null;
    if (rows.length > 0) {
        const mae = rows.reduce((s, r) => s + Math.abs(r.difference), 0) / rows.length;
        const rmse = Math.sqrt(rows.reduce((s, r) => s + r.difference ** 2, 0) / rows.length);
        summary = { count: rows.length, mae: Number(mae.toFixed(2)), rmse: Number(rmse.toFixed(2)) };
    }

    return { rows, summary };
}

module.exports = { trainModel, predictDeliveryTime, getStatus, getAccuracyReport };
