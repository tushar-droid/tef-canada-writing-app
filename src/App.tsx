import { useState, useEffect } from 'react';
import { Attempt, Question, ScreenState, LLMConfig } from './types';
import { AppLanguage } from './i18n/translations';
import { 
  loadAttempts, 
  addAttempt, 
  deleteAttempt, 
  clearAllAttempts, 
  resetToDummyAttempts,
  loadLLMConfig,
  saveLLMConfig,
  loadLanguage,
  saveLanguage,
  DEFAULT_LLM_CONFIG
} from './utils/storage';
import { HomeView } from './components/HomeView';
import { TaskSelectView } from './components/TaskSelectView';
import { ExamView } from './components/ExamView';
import { HistoryView } from './components/HistoryView';
import { AttemptDetailView } from './components/AttemptDetailView';
import { LLMSettingsModal } from './components/LLMSettingsModal';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>({ type: 'home' });
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [llmConfig, setLLMConfig] = useState<LLMConfig>(DEFAULT_LLM_CONFIG);
  const [language, setLanguage] = useState<AppLanguage>('en');

  useEffect(() => {
    setAttempts(loadAttempts());
    setLLMConfig(loadLLMConfig());
    setLanguage(loadLanguage());
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

  const handleResetDummyData = () => {
    const reset = resetToDummyAttempts();
    setAttempts(reset);
  };

  const handleSaveLLMConfig = (updated: LLMConfig) => {
    setLLMConfig(updated);
    saveLLMConfig(updated);
  };

  const currentDetailAttempt = screen.type === 'attempt-detail'
    ? attempts.find((a) => a.id === screen.attemptId) || attempts[0]
    : null;

  return (
    <div className="app-root">
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
          onStartExam={handleStartExam}
          onBack={() => setScreen({ type: 'home' })}
        />
      )}

      {screen.type === 'exam' && (
        <ExamView
          question={screen.question}
          llmConfig={llmConfig}
          language={language}
          onFinishExam={handleFinishExam}
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
          onResetDummyData={handleResetDummyData}
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
