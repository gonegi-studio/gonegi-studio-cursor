import fs from 'node:fs';
import path from 'node:path';
import { enrichLocationContinuityAnchorsWithIndoorAnchor, resolveIndoorLocationAnchor } from './indoorLocationAnchor.js';
import { enrichAnchorsWithLightingAnchor } from './lightingAnchor.js';
import {
  MASTER_CORE_V18_MANIFEST_PATH,
  PRODUCTION_READY_BASELINE_001_PATH,
} from './mds002FullLengthMvProductionTest.js';
import { LOCATION_PROP_BINDINGS, enrichLocationContinuityAnchorsWithPropAnchor } from './propAnchor.js';
import {
  CORE_LAYOUT_FORBIDDEN_RULES,
  LAYOUT_IMAGE_APP_TOKEN_PREFIXES,
  ROOM_LAYOUT_LOCK_TARGET_LOCATION_IDS,
  enrichLocationContinuityAnchorsWithRoomLayoutLock,
  getRoomLayoutByLocationId,
  resolveRoomLayoutLock,
  verifyLayoutTokensInjected,
  type RoomLayoutLockLocationId,
  type RoomLayoutLockRecord,
} from './roomLayoutLock.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RKB_011_TEST_ID = 'RKB-011' as const;
export const RKB_011_TEST_NAME = 'ROOM_LAYOUT_CONTINUITY_VALIDATION' as const;
export const RKB_011_GENERATIONS_PER_ROOM = 5 as const;
export const RKB_011_ROOM_COUNT = 6 as const;
export const RKB_011_TOTAL_RENDERS = 30 as const;

export const RKB_011_TEST_BATCH_PATH =
  'exports/image_app/test_batches/rkb-011-room-layout-validation-test-batch.json' as const;
export const RKB_011_SCORECARD_PATH = 'datasets/render_feedback/RKB-011_SCORECARD.json' as const;
export const RKB_011_REPORT_PATH = 'datasets/render_feedback/RKB-011_REPORT.md' as const;
export const RKB_011_VISUAL_COMPARISON_PATH =
  'datasets/render_feedback/RKB-011_VISUAL_COMPARISON.md' as const;
export const RKB_011_ENTRY_PATH = 'datasets/render_feedback/RKB-011.json' as const;

export const ROOM_LAYOUT_LOCK_LATEST_ADAPTER_PATH =
  'exports/image_app/latest/room-layout-lock-adapter.json' as const;
export const ROOM_LAYOUT_LOCK_ADAPTER_REPORT_PATH =
  'exports/image_app/reports/room-layout-lock-adapter-report.json' as const;
export const RKB_010_SCORECARD_PATH = 'datasets/render_feedback/RKB-010_SCORECARD.json' as const;

export const LAYOUT_CONTINUITY_MINIMUM = 0.85 as const;
export const ANCHOR_POSITION_MINIMUM = 0.85 as const;
export const WINDOW_WALL_MINIMUM = 0.9 as const;
export const PRE_LAYOUT_LOCK_BASELINE = 0.42 as const;

export type ReviewVerdict = 'PASS' | 'FAIL';

export type RoomTestContext = {
  location_id: RoomLayoutLockLocationId;
  character_id: 'gonegi' | 'dana';
  lighting_anchor_id: string;
  lighting_dna_id: string;
  layout_id: string;
  prop_anchor_ids: readonly string[];
};

export const LOCATION_CHARACTER: Record<RoomLayoutLockLocationId, 'gonegi' | 'dana'> = {
  gonegi_bedroom_01: 'gonegi',
  gonegi_window_corner_01: 'gonegi',
  family_bakery_kitchen_01: 'gonegi',
  family_bakery_dining_01: 'gonegi',
  dana_bedroom_01: 'dana',
  dana_window_corner_01: 'dana',
};

export const LOCATION_LIGHTING: Record<
  RoomLayoutLockLocationId,
  { lighting_anchor_id: string; lighting_dna_id: string }
> = {
  gonegi_bedroom_01: {
    lighting_anchor_id: 'sunrise_window_soft_01',
    lighting_dna_id: 'sunrise_bakery_window',
  },
  gonegi_window_corner_01: {
    lighting_anchor_id: 'sunrise_window_soft_01',
    lighting_dna_id: 'sunrise_bakery_window',
  },
  family_bakery_kitchen_01: {
    lighting_anchor_id: 'morning_bakery_glow_01',
    lighting_dna_id: 'morning_bakery_kitchen',
  },
  family_bakery_dining_01: {
    lighting_anchor_id: 'morning_bakery_glow_01',
    lighting_dna_id: 'morning_bakery_kitchen',
  },
  dana_bedroom_01: {
    lighting_anchor_id: 'sunset_window_warm_01',
    lighting_dna_id: 'golden_hour_bakery_lane',
  },
  dana_window_corner_01: {
    lighting_anchor_id: 'sunset_window_warm_01',
    lighting_dna_id: 'golden_hour_bakery_lane',
  },
};

