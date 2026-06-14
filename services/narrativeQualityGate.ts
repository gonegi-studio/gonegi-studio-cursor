import fs from 'node:fs';
import path from 'node:path';
import {
  getCharacterDecisionSeedLibrary,
  type CharacterDecisionEntry,
  type SeedDecisionType,
} from './characterDecisionDefinitions.js';
import {
  BUNDLE_SHOT_ROLES,
  FIVE_SHOT_BUNDLE_FINALE_SCENE_ID,
  getFiveShotBundleSeedLibrary,
  parseCameraProgressionToken,
  type FiveShotBundleEntry,
} from './fiveShotBundleDefinitions.js';
import type { SeedLocationId } from './locationContinuityDefinitions.js';
import { getNarrativeBeatSeedLibrary } from './narrativeBeatDefinitions.js';
import { getStoryboardSceneSeedLibrary } from './storyboardLayerDefinitions.js';
import {
  buildStoryDrivenImageAppExport,
  STORY_DRIVEN_IMAGE_APP_EXPORT_ID,
  STORY_DRIVEN_IMAGE_APP_EXPORT_JSON_PATH,
  STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT,
  type StoryDrivenImageAppExport,
} from './storyDrivenImageAppExport.js';
import {
  ANTI_REPETITION_RULES_BASE,
  getStoryOrchestrationById,
  parseDailyLifeContrastPair,
  parseOutputStoryBeatToken,
  STORY_ORCHESTRATION_ID,
  type StoryOrchestrationEntry,
} from './storyOrchestrationDefinitions.js';

export const NARRATIVE_QUALITY_GATE_VERSION = 'NARRATIVE-QUALITY-GATE-PHASE-98-v1' as const;
export const NARRATIVE_QUALITY_GATE_REPORT_PATH = 'exports/narrative-quality-gate-report.json' as const;

export type NarrativeQualityGateAuditResult =
  | 'PASS'
  | 'FAIL_EMOTION_REPETITION'
  | 'FAIL_LOCATION_REPETITION'
  | 'FAIL_ACTING_REPETITION'
  | 'FAIL_DECISION_REPETITION'
  | 'FAIL_CAMERA_REPETITION'
  | 'FAIL_ELEMENTARY_LOOP'
  | 'FAIL_PREDICTABLE_PROGRESS'
  | 'FAIL_DRAMATIC_TENSION'
  | 'FAIL_CHARACTER_AGENCY'
  | 'FAIL_BUNDLE_TRANSITION'
  | 'FAIL_EMOTIONAL_CONTRAST';

export interface NarrativeQualityGateViolation {
  code: NarrativeQualityGateAuditResult;
  message: string;
  field?: string;
}

export interface NarrativeSceneEvaluation {
  scene_order: number;
  storyboard_id: string;
  bundle_id: string;
  bundle_role: string;
  emotion_id: string;
  beat_type: string;
  narrative_function: string;
  location_id: SeedLocationId | 'unknown';
  primary_daily_life_anchor: string;
  acting_intent: string;
  camera_signature: string;
  decision_types: SeedDecisionType[];
}

export interface NarrativeQualityGateReport {
  auditTimestamp: string;
  auditResult: NarrativeQualityGateAuditResult;
  layer_version: typeof NARRATIVE_QUALITY_GATE_VERSION;
  scene_count: number;
  bundle_count: number;
  upstream_references: {
    orchestration_id: string;
    story_driven_export_id: string;
    story_driven_export_path: typeof STORY_DRIVEN_IMAGE_APP_EXPORT_JSON_PATH;
    story_engine_ready: boolean;
  };
  evaluation_summary: {
    unique_beat_types: number;
    unique_emotions: number;
    dual_passive_scene_count: number;
    bundle_transition_count: number;
    dramatic_tension_markers: number;
  };
  violations: NarrativeQualityGateViolation[];
}

const REPORT_FILE = 'narrative-quality-gate-report.json';

const PASSIVE_DECISION_TYPES = new Set<SeedDecisionType>(['observe', 'wait', 'hide']);
const ACTIVE_DECISION_TYPES = new Set<SeedDecisionType>([
  'follow',
  'leave',
  'protect',
  'search',
  'return',
  'remember',
  'forgive',
]);

