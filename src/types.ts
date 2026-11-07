export type TaskType = 'task1' | 'task2';

export interface Question {
  id: string;
  taskType: TaskType;
  title: string;
  source?: string;
  prompt: string;
  timeLimitMinutes: number;
  minWords: number;
  maxWords?: number;
}

export type MistakeFrequency = 'high' | 'medium' | 'low';

export interface Mistake {
  id: string;
  category: string; // e.g. "Accord du participe passé", "Genre des noms", "Subjonctif"
  original: string; // The candidate's text snippet
  correction: string; // The corrected text snippet
  explanation: string; // Why it's an error
  howToAvoid: string; // Actionable rule/tip to avoid it in future
  frequencyTag?: MistakeFrequency;
}

export interface SubScores {
  coherence: number; // e.g. 8
  vocabulary: number; // e.g. 8
  taskCompletion: number; // e.g. 9
  grammar: number; // e.g. 6
}

export type AttemptStatus = 'evaluated' | 'pending-evaluation' | 'evaluation-failed';

export interface Attempt {
  id: string;
  status?: AttemptStatus;
  timestamp: string; // ISO date string
  taskType: TaskType;
  questionId: string;
  questionTitle: string;
  questionPrompt: string;
  userResponse: string;
  wordCount: number;
  timeSpentSeconds: number;
  nclcScore?: number; // 4 to 10
  nclcLevelDescription?: string;
  evaluationSummary?: string;
  correctedResponse?: string;
  mistakes?: Mistake[];
  subScores?: SubScores;
  evaluationError?: string;
}

export type LLMProvider = 'gemini' | 'custom';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl: string; // e.g. "https://generativelanguage.googleapis.com" or local "http://localhost:11434/v1"
  modelName: string; // Primary model name (e.g. gemini-3-flash-preview, gemini-3.1-pro-preview)
  fallbackModelName?: string; // Fallback model when primary experiences high demand/rate limits
  systemPrompt?: string;
  isEnabled: boolean;
}

export type ScreenState = 
  | { type: 'home' }
  | { type: 'select-task' }
  | { type: 'exam'; question: Question }
  | { type: 'history' }
  | { type: 'attempt-detail'; attemptId: string }
  | { type: 'llm-settings' };
