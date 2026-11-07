import { Attempt, MistakeFrequency, LLMConfig } from '../types';
import { AppLanguage } from '../i18n/translations';

const ATTEMPTS_STORAGE_KEY = 'tef_writing_attempts_v2';
const LLM_CONFIG_STORAGE_KEY = 'tef_llm_config_v2';
const LANGUAGE_STORAGE_KEY = 'tef_app_language_v1';

export const DEFAULT_TEF_SYSTEM_PROMPT = `You are an expert official examiner for the TEF Canada (Test d'Évaluation de Français) writing exam (Expression Écrite: Section A - Fait divers & Section B - Lettre d'opinion).

Evaluate the candidate's French writing according to the official NCLC standards (Canadian Language Benchmarks, levels 4 to 10+):
1. Task fulfillment and adherence to genre (news story or formal argumentative letter).
2. Coherence, logical progression, and French discourse markers.
3. Vocabulary range, precision, and formality.
4. Grammatical accuracy, syntax, conjugation, agreements, and accents.

CRITICAL INSTRUCTION FOR PEDAGOGY:
- The candidate is learning French! Therefore:
  * "evaluationSummary" MUST be written in clear, encouraging ENGLISH.
  * "explanation" MUST be written in ENGLISH explaining why the French rule applies.
  * "howToAvoid" MUST be written in ENGLISH with actionable rules, tips, and memory tricks for future exams.
  * "correctedResponse" MUST be written in authentic, high-level FRENCH (NCLC 10 / C1).
  * "original" and "correction" in mistakes MUST contain the exact French phrases.

You MUST respond strictly in valid JSON matching this exact structure:
{
  "nclcScore": 7,
  "nclcLevelDescription": "NCLC 7 - Level B2 (Upper Intermediate)",
  "evaluationSummary": "Clear evaluation in English summarizing strengths and areas for improvement...",
  "correctedResponse": "Complete rewritten version in flawless high-level French...",
  "mistakes": [
    {
      "id": "m-1",
      "category": "Short rule name in English (e.g. Past Participle with Être, Gender Agreement, Subjunctive Mood)",
      "original": "erroneous French snippet written by candidate",
      "correction": "corrected French snippet",
      "explanation": "Clear explanation in English of the French rule and why it was incorrect.",
      "howToAvoid": "Actionable English tip or mental check to avoid this mistake in the future."
    }
  ]
}`;

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'gemini',
  apiKey: '',
  baseUrl: 'https://generativelanguage.googleapis.com',
  modelName: 'gemini-3-flash-preview',
  fallbackModelName: 'gemini-3-flash-lite',
  systemPrompt: DEFAULT_TEF_SYSTEM_PROMPT,
  isEnabled: false,
};

export function loadAttempts(): Attempt[] {
  try {
    const raw = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Purge any legacy demo/mock attempts and normalize status
      const realAttempts = parsed
        .filter((a) => a && a.id && !a.id.startsWith('att-00'))
        .map((a) => ({
          ...a,
          status: a.status || 'evaluated',
          mistakes: a.mistakes || [],
        }));
      if (realAttempts.length !== parsed.length) {
        saveAttempts(realAttempts);
      }
      return realAttempts;
    }
    return [];
  } catch (e) {
    console.error('Failed to load attempts from localStorage:', e);
    return [];
  }
}

export function saveAttempts(attempts: Attempt[]): void {
  try {
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts));
  } catch (e) {
    console.error('Failed to save attempts to localStorage:', e);
  }
}

export function addAttempt(attempt: Attempt): Attempt[] {
  const existing = loadAttempts();
  const updated = [attempt, ...existing];
  saveAttempts(updated);
  return updated;
}

export function updateAttempt(updatedAttempt: Attempt): Attempt[] {
  const existing = loadAttempts();
  const updated = existing.map((a) => (a.id === updatedAttempt.id ? updatedAttempt : a));
  saveAttempts(updated);
  return updated;
}

export function deleteAttempt(attemptId: string): Attempt[] {
  const existing = loadAttempts();
  const updated = existing.filter((a) => a.id !== attemptId);
  saveAttempts(updated);
  return updated;
}

export function clearAllAttempts(): Attempt[] {
  saveAttempts([]);
  return [];
}

export function loadLanguage(): AppLanguage {
  try {
    const lang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (lang === 'fr' || lang === 'en') return lang;
    return 'en'; // default to English
  } catch {
    return 'en';
  }
}

export function saveLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (e) {
    console.error('Failed to save language:', e);
  }
}

