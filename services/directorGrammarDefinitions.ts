import {
  getImageActingCameraById,
  type ImageActingCameraGrammarEntry,
} from './imageActingCameraGrammarDefinitions.js';
import {
  getBundleShotRole,
  getFiveShotBundleSeedLibrary,
  type FiveShotBundleEntry,
} from './fiveShotBundleDefinitions.js';
import {
  buildStoryDrivenImageAppExport,
  STORY_DRIVEN_IMAGE_APP_EXPORT_ID,
  STORY_DRIVEN_IMAGE_APP_EXPORT_JSON_PATH,
  STORY_DRIVEN_IMAGE_APP_EXPORT_SONG_MASTER_ID,
  STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT,
  type StoryDrivenImageGenerationPayload,
} from './storyDrivenImageAppExport.js';
import { parseOutputStoryBeatToken } from './storyOrchestrationDefinitions.js';

export const DIRECTOR_GRAMMAR_VERSION = 'DIRECTOR-GRAMMAR-PHASE-99-v1' as const;
export const DIRECTOR_GRAMMAR_SEED_COUNT = STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT;
export const DIRECTOR_GRAMMAR_SONG_MASTER_ID = STORY_DRIVEN_IMAGE_APP_EXPORT_SONG_MASTER_ID;
export const NARRATIVE_QUALITY_GATE_LAYER_VERSION = 'NARRATIVE-QUALITY-GATE-PHASE-98-v1' as const;
export const NARRATIVE_QUALITY_GATE_REPORT_PATH = 'exports/narrative-quality-gate-report.json' as const;

export const ANTI_FLAT_SCENE_RULES_BASE = [
  'no-exposition-tableau-without-subtext',
  'no-decoration-only-composition',
  'require-character-need-for-every-frame',
  'no-static-mirror-without-emotional-pressure',
  'require-directorial-contrast-or-release',
  'no-ai-studio-generation',
] as const;

export const REQUIRED_DIRECTOR_GRAMMAR_FIELDS = [
  'director_grammar_id',
  'storyboard_id',
  'bundle_id',
  'scene_order',
  'directorial_intent',
  'camera_reason',
  'blocking_reason',
  'silence_or_action',
  'emotional_subtext',
  'cut_purpose',
  'visual_motif_usage',
  'anti_flat_scene_rules',
  'keywords',
] as const;

export type RequiredDirectorGrammarField = (typeof REQUIRED_DIRECTOR_GRAMMAR_FIELDS)[number];

export interface DirectorGrammarEntry {
  director_grammar_id: string;
  storyboard_id: string;
  bundle_id: string;
  scene_order: number;
  directorial_intent: string;
  camera_reason: string;
  blocking_reason: string;
  silence_or_action: string;
  emotional_subtext: string;
  cut_purpose: string;
  visual_motif_usage: string[];
  anti_flat_scene_rules: string[];
  keywords: string[];
}

export interface DirectorGrammarPreview {
  layer_version: typeof DIRECTOR_GRAMMAR_VERSION;
  seed_count: typeof DIRECTOR_GRAMMAR_SEED_COUNT;
  song_master_id: typeof DIRECTOR_GRAMMAR_SONG_MASTER_ID;
  required_fields: RequiredDirectorGrammarField[];
  anti_flat_scene_rules_base: readonly string[];
  upstream_references: {
    story_driven_export_id: typeof STORY_DRIVEN_IMAGE_APP_EXPORT_ID;
    story_driven_export_path: typeof STORY_DRIVEN_IMAGE_APP_EXPORT_JSON_PATH;
    narrative_quality_gate_version: typeof NARRATIVE_QUALITY_GATE_LAYER_VERSION;
    narrative_quality_gate_report_path: typeof NARRATIVE_QUALITY_GATE_REPORT_PATH;
  };
  pipeline_chain: [
    'narrative_quality_gate',
    'story_driven_image_app_export',
    'five_shot_bundle',
    'image_acting_camera_grammar',
    'director_grammar',
  ];
  seed_director_grammar: DirectorGrammarEntry[];
}

type BundleShotRole = 'establish' | 'observe' | 'emotional_change' | 'interaction' | 'transition';

interface DirectorShotProfile {
  directorial_intent: string;
  camera_reason: string;
  blocking_reason: string;
  silence_or_action: string;
  emotional_subtext: string;
  cut_purpose: string;
  visual_motif_usage: string[];
}

