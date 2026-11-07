import { useState, useRef } from 'react';
import { Question, Attempt, LLMConfig } from '../types';
import { AppLanguage, TRANSLATIONS } from '../i18n/translations';
import { Timer } from './Timer';
import { AccentBar } from './AccentBar';
import { IconAlertTriangle, IconFileText, IconCheckCircle, IconArrowLeft, IconRotateCcw, IconSettings } from './Icons';
import { evaluateEssayWithLLM } from '../utils/llmService';

interface ExamViewProps {
  question: Question;
  llmConfig: LLMConfig;
  language: AppLanguage;
  onFinishExam: (attempt: Attempt) => void;
  onOpenLLMSettings?: () => void;
  onCancel: () => void;
}

export function ExamView({ question, llmConfig, language, onFinishExam, onOpenLLMSettings, onCancel }: ExamViewProps) {
  const t = TRANSLATIONS[language];
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoClosedNotice, setAutoClosedNotice] = useState<string | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [copiedError, setCopiedError] = useState(false);
  const [remainingSecs, setRemainingSecs] = useState(question.timeLimitMinutes * 60);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = response.trim().length > 0 
    ? response.trim().split(/\s+/).filter(Boolean).length 
    : 0;

  const totalSeconds = question.timeLimitMinutes * 60;
  const timeSpent = totalSeconds - remainingSecs;

  const handleInsertChar = (char: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = response;

    const newText = currentText.substring(0, start) + char + currentText.substring(end);
    setResponse(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + char.length, start + char.length);
    }, 0);
  };

  const handleComplete = async (reason: 'manual' | 'timeout') => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setLlmError(null);

    if (reason === 'timeout') {
      setAutoClosedNotice(t.timeUpNotice);
    }

    try {
      const evaluatedAttempt = await evaluateEssayWithLLM(
        llmConfig,
        question,
        response,
        timeSpent,
        wordCount
      );
      onFinishExam(evaluatedAttempt);
    } catch (err: any) {
      console.error('Error evaluating exam:', err);
      setLlmError(err?.message || 'Failed to communicate with LLM provider. Please check your LLM configuration and network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="exam-container">
      {/* Top Header Bar strictly with Timer on top left */}
      <header className="exam-header-bar">
        <div className="exam-left-group">
          <button 
            type="button" 
            className="mac-back-button"
            onClick={onCancel}
            disabled={isSubmitting}
            title={t.abandon}
          >
            <IconArrowLeft size={16} />
            <span>{t.abandon}</span>
          </button>

          <Timer
            totalSeconds={totalSeconds}
            onTimeUp={() => handleComplete('timeout')}
            onTick={(s) => setRemainingSecs(s)}
          />
        </div>

        <div className="exam-center-group">
          <span className="exam-task-pill">
            {question.taskType === 'task1' ? 'Task 1 (Section A)' : 'Task 2 (Section B)'}
          </span>
        </div>

        <div className="exam-right-group">
          <div className="word-counter-badge">
            <IconFileText size={15} />
            <span><strong>{wordCount}</strong> {t.words}</span>
          </div>

          <button
            type="button"
            className="mac-button primary submit-btn"
            disabled={isSubmitting || wordCount === 0}
            onClick={() => handleComplete('manual')}
          >
            {isSubmitting ? (
              <span>{t.evaluating}</span>
            ) : (
              <>
                <IconCheckCircle size={15} />
                <span>{t.submitExam}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Auto-close notification on timeout */}
      {autoClosedNotice && (
        <div className="timeout-alert-banner">
          <IconAlertTriangle size={18} />
          <span>{autoClosedNotice}</span>
        </div>
      )}

      {/* LLM Evaluation Failure Banner */}
      {llmError && (
        <div className="exam-llm-error-banner">
          <div className="error-banner-content">
            <div className="error-header-line">
              <IconAlertTriangle size={18} className="error-banner-icon" />
              <strong>{language === 'fr' ? "Échec de l'évaluation par l'IA" : "LLM Evaluation Failed"}</strong>
            </div>
            <div className="error-description">{llmError}</div>
            <div className="error-actions-group">
              <button
                type="button"
                className="mac-button primary small"
                onClick={() => handleComplete('manual')}
                disabled={isSubmitting}
              >
                <IconRotateCcw size={14} />
                <span>{language === 'fr' ? 'Réessayer l’évaluation' : 'Retry Evaluation'}</span>
              </button>

              {onOpenLLMSettings && (
                <button
                  type="button"
                  className="mac-button secondary small"
                  onClick={onOpenLLMSettings}
                >
                  <IconSettings size={14} />
                  <span>{language === 'fr' ? 'Paramètres LLM' : 'Configure LLM'}</span>
                </button>
              )}

              <button
                type="button"
                className="mac-button ghost small"
                onClick={() => {
                  navigator.clipboard.writeText(llmError);
                  setCopiedError(true);
                  setTimeout(() => setCopiedError(false), 2000);
                }}
              >
                <span>{copiedError ? (language === 'fr' ? 'Copié !' : 'Copied!') : (language === 'fr' ? 'Copier l’erreur' : 'Copy Error')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Strict Exam Workspace */}
      <div className="exam-body strict-mode">
        {/* Question Prompt */}
        <section className="exam-question-card">
          <div className="question-header">
            <span className="prompt-badge">{t.officialTopic}</span>
            {question.source && <span className="source-tag">{question.source}</span>}
          </div>
          <h2 className="question-title">{question.title}</h2>
          <div className="question-prompt-text">
            {question.prompt.split('\n\n').map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        </section>

        {/* Text Area with French Accent Bar directly above */}
        <section className="exam-editor-card">
          <AccentBar onInsertChar={handleInsertChar} />

          <div className="textarea-wrapper">
            <textarea
              ref={textareaRef}
              className="exam-textarea"
              placeholder={t.typePlaceholder}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              spellCheck={false}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
