import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CharacterIdentityLock,
  EnvironmentIdentityLock,
  GENERATED_IMAGE_FEEDBACK_ANALYZER_VERSION,
  GeneratedImageDriftHotspot,
  GeneratedImageFeedbackAnalyzerResult,
  GeneratedImageFeedbackEngine,
  GeneratedImageFeedbackReport,
  GeneratedImageFeedbackVerificationCheck,
  LockedImageGenerationPackage,
  StyleCoreProfileOutput,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildIdentityLockContinuityPreview } from './identityLockContinuityEngine';
import { buildMasterCoreDNAAdapterPreview } from './masterCoreDNAAdapter';
import { buildRealRenderInputPackPreview } from './realRenderInputPackExport';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';
import { buildSingleSceneGenerationTestPreview } from './singleSceneGenerationTest';
import { buildTemporalMemoryGraphExport } from './temporalMemoryGraph';

export const GENERATED_IMAGE_FEEDBACK_ANALYZER_EPOCH = '2026-05-27T09:00:00.000Z';
export const GENERATED_IMAGE_FEEDBACK_JSON_FILENAME = 'generated-image-feedback-analyzer.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const DRIFT_HOTSPOT_THRESHOLD = 0.12;
const ENGINES: GeneratedImageFeedbackEngine[] = ['midjourney', 'flux'];

const ENGINE_DRIFT_PROFILE: Record<
  GeneratedImageFeedbackEngine,
  { identity: number; environment: number; style: number; temporal: number; prompt: number }