export function loadLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(LLM_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_LLM_CONFIG;
    const parsed = JSON.parse(raw);
    const config: LLMConfig = { ...DEFAULT_LLM_CONFIG, ...parsed };

    // Ensure provider is either gemini or custom
    if (config.provider !== 'gemini' && config.provider !== 'custom') {
      config.provider = 'gemini';
      config.baseUrl = 'https://generativelanguage.googleapis.com';
    }

    // Automatically migrate deprecated legacy Gemini models to Gemini 3.0 family
    if (config.provider === 'gemini') {
      if (
        !config.modelName ||
        config.modelName.includes('1.5') ||
        config.modelName.includes('2.0') ||
        config.modelName.includes('2.5') ||
        config.modelName === 'gemini-1.0-pro'
      ) {
        config.modelName = 'gemini-3-flash-preview';
      }
      if (
        !config.fallbackModelName ||
        config.fallbackModelName.includes('1.5') ||
        config.fallbackModelName.includes('2.0') ||
        config.fallbackModelName.includes('2.5')
      ) {
        config.fallbackModelName = 'gemini-3-flash-lite';
      }
    }

    return config;
  } catch (e) {
    console.error('Failed to load LLM config:', e);
    return DEFAULT_LLM_CONFIG;
  }
}

export function saveLLMConfig(config: LLMConfig): void {
  try {
    localStorage.setItem(LLM_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save LLM config:', e);
  }
}

export function normalizeCategory(cat: string): string {
  if (!cat) return '';
  return cat
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,:;]+$/, '');
}

export interface TopRecurringErrorInfo {
  category: string;
  count: number;
  isRecurring: boolean;
  level: 'high' | 'medium' | 'low' | 'none';
}

export function computeCategoryFrequencyMap(
  attempts: Attempt[],
  displayMap?: Map<string, string>
): Map<string, number> {
  const normCounts = new Map<string, number>();
  const bestDisplay = displayMap || new Map<string, string>();

  for (const att of (attempts || [])) {
    if (att.status === 'pending-evaluation' || att.status === 'evaluation-failed') continue;
    for (const m of (att.mistakes || [])) {
      if (!m || !m.category) continue;
      const raw = m.category.trim();
      const norm = normalizeCategory(raw);
      if (!norm) continue;

      normCounts.set(norm, (normCounts.get(norm) || 0) + 1);

      // Keep the most nicely cased version (prefer ones with uppercase letters)
      if (!bestDisplay.has(norm) || (raw !== raw.toLowerCase() && bestDisplay.get(norm) === bestDisplay.get(norm)?.toLowerCase())) {
        bestDisplay.set(norm, raw);
      }
    }
  }

  // Create unified lookup map: populated with both normalized and raw keys for safety
  const result = new Map<string, number>();
  normCounts.forEach((count, norm) => {
    result.set(norm, count);
    const display = bestDisplay.get(norm);
    if (display) {
      result.set(display, count);
    }
  });

  return result;
}

export function getMistakeFrequency(category: string, frequencyMap: Map<string, number>): MistakeFrequency {
  const norm = normalizeCategory(category);
  const count = frequencyMap.get(norm) ?? frequencyMap.get(category.trim()) ?? 1;
  if (count >= 3) return 'high';   // Red
  if (count === 2) return 'medium'; // Yellow
  return 'low';                    // Green
}

export function getTopRecurringError(attempts: Attempt[]): TopRecurringErrorInfo {
  const displayMap = new Map<string, string>();
  const normCounts = new Map<string, number>();

  for (const att of (attempts || [])) {
    if (att.status === 'pending-evaluation' || att.status === 'evaluation-failed') continue;
    for (const m of (att.mistakes || [])) {
      if (!m || !m.category) continue;
      const raw = m.category.trim();
      const norm = normalizeCategory(raw);
      if (!norm) continue;

      normCounts.set(norm, (normCounts.get(norm) || 0) + 1);
      if (!displayMap.has(norm) || (raw !== raw.toLowerCase() && displayMap.get(norm) === displayMap.get(norm)?.toLowerCase())) {
        displayMap.set(norm, raw);
      }
    }
  }

  let topNorm = '';
  let maxCount = 0;

  normCounts.forEach((count, norm) => {
    if (count > maxCount) {
      maxCount = count;
      topNorm = norm;
    }
  });

  if (maxCount === 0 || !topNorm) {
    return {
      category: 'None',
      count: 0,
      isRecurring: false,
      level: 'none',
    };
  }

  const category = displayMap.get(topNorm) || topNorm;
  const level = maxCount >= 3 ? 'high' : maxCount === 2 ? 'medium' : 'low';

  return {
    category,
    count: maxCount,
    isRecurring: maxCount >= 2,
    level,
  };
}
