import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, ArrowRight } from 'lucide-react';
import { NEPAL_HUBS } from '../data/nepalHubs';
import { calculateDistance } from '../utils/haversine';
import { getCostBreakdown } from '../utils/costCalculator';
import { estimateArrival } from '../utils/eta';
import { useLanguage } from '../context/LanguageContext';

const RateCalculator = () => {
    const { t, lang } = useLanguage();

    const [fromCode, setFromCode] = useState('KTM');
    const [toCode, setToCode] = useState('PKR');
    const [weight, setWeight] = useState(1);
    const [method, setMethod] = useState('Vehicle');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const cityLabel = (hub) => (lang === 'ne' ? hub.city_ne : hub.city);

    const handleCalculate = (e) => {
        e.preventDefault();
        setError('');

        if (fromCode === toCode) {
            setError(t('calc_same_city'));
            setResult(null);
            return;
        }

        const from = NEPAL_HUBS.find((h) => h.code === fromCode);
        const to = NEPAL_HUBS.find((h) => h.code === toCode);
        const distance = calculateDistance(from.lat, from.lon, to.lat, to.lon);
        const breakdown = getCostBreakdown(weight, distance, method);
        const eta = estimateArrival(distance, method);

        setResult({ distance, breakdown, eta });
    };

    return (
        <section id="calculator" className="calculator-section">
            <div className="calculator-container">
                <div className="section-header">
                    <h2 className="section-title">{t('calc_title')}</h2>
                    <p className="section-subtitle">{t('calc_subtitle')}</p>
                </div>

                <div className="calculator-card">
                    <form className="calculator-form" onSubmit={handleCalculate}>
                        <div className="calc-grid">
                            <div className="form-group">
                                <label className="form-label mb-1">{t('calc_from')}</label>
                                <select className="form-input" value={fromCode} onChange={(e) => setFromCode(e.target.value)}>
                                    {NEPAL_HUBS.map((hub) => (
                                        <option key={hub.code} value={hub.code}>{cityLabel(hub)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label mb-1">{t('calc_to')}</label>
                                <select className="form-input" value={toCode} onChange={(e) => setToCode(e.target.value)}>
                                    {NEPAL_HUBS.map((hub) => (
                                        <option key={hub.code} value={hub.code}>{cityLabel(hub)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label mb-1">{t('calc_weight')}</label>
                                <input
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    className="form-input"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label mb-1">{t('calc_type')}</label>
                                <div className="calc-type-toggle">
                                    <button
                                        type="button"
                                        className={method === 'Vehicle' ? 'calc-type-btn-active' : 'calc-type-btn'}
                                        onClick={() => setMethod('Vehicle')}
                                    >
                                        {t('calc_type_vehicle')}
                                    </button>
                                    <button
                                        type="button"
                                        className={method === 'Air' ? 'calc-type-btn-active' : 'calc-type-btn'}
                                        onClick={() => setMethod('Air')}
                                    >
                                        {t('calc_type_air')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && <p className="calc-error">{error}</p>}

                        <button type="submit" className="btn-hero-primary w-full justify-center">
                            <Calculator size={20} /> {t('calc_button')}
                        </button>
                    </form>

                    {result && (
                        <div className="calc-result">
                            <div className="calc-result-row">
                                <span>{t('calc_result_distance')}</span>
                                <strong>{result.distance.toFixed(1)} km</strong>
                            </div>
                            <div className="calc-result-row">
                                <span>{t('calc_result_base')}</span>
                                <strong>रु {result.breakdown.baseCharge}</strong>
                            </div>
                            <div className="calc-result-row">
                                <span>{t('calc_result_weight')}</span>
                                <strong>रु {result.breakdown.weightCharge}</strong>
                            </div>
                            <div className="calc-result-row">
                                <span>{t('calc_result_distance_charge')}</span>
                                <strong>रु {result.breakdown.distanceCharge}</strong>
                            </div>
                            <div className="calc-result-row calc-result-total">
                                <span>{t('calc_result_total')}</span>
                                <strong>रु {result.breakdown.total}</strong>
                            </div>
                            <div className="calc-result-row">
                                <span>{t('calc_result_eta')}</span>
                                <strong>{result.eta}</strong>
                            </div>

                            <p className="calc-disclaimer">{t('calc_disclaimer')}</p>

                            <Link to="/signup" className="calc-cta">
                                {t('calc_cta')} <ArrowRight size={18} />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default RateCalculator;
