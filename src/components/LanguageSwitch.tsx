import { AppLanguage } from '../i18n/translations';

interface LanguageSwitchProps {
  currentLang: AppLanguage;
  onChangeLang: (lang: AppLanguage) => void;
}

export function LanguageSwitch({ currentLang, onChangeLang }: LanguageSwitchProps) {
  return (
    <div className="language-switch-control" role="group" aria-label="Language Switcher">
      <button
        type="button"
        className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`}
        onClick={() => onChangeLang('en')}
        title="Switch interface to English"
      >
        <span className="lang-flag">🇬🇧</span>
        <span className="lang-text">EN</span>
      </button>
      <button
        type="button"
        className={`lang-btn ${currentLang === 'fr' ? 'active' : ''}`}
        onClick={() => onChangeLang('fr')}
        title="Passer l'interface en français"
      >
        <span className="lang-flag">🇫🇷</span>
        <span className="lang-text">FR</span>
      </button>
    </div>
  );
}