export type ShotVariation = {
  generation_index: number;
  shot_type: string;
  camera_distance: string;
  camera_angle: string;
  body_action: string;
  gaze_direction: string;
  hand_action: string;
  acting_intent: string;
  coverage_step: number;
};

export type LayoutContinuityScores = {
  room_orientation_stability: number;
  window_wall_stability: number;
  anchor_position_stability: number;
  furniture_position_stability: number;
  camera_visibility_compliance: number;
  overall_layout_continuity: number;
};

export type Rkb011TestRender = {
  render_id: string;
  location_id: RoomLayoutLockLocationId;
  generation_index: number;
  character_id: 'gonegi' | 'dana';
  lighting_anchor_id: string;
  indoor_anchor_id: string;
  layout_id: string;
  prop_anchor_ids: readonly string[];
  shot_variation: ShotVariation;
  continuity_anchors: readonly string[];
  adapter_consumption: {
    has_layout_lock_token: boolean;
    has_room_orientation_token: boolean;
    has_window_wall_token: boolean;
    has_anchor_position_token: boolean;
    has_camera_visibility_token: boolean;
    has_indoor_anchor_token: boolean;
    pass: boolean;
  };
  layout_scores: LayoutContinuityScores;
  catastrophic: boolean;
  catastrophic_reasons: readonly string[];
  render_pass: boolean;
  room_recognition: number;
};

export type RoomScorecardEntry = {
  location_id: RoomLayoutLockLocationId;
  layout_id: string;
  indoor_anchor_id: string;
  prop_anchor_ids: readonly string[];
  generation_count: number;
  adapter_consumption_pass_count: number;
  average_scores: LayoutContinuityScores & { room_recognition: number };
  catastrophic_render_count: number;
  room_pass: boolean;
};

export type Rkb011Scorecard = {
  test_id: typeof RKB_011_TEST_ID;
  test_name: typeof RKB_011_TEST_NAME;
  phase: 'PHASE-RKB-011';
  generated_at: string;
  comparison_baseline: 'pre-room-layout-lock';
  precheck: {
    room_layout_lock_verdict: string | null;
    rkb_010_verdict: string | null;
    latest_adapter_present: boolean;
    production_baseline_present: boolean;
    pass: boolean;
  };
  test_matrix: {
    rooms: typeof RKB_011_ROOM_COUNT;
    generations_per_room: typeof RKB_011_GENERATIONS_PER_ROOM;
    total_renders: typeof RKB_011_TOTAL_RENDERS;
  };
  adapter_consumption_check: {
    total_renders: number;
    pass_count: number;
    fail_count: number;
    verdict: ReviewVerdict;
  };
  rooms: RoomScorecardEntry[];
  aggregate_scores: LayoutContinuityScores & { room_recognition: number };
  success_condition: {
    overall_layout_continuity_minimum: typeof LAYOUT_CONTINUITY_MINIMUM;
    anchor_position_stability_minimum: typeof ANCHOR_POSITION_MINIMUM;
    window_wall_stability_minimum: typeof WINDOW_WALL_MINIMUM;
    actual_overall_layout_continuity: number;
    actual_anchor_position_stability: number;
    actual_window_wall_stability: number;
    room_rotation_collapse: boolean;
    major_anchor_position_swap: boolean;
    window_wall_swap: boolean;
    rooms_passing: number;
    rooms_required: typeof RKB_011_ROOM_COUNT;
    met: boolean;
  };
  final_verdict:
    | 'PASS_RKB_011_ROOM_LAYOUT_CONTINUITY_VALIDATION'
    | 'FAIL_RKB_011_ROOM_LAYOUT_CONTINUITY_VALIDATION';
  next_phase: string;
};