const TENSION_BEAT_TYPES = new Set([
  'conflict',
  'sacrifice',
  'distance',
  'longing',
  'departure',
  'memory',
  'discovery',
  'parting',
]);

const TRANSITION_DRAMA_KEYWORDS = [
  'hope',
  'trust',
  'forgiveness',
  'reset',
  'reunion',
  'crossing',
  'finale',
  'threshold',
  'redempt',
  'guardian',
] as const;

const BUNDLE_TRANSITION_PATTERN =
  /^big-scene:[^:]+:SBD-[^:]+:exit-.+$/;

function parseEmotionalProgressionToken(token: string): {
  role: string;
  emotionId: string;
  segment: string;
} | null {
  const match = token.match(/^([^:]+):([^:]+):segment-(\d+)$/);
  if (!match) return null;
  return {
    role: match[1],
    emotionId: match[2],
    segment: match[3],
  };
}

function parseActingProgressionToken(token: string): { role: string; actingIntent: string } | null {
  const colonIndex = token.indexOf(':');
  if (colonIndex <= 0) return null;
  return {
    role: token.slice(0, colonIndex),
    actingIntent: token.slice(colonIndex + 1),
  };
}

function buildDecisionLookup(
  decisions: CharacterDecisionEntry[]
): Map<string, CharacterDecisionEntry> {
  return new Map(decisions.map((decision) => [decision.decision_id, decision] as const));
}

function buildSceneEvaluations(
  bundles: FiveShotBundleEntry[],
  orchestration: StoryOrchestrationEntry,
  storyExport: StoryDrivenImageAppExport,
  decisionById: Map<string, CharacterDecisionEntry>
): NarrativeSceneEvaluation[] {
  const scenesById = new Map(
    getStoryboardSceneSeedLibrary().map((scene) => [scene.storyboard_id, scene] as const)
  );
  const evaluations: NarrativeSceneEvaluation[] = [];

  for (const bundle of bundles) {
    bundle.scene_ids.forEach((storyboardId, index) => {
      const scene = scenesById.get(storyboardId);
      const payload = storyExport.image_generation_payloads.find(
        (entry) => entry.storyboard_id === storyboardId
      );
      const beat = parseOutputStoryBeatToken(payload?.story_beat ?? '');
      const emotional = parseEmotionalProgressionToken(bundle.emotional_progression[index] ?? '');
      const acting = parseActingProgressionToken(bundle.acting_progression[index] ?? '');
      const camera = parseCameraProgressionToken(bundle.camera_progression[index] ?? '');
      const decisionTypes = (payload?.character_decision_refs ?? [])
        .map((decisionId) => decisionById.get(decisionId)?.decision_type)
        .filter((decisionType): decisionType is SeedDecisionType => decisionType !== undefined)
        .sort();

      evaluations.push({
        scene_order: scene?.scene_order ?? index + 1,
        storyboard_id: storyboardId,
        bundle_id: bundle.bundle_id,
        bundle_role: emotional?.role ?? BUNDLE_SHOT_ROLES[index] ?? 'establish',
        emotion_id: emotional?.emotionId ?? beat?.beatType ?? 'unknown',
        beat_type: beat?.beatType ?? 'unknown',
        narrative_function:
          payload?.narrative_turn.split(':')[3]?.split('+')[0] ??
          orchestration.narrative_turns
            .find((token) => token.includes(`:${storyboardId}`) || token.startsWith(`turn:${String(scene?.scene_order ?? 0).padStart(2, '0')}:`))
            ?.split(':')[3] ??
          'unknown',
        location_id: bundle.location_id,
        primary_daily_life_anchor: scene?.daily_life_anchor[0] ?? payload?.daily_life_anchor[0] ?? 'none',
        acting_intent: acting?.actingIntent ?? 'unknown',
        camera_signature: camera
          ? `${camera.cameraAngle}|${camera.bundleCameraDistance}|${camera.primaryShot}`
          : 'unknown',
        decision_types: decisionTypes,
      });
    });
  }

  return evaluations.sort((left, right) => left.scene_order - right.scene_order);
}

