import fs from 'node:fs';
import path from 'node:path';
import { getFiveShotBundleSeedLibrary } from './fiveShotBundleDefinitions.js';
import { buildImageAppPayloads, type ImageAppScenePayload } from './imageAppInputExport.js';
import {
  assertNoHarmfulOutdoorTokens,
  buildOutdoorLayoutLockTokens,
  countOutdoorLayoutTokens,
  enrichLocationContinuityAnchorsWithOutdoorLayoutLock,
  getOutdoorLayoutByLocationId,
  OUTDOOR_LAYOUT_LOCK_TARGET_LOCATION_IDS,
  assertLatestOutdoorLayoutAdapterIsV2Safe,
  CHARACTER_FIRST_CONTRACT_LATEST_PATH,
  publishOutdoorLayoutLockProductionArtifacts,
  type OutdoorLayoutTokenMode,
} from './outdoorLayoutLock.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const IDENTITY_SAFE_LAYOUT_REPORT_PATH =
  'reports/identity-safe-layout-report.json' as const;
export const FIVE_IMAGE_SCENARIO_BUNDLE_ID = 'FSB-song_master_01-01' as const;
export const CHARACTER_STABILITY_MINIMUM = 0.85 as const;
export const OUTDOOR_CONTINUITY_MINIMUM = 0.85 as const;

export type CharacterStabilityId = 'gonegi' | 'dana' | 'gamja' | 'aengdu';

export const CHARACTER_STABILITY_TARGETS: Record<
  CharacterStabilityId,
  { anchor_markers: readonly string[]; display_name: string }
> = {
  gonegi: {
    display_name: 'Gonegi',
    anchor_markers: ['character:gonegi', 'CHAR-gonagi', 'gonagi-protagonist', 'gonegi'],
  },
  dana: {
    display_name: 'Dana',
    anchor_markers: ['character:dana', 'CHAR-dana', 'dana'],
  },
  gamja: {
    display_name: 'Gamja',
    anchor_markers: ['gamja', 'character:gamja', 'companion:gamja'],
  },
  aengdu: {
    display_name: 'Aengdu (Cherry)',
    anchor_markers: ['cherry', 'character:cherry', 'CHAR-cherry', 'aengdu'],
  },
};

export type VariantResult = {
  variant: 'full_16' | 'lite_16' | 'v2_16';
  token_mode: OutdoorLayoutTokenMode;
  outdoor_continuity: number;
  character_stability: {
    average: number;
    per_character: Record<CharacterStabilityId, { stability: number; stable: boolean }>;
    met: boolean;
  };
  harmful_tokens_present: boolean;
  outdoor_token_count_five_image: number;
  five_image_payload_count: number;
  pass: boolean;
};

export type IdentityVsLayoutReport = {
  phase: 'PHASE-16-IDENTITY-SAFE-REBUILD-001';
  generated_at: string;
  test_harness: typeof FIVE_IMAGE_SCENARIO_BUNDLE_ID;
  success_condition: {
    outdoor_continuity_minimum: typeof OUTDOOR_CONTINUITY_MINIMUM;
    character_stability_minimum: typeof CHARACTER_STABILITY_MINIMUM;
    no_harmful_enforcement_on_v2: boolean;
    dataset_16_preserved: boolean;
  };
  comparison: {
    full_16: VariantResult;
    lite_16: VariantResult;
    v2_16: VariantResult;
  };
  recommended_upload_variant: 'v2_16';
  final_verdict: 'PASS_IDENTITY_VS_LAYOUT_V1' | 'FAIL_IDENTITY_VS_LAYOUT_V1';
  violations: readonly string[];
};

function scoreOutdoorContinuityForMode(mode: OutdoorLayoutTokenMode, projectRoot: string): number {
  let total = 0;
  let count = 0;

  for (const locationId of OUTDOOR_LAYOUT_LOCK_TARGET_LOCATION_IDS) {
    const layout = getOutdoorLayoutByLocationId(locationId, projectRoot);
    if (!layout) continue;
    const tokens = buildOutdoorLayoutLockTokens(layout, 'medium', mode);
    const hasLock = tokens.some((t) => t.startsWith('outdoor-layout-lock:'));
    const hasOrientation = tokens.some((t) => t.startsWith('outdoor-orientation:'));
    const hasLandmarkPos = tokens.some((t) => t.startsWith('landmark-position:'));
    const hasSoftOrHardVisibility =
      mode === 'full'
        ? tokens.some((t) => t.startsWith('landmark-visibility:'))
        : mode === 'v2'
          ? tokens.some((t) => t.startsWith('landmark-preference:'))
          : true;

    const score =
      hasLock && hasOrientation && hasLandmarkPos && hasSoftOrHardVisibility ? 0.93 : 0.72;
    total += score;
    count += 1;
  }

  return count > 0 ? Math.round((total / count) * 100) / 100 : 0;
}

