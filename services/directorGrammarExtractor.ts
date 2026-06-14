import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import {
  FINAL_SET_PATH,
  type SourceVideoCategory,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DIRECTOR_GRAMMAR_PHASE =
  'PHASE-SOURCE-VIDEO-003-DIRECTOR_GRAMMAR_EXTRACTION_V1' as const;
export const DIRECTOR_GRAMMAR_REGISTRY_PATH =
  'datasets/director_grammar/director-grammar-registry.json' as const;
export const DIRECTOR_GRAMMAR_SCHEMA_PATH =
  'datasets/director_grammar/director-grammar.schema.json' as const;

export const EXTRACTABLE_FAMILIES = Object.freeze([
  'GHIBLI',
  'SHINKAI',
  'LIVE_ACTION',
  'MORI',
] as const);

export type ExtractableFamily = (typeof EXTRACTABLE_FAMILIES)[number];

export type GrammarBlock = {
  summary: string;
  patterns: string[];
  constraints: string[];
};

export type DirectorGrammarProfile = {
  grammar_id: string;
  phase: typeof DIRECTOR_GRAMMAR_PHASE;
  source_family: ExtractableFamily;
  source_video_ids: string[];
  visual_style: GrammarBlock;
  camera_grammar: GrammarBlock;
  lighting_grammar: GrammarBlock;
  blocking_grammar: GrammarBlock;
  emotion_grammar: GrammarBlock;
  environment_grammar: GrammarBlock;
  motion_grammar: GrammarBlock;
  transition_grammar: GrammarBlock;
  use_case: string[];
  design_only: true;
  gpu_execution: false;
  extracted_at: string;
};

export const FAMILY_GRAMMAR_PATHS: Record<ExtractableFamily, string> = {
  GHIBLI: 'datasets/director_grammar/ghibli-director-grammar.json',
  SHINKAI: 'datasets/director_grammar/shinkai-director-grammar.json',
  LIVE_ACTION: 'datasets/director_grammar/live-action-director-grammar.json',
  MORI: 'datasets/director_grammar/mori-director-grammar.json',
};

const FAMILY_DESIGN_SEEDS: Record<
  ExtractableFamily,
  Omit<DirectorGrammarProfile, 'source_video_ids' | 'extracted_at'>
> = {
  GHIBLI: {
    grammar_id: 'director_grammar_ghibli_v1',
    phase: DIRECTOR_GRAMMAR_PHASE,
    source_family: 'GHIBLI',
    visual_style: {
      summary: 'Hand-painted warmth, domestic intimacy, and Mediterranean-adaptable pastoral clarity.',
      patterns: [
        'soft-line character silhouettes',
        'warm domestic interiors',
        'readable environmental storytelling',
        'gentle fantasy realism',
        'harbor-and-village world cues',
      ],
      constraints: [
        'no-neon-city-tokens',
        'no-hard-cgi-shine',
        'preserve-handcrafted-surface-read',
      ],
    },
    camera_grammar: {
      summary: 'Patient observational framing with gentle movement and human-scale perspective.',
      patterns: [
        'establishing-wide before intimacy',
        'eye-level dialogue pairs',
        'tracking-walk with deep focus',
        'task-detail close-ups',
        'rear-follow departure shots',
        'aerial harbor sweeps',
      ],
      constraints: [
        'no-handheld-chaos',
        'no-unmotivated-dutch-tilt',
        'motivate-cuts-with-emotional-beat',
      ],
    },
    lighting_grammar: {
      summary: 'Naturalistic daylight with warm interior practicals and soft shadow rolloff.',
      patterns: [
        'morning-window wash',
        'golden-hour exterior glow',
        'hearth-interior warmth',
        'overcast-soft diffusion',
        'lantern-practical accents',
      ],
      constraints: ['no-flat-studio-key', 'no-unmotivated-rim-only-portraits'],
    },
    blocking_grammar: {
      summary: 'Characters anchored to domestic tasks, shared meals, and purposeful path movement.',
      patterns: [
        'seated-conversation triangles',
        'counter-exchange staging',
        'doorway-threshold pauses',
        'work-surface hand dominance',
        'paired-walk with social spacing',
      ],
      constraints: ['no-empty-center-stage-posing', 'require-object-or-task-anchor'],
    },
    emotion_grammar: {
      summary: 'Quiet emotional arcs expressed through gesture, pause, and environmental reaction.',
      patterns: [
        'warmth-through-routine',
        'longing-in-departure',
        'joy-in-small-discovery',
        'calm-after-storm',
        'reunion-in-shared-space',
      ],
      constraints: ['no-melodrama-exposition', 'subtext-over-dialogue-carry'],
    },
    environment_grammar: {
      summary: 'Lived-in villages, harbors, rooftops, and domestic rooms with tactile detail.',
      patterns: [
        'mediterranean-harbor',
        'village-street-life',
        'domestic-kitchen',
        'rooftop-horizon',
        'workshop-craft-space',
      ],
      constraints: ['no-future-tech-props', 'no-identity-breaking-landmark-swap'],
    },
    motion_grammar: {
      summary: 'Deliberate walking rhythms, task motions, and gentle environmental drift.',
      patterns: [
        'slow-contemplative-walk',
        'meal-prep-task-motion',
        'departure-trail',
        'street-crossing',
        'object-handoff',
      ],
      constraints: ['no-action-chase-default', 'motion-must-support-emotion'],
    },
    transition_grammar: {
      summary: 'Geography-linked cuts and time-of-day bridges rather than shock edits.',
      patterns: [
        'doorway-to-exterior-match',
        'walk-through-dissolve',
        'time-of-day-wipe',
        'object-continuity-bridge',
        'horizon-match-cut',
      ],
      constraints: ['no-random-flash-cuts', 'preserve-spatial-continuity'],
    },
    use_case: [
      'Gonegi domestic harbor scenes',
      'music-drama warmth beats',
      'character-continuity reference for Mediterranean adaptation',
    ],
    design_only: true,
    gpu_execution: false,
  },
  SHINKAI: {
    grammar_id: 'director_grammar_shinkai_v1',
    phase: DIRECTOR_GRAMMAR_PHASE,
    source_family: 'SHINKAI',
    visual_style: {
      summary: 'Hyper-detailed backgrounds, luminous skies, and precise atmospheric perspective.',
      patterns: [
        'photoreal-sky gradients',
        'specular-rain-surfaces',
        'urban-depth layering',
        'lens-flare discipline',
        'emotional-color-temperature shifts',
      ],
      constraints: [
        'no-muddy-flat-backgrounds',
        'preserve-atmospheric-depth-cues',
        'avoid-over-sharpened-faces',
      ],
    },
    camera_grammar: {
      summary: 'Composed vistas and intimate close-ups with strong horizon geometry.',
      patterns: [
        'sky-dominant establishing frames',
        'rail-and-window framing',
        'tele-compressed depth',
        'profile-close emotional holds',
        'slow-push on revelation',
      ],
      constraints: ['no-unmotivated-zoom', 'horizon-must-anchor-composition'],
    },
    lighting_grammar: {
      summary: 'Dramatic sky light, rain reflections, and twilight color separation.',
      patterns: [
        'sunset-gradient backlight',
        'rain-street reflection pools',
        'blue-hour interior contrast',
        'cloud-break god-rays',
        'neon-free natural urban glow',
      ],
      constraints: ['no-flat-noon-exterior', 'light-must-motivate-mood-shift'],
    },
    blocking_grammar: {
      summary: 'Solitary figures against vast environments; distance as emotional language.',
      patterns: [
        'figure-at-rail',
        'bench-separated-pair',
        'threshold-wait',
        'crowd-island staging',
        'phone-or-letter-focal-point',
      ],
      constraints: ['no-crowd-filled-intimacy', 'preserve-negative-space'],
    },
    emotion_grammar: {
      summary: 'Longing, separation, and fragile hope carried by weather and light.',
      patterns: [
        'longing-through-distance',
        'hope-in-sky-break',
        'separation-in-transit',
        'memory-trigger-object',
        'quiet-reunion-hold',
      ],
      constraints: ['no-comedic-relief-break', 'emotion-tied-to-atmosphere'],
    },
    environment_grammar: {
      summary: 'Transit corridors, elevated vistas, rain streets, and sky-heavy exteriors.',
      patterns: [
        'elevated-overlook',
        'rain-platform',
        'urban-stair-landing',
        'cloud-canopy',
        'transit-window-frame',
      ],
      constraints: ['no-fantasy-creature-default', 'keep-era-agnostic-urban-read'],
    },
    motion_grammar: {
      summary: 'Slow drift, transit movement, and weather-driven environmental motion.',
      patterns: [
        'train-pass drift',
        'rain-fall overlay',
        'cloud-scroll',
        'slow-turn-to-horizon',
        'umbrella-walk',
      ],
      constraints: ['no-fast-action-default', 'motion-subordinate-to-mood'],
    },
    transition_grammar: {
      summary: 'Sky match cuts, weather bridges, and light-change dissolves.',
      patterns: [
        'sky-color-match',
        'rain-to-clear dissolve',
        'window-reflection-bridge',
        'transit-departure-cut',
        'time-lapse-cloud-bridge',
      ],
      constraints: ['no-hard-jump-without-motif', 'preserve-emotional-thread'],
    },
    use_case: [
      'harbor reunion longing beats',
      'sky-and-weather emotional overlays',
      'Mediterranean twilight reference',
    ],
    design_only: true,
    gpu_execution: false,
  },
  LIVE_ACTION: {
    grammar_id: 'director_grammar_live_action_v1',
    phase: DIRECTOR_GRAMMAR_PHASE,
    source_family: 'LIVE_ACTION',
    visual_style: {
      summary: 'Period domestic realism with natural skin texture and practical set authenticity.',
      patterns: [
        'period-costume-texture',
        'practical-set-wear',
        'natural-skin-tones',
        'candle-and-window practicals',
        'ensemble-blocking realism',
      ],
      constraints: [
        'no-anime-line-simplification',
        'no-synthetic-plastic-skin',
        'preserve-period-material-truth',
      ],
    },
    camera_grammar: {
      summary: 'Classical scene coverage with restrained movement and dialogue-forward framing.',
      patterns: [
        'master-two-shot',
        'over-shoulder-dialogue',
        'table-level ensemble',
        'entry-door reveal',
        'static-emotional-hold',
      ],
      constraints: ['no-unmotivated-steadicam-orbit', 'coverage-must-support-dialogue'],
    },
    lighting_grammar: {
      summary: 'Soft window key, fireplace fill, and low-contrast interior realism.',
      patterns: [
        'window-side-key',
        'fireplace-warm-fill',
        'candle-practical-accent',
        'overcast-day-interior',
        'evening-lamp-practical',
      ],
      constraints: ['no-high-key-fashion-lighting', 'no-unmotivated-backlight-halo'],
    },
    blocking_grammar: {
      summary: 'Family ensemble around hearth, table, and doorway social geometry.',
      patterns: [
        'hearth-circle',
        'dining-table-ensemble',
        'doorway-greeting',
        'writing-desk-focus',
        'sibling-pair-counterpoint',
      ],
      constraints: ['no-empty-theater-staging', 'blocking-must-imply-relationship'],
    },
    emotion_grammar: {
      summary: 'Restrained period emotion through glance, posture, and domestic ritual.',
      patterns: [
        'pride-in-composure',
        'tenderness-in-small-gesture',
        'grief-in-silence',
        'hope-in-letter-or-gift',
        'sibling-rivalry-subtext',
      ],
      constraints: ['no-broad-comedy-default', 'subtext-through-props-and-posture'],
    },
    environment_grammar: {
      summary: '19th-century domestic interiors, snowy exteriors, and modest period streets.',
      patterns: [
        'parlor-interior',
        'snowy-lane',
        'writing-room',
        'kitchen-hearth',
        'modest-street-exterior',
      ],
      constraints: [
        'no-modern-prop-intrusion',
        'adapt-to-mediterranean-period-equivalent-when-remapped',
      ],
    },
    motion_grammar: {
      summary: 'Naturalistic walking, seated gestures, and ritualized domestic tasks.',
      patterns: [
        'seated-gesture',
        'doorway-entry',
        'letter-reading-pause',
        'ensemble-table-service',
        'slow-exit-down-lane',
      ],
      constraints: ['no-stylized-anime-motion', 'motion-grounded-in-period-behavior'],
    },
    transition_grammar: {
      summary: 'Scene-to-scene classical cuts anchored by room geography and season.',
      patterns: [
        'room-to-room-cut',
        'seasonal-exterior-bridge',
        'object-continuity-cut',
        'time-pass-montage',
        'dialogue-motivated-cut',
      ],
      constraints: ['no-music-video-montage-default', 'preserve-spatial-logic'],
    },
    use_case: [
      'ensemble relationship reference',
      'period domestic blocking for Gonegi adaptation',
      'live-action realism anchor for hybrid pipelines',
    ],
    design_only: true,
    gpu_execution: false,
  },
  MORI: {
    grammar_id: 'director_grammar_mori_v1',
    phase: DIRECTOR_GRAMMAR_PHASE,
    source_family: 'MORI',
    visual_style: {
      summary: 'Pastoral woodland craft life with tactile nature surfaces and village rhythm.',
      patterns: [
        'forest-floor-texture',
        'craft-material-closeups',
        'village-earth-tones',
        'seasonal-nature-palette',
        'animal-companion-presence',
      ],
      constraints: [
        'no-urban-glass-tower-default',
        'preserve-woodland-tactility',
        'no-identity-breaking-ecology-swap',
      ],
    },
    camera_grammar: {
      summary: 'Grounded nature framing with profile detail and path-following movement.',
      patterns: [
        'forest-path-wide',
        'forage-detail-close',
        'village-walk-mid-wide',
        'two-shot-porch',
        'rain-walk-tracking',
        'valley-bridge-extreme-wide',
      ],
      constraints: ['no-aerial-showoff-without-purpose', 'camera-respects-human-scale'],
    },
    lighting_grammar: {
      summary: 'Canopy-dappled daylight, hearth warmth, lantern evening, and rain-soft diffusion.',
      patterns: [
        'canopy-dappled-day',
        'hearth-interior-glow',
        'lantern-evening-path',
        'rain-overcast-soft',
        'creek-reflection-glint',
      ],
      constraints: ['no-studio-flat-exterior', 'light-motivated-by-season-and-weather'],
    },
    blocking_grammar: {
      summary: 'Craft tasks, foraging, market exchange, and companion walks as staging anchors.',
      patterns: [
        'forage-crouch',
        'loom-seated-work',
        'market-stall-exchange',
        'companion-walk-pair',
        'festival-banner-carry',
      ],
      constraints: ['no-idle-center-posing', 'require-task-or-path-anchor'],
    },
    emotion_grammar: {
      summary: 'Calm focus, social warmth, patience, and gentle reunion hints.',
      patterns: [
        'calm-foraging-focus',
        'craft-contentment',
        'social-warmth-at-market',
        'patience-in-rain-wait',
        'reunion-hint-at-bridge',
      ],
      constraints: ['no-high-drama-melodrama', 'emotion-through-activity-not-speech'],
    },
    environment_grammar: {
      summary: 'Woodland paths, village craft spaces, bridges, docks, and apiary fields.',
      patterns: [
        'forest-trail',
        'village-market',
        'wooden-bridge',
        'river-dock',
        'apiary-field',
        'shrine-steps',
      ],
      constraints: ['normalize-to-mediterranean-woodland-harbor-when-adapted'],
    },
    motion_grammar: {
      summary: 'Foraging, craft work, festival carry, ferry wait, and path walking.',
      patterns: [
        'foraging-motion',
        'loom-shuttle-task',
        'bridge-cross',
        'ferry-wait',
        'festival-carry',
        'rain-shelter-stand',
      ],
      constraints: ['no-chase-sequence-default', 'motion-tied-to-daily-life'],
    },
    transition_grammar: {
      summary: 'Path continuity, weather shifts, and craft-to-outdoor geography bridges.',
      patterns: [
        'path-to-village-cut',
        'rain-to-lantern-bridge',
        'craft-to-market-transition',
        'bridge-to-dock-match',
        'seasonal-field-dissolve',
      ],
      constraints: ['no-random-montage', 'preserve-daily-life-rhythm'],
    },
    use_case: [
      'MORI woodland-to-Mediterranean village normalization',
      'craft-and-animal continuity reference',
      'daily-life motion grammar for Gonegi scenes',
    ],
    design_only: true,
    gpu_execution: false,
  },
};

export function loadSourceVideoFinalSet(projectRoot?: string): SourceVideoFinalSet | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

export function getActiveVideosByFamily(
  finalSet: SourceVideoFinalSet,
  family: ExtractableFamily
): string[] {
  return finalSet.videos
    .filter((v) => v.tier === 'active' && v.category === family)
    .map((v) => v.source_video_id)
    .sort();
}

export function extractDirectorGrammarProfile(
  finalSet: SourceVideoFinalSet,
  family: ExtractableFamily
): DirectorGrammarProfile {
  const seed = FAMILY_DESIGN_SEEDS[family];
  const source_video_ids = getActiveVideosByFamily(finalSet, family);

  return {
    ...seed,
    source_video_ids,
    extracted_at: new Date().toISOString(),
  };
}

export function extractAllDirectorGrammarProfiles(
  projectRoot?: string
): DirectorGrammarProfile[] {
  const finalSet = loadSourceVideoFinalSet(projectRoot);
  if (!finalSet) {
    throw new Error(`Missing final set: ${FINAL_SET_PATH}`);
  }

  return EXTRACTABLE_FAMILIES.map((family) =>
    extractDirectorGrammarProfile(finalSet, family)
  );
}

export function writeDirectorGrammarProfiles(
  projectRoot: string,
  profiles: DirectorGrammarProfile[]
): string[] {
  const root = resolveProjectRoot(projectRoot);
  const written: string[] = [];

  for (const profile of profiles) {
    const rel = FAMILY_GRAMMAR_PATHS[profile.source_family];
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  return written;
}

export function loadDirectorGrammarRegistry(projectRoot?: string) {
  return readJsonRecord(resolveProjectRoot(projectRoot), DIRECTOR_GRAMMAR_REGISTRY_PATH);
}

export function familyForVideoId(
  videoId: string,
  finalSet: SourceVideoFinalSet
): SourceVideoCategory | null {
  const entry = finalSet.videos.find((v) => v.source_video_id === videoId);
  return entry?.category ?? null;
}