function findMaxConsecutiveRepeat<T>(values: readonly T[], equals: (left: T, right: T) => boolean): number {
  if (values.length === 0) return 0;
  let maxRun = 1;
  let currentRun = 1;

  for (let index = 1; index < values.length; index += 1) {
    if (equals(values[index], values[index - 1])) {
      currentRun += 1;
      maxRun = Math.max(maxRun, currentRun);
    } else {
      currentRun = 1;
    }
  }

  return maxRun;
}

function detectElementaryLoop(beatTypes: readonly string[]): boolean {
  if (beatTypes.length < 6) return false;

  for (let cycleLength = 2; cycleLength <= 3; cycleLength += 1) {
    let repeating = true;
    for (let index = cycleLength; index < beatTypes.length; index += 1) {
      if (beatTypes[index] !== beatTypes[index % cycleLength]) {
        repeating = false;
        break;
      }
    }
    if (repeating) return true;
  }

  const uniqueBeatTypes = new Set(beatTypes);
  return uniqueBeatTypes.size <= 4;
}

function auditEmotionRepetition(
  evaluations: NarrativeSceneEvaluation[],
  bundles: FiveShotBundleEntry[]
): NarrativeQualityGateViolation[] {
  const violations: NarrativeQualityGateViolation[] = [];
  const globalMax = findMaxConsecutiveRepeat(
    evaluations.map((scene) => scene.emotion_id),
    (left, right) => left === right
  );

  if (globalMax >= 3) {
    violations.push({
      code: 'FAIL_EMOTION_REPETITION',
      message: `Global narrative repeats the same emotion ${globalMax} consecutive times`,
      field: 'integrated_emotion_timeline',
    });
  }

  for (const bundle of bundles) {
    const emotions = bundle.emotional_progression
      .map((token) => parseEmotionalProgressionToken(token)?.emotionId ?? 'unknown');
    const bundleMax = findMaxConsecutiveRepeat(emotions, (left, right) => left === right);
    if (bundleMax >= 3) {
      violations.push({
        code: 'FAIL_EMOTION_REPETITION',
        message: `Bundle ${bundle.bundle_id} repeats the same emotion ${bundleMax} consecutive times`,
        field: `${bundle.bundle_id}.emotional_progression`,
      });
    }
  }

  return violations;
}

function auditLocationRepetition(
  evaluations: NarrativeSceneEvaluation[],
  bundles: FiveShotBundleEntry[]
): NarrativeQualityGateViolation[] {
  const violations: NarrativeQualityGateViolation[] = [];

  for (let index = 1; index < bundles.length; index += 1) {
    if (bundles[index - 1].location_id === bundles[index].location_id) {
      violations.push({
        code: 'FAIL_LOCATION_REPETITION',
        message: `Adjacent bundles repeat location ${bundles[index].location_id}`,
        field: 'five_shot_bundle_ids',
      });
    }
  }

  for (const bundle of bundles) {
    const bundleScenes = evaluations.filter((scene) => scene.bundle_id === bundle.bundle_id);
    const uniqueAnchors = new Set(bundleScenes.map((scene) => scene.primary_daily_life_anchor));
    if (uniqueAnchors.size < 3) {
      violations.push({
        code: 'FAIL_LOCATION_REPETITION',
        message: `Bundle ${bundle.bundle_id} keeps one location but lacks daily-life variation (${uniqueAnchors.size} unique anchors)`,
        field: `${bundle.bundle_id}.location_id`,
      });
    }
  }

  const locationAnchorRuns = findMaxConsecutiveRepeat(
    evaluations.map((scene) => `${scene.location_id}:${scene.primary_daily_life_anchor}`),
    (left, right) => left === right
  );
  if (locationAnchorRuns >= 4) {
    violations.push({
      code: 'FAIL_LOCATION_REPETITION',
      message: `Narrative repeats the same location-anchor pair ${locationAnchorRuns} consecutive times`,
      field: 'integrated_location_timeline',
    });
  }

  return violations;
}

