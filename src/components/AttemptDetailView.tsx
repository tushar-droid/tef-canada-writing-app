import { useState, useMemo, useRef } from 'react';
import { Attempt, Question } from '../types';
import { AppLanguage, TRANSLATIONS } from '../i18n/translations';
import { computeCategoryFrequencyMap, getMistakeFrequency, normalizeCategory } from '../utils/storage';
import { OFFICIAL_QUESTIONS } from '../data/officialQuestions';
import { ConfirmModal } from './ConfirmModal';
import { LanguageSwitch } from './LanguageSwitch';
import { AnnotatedEssay } from './AnnotatedEssay';
import { exportAttemptToPDF } from '../utils/pdfExport';
import { 
  IconArrowLeft, 
  IconClock, 
  IconFileText, 
  IconSparkles, 
  IconCheckCircle,
  IconTrash,
  IconSettings,
  IconRotateCcw,
  IconDownload
} from './Icons';

interface AttemptDetailViewProps {
  attempt: Attempt;
  allAttempts: Attempt[];
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  onBack: () => void;
  onDelete: (id: string) => void;
  onOpenLLMSettings: () => void;
  onPracticeAgain: (question: Question) => void;
  onSelectAttempt: (id: string) => void;
  onReevaluate?: (attempt: Attempt) => Promise<void>;
}

type ViewMode = 'side-by-side' | 'diagnostics' | 'model';

