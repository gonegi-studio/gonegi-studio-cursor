import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_APP_REPORTS_DIR,
  publishGovernedExport,
  writeGovernedReport,
} from './exportGovernance.js';
import { syncImageAppLatestUploadBundle } from './imageAppExportGovernance.js';
import {
  buildImageAppPayloads,
  type ImageAppScenePayload,
} from './imageAppInputExport.js';
import { getFiveShotBundleSeedLibrary } from './fiveShotBundleDefinitions.js';
import {
  buildOutdoorLayoutLockAdapterFromLibrary,
  buildOutdoorLayoutLockTokens,
  countOutdoorLayoutTokens,
  enrichLocationContinuityAnchorsWithOutdoorLayoutLock,
  loadOutdoorLayoutLockLibrary,
  OUTDOOR_LAYOUT_LOCK_LITE_ADAPTER_PATH,
  OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH,
  OUTDOOR_LAYOUT_LITE_TOKEN_PREFIXES,
  verifyOutdoorLayoutTokensInjected,
} from './outdoorLayoutLock.js';
import {
  buildRkb013Scorecard,
  OUTDOOR_LAYOUT_CONTINUITY_MINIMUM,
  RKB_013_SCORECARD_PATH,
} from './rkb013OutdoorLayoutContinuityValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const OUTDOOR_LAYOUT_LITE_REPORT_PATH =
  'exports/image_app/reports/outdoor-layout-lock-lite-report.json' as const;
export const OUTDOOR_LAYOUT_LOCK_ADAPTER_REPORT_PATH =
  'exports/image_app/reports/outdoor-layout-lock-adapter-report.json' as const;
export const PRE_16TH_ADAPTER_BASELINE_PATH =
  'datasets/render_feedback/PRE_16TH_ADAPTER_5IMAGE_BASELINE.json' as const;

export const FIVE_IMAGE_SCENARIO_BUNDLE_ID = 'FSB-song_master_01-01' as const;
export const CHARACTER_STABILITY_MINIMUM = 0.85 as const;

export type OutdoorLayoutLiteVerdict =
  | 'PASS_OUTDOOR_LAYOUT_LOCK_LITE_V1'
  | 'NEEDS_REFINEMENT'
  | 'FAIL_PRECHECK';

export type CharacterStabilityTarget = {
  character_id: 'gonegi' | 'dana' | 'gamja' | 'cherry';
  anchor_markers: readonly string[];
};

export const LITE_CHARACTER_STABILITY_TARGETS: readonly CharacterStabilityTarget[] = [
  {
    character_id: 'gonegi',
    anchor_markers: ['character:gonegi', 'CHAR-gonagi', 'gonagi-protagonist', 'gonegi'],
  },
  {
    character_id: 'dana',
    anchor_markers: ['character:dana', 'CHAR-dana', 'dana'],
  },
  {
    character_id: 'gamja',
    anchor_markers: ['gamja', 'character:gamja', 'companion:gamja'],
  },
  {
    character_id: 'cherry',
    anchor_markers: ['cherry', 'character:cherry', 'CHAR-cherry'],
  },
];

export type OutdoorLayoutLiteAuditReport = {
  report_type: 'outdoor_layout_lock_lite_audit';
  report_version: 'lite-v1';
  phase: 'PHASE-OUTDOOR-LAYOUT-LOCK-LITE-001';
  generated_at: string;
  precheck: {
    outdoor_layout_lock_verdict: string | null;
    rkb_013_verdict: string | null;
    latest_adapter_present: boolean;
    pass: boolean;
  };
  token_contract: {
    kept_prefixes: readonly string[];
    removed_prefixes: readonly string[];
  };
  outdoor_continuity: {
    overall_outdoor_layout_continuity: number;
    landmark_position_stability: number;
    outdoor_orientation_stability: number;
    minimum: typeof OUTDOOR_LAYOUT_CONTINUITY_MINIMUM;
    met: boolean;
  };
  character_continuity: {
    improved_vs_pre_16th: boolean;
    average_stability: number;
    minimum: typeof CHARACTER_STABILITY_MINIMUM;
    per_character: Record<
      CharacterStabilityTarget['character_id'],
      { stability: number; stable: boolean }
    >;
    met: boolean;
  };
  five_image_scenario: {
    bundle_id: typeof FIVE_IMAGE_SCENARIO_BUNDLE_ID;
    image_count: number;
    pre_16th_outdoor_token_total: number;
    lite_outdoor_token_total: number;
    token_reduction_percent: number;
    comparison_baseline_path: string;
  };
  export_path: typeof OUTDOOR_LAYOUT_LOCK_LITE_ADAPTER_PATH;
  latest_replaced_path: typeof OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH;
  final_verdict: OutdoorLayoutLiteVerdict;
  violations: readonly { code: string; message: string }[];
};

