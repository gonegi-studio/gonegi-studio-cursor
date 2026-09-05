/**
 * Story/Scenario Intelligence — Minimal Real Authoring Sample V1
 *
 * Implements docs/architecture/StoryScenarioAuthoringContract.md (PHASE-053) as real code:
 * the authoring-gate functions (Rule AU1/AU3/AU7/AU11) and ONE minimal authored sample built
 * on top of the exact same real pointers storySampleV1.ts (PHASE-052) already proved resolve.
 *
 * Two-axis discipline (PHASE-053 §2, Rule TA1): AggregateStatus (structural, unchanged,
 * resolver-owned) and AuthoringStatus (new, this file) are computed independently and never
 * allowed to influence each other. AuthoringStatus deliberately uses different vocabulary
 * (NOT_STARTED/PARTIAL/COMPLETE) from both AggregateStatus (RESOLVED/PARTIAL/NOT_DERIVABLE)
 * and the Trust Registry's Verdict (READY/PARTIAL/NOT_READY) so the three are never visually
 * confusable (PHASE-053 §2 callout, PHASE-048's original callout).
 *
 * Rule I1: no 'node:fs' import — every real fact comes from the resolver/integration layer.
 * Scope: project_brain/story_scenario_intelligence/ only, per PHASE-054's authorization.
 */

import { resolveScene, resolveShot, resolveCharacterGrowthField, resolveWorldIdentity, type Envelope } from './sourceResolver.js';
import { resolveEpisode, resolveSeasonScenario, resolveStoryBible } from './storyIntelligenceIntegration.js';
import { notDerivable, CONTENT_GAP_REASON, DEREF_GAP_REASON } from './storyContracts.js';

// ---------------------------------------------------------------------------
// Authoring-gate primitives (PHASE-053 Rule AU1/AU3/AU7/AU11)
// ---------------------------------------------------------------------------

export class AuthoringGateError extends Error {}

/** Rule AU3: authored content must never collide with the NOT_DERIVABLE sentinel. */
function assertNotSentinelCollision(value: string, fieldLabel: string): void {
  if (value.startsWith('NOT_DERIVABLE:')) {
    throw new AuthoringGateError(`Rule AU3 violation: "${fieldLabel}" content collides with the NOT_DERIVABLE sentinel: "${value}"`);
  }
  if (value.trim().length === 0) {
    throw new AuthoringGateError(`Rule AU3 violation: "${fieldLabel}" content is empty — not real authored text`);
  }
}

/** Rule AU1: content may only be authored for a pointer that already resolves RESOLVED. */
export function authorField(pointerEnvelope: Envelope, value: string, fieldLabel: string): string {
  if (pointerEnvelope.status !== 'RESOLVED') {
    throw new AuthoringGateError(
      `Rule AU1 violation: cannot author "${fieldLabel}" — the underlying pointer is not RESOLVED (status=${pointerEnvelope.status}, reason=${pointerEnvelope.reason})`
    );
  }
  assertNotSentinelCollision(value, fieldLabel);
  return value;
}

/** Rule AU7: Shot intent may only be authored once the parent Scene's purpose is already authored. */
export function authorShotIntent(shotEnvelope: Envelope, parentScenePurpose: string, value: string, fieldLabel: string): string {
  if (parentScenePurpose.startsWith('NOT_DERIVABLE:')) {
    throw new AuthoringGateError(`Rule AU7 violation: cannot author "${fieldLabel}" — parent scene's purpose is not yet authored (still NOT_DERIVABLE)`);
  }
  return authorField(shotEnvelope, value, fieldLabel);
}

/**
 * Rule AU11: mechanical delta/dereferencing fields are NEVER authored, under any circumstance.
 * This function exists only to prove the gate is enforced structurally — it always throws.
 */
export function forbidMechanicalFieldAuthoring(fieldLabel: string): never {
  throw new AuthoringGateError(`Rule AU11/AU6/AU8 violation: "${fieldLabel}" is a mechanical/dereferencing field and may never be authored — no author path exists for it`);
}

/**
 * PHASE-706 — Rule AU-CV (Controlled Vocabulary). PHASE-037 GAP 3 named this "TBD in a later
 * phase" (docs/architecture/StoryScenarioGapResolution.md §4: "purpose: string, // controlled
 * vocabulary TBD in a later phase, e.g. establish_threat / reveal_secret / deepen_bond"), and
 * PHASE-077/081 repeatedly reconfirmed it real and unimplemented ("a real multi-author risk
 * whenever a second author joins"). This is an OPTIONAL, additive tag alongside the existing
 * free-text `purpose` field — it does not replace or require it, since every one of the 150+
 * real episodes already authored uses full descriptive prose for `purpose`, not short category
 * tokens; retroactively reinterpreting that would violate "기존 콘텐츠 무수정". The 3 values
 * below are exactly PHASE-037's own already-specified examples — none invented here.
 */
