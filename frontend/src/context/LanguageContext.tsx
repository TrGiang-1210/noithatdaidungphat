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
      const response = await axios.get(`http://localhost:5000/api/translations`, {
        params: { lang }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        
        // ✅ API trả về nested object: { common: {...}, product: {...} }
        // Không cần convert, dùng luôn!
        setTranslations(data);
        
        console.log(`✅ Loaded ${lang} translations:`, data);
        console.log(`📊 Namespaces:`, Object.keys(data));
      } else {
        console.warn('⚠️ Translation API returned success: false');
        setTranslations({});
      }
    } catch (error: any) {
      console.error('❌ Failed to load translations:', error.response?.data || error.message);
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

  // ✅ Translation function - Support nested keys (common.welcome)
  const t = (key: string): string => {
    // Split key by dot: "common.welcome" -> ["common", "welcome"]
    const keys = key.split('.');
    let value: any = translations;

    // Navigate through nested object
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Key not found
        if (language !== 'vi') {
          console.warn(`⚠️ Translation not found: "${key}" in language: ${language}`);
        }
        return key; // Fallback to original key
      }
    }

    // Return string value or fallback to key
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