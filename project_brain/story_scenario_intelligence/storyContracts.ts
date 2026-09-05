/**
 * Story/Scenario Intelligence — Real Data Contracts
 *
 * Implements the field shapes designed in docs/architecture/StoryScenarioGapResolution.md
 * (PHASE-037) as real TypeScript interfaces, wired to the real resolver/integration layer
 * (sourceResolver.ts, storyIntelligenceIntegration.ts — both PHASE-044–049, unmodified here).
 *
 * Discipline (per PHASE-052's explicit instruction — "실제 창작 내용은 임의 생성하지 않음"):
 * every field that would require AUTHORED content (purpose, conflict, intent, narrative
 * significance, title, synopsis) or a DEREFERENCED value the resolver does not expose
 * (the resolver returns pointers — registry_ref + field_path — never the underlying field
 * value, by PHASE-043's own pointer-only design) is represented as an explicit
 * "NOT_DERIVABLE: <reason>" string, never invented prose, never silently blank.
 *
 * Rule I1 (PHASE-048/049): no 'node:fs' import here either — every real fact comes from
 * calling sourceResolver.ts / storyIntelligenceIntegration.ts's already-real functions.
 *
 * Scope: project_brain/story_scenario_intelligence/ only, per PHASE-052's authorization.
 */

import type { Envelope } from './sourceResolver.js';
import type { EpisodeResult, SeasonScenarioResult, StoryBibleResult } from './storyIntelligenceIntegration.js';

/** No real value exists for this field yet — never invent one. */
export const CONTENT_GAP_REASON = 'no author-provided content exists yet for this field';

/** The resolver is pointer-only (registry_ref + field_path); it never returns a dereferenced value. */
export const DEREF_GAP_REASON =
  'resolver provides pointer resolution only (registry_ref + field_path), not value dereferencing ' +
  '— see docs/architecture/StoryScenarioResolverFinalContract.md §6 pointer-only discipline; ' +
  'populating this field requires a future dereferencing capability, not yet implemented';

export function notDerivable(reason: string): string {
  return `NOT_DERIVABLE: ${reason}`;
}

// ---------------------------------------------------------------------------
// Scene / Shot annotations (PHASE-037 §6/§7, PHASE-046's Titanic-caveat rules unaffected —
// these are additive, pointer-keyed, never a mutation of the underlying scene/shot registry)
// ---------------------------------------------------------------------------

export interface ScenePurposeAnnotation {
  scene_id: string;
  movie_id: string;
  scene_resolution: Envelope; // real resolver result for this scene_id — proves the pointer is real
  purpose: string; // NOT_DERIVABLE — authored content, not invented here
  conflict: string; // NOT_DERIVABLE — authored content
  emotion: string; // NOT_DERIVABLE — a real value exists in the registry, but dereferencing it is out of scope (see DEREF_GAP_REASON)
  seed_source: string | null; // real pointer only — e.g. "semantic_anchor:<anchor_id>" when a real shared anchor motivated grouping this scene with another
}

export interface ShotIntentAnnotation {
  shot_id: string;
  movie_id: string;
  shot_resolution: Envelope; // real resolver result for this shot_id
  intent: string; // NOT_DERIVABLE — authored content
  serves_scene_purpose: string; // real pointer — must equal the parent scene_id (PHASE-037 §5 rule)
  camera_choice_trace: { camera_id: string; composition_id: string }; // both NOT_DERIVABLE — dereferencing gap
}

// ---------------------------------------------------------------------------
// Narrative Callback Ledger (PHASE-037 GAP 2 / PHASE-046 §4)
// ---------------------------------------------------------------------------

export interface CallbackLeg {
  movie_id: string;
  scene_id: string;
  semantic_anchor_id: string; // real anchor id — structural fact, not invented
  resolution: Envelope; // real resolveScene(...) result for this leg
}

export interface NarrativeCallbackLedgerEntry {
  callback_id: string;
  callback_type: string; // reuses an existing real continuity-dimension name (e.g. "memory_callback"), not invented
  planted: CallbackLeg;
  resolved: CallbackLeg;
  status: 'RESOLVED' | 'NOT_DERIVABLE'; // computed from both legs' real resolution, never asserted
  narrative_significance: string; // NOT_DERIVABLE — interpreting *why* this callback matters is authored content
  structural_basis: string; // real, non-authored fact: what data actually links the two legs (e.g. a shared anchor id)
}

// ---------------------------------------------------------------------------
// Character Growth Delta (PHASE-037 GAP 5 / PHASE-046 movie-readiness gate)
// ---------------------------------------------------------------------------

export interface CharacterGrowthDeltaRecord {
  episode_id: string;
  character_id: string;
  entry_state_ref: { movie_id: string; scene_id: string; resolution: Envelope };
  exit_state_ref: { movie_id: string; scene_id: string; resolution: Envelope };
  delta: {
    pose_state_change: string; // NOT_DERIVABLE — dereferencing gap
    emotion_state_change: string; // NOT_DERIVABLE — dereferencing gap
    gaze_state_change: string; // NOT_DERIVABLE — dereferencing gap
    interaction_state_change: string; // NOT_DERIVABLE — dereferencing gap
  };
  derived_consistency_trend: string; // NOT_DERIVABLE — requires averaging real numeric values, dereferencing gap
  authored_growth_note: string; // NOT_DERIVABLE — interpretive/authored content
}

// ---------------------------------------------------------------------------
// Episode / SeasonScenario / StoryBible — the real tier objects
// ---------------------------------------------------------------------------

export interface EpisodeDocument {
  episode_id: string;
  movie_id: string;
  resolution: EpisodeResult; // real, from storyIntelligenceIntegration.ts's resolveEpisode
  scene_purpose_annotations: ScenePurposeAnnotation[];
  shot_intent_annotations: ShotIntentAnnotation[];
  callback_entries: NarrativeCallbackLedgerEntry[];
  character_growth: CharacterGrowthDeltaRecord[];
  episode_act_structure: string; // NOT_DERIVABLE — authored content (act structure is a narrative decision)
}

export interface SeasonScenarioDocument {
  season_scenario_id: string;
  resolution: SeasonScenarioResult; // real, from resolveSeasonScenario
  episodes: EpisodeDocument[];
  season_arc: string; // NOT_DERIVABLE — authored content
}

export interface StoryBibleDocument {
  story_id: string;
  resolution: StoryBibleResult; // real, from resolveStoryBible
  seasons: SeasonScenarioDocument[];
  world_identity: Envelope; // real resolveWorldIdentity(...) call — RESOLVED for movies listed in datasets/story/world-identity-index-v1.json (PHASE-699/700), still NOT_DERIVABLE fail-closed for every other movie_id (PHASE-043 §5)
  title: string; // NOT_DERIVABLE — authored content
  synopsis: string; // NOT_DERIVABLE — authored content
  cast_roster: string; // NOT_DERIVABLE — aggregating real character_ids requires dereferencing (see DEREF_GAP_REASON), not yet implemented
}
