// frontend/src/context/LanguageContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';

interface Translations {
  [key: string]: any;
}

interface LanguageContextType {
  language: string;
  translations: Translations;
  changeLanguage: (lang: string) => void;
  t: (key: string) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('language') || 'vi';
  });
  const [translations, setTranslations] = useState<Translations>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Load translations from backend
  const loadTranslations = async (lang: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/admin/translations`, {
        params: { lang }
      });
      
      if (response.data.success) {
        setTranslations(response.data.data);
        console.log(`✅ Loaded ${lang} translations:`, response.data.data);
      }
    } catch (error) {
      console.error('❌ Failed to load translations:', error);
      // Fallback to empty object if API fails
      setTranslations({});
    } finally {
      setLoading(false);
    }
  };

  // Load translations when language changes
  useEffect(() => {
    loadTranslations(language);
    document.documentElement.lang = language;
  }, [language]);

  // Change language function
  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Translation function (nested key support)
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`⚠️ Translation key not found: ${key}`);
        return key; // Return key if translation not found
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, translations, changeLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};