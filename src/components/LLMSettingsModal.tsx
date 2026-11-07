import { useState } from 'react';
import { LLMConfig, LLMProvider } from '../types';
import { AppLanguage, TRANSLATIONS } from '../i18n/translations';
import { testLLMConnection, PROVIDER_MODELS } from '../utils/llmService';
import { DEFAULT_TEF_SYSTEM_PROMPT } from '../utils/storage';
import { LanguageSwitch } from './LanguageSwitch';
import { IconCpu, IconCheckCircle, IconAlertTriangle, IconArrowLeft, IconRotateCcw } from './Icons';

interface LLMSettingsModalProps {
  config: LLMConfig;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  onSaveConfig: (updated: LLMConfig) => void;
  onClose: () => void;
}

export function LLMSettingsModal({
  config,
  language,
  onChangeLanguage,
  onSaveConfig,
  onClose,
}: LLMSettingsModalProps) {
  const t = TRANSLATIONS[language];
  const [formData, setFormData] = useState<LLMConfig>({
    ...config,
    fallbackModelName: config.fallbackModelName || '',
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedError, setCopiedError] = useState(false);

  const availableModels = PROVIDER_MODELS[formData.provider] || [];

  const handleProviderChange = (provider: LLMProvider) => {
    let baseUrl = formData.baseUrl;
    let modelName = formData.modelName;
    let fallbackModelName = formData.fallbackModelName || '';

    if (provider === 'gemini') {
      baseUrl = 'https://generativelanguage.googleapis.com';
      modelName = 'gemini-3-flash-preview';
      fallbackModelName = 'gemini-3-flash-lite';
    } else if (provider === 'custom') {
      baseUrl = 'http://localhost:11434/v1';
      modelName = 'mistral';
      fallbackModelName = 'llama3';
    }

    setFormData((prev) => ({
      ...prev,
      provider,
      baseUrl,
      modelName,
      fallbackModelName,
    }));
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testLLMConnection(formData);
    setTestResult(result);
    if (result.success) {
      setFormData((prev) => ({ ...prev, isEnabled: true }));
    }
    setTesting(false);
  };

  const handleCopyError = () => {
    if (testResult?.message) {
      navigator.clipboard.writeText(testResult.message);
      setCopiedError(true);
      setTimeout(() => setCopiedError(false), 2000);
    }
  };

  const handleSave = () => {
    const hasCreds = formData.provider === 'gemini' 
      ? formData.apiKey.trim().length > 0 
      : formData.baseUrl.trim().length > 0;
    const finalConfig = {
      ...formData,
      isEnabled: hasCreds,
    };
    onSaveConfig(finalConfig);
    onClose();
  };

  const handleResetPrompt = () => {
    setFormData((prev) => ({ ...prev, systemPrompt: DEFAULT_TEF_SYSTEM_PROMPT }));
  };

  return (
    <div className="settings-container">
      {/* Top Header */}
      <div className="settings-header">
        <div className="settings-header-top">
          <button type="button" className="mac-back-button" onClick={onClose}>
            <IconArrowLeft size={16} />
            <span>{t.backToHome}</span>
          </button>
          <LanguageSwitch currentLang={language} onChangeLang={onChangeLanguage} />
        </div>
        <h1>{t.settingsTitle}</h1>
        <p className="subtitle">{t.settingsSubtitle}</p>
      </div>

      <div className="settings-body-card">
        {/* Automatic Status Notice (No manual tick required) */}
        <div className="settings-row status-info-row">
          <div className="setting-info">
            <span className="setting-label">
              {language === 'fr' ? 'Statut de l’évaluation IA' : 'AI Evaluation Engine'}
            </span>
            <span className="setting-desc">
              {language === 'fr'
                ? 'L’évaluation IA est automatiquement activée dès que vos identifiants sont renseignés ou testés avec succès.'
                : 'AI evaluation activates automatically as soon as your credentials or local model are saved or verified.'}
            </span>
          </div>
          <div className="auto-active-badge">
            <span className="dot pulse green" />
            <span>{language === 'fr' ? 'Actif automatiquement' : 'Auto-Enabled on Save'}</span>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="settings-row">
          <div className="setting-info">
            <span className="setting-label">{t.providerLabel}</span>
            <span className="setting-desc">{t.providerDesc}</span>
          </div>
          <div className="provider-buttons-grid two-cols">
            <button
              type="button"
              className={`provider-pill ${formData.provider === 'gemini' ? 'active' : ''}`}
              onClick={() => handleProviderChange('gemini')}
            >
              Google Gemini (Gemini 3.0 Family)
            </button>
            <button
              type="button"
              className={`provider-pill ${formData.provider === 'custom' ? 'active' : ''}`}
              onClick={() => handleProviderChange('custom')}
            >
              Local Models (Ollama, LM Studio)
            </button>
          </div>
        </div>

        {/* API Key */}
        <div className="settings-row">
          <div className="setting-info">
            <span className="setting-label">{t.apiKeyLabel}</span>
            <span className="setting-desc">{t.apiKeyDesc}</span>
          </div>
          <input
            type="password"
            className="mac-input settings-input"
            placeholder={
              formData.provider === 'gemini'
                ? 'AIzaSy...'
                : formData.provider === 'custom'
                ? 'Optional for local Ollama'
                : 'sk-...'
            }
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
          />
        </div>

        {/* Base URL */}
        <div className="settings-row">
          <div className="setting-info">
            <span className="setting-label">{t.baseUrlLabel}</span>
            <span className="setting-desc">{t.baseUrlDesc}</span>
          </div>
          <input
            type="text"
            className="mac-input settings-input"
            value={formData.baseUrl}
            onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
          />
        </div>

        {/* Primary Model with Dropdown and Custom Input */}
        <div className="settings-row">
          <div className="setting-info">
            <span className="setting-label">{t.modelLabel}</span>
            <span className="setting-desc">{t.modelDesc}</span>
          </div>

          <div className="model-select-group">
            <div className="select-row">
              <label className="sub-label">{t.selectFromList}</label>
              <select
                className="mac-select"
                value={availableModels.some((m) => m.id === formData.modelName) ? formData.modelName : 'custom'}
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    setFormData({ ...formData, modelName: e.target.value });
                  }
                }}
              >
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} ({m.id}) {m.recommended ? '— ★ Recommended' : ''}
                  </option>
                ))}
                <option value="custom">Other / Custom Model ID...</option>
              </select>
            </div>

            <div className="custom-input-row">
              <label className="sub-label">{t.orCustomModel}</label>
              <input
                type="text"
                className="mac-input settings-input"
                placeholder="e.g. gemini-2.5-flash, gemini-2.5-pro..."
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Fallback Model with Dropdown and Custom Input */}
        <div className="settings-row">
          <div className="setting-info">
            <span className="setting-label">{t.fallbackModelLabel}</span>
            <span className="setting-desc">{t.fallbackModelDesc}</span>
          </div>

          <div className="model-select-group">
            <div className="select-row">
              <label className="sub-label">{t.selectFromList}</label>
              <select
                className="mac-select"
                value={
                  !formData.fallbackModelName
                    ? ''
                    : availableModels.some((m) => m.id === formData.fallbackModelName)
                    ? formData.fallbackModelName
                    : 'custom'
                }
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    setFormData({ ...formData, fallbackModelName: e.target.value });
                  }
                }}
              >
                <option value="">{t.noFallbackOption}</option>
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} ({m.id})
                  </option>
                ))}
                <option value="custom">Other / Custom Fallback ID...</option>
              </select>
            </div>

            <div className="custom-input-row">
              <label className="sub-label">{t.orCustomModel}</label>
              <input
                type="text"
                className="mac-input settings-input"
                placeholder="e.g. gemini-2.0-flash-lite, gpt-4o-mini..."
                value={formData.fallbackModelName || ''}
                onChange={(e) => setFormData({ ...formData, fallbackModelName: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Test Connection Button & Result (No cutoffs, full copyable message) */}
        <div className="settings-row test-connection-row">
          <button
            type="button"
            className="mac-button secondary"
            disabled={testing}
            onClick={handleTest}
          >
            <IconCpu size={16} />
            <span>{testing ? t.testing : t.testBtn}</span>
          </button>

          {testResult && (
            <div className={`connection-result-banner ${testResult.success ? 'success' : 'error'}`}>
              <div className="banner-top">
                <div className="banner-title-row">
                  {testResult.success ? <IconCheckCircle size={18} /> : <IconAlertTriangle size={18} />}
                  <span className="banner-heading">
                    {testResult.success ? 'Status: Online' : 'Status: Connection Failed'}
                  </span>
                </div>
                {!testResult.success && (
                  <button
                    type="button"
                    className="copy-error-btn"
                    onClick={handleCopyError}
                    title={t.copyError}
                  >
                    {copiedError ? t.copied : t.copyError}
                  </button>
                )}
              </div>
              <div className="banner-body-text">
                <pre>{testResult.message}</pre>
              </div>
            </div>
          )}
        </div>

        {/* System Prompt / English Guidance */}
        <div className="settings-row prompt-row">
          <div className="prompt-header-row">
            <div>
              <span className="setting-label">{t.promptLabel}</span>
              <p className="setting-desc">{t.promptDesc}</p>
            </div>
            <button
              type="button"
              className="mac-button ghost small"
              onClick={handleResetPrompt}
              title={t.defaultPromptBtn}
            >
              <IconRotateCcw size={13} />
              <span>{t.defaultPromptBtn}</span>
            </button>
          </div>
          <textarea
            className="mac-textarea prompt-textarea"
            rows={8}
            value={formData.systemPrompt}
            onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
          />
        </div>

        {/* Save Bar */}
        <div className="settings-footer-actions">
          <button type="button" className="mac-button secondary" onClick={onClose}>
            {t.cancel}
          </button>
          <button type="button" className="mac-button primary" onClick={handleSave}>
            {t.saveSettings}
          </button>
        </div>
      </div>
    </div>
  );
}