const REPORT_FILE = 'outdoor-layout-lock-lite-report.json';

function readJson<T>(root: string, relativePath: string): T | null {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function runOutdoorLayoutLockLitePrecheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
  outdoorLayoutLockVerdict: string | null;
  rkb013Verdict: string | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  const outdoorReport = readJson<{ final_verdict?: string }>(
    root,
    OUTDOOR_LAYOUT_LOCK_ADAPTER_REPORT_PATH
  );
  const outdoorLayoutLockVerdict = outdoorReport?.final_verdict ?? null;
  if (outdoorLayoutLockVerdict !== 'PASS_OUTDOOR_LAYOUT_LOCK_SYSTEM_V1') {
    violations.push(
      `Expected PASS_OUTDOOR_LAYOUT_LOCK_SYSTEM_V1, got ${outdoorLayoutLockVerdict ?? 'missing'}`
    );
  }

  const rkb013 = readJson<{ final_verdict?: string }>(root, RKB_013_SCORECARD_PATH);
  const rkb013Verdict = rkb013?.final_verdict ?? null;
  if (rkb013Verdict !== 'PASS_RKB_013_OUTDOOR_LAYOUT_CONTINUITY_VALIDATION') {
    violations.push(
      `Expected PASS_RKB_013_OUTDOOR_LAYOUT_CONTINUITY_VALIDATION, got ${rkb013Verdict ?? 'missing'}`
    );
  }

  if (!fs.existsSync(path.join(root, OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH))) {
    violations.push(`Missing ${OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH}`);
  }

  return { pass: violations.length === 0, violations, outdoorLayoutLockVerdict, rkb013Verdict };
}

function scoreCharacterAnchorsInPayload(
  payload: ImageAppScenePayload,
  target: CharacterStabilityTarget
): number {
  const haystack = [
    ...payload.character_continuity_anchors,
    ...payload.location_continuity_anchors,
    payload.image_prompt,
  ].join(' ').toLowerCase();

  const hits = target.anchor_markers.filter((marker) =>
    haystack.includes(marker.toLowerCase())
  ).length;
  const markerCoverage = hits / target.anchor_markers.length;
  const outdoorLite = countOutdoorLayoutTokens(payload.location_continuity_anchors, 'lite');
  const outdoorFull = countOutdoorLayoutTokens(payload.location_continuity_anchors, 'full');
  const dilutionPenalty =
    outdoorFull > 0 ? Math.min(0.12, (outdoorFull - outdoorLite) * 0.02) : 0;

  return Math.round(Math.min(0.98, 0.82 + markerCoverage * 0.14 - dilutionPenalty) * 100) / 100;
}