const ROLE_CUT_PURPOSE: Record<BundleShotRole, string> = {
  establish:
    'Open the bundle geography and emotional contract before dialogue or action accelerates',
  observe:
    'Hold observational distance so the audience reads private feeling before intervention',
  emotional_change:
    'Turn the scene axis when unspoken tension must become visible relational shift',
  interaction:
    'Compress blocking into contact or refusal so the music-drama beat lands physically',
  transition:
    'Release the bundle with a directed handoff that primes the next location or finale',
};

const BEAT_MOTIF: Record<string, string[]> = {
  waiting: ['motif:waiting-to-reunion', 'motif:daily-life-anchor-ritual'],
  memory: ['motif:window-reflection-memory', 'motif:protective-presence'],
  discovery: ['motif:gonagi-dana-bond-thread', 'motif:daily-life-anchor-ritual'],
  distance: ['motif:transit-departure-return', 'motif:protective-presence'],
  longing: ['motif:rain-to-clear-healing', 'motif:window-reflection-memory'],
  hope: ['motif:sunset-bridge-hope', 'motif:transit-departure-return'],
  journey: ['motif:transit-departure-return', 'motif:daily-life-anchor-ritual'],
  conflict: ['motif:gonagi-dana-bond-thread', 'motif:protective-presence'],
  sacrifice: ['motif:transit-departure-return', 'motif:protective-presence'],
  healing: ['motif:rain-to-clear-healing', 'motif:protective-presence'],
  forgiveness: ['motif:gonagi-dana-bond-thread', 'motif:daily-life-anchor-ritual'],
  reunion: ['motif:waiting-to-reunion', 'motif:gonagi-dana-bond-thread'],
  departure: ['motif:transit-departure-return', 'motif:sunset-bridge-hope'],
  growth: ['motif:protective-presence', 'motif:daily-life-anchor-ritual'],
  redemption: ['motif:rain-to-clear-healing', 'motif:waiting-to-reunion'],
};

function buildAntiFlatSceneRules(sceneOrder: number, bundleRole: string): string[] {
  return [
    ...ANTI_FLAT_SCENE_RULES_BASE,
    `bundle-role:${bundleRole}`,
    `scene-order:${sceneOrder}`,
    'require-motif-or-contrast-anchor',
    'no-flat-master-shot-without-directorial-pressure',
  ];
}

function buildDirectorShotProfile(
  role: BundleShotRole,
  beatType: string,
  acting: ImageActingCameraGrammarEntry,
  payload: StoryDrivenImageGenerationPayload
): DirectorShotProfile {
  const primaryAnchor = payload.daily_life_anchor[0] ?? 'daily-life';
  const motifs = BEAT_MOTIF[beatType] ?? ['motif:gonagi-dana-bond-thread'];

  const directorial_intent = [
    `Direct ${role} beat for ${beatType} as a master-shot moment:`,
    acting.acting_intent,
    `Anchor the drama in ${primaryAnchor} without flattening it into exposition.`,
  ].join(' ');

  const camera_reason = [
    `${acting.camera_angle} at ${acting.camera_distance} because the frame must`,
    `serve ${role} grammar while preserving off-lens intimacy (${acting.gaze_direction}).`,
    `Movement hint: ${acting.camera_movement_hint}.`,
  ].join(' ');

  const blocking_reason = [
    acting.subject_blocking,
    `Environment use (${acting.environment_interaction}) justifies placement;`,
    `posture ${acting.posture_variation} prevents a static tableau reading.`,
  ].join(' ');

  const silence_or_action =
    role === 'observe' || role === 'transition'
      ? `Hold controlled silence in ${acting.body_action}; let ${acting.hand_action} carry the beat without dialogue.`
      : `Drive visible action through ${acting.body_action} and ${acting.hand_action}; silence only where gaze withholds speech.`;

  const emotional_subtext = [
    `Under ${beatType}, the scene hides ${payload.narrative_turn.split(':')[3] ?? 'relational pressure'}`,
    `while the audience reads guardian-companion bond tension through ${primaryAnchor}.`,
  ].join(' ');

  const cut_purpose = ROLE_CUT_PURPOSE[role];

  return {
    directorial_intent,
    camera_reason,
    blocking_reason,
    silence_or_action,
    emotional_subtext,
    cut_purpose,
    visual_motif_usage: [...motifs, `anchor:${primaryAnchor}`],
  };
}

