import type {
  CharacterDnaEntry,
  PbrpKnowledgeRepository,
  ShotGrammarEntry,
  StyleDnaEntry,
} from './pbrpKnowledgeRepository.js';
import type { IntentAnalysisResult } from './pbrpIntentAnalyzer.js';

/**
 * PHASE-PROJECT-BRAIN-INTEGRATION-005: PBRP Runtime Execution Preparation V1.
 *
 * Knowledge Selector (04_PBRP_Execution_Architecture_Revision_V2.txt,
 * "Revision 03"): given the Intent Analyzer's required-capability +
 * emotion-query output, deterministically selects the best-matching
 * Character DNA, Style DNA, and Shot Grammar entries from the Knowledge
 * Repository. Pure selection -- no merging (that is Knowledge Composer's
 * job) and no LLM reasoning.
 */

export type KnowledgeSelection = {
  character: CharacterDnaEntry | null;
  style: StyleDnaEntry | null;
  shot: ShotGrammarEntry | null;
  selection_reason: {
    character: string;
    style: string;
    shot: string;
  };
  unresolved_capabilities: string[];
};

function scoreEmotionOverlap(candidateEmotion: string, emotionQuery: readonly string[]): number {
  if (emotionQuery.length === 0) {
    return 0;
  }
  const lower = candidateEmotion.toLowerCase();
  return emotionQuery.filter((e) => lower.includes(e.toLowerCase())).length;
}

/**
 * Deterministic tie-break: highest score first, then lexicographically
 * smallest id. This guarantees the same input always selects the same
 * entry, run after run (required for the PASS→PASS regression check).
 */
function pickBest<T extends { id: string; score: number }>(candidates: T[]): T | null {
  if (candidates.length === 0) {
    return null;
  }
  const sorted = [...candidates].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.id.localeCompare(b.id);
  });
  return sorted[0];
}

export function selectKnowledge(
  repository: PbrpKnowledgeRepository,
  intent: IntentAnalysisResult
): KnowledgeSelection {
  const unresolved: string[] = [];

  const characterCandidates = repository.character_dna.map((c) => ({
    id: c.anchor_id,
    score: scoreEmotionOverlap(c.emotion, intent.emotion_query),
    entry: c,
  }));
  const bestCharacter = pickBest(characterCandidates);
  const character = bestCharacter && bestCharacter.score > 0 ? bestCharacter.entry : null;
  if (intent.required_capabilities.includes('character') && !character) {
    unresolved.push('character');
  }

  // Style DNA is not directly emotion-tagged in the repository; select the
  // composition tied to the chosen character's own shots when available
  // (matches the real registries' character->shot->composition linkage),
  // otherwise fall back to the highest-priority ("narrative") composition,
  // tie-broken deterministically by id.
  let style: StyleDnaEntry | null = null;
  let styleReason: string;
  if (character) {
    const linkedShot = repository.shot_grammar.find((s) => s.semantic_anchor_id === character.anchor_id);
    const linkedStyle = linkedShot
      ? repository.style_dna.find((s) => s.composition_id === linkedShot.composition_id) ?? null
      : null;
    if (linkedStyle) {
      style = linkedStyle;
      styleReason = `linked to character '${character.anchor_id}' via shot '${linkedShot!.shot_id}'`;
    } else {
      style = null;
      styleReason = 'no composition linked to the selected character';
    }
  } else {
    styleReason = 'no character selected; falling back to narrative-priority composition';
  }
  if (!style) {
    const scoredCandidates = repository.style_dna
      .map((s) => ({ id: s.composition_id, score: s.priority_score, entry: s }));
    const fallback = pickBest(scoredCandidates);
    style = fallback ? fallback.entry : null;
    if (fallback) {
      styleReason = `fallback: highest priority_score (${fallback.score}) composition, tie-broken by id`;
    }
  }
  if (intent.required_capabilities.includes('style') && !style) {
    unresolved.push('style');
  }

  const shotCandidates = repository.shot_grammar.map((s) => ({
    id: s.shot_id,
    score:
      scoreEmotionOverlap(s.emotion_state, intent.emotion_query) +
      (character && s.semantic_anchor_id === character.anchor_id ? 1 : 0),
    entry: s,
  }));
  const bestShot = pickBest(shotCandidates);
  const shot = bestShot && bestShot.score > 0 ? bestShot.entry : null;
  if (intent.required_capabilities.includes('shot') && !shot) {
    unresolved.push('shot');
  }

  return {
    character,
    style,
    shot,
    selection_reason: {
      character: character
        ? `emotion overlap score ${bestCharacter!.score} against query [${intent.emotion_query.join(', ')}]`
        : 'no character DNA entry matched the intent\'s emotion query',
      style: style ? styleReason : 'no style DNA entry available',
      shot: shot
        ? `emotion/character overlap score ${bestShot!.score}`
        : 'no shot grammar entry matched the intent',
    },
    unresolved_capabilities: unresolved,
  };
}