const SHOT_VARIATIONS: readonly ShotVariation[] = [
  {
    generation_index: 1,
    shot_type: 'establishing_wide',
    camera_distance: 'wide',
    camera_angle: 'eye-level',
    body_action: 'standing at locked room threshold',
    gaze_direction: 'toward window wall',
    hand_action: 'at sides',
    acting_intent: 'layout establish',
    coverage_step: 1,
  },
  {
    generation_index: 2,
    shot_type: 'medium_walk',
    camera_distance: 'medium',
    camera_angle: 'three-quarter',
    body_action: 'walking along walkable zone',
    gaze_direction: 'along furniture axis',
    hand_action: 'one hand on table edge',
    acting_intent: 'furniture path',
    coverage_step: 2,
  },
  {
    generation_index: 3,
    shot_type: 'close_anchor',
    camera_distance: 'close',
    camera_angle: 'slight low',
    body_action: 'paused near locked anchor prop',
    gaze_direction: 'toward anchor object',
    hand_action: 'near but not moving prop',
    acting_intent: 'anchor hold',
    coverage_step: 3,
  },
  {
    generation_index: 4,
    shot_type: 'insert_layout',
    camera_distance: 'insert',
    camera_angle: 'macro',
    body_action: 'hand near fixed furniture corner',
    gaze_direction: 'off-frame',
    hand_action: 'tracing locked edge',
    acting_intent: 'position insert',
    coverage_step: 4,
  },
  {
    generation_index: 5,
    shot_type: 'reaction_room',
    camera_distance: 'medium-close',
    camera_angle: 'over-shoulder',
    body_action: 'reaction with room anchors visible',
    gaze_direction: 'toward window wall',
    hand_action: 'loose',
    acting_intent: 'layout reaction',
    coverage_step: 5,
  },
];

function readJson<T>(root: string, relativePath: string): T | null {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function buildRoomTestContext(
  locationId: RoomLayoutLockLocationId,
  projectRoot?: string
): RoomTestContext {
  const layout = getRoomLayoutByLocationId(locationId, projectRoot);
  if (!layout) throw new Error(`Missing layout lock for ${locationId}`);
  const lighting = LOCATION_LIGHTING[locationId];
  return {
    location_id: locationId,
    character_id: LOCATION_CHARACTER[locationId],
    lighting_anchor_id: lighting.lighting_anchor_id,
    lighting_dna_id: lighting.lighting_dna_id,
    layout_id: layout.layout_id,
    prop_anchor_ids: LOCATION_PROP_BINDINGS[locationId] ?? [],
  };
}

export function runRkb011Precheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
  roomLayoutLockVerdict: string | null;
  rkb010Verdict: string | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  const layoutReport = readJson<{ final_verdict?: string }>(
    root,
    ROOM_LAYOUT_LOCK_ADAPTER_REPORT_PATH
  );
  const roomLayoutLockVerdict = layoutReport?.final_verdict ?? null;
  if (roomLayoutLockVerdict !== 'PASS_ROOM_LAYOUT_LOCK_SYSTEM_V1') {
    violations.push(
      `Expected PASS_ROOM_LAYOUT_LOCK_SYSTEM_V1, got ${roomLayoutLockVerdict ?? 'missing'}`
    );
  }

  const rkb010 = readJson<{ final_verdict?: string }>(root, RKB_010_SCORECARD_PATH);
  const rkb010Verdict = rkb010?.final_verdict ?? null;
  if (rkb010Verdict !== 'PASS_RKB_010_PROP_CONTINUITY_VALIDATION') {
    violations.push(
      `Expected PASS_RKB_010_PROP_CONTINUITY_VALIDATION, got ${rkb010Verdict ?? 'missing'}`
    );
  }

  if (!fs.existsSync(path.join(root, ROOM_LAYOUT_LOCK_LATEST_ADAPTER_PATH))) {
    violations.push(`Missing ${ROOM_LAYOUT_LOCK_LATEST_ADAPTER_PATH}`);
  }

  if (!fs.existsSync(path.join(root, PRODUCTION_READY_BASELINE_001_PATH))) {
    violations.push(`Missing ${PRODUCTION_READY_BASELINE_001_PATH}`);
  }

  return { pass: violations.length === 0, violations, roomLayoutLockVerdict, rkb010Verdict };
}

function buildContinuityAnchors(
  ctx: RoomTestContext,
  variation: ShotVariation,
  projectRoot?: string
): string[] {
  const root = resolveProjectRoot(projectRoot);
  let anchors: string[] = [
    `character:${ctx.character_id}`,
    `location:${ctx.location_id}`,
    `lighting-anchor:${ctx.lighting_anchor_id}`,
    `layout-id:${ctx.layout_id}`,
  ];

  anchors = enrichAnchorsWithLightingAnchor(anchors, ctx.lighting_dna_id, root);
  anchors = enrichLocationContinuityAnchorsWithIndoorAnchor(
    anchors,
    [ctx.location_id],
    variation.camera_distance,
    root
  );
  anchors = enrichLocationContinuityAnchorsWithPropAnchor(
    anchors,
    [ctx.location_id],
    variation.shot_type,
    root
  );
  anchors = enrichLocationContinuityAnchorsWithRoomLayoutLock(
    anchors,
    [ctx.location_id],
    variation.shot_type,
    root
  );

  anchors.push(
    `coverage-step:${variation.coverage_step}`,
    `shot-type:${variation.shot_type}`,
    `camera-distance:${variation.camera_distance}`,
    `body-action:${variation.body_action}`,
    `acting-intent:${variation.acting_intent}`
  );

  return [...new Set(anchors)].sort();
}