function auditActingRepetition(
  evaluations: NarrativeSceneEvaluation[],
  bundles: FiveShotBundleEntry[]
): NarrativeQualityGateViolation[] {
  const violations: NarrativeQualityGateViolation[] = [];

  for (const bundle of bundles) {
    const intents = new Set<string>();
    for (const token of bundle.acting_progression) {
      const acting = parseActingProgressionToken(token);
      if (!acting) continue;
      if (intents.has(acting.actingIntent)) {
        violations.push({
          code: 'FAIL_ACTING_REPETITION',
          message: `Bundle ${bundle.bundle_id} repeats acting intent "${acting.actingIntent}"`,
          field: `${bundle.bundle_id}.acting_progression`,
        });
      }
      intents.add(acting.actingIntent);
    }
  }

  const globalMax = findMaxConsecutiveRepeat(
    evaluations.map((scene) => scene.acting_intent),
    (left, right) => left === right
  );
  if (globalMax >= 3) {
    violations.push({
      code: 'FAIL_ACTING_REPETITION',
      message: `Global narrative repeats the same acting intent ${globalMax} consecutive times`,
      field: 'integrated_acting_timeline',
    });
  }

  return violations;
}

function auditDecisionRepetition(
  evaluations: NarrativeSceneEvaluation[],
  bundles: FiveShotBundleEntry[]
): NarrativeQualityGateViolation[] {
  const violations: NarrativeQualityGateViolation[] = [];

  for (const bundle of bundles) {
    const pairCounts = new Map<string, number>();
    for (const scene of evaluations.filter((entry) => entry.bundle_id === bundle.bundle_id)) {
      const pairKey = scene.decision_types.join('+');
      pairCounts.set(pairKey, (pairCounts.get(pairKey) ?? 0) + 1);
    }

    for (const [pairKey, count] of pairCounts.entries()) {
      if (count >= 2) {
        violations.push({
          code: 'FAIL_DECISION_REPETITION',
          message: `Bundle ${bundle.bundle_id} repeats decision pair ${pairKey}`,
          field: `${bundle.bundle_id}.character_decisions`,
        });
      }
    }
  }

  for (const characterId of ['CHAR-gonagi', 'CHAR-dana'] as const) {
    const decisions = getCharacterDecisionSeedLibrary().filter(
      (entry) => entry.character_id === characterId
    );
    const bundledDecisions = decisions.filter((entry) =>
      entry.scene_bindings.some((token) => {
        const sceneOrder = Number.parseInt(token.replace('segment:', ''), 10);
        return sceneOrder >= 1 && sceneOrder <= STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT;
      })
    );
    const typeCounts = new Map<SeedDecisionType, number>();
    for (const decision of bundledDecisions) {
      typeCounts.set(decision.decision_type, (typeCounts.get(decision.decision_type) ?? 0) + 1);
    }
    for (const [decisionType, count] of typeCounts.entries()) {
      if (count >= 6) {
        violations.push({
          code: 'FAIL_DECISION_REPETITION',
          message: `${characterId} repeats decision type ${decisionType} ${count} times across bundled scenes`,
          field: 'character_decision',
        });
      }
    }
  }

  return violations;
}

function auditCameraRepetition(bundles: FiveShotBundleEntry[]): NarrativeQualityGateViolation[] {
  const violations: NarrativeQualityGateViolation[] = [];

  for (const bundle of bundles) {
    const signatures = new Set<string>();
    const gazes = new Set<string>();

    for (const token of bundle.camera_progression) {
      const parsed = parseCameraProgressionToken(token);
      if (!parsed) continue;
      const signature = `${parsed.cameraAngle}|${parsed.bundleCameraDistance}|${parsed.primaryShot}`;
      if (signatures.has(signature)) {
        violations.push({
          code: 'FAIL_CAMERA_REPETITION',
          message: `Bundle ${bundle.bundle_id} repeats camera signature ${signature}`,
          field: `${bundle.bundle_id}.camera_progression`,
        });
      }
      if (gazes.has(parsed.gazeDirection)) {
        violations.push({
          code: 'FAIL_CAMERA_REPETITION',
          message: `Bundle ${bundle.bundle_id} repeats gaze direction within camera progression`,
          field: `${bundle.bundle_id}.camera_progression`,
        });
      }
      signatures.add(signature);
      gazes.add(parsed.gazeDirection);
    }
  }

  return violations;
}