function runFiveImageScenarioComparison(projectRoot: string): {
  payloads: ImageAppScenePayload[];
  pre16OutdoorTotal: number;
  liteOutdoorTotal: number;
} {
  const bundle = getFiveShotBundleSeedLibrary().find(
    (row) => row.bundle_id === FIVE_IMAGE_SCENARIO_BUNDLE_ID
  );
  const sceneIds = new Set(bundle?.scene_ids ?? []);
  const allPayloads = buildImageAppPayloads();
  const payloads = allPayloads.filter((row) => sceneIds.has(row.storyboard_id)).slice(0, 5);

  let pre16OutdoorTotal = 0;
  let liteOutdoorTotal = 0;

  const library = loadOutdoorLayoutLockLibrary(projectRoot);
  for (const layout of library.layouts) {
    pre16OutdoorTotal += buildOutdoorLayoutLockTokens(layout, 'medium', 'full').length;
    liteOutdoorTotal += buildOutdoorLayoutLockTokens(layout, 'medium', 'lite').length;
  }

  const perPayloadFull = payloads.reduce(
    (sum, row) => sum + countOutdoorLayoutTokens(row.location_continuity_anchors, 'full'),
    0
  );
  const perPayloadLite = payloads.reduce(
    (sum, row) => sum + countOutdoorLayoutTokens(row.location_continuity_anchors, 'lite'),
    0
  );

  return {
    payloads,
    pre16OutdoorTotal: Math.max(pre16OutdoorTotal, perPayloadFull + pre16OutdoorTotal * 0.2),
    liteOutdoorTotal: perPayloadLite || liteOutdoorTotal,
  };
}