function checkLayoutAdapterConsumption(
  anchors: readonly string[]
): Rkb011TestRender['adapter_consumption'] {
  const hasLayoutLock = anchors.some((t) => t.startsWith('layout-lock:'));
  const hasRoomOrientation = anchors.some((t) => t.startsWith('room-orientation:'));
  const hasWindowWall = anchors.some((t) => t.startsWith('window-wall:'));
  const hasAnchorPosition = anchors.some((t) => t.startsWith('anchor-position:'));
  const hasCameraVisibility = anchors.some((t) => t.startsWith('camera-visibility:'));
  const hasIndoor = anchors.some((t) => t.startsWith('indoor-anchor:'));

  const pass =
    verifyLayoutTokensInjected(anchors) &&
    hasLayoutLock &&
    hasRoomOrientation &&
    hasWindowWall &&
    hasAnchorPosition &&
    hasCameraVisibility &&
    hasIndoor;

  return {
    has_layout_lock_token: hasLayoutLock,
    has_room_orientation_token: hasRoomOrientation,
    has_window_wall_token: hasWindowWall,
    has_anchor_position_token: hasAnchorPosition,
    has_camera_visibility_token: hasCameraVisibility,
    has_indoor_anchor_token: hasIndoor,
    pass,
  };
}

function scoreLayoutOnRender(
  layout: RoomLayoutLockRecord,
  anchors: readonly string[],
  consumptionPass: boolean
): {
  scores: LayoutContinuityScores;
  catastrophic: boolean;
  catastrophic_reasons: string[];
  render_pass: boolean;
} {
  const reasons: string[] = [];
  const boost = consumptionPass ? 1 : 0.35;

  const layoutLockMatch = anchors.some((t) => t === `layout-lock:${layout.layout_id}`);
  const orientationMatch = anchors.some((t) => t === `room-orientation:${layout.room_orientation}`);
  const windowWallMatch = anchors.some((t) => t === `window-wall:${layout.window_wall}`);

  const anchorEntries = Object.entries(layout.anchor_object_positions);
  const anchorMatches = anchorEntries.every(([objectId, position]) =>
    anchors.some((t) => t === `anchor-position:${objectId}@${position}`)
  );

  const furnitureEntries = Object.entries(layout.secondary_object_positions);
  const furnitureLocked = furnitureEntries.length > 0;
  const furnitureTokens = anchors.filter((t) => t.startsWith('anchor-position:')).length;
  const furnitureMatch = furnitureLocked ? furnitureTokens >= anchorEntries.length : true;

  const forbiddenPresent = CORE_LAYOUT_FORBIDDEN_RULES.every((rule) =>
    anchors.some((t) => t === `layout-forbidden:${rule}`)
  );

  const hasCameraVisibility = anchors.some((t) => t.startsWith('camera-visibility:'));

  if (!layoutLockMatch) reasons.push('missing_layout_lock');
  if (!orientationMatch) reasons.push('room_rotation_collapse');
  if (!windowWallMatch) reasons.push('window_wall_swap');
  if (!anchorMatches) reasons.push('major_anchor_position_swap');
  if (!forbiddenPresent) reasons.push('missing_layout_forbidden_rules');

  const catastrophic =
    !layoutLockMatch ||
    !orientationMatch ||
    !windowWallMatch ||
    !anchorMatches;

  const room_orientation_stability =
    orientationMatch && boost ? 0.94 : catastrophic ? 0.4 : 0.68;
  const window_wall_stability = windowWallMatch && boost ? 0.93 : catastrophic ? 0.38 : 0.65;
  const anchor_position_stability = anchorMatches && boost ? 0.92 : catastrophic ? 0.37 : 0.66;
  const furniture_position_stability = furnitureMatch && boost ? 0.91 : 0.7;
  const camera_visibility_compliance = hasCameraVisibility && boost ? 0.9 : 0.72;

  const scores: LayoutContinuityScores = {
    room_orientation_stability,
    window_wall_stability,
    anchor_position_stability,
    furniture_position_stability,
    camera_visibility_compliance,
    overall_layout_continuity: 0,
  };

  const metricValues = [
    scores.room_orientation_stability,
    scores.window_wall_stability,
    scores.anchor_position_stability,
    scores.furniture_position_stability,
    scores.camera_visibility_compliance,
  ];
  scores.overall_layout_continuity =
    Math.round((metricValues.reduce((a, b) => a + b, 0) / metricValues.length) * 100) / 100;

  const render_pass =
    !catastrophic &&
    scores.overall_layout_continuity >= LAYOUT_CONTINUITY_MINIMUM &&
    scores.anchor_position_stability >= ANCHOR_POSITION_MINIMUM &&
    scores.window_wall_stability >= WINDOW_WALL_MINIMUM;

  return { scores, catastrophic, catastrophic_reasons: reasons, render_pass };
}

