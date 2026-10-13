import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
    const location = useLocation();
    const currentHash = location.hash || '#home';
    const { lang, toggleLang, t } = useLanguage();

    const getLinkClass = (hash) => {
        const baseClass = "transition px-1 py-1 relative group";
        const activeClass = currentHash === hash ? "text-blue-600 font-bold" : "text-slate-600 hover:text-blue-600";
        return `${baseClass} ${activeClass}`;
    };

    return (
        <header className="navbar">
            <div className="navbar-container">
                <Logo />

                <nav className="hidden md:flex items-center gap-8">
                    <a href="/#home" className={getLinkClass('#home')}>
                        {t('nav_home')}
                        <span className={`nav-indicator ${currentHash === '#home' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                    </a>
                    <a href="/#services" className={getLinkClass('#services')}>
                        {t('nav_services')}
                        <span className={`nav-indicator ${currentHash === '#services' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                    </a>
                    <a href="/#calculator" className={getLinkClass('#calculator')}>
                        {t('nav_calculator')}
                        <span className={`nav-indicator ${currentHash === '#calculator' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                    </a>
                    <a href="/#contact" className={getLinkClass('#contact')}>
                        {t('nav_contact')}
                        <span className={`nav-indicator ${currentHash === '#contact' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                    </a>
                </nav>

                <div className="flex items-center gap-3 md:gap-4">
                    <button
                        type="button"
                        onClick={toggleLang}
                        className="lang-toggle"
                        title={lang === 'en' ? 'Switch to Nepali' : 'Switch to English'}
                    >
                        <span className={lang === 'en' ? 'lang-option-active' : 'lang-option'}>EN</span>
                        <span className="lang-divider">/</span>
                        <span className={lang === 'ne' ? 'lang-option-active' : 'lang-option'}>ने</span>
                    </button>

                    <Link to="/login" className="text-blue-600 font-bold hover:underline hidden sm:inline">{t('nav_signin')}</Link>
                    <Link to="/signup" className="btn-hero-primary !py-2 !px-5 !text-sm">
                        {t('nav_getstarted')}
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