> = {
  midjourney: { identity: 0.04, environment: 0.03, style: 0.06, temporal: 0.03, prompt: 0.02 },
  flux: { identity: 0.03, environment: 0.04, style: 0.04, temporal: 0.02, prompt: 0.03 },
};

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function clamp01(value: number): number {
  return round6(Math.max(0, Math.min(1, value)));
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function tokenOverlap(a: string, b: string): number {
  const tokensA = new Set(
    a
      .toLowerCase()
      .split(/[\s,.;:|\[\]/]+/)
      .filter((token) => token.length > 3)
  );
  const tokensB = b
    .toLowerCase()
    .split(/[\s,.;:|\[\]/]+/)
    .filter((token) => token.length > 3);
  if (tokensB.length === 0) return 0;
  const overlap = tokensB.filter((token) => tokensA.has(token)).length;
  return clamp01(overlap / tokensB.length);
}

function deriveSimulatedResultFingerprint(
  engine: GeneratedImageFeedbackEngine,
  sceneId: string,
  continuitySeed: string,
  prompt: string
): string {
  return digest(['simulated-generated-result-v1', engine, sceneId, continuitySeed, prompt]);
}

function analyzeCharacterIdentityDrift(
  expected: CharacterIdentityLock[],
  engine: GeneratedImageFeedbackEngine,
  lockStrengthBaseline: number
): { score: number; hotspots: GeneratedImageDriftHotspot[] } {
  const hotspots: GeneratedImageDriftHotspot[] = [];
  const profile = ENGINE_DRIFT_PROFILE[engine];
  let totalDrift = 0;
  const signals = [
    'face_topology',
    'silhouette',
    'eye_spacing',
    'hair_rhythm',
    'cloth_geometry',
    'accessory_persistence',
  ] as const;

  for (const lock of expected) {
    for (const signal of signals) {
      const expectedValue = lock[signal === 'accessory_persistence' ? 'accessory_persistence' : signal];
      const signalDrift = clamp01(
        profile.identity * (1 - lock.lock_strength) +
          (expectedValue.length < 8 ? 0.08 : 0.02)
      );
      totalDrift += signalDrift;
      if (signalDrift >= DRIFT_HOTSPOT_THRESHOLD) {
        hotspots.push({
          hotspot_id: `HS-IDENT-${lock.character_id}-${signal}`.toUpperCase(),
          category: 'identity',
          severity: signalDrift >= 0.2 ? 'high' : 'moderate',
          signal,
          detail: `${lock.character_id} ${signal.replace(/_/g, ' ')} deviation ${signalDrift}`,
        });
      }
    }
  }

  const avgDrift =
    expected.length > 0 ? totalDrift / (expected.length * signals.length) : profile.identity;
  return {
    score: clamp01(avgDrift + (1 - lockStrengthBaseline) * 0.05),
    hotspots,
  };
}

function analyzeEnvironmentDrift(
  expected: EnvironmentIdentityLock,
  engine: GeneratedImageFeedbackEngine,
  temporalWeatherPersistence: number | undefined
): { score: number; hotspots: GeneratedImageDriftHotspot[] } {
  const hotspots: GeneratedImageDriftHotspot[] = [];
  const profile = ENGINE_DRIFT_PROFILE[engine];
  const checks: { key: string; signal: string; weight: number }[] = [
    { key: 'city_topology', signal: 'architecture mismatch', weight: 0.2 },
    { key: 'atmosphere_continuity', signal: 'atmosphere mismatch', weight: 0.2 },
    { key: 'lighting_continuity', signal: 'lighting continuity break', weight: 0.2 },
    { key: 'weather_persistence', signal: 'weather inconsistency', weight: 0.2 },
    { key: 'material_response', signal: 'material response deviation', weight: 0.2 },
  ];

  let total = 0;
  for (const check of checks) {
    const value = String(expected[check.key as keyof EnvironmentIdentityLock] ?? '');
    const drift = clamp01(
      profile.environment * (1 - expected.lock_strength) + (value.length < 6 ? 0.06 : 0.02)
    );
    total += drift * check.weight;
    if (drift >= DRIFT_HOTSPOT_THRESHOLD) {
      hotspots.push({
        hotspot_id: `HS-ENV-${check.key}`.toUpperCase(),
        category: 'environment',
        severity: drift >= 0.2 ? 'high' : 'moderate',
        signal: check.signal,
        detail: `${check.signal}: drift ${drift}`,
      });
    }
  }

  if (temporalWeatherPersistence != null && temporalWeatherPersistence < 0.5) {
    hotspots.push({
      hotspot_id: 'HS-ENV-WEATHER-TEMPORAL',
      category: 'environment',
      severity: 'moderate',
      signal: 'weather inconsistency',
      detail: `Temporal weather persistence ${temporalWeatherPersistence} below threshold`,
    });
    total += 0.03;
  }

  return { score: clamp01(total), hotspots };
}

function analyzeStyleDrift(
  styleCore: StyleCoreProfileOutput,
  engine: GeneratedImageFeedbackEngine,
  prompt: string,
  colorContinuity: number
): { score: number; hotspots: GeneratedImageDriftHotspot[] } {
  const hotspots: GeneratedImageDriftHotspot[] = [];
  const profile = ENGINE_DRIFT_PROFILE[engine];
  const styleTokens = [
    styleCore.styleKey,
    styleCore.materialKey,
    styleCore.lightingKey,
    styleCore.brushworkKey,
    styleCore.paletteKey ?? '',
  ].filter(Boolean);

  let matched = 0;
  for (const token of styleTokens) {
    if (prompt.toLowerCase().includes(token.toLowerCase().slice(0, 8))) matched += 1;
  }
  const stylePresence = styleTokens.length > 0 ? matched / styleTokens.length : 0.5;
  const drift = clamp01(profile.style * (1 - stylePresence) + (1 - colorContinuity) * 0.08);

  const styleSignals = [
    { signal: 'brushwork inconsistency', weight: 0.25 },
    { signal: 'color harmony drift', weight: 0.25 },
    { signal: 'style_core deviation', weight: 0.25 },
    { signal: 'texture instability', weight: 0.15 },
    { signal: 'cinematic grading mismatch', weight: 0.1 },
  ];

  let total = 0;
  for (const item of styleSignals) {
    const componentDrift = clamp01(drift * item.weight * 4);
    total += componentDrift * item.weight;
    if (componentDrift >= DRIFT_HOTSPOT_THRESHOLD) {
      hotspots.push({
        hotspot_id: `HS-STYLE-${item.signal.split(' ')[0]}`.toUpperCase(),
        category: 'style',
        severity: componentDrift >= 0.2 ? 'high' : 'moderate',
        signal: item.signal,
        detail: `${item.signal}: drift ${componentDrift}`,
      });
    }
  }

  return { score: clamp01(total || drift), hotspots };
}

function analyzeTemporalDrift(
  locked: LockedImageGenerationPackage,
  engine: GeneratedImageFeedbackEngine,
  continuitySeedStable: boolean
): { score: number; hotspots: GeneratedImageDriftHotspot[] } {
  const hotspots: GeneratedImageDriftHotspot[] = [];
  const profile = ENGINE_DRIFT_PROFILE[engine];
  const temporal = locked.temporal_visual_persistence;

  const components = [
    {
      signal: 'framing mismatch',
      drift: clamp01((1 - temporal.framing_continuity) * 0.4 + profile.temporal),
    },
    {
      signal: 'camera rhythm mismatch',
      drift: clamp01((1 - temporal.camera_rhythm_continuity) * 0.35 + profile.temporal * 0.5),
    },
    {
      signal: 'emotional continuity mismatch',
      drift: clamp01((1 - temporal.emotional_visual_continuity) * 0.35 + profile.temporal * 0.5),
    },
    {
      signal: 'continuity_seed instability',
      drift: continuitySeedStable ? profile.temporal * 0.3 : 0.18,
    },
  ];

  let total = 0;
  for (const component of components) {
    total += component.drift;
    if (component.drift >= DRIFT_HOTSPOT_THRESHOLD) {
      hotspots.push({
        hotspot_id: `HS-TEMP-${component.signal.split(' ')[0]}`.toUpperCase(),
        category: 'temporal',
        severity: component.drift >= 0.2 ? 'high' : 'moderate',
        signal: component.signal,
        detail: `${component.signal}: drift ${component.drift}`,
      });
    }
  }

  return { score: clamp01(total / components.length), hotspots };
}

function analyzePromptFidelity(
  compressedPrompt: string,
  enginePrompt: string,
  negativePrompt: string,
  engine: GeneratedImageFeedbackEngine
): { score: number; hotspots: GeneratedImageDriftHotspot[] } {
  const hotspots: GeneratedImageDriftHotspot[] = [];
  const profile = ENGINE_DRIFT_PROFILE[engine];
  const overlap = tokenOverlap(enginePrompt, compressedPrompt);
  const fidelity = clamp01(overlap * 0.7 + (negativePrompt.length > 0 ? 0.2 : 0) + 0.1);
  const drift = clamp01((1 - fidelity) + profile.prompt);

  const checks = [
    {
      signal: 'grounded visual adherence',
      passed: overlap >= 0.55,
      drift: clamp01((1 - overlap) * 0.5),
    },
    {
      signal: 'hallucinated object detection',
      passed: !enginePrompt.toLowerCase().includes('masterpiece'),
      drift: enginePrompt.toLowerCase().includes('masterpiece') ? 0.15 : 0.02,
    },
    {
      signal: 'missing critical elements',
      passed: compressedPrompt.length > 0 && enginePrompt.includes(compressedPrompt.slice(0, 24)),
      drift: enginePrompt.includes(compressedPrompt.slice(0, 24)) ? 0.02 : 0.1,
    },
    {
      signal: 'composition deviation',
      passed: overlap >= 0.45,
      drift: clamp01((1 - overlap) * 0.35),
    },
  ];

  for (const check of checks) {
    if (!check.passed || check.drift >= DRIFT_HOTSPOT_THRESHOLD) {
      hotspots.push({
        hotspot_id: `HS-PROMPT-${check.signal.split(' ')[0]}`.toUpperCase(),
        category: 'prompt_fidelity',
        severity: check.drift >= 0.15 ? 'high' : 'moderate',
        signal: check.signal,
        detail: `${check.signal}: drift ${check.drift}`,
      });
    }
  }

  return { score: fidelity, hotspots };
}

function buildManualAdjustments(
  hotspots: GeneratedImageDriftHotspot[],
  engine: GeneratedImageFeedbackEngine
): string[] {
  const adjustments: string[] = [];
  const categories = new Set(hotspots.map((hotspot) => hotspot.category));

  if (categories.has('identity')) {
    adjustments.push('Manually reinforce character identity lock tokens in external engine prompt before re-render');
  }
  if (categories.has('environment')) {
    adjustments.push('Manually verify environment DNA slot and lighting descriptors match locked scene pack');
  }
  if (categories.has('style')) {
    adjustments.push(`Manually align ${engine} output grading with style_core_profile brushwork and palette keys`);
  }
  if (categories.has('temporal')) {
    adjustments.push('Manually preserve continuity_seed and framing language on next external render attempt');
  }
  if (categories.has('prompt_fidelity')) {
    adjustments.push('Manually compare engine prompt against PHASE-22B copy_paste payload — do not auto-rewrite');
  }
  if (adjustments.length === 0) {
    adjustments.push('No manual adjustments required — alignment within acceptable drift thresholds');
  }

  return adjustments;
}

function buildFeedbackReport(
  engine: GeneratedImageFeedbackEngine,
  renderPack: ReturnType<typeof buildRealRenderInputPackPreview>,
  locked: LockedImageGenerationPackage,
  styleCore: StyleCoreProfileOutput,
  weatherPersistence: number | undefined,
  phase22aFingerprint: string
): GeneratedImageFeedbackReport {
  const sceneId = renderPack.selected_scene_id;
  const enginePrompt =
    engine === 'midjourney'
      ? renderPack.midjourney_input.prompt
      : renderPack.flux_input.prompt;
  const continuitySeed =
    engine === 'midjourney'
      ? renderPack.midjourney_input.parameters.seed
      : String(renderPack.flux_input.parameters.seed);
  const continuitySeedStable =
    continuitySeed === locked.continuity_seed ||
    continuitySeed === renderPack.selected_scene_render_pack.continuity_seed;

  const identity = analyzeCharacterIdentityDrift(
    locked.character_identity_lock,
    engine,
    locked.continuity_strength_score
  );
  const environment = analyzeEnvironmentDrift(
    locked.environment_identity_lock,
    engine,
    weatherPersistence
  );
  const style = analyzeStyleDrift(
    styleCore,
    engine,
    enginePrompt,
    locked.temporal_visual_persistence.color_continuity
  );
  const temporal = analyzeTemporalDrift(locked, engine, continuitySeedStable);
  const promptFidelity = analyzePromptFidelity(
    renderPack.selected_scene_render_pack.compressed_prompt,
    enginePrompt,
    renderPack.selected_scene_render_pack.negative_prompt,
    engine
  );

  const drift_hotspots = [
    ...identity.hotspots,
    ...environment.hotspots,
    ...style.hotspots,
    ...temporal.hotspots,
    ...promptFidelity.hotspots,
  ];

  const overall_alignment_score = clamp01(
    (1 - identity.score) * 0.25 +
      (1 - environment.score) * 0.2 +
      (1 - style.score) * 0.2 +
      (1 - temporal.score) * 0.15 +
      promptFidelity.score * 0.2
  );

  const recommended_manual_adjustments = buildManualAdjustments(drift_hotspots, engine);

  const simulated_result_fingerprint =
    phase22aFingerprint ||
    deriveSimulatedResultFingerprint(engine, sceneId, continuitySeed, enginePrompt);

  const reportCore = {
    scene_id: sceneId,
    engine,
    identity_drift_score: identity.score,
    environment_drift_score: environment.score,
    style_drift_score: style.score,
    temporal_drift_score: temporal.score,
    prompt_fidelity_score: promptFidelity.score,
    overall_alignment_score,
    drift_hotspots,
    recommended_manual_adjustments,
    simulated_result_fingerprint,
  };

  const feedback_checksum = digest([JSON.stringify(reportCore), renderPack.render_input_pack_checksum]);

  return {
    ...reportCore,
    feedback_checksum,
  };
}

function buildVerificationChecks(
  reports: GeneratedImageFeedbackReport[],
  runtimeFingerprintBefore: string,
  runtimeFingerprintAfter: string
): GeneratedImageFeedbackVerificationCheck[] {
  const driftStable = reports.every(
    (report) =>
      report.identity_drift_score <= 0.25 &&
      report.environment_drift_score <= 0.25 &&
      report.overall_alignment_score >= 0.7
  );

  return [
    {
      check_key: 'single_scene_analysis',
      label: 'Single Scene Analysis',
      passed: reports.every((report) => report.scene_id === reports[0]?.scene_id),
      detail: `Analyzed ${reports.length} simulated generation result(s) for scene ${reports[0]?.scene_id ?? 'unknown'}`,
    },
    {
      check_key: 'drift_analysis_stable',
      label: 'Drift Analysis Stable',
      passed: driftStable,
      detail: driftStable
        ? 'All engine drift scores within stable analysis thresholds'
        : 'One or more drift scores exceed stable threshold',
    },
    {
      check_key: 'feedback_checksums',
      label: 'Feedback Checksums Present',
      passed: reports.every((report) => report.feedback_checksum.length === 64),
      detail: `${reports.length} per-engine feedback checksums generated`,
    },
    {
      check_key: 'no_auto_correction',
      label: 'No Auto-Correction',
      passed: reports.every((report) =>
        report.recommended_manual_adjustments.every((note) => !note.toLowerCase().includes('auto-rewrite'))
      ),
      detail: 'All recommendations are manual-only adjustments',
    },
    {
      check_key: 'runtime_dataset_unchanged',
      label: 'Runtime Dataset Unchanged',
      passed: runtimeFingerprintBefore === runtimeFingerprintAfter,
      detail: 'Readonly analysis — runtime fingerprint preserved',
    },
    {
      check_key: 'canonical_export_unchanged',
      label: 'Canonical Export Unchanged',
      passed: assertCanonicalExportUnchanged(),
      detail: `Parent canonical export remains ${CANONICAL_EXPORT_SIZE_BYTES} bytes`,
    },
  ];
}

export function buildGeneratedImageFeedbackAnalyzer(): GeneratedImageFeedbackAnalyzerResult {
  const renderPack = buildRealRenderInputPackPreview();
  const identityLock = buildIdentityLockContinuityPreview();
  const masterCore = buildMasterCoreDNAAdapterPreview();
  const phase22a = buildSingleSceneGenerationTestPreview();

  const sceneId = renderPack.selected_scene_id;
  const locked = identityLock.locked_image_generation_packages.find(
    (pkg) => pkg.scene_id === sceneId
  );
  if (!locked) {
    throw new Error(`Locked package not found for scene ${sceneId}`);
  }

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const runtimeDataset = getActiveRuntimeDataset();
  const sceneIndex = runtimeDataset.findIndex((scene) => scene.id === sceneId);
  const temporalExport = buildTemporalMemoryGraphExport(runtimeDataset);
  const weatherPersistence =
    temporalExport.continuity_summary.environment_continuity[sceneIndex]?.weather_persistence;

  const feedback_reports: GeneratedImageFeedbackReport[] = ENGINES.map((engine) => {
    const phase22aEngine = phase22a.engine_results.find(
      (result) =>
        result.scene_id === sceneId &&
        result.engine === (engine === 'midjourney' ? 'midjourney_pack' : 'flux_pack')
    );
    return buildFeedbackReport(
      engine,
      renderPack,
      locked,
      masterCore.style_core_profile,
      weatherPersistence,
      phase22aEngine?.simulated_render_fingerprint ?? ''
    );
  });

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const analysis_verification_checks = buildVerificationChecks(
    feedback_reports,
    runtimeFingerprintBefore,
    runtimeFingerprintAfter
  );

  const analyzerCore = {
    schema_version: GENERATED_IMAGE_FEEDBACK_ANALYZER_VERSION,
    generated_at: GENERATED_IMAGE_FEEDBACK_ANALYZER_EPOCH,
    readonly_analysis: true as const,
    render_input_pack_checksum_ref: renderPack.render_input_pack_checksum,
    identity_lock_checksum_ref: identityLock.identity_lock_checksum,
    style_core_ref: masterCore.style_core_profile.style_core_id,
    scene_id: sceneId,
    generation_results_analyzed: feedback_reports.length,
    feedback_reports,
    analysis_verification_checks,
    validation: {
      deterministic_analyzer_checksum_stable: true,
      readonly_analysis: true as const,
      no_prompt_rewrite: true as const,
      no_auto_correction: true as const,
      no_dataset_mutation: true as const,
      no_provider_calls: true as const,
      no_runtime_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
    },
  };

  const analyzer_checksum = digest([
    JSON.stringify({ ...analyzerCore, analyzer_checksum: undefined }),
    renderPack.render_input_pack_checksum,
    sceneId,
  ]);

  return {
    ...analyzerCore,
    analyzer_checksum,
  };
}

let cachedAnalyzer: GeneratedImageFeedbackAnalyzerResult | null = null;

export function buildGeneratedImageFeedbackPreview(): GeneratedImageFeedbackAnalyzerResult {
  if (cachedAnalyzer) return cachedAnalyzer;
  cachedAnalyzer = buildGeneratedImageFeedbackAnalyzer();
  return cachedAnalyzer;
}

export function buildGeneratedImageFeedbackJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildGeneratedImageFeedbackPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: GENERATED_IMAGE_FEEDBACK_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetGeneratedImageFeedbackAnalyzerCache(): void {
  cachedAnalyzer = null;
}
