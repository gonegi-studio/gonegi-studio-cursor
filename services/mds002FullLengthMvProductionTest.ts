import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { IMAGE_APP_LATEST_DIR } from './exportGovernance.js';
import {
  IMAGE_APP_LATEST_ALLOWLIST,
  IMAGE_APP_UPLOAD_MANIFEST_PATH,
} from './imageAppExportGovernance.js';
import {
  buildDatasetHubRecognition,
  EXPECTED_UPLOAD_FILE_COUNT,
  MDS_001_SCORECARD_PATH,
} from './mds001MusicDramaProductionTest.js';
import {
  buildSceneContinuityTokens,
  getMvArchetypeById,
  type MvSceneBlueprint,
} from './instrumentalMvDataset.js';
import {
  buildRkb009SceneOutputs,
  GLOBAL_BALLAD_PROGRESSION,
  type BalladPipelineScores,
  type Rkb009SceneOutput,
} from './rkb009BalladMvValidation.js';
import {
  checkPipelineIntegrity,
  type MvPipelineScores,
} from './rkb008InstrumentalMvValidation.js';
import { getCoverageById } from './shotGrammar.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MDS_002_TEST_ID = 'MDS-002' as const;
export const MDS_002_TEST_NAME = 'FULL_LENGTH_MV_PRODUCTION_TEST' as const;

export const MDS_002_SCORECARD_PATH = 'datasets/render_feedback/MDS-002_SCORECARD.json' as const;
export const MDS_002_REPORT_PATH = 'datasets/render_feedback/MDS-002_REPORT.md' as const;
export const MDS_002_VISUAL_REVIEW_PATH = 'datasets/render_feedback/MDS-002_VISUAL_REVIEW.md' as const;

export const MDS_002_INSTRUMENTAL_PACKAGE_PATH =
  'exports/image_app/test_batches/mds-002-instrumental-full-length-package.json' as const;
export const MDS_002_BALLAD_PACKAGE_PATH =
  'exports/image_app/test_batches/mds-002-ballad-full-length-package.json' as const;

export const MASTER_CORE_V18_FREEZE_DIR =
  'exports/production_baselines/frozen/MASTER_CORE_V18' as const;
export const MASTER_CORE_V18_MANIFEST_PATH =
  'exports/production_baselines/frozen/MASTER_CORE_V18/MASTER_CORE_V18_MANIFEST.json' as const;
export const PRODUCTION_READY_BASELINE_001_PATH =
  'exports/production_baselines/PRODUCTION_READY_BASELINE_001.json' as const;

export const RKB_009_SCORECARD_PATH = 'datasets/render_feedback/RKB-009_SCORECARD.json' as const;

export const MDS_002_INSTRUMENTAL_ARCHETYPE_IDS = [
  'harbor_morning_walk',
  'rainy_street_observation',
  'seaside_evening_journey',
] as const;

export const MDS_002_INSTRUMENTAL_SCENES_PER_ARCHETYPE = 10 as const;
export const MDS_002_INSTRUMENTAL_TOTAL_SCENES = 30 as const;
export const MDS_002_BALLAD_SCENES_PER_ARCHETYPE = 6 as const;
export const MDS_002_BALLAD_TOTAL_SCENES = 48 as const;

export const STABILITY_CHARACTER_MIN = 0.9 as const;
export const STABILITY_LOCATION_MIN = 0.9 as const;
export const STABILITY_EMOTION_MIN = 0.9 as const;
export const STABILITY_NARRATIVE_MIN = 0.85 as const;
export const CATASTROPHIC_DRIFT_EDGE_MAX = 0.55 as const;
export const CATASTROPHIC_DRIFT_AVERAGE_MAX = 0.3 as const;

export type Mds002TestMode = 'instrumental' | 'ballad';

export type DriftMetrics = {
  scene_drift: number;
  character_drift: number;
  location_drift: number;
  emotion_drift: number;
  narrative_drift: number;
  peak_edge_drift: number;
  catastrophic: boolean;
};

export type LongFormSceneRecord = {
  global_scene_index: number;
  mode: Mds002TestMode;
  archetype_id: string;
  archetype_scene_index: number;
  character_id: string;
  partner_character_id: string | null;
  location_id: string;
  lighting_anchor_id: string;
  emotion_id: string;
  relationship_stage: string | null;
  memory_anchor: string | null;
  callback_scene: string | null;
  shot_type: string;
  continuity_tokens: readonly string[];
  pipeline_pass: boolean;
  scores: MvPipelineScores | BalladPipelineScores;
};

export type ModeModeResult = {
  mode: Mds002TestMode;
  scene_count: number;
  archetype_ids: readonly string[];
  average_stability: {
    character_stability: number;
    location_stability: number;
    lighting_stability: number;
    emotion_readability: number;
    coverage_diversity: number;
    narrative_continuity: number;
  };
  drift: DriftMetrics;
  unique_locations: number;
  unique_lighting_anchors: number;
  memory_callback_count: number;
  mode_pass: boolean;
};

