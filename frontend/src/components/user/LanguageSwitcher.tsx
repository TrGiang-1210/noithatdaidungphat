// frontend/src/components/common/LanguageSwitcher.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import "@/styles/components/user/LanguageSwitcher.scss";

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    
    // Update html lang attribute for SEO
    document.documentElement.lang = lng;
  };

  return (
    <div className="language-switcher">
      <button
        className={i18n.language === 'vi' ? 'active' : ''}
        onClick={() => changeLanguage('vi')}
        title="Tiếng Việt"
      >
        🇻🇳 VI
      </button>
      <button
        className={i18n.language === 'zh' ? 'active' : ''}
        onClick={() => changeLanguage('zh')}
        title="中文"
      >
        🇨🇳 ZH
      </button>
    </div>
  );
};

export default LanguageSwitcher;