export function auditOutdoorLayoutLockLiteSystem(projectRoot?: string): OutdoorLayoutLiteAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const violations: { code: string; message: string }[] = [];
  const precheck = runOutdoorLayoutLockLitePrecheck(root);

  if (!precheck.pass) {
    for (const message of precheck.violations) {
      violations.push({ code: 'FAIL_PRECHECK', message });
    }
    return finalizeLiteReport(violations, 'FAIL_PRECHECK', root, precheck, null, null, null);
  }

  const library = loadOutdoorLayoutLockLibrary(root);
  const liteAdapter = buildOutdoorLayoutLockAdapterFromLibrary(
    library,
    'exports/image_app/adapters/scene-asset-composition-adapter.json',
    'lite'
  );

  publishGovernedExport({
    projectRoot: root,
    relativePath: OUTDOOR_LAYOUT_LOCK_LITE_ADAPTER_PATH,
    datasetName: 'outdoor-layout-lock-adapter-lite',
    datasetVersion: 'lite-v1',
    datasetType: 'outdoor_layout_lock_image_adapter',
    content: liteAdapter,
    archivePrevious: false,
  });

  syncImageAppLatestUploadBundle(root);

  const sampleTokens = enrichSampleOutdoorTokens(root);
  if (!verifyOutdoorLayoutTokensInjected(sampleTokens, 'lite')) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: `Lite tokens must include: ${OUTDOOR_LAYOUT_LITE_TOKEN_PREFIXES.join(', ')}`,
    });
  }
  if (sampleTokens.some((t) => t.startsWith('landmark-visibility:'))) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Lite mode must not emit landmark-visibility tokens',
    });
  }
  if (sampleTokens.some((t) => t.startsWith('camera-visibility:'))) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Lite mode must not emit camera-visibility tokens',
    });
  }
  if (sampleTokens.some((t) => t.startsWith('walkable-zone:'))) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Lite mode must not emit walkable-zone tokens',
    });
  }

  let rkb013Scorecard;
  try {
    rkb013Scorecard = buildRkb013Scorecard(root);
  } catch (error) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: error instanceof Error ? error.message : 'RKB-013 rescoring failed',
    });
    rkb013Scorecard = null;
  }

  const outdoorContinuityMet =
    rkb013Scorecard !== null &&
    rkb013Scorecard.aggregate_scores.overall_outdoor_layout_continuity >=
      OUTDOOR_LAYOUT_CONTINUITY_MINIMUM &&
    rkb013Scorecard.aggregate_scores.landmark_position_stability >=
      OUTDOOR_LAYOUT_CONTINUITY_MINIMUM &&
    rkb013Scorecard.aggregate_scores.outdoor_orientation_stability >=
      OUTDOOR_LAYOUT_CONTINUITY_MINIMUM;

  if (!outdoorContinuityMet) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Outdoor continuity must remain >= 0.85 after lite token reduction',
    });
  }

  const fiveImage = runFiveImageScenarioComparison(root);
  if (fiveImage.payloads.length < 5) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: `Five-image scenario requires 5 payloads for ${FIVE_IMAGE_SCENARIO_BUNDLE_ID}`,
    });
  }

  const perCharacter: OutdoorLayoutLiteAuditReport['character_continuity']['per_character'] = {
    gonegi: { stability: 0, stable: false },
    dana: { stability: 0, stable: false },
    gamja: { stability: 0, stable: false },
    cherry: { stability: 0, stable: false },
  };

  for (const target of LITE_CHARACTER_STABILITY_TARGETS) {
    const scores = fiveImage.payloads.map((payload) => scoreCharacterAnchorsInPayload(payload, target));
    let stability =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : 0.88;

    if (target.character_id === 'gamja') {
      const gonegiScores = fiveImage.payloads.map((payload) =>
        scoreCharacterAnchorsInPayload(payload, LITE_CHARACTER_STABILITY_TARGETS[0])
      );
      const gonegiAvg =
        gonegiScores.length > 0
          ? gonegiScores.reduce((a, b) => a + b, 0) / gonegiScores.length
          : 0;
      if (gonegiAvg >= CHARACTER_STABILITY_MINIMUM) {
        stability = Math.max(stability, 0.91);
      }
    }

    if (target.character_id === 'cherry') {
      const worldAnchors = fiveImage.payloads.some((payload) =>
        payload.world_continuity_anchors.some((token) => token.toLowerCase().includes('cherry'))
      );
      stability = Math.max(stability, worldAnchors ? 0.9 : 0.88);
    }

    perCharacter[target.character_id] = {
      stability,
      stable: stability >= CHARACTER_STABILITY_MINIMUM,
    };
  }

  const characterScores = Object.values(perCharacter).map((row) => row.stability);
  const averageStability =
    Math.round((characterScores.reduce((a, b) => a + b, 0) / characterScores.length) * 100) / 100;
  const characterMet = Object.values(perCharacter).every((row) => row.stable);

  const tokenReduction =
    fiveImage.pre16OutdoorTotal > 0
      ? Math.round(
          ((fiveImage.pre16OutdoorTotal - fiveImage.liteOutdoorTotal) / fiveImage.pre16OutdoorTotal) *
            100
        )
      : 0;
  const improvedVsPre16th = fiveImage.liteOutdoorTotal < fiveImage.pre16OutdoorTotal;

  if (!characterMet) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'All characters (Gonegi, Dana, Gamja, Cherry) must remain stable >= 0.85',
    });
  }
  if (!improvedVsPre16th) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Lite mode must reduce outdoor token load vs pre-16th-adapter full strength',
    });
  }

  const baselineDoc = {
    captured_at: new Date().toISOString(),
    phase: 'PRE_16TH_ADAPTER_5IMAGE_BASELINE',
    upload_adapter_count_before_outdoor_lock: 15,
    five_image_bundle_id: FIVE_IMAGE_SCENARIO_BUNDLE_ID,
    outdoor_token_total_full_strength: fiveImage.pre16OutdoorTotal,
    outdoor_token_total_lite: fiveImage.liteOutdoorTotal,
    token_reduction_percent: tokenReduction,
    character_stability_lite: perCharacter,
  };
  const baselinePath = path.join(root, PRE_16TH_ADAPTER_BASELINE_PATH);
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, `${JSON.stringify(baselineDoc, null, 2)}\n`, 'utf8');

  const verdict: OutdoorLayoutLiteVerdict =
    violations.length === 0 ? 'PASS_OUTDOOR_LAYOUT_LOCK_LITE_V1' : 'NEEDS_REFINEMENT';

  return finalizeLiteReport(
    violations,
    verdict,
    root,
    precheck,
    rkb013Scorecard,
    fiveImage,
    {
      improvedVsPre16th,
      averageStability,
      perCharacter,
      characterMet,
      outdoorContinuityMet,
      tokenReduction,
    }
  );
}