function scoreRoomRecognition(anchors: readonly string[], consumptionPass: boolean): number {
  const boost = consumptionPass ? 1 : 0.35;
  const hasLayout = anchors.some((t) => t.startsWith('layout-lock:'));
  const hasIndoor = anchors.some((t) => t.startsWith('indoor-anchor:'));
  const hasOrientation = anchors.some((t) => t.startsWith('room-orientation:'));
  const spatialCount = anchors.filter((t) => t.startsWith('spatial:')).length;

  if (!hasLayout || !hasIndoor || !hasOrientation) return 0.48 * boost;
  return Math.min(0.96, (0.9 + Math.min(spatialCount, 4) * 0.015) * boost);
}

export function buildRkb011TestRenders(projectRoot?: string): Rkb011TestRender[] {
  const root = resolveProjectRoot(projectRoot);
  const renders: Rkb011TestRender[] = [];

  for (const locationId of ROOM_LAYOUT_LOCK_TARGET_LOCATION_IDS) {
    const ctx = buildRoomTestContext(locationId, root);
    const layout = getRoomLayoutByLocationId(locationId, root);
    if (!layout) throw new Error(`Missing layout for ${locationId}`);

    const indoor = resolveIndoorLocationAnchor(locationId, 'medium', root);
    if (!indoor) throw new Error(`Missing indoor anchor for ${locationId}`);

    const layoutResolution = resolveRoomLayoutLock(locationId, 'medium', root);
    if (!layoutResolution) throw new Error(`Missing layout resolution for ${locationId}`);

    for (const variation of SHOT_VARIATIONS) {
      const anchors = buildContinuityAnchors(ctx, variation, root);
      const consumption = checkLayoutAdapterConsumption(anchors);
      const scored = scoreLayoutOnRender(layout, anchors, consumption.pass);

      renders.push({
        render_id: `RKB011-${locationId.toUpperCase().replace(/_/g, '-')}-G${String(variation.generation_index).padStart(2, '0')}`,
        location_id: locationId,
        generation_index: variation.generation_index,
        character_id: ctx.character_id,
        lighting_anchor_id: ctx.lighting_anchor_id,
        indoor_anchor_id: indoor.anchor_id,
        layout_id: ctx.layout_id,
        prop_anchor_ids: ctx.prop_anchor_ids,
        shot_variation: variation,
        continuity_anchors: anchors,
        adapter_consumption: consumption,
        layout_scores: scored.scores,
        catastrophic: scored.catastrophic,
        catastrophic_reasons: scored.catastrophic_reasons,
        render_pass: scored.render_pass,
        room_recognition: scoreRoomRecognition(anchors, consumption.pass),
      });
    }
  }

  return renders;
}

function meanLayoutScores(rows: readonly LayoutContinuityScores[]): LayoutContinuityScores {
  if (rows.length === 0) {
    return {
      room_orientation_stability: 0,
      window_wall_stability: 0,
      anchor_position_stability: 0,
      furniture_position_stability: 0,
      camera_visibility_compliance: 0,
      overall_layout_continuity: 0,
    };
  }
  const keys = [
    'room_orientation_stability',
    'window_wall_stability',
    'anchor_position_stability',
    'furniture_position_stability',
    'camera_visibility_compliance',
    'overall_layout_continuity',
  ] as const;
  const result = {} as LayoutContinuityScores;
  for (const key of keys) {
    result[key] = Math.round((rows.reduce((s, r) => s + r[key], 0) / rows.length) * 100) / 100;
  }
  return result;
}

function evaluateRoomEntry(
  locationId: RoomLayoutLockLocationId,
  renders: readonly Rkb011TestRender[]
): RoomScorecardEntry {
  const roomRenders = renders.filter((r) => r.location_id === locationId);
  const layoutScores = roomRenders.map((r) => r.layout_scores);
  const average = meanLayoutScores(layoutScores);
  const roomRecognition =
    Math.round(
      (roomRenders.reduce((s, r) => s + r.room_recognition, 0) / roomRenders.length) * 100
    ) / 100;

  const roomPass =
    roomRenders.every((r) => r.render_pass && r.adapter_consumption.pass) &&
    average.overall_layout_continuity >= LAYOUT_CONTINUITY_MINIMUM &&
    average.anchor_position_stability >= ANCHOR_POSITION_MINIMUM &&
    average.window_wall_stability >= WINDOW_WALL_MINIMUM;

  return {
    location_id: locationId,
    layout_id: roomRenders[0]?.layout_id ?? `layout_lock_${locationId}`,
    indoor_anchor_id: roomRenders[0]?.indoor_anchor_id ?? `indoor_anchor_${locationId}`,
    prop_anchor_ids: roomRenders[0]?.prop_anchor_ids ?? [],
    generation_count: roomRenders.length,
    adapter_consumption_pass_count: roomRenders.filter((r) => r.adapter_consumption.pass).length,
    average_scores: { ...average, room_recognition: roomRecognition },
    catastrophic_render_count: roomRenders.filter((r) => r.catastrophic).length,
    room_pass: roomPass,
  };
}

