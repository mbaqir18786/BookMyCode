import React, { createContext, useContext, useState, useEffect } from 'react';

export const FARMER_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇵🇧' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native: 'ਕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', native: 'ਓੜੀਆ', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇵🇰' }
];

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('farmer_app_lang') || 'en');

  // Trigger translation script injection
  useEffect(() => {
    if (lang !== 'en') {
      ensureScriptAndTranslate(lang);
    }
  }, [lang]);

  const changeLanguage = (newLang, currentRole) => {
    setLang(newLang);
    localStorage.setItem('farmer_app_lang', newLang);

    if (newLang === 'en') {
      restoreEnglish();
      return;
    }

    ensureScriptAndTranslate(newLang);
  };

  const restoreEnglish = () => {
    // If google translate active, clear googtrans cookie and reload to reset cleanly
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." + document.domain;
    window.location.reload();
  };

  const ensureScriptAndTranslate = (targetLang) => {
    // Set cookie that Google Translate respects across page elements
    document.cookie = `googtrans=/en/${targetLang}; path=/`;

    let combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = targetLang;
      combo.dispatchEvent(new Event('change'));
    } else {
      if (!document.getElementById('google-translate-script')) {
        window.googleTranslateElementInit = () => {
          new window.google.translate.TranslateElement(
            { pageLanguage: 'en', autoDisplay: false },
            'google_translate_element'
          );
          setTimeout(() => {
            let select = document.querySelector('.goog-te-combo');
            if (select) {
              select.value = targetLang;
              select.dispatchEvent(new Event('change'));
            }
          }, 300);
        };

        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.body.appendChild(script);
      }
    }
  };

  // Helper function to reset translation back to English whenever switching to Seller, Govt or Admin
  const resetToEnglishForNonFarmers = () => {
    if (lang !== 'en') {
      setLang('en');
      localStorage.setItem('farmer_app_lang', 'en');
      restoreEnglish();
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, farmerLanguages: FARMER_LANGUAGES, resetToEnglishForNonFarmers }}>
      <div id="google_translate_element" style={{ display: 'none' }}></div>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
