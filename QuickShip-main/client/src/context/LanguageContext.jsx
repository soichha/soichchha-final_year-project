import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(() => localStorage.getItem('quickship_lang') || 'en');

    useEffect(() => {
        localStorage.setItem('quickship_lang', lang);
    }, [lang]);

    const toggleLang = () => setLang((prev) => (prev === 'en' ? 'ne' : 'en'));

    const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key;

    return (
        <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used inside a LanguageProvider');
    return ctx;
};