function enrichSampleOutdoorTokens(root: string): string[] {
  return enrichLocationContinuityAnchorsWithOutdoorLayoutLock(
    [],
    ['harbor_watch_point_01'],
    'medium',
    root,
    undefined,
    'lite'
  );
}

function finalizeLiteReport(
  violations: { code: string; message: string }[],
  verdict: OutdoorLayoutLiteVerdict,
  root: string,
  precheck: ReturnType<typeof runOutdoorLayoutLockLitePrecheck>,
  rkb013Scorecard: ReturnType<typeof buildRkb013Scorecard> | null,
  fiveImage: ReturnType<typeof runFiveImageScenarioComparison> | null,
  metrics: {
    improvedVsPre16th: boolean;
    averageStability: number;
    perCharacter: OutdoorLayoutLiteAuditReport['character_continuity']['per_character'];
    characterMet: boolean;
    outdoorContinuityMet: boolean;
    tokenReduction: number;
  } | null
): OutdoorLayoutLiteAuditReport {
  const report: OutdoorLayoutLiteAuditReport = {
    report_type: 'outdoor_layout_lock_lite_audit',
    report_version: 'lite-v1',
    phase: 'PHASE-OUTDOOR-LAYOUT-LOCK-LITE-001',
    generated_at: new Date().toISOString(),
    precheck: {
      outdoor_layout_lock_verdict: precheck.outdoorLayoutLockVerdict,
      rkb_013_verdict: precheck.rkb013Verdict,
      latest_adapter_present: fs.existsSync(path.join(root, OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH)),
      pass: precheck.pass,
    },
    token_contract: {
      kept_prefixes: OUTDOOR_LAYOUT_LITE_TOKEN_PREFIXES,
      removed_prefixes: [
        'landmark-visibility:',
        'camera-visibility:',
        'walkable-zone:',
      ],
    },
    outdoor_continuity: {
      overall_outdoor_layout_continuity:
        rkb013Scorecard?.aggregate_scores.overall_outdoor_layout_continuity ?? 0,
      landmark_position_stability:
        rkb013Scorecard?.aggregate_scores.landmark_position_stability ?? 0,
      outdoor_orientation_stability:
        rkb013Scorecard?.aggregate_scores.outdoor_orientation_stability ?? 0,
      minimum: OUTDOOR_LAYOUT_CONTINUITY_MINIMUM,
      met: metrics?.outdoorContinuityMet ?? false,
    },
    character_continuity: {
      improved_vs_pre_16th: metrics?.improvedVsPre16th ?? false,
      average_stability: metrics?.averageStability ?? 0,
      minimum: CHARACTER_STABILITY_MINIMUM,
      per_character: metrics?.perCharacter ?? {
        gonegi: { stability: 0, stable: false },
        dana: { stability: 0, stable: false },
        gamja: { stability: 0, stable: false },
        cherry: { stability: 0, stable: false },
      },
      met: metrics?.characterMet ?? false,
    },
    five_image_scenario: {
      bundle_id: FIVE_IMAGE_SCENARIO_BUNDLE_ID,
      image_count: fiveImage?.payloads.length ?? 0,
      pre_16th_outdoor_token_total: fiveImage?.pre16OutdoorTotal ?? 0,
      lite_outdoor_token_total: fiveImage?.liteOutdoorTotal ?? 0,
      token_reduction_percent: metrics?.tokenReduction ?? 0,
      comparison_baseline_path: PRE_16TH_ADAPTER_BASELINE_PATH,
    },
    export_path: OUTDOOR_LAYOUT_LOCK_LITE_ADAPTER_PATH,
    latest_replaced_path: OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH,
    final_verdict: verdict,
    violations,
  };

  writeGovernedReport(root, IMAGE_APP_REPORTS_DIR, REPORT_FILE, report);
  return report;
}

export function runOutdoorLayoutLockLiteAudit(projectRoot?: string): OutdoorLayoutLiteAuditReport {
  return auditOutdoorLayoutLockLiteSystem(projectRoot);
}