function auditElementaryLoop(
  orchestration: StoryOrchestrationEntry,
  evaluations: NarrativeSceneEvaluation[]
): NarrativeQualityGateViolation[] {
  const violations: NarrativeQualityGateViolation[] = [];
  const beatTypes = evaluations.map((scene) => scene.beat_type);

  if (detectElementaryLoop(beatTypes)) {
    violations.push({
      code: 'FAIL_ELEMENTARY_LOOP',
      message: 'Bundled beat sequence collapses into an elementary repetition loop',
      field: 'output_story_beats',
    });
  }

  if (!orchestration.anti_repetition_rules.includes('no-elementary-repetition-story-loop')) {
    violations.push({
      code: 'FAIL_ELEMENTARY_LOOP',
      message: 'Story orchestration must declare no-elementary-repetition-story-loop guard',
      field: `${orchestration.orchestration_id}.anti_repetition_rules`,
    });
  }

  if (!orchestration.keywords.includes('anti-elementary-repetition')) {
    violations.push({
      code: 'FAIL_ELEMENTARY_LOOP',
      message: 'Story orchestration must declare anti-elementary-repetition intent',
      field: `${orchestration.orchestration_id}.keywords`,
    });
  }

  return violations;
}

function auditPredictableProgress(
  bundles: FiveShotBundleEntry[],
  evaluations: NarrativeSceneEvaluation[]
): NarrativeQualityGateViolation[] {
  const violations: NarrativeQualityGateViolation[] = [];

  for (const bundle of bundles) {
    const roles = bundle.emotional_progression.map(
      (token) => parseEmotionalProgressionToken(token)?.role ?? 'unknown'
    );
    for (const role of BUNDLE_SHOT_ROLES) {
      if (!roles.includes(role)) {
        violations.push({
          code: 'FAIL_PREDICTABLE_PROGRESS',
          message: `Bundle ${bundle.bundle_id} misses required shot role ${role}`,
          field: `${bundle.bundle_id}.emotional_progression`,
        });
      }
    }

    const uniqueEmotions = new Set(
      bundle.emotional_progression.map(
        (token) => parseEmotionalProgressionToken(token)?.emotionId ?? 'unknown'
      )
    );
    if (uniqueEmotions.size < 3) {
      violations.push({
        code: 'FAIL_PREDICTABLE_PROGRESS',
        message: `Bundle ${bundle.bundle_id} keeps fewer than 3 distinct emotional states`,
        field: `${bundle.bundle_id}.emotional_progression`,
      });
    }
  }

  const functionRuns = findMaxConsecutiveRepeat(
    evaluations.map((scene) => scene.narrative_function),
    (left, right) => left === right
  );
  if (functionRuns >= 4) {
    violations.push({
      code: 'FAIL_PREDICTABLE_PROGRESS',
      message: `Narrative function repeats ${functionRuns} consecutive times without turn`,
      field: 'narrative_turns',
    });
  }

  return violations;
}

