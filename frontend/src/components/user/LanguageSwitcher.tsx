// frontend/src/components/user/LanguageSwitcher.tsx
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import "@/styles/components/user/LanguageSwitcher.scss";

const LanguageSwitcher: React.FC = () => {
  const { language, changeLanguage } = useLanguage();

  const handleChangeLanguage = (lng: string) => {
    changeLanguage(lng);
    // Update html lang attribute for SEO
    document.documentElement.lang = lng;
  };

  return (
    <div className="language-switcher">
      <button
        className={language === 'vi' ? 'active' : ''}
        onClick={() => handleChangeLanguage('vi')}
        title="Tiếng Việt"
      >
        🇻🇳 VI
      </button>
      <button
        className={language === 'zh' ? 'active' : ''}
        onClick={() => handleChangeLanguage('zh')}
        title="中文"
      >
        🇨🇳 ZH
      </button>
    </div>
  );
};

export default LanguageSwitcher;