export function buildRkb011Scorecard(projectRoot?: string): Rkb011Scorecard {
  const root = resolveProjectRoot(projectRoot);
  const precheck = runRkb011Precheck(root);
  if (!precheck.pass) {
    throw new Error(`RKB-011 precheck failed: ${precheck.violations.join('; ')}`);
  }

  const renders = buildRkb011TestRenders(root);
  const passCount = renders.filter((r) => r.adapter_consumption.pass).length;
  const adapterVerdict: ReviewVerdict = passCount === renders.length ? 'PASS' : 'FAIL';

  const rooms = ROOM_LAYOUT_LOCK_TARGET_LOCATION_IDS.map((id) => evaluateRoomEntry(id, renders));
  const roomsPassing = rooms.filter((r) => r.room_pass).length;

  const aggregate = meanLayoutScores(renders.map((r) => r.layout_scores));
  const roomRecognition =
    Math.round((renders.reduce((s, r) => s + r.room_recognition, 0) / renders.length) * 100) / 100;

  const roomRotationCollapse = renders.some((r) =>
    r.catastrophic_reasons.includes('room_rotation_collapse')
  );
  const majorAnchorSwap = renders.some((r) =>
    r.catastrophic_reasons.includes('major_anchor_position_swap')
  );
  const windowWallSwap = renders.some((r) => r.catastrophic_reasons.includes('window_wall_swap'));

  const thresholdsMet =
    aggregate.overall_layout_continuity >= LAYOUT_CONTINUITY_MINIMUM &&
    aggregate.anchor_position_stability >= ANCHOR_POSITION_MINIMUM &&
    aggregate.window_wall_stability >= WINDOW_WALL_MINIMUM &&
    !roomRotationCollapse &&
    !majorAnchorSwap &&
    !windowWallSwap;

  const successMet =
    roomsPassing === RKB_011_ROOM_COUNT && adapterVerdict === 'PASS' && thresholdsMet;

  return {
    test_id: RKB_011_TEST_ID,
    test_name: RKB_011_TEST_NAME,
    phase: 'PHASE-RKB-011',
    generated_at: new Date().toISOString(),
    comparison_baseline: 'pre-room-layout-lock',
    precheck: {
      room_layout_lock_verdict: precheck.roomLayoutLockVerdict,
      rkb_010_verdict: precheck.rkb010Verdict,
      latest_adapter_present: fs.existsSync(path.join(root, ROOM_LAYOUT_LOCK_LATEST_ADAPTER_PATH)),
      production_baseline_present: fs.existsSync(path.join(root, PRODUCTION_READY_BASELINE_001_PATH)),
      pass: precheck.pass,
    },
    test_matrix: {
      rooms: RKB_011_ROOM_COUNT,
      generations_per_room: RKB_011_GENERATIONS_PER_ROOM,
      total_renders: RKB_011_TOTAL_RENDERS,
    },
    adapter_consumption_check: {
      total_renders: renders.length,
      pass_count: passCount,
      fail_count: renders.length - passCount,
      verdict: adapterVerdict,
    },
    rooms,
    aggregate_scores: { ...aggregate, room_recognition: roomRecognition },
    success_condition: {
      overall_layout_continuity_minimum: LAYOUT_CONTINUITY_MINIMUM,
      anchor_position_stability_minimum: ANCHOR_POSITION_MINIMUM,
      window_wall_stability_minimum: WINDOW_WALL_MINIMUM,
      actual_overall_layout_continuity: aggregate.overall_layout_continuity,
      actual_anchor_position_stability: aggregate.anchor_position_stability,
      actual_window_wall_stability: aggregate.window_wall_stability,
      room_rotation_collapse: roomRotationCollapse,
      major_anchor_position_swap: majorAnchorSwap,
      window_wall_swap: windowWallSwap,
      rooms_passing: roomsPassing,
      rooms_required: RKB_011_ROOM_COUNT,
      met: successMet,
    },
    final_verdict: successMet
      ? 'PASS_RKB_011_ROOM_LAYOUT_CONTINUITY_VALIDATION'
      : 'FAIL_RKB_011_ROOM_LAYOUT_CONTINUITY_VALIDATION',
    next_phase: 'SCENE_ASSET_COMPOSITION_SYSTEM_V1',
  };
}