function buildDirectorGrammarEntry(
  bundle: FiveShotBundleEntry,
  sceneIndex: number,
  payload: StoryDrivenImageGenerationPayload,
  acting: ImageActingCameraGrammarEntry
): DirectorGrammarEntry {
  const role = getBundleShotRole(sceneIndex) as BundleShotRole;
  const parsedBeat = parseOutputStoryBeatToken(payload.story_beat);
  const beatType = parsedBeat?.beatType ?? 'unknown';
  const profile = buildDirectorShotProfile(role, beatType, acting, payload);

  return {
    director_grammar_id: `DGR-${payload.storyboard_id}`,
    storyboard_id: payload.storyboard_id,
    bundle_id: bundle.bundle_id,
    scene_order: acting.scene_order,
    directorial_intent: profile.directorial_intent,
    camera_reason: profile.camera_reason,
    blocking_reason: profile.blocking_reason,
    silence_or_action: profile.silence_or_action,
    emotional_subtext: profile.emotional_subtext,
    cut_purpose: profile.cut_purpose,
    visual_motif_usage: [...profile.visual_motif_usage],
    anti_flat_scene_rules: buildAntiFlatSceneRules(acting.scene_order, role),
    keywords: [
      'director-grammar',
      DIRECTOR_GRAMMAR_SONG_MASTER_ID,
      `story-driven-export:${STORY_DRIVEN_IMAGE_APP_EXPORT_ID}`,
      `narrative-quality-gate:${NARRATIVE_QUALITY_GATE_LAYER_VERSION}`,
      `bundle:${bundle.bundle_id}`,
      `bundle-role:${role}`,
      `acting-camera:${acting.acting_camera_id}`,
      `storyboard:${payload.storyboard_id}`,
      `beat:${beatType}`,
      `payload:${payload.payload_id}`,
    ],
  };
}

export function getDirectorGrammarSeedLibrary(): DirectorGrammarEntry[] {
  const storyExport = buildStoryDrivenImageAppExport();
  const bundles = getFiveShotBundleSeedLibrary();
  const entries: DirectorGrammarEntry[] = [];

  for (const bundle of bundles) {
    bundle.scene_ids.forEach((storyboardId, index) => {
      const payload = storyExport.image_generation_payloads.find(
        (entry) => entry.storyboard_id === storyboardId
      );
      if (!payload) {
        throw new Error(`Missing story driven payload for ${storyboardId}`);
      }

      const acting = getImageActingCameraById(payload.acting_camera_id);
      if (!acting) {
        throw new Error(`Missing acting camera grammar for ${payload.acting_camera_id}`);
      }

      entries.push(buildDirectorGrammarEntry(bundle, index, payload, acting));
    });
  }

  return entries
    .sort((left, right) => left.scene_order - right.scene_order)
    .map((entry) => ({
      ...entry,
      visual_motif_usage: [...entry.visual_motif_usage],
      anti_flat_scene_rules: [...entry.anti_flat_scene_rules],
      keywords: [...entry.keywords],
    }));
}

export function buildDirectorGrammarPreview(): DirectorGrammarPreview {
  return {
    layer_version: DIRECTOR_GRAMMAR_VERSION,
    seed_count: DIRECTOR_GRAMMAR_SEED_COUNT,
    song_master_id: DIRECTOR_GRAMMAR_SONG_MASTER_ID,
    required_fields: [...REQUIRED_DIRECTOR_GRAMMAR_FIELDS],
    anti_flat_scene_rules_base: [...ANTI_FLAT_SCENE_RULES_BASE],
    upstream_references: {
      story_driven_export_id: STORY_DRIVEN_IMAGE_APP_EXPORT_ID,
      story_driven_export_path: STORY_DRIVEN_IMAGE_APP_EXPORT_JSON_PATH,
      narrative_quality_gate_version: NARRATIVE_QUALITY_GATE_LAYER_VERSION,
      narrative_quality_gate_report_path: NARRATIVE_QUALITY_GATE_REPORT_PATH,
    },
    pipeline_chain: [
      'narrative_quality_gate',
      'story_driven_image_app_export',
      'five_shot_bundle',
      'image_acting_camera_grammar',
      'director_grammar',
    ],
    seed_director_grammar: getDirectorGrammarSeedLibrary(),
  };
}

export function findDuplicateDirectorGrammarIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates].sort();
}

export function getDirectorGrammarById(
  directorGrammarId: string
): DirectorGrammarEntry | undefined {
  return getDirectorGrammarSeedLibrary().find(
    (entry) => entry.director_grammar_id === directorGrammarId
  );
}

export function getDirectorGrammarByStoryboardId(
  storyboardId: string
): DirectorGrammarEntry | undefined {
  return getDirectorGrammarSeedLibrary().find((entry) => entry.storyboard_id === storyboardId);
}