export const SCENE_PURPOSE_CATEGORIES = ['establish_threat', 'reveal_secret', 'deepen_bond'] as const;
export type ScenePurposeCategory = (typeof SCENE_PURPOSE_CATEGORIES)[number];

/** Rule AU-CV: an OPTIONAL purpose_category, if supplied, must be one of the controlled vocabulary. */
export function assertControlledVocabulary(value: string, fieldLabel: string): void {
  if (!(SCENE_PURPOSE_CATEGORIES as readonly string[]).includes(value)) {
    throw new AuthoringGateError(
      `Rule AU-CV violation: "${fieldLabel}" value "${value}" is not one of the controlled vocabulary (${SCENE_PURPOSE_CATEGORIES.join(', ')})`
    );
  }
}

// ---------------------------------------------------------------------------
// Axis 2 — Authoring Completeness (PHASE-053 Rule TA2, implemented for the first time here)
// ---------------------------------------------------------------------------

export type AuthoringStatus = 'NOT_STARTED' | 'PARTIAL' | 'COMPLETE';

export interface AuthoringCompleteness {
  authoring_status: AuthoringStatus;
  authored_count: number;
  total_content_fields: number;
}

function isAuthored(value: string): boolean {
  return !value.startsWith('NOT_DERIVABLE:') && value.trim().length > 0;
}

export function computeAuthoringCompleteness(contentFields: string[]): AuthoringCompleteness {
  const authored_count = contentFields.filter(isAuthored).length;
  const total_content_fields = contentFields.length;
  let authoring_status: AuthoringStatus;
  if (authored_count === 0) authoring_status = 'NOT_STARTED';
  else if (authored_count === total_content_fields) authoring_status = 'COMPLETE';
  else authoring_status = 'PARTIAL';
  return { authoring_status, authored_count, total_content_fields };
}

// ---------------------------------------------------------------------------
// The one minimal authored sample — same real pointers storySampleV1.ts (PHASE-052) used
// ---------------------------------------------------------------------------

const MOVIE_ID = 'spirited_away';
const SCENE_A = 'scene_spirited_away_spirit_bath_0007';
const SCENE_B = 'scene_spirited_away_meadow_flower_0008';
const SHOT_A = 'shot_spirited_00049';
const SHOT_B = 'shot_spirited_00057';
const SHARED_ANCHOR = 'river_spirit_departure';
const CHARACTER_ID = 'CHAR-gonagi';
const GROWTH_FIELDS = ['pose_state', 'emotion_state', 'gaze_state', 'interaction_state'];

export interface AuthoredScenePurpose {
  scene_id: string;
  scene_resolution: Envelope;
  purpose: string;
  conflict: { conflict_type: 'internal' | 'external' | 'relational'; stakes: string; opposing_force: string };
  emotion: string; // stays NOT_DERIVABLE — Rule AU6, dereferencing gap, not an authoring field
}

export interface AuthoredShotIntent {
  shot_id: string;
  shot_resolution: Envelope;
  intent: string;
  serves_scene_purpose: string;
  camera_choice_trace: { camera_id: string; composition_id: string }; // stays NOT_DERIVABLE — Rule AU8
}

export interface AuthoredCallback {
  callback_id: string;
  callback_type: string;
  planted: { scene_id: string; semantic_anchor_id: string; resolution: Envelope };
  resolved: { scene_id: string; semantic_anchor_id: string; resolution: Envelope };
  status: 'RESOLVED' | 'NOT_DERIVABLE';
  narrative_significance: string;
  structural_basis: string;
}

export interface AuthoredCharacterGrowth {
  character_id: string;
  entry_state_ref: { scene_id: string; resolution: Envelope };
  exit_state_ref: { scene_id: string; resolution: Envelope };
  delta: { pose_state_change: string; emotion_state_change: string; gaze_state_change: string; interaction_state_change: string }; // all stay NOT_DERIVABLE — Rule AU11
  authored_growth_note: string; // the only authored field on this record
}

