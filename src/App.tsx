import { useState, useEffect } from 'react';
import { Attempt, Question, ScreenState, LLMConfig } from './types';
import { AppLanguage } from './i18n/translations';
import { 
  loadAttempts, 
  addAttempt, 
  updateAttempt,
  deleteAttempt, 
  clearAllAttempts, 
  loadLLMConfig,
  saveLLMConfig,
  loadLanguage,
  saveLanguage,
  DEFAULT_LLM_CONFIG
} from './utils/storage';
import { evaluateEssayWithLLM } from './utils/llmService';
import { OFFICIAL_QUESTIONS } from './data/officialQuestions';
import { HomeView } from './components/HomeView';
import { TaskSelectView } from './components/TaskSelectView';
import { ExamView } from './components/ExamView';
import { HistoryView } from './components/HistoryView';
import { AttemptDetailView } from './components/AttemptDetailView';
import { LLMSettingsModal } from './components/LLMSettingsModal';
import { IconRotateCcw } from './components/Icons';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>({ type: 'home' });
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [llmConfig, setLLMConfig] = useState<LLMConfig>(DEFAULT_LLM_CONFIG);
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isEvaluatingQueue, setIsEvaluatingQueue] = useState<boolean>(false);
  const [queueToast, setQueueToast] = useState<string | null>(null);

  useEffect(() => {
    setAttempts(loadAttempts());
    setLLMConfig(loadLLMConfig());
    setLanguage(loadLanguage());

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleChangeLanguage = (newLang: AppLanguage) => {
    setLanguage(newLang);
    saveLanguage(newLang);
  };

  const handleStartExam = (question: Question) => {
    setScreen({ type: 'exam', question });
  };

  const handleFinishExam = (newAttempt: Attempt) => {
    const updated = addAttempt(newAttempt);
    setAttempts(updated);
    setScreen({ type: 'attempt-detail', attemptId: newAttempt.id });
  };

  const handleDeleteAttempt = (attemptId: string) => {
    const updated = deleteAttempt(attemptId);
    setAttempts(updated);
    if (screen.type === 'attempt-detail') {
      setScreen({ type: 'history' });
    }
  };

  const handleClearAllAttempts = () => {
    const updated = clearAllAttempts();
    setAttempts(updated);
  };

  const handleSaveLLMConfig = (updated: LLMConfig) => {
    setLLMConfig(updated);
    saveLLMConfig(updated);
  };

  const pendingAttempts = attempts.filter(
    (a) => a.status === 'pending-evaluation' || a.status === 'evaluation-failed'
  );

  const handleEvaluateAttempt = async (attemptId: string) => {
    const target = attempts.find((a) => a.id === attemptId);
    if (!target) return;

    setIsEvaluatingQueue(true);
    setQueueToast(language === 'fr' ? 'Évaluation en cours...' : 'Evaluating essay with LLM...');

    try {
      const question = OFFICIAL_QUESTIONS.find((q) => q.id === target.questionId) || {
        id: target.questionId,
        taskType: target.taskType,
        title: target.questionTitle,
        prompt: target.questionPrompt,
        timeLimitMinutes: target.taskType === 'task1' ? 25 : 35,
        minWords: target.taskType === 'task1' ? 80 : 200,
      };

      const evaluated = await evaluateEssayWithLLM(
        llmConfig,
        question,
        target.userResponse,
        target.timeSpentSeconds,
        target.wordCount
      );

      const merged: Attempt = {
        ...evaluated,
        id: target.id,
        timestamp: target.timestamp,
        status: 'evaluated',
      };

      const updatedList = updateAttempt(merged);
      setAttempts(updatedList);
      setQueueToast(language === 'fr' ? '✅ Évaluation réussie !' : '✅ Evaluation completed!');
      setTimeout(() => setQueueToast(null), 3000);
    } catch (err: any) {
      console.error('Failed to evaluate attempt:', err);
      const updatedTarget: Attempt = {
        ...target,
        status: 'evaluation-failed',
        evaluationError: err?.message || 'Connection failed',
      };
      const updatedList = updateAttempt(updatedTarget);
      setAttempts(updatedList);
      setQueueToast(`⚠️ ${err?.message || 'Evaluation failed'}`);
      setTimeout(() => setQueueToast(null), 4000);
    } finally {
      setIsEvaluatingQueue(false);
    }
  };

  const handleEvaluateAllPending = async () => {
    if (pendingAttempts.length === 0 || isEvaluatingQueue) return;
    setIsEvaluatingQueue(true);
    setQueueToast(language === 'fr' ? 'Traitement de la file d’attente...' : 'Processing evaluation queue...');

    let successCount = 0;
    for (const item of pendingAttempts) {
      try {
        const question = OFFICIAL_QUESTIONS.find((q) => q.id === item.questionId) || {
          id: item.questionId,
          taskType: item.taskType,
          title: item.questionTitle,
          prompt: item.questionPrompt,
          timeLimitMinutes: item.taskType === 'task1' ? 25 : 35,
          minWords: item.taskType === 'task1' ? 80 : 200,
        };

        const evaluated = await evaluateEssayWithLLM(
          llmConfig,
          question,
          item.userResponse,
          item.timeSpentSeconds,
          item.wordCount
        );

        const merged: Attempt = {
          ...evaluated,
          id: item.id,
          timestamp: item.timestamp,
          status: 'evaluated',
        };

        updateAttempt(merged);
        successCount++;
      } catch (err: any) {
        console.error(`Failed to evaluate item ${item.id}:`, err);
        updateAttempt({
          ...item,
          status: 'evaluation-failed',
          evaluationError: err?.message || 'Connection failed',
        });
      }
    }

    setAttempts(loadAttempts());
    setIsEvaluatingQueue(false);
    setQueueToast(
      language === 'fr'
        ? `✅ ${successCount} copie(s) évaluée(s) avec succès !`
        : `✅ ${successCount} queued test(s) evaluated successfully!`
    );
    setTimeout(() => setQueueToast(null), 3500);
  };

  const currentDetailAttempt = screen.type === 'attempt-detail'
    ? attempts.find((a) => a.id === screen.attemptId) || attempts[0]
    : null;

  return (
    <div className="app-root">
      {/* Top Global Queue & Offline Retry Banner (outside exam) */}
      {screen.type !== 'exam' && (pendingAttempts.length > 0 || !isOnline || queueToast) && (
        <div className="global-queue-header-bar">
          <div className="queue-bar-left">
            {!isOnline && (
              <span className="network-pill offline">
                <span className="dot yellow" />
                <span>{language === 'fr' ? '⚡ Mode Hors Ligne' : '⚡ Offline Mode'}</span>
              </span>
            )}
            {pendingAttempts.length > 0 && (
              <span className="queue-count-pill" onClick={() => setScreen({ type: 'history' })}>
                <span className="hourglass-icon">⏳</span>
                <strong>
                  {pendingAttempts.length}{' '}
                  {language === 'fr' ? 'en attente d’évaluation' : 'to be reviewed'}
                </strong>
              </span>
            )}
          </div>

          <div className="queue-bar-right">
            {pendingAttempts.length > 0 && (
              <button
                type="button"
                className="mac-button primary small queue-retry-btn"
                onClick={handleEvaluateAllPending}
                disabled={isEvaluatingQueue}
              >
                <IconRotateCcw size={13} className={isEvaluatingQueue ? 'spin' : ''} />
                <span>
                  {isEvaluatingQueue
                    ? (language === 'fr' ? 'Évaluation...' : 'Evaluating...')
                    : (language === 'fr' ? `Tout réévaluer (${pendingAttempts.length})` : `Retry All (${pendingAttempts.length})`)}
                </span>
              </button>
            )}

            {queueToast && (
              <span className="queue-toast-notice">{queueToast}</span>
            )}
          </div>
        </div>
      )}

      {screen.type === 'home' && (
        <HomeView
          attempts={attempts}
          llmConfig={llmConfig}
          language={language}
          onChangeLanguage={handleChangeLanguage}
          onTakeTest={() => setScreen({ type: 'select-task' })}
          onReviewAttempts={() => setScreen({ type: 'history' })}
          onOpenLLMSettings={() => setScreen({ type: 'llm-settings' })}
        />
      )}

      {screen.type === 'select-task' && (
        <TaskSelectView
          language={language}
          attempts={attempts}
          llmConfig={llmConfig}
          onStartExam={handleStartExam}
          onOpenLLMSettings={() => setScreen({ type: 'llm-settings' })}
          onBack={() => setScreen({ type: 'home' })}
        />
      )}

      {screen.type === 'exam' && (
        <ExamView
          question={screen.question}
          llmConfig={llmConfig}
          language={language}
          onFinishExam={handleFinishExam}
          onOpenLLMSettings={() => setScreen({ type: 'llm-settings' })}
          onCancel={() => setScreen({ type: 'home' })}
        />
      )}

      {screen.type === 'history' && (
        <HistoryView
          attempts={attempts}
          language={language}
          onChangeLanguage={handleChangeLanguage}
          onSelectAttempt={(attemptId) => setScreen({ type: 'attempt-detail', attemptId })}
          onDeleteAttempt={handleDeleteAttempt}
          onClearAllAttempts={handleClearAllAttempts}
          onBackToHome={() => setScreen({ type: 'home' })}
          onEvaluateAttempt={handleEvaluateAttempt}
        />
      )}

      {screen.type === 'attempt-detail' && currentDetailAttempt && (
        <AttemptDetailView
          attempt={currentDetailAttempt}
          allAttempts={attempts}
          language={language}
          onChangeLanguage={handleChangeLanguage}
          onBack={() => setScreen({ type: 'history' })}
          onDelete={(id) => {
            handleDeleteAttempt(id);
            setScreen({ type: 'history' });
          }}
          onOpenLLMSettings={() => setScreen({ type: 'llm-settings' })}
          onPracticeAgain={(q) => setScreen({ type: 'exam', question: q })}
          onSelectAttempt={(attemptId) => setScreen({ type: 'attempt-detail', attemptId })}
          onReevaluate={async (att) => await handleEvaluateAttempt(att.id)}
        />
      )}

      {screen.type === 'llm-settings' && (
        <LLMSettingsModal
          config={llmConfig}
          language={language}
          onChangeLanguage={handleChangeLanguage}
          onSaveConfig={handleSaveLLMConfig}
          onClose={() => setScreen({ type: 'home' })}
        />
      )}
    </div>
  );
}