function auditDramaticTension(evaluations: NarrativeSceneEvaluation[]): NarrativeQualityGateViolation[] {
  const violations: NarrativeQualityGateViolation[] = [];
  const tensionMarkers = evaluations.filter((scene) => TENSION_BEAT_TYPES.has(scene.beat_type));

  if (tensionMarkers.length < 5) {
    violations.push({
      code: 'FAIL_DRAMATIC_TENSION',
      message: `Bundled arc includes only ${tensionMarkers.length} dramatic tension markers (minimum 5)`,
      field: 'integrated_beat_timeline',
    });
  }

  const openingBeats = new Set(evaluations.slice(0, 3).map((scene) => scene.beat_type));
  const closingBeats = new Set(evaluations.slice(-3).map((scene) => scene.beat_type));
  const hasOpeningSetup = [...openingBeats].some((beat) =>
    ['waiting', 'memory', 'discovery', 'anticipation'].includes(beat)
  );
  const hasClosingPayoff = [...closingBeats].some((beat) =>
    ['reunion', 'redemption', 'growth', 'new_beginning', 'departure'].includes(beat)
  );

  if (!hasOpeningSetup || !hasClosingPayoff) {
    violations.push({
      code: 'FAIL_DRAMATIC_TENSION',
      message: 'Bundled arc lacks opening setup or closing payoff beats for music-drama tension',
      field: 'integrated_beat_timeline',
    });
  }

  const beats = getNarrativeBeatSeedLibrary();
  const intensitySpread = new Set(
    evaluations.map((scene) => {
      const beat = beats.find((entry) => entry.beat_type === scene.beat_type);
      return beat?.music_affinity[0] ?? scene.beat_type;
    })
  );
  if (intensitySpread.size < 4) {
    violations.push({
      code: 'FAIL_DRAMATIC_TENSION',
      message: 'Bundled arc does not spread dramatic intensity across enough music-grammar bands',
      field: 'integrated_beat_timeline',
    });
  }

  return violations;
}

function auditCharacterAgency(evaluations: NarrativeSceneEvaluation[]): NarrativeQualityGateViolation[] {
  const violations: NarrativeQualityGateViolation[] = [];
  const dualPassiveScenes = evaluations.filter(
    (scene) =>
      scene.decision_types.length === 2 &&
      scene.decision_types.every((decisionType) => PASSIVE_DECISION_TYPES.has(decisionType))
  );

  if (dualPassiveScenes.length > 3) {
    violations.push({
      code: 'FAIL_CHARACTER_AGENCY',
      message: `${dualPassiveScenes.length} bundled scenes leave both characters in passive decisions`,
      field: 'character_decision_refs',
    });
  }

  let consecutivePassiveOnly = 0;
  let maxPassiveOnly = 0;
  for (const scene of evaluations) {
    const hasActiveAgency = scene.decision_types.some((decisionType) =>
      ACTIVE_DECISION_TYPES.has(decisionType)
    );
    if (!hasActiveAgency) {
      consecutivePassiveOnly += 1;
      maxPassiveOnly = Math.max(maxPassiveOnly, consecutivePassiveOnly);
    } else {
      consecutivePassiveOnly = 0;
    }
  }

  if (maxPassiveOnly >= 3) {
    violations.push({
      code: 'FAIL_CHARACTER_AGENCY',
      message: `Narrative keeps characters passive for ${maxPassiveOnly} consecutive bundled scenes`,
      field: 'character_decision_refs',
    });
  }

  const activeSceneCount = evaluations.filter((scene) =>
    scene.decision_types.some((decisionType) => ACTIVE_DECISION_TYPES.has(decisionType))
  ).length;
  if (activeSceneCount < 10) {
    violations.push({
      code: 'FAIL_CHARACTER_AGENCY',
      message: `Only ${activeSceneCount} bundled scenes include active character agency`,
      field: 'character_decision_refs',
    });
  }

  return violations;
}

function auditBundleTransition(bundles: FiveShotBundleEntry[]): NarrativeQualityGateViolation[] {
  const violations: NarrativeQualityGateViolation[] = [];

  for (let index = 0; index < bundles.length; index += 1) {
    const bundle = bundles[index];
    const transition = bundle.bundle_transition_out;

    if (!BUNDLE_TRANSITION_PATTERN.test(transition)) {
      violations.push({
        code: 'FAIL_BUNDLE_TRANSITION',
        message: `Bundle ${bundle.bundle_id} has invalid transition grammar`,
        field: `${bundle.bundle_id}.bundle_transition_out`,
      });
      continue;
    }

    const targetScene = transition.split(':')[2];
    const expectedTarget =
      index < bundles.length - 1
        ? bundles[index + 1].scene_ids[0]
        : FIVE_SHOT_BUNDLE_FINALE_SCENE_ID;

    if (targetScene !== expectedTarget) {
      violations.push({
        code: 'FAIL_BUNDLE_TRANSITION',
        message: `Bundle ${bundle.bundle_id} transition must target ${expectedTarget}`,
        field: `${bundle.bundle_id}.bundle_transition_out`,
      });
    }

    const hasDramaKeyword = TRANSITION_DRAMA_KEYWORDS.some((keyword) =>
      transition.toLowerCase().includes(keyword)
    );
    if (!hasDramaKeyword) {
      violations.push({
        code: 'FAIL_BUNDLE_TRANSITION',
        message: `Bundle ${bundle.bundle_id} transition lacks dramatic handoff language`,
        field: `${bundle.bundle_id}.bundle_transition_out`,
      });
    }
  }

  return violations;
}