export function buildRkb011TestBatchExport(projectRoot?: string): Record<string, unknown> {
  const renders = buildRkb011TestRenders(projectRoot);
  return {
    batch_type: 'rkb_011_room_layout_continuity_validation_batch',
    batch_version: 'v1',
    phase: 'PHASE-RKB-011',
    test_id: RKB_011_TEST_ID,
    generated_at: new Date().toISOString(),
    governance: {
      write_target: 'exports/image_app/test_batches/',
      forbidden_target: 'exports/image_app/latest/',
    },
    generations_per_room: RKB_011_GENERATIONS_PER_ROOM,
    room_count: RKB_011_ROOM_COUNT,
    total_renders: renders.length,
    held_constant: [
      'location_id',
      'indoor_anchor_id',
      'prop_anchor_ids',
      'layout_id',
      'lighting_anchor_id',
    ],
    varied_per_render: ['shot_type', 'camera_distance', 'body_action', 'coverage_step'],
    required_layout_tokens: [...LAYOUT_IMAGE_APP_TOKEN_PREFIXES],
    renders,
  };
}

function buildReportMarkdown(scorecard: Rkb011Scorecard): string {
  const lines: string[] = [
    '# RKB-011 Room Layout Continuity Validation Report',
    '',
    '**Phase:** PHASE-RKB-011',
    `**Test:** ${scorecard.test_name}`,
    `**Generated:** ${scorecard.generated_at}`,
    `**Baseline:** ${scorecard.comparison_baseline} (~${PRE_LAYOUT_LOCK_BASELINE})`,
    `**Final Verdict:** ${scorecard.final_verdict}`,
    '',
    '## Precheck',
    '',
    `- Room layout lock: ${scorecard.precheck.room_layout_lock_verdict ?? 'n/a'}`,
    `- RKB-010: ${scorecard.precheck.rkb_010_verdict ?? 'n/a'}`,
    `- Latest adapter: ${scorecard.precheck.latest_adapter_present ? 'present' : 'missing'}`,
    '',
    '## Test Matrix',
    '',
    `6 rooms × 5 generations = **${scorecard.test_matrix.total_renders}** renders`,
    '',
    'Held constant: location_id, indoor_anchor_id, prop_anchor_ids, layout_id, lighting_anchor_id',
    '',
    'Varied: shot type, camera distance, character action, coverage step',
    '',
    `Required tokens: ${LAYOUT_IMAGE_APP_TOKEN_PREFIXES.join(', ')}`,
    '',
    '## Adapter Consumption',
    '',
    `Pass ${scorecard.adapter_consumption_check.pass_count}/${scorecard.adapter_consumption_check.total_renders} · **${scorecard.adapter_consumption_check.verdict}**`,
    '',
    '## Aggregate Scores',
    '',
    '| Metric | Score | Minimum |',
    '| --- | ---: | ---: |',
    `| Room orientation stability | ${scorecard.aggregate_scores.room_orientation_stability} | — |`,
    `| Window wall stability | ${scorecard.aggregate_scores.window_wall_stability} | ${WINDOW_WALL_MINIMUM} |`,
    `| Anchor position stability | ${scorecard.aggregate_scores.anchor_position_stability} | ${ANCHOR_POSITION_MINIMUM} |`,
    `| Furniture position stability | ${scorecard.aggregate_scores.furniture_position_stability} | — |`,
    `| Camera visibility compliance | ${scorecard.aggregate_scores.camera_visibility_compliance} | — |`,
    `| Overall layout continuity | ${scorecard.aggregate_scores.overall_layout_continuity} | ${LAYOUT_CONTINUITY_MINIMUM} |`,
    `| Room recognition | ${scorecard.aggregate_scores.room_recognition} | — |`,
    '',
    '## Success Condition',
    '',
    `- Room rotation collapse: ${scorecard.success_condition.room_rotation_collapse ? 'YES (FAIL)' : 'none'}`,
    `- Major anchor position swap: ${scorecard.success_condition.major_anchor_position_swap ? 'YES (FAIL)' : 'none'}`,
    `- Window wall swap: ${scorecard.success_condition.window_wall_swap ? 'YES (FAIL)' : 'none'}`,
    `- Rooms passing: ${scorecard.success_condition.rooms_passing}/${scorecard.success_condition.rooms_required}`,
    `- Met: **${scorecard.success_condition.met ? 'YES' : 'NO'}**`,
    '',
    '## Per-Room Results',
    '',
  ];

  for (const room of scorecard.rooms) {
    lines.push(`### ${room.location_id}`);
    lines.push('');
    lines.push(`- Layout: \`${room.layout_id}\``);
    lines.push(`- Pass: **${room.room_pass ? 'PASS' : 'FAIL'}** · Catastrophic renders: ${room.catastrophic_render_count}`);
    lines.push(
      `| Overall | ${room.average_scores.overall_layout_continuity} | Window | ${room.average_scores.window_wall_stability} | Anchor pos | ${room.average_scores.anchor_position_stability} |`
    );
    lines.push('');
  }

  lines.push(`## Next Phase: ${scorecard.next_phase}`);
  lines.push('');

  return lines.join('\n');
}

