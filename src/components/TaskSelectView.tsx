import { TaskType, Question, Attempt, LLMConfig } from '../types';
import { OFFICIAL_QUESTIONS } from '../data/officialQuestions';
import { AppLanguage, TRANSLATIONS } from '../i18n/translations';
import { IconArrowLeft, IconClock, IconFileText, IconPlay, IconCheckCircle } from './Icons';

interface TaskSelectViewProps {
  language: AppLanguage;
  attempts: Attempt[];
  llmConfig: LLMConfig;
  onStartExam: (question: Question) => void;
  onOpenLLMSettings: () => void;
  onBack: () => void;
}

export function TaskSelectView({ language, attempts, llmConfig: _llmConfig, onStartExam, onOpenLLMSettings: _onOpenLLMSettings, onBack }: TaskSelectViewProps) {
  const t = TRANSLATIONS[language];

  const allTask1 = OFFICIAL_QUESTIONS.filter((q) => q.taskType === 'task1');
  const allTask2 = OFFICIAL_QUESTIONS.filter((q) => q.taskType === 'task2');

  const completedTask1Ids = new Set(
    attempts.filter((a) => a.taskType === 'task1').map((a) => a.questionId)
  );
  const completedTask2Ids = new Set(
    attempts.filter((a) => a.taskType === 'task2').map((a) => a.questionId)
  );

  const remainingTask1 = allTask1.filter((q) => !completedTask1Ids.has(q.id));
  const remainingTask2 = allTask2.filter((q) => !completedTask2Ids.has(q.id));

  const handleSelectTask = (taskType: TaskType) => {
    const pool = taskType === 'task1' ? allTask1 : allTask2;
    const remaining = taskType === 'task1' ? remainingTask1 : remainingTask2;

    // Pick from remaining unattempted questions; if all completed, cycle back to full pool
    const candidates = remaining.length > 0 ? remaining : pool;
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const selectedQuestion = candidates[randomIndex];
    onStartExam(selectedQuestion);
  };

  return (
    <div className="task-select-container">
      <div className="task-select-header">
        <button type="button" className="mac-back-button" onClick={onBack}>
          <IconArrowLeft size={16} />
          <span>{t.home}</span>
        </button>
        <h1>{t.taskSelectTitle}</h1>
        <p className="subtitle">{t.taskSelectSubtitle}</p>
      </div>

      <div className="tasks-choice-grid">
        {/* TASK 1 */}
        <div 
          className="task-option-card"
          onClick={() => handleSelectTask('task1')}
        >
          <div className="task-card-pill task1">{t.task1Pill}</div>
          <div className="task-card-icon">📰</div>
          <h2>{t.task1Title}</h2>
          <p className="task-desc">{t.task1Desc}</p>

          <div className="task-progress-indicator">
            <IconCheckCircle size={14} className={remainingTask1.length === 0 ? 'text-teal' : 'text-muted'} />
            <span>
              {language === 'fr'
                ? remainingTask1.length > 0
                  ? `${completedTask1Ids.size} / ${allTask1.length} complétés (${remainingTask1.length} inédits)`
                  : `Toutes les ${allTask1.length} questions complétées ! (Nouveau cycle)`
                : remainingTask1.length > 0
                  ? `${completedTask1Ids.size} / ${allTask1.length} completed (${remainingTask1.length} unattempted)`
                  : `All ${allTask1.length} questions completed! (Cycling pool)`
              }
            </span>
          </div>

          <div className="task-meta-list">
            <div className="meta-row">
              <IconClock size={16} />
              <span><strong>{t.task1Time}</strong></span>
            </div>
            <div className="meta-row">
              <IconFileText size={16} />
              <span><strong>{t.task1Words}</strong></span>
            </div>
          </div>
          <button type="button" className="mac-button primary full-width">
            <IconPlay size={15} />
            <span>{t.task1Start}</span>
          </button>
        </div>

        {/* TASK 2 */}
        <div 
          className="task-option-card"
          onClick={() => handleSelectTask('task2')}
        >
          <div className="task-card-pill task2">{t.task2Pill}</div>
          <div className="task-card-icon">✍️</div>
          <h2>{t.task2Title}</h2>
          <p className="task-desc">{t.task2Desc}</p>

          <div className="task-progress-indicator">
            <IconCheckCircle size={14} className={remainingTask2.length === 0 ? 'text-teal' : 'text-muted'} />
            <span>
              {language === 'fr'
                ? remainingTask2.length > 0
                  ? `${completedTask2Ids.size} / ${allTask2.length} complétés (${remainingTask2.length} inédits)`
                  : `Toutes les ${allTask2.length} questions complétées ! (Nouveau cycle)`
                : remainingTask2.length > 0
                  ? `${completedTask2Ids.size} / ${allTask2.length} completed (${remainingTask2.length} unattempted)`
                  : `All ${allTask2.length} questions completed! (Cycling pool)`
              }
            </span>
          </div>

          <div className="task-meta-list">
            <div className="meta-row">
              <IconClock size={16} />
              <span><strong>{t.task2Time}</strong></span>
            </div>
            <div className="meta-row">
              <IconFileText size={16} />
              <span><strong>{t.task2Words}</strong></span>
            </div>
          </div>
          <button type="button" className="mac-button primary full-width">
            <IconPlay size={15} />
            <span>{t.task2Start}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