function auditEmotionalContrast(
  orchestration: StoryOrchestrationEntry,
  evaluations: NarrativeSceneEvaluation[],
  bundles: FiveShotBundleEntry[]
): NarrativeQualityGateViolation[] {
  const violations: NarrativeQualityGateViolation[] = [];

  for (let index = 1; index < evaluations.length; index += 1) {
    const previous = evaluations[index - 1];
    const current = evaluations[index];
    if (previous.primary_daily_life_anchor === current.primary_daily_life_anchor) {
      violations.push({
        code: 'FAIL_EMOTIONAL_CONTRAST',
        message: `Scenes ${previous.storyboard_id} and ${current.storyboard_id} repeat primary daily life anchor`,
        field: 'daily_life_anchor',
      });
    }
  }

  const transitionContrasts = orchestration.daily_life_contrast.filter((token) =>
    token.startsWith('contrast:scene-')
  );
  for (const contrast of transitionContrasts) {
    const pair = parseDailyLifeContrastPair(contrast);
    if (!pair || pair.fromAnchor === pair.toAnchor) {
      violations.push({
        code: 'FAIL_EMOTIONAL_CONTRAST',
        message: `Story orchestration contrast "${contrast}" does not create emotional contrast`,
        field: `${orchestration.orchestration_id}.daily_life_contrast`,
      });
    }
  }

  for (let index = 1; index < bundles.length; index += 1) {
    const previousBundleScenes = evaluations.filter(
      (scene) => scene.bundle_id === bundles[index - 1].bundle_id
    );
    const nextBundleScenes = evaluations.filter((scene) => scene.bundle_id === bundles[index].bundle_id);
    const previousEmotion = previousBundleScenes.at(-1)?.emotion_id;
    const nextEmotion = nextBundleScenes[0]?.emotion_id;
    if (previousEmotion && nextEmotion && previousEmotion === nextEmotion) {
      violations.push({
        code: 'FAIL_EMOTIONAL_CONTRAST',
        message: `Bundle boundary ${bundles[index - 1].bundle_id} -> ${bundles[index].bundle_id} lacks emotional contrast`,
        field: 'five_shot_bundle_ids',
      });
    }
  }

  for (const bundle of bundles) {
    const uniqueEmotions = new Set(
      bundle.emotional_progression.map(
        (token) => parseEmotionalProgressionToken(token)?.emotionId ?? 'unknown'
      )
    );
    if (uniqueEmotions.size < 3) {
      violations.push({
        code: 'FAIL_EMOTIONAL_CONTRAST',
        message: `Bundle ${bundle.bundle_id} lacks internal emotional contrast`,
        field: `${bundle.bundle_id}.emotional_progression`,
      });
    }
  }

  return violations;
}