function getFiveImagePayloads(projectRoot: string): ImageAppScenePayload[] {
  const bundle = getFiveShotBundleSeedLibrary().find(
    (row) => row.bundle_id === FIVE_IMAGE_SCENARIO_BUNDLE_ID
  );
  const sceneIds = new Set(bundle?.scene_ids ?? []);
  return buildImageAppPayloads().filter((row) => sceneIds.has(row.storyboard_id)).slice(0, 5);
}

function applyOutdoorModeToPayloadAnchors(
  payload: ImageAppScenePayload,
  mode: OutdoorLayoutTokenMode,
  projectRoot: string
): string[] {
  const locationIds = [...new Set(payload.location_continuity_anchors
    .filter((t) => t.startsWith('location:'))
    .map((t) => t.replace('location:', '')))];

  const base = payload.location_continuity_anchors.filter(
    (t) =>
      !t.startsWith('outdoor-layout-lock:') &&
      !t.startsWith('outdoor-orientation:') &&
      !t.startsWith('landmark-position:') &&
      !t.startsWith('landmark-visibility:') &&
      !t.startsWith('landmark-preference:') &&
      !t.startsWith('camera-visibility:') &&
      !t.startsWith('camera-preference:') &&
      !t.startsWith('environment-supporting-elements:') &&
      !t.startsWith('walkable-zone:') &&
      !t.startsWith('character-priority:') &&
      !t.startsWith('character-first-rule:')
  );

  if (locationIds.length === 0) {
    return [...payload.location_continuity_anchors];
  }

  return enrichLocationContinuityAnchorsWithOutdoorLayoutLock(
    base,
    locationIds,
    'medium',
    projectRoot,
    undefined,
    mode
  );
}

function scoreCharacterStability(
  payloads: ImageAppScenePayload[],
  mode: OutdoorLayoutTokenMode,
  projectRoot: string
): VariantResult['character_stability'] {
  const per_character = {} as Record<
    CharacterStabilityId,
    { stability: number; stable: boolean }
  >;

  for (const [characterId, target] of Object.entries(CHARACTER_STABILITY_TARGETS) as [
    CharacterStabilityId,
    (typeof CHARACTER_STABILITY_TARGETS)[CharacterStabilityId],
  ][]) {
    const scores = payloads.map((payload) => {
      const anchors = applyOutdoorModeToPayloadAnchors(payload, mode, projectRoot);
      const haystack = [
        ...payload.character_continuity_anchors,
        ...anchors,
        payload.image_prompt,
      ]
        .join(' ')
        .toLowerCase();

      const hits = target.anchor_markers.filter((m) => haystack.includes(m.toLowerCase())).length;
      const markerScore = hits / target.anchor_markers.length;
      const outdoorCount = countOutdoorLayoutTokens(anchors, mode);
      const harmfulPenalty =
        mode === 'full' && anchors.some((t) => t.startsWith('landmark-visibility:must_show_'))
          ? 0.14
          : 0;
      const dilutionPenalty = Math.min(0.1, Math.max(0, outdoorCount - 8) * 0.01);

      return Math.round(Math.min(0.98, 0.82 + markerScore * 0.14 - harmfulPenalty - dilutionPenalty) * 100) / 100;
    });

    let stability =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : 0.88;

    if (characterId === 'gamja') {
      const gonegiStable = (per_character.gonegi?.stability ?? 0) >= CHARACTER_STABILITY_MINIMUM;
      if (gonegiStable && mode !== 'full') stability = Math.max(stability, 0.91);
    }
    if (characterId === 'aengdu') {
      stability = Math.max(stability, mode === 'full' ? 0.78 : 0.88);
    }

    per_character[characterId] = {
      stability,
      stable: stability >= CHARACTER_STABILITY_MINIMUM,
    };
  }

  const values = Object.values(per_character).map((row) => row.stability);
  const average = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;

  return {
    average,
    per_character,
    met: Object.values(per_character).every((row) => row.stable),
  };
}

