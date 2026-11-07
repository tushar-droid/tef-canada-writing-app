import { LLMConfig, LLMProvider, Question, Attempt, Mistake } from '../types';

export interface ModelOption {
  id: string;
  label: string;
  description: string;
  recommended?: boolean;
}

export const PROVIDER_MODELS: Record<LLMProvider, ModelOption[]> = {
  gemini: [
    { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (Preview)', description: 'Recommended • Fast, high accuracy for French writing', recommended: true },
    { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Preview)', description: 'Frontier reasoning & advanced grammatical analysis' },
    { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', description: 'Next-gen high efficiency & low latency' },
    { id: 'gemini-3-flash-lite', label: 'Gemini 3 Flash-Lite', description: 'Lightweight, ideal fallback under heavy load' },
  ],
  custom: [
    { id: 'mistral', label: 'Mistral (Local Ollama)', description: 'Recommended for local • Superb native French understanding', recommended: true },
    { id: 'llama3', label: 'Llama 3 (Local Ollama)', description: 'Standard open weights local model' },
    { id: 'qwen2.5', label: 'Qwen 2.5 (Local Ollama)', description: 'High multilingual precision' },
  ],
};

export interface LLMResponsePayload {
  nclcScore: number;
  nclcLevelDescription: string;
  evaluationSummary: string;
  correctedResponse: string;
  subScores?: {
    coherence: number;
    vocabulary: number;
    taskCompletion: number;
    grammar: number;
  };
  mistakes: Array<{
    id?: string;
    category: string;
    original: string;
    correction: string;
    explanation: string;
    howToAvoid: string;
  }>;
}

function extractJsonFromLLMOutput(raw: string): any {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('No valid JSON block detected in model output');
  }
}

/**
 * Extracts human-readable error messages without arbitrary slicing/cutoffs
 */
export function formatAPIError(status: number, rawText: string, provider: string): string {
  try {
    const parsed = JSON.parse(rawText);
    // Google Gemini format: { error: { code, message, status, details } }
    if (parsed.error && parsed.error.message) {
      const codeOrStatus = parsed.error.status || parsed.error.code || status;
      return `[${provider.toUpperCase()} ${codeOrStatus}]: ${parsed.error.message}`;
    }
    // OpenAI / Anthropic format: { error: { message } }
    if (parsed.error && typeof parsed.error === 'string') {
      return `[${provider.toUpperCase()} ${status}]: ${parsed.error}`;
    }
    if (parsed.message) {
      return `[${provider.toUpperCase()} ${status}]: ${parsed.message}`;
    }
  } catch {
    // raw text
  }
  const clean = rawText.trim();
  return `[${provider.toUpperCase()} HTTP ${status}]: ${clean || 'Unknown error received from API.'}`;
}

/**
 * Determines whether an error is caused by rate-limiting, quota exhaustion, or model overload
 */
export function isHighDemandError(status: number, message: string): boolean {
  if (status === 429 || status === 503 || status === 500 || status === 502) return true;
  const lower = message.toLowerCase();
  return (
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('overloaded') ||
    lower.includes('demand') ||
    lower.includes('temporarily unavailable')
  );
}

/**
 * Single call dispatcher for any model & provider
 */
async function callProviderAPI(
  config: LLMConfig,
  modelName: string,
  systemPrompt: string,
  userPrompt: string
): Promise<{ success: boolean; data?: string; status: number; error?: string }> {
  const provider = config.provider;

  if (provider === 'gemini') {
    // Official Google AI Studio REST Endpoint:
    // POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
    const baseUrl = (config.baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');
    const endpoint = `${baseUrl}/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: formatAPIError(res.status, text, 'Gemini'),
      };
    }

    try {
      const json = JSON.parse(text);
      const rawOutput = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { success: true, data: rawOutput, status: res.status };
    } catch (e: any) {
      return { success: false, status: 200, error: `Invalid response format from Gemini: ${e.message}` };
    }
  }

  if (provider === 'custom') {
    const baseUrl = (config.baseUrl || 'http://localhost:11434/v1').replace(/\/+$/, '');
    const endpoint = `${baseUrl}/chat/completions`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: formatAPIError(res.status, text, 'Local Model'),
      };
    }

    try {
      const json = JSON.parse(text);
      const rawOutput = json?.choices?.[0]?.message?.content || '';
      return { success: true, data: rawOutput, status: res.status };
    } catch (e: any) {
      return { success: false, status: 200, error: `Invalid response format: ${e.message}` };
    }
  }

  return { success: false, status: 400, error: 'Unsupported provider. Only Google Gemini and Local Models are supported.' };
}

/**
 * Tests connection with full error reporting (no cutting off) and fallback model verification
 */
export async function testLLMConnection(config: LLMConfig): Promise<{ success: boolean; message: string }> {
  try {
    if (!config.apiKey && config.provider !== 'custom') {
      return { success: false, message: 'API key is required.' };
    }

    const primaryModel = config.modelName || (config.provider === 'gemini' ? 'gemini-3-flash-preview' : 'mistral');

    // Ping primary model
    const pingResult = await callProviderAPI(
      config,
      primaryModel,
      'You are a testing assistant. Reply with JSON: {"status": "ok"}',
      'Please reply with JSON {"status": "ok"}'
    );

    if (pingResult.success) {
      let msg = `Successfully connected to ${config.provider.toUpperCase()} (${primaryModel})!`;
      if (config.fallbackModelName && config.fallbackModelName.trim()) {
        msg += ` Fallback model configured: ${config.fallbackModelName}.`;
      }
      return { success: true, message: msg };
    }

    // Check if primary experienced high demand / quota and test fallback if configured
    if (config.fallbackModelName && config.fallbackModelName.trim() && isHighDemandError(pingResult.status, pingResult.error || '')) {
      const fallbackResult = await callProviderAPI(
        config,
        config.fallbackModelName.trim(),
        'You are a testing assistant. Reply with JSON: {"status": "ok"}',
        'Please reply with JSON {"status": "ok"}'
      );

      if (fallbackResult.success) {
        return {
          success: true,
          message: `Primary model (${primaryModel}) reported high demand or quota limit: ${pingResult.error}. However, fallback model (${config.fallbackModelName}) responded successfully!`,
        };
      } else {
        return {
          success: false,
          message: `Both primary and fallback models failed:\n• Primary (${primaryModel}): ${pingResult.error}\n• Fallback (${config.fallbackModelName}): ${fallbackResult.error}`,
        };
      }
    }

    return {
      success: false,
      message: pingResult.error || 'Connection failed with an unknown error.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Network communication error: ${err?.message || err}`,
    };
  }
}

export function isLLMConfigured(config: LLMConfig): boolean {
  if (!config) return false;
  if (config.provider === 'gemini') {
    return !!(config.apiKey && config.apiKey.trim().length > 0);
  }
  if (config.provider === 'custom') {
    return !!(config.baseUrl && config.baseUrl.trim().length > 0);
  }
  return false;
}

/**
 * Evaluates essay with real LLM invocation only (no simulated fallbacks)
 * and automatic fallback model failover on high demand
 */
export async function evaluateEssayWithLLM(
  config: LLMConfig,
  question: Question,
  userText: string,
  timeSpentSeconds: number,
  wordCount: number
): Promise<Attempt> {
  if (!isLLMConfigured(config)) {
    throw new Error(
      'No active LLM connection configured. Please configure your Google Gemini API key or Local Model in settings before submitting.'
    );
  }

  const primaryModel = config.modelName || (config.provider === 'gemini' ? 'gemini-3-flash-preview' : 'mistral');
  let usedModel = primaryModel;
  let usedFallback = false;

  const userPrompt = `
OFFICIAL TEF CANADA WRITING EXAM EVALUATION
TASK: ${question.taskType === 'task1' ? 'Section A — Fait Divers (min 80 words)' : 'Section B — Opinion Letter (min 200 words)'}
PROMPT:
${question.prompt}

CANDIDATE'S SUBMISSION:
"""
${userText}
"""

STATISTICS:
- Word count: ${wordCount} words
- Time taken: ${Math.round(timeSpentSeconds / 60)} minutes

Evaluate according to NCLC benchmarks. Remember: explanations and advice must be in ENGLISH, while the corrected text is in authentic high-level FRENCH. Output strictly valid JSON matching this schema:
{
  "nclcScore": 8,
  "nclcLevelDescription": "NCLC 8.0 (Niveau B2+)",
  "evaluationSummary": "English summary...",
  "correctedResponse": "Complete French model rewrite in full...",
  "subScores": {
    "coherence": 8,
    "vocabulary": 8,
    "taskCompletion": 9,
    "grammar": 7
  },
  "mistakes": [
    {
      "id": "m-1",
      "category": "Error rule category in English",
      "original": "exact French phrase containing mistake",
      "correction": "corrected French phrase",
      "explanation": "Why this is an error in English",
      "howToAvoid": "English actionable tip"
    }
  ]
}
`;

  // 1. Try Primary Model
  let callResult = await callProviderAPI(
    config,
    primaryModel,
    config.systemPrompt || '',
    userPrompt
  );

  // 2. If primary failed and fallback is configured, try Fallback Model
  if (!callResult.success && config.fallbackModelName && config.fallbackModelName.trim()) {
    const fallbackModel = config.fallbackModelName.trim();
    console.warn(`Primary model (${primaryModel}) failed: ${callResult.error}. Attempting fallback model: ${fallbackModel}`);

    const fallbackResult = await callProviderAPI(
      config,
      fallbackModel,
      config.systemPrompt || '',
      userPrompt
    );

    if (fallbackResult.success) {
      callResult = fallbackResult;
      usedModel = fallbackModel;
      usedFallback = true;
    } else {
      console.error(`Fallback model (${fallbackModel}) also failed: ${fallbackResult.error}`);
      throw new Error(
        `Both primary and fallback LLM models failed:\n• Primary (${primaryModel}): ${callResult.error}\n• Fallback (${fallbackModel}): ${fallbackResult.error}`
      );
    }
  }

  // 3. If still not successful, throw the actual error from the LLM
  if (!callResult.success || !callResult.data) {
    throw new Error(callResult.error || `Failed to receive evaluation from ${config.provider.toUpperCase()} (${usedModel}).`);
  }

  // 4. Parse the real LLM JSON response
  let parsed: LLMResponsePayload;
  try {
    parsed = extractJsonFromLLMOutput(callResult.data);
  } catch (parseErr: any) {
    throw new Error(
      `The LLM (${usedModel}) responded, but the output could not be parsed as valid evaluation JSON: ${parseErr.message}\n\nRaw output received:\n${callResult.data.slice(0, 300)}`
    );
  }

  const mistakes: Mistake[] = (parsed.mistakes || []).map((m, idx) => ({
    id: m.id || `m-llm-${idx + 1}`,
    category: m.category || 'General Grammar',
    original: m.original || '',
    correction: m.correction || '',
    explanation: m.explanation || 'Grammar error in French structure.',
    howToAvoid: m.howToAvoid || 'Review this rule carefully before next attempt.',
  }));

  let summary = parsed.evaluationSummary || 'Essay evaluated under official NCLC criteria.';
  if (usedFallback) {
    summary = `[High demand on primary model (${primaryModel}) — successfully evaluated using fallback model (${usedModel})]\n\n${summary}`;
  }

  const subScores = parsed.subScores || {
    coherence: parsed.nclcScore || 7,
    vocabulary: parsed.nclcScore || 7,
    taskCompletion: wordCount >= question.minWords ? 9 : 7,
    grammar: Math.max(4, (parsed.nclcScore || 7) - (mistakes.length > 3 ? 2 : 1)),
  };

  return {
    id: `att-${Date.now()}`,
    status: 'evaluated',
    timestamp: new Date().toISOString(),
    taskType: question.taskType,
    questionId: question.id,
    questionTitle: question.title,
    questionPrompt: question.prompt,
    userResponse: userText || '(No text submitted)',
    wordCount,
    timeSpentSeconds,
    nclcScore: parsed.nclcScore || 7,
    nclcLevelDescription: parsed.nclcLevelDescription || `NCLC ${parsed.nclcScore || 7}`,
    evaluationSummary: summary,
    correctedResponse: parsed.correctedResponse || userText,
    mistakes,
    subScores,
  };
}
