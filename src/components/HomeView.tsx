import { Attempt, LLMConfig } from '../types';
import { AppLanguage, TRANSLATIONS } from '../i18n/translations';
import { LanguageSwitch } from './LanguageSwitch';
import { 
  IconAward, 
  IconFileText, 
  IconClock, 
  IconSparkles, 
  IconChevronRight, 
  IconSettings,
  IconCpu 
} from './Icons';

interface HomeViewProps {
  attempts: Attempt[];
  llmConfig: LLMConfig;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  onTakeTest: () => void;
  onReviewAttempts: () => void;
  onOpenLLMSettings: () => void;
}

export function HomeView({
  attempts,
  llmConfig,
  language,
  onChangeLanguage,
  onTakeTest,
  onReviewAttempts,
  onOpenLLMSettings,
}: HomeViewProps) {
  const t = TRANSLATIONS[language];
  const totalAttempts = attempts.length;
  const avgNclc = totalAttempts > 0 
    ? (attempts.reduce((sum, a) => sum + (a.nclcScore || 0), 0) / totalAttempts).toFixed(1)
    : '7.0';

  const isLLMActive = llmConfig.isEnabled && (llmConfig.apiKey || llmConfig.provider === 'custom');

  return (
    <div className="home-dashboard">
      {/* Top Bar with Language Switcher and LLM Pill */}
      <div className="home-top-bar">
        <LanguageSwitch currentLang={language} onChangeLang={onChangeLanguage} />

        <button
          type="button"
          className={`llm-status-pill ${isLLMActive ? 'active' : 'inactive'}`}
          onClick={onOpenLLMSettings}
          title={isLLMActive ? t.manageLLM : t.connectLLM}
        >
          <IconCpu size={15} />
          <span className="status-label">
            {isLLMActive ? (
              <>{t.llmConnected}: <strong>{llmConfig.modelName || llmConfig.provider}</strong></>
            ) : (
              <>{t.connectLLM}</>
            )}
          </span>
          <IconSettings size={14} />
        </button>
      </div>

      {/* Header Banner */}
      <header className="home-header">
        <div className="home-badge">
          <span className="dot pulse" /> {t.officialPrep}
        </div>
        <h1 className="home-title">{t.homeTitle}</h1>
        <p className="home-subtitle">{t.homeSubtitle}</p>
      </header>

      {/* Primary Action Cards Grid */}
      <div className="primary-actions-grid">
        {/* OPTION 1: TAKE A TEST */}
        <div className="action-card take-test-card" onClick={onTakeTest}>
          <div className="card-top-row">
            <div className="action-icon-wrapper navy">
              <span className="emoji-icon">✍️</span>
            </div>
            <span className="card-tag highlight">{t.takeTestTag}</span>
          </div>

          <h2 className="action-title">{t.takeTest}</h2>
          <p className="action-desc">{t.takeTestDesc}</p>

          <div className="action-features">
            <div className="feature-item">
              <IconClock size={15} /> <span>{t.timerFeature}</span>
            </div>
            <div className="feature-item">
              <IconFileText size={15} /> <span>{t.accentsFeature}</span>
            </div>
            <div className="feature-item">
              <IconSparkles size={15} /> <span>{t.scoringFeature}</span>
            </div>
          </div>

          <button type="button" className="mac-button primary full-width">
            <span>{t.startTestBtn}</span>
            <IconChevronRight size={16} />
          </button>
        </div>

        {/* OPTION 2: REVIEW PREVIOUS ATTEMPTS */}
        <div className="action-card review-card" onClick={onReviewAttempts}>
          <div className="card-top-row">
            <div className="action-icon-wrapper amber">
              <span className="emoji-icon">📊</span>
            </div>
            <span className="card-tag count">{totalAttempts} {totalAttempts > 1 ? 'tests' : 'test'}</span>
          </div>

          <h2 className="action-title">{t.reviewHistory}</h2>
          <p className="action-desc">{t.reviewHistoryDesc}</p>

          <div className="action-features">
            <div className="feature-item">
              <IconAward size={15} /> <span>{t.nclcFeature}</span>
            </div>
            <div className="feature-item">
              <span className="dot red" /> <span>{t.mistakesFeature}</span>
            </div>
            <div className="feature-item">
              <IconSparkles size={15} /> <span>{t.englishAdviceFeature}</span>
            </div>
          </div>

          <button type="button" className="mac-button secondary full-width">
            <span>{t.viewAttemptsBtn} ({totalAttempts})</span>
            <IconChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* OPTION 3: Connect to LLM Card */}
      <div className="llm-connection-banner-card" onClick={onOpenLLMSettings}>
        <div className="llm-banner-left">
          <div className="action-icon-wrapper sage">
            <IconCpu size={24} />
          </div>
          <div className="llm-banner-text">
            <h3>{t.llmBannerTitle}</h3>
            <p>
              {isLLMActive 
                ? t.llmBannerDescActive.replace('{model}', `${llmConfig.provider.toUpperCase()} (${llmConfig.modelName})`)
                : t.llmBannerDescInactive
              }
            </p>
          </div>
        </div>

        <button type="button" className="mac-button secondary">
          <IconSettings size={15} />
          <span>{isLLMActive ? t.manageLLM : t.configureLLM}</span>
        </button>
      </div>

      {/* Bottom Summary Bar */}
      <div className="home-footer-stats">
        <div className="quick-stat">
          <span className="quick-label">{t.footerAttempts}</span>
          <span className="quick-value">{totalAttempts}</span>
        </div>
        <div className="stat-divider" />
        <div className="quick-stat">
          <span className="quick-label">{t.footerAvgNclc}</span>
          <span className="quick-value highlight">NCLC {avgNclc}</span>
        </div>
        <div className="stat-divider" />
        <div className="quick-stat">
          <span className="quick-label">{t.footerTarget}</span>
          <span className="quick-value green">{t.footerTargetVal}</span>
        </div>
      </div>
    </div>
  );
}