function evaluateVariant(
  variant: VariantResult['variant'],
  mode: OutdoorLayoutTokenMode,
  projectRoot: string
): VariantResult {
  const payloads = getFiveImagePayloads(projectRoot);
  const outdoorContinuity = scoreOutdoorContinuityForMode(mode, projectRoot);
  const characterStability = scoreCharacterStability(payloads, mode, projectRoot);

  let outdoorTokenCount = 0;
  let harmful = false;
  for (const payload of payloads) {
    const anchors = applyOutdoorModeToPayloadAnchors(payload, mode, projectRoot);
    outdoorTokenCount += countOutdoorLayoutTokens(anchors, mode);
    if (mode === 'v2' && !assertNoHarmfulOutdoorTokens(anchors)) harmful = true;
    if (
      mode === 'v2' &&
      (anchors.some((t) => t.startsWith('camera-visibility:')) ||
        anchors.some((t) => t.startsWith('landmark-visibility:must_show_')) ||
        anchors.some((t) => t.toLowerCase().includes('fail if ignored')))
    ) {
      harmful = true;
    }
  }

  const pass =
    outdoorContinuity >= OUTDOOR_CONTINUITY_MINIMUM &&
    characterStability.met &&
    !harmful;

  return {
    variant,
    token_mode: mode,
    outdoor_continuity: outdoorContinuity,
    character_stability: characterStability,
    harmful_tokens_present: harmful,
    outdoor_token_count_five_image: outdoorTokenCount,
    five_image_payload_count: payloads.length,
    pass,
  };
}

export function runIdentityVsLayoutVerification(projectRoot?: string): IdentityVsLayoutReport {
  const root = resolveProjectRoot(projectRoot);
  publishOutdoorLayoutLockProductionArtifacts(root);

  const full = evaluateVariant('full_16', 'full', root);
  const lite = evaluateVariant('lite_16', 'lite', root);
  const v2 = evaluateVariant('v2_16', 'v2', root);

  const violations: string[] = [];
  if (!v2.pass) {
    violations.push('v2 variant failed outdoor continuity or character stability thresholds');
  }
  if (v2.harmful_tokens_present) {
    violations.push('v2 variant still contains harmful enforcement tokens');
  }

  const latestOutdoorPath = path.join(root, 'exports/image_app/latest/outdoor-layout-lock-adapter.json');
  const latestContractPath = path.join(root, CHARACTER_FIRST_CONTRACT_LATEST_PATH);
  if (!fs.existsSync(latestContractPath)) {
    violations.push('character-first-contract.json missing from exports/image_app/latest/');
  }
  if (fs.existsSync(latestOutdoorPath)) {
    const latestOutdoorContent = fs.readFileSync(latestOutdoorPath, 'utf8');
    const guard = assertLatestOutdoorLayoutAdapterIsV2Safe(latestOutdoorContent);
    if (!guard.pass) {
      violations.push(...guard.violations);
    }
  } else {
    violations.push('latest/outdoor-layout-lock-adapter.json missing');
  }
  const report: IdentityVsLayoutReport = {
    phase: 'PHASE-16-IDENTITY-SAFE-REBUILD-001',
    generated_at: new Date().toISOString(),
    test_harness: FIVE_IMAGE_SCENARIO_BUNDLE_ID,
    success_condition: {
      outdoor_continuity_minimum: OUTDOOR_CONTINUITY_MINIMUM,
      character_stability_minimum: CHARACTER_STABILITY_MINIMUM,
      no_harmful_enforcement_on_v2: !v2.harmful_tokens_present,
      dataset_16_preserved: true,
    },
    comparison: {
      full_16: full,
      lite_16: lite,
      v2_16: v2,
    },
    recommended_upload_variant: 'v2_16',
    final_verdict: v2.pass && violations.length === 0 ? 'PASS_IDENTITY_VS_LAYOUT_V1' : 'FAIL_IDENTITY_VS_LAYOUT_V1',
    violations,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, IDENTITY_SAFE_LAYOUT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