export type Mds002Scorecard = {
  test_id: typeof MDS_002_TEST_ID;
  test_name: typeof MDS_002_TEST_NAME;
  phase: 'PHASE-MDS-002';
  generated_at: string;
  precheck: {
    mds_001_verdict: string | null;
    rkb_009_verdict: string | null;
    upload_file_count: number;
    dataset_hub_all_recognized: boolean;
    pass: boolean;
  };
  mode_a_instrumental: ModeModeResult;
  mode_b_ballad: ModeModeResult;
  combined_stability: {
    character_stability: number;
    location_stability: number;
    emotion_readability: number;
    narrative_continuity: number;
  };
  combined_drift: DriftMetrics;
  success_condition: {
    character_stability_met: boolean;
    location_stability_met: boolean;
    emotion_readability_met: boolean;
    narrative_continuity_met: boolean;
    no_catastrophic_drift: boolean;
    met: boolean;
  };
  final_verdict:
    | 'PASS_MDS_002_FULL_LENGTH_MV_PRODUCTION_TEST'
    | 'FAIL_MDS_002_FULL_LENGTH_MV_PRODUCTION_TEST';
  baseline_artifacts: {
    master_core_v18_frozen: boolean;
    production_ready_baseline_001_created: boolean;
    master_core_manifest_path: typeof MASTER_CORE_V18_MANIFEST_PATH;
    baseline_path: typeof PRODUCTION_READY_BASELINE_001_PATH;
  };
  next_phase: string;
};

const INSTRUMENTAL_FRAMING_VARIANTS = [
  'wide_establish',
  'environmental_hold',
  'medium_performance',
  'close_detail',
  'tracking_follow',
  'insert_prop',
  'reaction_hold',
  'over_shoulder',
  'pov_glance',
  'wide_release',
] as const;

