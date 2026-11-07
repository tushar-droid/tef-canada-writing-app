import { TaskType, Question } from '../types';
import { DUMMY_QUESTIONS } from '../data/dummyQuestions';
import { AppLanguage, TRANSLATIONS } from '../i18n/translations';
import { IconArrowLeft, IconClock, IconFileText, IconPlay } from './Icons';

interface TaskSelectViewProps {
  language: AppLanguage;
  onStartExam: (question: Question) => void;
  onBack: () => void;
}

export function TaskSelectView({ language, onStartExam, onBack }: TaskSelectViewProps) {
  const t = TRANSLATIONS[language];

  const handleSelectTask = (taskType: TaskType) => {
    const questions = DUMMY_QUESTIONS.filter((q) => q.taskType === taskType);
    const randomIndex = Math.floor(Math.random() * questions.length);
    const selectedQuestion = questions[randomIndex];
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