export function AttemptDetailView({
  attempt,
  allAttempts,
  language,
  onChangeLanguage,
  onBack,
  onDelete,
  onOpenLLMSettings,
  onPracticeAgain,
  onSelectAttempt,
  onReevaluate,
}: AttemptDetailViewProps) {
  const t = TRANSLATIONS[language];
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeMistakeId, setActiveMistakeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [copiedModel, setCopiedModel] = useState(false);
  const [isReevaluating, setIsReevaluating] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const mistakeCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const frequencyMap = useMemo(() => computeCategoryFrequencyMap(allAttempts), [allAttempts]);

  const enrichedMistakes = useMemo(() => {
    // Count occurrences of each category in THIS specific copy
    const thisCopyCounts = new Map<string, number>();
    for (const m of (attempt.mistakes || [])) {
      if (!m || !m.category) continue;
      const norm = normalizeCategory(m.category);
      thisCopyCounts.set(norm, (thisCopyCounts.get(norm) || 0) + 1);
    }

    return (attempt.mistakes || []).map((m) => {
      const norm = normalizeCategory(m.category);
      const tag = getMistakeFrequency(m.category, frequencyMap);
      const historyCount = frequencyMap.get(norm) ?? frequencyMap.get(m.category.trim()) ?? 1;
      const thisCopyCount = thisCopyCounts.get(norm) || 1;

      return {
        ...m,
        frequencyTag: tag,
        occurrenceCount: historyCount,
        thisCopyCount,
      };
    });
  }, [attempt.mistakes, frequencyMap]);

  // Ranked by frequency impact: high priority errors first, then by total history count, then copy count
  const rankedMistakes = useMemo(() => {
    const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return [...enrichedMistakes].sort((a, b) => {
      const weightDiff = (priorityWeight[b.frequencyTag] || 0) - (priorityWeight[a.frequencyTag] || 0);
      if (weightDiff !== 0) return weightDiff;
      if (b.occurrenceCount !== a.occurrenceCount) {
        return b.occurrenceCount - a.occurrenceCount;
      }
      return b.thisCopyCount - a.thisCopyCount;
    });
  }, [enrichedMistakes]);

  const highCount = enrichedMistakes.filter((m) => m.frequencyTag === 'high').length;
  const lowCount = enrichedMistakes.filter((m) => m.frequencyTag === 'low').length;

  // Find top recurring error among the mistakes in this attempt
  const topRecurringError = useMemo(() => {
    if (rankedMistakes.length === 0) {
      return {
        category: language === 'fr' ? 'Aucune' : 'None',
        historyCount: 0,
        thisCopyCount: 0,
        tag: 'none' as const,
      };
    }

    const top = rankedMistakes[0];
    return {
      category: top.category,
      historyCount: top.occurrenceCount,
      thisCopyCount: top.thisCopyCount,
      tag: top.frequencyTag,
    };
  }, [rankedMistakes, language]);

  // Attempt pagination (Previous / Next)
  const currentIndex = allAttempts.findIndex((a) => a.id === attempt.id);
  const prevAttempt = currentIndex < allAttempts.length - 1 ? allAttempts[currentIndex + 1] : null;
  const nextAttempt = currentIndex > 0 ? allAttempts[currentIndex - 1] : null;

  const formattedDate = new Date(attempt.timestamp).toLocaleDateString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  const handleSelectMistakeFromText = (mistakeId: string) => {
    setActiveMistakeId(mistakeId);
    const cardEl = mistakeCardRefs.current[mistakeId];
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCopyModel = () => {
    if (attempt.correctedResponse) {
      navigator.clipboard.writeText(attempt.correctedResponse);
      setCopiedModel(true);
      setTimeout(() => setCopiedModel(false), 2000);
    }
  };

  const handlePracticeTopic = () => {
    const foundQuestion = OFFICIAL_QUESTIONS.find((q) => q.id === attempt.questionId) || {
      id: attempt.questionId,
      taskType: attempt.taskType,
      title: attempt.questionTitle,
      prompt: attempt.questionPrompt,
      timeLimitMinutes: attempt.taskType === 'task1' ? 25 : 35,
      minWords: attempt.taskType === 'task1' ? 80 : 200,
    };
    onPracticeAgain(foundQuestion);
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    setExportNotice(null);
    try {
      const res = await exportAttemptToPDF(attempt);
      if (res.success) {
        setExportNotice('✅ PDF Report exported to Downloads and opened in Preview!');
        setTimeout(() => setExportNotice(null), 5000);
      } else {
        alert(`Export failed: ${res.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Export error: ${err?.message || err}`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleReevaluate = async () => {
    if (!onReevaluate || isReevaluating) return;
    setIsReevaluating(true);
    try {
      await onReevaluate(attempt);
    } finally {
      setIsReevaluating(false);
    }
  };

  const isPending = attempt.status === 'pending-evaluation' || attempt.status === 'evaluation-failed';

  // Sub-scores or default estimates
  const subScores = attempt.subScores || {
    coherence: attempt.nclcScore || 7,
    vocabulary: attempt.nclcScore || 7,
    taskCompletion: attempt.wordCount >= 200 ? 9 : 7,
    grammar: Math.max(4, (attempt.nclcScore || 7) - 2),
  };

  return (
    <div className="review-dashboard-layout">
      {/* 1. TOP NAV BAR */}
      <header className="review-nav-bar">
        <div className="nav-left">
          <button type="button" className="mac-back-button dark" onClick={onBack}>
            <IconArrowLeft size={16} />
            <span>Home</span>
          </button>
          <span className="nav-separator">/</span>
          <span className="nav-title">
            Review Attempt — {attempt.taskType === 'task1' ? 'Task 1 (25 min)' : 'Task 2 (35 min)'}
          </span>
          <span className="nav-timestamp">{formattedDate}</span>
        </div>

        <div className="nav-right">
          <LanguageSwitch currentLang={language} onChangeLang={onChangeLanguage} />

          {onReevaluate && (
            <button
              type="button"
              className="ide-btn secondary"
              onClick={handleReevaluate}
              disabled={isReevaluating}
              title="Re-run evaluation through LLM"
            >
              <IconRotateCcw size={14} />
              <span>{isReevaluating ? 'Re-evaluating...' : 'Re-evaluate with LLM'}</span>
            </button>
          )}

          <button
            type="button"
            className="ide-btn secondary"
            onClick={onOpenLLMSettings}
            title="Configure LLM API"
          >
            <IconSettings size={14} />
            <span>Configure LLM</span>
          </button>

          <button
            type="button"
            className="ide-btn danger"
            onClick={() => setShowDeleteModal(true)}
            title="Delete this attempt"
          >
            <IconTrash size={14} />
            <span>Delete</span>
          </button>
        </div>
      </header>

      {/* 2. TOP 3 KPI CARDS */}
      <section className="kpi-hero-grid">
        {/* KPI 1: EXAM EVALUATION */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">{language === 'fr' ? 'ÉVALUATION' : 'EXAM EVALUATION'}</span>
            <span className={`kpi-badge ${isPending ? 'amber' : 'teal'}`}>
              {isPending ? (language === 'fr' ? 'En attente' : 'Pending') : `NCLC ${attempt.nclcScore}`}
            </span>
          </div>
          <div className="kpi-metric">
            {isPending ? 'NCLC --' : `NCLC ${attempt.nclcScore}.0`}{' '}
            {!isPending && attempt.nclcLevelDescription && (
              <span className="metric-level">
                ({attempt.nclcLevelDescription.split('-')[1]?.trim() || 'B2+'})
              </span>
            )}
          </div>
          <div className="kpi-sub green-text">
            {isPending ? (
              <span className="muted-text">⏳ {language === 'fr' ? 'Copie en attente d’évaluation' : 'Queued for AI evaluation'}</span>
            ) : (
              <>
                <IconCheckCircle size={13} />
                <span>Express Entry Benchmark Met (Target: NCLC 7+)</span>
              </>
            )}
          </div>
        </div>

        {/* KPI 2: LENGTH & TIMING */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">LENGTH & TIMING</span>
            <span className="kpi-badge grey">Strict Cadence</span>
          </div>
          <div className="kpi-metric">
            {attempt.wordCount} mots <span className="metric-target">(Objectif {attempt.taskType === 'task1' ? '80-120' : '200-250'})</span>
          </div>
          <div className="kpi-sub muted-text">
            <IconClock size={13} />
            <span>
              {Math.round(attempt.timeSpentSeconds / 60)} min écoulées sur {attempt.taskType === 'task1' ? '25' : '35'} min allouées
            </span>
          </div>
        </div>

        {/* KPI 3: TOP RECURRING ERROR */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">
              {language === 'fr' ? 'ERREUR PRINCIPALE' : 'TOP RECURRING ERROR'}
            </span>
            <span
              className={`kpi-badge ${
                topRecurringError.tag === 'high'
                  ? 'red'
                  : topRecurringError.tag === 'medium'
                  ? 'amber'
                  : topRecurringError.historyCount === 0
                  ? 'green'
                  : 'grey'
              }`}
            >
              {topRecurringError.historyCount === 0
                ? (language === 'fr' ? 'Sans faute' : 'Zero Errors')
                : topRecurringError.tag === 'high'
                ? (language === 'fr' ? 'Priorité haute' : 'High Priority')
                : topRecurringError.tag === 'medium'
                ? (language === 'fr' ? 'Répétition modérée' : 'Moderate Repeat')
                : (language === 'fr' ? 'Erreur isolée' : 'Isolated Error')}
            </span>
          </div>
          <div className="kpi-metric error-metric">
            <span className={`red-dot dot-${topRecurringError.tag}`}>●</span>{' '}
            {topRecurringError.category}
          </div>
          <div className="kpi-sub muted-text">
            <IconClock size={13} />
            <span>
              {topRecurringError.historyCount === 0
                ? (language === 'fr'
                    ? 'Aucune faute détectée dans cette copie'
                    : 'No mistakes detected in this copy')
                : allAttempts.length <= 1
                ? (language === 'fr'
                    ? `${topRecurringError.thisCopyCount} occurrence${topRecurringError.thisCopyCount > 1 ? 's' : ''} dans cette copie`
                    : `${topRecurringError.thisCopyCount} occurrence${topRecurringError.thisCopyCount > 1 ? 's' : ''} in this essay`)
                : (language === 'fr'
                    ? `${topRecurringError.historyCount} au total (${topRecurringError.thisCopyCount} dans cette copie)`
                    : `${topRecurringError.historyCount} across tests (${topRecurringError.thisCopyCount} in this essay)`)}
            </span>
          </div>
        </div>
      </section>

      {/* PENDING / OFFLINE EVALUATION BANNER */}
      {isPending && (
        <section className="pending-hero-banner">
          <div className="pending-banner-left">
            <span className="pending-badge-icon">⏳</span>
            <div>
              <h3>{language === 'fr' ? 'Épreuve en attente d’évaluation' : 'Exam Submission Queued (Pending Evaluation)'}</h3>
              <p>
                {attempt.evaluationError
                  ? `${language === 'fr' ? 'Diagnostic :' : 'Diagnostic:'} ${attempt.evaluationError}`
                  : (language === 'fr'
                      ? 'Votre copie est enregistrée localement en sécurité. Cliquez sur le bouton pour déclencher l’évaluation dès que votre connexion est active.'
                      : 'Your essay is safely saved locally. Click the button below to run AI evaluation once your connection is active.')}
              </p>
            </div>
          </div>
          <div className="pending-banner-actions">
            {onReevaluate && (
              <button
                type="button"
                className="mac-button primary"
                onClick={handleReevaluate}
                disabled={isReevaluating}
              >
                <IconRotateCcw size={15} />
                <span>{isReevaluating ? (language === 'fr' ? 'Évaluation en cours...' : 'Evaluating...') : (language === 'fr' ? 'Évaluer maintenant avec l’IA' : 'Evaluate with LLM Now')}</span>
              </button>
            )}
            <button
              type="button"
              className="mac-button secondary"
              onClick={onOpenLLMSettings}
            >
              <IconSettings size={14} />
              <span>{language === 'fr' ? 'Paramètres LLM' : 'Configure LLM'}</span>
            </button>
          </div>
        </section>
      )}

      {/* 3. TASK QUESTION BANNER */}
      <section className="task-banner-box">
        <div className="task-banner-top">
          <div className="task-title-group">
            <span className="task-amber-pill">
              {attempt.taskType === 'task1' ? 'TASK 1 • 25 MIN' : 'TASK 2 • 35 MIN'}
            </span>
            <h2 className="task-title-text">{attempt.questionTitle}</h2>
          </div>
          <span className="task-format-tag">
            {attempt.taskType === 'task1' 
              ? 'Format officiel TEF Canada : Suite de fait divers journalistique' 
              : 'Format officiel TEF Canada : Lettre d\'opinion argumentée au rédacteur en chef'}
          </span>
        </div>
        <div className="task-consigne-text">
          {attempt.questionPrompt}
        </div>
      </section>

      {/* 4. FREQUENCY LEGEND & VIEW TOGGLES */}
      <div className="review-controls-bar">
        <div className="frequency-legend-inline">
          <span className="legend-head">Mistake frequency:</span>
          <span className="legend-tag red"><span className="dot red" /> Red (High / Recurring)</span>
          <span className="legend-tag yellow"><span className="dot yellow" /> Yellow (Moderate)</span>
          <span className="legend-tag green"><span className="dot green" /> Green (Rare / Isolated)</span>
        </div>

        <div className="segmented-view-picker">
          <button
            type="button"
            className={`view-pill ${viewMode === 'side-by-side' ? 'active' : ''}`}
            onClick={() => setViewMode('side-by-side')}
          >
            Side-by-Side Review
          </button>
          <button
            type="button"
            className={`view-pill ${viewMode === 'diagnostics' ? 'active' : ''}`}
            onClick={() => setViewMode('diagnostics')}
          >
            Grammar Diagnostics Only
          </button>
          <button
            type="button"
            className={`view-pill ${viewMode === 'model' ? 'active' : ''}`}
            onClick={() => setViewMode('model')}
          >
            Model Band 9
          </button>
        </div>
      </div>

      {/* 5. MAIN CONTENT PANELS */}
      <main className="review-main-workspace">
        {/* VIEW MODE 1: SIDE BY SIDE (Matches Screenshot) */}
        {viewMode === 'side-by-side' && (
          <div className="side-by-side-grid">
            {/* LEFT COLUMN: CANDIDATE ESSAY + FULL MODEL BAND 9 BELOW IT */}
            <div className="essay-submission-column">
              {/* Card 1: Your Essay Submission with In-Text Underlines */}
              <div className="essay-panel-card">
                <div className="panel-card-header">
                  <div className="panel-title-group">
                    <IconFileText size={16} />
                    <h3>Your Essay Submission</h3>
                  </div>
                  <div className="panel-stats-badges">
                    <span className="stat-pill">{attempt.wordCount} words</span>
                    {highCount > 0 && <span className="stat-pill red">{highCount} High</span>}
                    {lowCount > 0 && <span className="stat-pill green">{lowCount} Rare</span>}
                  </div>
                </div>

                {/* The annotated essay with interactive colored underlines */}
                <div className="annotated-text-container">
                  <AnnotatedEssay
                    text={attempt.userResponse}
                    mistakes={enrichedMistakes}
                    activeMistakeId={activeMistakeId}
                    onSelectMistake={handleSelectMistakeFromText}
                  />
                </div>

                <div className="essay-panel-footer">
                  <span className="inspect-hint">
                    Click any colored tag to jump to detailed grammar resolution
                  </span>
                  <span className="inspect-status">
                    🛡 Inspect mode active
                  </span>
                </div>
              </div>

              {/* Card 2: Full Corrected Model Band 9 Answer Listed in its Entirety Below User's Response */}
              <div className="model-full-below-card">
                <div className="panel-card-header">
                  <div className="panel-title-group">
                    <IconSparkles size={16} />
                    <h3>Model Band 9 Reference Answer (Corrected in Full)</h3>
                  </div>
                  <div className="panel-stats-badges">
                    <span className="stat-pill teal">NCLC 10 / C1 Master</span>
                    <button
                      type="button"
                      className="copy-extract-btn"
                      onClick={handleCopyModel}
                      title="Copy full reference model"
                    >
                      {copiedModel ? 'Copied!' : 'Copy Model'}
                    </button>
                  </div>
                </div>

                <div className="model-full-below-body">
                  {(attempt.correctedResponse || (isPending ? (language === 'fr' ? '(Le corrigé NCLC 10 sera généré dès l’évaluation par l’IA)' : '(NCLC 10 model answer will be generated upon AI evaluation)') : '')).split('\n\n').map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>

                <div className="model-card-footer">
                  <span className="model-badge-note">
                    ✨ High-register Canadian French structure & discourse markers
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: TEF SUB-SCORES & TARGET REMEDIATION */}
            <div className="diagnostics-panel-column">
              {isPending ? (
                <div className="subscores-card pending-side-card">
                  <div className="panel-card-header no-border">
                    <h3>⏳ {language === 'fr' ? 'Diagnostic en attente' : 'Diagnostics In Queue'}</h3>
                  </div>
                  <p className="pending-column-text">
                    {language === 'fr'
                      ? 'Cette copie a été enregistrée hors ligne ou mise en attente. Dès que l’évaluation par l’IA sera effectuée, la grille détaillée NCLC et vos fiches de remédiation grammaticale apparaîtront ici.'
                      : 'This essay was recorded offline or queued for review. Once AI evaluation is completed, the full NCLC breakdown and your grammar resolution notes will appear here.'}
                  </p>
                  {onReevaluate && (
                    <button
                      type="button"
                      className="mac-button primary full-width"
                      onClick={handleReevaluate}
                      disabled={isReevaluating}
                      style={{ marginTop: '16px' }}
                    >
                      <IconRotateCcw size={15} />
                      <span>{isReevaluating ? (language === 'fr' ? 'Évaluation en cours...' : 'Evaluating...') : (language === 'fr' ? 'Évaluer maintenant avec l’IA' : 'Evaluate with LLM Now')}</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* TEF Sub-scores Analysis */}
                  <div className="subscores-card">
                <div className="panel-card-header no-border">
                  <h3>TEF Sub-Scores Analysis</h3>
                  <span className="grid-version-tag">Grid NCLC 2026</span>
                </div>

                <div className="subscores-list">
                  <div className="subscore-item">
                    <div className="subscore-meta">
                      <span className="criterion-name">Cohérence & Organisation du texte</span>
                      <span className="criterion-grade">NCLC {subScores.coherence} (B2+)</span>
                    </div>
                    <div className="subscore-progress-track">
                      <div className="subscore-bar teal" style={{ width: `${subScores.coherence * 10}%` }} />
                    </div>
                  </div>

                  <div className="subscore-item">
                    <div className="subscore-meta">
                      <span className="criterion-name">Richesse du vocabulaire (Lexique)</span>
                      <span className="criterion-grade">NCLC {subScores.vocabulary} (B2+)</span>
                    </div>
                    <div className="subscore-progress-track">
                      <div className="subscore-bar teal" style={{ width: `${subScores.vocabulary * 10}%` }} />
                    </div>
                  </div>

                  <div className="subscore-item">
                    <div className="subscore-meta">
                      <span className="criterion-name">Respect de la consigne & Longueur</span>
                      <span className="criterion-grade">NCLC {subScores.taskCompletion} (C1)</span>
                    </div>
                    <div className="subscore-progress-track">
                      <div className="subscore-bar cyan" style={{ width: `${subScores.taskCompletion * 10}%` }} />
                    </div>
                  </div>

                  <div className="subscore-item">
                    <div className="subscore-meta">
                      <span className="criterion-name">Correction grammaticale & Syntaxe</span>
                      <span className="criterion-grade">NCLC {subScores.grammar} (B1+)</span>
                    </div>
                    <div className="subscore-progress-track">
                      <div className="subscore-bar amber" style={{ width: `${subScores.grammar * 10}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Remediation Cards */}
              <div className="remediation-section">
                <div className="panel-card-header no-border">
                  <div className="panel-title-group">
                    <span className="shield-icon">🎯</span>
                    <h3>Target Remediation</h3>
                  </div>
                  <span className="ranked-tag">Ranked by frequency impact</span>
                </div>

                <div className="remediation-cards-list">
                  {rankedMistakes.map((mistake, index) => {
                    const isSelected = activeMistakeId === mistake.id;
                    const freqClass = mistake.frequencyTag || 'medium';

                    return (
                      <div
                        key={mistake.id}
                        ref={(el) => { mistakeCardRefs.current[mistake.id] = el; }}
                        className={`remediation-item-card ${freqClass} ${isSelected ? 'selected' : ''}`}
                        onClick={() => setActiveMistakeId(mistake.id)}
                      >
                        <div className="remediation-card-top">
                          <div className="item-title-row">
                            <span className={`status-dot ${freqClass}`}>●</span>
                            <span className="item-number-title">
                              {index + 1}. {mistake.category}
                            </span>
                          </div>
                          <span className={`priority-tag ${freqClass}`}>
                            {freqClass === 'high' 
                              ? (language === 'fr' ? 'Haute récurrence' : 'High Frequency') 
                              : freqClass === 'medium' 
                              ? (language === 'fr' ? 'Répétition modérée' : 'Moderate Repeat') 
                              : (language === 'fr' ? 'Erreur isolée' : 'Isolated Error')}
                          </span>
                        </div>

                        <div className="item-diff-lines">
                          <div className="diff-line error">
                            <span className="line-prefix">Erreur :</span>
                            <span className="line-text">« {mistake.original} »</span>
                          </div>
                          <div className="diff-line fix">
                            <span className="line-prefix">Correction :</span>
                            <span className="line-text">« {mistake.correction} »</span>
                          </div>
                        </div>

                        <div className="item-astuce-box">
                          <span className="bulb-icon">💡</span>
                          <div className="astuce-content">
                            <strong>Astuce TEF :</strong> {mistake.explanation} {mistake.howToAvoid}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
        )}

        {/* VIEW MODE 2: GRAMMAR DIAGNOSTICS ONLY */}
        {viewMode === 'diagnostics' && (
          <div className="diagnostics-only-view">
            <div className="diagnostics-header-block">
              <h2>All Grammar Resolution & Pedagogical Rules</h2>
              <p>Review each mistake in depth along with Canadian scoring criteria.</p>
            </div>
            <div className="remediation-cards-list full-width">
              {rankedMistakes.map((mistake, index) => (
                <div key={mistake.id} className={`remediation-item-card ${mistake.frequencyTag}`}>
                  <div className="remediation-card-top">
                    <div className="item-title-row">
                      <span className={`status-dot ${mistake.frequencyTag}`}>●</span>
                      <span className="item-number-title">{index + 1}. {mistake.category}</span>
                    </div>
                    <span className={`priority-tag ${mistake.frequencyTag}`}>
                      {mistake.frequencyTag === 'high'
                        ? (language === 'fr' ? 'HAUTE PRIORITÉ' : 'HIGH PRIORITY')
                        : mistake.frequencyTag === 'medium'
                        ? (language === 'fr' ? 'RÉPÉTITION MODÉRÉE' : 'MODERATE REPEAT')
                        : (language === 'fr' ? 'ERREUR ISOLÉE' : 'ISOLATED ERROR')}
                    </span>
                  </div>
                  <div className="item-diff-lines">
                    <div className="diff-line error">
                      <span className="line-prefix">Erreur :</span>
                      <span className="line-text strike">« {mistake.original} »</span>
                    </div>
                    <div className="diff-line fix">
                      <span className="line-prefix">Correction recommandée :</span>
                      <span className="line-text valid">« {mistake.correction} »</span>
                    </div>
                  </div>
                  <div className="item-astuce-box">
                    <span className="bulb-icon">💡</span>
                    <div className="astuce-content">
                      <strong>Rule & Advice:</strong> {mistake.explanation} <em>{mistake.howToAvoid}</em>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW MODE 3: FULL MODEL BAND 9 */}
        {viewMode === 'model' && (
          <div className="model-full-view">
            <div className="model-header-block">
              <div className="model-header-left">
                <h2>Full Reference Model (NCLC 10 / C1 Master Essay)</h2>
                <p>Authentic high-level rewrite designed to showcase ideal vocabulary and discourse markers.</p>
              </div>
              <button type="button" className="ide-btn primary" onClick={handleCopyModel}>
                <IconSparkles size={14} />
                <span>{copiedModel ? 'Copied to Clipboard!' : 'Copy Model Essay'}</span>
              </button>
            </div>
            <div className="model-text-sheet">
              {(attempt.correctedResponse || (isPending ? '(Model answer will be generated upon AI evaluation)' : '')).split('\n\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 6. BOTTOM ACTION FOOTER */}
      <footer className="review-action-footer">
        <div className="footer-left">
          <button type="button" className="footer-action-btn" onClick={handlePracticeTopic}>
            <IconRotateCcw size={15} />
            <span>Practice This Topic Again</span>
          </button>
          <button
            type="button"
            className="footer-action-btn"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            title="Generate and export full diagnostic report as PDF"
          >
            <IconDownload size={15} />
            <span>{isExportingPDF ? 'Generating PDF...' : 'Export PDF Report'}</span>
          </button>
        </div>

        {exportNotice && (
          <div className="pdf-toast-banner">
            <IconCheckCircle size={15} />
            <span>{exportNotice}</span>
          </div>
        )}

        <div className="footer-right">
          {prevAttempt && (
            <button
              type="button"
              className="footer-nav-btn"
              onClick={() => onSelectAttempt(prevAttempt.id)}
            >
              Previous Attempt
            </button>
          )}
          {nextAttempt && (
            <button
              type="button"
              className="footer-nav-btn primary"
              onClick={() => onSelectAttempt(nextAttempt.id)}
            >
              <span>Next Attempt</span>
              <span>›</span>
            </button>
          )}
        </div>
      </footer>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title={t.deleteModalTitle}
        message={t.deleteModalDesc}
        confirmLabel={t.confirmDelete}
        cancelLabel={t.cancel}
        isDanger={true}
        onConfirm={() => {
          onDelete(attempt.id);
          setShowDeleteModal(false);
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