export interface AuthoredStorySampleV1 {
  story_id: string;
  title: string;
  synopsis: string;
  themes: string[];
  world_id: string; // stays NOT_DERIVABLE — not an authoring surface at all
  cast_roster: string; // stays NOT_DERIVABLE — hybrid, not yet actionable
  season_scenario_id: string;
  season_arc: { main_arc: string; theme_arc: string };
  episode_id: string;
  episode_act_structure: { act_1: { act_name: string; purpose: string }; act_2: { act_name: string; purpose: string } };
  scene_purposes: AuthoredScenePurpose[];
  shot_intents: AuthoredShotIntent[];
  callback: AuthoredCallback;
  character_growth: AuthoredCharacterGrowth;
  episode_aggregate_status_unchanged_check: string; // real AggregateResult.aggregate_status, proving Rule TA1
  authoring_completeness: AuthoringCompleteness; // Axis 2, computed independently
}

export function buildAuthoredStorySampleV1(): AuthoredStorySampleV1 {
  const sceneAEnv = resolveScene(MOVIE_ID, SCENE_A);
  const sceneBEnv = resolveScene(MOVIE_ID, SCENE_B);
  const shotAEnv = resolveShot(MOVIE_ID, SHOT_A);
  const shotBEnv = resolveShot(MOVIE_ID, SHOT_B);

  // --- Scene Purpose Annotations, authored (Rule AU4) ---
  const purposeAText = authorField(sceneAEnv, 'Establish the pair\'s disoriented wonder as they enter unfamiliar spirit territory.', 'purpose[A]');
  const purposeBText = authorField(sceneBEnv, 'Mark a shift into loneliness after the spirit-departure moment shared with scene A.', 'purpose[B]');
  // conflict is the structured shape Rule AU4 requires (not a bare string) — each sub-field is
  // still gated through authorField so the sentinel-collision guard (Rule AU3) applies to it too.
  const conflictA: AuthoredScenePurpose['conflict'] = {
    conflict_type: 'internal',
    stakes: authorField(sceneAEnv, 'orientation and trust in an unfamiliar place', 'conflict[A].stakes'),
    opposing_force: authorField(sceneAEnv, 'the unfamiliar spirit-world setting itself', 'conflict[A].opposing_force'),
  };
  const conflictB: AuthoredScenePurpose['conflict'] = {
    conflict_type: 'internal',
    stakes: authorField(sceneBEnv, 'processing the emotional aftermath of the departure', 'conflict[B].stakes'),
    opposing_force: authorField(sceneBEnv, 'the isolation that follows the shared moment', 'conflict[B].opposing_force'),
  };
  const scenePurposes: AuthoredScenePurpose[] = [
    { scene_id: SCENE_A, scene_resolution: sceneAEnv, purpose: purposeAText, conflict: conflictA, emotion: notDerivable(DEREF_GAP_REASON) },
    { scene_id: SCENE_B, scene_resolution: sceneBEnv, purpose: purposeBText, conflict: conflictB, emotion: notDerivable(DEREF_GAP_REASON) },
  ];

  // --- Shot Intent Annotations, authored (Rule AU7 — gated on the scene purposes above) ---
  const shotIntents: AuthoredShotIntent[] = [
    {
      shot_id: SHOT_A,
      shot_resolution: shotAEnv,
      intent: authorShotIntent(shotAEnv, purposeAText, 'Wide establishing framing to let the unfamiliar space itself carry the disorientation.', 'intent[A]'),
      serves_scene_purpose: SCENE_A,
      camera_choice_trace: { camera_id: notDerivable(DEREF_GAP_REASON), composition_id: notDerivable(DEREF_GAP_REASON) },
    },
    {
      shot_id: SHOT_B,
      shot_resolution: shotBEnv,
      intent: authorShotIntent(shotBEnv, purposeBText, 'Wide establishing framing echoing shot A, to visually tie the loneliness back to the earlier wonder.', 'intent[B]'),
      serves_scene_purpose: SCENE_B,
      camera_choice_trace: { camera_id: notDerivable(DEREF_GAP_REASON), composition_id: notDerivable(DEREF_GAP_REASON) },
    },
  ];

  // --- Callback, authored narrative_significance (structural_basis stays the real, derived fact) ---
  const callback: AuthoredCallback = {
    callback_id: 'callback_authored_sample_v1',
    callback_type: 'memory_callback',
    planted: { scene_id: SCENE_A, semantic_anchor_id: SHARED_ANCHOR, resolution: sceneAEnv },
    resolved: { scene_id: SCENE_B, semantic_anchor_id: SHARED_ANCHOR, resolution: sceneBEnv },
    status: sceneAEnv.status === 'RESOLVED' && sceneBEnv.status === 'RESOLVED' ? 'RESOLVED' : 'NOT_DERIVABLE',
    narrative_significance: authorField(sceneBEnv, 'The shared spirit-departure motif carries the emotional turn from scene A\'s wonder into scene B\'s loneliness.', 'narrative_significance'),
    structural_basis: `both scenes list "${SHARED_ANCHOR}" in their real semantic_anchor_ids array (datasets/movie_reconstruction/spirited_away/spirited-away-scene-registry.json)`,
  };

  // --- Character Growth, authored_growth_note only (delta.* stays NOT_DERIVABLE, Rule AU11) ---
  const entryEnv = resolveCharacterGrowthField(MOVIE_ID, CHARACTER_ID, GROWTH_FIELDS[0]);
  const exitEnv = resolveCharacterGrowthField(MOVIE_ID, CHARACTER_ID, GROWTH_FIELDS[0]);
  const characterGrowth: AuthoredCharacterGrowth = {
    character_id: CHARACTER_ID,
    entry_state_ref: { scene_id: SCENE_A, resolution: entryEnv },
    exit_state_ref: { scene_id: SCENE_B, resolution: exitEnv },
    delta: {
      pose_state_change: notDerivable(DEREF_GAP_REASON),
      emotion_state_change: notDerivable(DEREF_GAP_REASON),
      gaze_state_change: notDerivable(DEREF_GAP_REASON),
      interaction_state_change: notDerivable(DEREF_GAP_REASON),
    },
    authored_growth_note: authorField(entryEnv, 'Gonagi moves from wary alertness to quiet withdrawal across these two scenes.', 'authored_growth_note'),
  };

  // --- Episode structural resolution (real, unchanged aggregation from storyIntelligenceIntegration.ts) ---
  const episodeResolution = resolveEpisode({
    episode_id: 'episode_authored_sample_v1',
    movie_id: MOVIE_ID,
    scene_ids: [SCENE_A, SCENE_B],
    shot_ids: [SHOT_A, SHOT_B],
    character_growth: { character_id: CHARACTER_ID, fields: GROWTH_FIELDS },
  });
  const seasonResolution = resolveSeasonScenario('season_authored_sample_v1', [episodeResolution]);
  const storyResolution = resolveStoryBible('story_authored_sample_v1', [seasonResolution]);

  // --- Authored StoryBible/Season/Episode content ---
  const title = authorField(sceneAEnv, 'A Spirit-World Departure', 'title');
  const synopsis = authorField(sceneAEnv, 'Two linked scenes trace a shift from disoriented wonder to quiet loneliness around a shared spirit-departure moment.', 'synopsis');
  const themes = [authorField(sceneAEnv, 'disorientation', 'themes[0]'), authorField(sceneBEnv, 'loneliness', 'themes[1]')];
  const seasonArc = {
    main_arc: authorField(sceneAEnv, 'season_1_wonder_to_loneliness', 'season_arc.main_arc'),
    theme_arc: authorField(sceneBEnv, 'season_1_isolation_theme', 'season_arc.theme_arc'),
  };
  const episodeActStructure = {
    act_1: { act_name: authorField(sceneAEnv, 'arrival', 'act_1.act_name'), purpose: authorField(sceneAEnv, 'Establish disorientation in the new spirit-world setting.', 'act_1.purpose') },
    act_2: { act_name: authorField(sceneBEnv, 'departure', 'act_2.act_name'), purpose: authorField(sceneBEnv, 'Turn disorientation into loneliness after the shared spirit-departure moment.', 'act_2.purpose') },
  };

  const contentFields = [
    title,
    synopsis,
    ...themes,
    seasonArc.main_arc,
    seasonArc.theme_arc,
    episodeActStructure.act_1.act_name,
    episodeActStructure.act_1.purpose,
    episodeActStructure.act_2.act_name,
    episodeActStructure.act_2.purpose,
    ...scenePurposes.map((p) => p.purpose),
    ...shotIntents.map((s) => s.intent),
    callback.narrative_significance,
    characterGrowth.authored_growth_note,
  ];

  return {
    story_id: 'story_authored_sample_v1',
    title,
    synopsis,
    themes,
    world_id: notDerivable('not an authoring surface — blocked on WorldIdentityIndex, PHASE-037 GAP 1, PHASE-053 §4'),
    cast_roster: notDerivable('hybrid field, not yet actionable — aggregation requires a dereferencing capability the resolver does not have (PHASE-053 §4)'),
    season_scenario_id: 'season_authored_sample_v1',
    season_arc: seasonArc,
    episode_id: 'episode_authored_sample_v1',
    episode_act_structure: episodeActStructure,
    scene_purposes: scenePurposes,
    shot_intents: shotIntents,
    callback,
    character_growth: characterGrowth,
    episode_aggregate_status_unchanged_check: episodeResolution.aggregate_status,
    authoring_completeness: computeAuthoringCompleteness(contentFields),
  };
}
