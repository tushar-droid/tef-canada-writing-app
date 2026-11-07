import { useState, useMemo } from 'react';
import { Attempt, TaskType } from '../types';
import { AppLanguage, TRANSLATIONS } from '../i18n/translations';
import { computeCategoryFrequencyMap, getMistakeFrequency } from '../utils/storage';
import { ConfirmModal } from './ConfirmModal';
import { LanguageSwitch } from './LanguageSwitch';
import { 
  IconArrowLeft, 
  IconAward, 
  IconClock, 
  IconFileText, 
  IconChevronRight, 
  IconRotateCcw, 
  IconAlertTriangle,
  IconTrash
} from './Icons';

interface HistoryViewProps {
  attempts: Attempt[];
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  onSelectAttempt: (attemptId: string) => void;
  onDeleteAttempt: (attemptId: string) => void;
  onClearAllAttempts: () => void;
  onBackToHome: () => void;
  onResetDummyData: () => void;
}

export function HistoryView({
  attempts,
  language,
  onChangeLanguage,
  onSelectAttempt,
  onDeleteAttempt,
  onClearAllAttempts,
  onBackToHome,
  onResetDummyData,
}: HistoryViewProps) {
  const t = TRANSLATIONS[language];
  const [filter, setFilter] = useState<'all' | TaskType>('all');
  
  // Custom Modal States for 100% reliable deletion (no broken window.confirm)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  const frequencyMap = useMemo(() => computeCategoryFrequencyMap(attempts), [attempts]);

  const mostFrequentError = useMemo(() => {
    let topCat = 'None';
    let maxCount = 0;
    frequencyMap.forEach((count, cat) => {
      if (count > maxCount) {
        maxCount = count;
        topCat = cat;
      }
    });
    return { category: topCat, count: maxCount };
  }, [frequencyMap]);

  const filteredAttempts = useMemo(() => {
    if (filter === 'all') return attempts;
    return attempts.filter((a) => a.taskType === filter);
  }, [attempts, filter]);

  const avgNclc = useMemo(() => {
    if (attempts.length === 0) return 0;
    const sum = attempts.reduce((acc, a) => acc + (a.nclcScore || 0), 0);
    return (sum / attempts.length).toFixed(1);
  }, [attempts]);

  const triggerDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPendingDeleteId(id);
  };

  const handleConfirmSingleDelete = () => {
    if (pendingDeleteId) {
      onDeleteAttempt(pendingDeleteId);
      setPendingDeleteId(null);
    }
  };

  const handleConfirmClearAll = () => {
    onClearAllAttempts();
    setShowClearAllModal(false);
  };

  return (
    <div className="history-container">
      {/* Top Header */}
      <div className="history-header">
        <div className="header-left">
          <button type="button" className="mac-back-button" onClick={onBackToHome}>
            <IconArrowLeft size={16} />
            <span>{t.home}</span>
          </button>
          <h1>{t.historyTitle}</h1>
        </div>

        <div className="header-actions">
          <LanguageSwitch currentLang={language} onChangeLang={onChangeLanguage} />

          {attempts.length > 0 && (
            <button 
              type="button" 
              className="mac-button secondary small danger-text"
              onClick={() => setShowClearAllModal(true)}
              title={t.clearAll}
            >
              <IconTrash size={14} />
              <span>{t.clearAll}</span>
            </button>
          )}

          <button 
            type="button" 
            className="mac-button secondary small"
            onClick={onResetDummyData}
            title={t.reloadDemo}
          >
            <IconRotateCcw size={14} />
            <span>{t.reloadDemo}</span>
          </button>
        </div>
      </div>

      {/* Analytics Bar */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t.testsCompleted}</div>
          <div className="stat-value">{attempts.length}</div>
          <div className="stat-sub">Task 1 & Task 2</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{t.avgScore}</div>
          <div className="stat-value highlight-navy">NCLC {avgNclc}</div>
          <div className="stat-sub">{t.targetHint}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{t.mostFrequentError}</div>
          <div className="stat-value red-text" style={{ fontSize: '1rem', marginTop: '6px' }}>
            {mostFrequentError.category}
          </div>
          <div className="stat-sub">
            <span className="freq-pill red">● {mostFrequentError.count} {t.occurrences}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Legend */}
      <div className="filter-bar">
        <div className="filter-segmented-control">
          <button
            type="button"
            className={`seg-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t.filterAll} ({attempts.length})
          </button>
          <button
            type="button"
            className={`seg-btn ${filter === 'task1' ? 'active' : ''}`}
            onClick={() => setFilter('task1')}
          >
            {t.filterTask1} ({attempts.filter((a) => a.taskType === 'task1').length})
          </button>
          <button
            type="button"
            className={`seg-btn ${filter === 'task2' ? 'active' : ''}`}
            onClick={() => setFilter('task2')}
          >
            {t.filterTask2} ({attempts.filter((a) => a.taskType === 'task2').length})
          </button>
        </div>

        <div className="frequency-legend">
          <span className="legend-title">{t.freqLabel}</span>
          <span className="legend-item red"><span className="dot red" /> {t.freqRed}</span>
          <span className="legend-item yellow"><span className="dot yellow" /> {t.freqYellow}</span>
          <span className="legend-item green"><span className="dot green" /> {t.freqGreen}</span>
        </div>
      </div>

      {/* List of Attempts */}
      <div className="attempts-list">
        {filteredAttempts.length === 0 ? (
          <div className="empty-state">
            <IconAlertTriangle size={36} />
            <p>{t.emptyHistory}</p>
          </div>
        ) : (
          filteredAttempts.map((attempt) => {
            const formattedDate = new Date(attempt.timestamp).toLocaleDateString(
              language === 'fr' ? 'fr-FR' : 'en-US',
              {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }
            );

            let highCount = 0;
            let medCount = 0;
            let lowCount = 0;

            attempt.mistakes.forEach((m) => {
              const freq = getMistakeFrequency(m.category, frequencyMap);
              if (freq === 'high') highCount++;
              else if (freq === 'medium') medCount++;
              else lowCount++;
            });

            return (
              <div
                key={attempt.id}
                className="attempt-row-card"
                onClick={() => onSelectAttempt(attempt.id)}
              >
                <div className="attempt-main-info">
                  <div className="attempt-badge-row">
                    <span className={`task-tag ${attempt.taskType}`}>
                      {attempt.taskType === 'task1' ? 'Task 1 • 25 min' : 'Task 2 • 35 min'}
                    </span>
                    <span className="attempt-date">{formattedDate}</span>
                  </div>

                  <h3 className="attempt-question-title">{attempt.questionTitle}</h3>

                  <p className="attempt-snippet">
                    « {attempt.userResponse.slice(0, 130)}... »
                  </p>

                  <div className="attempt-meta-tags">
                    <span className="meta-tag">
                      <IconFileText size={13} /> {attempt.wordCount} {t.words}
                    </span>
                    <span className="meta-tag">
                      <IconClock size={13} /> {Math.round(attempt.timeSpentSeconds / 60)} min
                    </span>

                    <div className="mistakes-count-pills">
                      {highCount > 0 && <span className="mini-tag red">{highCount} high</span>}
                      {medCount > 0 && <span className="mini-tag yellow">{medCount} moderate</span>}
                      {lowCount > 0 && <span className="mini-tag green">{lowCount} rare</span>}
                    </div>
                  </div>
                </div>

                {/* Score & Reliable Delete Action */}
                <div className="attempt-score-area">
                  <div className={`nclc-pill nclc-${attempt.nclcScore >= 8 ? 'high' : attempt.nclcScore >= 7 ? 'target' : 'low'}`}>
                    <IconAward size={16} />
                    <span className="nclc-score-num">NCLC {attempt.nclcScore}</span>
                  </div>

                  <div className="attempt-card-actions">
                    <span className="view-details-btn">
                      {t.viewAttempt} <IconChevronRight size={14} />
                    </span>
                    <button
                      type="button"
                      className="trash-icon-btn"
                      title={t.deleteAttemptTooltip}
                      onClick={(e) => triggerDeleteItem(e, attempt.id)}
                    >
                      <IconTrash size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modals (Guaranteed to work in Tauri WebKit) */}
      <ConfirmModal
        isOpen={pendingDeleteId !== null}
        title={t.deleteModalTitle}
        message={t.deleteModalDesc}
        confirmLabel={t.confirmDelete}
        cancelLabel={t.cancel}
        isDanger={true}
        onConfirm={handleConfirmSingleDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

      <ConfirmModal
        isOpen={showClearAllModal}
        title={t.clearAllModalTitle}
        message={t.clearAllModalDesc}
        confirmLabel={t.confirmClear}
        cancelLabel={t.cancel}
        isDanger={true}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setShowClearAllModal(false)}
      />
    </div>
  );
}