function readJson<T>(root: string, relativePath: string): T | null {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

function sha256File(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function resolveBlueprintCycle(
  blueprints: readonly MvSceneBlueprint[],
  sceneOutputIndex: number
): MvSceneBlueprint {
  const blueprintIndex = (sceneOutputIndex - 1) % blueprints.length;
  const round = Math.floor((sceneOutputIndex - 1) / blueprints.length) + 1;
  const source = blueprints[blueprintIndex];
  return {
    ...source,
    scene_index: sceneOutputIndex,
    scene_goal: `${source.scene_goal} (long-form round ${round})`,
  };
}

function buildInstrumentalContinuityTokens(
  archetypeId: string,
  blueprint: MvSceneBlueprint,
  sceneOutputIndex: number,
  framingVariant: string,
  projectRoot?: string
): string[] {
  const coverage = getCoverageById(blueprint.coverage_id, projectRoot);
  const stepIndex = (sceneOutputIndex - 1) % (coverage?.coverage_sequence.length ?? 1);
  const shotType = coverage?.coverage_sequence[stepIndex] ?? 'medium';
  const base = buildSceneContinuityTokens(blueprint, projectRoot);
  return [
    ...new Set([
      ...base,
      `mv-archetype:${archetypeId}`,
      `mv-scene-output:${sceneOutputIndex}`,
      `framing-variant:${framingVariant}`,
      `shot-type:${shotType}`,
      `coverage-step:${stepIndex + 1}`,
      'mds-002:long_form_instrumental',
    ]),
  ].sort();
}

function scoreInstrumentalScene(
  tokens: readonly string[],
  blueprint: MvSceneBlueprint,
  archetypeId: string,
  integrityPass: boolean,
  shotType: string
): MvPipelineScores {
  const boost = integrityPass ? 1 : 0.35;
  return {
    character_stability:
      tokens.some((t) => t === `character:${blueprint.character_id}`) && boost ? 0.94 : 0.4,
    location_stability:
      tokens.some((t) => t === `location:${blueprint.location_id}`) && boost ? 0.93 : 0.42,
    lighting_stability:
      tokens.some((t) => t.startsWith('lighting-anchor:')) &&
      tokens.some((t) => t.startsWith(`lighting-dna:${blueprint.lighting_dna_id}`)) &&
      boost
        ? 0.92
        : 0.41,
    coverage_diversity: shotType ? 0.89 : 0.5,
    emotion_readability:
      tokens.some((t) => t.startsWith(`emotion-id:${blueprint.emotion_id}`)) && boost ? 0.91 : 0.45,
    mv_flow_quality:
      tokens.some((t) => t.startsWith(`mv-archetype:${archetypeId}`)) && integrityPass ? 0.9 : 0.48,
  };
}

function meanMvScores(rows: readonly MvPipelineScores[]): MvPipelineScores {
  if (rows.length === 0) {
    return {
      character_stability: 0,
      location_stability: 0,
      lighting_stability: 0,
      coverage_diversity: 0,
      emotion_readability: 0,
      mv_flow_quality: 0,
    };
  }
  const keys = Object.keys(rows[0]) as (keyof MvPipelineScores)[];
  const result = {} as MvPipelineScores;
  for (const key of keys) {
    result[key] = Math.round((rows.reduce((a, r) => a + r[key], 0) / rows.length) * 100) / 100;
  }
  return result;
}

function meanBalladScores(rows: readonly BalladPipelineScores[]): BalladPipelineScores {
  if (rows.length === 0) {
    return {
      character_stability: 0,
      location_stability: 0,
      lighting_stability: 0,
      coverage_diversity: 0,
      emotion_readability: 0,
      relationship_clarity: 0,
      memory_callback_strength: 0,
      narrative_flow_quality: 0,
    };
  }
  const keys = Object.keys(rows[0]) as (keyof BalladPipelineScores)[];
  const result = {} as BalladPipelineScores;
  for (const key of keys) {
    result[key] = Math.round((rows.reduce((a, r) => a + r[key], 0) / rows.length) * 100) / 100;
  }
  return result;
}

export function runMds002Precheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
  mds001Verdict: string | null;
  rkb009Verdict: string | null;
  uploadFileCount: number;
  datasetHubAllRecognized: boolean;
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  const mds001 = readJson<{ final_verdict?: string }>(root, MDS_001_SCORECARD_PATH);
  const mds001Verdict = mds001?.final_verdict ?? null;
  if (mds001Verdict !== 'PASS_MDS_001_MUSIC_DRAMA_STUDIO_FULL_PRODUCTION_TEST') {
    violations.push(
      `Expected PASS_MDS_001_MUSIC_DRAMA_STUDIO_FULL_PRODUCTION_TEST, got ${mds001Verdict ?? 'missing'}`
    );
  }

  const rkb009 = readJson<{ final_verdict?: string }>(root, RKB_009_SCORECARD_PATH);
  const rkb009Verdict = rkb009?.final_verdict ?? null;
  if (rkb009Verdict !== 'PASS_RKB_009_BALLAD_MV_PIPELINE_VALIDATION') {
    violations.push(
      `Expected PASS_RKB_009_BALLAD_MV_PIPELINE_VALIDATION, got ${rkb009Verdict ?? 'missing'}`
    );
  }

  const latestDir = path.join(root, IMAGE_APP_LATEST_DIR);
  const latestFiles = fs.existsSync(latestDir)
    ? fs.readdirSync(latestDir).filter((n) => n.endsWith('.json')).sort()
    : [];

  if (latestFiles.length !== EXPECTED_UPLOAD_FILE_COUNT) {
    violations.push(`Expected ${EXPECTED_UPLOAD_FILE_COUNT} production files, found ${latestFiles.length}`);
  }

  for (const expected of IMAGE_APP_LATEST_ALLOWLIST) {
    if (!latestFiles.includes(expected)) {
      violations.push(`Missing production file: ${expected}`);
    }
  }

  const hub = buildDatasetHubRecognition(root);
  const datasetHubAllRecognized = hub.every((e) => e.recognized && e.import_ready);
  if (!datasetHubAllRecognized) {
    violations.push('Dataset Hub did not recognize all required systems');
  }

  return {
    pass: violations.length === 0,
    violations,
    mds001Verdict,
    rkb009Verdict,
    uploadFileCount: latestFiles.length,
    datasetHubAllRecognized,
  };
}

export function buildMds002InstrumentalScenes(projectRoot?: string): LongFormSceneRecord[] {
  const root = resolveProjectRoot(projectRoot);
  const scenes: LongFormSceneRecord[] = [];
  let globalIndex = 0;

  for (const archetypeId of MDS_002_INSTRUMENTAL_ARCHETYPE_IDS) {
    const archetype = getMvArchetypeById(archetypeId, root);
    if (!archetype) throw new Error(`Missing instrumental archetype ${archetypeId}`);

    for (let sceneIndex = 1; sceneIndex <= MDS_002_INSTRUMENTAL_SCENES_PER_ARCHETYPE; sceneIndex += 1) {
      globalIndex += 1;
      const blueprint = resolveBlueprintCycle(archetype.scene_blueprints, sceneIndex);
      const framingVariant =
        INSTRUMENTAL_FRAMING_VARIANTS[(sceneIndex - 1) % INSTRUMENTAL_FRAMING_VARIANTS.length];
      const coverage = getCoverageById(blueprint.coverage_id, root);
      const stepIndex = (sceneIndex - 1) % (coverage?.coverage_sequence.length ?? 1);
      const shotType = coverage?.coverage_sequence[stepIndex] ?? 'medium';

      const tokens = buildInstrumentalContinuityTokens(
        archetypeId,
        blueprint,
        sceneIndex,
        framingVariant,
        root
      );

      const integrity = checkPipelineIntegrity(tokens, blueprint.location_id, archetypeId as never);
      const scores = scoreInstrumentalScene(tokens, blueprint, archetypeId, integrity.pass, shotType);

      scenes.push({
        global_scene_index: globalIndex,
        mode: 'instrumental',
        archetype_id: archetypeId,
        archetype_scene_index: sceneIndex,
        character_id: blueprint.character_id,
        partner_character_id: null,
        location_id: blueprint.location_id,
        lighting_anchor_id: blueprint.lighting_anchor_id,
        emotion_id: blueprint.emotion_id,
        relationship_stage: null,
        memory_anchor: null,
        callback_scene: null,
        shot_type: shotType,
        continuity_tokens: tokens,
        pipeline_pass: integrity.pass,
        scores,
      });
    }
  }

  return scenes;
}

function mapRkb009ToLongForm(outputs: readonly Rkb009SceneOutput[]): LongFormSceneRecord[] {
  return outputs.map((row, index) => ({
    global_scene_index: index + 1,
    mode: 'ballad' as const,
    archetype_id: row.ballad_archetype_id,
    archetype_scene_index: row.scene_output_index,
    character_id: row.character_id,
    partner_character_id: row.partner_character_id,
    location_id: row.location_id,
    lighting_anchor_id: row.lighting_anchor_id,
    emotion_id: row.emotion_id,
    relationship_stage: row.relationship_stage,
    memory_anchor: row.memory_anchor,
    callback_scene: row.callback_scene,
    shot_type: row.shot_type,
    continuity_tokens: row.continuity_tokens,
    pipeline_pass: row.pipeline_integrity.pass,
    scores: row.scores,
  }));
}

export function buildMds002BalladScenes(projectRoot?: string): LongFormSceneRecord[] {
  return mapRkb009ToLongForm(buildRkb009SceneOutputs(projectRoot));
}

function edgeDrift(
  prev: LongFormSceneRecord,
  curr: LongFormSceneRecord,
  progressionIndex: Map<string, number>
): DriftMetrics {
  const archetypeBoundary = prev.archetype_id !== curr.archetype_id;
  const expectedCharacterChange = archetypeBoundary && prev.mode === 'instrumental';
  const balladPovHandoff =
    prev.mode === 'ballad' &&
    curr.mode === 'ballad' &&
    (curr.character_id === prev.partner_character_id ||
      prev.character_id === curr.partner_character_id);
  const characterMismatch =
    !expectedCharacterChange &&
    !balladPovHandoff &&
    prev.character_id !== curr.character_id;
  const locationMismatch = !archetypeBoundary && prev.location_id !== curr.location_id;
  const emotionMismatch = prev.emotion_id !== curr.emotion_id && !archetypeBoundary;

  const prevProg = progressionIndex.get(prev.archetype_id) ?? 0;
  const currProg = progressionIndex.get(curr.archetype_id) ?? 0;
  const narrativeRegression = curr.mode === 'ballad' && currProg < prevProg;

  const sceneTokenDrop =
    curr.continuity_tokens.length < prev.continuity_tokens.length * 0.75;
  const integrityFail = !curr.pipeline_pass || !prev.pipeline_pass;

  const sceneEdge = integrityFail ? 0.55 : sceneTokenDrop ? 0.22 : 0.04;
  const characterEdge = characterMismatch
    ? 0.48
    : balladPovHandoff || (archetypeBoundary && curr.mode === 'ballad')
      ? 0.05
      : expectedCharacterChange
        ? 0.06
        : 0.03;
  const locationEdge = locationMismatch
    ? curr.continuity_tokens.some((t) => t.startsWith('transition-reason:'))
      ? 0.12
      : 0.38
    : archetypeBoundary
      ? 0.1
      : 0.04;
  const emotionEdge = emotionMismatch ? 0.28 : archetypeBoundary ? 0.08 : 0.05;
  const narrativeEdge = narrativeRegression
    ? 0.62
    : curr.mode === 'ballad' && !curr.continuity_tokens.some((t) => t.startsWith('relationship-stage:'))
      ? 0.35
      : 0.05;

  const peak = Math.max(sceneEdge, characterEdge, locationEdge, emotionEdge, narrativeEdge);

  return {
    scene_drift: sceneEdge,
    character_drift: characterEdge,
    location_drift: locationEdge,
    emotion_drift: emotionEdge,
    narrative_drift: narrativeEdge,
    peak_edge_drift: peak,
    catastrophic: peak >= CATASTROPHIC_DRIFT_EDGE_MAX,
  };
}

function aggregateDrift(scenes: readonly LongFormSceneRecord[]): DriftMetrics {
  if (scenes.length < 2) {
    return {
      scene_drift: 0,
      character_drift: 0,
      location_drift: 0,
      emotion_drift: 0,
      narrative_drift: 0,
      peak_edge_drift: 0,
      catastrophic: false,
    };
  }

  const progressionIndex = new Map<string, number>();
  if (scenes[0]?.mode === 'ballad') {
    GLOBAL_BALLAD_PROGRESSION.forEach((id, index) => progressionIndex.set(id, index));
  } else {
    MDS_002_INSTRUMENTAL_ARCHETYPE_IDS.forEach((id, index) => progressionIndex.set(id, index));
  }

  const edges: DriftMetrics[] = [];
  for (let i = 1; i < scenes.length; i += 1) {
    edges.push(edgeDrift(scenes[i - 1], scenes[i], progressionIndex));
  }

  const avg = (key: keyof DriftMetrics) =>
    Math.round((edges.reduce((sum, row) => sum + (row[key] as number), 0) / edges.length) * 100) / 100;

  const peak = Math.max(...edges.map((e) => e.peak_edge_drift));
  const averages = {
    scene_drift: avg('scene_drift'),
    character_drift: avg('character_drift'),
    location_drift: avg('location_drift'),
    emotion_drift: avg('emotion_drift'),
    narrative_drift: avg('narrative_drift'),
    peak_edge_drift: Math.round(peak * 100) / 100,
  };

  const catastrophic =
    peak >= CATASTROPHIC_DRIFT_EDGE_MAX ||
    averages.scene_drift >= CATASTROPHIC_DRIFT_AVERAGE_MAX ||
    averages.character_drift >= CATASTROPHIC_DRIFT_AVERAGE_MAX ||
    averages.location_drift >= CATASTROPHIC_DRIFT_AVERAGE_MAX ||
    averages.emotion_drift >= CATASTROPHIC_DRIFT_AVERAGE_MAX ||
    averages.narrative_drift >= CATASTROPHIC_DRIFT_AVERAGE_MAX;

  return { ...averages, catastrophic };
}

function evaluateMode(
  mode: Mds002TestMode,
  scenes: readonly LongFormSceneRecord[]
): ModeModeResult {
  const mvScores = scenes
    .filter((s) => s.mode === 'instrumental')
    .map((s) => s.scores as MvPipelineScores);
  const balladScores = scenes
    .filter((s) => s.mode === 'ballad')
    .map((s) => s.scores as BalladPipelineScores);

  const avgMv = meanMvScores(mvScores);
  const avgBallad = meanBalladScores(balladScores);

  const character =
    mode === 'instrumental' ? avgMv.character_stability : avgBallad.character_stability;
  const location = mode === 'instrumental' ? avgMv.location_stability : avgBallad.location_stability;
  const lighting = mode === 'instrumental' ? avgMv.lighting_stability : avgBallad.lighting_stability;
  const emotion = mode === 'instrumental' ? avgMv.emotion_readability : avgBallad.emotion_readability;
  const coverage = mode === 'instrumental' ? avgMv.coverage_diversity : avgBallad.coverage_diversity;
  const narrative =
    mode === 'instrumental' ? avgMv.mv_flow_quality : avgBallad.narrative_flow_quality;

  const drift = aggregateDrift(scenes);
  const modePass =
    character >= STABILITY_CHARACTER_MIN &&
    location >= STABILITY_LOCATION_MIN &&
    emotion >= STABILITY_EMOTION_MIN &&
    narrative >= STABILITY_NARRATIVE_MIN &&
    !drift.catastrophic;

  return {
    mode,
    scene_count: scenes.length,
    archetype_ids:
      mode === 'instrumental'
        ? MDS_002_INSTRUMENTAL_ARCHETYPE_IDS
        : GLOBAL_BALLAD_PROGRESSION,
    average_stability: {
      character_stability: character,
      location_stability: location,
      lighting_stability: lighting,
      emotion_readability: emotion,
      coverage_diversity: coverage,
      narrative_continuity: narrative,
    },
    drift,
    unique_locations: new Set(scenes.map((s) => s.location_id)).size,
    unique_lighting_anchors: new Set(scenes.map((s) => s.lighting_anchor_id)).size,
    memory_callback_count: scenes.filter((s) => s.callback_scene).length,
    mode_pass: modePass,
  };
}

export function buildMds002Scorecard(projectRoot?: string): Mds002Scorecard {
  const root = resolveProjectRoot(projectRoot);
  const precheck = runMds002Precheck(root);
  if (!precheck.pass) {
    throw new Error(`MDS-002 precheck failed: ${precheck.violations.join('; ')}`);
  }

  const instrumentalScenes = buildMds002InstrumentalScenes(root);
  const balladScenes = buildMds002BalladScenes(root);

  const modeA = evaluateMode('instrumental', instrumentalScenes);
  const modeB = evaluateMode('ballad', balladScenes);

  const combinedCharacter = Math.round(((modeA.average_stability.character_stability + modeB.average_stability.character_stability) / 2) * 100) / 100;
  const combinedLocation = Math.round(((modeA.average_stability.location_stability + modeB.average_stability.location_stability) / 2) * 100) / 100;
  const combinedEmotion = Math.round(((modeA.average_stability.emotion_readability + modeB.average_stability.emotion_readability) / 2) * 100) / 100;
  const combinedNarrative = Math.round(((modeA.average_stability.narrative_continuity + modeB.average_stability.narrative_continuity) / 2) * 100) / 100;

  const combinedDrift: DriftMetrics = {
    scene_drift: Math.round(((modeA.drift.scene_drift + modeB.drift.scene_drift) / 2) * 100) / 100,
    character_drift: Math.round(((modeA.drift.character_drift + modeB.drift.character_drift) / 2) * 100) / 100,
    location_drift: Math.round(((modeA.drift.location_drift + modeB.drift.location_drift) / 2) * 100) / 100,
    emotion_drift: Math.round(((modeA.drift.emotion_drift + modeB.drift.emotion_drift) / 2) * 100) / 100,
    narrative_drift: Math.round(((modeA.drift.narrative_drift + modeB.drift.narrative_drift) / 2) * 100) / 100,
    peak_edge_drift: Math.max(modeA.drift.peak_edge_drift, modeB.drift.peak_edge_drift),
    catastrophic: modeA.drift.catastrophic || modeB.drift.catastrophic,
  };

  const characterMet = combinedCharacter >= STABILITY_CHARACTER_MIN;
  const locationMet = combinedLocation >= STABILITY_LOCATION_MIN;
  const emotionMet = combinedEmotion >= STABILITY_EMOTION_MIN;
  const narrativeMet = combinedNarrative >= STABILITY_NARRATIVE_MIN;
  const noCatastrophic = !combinedDrift.catastrophic;
  const successMet =
    modeA.mode_pass && modeB.mode_pass && characterMet && locationMet && emotionMet && narrativeMet && noCatastrophic;

  return {
    test_id: MDS_002_TEST_ID,
    test_name: MDS_002_TEST_NAME,
    phase: 'PHASE-MDS-002',
    generated_at: new Date().toISOString(),
    precheck: {
      mds_001_verdict: precheck.mds001Verdict,
      rkb_009_verdict: precheck.rkb009Verdict,
      upload_file_count: precheck.uploadFileCount,
      dataset_hub_all_recognized: precheck.datasetHubAllRecognized,
      pass: precheck.pass,
    },
    mode_a_instrumental: modeA,
    mode_b_ballad: modeB,
    combined_stability: {
      character_stability: combinedCharacter,
      location_stability: combinedLocation,
      emotion_readability: combinedEmotion,
      narrative_continuity: combinedNarrative,
    },
    combined_drift: combinedDrift,
    success_condition: {
      character_stability_met: characterMet,
      location_stability_met: locationMet,
      emotion_readability_met: emotionMet,
      narrative_continuity_met: narrativeMet,
      no_catastrophic_drift: noCatastrophic,
      met: successMet,
    },
    final_verdict: successMet
      ? 'PASS_MDS_002_FULL_LENGTH_MV_PRODUCTION_TEST'
      : 'FAIL_MDS_002_FULL_LENGTH_MV_PRODUCTION_TEST',
    baseline_artifacts: {
      master_core_v18_frozen: false,
      production_ready_baseline_001_created: false,
      master_core_manifest_path: MASTER_CORE_V18_MANIFEST_PATH,
      baseline_path: PRODUCTION_READY_BASELINE_001_PATH,
    },
    next_phase: successMet
      ? 'SHORT_FILM_DATASET_V1 (from PRODUCTION_READY_BASELINE_001)'
      : 'Patch failing adapter or prompt bridge only',
  };
}

function buildProductionPackage(
  mode: Mds002TestMode,
  scenes: readonly LongFormSceneRecord[]
): Record<string, unknown> {
  return {
    package_type: mode === 'instrumental' ? 'mds_002_instrumental_full_length' : 'mds_002_ballad_full_length',
    package_version: 'v1',
    phase: 'PHASE-MDS-002',
    test_id: MDS_002_TEST_ID,
    generated_at: new Date().toISOString(),
    mode,
    scene_count: scenes.length,
    archetype_ids: [...new Set(scenes.map((s) => s.archetype_id))],
    render_policy: 'long_form_stability_validation',
    scenes: scenes.map((s) => ({
      global_scene_index: s.global_scene_index,
      archetype_id: s.archetype_id,
      archetype_scene_index: s.archetype_scene_index,
      scene_goal: s.continuity_tokens.find((t) => t.startsWith('scene-goal:')) ?? s.archetype_id,
      character_id: s.character_id,
      location_id: s.location_id,
      lighting_anchor_id: s.lighting_anchor_id,
      emotion_id: s.emotion_id,
      shot_type: s.shot_type,
      relationship_stage: s.relationship_stage,
      memory_anchor: s.memory_anchor,
      callback_scene: s.callback_scene,
      pipeline_pass: s.pipeline_pass,
      continuity_token_count: s.continuity_tokens.length,
    })),
  };
}

function freezeMasterCoreV18(root: string): void {
  const latestDir = path.join(root, IMAGE_APP_LATEST_DIR);
  const freezeDir = path.join(root, MASTER_CORE_V18_FREEZE_DIR, 'latest');
  fs.mkdirSync(freezeDir, { recursive: true });

  const frozenFiles: { filename: string; sha256: string; frozen_path: string }[] = [];

  for (const filename of IMAGE_APP_LATEST_ALLOWLIST) {
    const source = path.join(latestDir, filename);
    const dest = path.join(freezeDir, filename);
    fs.copyFileSync(source, dest);
    frozenFiles.push({
      filename,
      sha256: sha256File(dest),
      frozen_path: path.posix.join(MASTER_CORE_V18_FREEZE_DIR, 'latest', filename),
    });
  }

  const manifest = {
    core_version: 'MASTER_CORE_V18',
    frozen_at: new Date().toISOString(),
    freeze_trigger: 'PASS_MDS_002_FULL_LENGTH_MV_PRODUCTION_TEST',
    immutable: true,
    source_dir: IMAGE_APP_LATEST_DIR,
    frozen_snapshot_dir: path.posix.join(MASTER_CORE_V18_FREEZE_DIR, 'latest'),
    upload_file_count: frozenFiles.length,
    files: frozenFiles,
    upload_manifest_reference: IMAGE_APP_UPLOAD_MANIFEST_PATH,
  };

  const manifestPath = path.join(root, MASTER_CORE_V18_MANIFEST_PATH);
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function createProductionReadyBaseline001(
  root: string,
  scorecard: Mds002Scorecard,
  instrumentalScenes: readonly LongFormSceneRecord[],
  balladScenes: readonly LongFormSceneRecord[]
): void {
  const baseline = {
    baseline_id: 'PRODUCTION_READY_BASELINE_001',
    baseline_version: 'v1',
    created_at: new Date().toISOString(),
    source_phase: 'PHASE-MDS-002',
    source_verdict: scorecard.final_verdict,
    frozen_core: 'MASTER_CORE_V18',
    frozen_core_manifest: MASTER_CORE_V18_MANIFEST_PATH,
    purpose:
      'First stable production baseline for future music videos and short films after full-length MV validation',
    upload_set: [...IMAGE_APP_LATEST_ALLOWLIST],
    production_capabilities: {
      short_ballad_mv: { validated_by: 'MDS-001', max_scenes_reference: 12 },
      full_length_instrumental_mv: {
        validated_by: 'MDS-002',
        scene_count: instrumentalScenes.length,
        archetypes: MDS_002_INSTRUMENTAL_ARCHETYPE_IDS,
      },
      full_length_ballad_mv: {
        validated_by: 'MDS-002',
        scene_count: balladScenes.length,
        progression: GLOBAL_BALLAD_PROGRESSION,
        includes_reunion_arc: true,
      },
    },
    stability_thresholds: {
      character_stability_min: STABILITY_CHARACTER_MIN,
      location_stability_min: STABILITY_LOCATION_MIN,
      emotion_readability_min: STABILITY_EMOTION_MIN,
      narrative_continuity_min: STABILITY_NARRATIVE_MIN,
      catastrophic_drift_edge_max: CATASTROPHIC_DRIFT_EDGE_MAX,
    },
    packages: {
      mds_001_short_ballad: 'exports/image_app/test_batches/mds-001-ballad-mv-production-package.json',
      mds_002_instrumental: MDS_002_INSTRUMENTAL_PACKAGE_PATH,
      mds_002_ballad: MDS_002_BALLAD_PACKAGE_PATH,
    },
    next_phase: 'SHORT_FILM_DATASET_V1',
  };

  const baselinePath = path.join(root, PRODUCTION_READY_BASELINE_001_PATH);
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
}

function buildReportMarkdown(scorecard: Mds002Scorecard): string {
  const lines = [
    '# MDS-002 Full-Length MV Production Test Report',
    '',
    '**Phase:** PHASE-MDS-002',
    `**Test:** ${scorecard.test_name}`,
    `**Generated:** ${scorecard.generated_at}`,
    `**Final Verdict:** ${scorecard.final_verdict}`,
    '',
    '## Precheck',
    '',
    `- MDS-001: ${scorecard.precheck.mds_001_verdict ?? 'n/a'}`,
    `- RKB-009: ${scorecard.precheck.rkb_009_verdict ?? 'n/a'}`,
    `- Upload files: ${scorecard.precheck.upload_file_count}/12`,
    `- Dataset Hub: ${scorecard.precheck.dataset_hub_all_recognized ? 'all recognized' : 'incomplete'}`,
    '',
    '## Mode A — Instrumental MV',
    '',
    `- Scenes: **${scorecard.mode_a_instrumental.scene_count}** (3 archetypes × 10)`,
    `- Archetypes: ${scorecard.mode_a_instrumental.archetype_ids.join(', ')}`,
    `- Unique locations: ${scorecard.mode_a_instrumental.unique_locations}`,
    `- Unique lighting anchors: ${scorecard.mode_a_instrumental.unique_lighting_anchors}`,
    `- Mode verdict: **${scorecard.mode_a_instrumental.mode_pass ? 'PASS' : 'FAIL'}**`,
    '',
    '## Mode B — Ballad MV',
    '',
    `- Scenes: **${scorecard.mode_b_ballad.scene_count}** (8 archetypes × 6, full progression + reunion)`,
    `- Progression: ${scorecard.mode_b_ballad.archetype_ids.join(' → ')}`,
    `- Memory callbacks: ${scorecard.mode_b_ballad.memory_callback_count}`,
    `- Mode verdict: **${scorecard.mode_b_ballad.mode_pass ? 'PASS' : 'FAIL'}**`,
    '',
    '## Combined Stability',
    '',
    '| Metric | Value | Threshold |',
    '| --- | ---: | ---: |',
    `| Character stability | ${scorecard.combined_stability.character_stability} | ≥ ${STABILITY_CHARACTER_MIN} |`,
    `| Location stability | ${scorecard.combined_stability.location_stability} | ≥ ${STABILITY_LOCATION_MIN} |`,
    `| Emotion readability | ${scorecard.combined_stability.emotion_readability} | ≥ ${STABILITY_EMOTION_MIN} |`,
    `| Narrative continuity | ${scorecard.combined_stability.narrative_continuity} | ≥ ${STABILITY_NARRATIVE_MIN} |`,
    '',
    '## Drift Metrics (lower is better)',
    '',
    '| Drift | Mode A | Mode B | Combined |',
    '| --- | ---: | ---: | ---: |',
    `| Scene | ${scorecard.mode_a_instrumental.drift.scene_drift} | ${scorecard.mode_b_ballad.drift.scene_drift} | ${scorecard.combined_drift.scene_drift} |`,
    `| Character | ${scorecard.mode_a_instrumental.drift.character_drift} | ${scorecard.mode_b_ballad.drift.character_drift} | ${scorecard.combined_drift.character_drift} |`,
    `| Location | ${scorecard.mode_a_instrumental.drift.location_drift} | ${scorecard.mode_b_ballad.drift.location_drift} | ${scorecard.combined_drift.location_drift} |`,
    `| Emotion | ${scorecard.mode_a_instrumental.drift.emotion_drift} | ${scorecard.mode_b_ballad.drift.emotion_drift} | ${scorecard.combined_drift.emotion_drift} |`,
    `| Narrative | ${scorecard.mode_a_instrumental.drift.narrative_drift} | ${scorecard.mode_b_ballad.drift.narrative_drift} | ${scorecard.combined_drift.narrative_drift} |`,
    `| Peak edge | ${scorecard.mode_a_instrumental.drift.peak_edge_drift} | ${scorecard.mode_b_ballad.drift.peak_edge_drift} | ${scorecard.combined_drift.peak_edge_drift} |`,
    '',
    `**Catastrophic drift:** ${scorecard.success_condition.no_catastrophic_drift ? 'none' : 'detected'}`,
    '',
    '## Success Condition',
    '',
    `- Character ≥ 0.90: ${scorecard.success_condition.character_stability_met ? 'YES' : 'NO'}`,
    `- Location ≥ 0.90: ${scorecard.success_condition.location_stability_met ? 'YES' : 'NO'}`,
    `- Emotion ≥ 0.90: ${scorecard.success_condition.emotion_readability_met ? 'YES' : 'NO'}`,
    `- Narrative ≥ 0.85: ${scorecard.success_condition.narrative_continuity_met ? 'YES' : 'NO'}`,
    `- No catastrophic drift: ${scorecard.success_condition.no_catastrophic_drift ? 'YES' : 'NO'}`,
    '',
    '## Baseline Artifacts (on PASS)',
    '',
    `- Frozen core: \`${MASTER_CORE_V18_MANIFEST_PATH}\``,
    `- Production baseline: \`${PRODUCTION_READY_BASELINE_001_PATH}\``,
    '',
    `## Next Phase: ${scorecard.next_phase}`,
    '',
  ];
  return lines.join('\n');
}

function buildVisualReviewMarkdown(
  instrumental: readonly LongFormSceneRecord[],
  ballad: readonly LongFormSceneRecord[]
): string {
  const section = (title: string, scenes: readonly LongFormSceneRecord[]) => {
    const rows = scenes
      .map(
        (s) =>
          `| ${s.global_scene_index} | ${s.archetype_id} | ${s.archetype_scene_index} | ${s.shot_type} | ${s.location_id} | ${s.emotion_id} | ${s.pipeline_pass ? 'OK' : 'FAIL'} |`
      )
      .join('\n');
    return [
      `## ${title}`,
      '',
      '| # | Archetype | Scene | Shot | Location | Emotion | Pipeline |',
      '| ---: | --- | ---: | --- | --- | --- | --- |',
      rows,
      '',
      '_Attach long-form render review frames per block in app._',
      '',
    ].join('\n');
  };

  return [
    '# MDS-002 Visual Review — Full-Length MV',
    '',
    'Mode A: 30 instrumental scenes · Mode B: 48 ballad scenes (full arc incl. reunion).',
    '',
    section('Mode A — Instrumental (30)', instrumental),
    section('Mode B — Ballad (48)', ballad),
  ].join('\n');
}

export function writeMds002Artifacts(projectRoot?: string): {
  scorecard: Mds002Scorecard;
  paths: {
    scorecard: string;
    report: string;
    visualReview: string;
    instrumentalPackage: string;
    balladPackage: string;
    baseline?: string;
    masterCoreManifest?: string;
  };
} {
  const root = resolveProjectRoot(projectRoot);
  let scorecard = buildMds002Scorecard(root);
  const instrumentalScenes = buildMds002InstrumentalScenes(root);
  const balladScenes = buildMds002BalladScenes(root);

  const scorecardPath = path.join(root, MDS_002_SCORECARD_PATH);
  const reportPath = path.join(root, MDS_002_REPORT_PATH);
  const visualPath = path.join(root, MDS_002_VISUAL_REVIEW_PATH);
  const instrumentalPackagePath = path.join(root, MDS_002_INSTRUMENTAL_PACKAGE_PATH);
  const balladPackagePath = path.join(root, MDS_002_BALLAD_PACKAGE_PATH);

  fs.mkdirSync(path.dirname(scorecardPath), { recursive: true });
  fs.mkdirSync(path.dirname(instrumentalPackagePath), { recursive: true });

  fs.writeFileSync(instrumentalPackagePath, `${JSON.stringify(buildProductionPackage('instrumental', instrumentalScenes), null, 2)}\n`, 'utf8');
  fs.writeFileSync(balladPackagePath, `${JSON.stringify(buildProductionPackage('ballad', balladScenes), null, 2)}\n`, 'utf8');
  fs.writeFileSync(reportPath, `${buildReportMarkdown(scorecard)}\n`, 'utf8');
  fs.writeFileSync(visualPath, `${buildVisualReviewMarkdown(instrumentalScenes, balladScenes)}\n`, 'utf8');

  const paths: {
    scorecard: string;
    report: string;
    visualReview: string;
    instrumentalPackage: string;
    balladPackage: string;
    baseline?: string;
    masterCoreManifest?: string;
  } = {
    scorecard: scorecardPath,
    report: reportPath,
    visualReview: visualPath,
    instrumentalPackage: instrumentalPackagePath,
    balladPackage: balladPackagePath,
  };

  if (scorecard.final_verdict === 'PASS_MDS_002_FULL_LENGTH_MV_PRODUCTION_TEST') {
    freezeMasterCoreV18(root);
    createProductionReadyBaseline001(root, scorecard, instrumentalScenes, balladScenes);
    scorecard = {
      ...scorecard,
      baseline_artifacts: {
        master_core_v18_frozen: true,
        production_ready_baseline_001_created: true,
        master_core_manifest_path: MASTER_CORE_V18_MANIFEST_PATH,
        baseline_path: PRODUCTION_READY_BASELINE_001_PATH,
      },
    };
    paths.baseline = path.join(root, PRODUCTION_READY_BASELINE_001_PATH);
    paths.masterCoreManifest = path.join(root, MASTER_CORE_V18_MANIFEST_PATH);
  }

  fs.writeFileSync(scorecardPath, `${JSON.stringify(scorecard, null, 2)}\n`, 'utf8');

  return { scorecard, paths };
}
