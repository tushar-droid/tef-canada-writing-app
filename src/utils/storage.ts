import { Attempt, MistakeFrequency, LLMConfig } from '../types';
import { AppLanguage } from '../i18n/translations';

const ATTEMPTS_STORAGE_KEY = 'tef_writing_attempts_v2';
const LLM_CONFIG_STORAGE_KEY = 'tef_llm_config_v2';
const LANGUAGE_STORAGE_KEY = 'tef_app_language_v1';

export const DEFAULT_TEF_SYSTEM_PROMPT = `You are a strict, ultra-meticulous official examiner and senior linguistic auditor for the TEF Canada (Test d'Évaluation de Français) writing exam (Expression Écrite: Section A - Fait divers & Section B - Lettre d'opinion).

CRITICAL DIRECTIVE — EXHAUSTIVE LINGUISTIC AUDIT:
Your primary mission is to perform an EXHAUSTIVE, line-by-line, word-by-word proofreading audit of the candidate's French submission.
DO NOT MISS A SINGLE MISTAKE. No error is too small. Even a single missing accent, wrong contraction, or improper verb choice impacts the candidate's NCLC score for Canadian immigration.

YOU MUST SYSTEMATICALLY AUDIT AND REPORT ALL ERRORS IN "mistakes", INCLUDING:
1. VERB CONJUGATION & TENSES (Conjugaison & Temps):
   - Incorrect verb endings for all tenses (présent, imparfait, passé composé, futur, conditionnel, subjonctif).
   - Wrong auxiliary selection (avoir vs être).
   - Incorrect past participle forms (e.g. "il a prendu" -> "il a pris").
   - Failure to trigger the subjunctive mood when required (e.g. after "bien que", "il faut que", "pour que", "afin que", "avant que", "bien qu'il soit" vs "bien qu'il est").
   - Inappropriate tense shifts or sequence of tenses.

2. VERB CHOICE & LEXICAL PRECISION (Choix du verbe & Lexique):
   - Incorrect verb used for the context (e.g. "visiter mes amis" -> "rendre visite à mes amis", "faire une décision" -> "prendre une décision", "faire du sens" -> "avoir du sens", "écouter" vs "entendre", "voir" vs "regarder").
   - Anglicisms, literal translations from English, and false friends (faux-amis).
   - Register mismatch (slang/informal words in formal Task 2 opinion letters).

3. SPELLING & ORTHOGRAPHY (Orthographe d'usage):
   - Misspelled French words, phonetic spelling errors, missing or extra double letters (e.g. "acceuil" -> "accueil", "developpment" -> "développement", "professionel" -> "professionnel").
   - Confused homophones: "a" vs "à", "ou" vs "où", "ce" vs "se", "ces" vs "ses" vs "c'est" vs "s'est", "la" vs "là", "leur" vs "leurs", "son" vs "sont".

4. ACCENTS & DIACRITICS (Accents & Signes diacritiques):
   - EVERY missing, misplaced, or wrong accent: aigu (é), grave (à, è, ù), circonflexe (â, ê, î, ô, û), tréma (ë, ï, ü), and cédille (ç).
   - (e.g. "cote" -> "côté", "meme" -> "même", "tres" -> "très", "deja" -> "déjà", "francais" -> "français", "ca" -> "ça", "evenement" -> "événement", "hopital" -> "hôpital", "a" instead of preposition "à").

5. CONTRACTIONS & ELISIONS (Élisions & Articles contractés):
   - Missing apostrophe elisions: "le arbre" -> "l'arbre", "de accord" -> "d'accord", "je aime" -> "j'aime", "que il" -> "qu'il", "ce est" -> "c'est", "ne est" -> "n'est".
   - Forbidden elisions: "si elle" (never elide to "s'elle"), but "si il" -> "s'il".
   - Contracted articles: "de le" -> "du", "de les" -> "des", "à le" -> "au", "à les" -> "aux".

6. AGREEMENTS (Accords en genre et en nombre):
   - Noun-adjective gender and number agreements (masculine, feminine, singular, plural).
   - Subject-verb agreements, especially with collective subjects, inverted subjects, or relative pronouns ("qui").
   - Past participle agreement with "être" (always agrees with subject) and with "avoir" (agrees with preceding direct object).

7. PREPOSITIONS (Prépositions):
   - Incorrect prepositions with verbs (e.g. "participer dans" -> "participer à", "commencer de" -> "commencer à", "aider de" -> "aider à", "continuer de/à").
   - Geographical prepositions: "en France", "au Canada", "aux États-Unis", "à Paris", "dans le monde".
   - Prepositional phrases: "grâce à" vs "à cause de", "en train de", "par rapport à".

8. SYNTAX, PRONOUNS & STRUCTURE (Syntaxe & Pronoms):
   - Pronoun placement and order (lui, leur, le, la, les, y, en).
   - Negation syntax (omission of "ne", placement with compound tenses: "je n'ai pas vu", "ne... jamais", "ne... rien").
   - Sentence fragments, comma splices, run-on sentences, word order.

CRITICAL INSTRUCTIONS FOR PEDAGOGY:
- In "mistakes":
  * Do NOT limit the array to 3 or 4 mistakes. Include ALL errors found in the text. If there are 12 errors, list all 12. If there are 20 errors, list all 20.
  * "original": Exact French snippet written by candidate (1 to 6 words).
  * "correction": Exact corrected French snippet.
  * "category": Specific rule category (e.g. "Verb Conjugation", "Verb Choice", "Orthography & Spelling", "Missing Accent", "Contraction & Elision", "Gender Agreement", "Plural Agreement", "Past Participle with Être", "Preposition", "Subjunctive Mood").
  * "explanation": Clear, concise explanation in ENGLISH of why it is an error and the rule that applies.
  * "howToAvoid": Actionable ENGLISH tip, mnemonic, or proofreading check for future exams.
- "evaluationSummary" MUST be written in clear, encouraging ENGLISH summarizing strengths, total error count, and top priority areas for improvement.
- "correctedResponse" MUST be written in authentic, high-level FRENCH (NCLC 10 / C1 reference model).

You MUST respond strictly in valid JSON matching this exact structure:
{
  "nclcScore": 7,
  "nclcLevelDescription": "NCLC 7 - Level B2 (Upper Intermediate)",
  "evaluationSummary": "Clear evaluation in English summarizing strengths, error breakdown, and areas for improvement...",
  "correctedResponse": "Complete rewritten version in flawless high-level French...",
  "subScores": {
    "coherence": 7,
    "vocabulary": 7,
    "taskCompletion": 8,
    "grammar": 6
  },
  "mistakes": [
    {
      "id": "m-1",
      "category": "Specific category in English",
      "original": "erroneous French snippet written by candidate",
      "correction": "corrected French snippet",
      "explanation": "Clear explanation in English of the French rule and why it was incorrect.",
      "howToAvoid": "Actionable English tip or mental check to avoid this mistake in the future."
    }
  ]
};`

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

    // Automatically upgrade legacy system prompt to the comprehensive audit prompt
    if (!config.systemPrompt || !config.systemPrompt.includes('EXHAUSTIVE LINGUISTIC AUDIT')) {
      config.systemPrompt = DEFAULT_TEF_SYSTEM_PROMPT;
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
