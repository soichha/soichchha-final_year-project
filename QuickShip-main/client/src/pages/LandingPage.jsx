import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, Map, Clock, ArrowRight } from 'lucide-react';
import RateCalculator from '../components/RateCalculator';
import { useLanguage } from '../context/LanguageContext';

const LandingPage = () => {
    const { t } = useLanguage();

    return (
        <div className="landing-container">
            <section id="home" className="hero-section">
                <div className="hero-content-wrapper">
                    <h1 className="hero-title">
                        {t('hero_title_1')} <span className="text-blue-600">{t('hero_title_2')}</span>
                    </h1>
                    <p className="hero-subtitle">
                        {t('hero_subtitle')}
                    </p>

                    <div className="hero-actions">
                        <Link to="/signup" className="btn-hero-primary">
                            <Truck size={24} /> {t('hero_book')}
                        </Link>
                        <Link to="/customer/track" className="btn-hero-secondary">
                            <Map size={24} /> {t('hero_track')}
                        </Link>
                    </div>
                </div>
            </section>

            <section id="services" className="features-section">
                <div className="features-container">
                    <div className="section-header">
                        <h2 className="section-title">{t('features_title')}</h2>
                        <p className="section-subtitle">
                            {t('features_subtitle')}
                        </p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon-wrapper bg-green-100 text-green-600">
                                <Clock size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{t('feat1_title')}</h3>
                            <p className="text-slate-500 text-sm">
                                {t('feat1_desc')}
                            </p>
                            <span className="badge-feature bg-green-100 text-green-700">
                                {t('feat1_badge')}
                            </span>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon-wrapper bg-blue-100 text-blue-600">
                                <ShieldCheck size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{t('feat2_title')}</h3>
                            <p className="text-slate-500 text-sm">
                                {t('feat2_desc')}
                            </p>
                            <span className="badge-feature bg-blue-100 text-blue-700">
                                {t('feat2_badge')}
                            </span>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon-wrapper bg-amber-100 text-amber-600">
                                <Map size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{t('feat3_title')}</h3>
                            <p className="text-slate-500 text-sm">
                                {t('feat3_desc')}
                            </p>
                            <span className="badge-feature bg-amber-100 text-amber-700">
                                {t('feat3_badge')}
                            </span>
                        </div>
                    </div>

                    <div className="text-center mt-12">
                        <Link to="/signup" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:gap-4 transition-all">
                            {t('features_cta')} <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            <RateCalculator />

            <section id="contact" className="contact-section">
                <div className="contact-container">
                    <div className="contact-card">
                        <div className="contact-info-panel">
                            <div>
                                <h3 className="text-2xl font-bold mb-4">{t('contact_title')}</h3>
                                <p className="mb-6 opacity-80">
                                    {t('contact_desc')}
                                </p>
                            </div>
                            <div className="space-y-4">
                                <p className="flex items-center gap-3">
                                    <Map size={20} className="text-blue-400" /> {t('contact_location')}
                                </p>
                                <p className="flex items-center gap-3">
                                    <Clock size={20} className="text-blue-400" /> {t('contact_hours')}
                                </p>
                            </div>
                        </div>
                        <div className="contact-form-panel">
                            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>
                                <div className="form-group">
                                    <label className="form-label mb-1">{t('contact_name')}</label>
                                    <input type="text" className="form-input" placeholder="" pattern="[A-Za-z\s]+" title="Name must contain only alphabets and spaces" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label mb-1">{t('contact_email')}</label>
                                    <input type="email" className="form-input" placeholder="" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label mb-1">{t('contact_message')}</label>
                                    <textarea rows="4" className="form-input" placeholder={t('contact_message_placeholder')} required></textarea>
                                </div>
                                <button type="submit" className="btn-submit">
                                    {t('contact_send')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