function primaryFailure(
  violations: NarrativeQualityGateViolation[]
): NarrativeQualityGateAuditResult {
  const priority: NarrativeQualityGateAuditResult[] = [
    'FAIL_ELEMENTARY_LOOP',
    'FAIL_EMOTION_REPETITION',
    'FAIL_LOCATION_REPETITION',
    'FAIL_ACTING_REPETITION',
    'FAIL_DECISION_REPETITION',
    'FAIL_CAMERA_REPETITION',
    'FAIL_PREDICTABLE_PROGRESS',
    'FAIL_DRAMATIC_TENSION',
    'FAIL_CHARACTER_AGENCY',
    'FAIL_BUNDLE_TRANSITION',
    'FAIL_EMOTIONAL_CONTRAST',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditNarrativeQualityGate(
  orchestration: StoryOrchestrationEntry,
  bundles: FiveShotBundleEntry[],
  storyExport: StoryDrivenImageAppExport,
  decisionById: Map<string, CharacterDecisionEntry>
): NarrativeQualityGateViolation[] {
  const evaluations = buildSceneEvaluations(bundles, orchestration, storyExport, decisionById);
  const violations: NarrativeQualityGateViolation[] = [];

  violations.push(...auditEmotionRepetition(evaluations, bundles));
  violations.push(...auditLocationRepetition(evaluations, bundles));
  violations.push(...auditActingRepetition(evaluations, bundles));
  violations.push(...auditDecisionRepetition(evaluations, bundles));
  violations.push(...auditCameraRepetition(bundles));
  violations.push(...auditElementaryLoop(orchestration, evaluations));
  violations.push(...auditPredictableProgress(bundles, evaluations));
  violations.push(...auditDramaticTension(evaluations));
  violations.push(...auditCharacterAgency(evaluations));
  violations.push(...auditBundleTransition(bundles));
  violations.push(...auditEmotionalContrast(orchestration, evaluations, bundles));

  return violations;
}

function countDualPassiveScenes(evaluations: NarrativeSceneEvaluation[]): number {
  return evaluations.filter(
    (scene) =>
      scene.decision_types.length === 2 &&
      scene.decision_types.every((decisionType) => PASSIVE_DECISION_TYPES.has(decisionType))
  ).length;
}

export function writeNarrativeQualityGateReport(
  projectRoot: string,
  report: NarrativeQualityGateReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runNarrativeQualityGate(projectRoot: string): NarrativeQualityGateReport {
  void projectRoot;
  const auditTimestamp = new Date().toISOString();
  const orchestration = getStoryOrchestrationById(STORY_ORCHESTRATION_ID);
  const bundles = getFiveShotBundleSeedLibrary();
  const storyExport = buildStoryDrivenImageAppExport();
  const decisionById = buildDecisionLookup(getCharacterDecisionSeedLibrary());

  if (!orchestration) {
    throw new Error(`Missing story orchestration ${STORY_ORCHESTRATION_ID}`);
  }

  const evaluations = buildSceneEvaluations(bundles, orchestration, storyExport, decisionById);
  const violations = auditNarrativeQualityGate(
    orchestration,
    bundles,
    storyExport,
    decisionById
  );
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: NarrativeQualityGateReport = {
    auditTimestamp,
    auditResult,
    layer_version: NARRATIVE_QUALITY_GATE_VERSION,
    scene_count: evaluations.length,
    bundle_count: bundles.length,
    upstream_references: {
      orchestration_id: orchestration.orchestration_id,
      story_driven_export_id: storyExport.export_id,
      story_driven_export_path: STORY_DRIVEN_IMAGE_APP_EXPORT_JSON_PATH,
      story_engine_ready: storyExport.story_engine_ready,
    },
    evaluation_summary: {
      unique_beat_types: new Set(evaluations.map((scene) => scene.beat_type)).size,
      unique_emotions: new Set(evaluations.map((scene) => scene.emotion_id)).size,
      dual_passive_scene_count: countDualPassiveScenes(evaluations),
      bundle_transition_count: bundles.length,
      dramatic_tension_markers: evaluations.filter((scene) => TENSION_BEAT_TYPES.has(scene.beat_type))
        .length,
    },
    violations,
  };

  writeNarrativeQualityGateReport(projectRoot, report);
  return report;
}

export function getIntegratedNarrativeSceneEvaluations(): NarrativeSceneEvaluation[] {
  const orchestration = getStoryOrchestrationById(STORY_ORCHESTRATION_ID);
  const bundles = getFiveShotBundleSeedLibrary();
  const storyExport = buildStoryDrivenImageAppExport();
  const decisionById = buildDecisionLookup(getCharacterDecisionSeedLibrary());
  if (!orchestration) {
    throw new Error(`Missing story orchestration ${STORY_ORCHESTRATION_ID}`);
  }
  return buildSceneEvaluations(bundles, orchestration, storyExport, decisionById);
}

export { ANTI_REPETITION_RULES_BASE, STORY_DRIVEN_IMAGE_APP_EXPORT_ID };
