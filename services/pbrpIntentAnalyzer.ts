/**
 * PHASE-PROJECT-BRAIN-INTEGRATION-005: PBRP Runtime Execution Preparation V1.
 *
 * Intent Analyzer (per 04_PBRP_Execution_Architecture_Revision_V2.txt,
 * "Revision 02"). Input: a free-text scene request. Output: the required
 * Capability list, matched keywords, a confidence score, and any missing
 * capability.
 *
 * Deterministic by design (04A_PBRP_Engineering_Recommendations.txt,
 * "Recommendation 03: Deterministic ... Non Goal: LLM Reasoning" applies to
 * the Knowledge Composer explicitly, but this phase's own condition
 * "Deterministic logic 우선 / LLM reasoning은 명확한 extension point로
 * 격리" extends the same rule here). This module never calls an LLM or any
 * external API -- it matches keywords against a fixed table. A future
 * LLM-based strategy is named as an explicit, isolated extension point
 * (`IntentAnalysisStrategy`) below and is NOT implemented or called by this
 * phase.
 */

export type PbrpRequiredCapability = 'character' | 'style' | 'shot' | 'lighting' | 'negative';

export type LightingQuery = {
  time_of_day: 'day' | 'night' | 'golden_hour' | 'unspecified';
  weather: 'clear' | 'rain' | 'unspecified';
};

export type IntentAnalysisResult = {
  intent_id: string;
  raw_input: string;
  matched_keywords: string[];
  emotion_query: string[];
  lighting_query: LightingQuery;
  required_capabilities: PbrpRequiredCapability[];
  missing_capabilities: PbrpRequiredCapability[];
  confidence_score: number;
  analysis_mode: 'deterministic_keyword_v1';
};

// Always required for a generation-ready prompt, per PBRP's own example
// ("비오는 밤" -> Lighting, Location, Night, Weather) and the Knowledge
// Repository's real content shape (character_dna / style_dna / shot_grammar).
const ALWAYS_REQUIRED: readonly PbrpRequiredCapability[] = ['character', 'style', 'shot', 'negative'];

// Small, fixed emotion keyword table -- deterministic substring match
// against the real emotion vocabulary already present in the Titanic
// registries (see pbrpKnowledgeRepository.ts), not an invented list.
const EMOTION_KEYWORDS: readonly string[] = [
  'freedom', 'romance', 'wonder', 'longing', 'social tension', 'destiny',
  'grief', 'devotion', 'urgency', 'tenderness', 'awe', 'impermanence',
  'liberation', 'anticipation', 'constraint', 'joy', 'discovery', 'anxiety',
  'separation', 'shift',
];

const TIME_OF_DAY_KEYWORDS: Record<string, LightingQuery['time_of_day']> = {
  night: 'night',
  evening: 'night',
  sunset: 'golden_hour',
  dusk: 'golden_hour',
  'golden hour': 'golden_hour',
  day: 'day',
  daytime: 'day',
  morning: 'day',
};

const WEATHER_KEYWORDS: Record<string, LightingQuery['weather']> = {
  rain: 'rain',
  rainy: 'rain',
  storm: 'rain',
  clear: 'clear',
};

function matchKeywords(input: string, table: readonly string[]): string[] {
  const lower = input.toLowerCase();
  return table.filter((k) => lower.includes(k.toLowerCase()));
}

function matchLightingQuery(input: string): LightingQuery {
  const lower = input.toLowerCase();
  let time_of_day: LightingQuery['time_of_day'] = 'unspecified';
  for (const [kw, value] of Object.entries(TIME_OF_DAY_KEYWORDS)) {
    if (lower.includes(kw)) {
      time_of_day = value;
      break;
    }
  }
  let weather: LightingQuery['weather'] = 'unspecified';
  for (const [kw, value] of Object.entries(WEATHER_KEYWORDS)) {
    if (lower.includes(kw)) {
      weather = value;
      break;
    }
  }
  return { time_of_day, weather };
}

/**
 * Extension point (explicitly NOT implemented in this phase, per "API 신규
 * 의존 금지" / "AI Studio 대규모 기능 개발 금지"): a future LLM-based
 * intent analysis strategy would implement this same interface. The
 * orchestrator (pbrpRuntimeOrchestrator.ts) is written against
 * `IntentAnalysisStrategy`, not directly against the deterministic
 * function, so swapping in an LLM strategy later requires no pipeline
 * change -- only a new implementation of this interface.
 */
export interface IntentAnalysisStrategy {
  readonly strategy_id: string;
  analyze(rawInput: string): IntentAnalysisResult;
}

function buildIntentId(rawInput: string): string {
  let hash = 0;
  for (let i = 0; i < rawInput.length; i += 1) {
    hash = (hash * 31 + rawInput.charCodeAt(i)) | 0;
  }
  return `intent_${Math.abs(hash).toString(16)}`;
}

function analyzeDeterministic(rawInput: string): IntentAnalysisResult {
  const matchedEmotions = matchKeywords(rawInput, EMOTION_KEYWORDS);
  const lighting_query = matchLightingQuery(rawInput);
  const hasLightingSignal = lighting_query.time_of_day !== 'unspecified' || lighting_query.weather !== 'unspecified';

  const required_capabilities: PbrpRequiredCapability[] = [...ALWAYS_REQUIRED];
  if (hasLightingSignal) {
    required_capabilities.push('lighting');
  }

  // A capability counts as "found" if we have at least one real signal for
  // it: character/style/shot all key off matched emotion keywords (since
  // the Knowledge Repository indexes all three by emotion); lighting keys
  // off its own keyword table; negative is always structurally satisfiable
  // (the world-identity-lock rule applies unconditionally).
  const found: PbrpRequiredCapability[] = [];
  if (matchedEmotions.length > 0) {
    found.push('character', 'style', 'shot');
  }
  found.push('negative');
  if (hasLightingSignal) {
    found.push('lighting');
  }

  const missing_capabilities = required_capabilities.filter((c) => !found.includes(c));
  const confidence_score = required_capabilities.length === 0
    ? 0
    : Number(((required_capabilities.length - missing_capabilities.length) / required_capabilities.length).toFixed(4));

  return {
    intent_id: buildIntentId(rawInput),
    raw_input: rawInput,
    matched_keywords: matchedEmotions,
    emotion_query: matchedEmotions,
    lighting_query,
    required_capabilities,
    missing_capabilities,
    confidence_score,
    analysis_mode: 'deterministic_keyword_v1',
  };
}

export const DETERMINISTIC_INTENT_ANALYSIS_STRATEGY: IntentAnalysisStrategy = {
  strategy_id: 'deterministic_keyword_v1',
  analyze: analyzeDeterministic,
};

export function analyzeIntent(rawInput: string): IntentAnalysisResult {
  return DETERMINISTIC_INTENT_ANALYSIS_STRATEGY.analyze(rawInput);
}