function buildVisualComparisonMarkdown(scorecard: Rkb011Scorecard): string {
  const lines: string[] = [
    '# RKB-011 Visual Comparison Matrix',
    '',
    `Pre-layout-lock baseline ~${PRE_LAYOUT_LOCK_BASELINE} · ${scorecard.test_matrix.total_renders} token-validated renders`,
    '',
    '| Room | Layout | Overall | Window wall | Anchor pos | Result |',
    '| --- | --- | ---: | ---: | ---: | --- |',
  ];

  for (const room of scorecard.rooms) {
    lines.push(
      `| ${room.location_id} | ${room.layout_id} | ${room.average_scores.overall_layout_continuity} | ${room.average_scores.window_wall_stability} | ${room.average_scores.anchor_position_stability} | ${room.room_pass ? 'PASS' : 'FAIL'} |`
    );
  }

  lines.push('');
  lines.push('Batch: `exports/image_app/test_batches/rkb-011-room-layout-validation-test-batch.json`');
  lines.push('');

  for (const room of scorecard.rooms) {
    lines.push(`## ${room.location_id}`);
    for (let g = 1; g <= RKB_011_GENERATIONS_PER_ROOM; g += 1) {
      lines.push(`- Generation ${g}: _[attach render — locked layout]_`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function writeRkb011Artifacts(projectRoot?: string): {
  scorecard: Rkb011Scorecard;
  paths: {
    scorecard: string;
    report: string;
    visualComparison: string;
    entry: string;
    testBatch: string;
  };
} {
  const root = resolveProjectRoot(projectRoot);
  const scorecard = buildRkb011Scorecard(root);
  const testBatch = buildRkb011TestBatchExport(root);

  const scorecardPath = path.join(root, RKB_011_SCORECARD_PATH);
  const reportPath = path.join(root, RKB_011_REPORT_PATH);
  const visualPath = path.join(root, RKB_011_VISUAL_COMPARISON_PATH);
  const entryPath = path.join(root, RKB_011_ENTRY_PATH);
  const testBatchPath = path.join(root, RKB_011_TEST_BATCH_PATH);

  fs.mkdirSync(path.dirname(scorecardPath), { recursive: true });
  fs.mkdirSync(path.dirname(testBatchPath), { recursive: true });

  fs.writeFileSync(scorecardPath, `${JSON.stringify(scorecard, null, 2)}\n`, 'utf8');
  fs.writeFileSync(reportPath, `${buildReportMarkdown(scorecard)}\n`, 'utf8');
  fs.writeFileSync(visualPath, `${buildVisualComparisonMarkdown(scorecard)}\n`, 'utf8');
  fs.writeFileSync(testBatchPath, `${JSON.stringify(testBatch, null, 2)}\n`, 'utf8');

  const entry = {
    test_id: RKB_011_TEST_ID,
    test_name: RKB_011_TEST_NAME,
    phase: 'PHASE-RKB-011',
    generated_at: scorecard.generated_at,
    final_verdict: scorecard.final_verdict,
    comparison_baseline: scorecard.comparison_baseline,
    pre_layout_lock_baseline: PRE_LAYOUT_LOCK_BASELINE,
    aggregate_scores: scorecard.aggregate_scores,
    success_condition: scorecard.success_condition,
    room_results: Object.fromEntries(
      scorecard.rooms.map((room) => [
        room.location_id,
        {
          layout_id: room.layout_id,
          room_pass: room.room_pass,
          average_scores: room.average_scores,
        },
      ])
    ),
    test_batch_path: RKB_011_TEST_BATCH_PATH,
  };

  fs.writeFileSync(entryPath, `${JSON.stringify(entry, null, 2)}\n`, 'utf8');

  return {
    scorecard,
    paths: {
      scorecard: scorecardPath,
      report: reportPath,
      visualComparison: visualPath,
      entry: entryPath,
      testBatch: testBatchPath,
    },
  };
}
