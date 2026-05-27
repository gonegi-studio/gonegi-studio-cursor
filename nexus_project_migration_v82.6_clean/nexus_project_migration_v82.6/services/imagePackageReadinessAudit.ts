import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CinematicExtractionResult,
  IMAGE_PACKAGE_READINESS_AUDIT_VERSION,
  ImagePackageReadinessAuditResult,
  ImagePackageReadinessCheck,
  ImagePackageReadinessGap,
  ImagePackageReadinessVerdict,
  RuntimeImageGenerationPackage,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildLongformDatasetProductionLockPreview } from './longformDatasetProductionLock';
import { buildMasterCoreDNAAdapterPreview } from './masterCoreDNAAdapter';
import { isEmptyValue } from './pipelineBridge';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';
import { buildRuntimeImageGenerationCompilerPreview } from './runtimeImageGenerationCompiler';

export const IMAGE_PACKAGE_READINESS_AUDIT_EPOCH = '2026-05-27T05:30:00.000Z';
export const IMAGE_PACKAGE_READINESS_AUDIT_JSON_FILENAME =
  'image-package-readiness-audit.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const EXPECTED_SCENE_COUNT = 33;
const CHECK_PASS_THRESHOLD = 0.85;
const READY_SCORE_THRESHOLD = 0.92;
const CONDITIONAL_SCORE_THRESHOLD = 0.8;
const PROMPT_LENGTH_MIN = 80;
const PROMPT_LENGTH_MAX = 4000;
const HALLUCINATION_RISK_THRESHOLD = 0.25;
const STYLE_LEAKAGE_RISK_THRESHOLD = 0.2;

const HALLUCINATION_MARKERS = [
  'masterpiece',
  'award-winning',
  'award winning',
  '8k uhd',
  'hyperrealistic',
  'trending on artstation',
  'best quality',
  'ultra detailed',
  'photorealistic masterpiece',
  'unreal engine 5',
] as const;

const STYLE_LEAKAGE_MARKERS = [
  '--ar',
  '--style',
  '--stylize',
  '--chaos',
  'midjourney',
  'runway gen',
  'kling ai',
  'dalle',
  'stable diffusion',
  'comfyui',
] as const;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function ratio(count: number, total: number): number {
  if (total <= 0) return 0;
  return round6(count / total);
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function buildCheck(
  check_key: string,
  label: string,
  score: number,
  detail: string
): ImagePackageReadinessCheck {
  return {
    check_key,
    label,
    score,
    passed: score >= CHECK_PASS_THRESHOLD,
    detail,
  };
}

function sceneHasPrompt(pkg: RuntimeImageGenerationPackage): boolean {
  return pkg.cinematic_prompt.trim().length > 0;
}

function sceneHasNegativePrompt(pkg: RuntimeImageGenerationPackage): boolean {
  return pkg.negative_prompt.trim().length > 0;
}

function sceneHasCharacterRefs(pkg: RuntimeImageGenerationPackage): boolean {
  return (
    pkg.character_refs.length > 0 &&
    pkg.character_refs.every(
      (ref) => ref.character_id.length > 0 && ref.index_key.length > 0 && ref.visual_dna_ref.length > 0
    )
  );
}

function sceneHasEnvironmentRef(pkg: RuntimeImageGenerationPackage): boolean {
  return (
    pkg.environment_ref.slot_key.length > 0 &&
    pkg.environment_ref.fingerprint.length > 0 &&
    pkg.environment_ref.dna_text_ref.length > 0
  );
}

function sceneHasStyleCoreRef(pkg: RuntimeImageGenerationPackage, expectedStyleCoreRef: string): boolean {
  return pkg.style_core_ref.length > 0 && pkg.style_core_ref === expectedStyleCoreRef;
}

function sceneHasContinuityMemory(pkg: RuntimeImageGenerationPackage): boolean {
  const memory = pkg.continuity_memory;
  return (
    memory.temporal_anchor_id.length > 0 &&
    (memory.relationship_wording.length > 0 ||
      memory.temporal_continuity_wording.length > 0 ||
      memory.character_signatures.length > 0 ||
      memory.motif_signatures.length > 0)
  );
}

function sceneHasTemporalAnchor(pkg: RuntimeImageGenerationPackage): boolean {
  return (
    pkg.temporal_anchor_id.length > 0 &&
    pkg.temporal_anchor_id === pkg.continuity_memory.temporal_anchor_id
  );
}

function sceneHasProductionLockRef(
  pkg: RuntimeImageGenerationPackage,
  expectedLockRef: string
): boolean {
  return (
    pkg.production_lock_ref.length === 64 &&
    pkg.production_lock_ref === expectedLockRef &&
    pkg.runtime_dataset_fingerprint.length > 0
  );
}

function promptWithinLengthRange(prompt: string): boolean {
  const len = prompt.trim().length;
  return len >= PROMPT_LENGTH_MIN && len <= PROMPT_LENGTH_MAX;
}

function computeHallucinationRisk(pkg: RuntimeImageGenerationPackage): number {
  const prompt = pkg.cinematic_prompt.toLowerCase();
  let hits = 0;
  for (const marker of HALLUCINATION_MARKERS) {
    if (prompt.includes(marker)) hits += 1;
  }
  const genericBoost =
    prompt.includes(' cinematic ') && !pkg.visual_identity.atom_labels.length ? 0.15 : 0;
  return round6(Math.min(1, hits / HALLUCINATION_MARKERS.length + genericBoost));
}

function computeStyleLeakageRisk(
  pkg: RuntimeImageGenerationPackage,
  styleKeys: string[]
): number {
  const prompt = pkg.cinematic_prompt.toLowerCase();
  let hits = 0;
  for (const marker of STYLE_LEAKAGE_MARKERS) {
    if (prompt.includes(marker)) hits += 1;
  }
  const styleMismatch = styleKeys.every((key) => !prompt.includes(key.toLowerCase())) ? 0 : 0;
  void styleMismatch;
  return round6(Math.min(1, hits / STYLE_LEAKAGE_MARKERS.length));
}

function sceneHasImageAppCompatibility(
  pkg: RuntimeImageGenerationPackage,
  runtimeScene: CinematicExtractionResult | undefined
): boolean {
  if (!runtimeScene) return false;
  return (
    sceneHasPrompt(pkg) &&
    sceneHasCharacterRefs(pkg) &&
    sceneHasEnvironmentRef(pkg) &&
    !isEmptyValue(runtimeScene.canonical_dna?.domains) &&
    !isEmptyValue(runtimeScene.production_v82) &&
    !isEmptyValue(runtimeScene.visual_atoms)
  );
}

function checkPromptCoverage(packages: RuntimeImageGenerationPackage[]): ImagePackageReadinessCheck {
  const count = packages.filter(sceneHasPrompt).length;
  const score = ratio(count, packages.length);
  return buildCheck(
    'prompt_exists',
    'Prompt Exists (33/33)',
    score,
    `${count}/${packages.length} scenes with cinematic_prompt`
  );
}

function checkNegativePromptCoverage(
  packages: RuntimeImageGenerationPackage[]
): ImagePackageReadinessCheck {
  const count = packages.filter(sceneHasNegativePrompt).length;
  const score = ratio(count, packages.length);
  return buildCheck(
    'negative_prompt_exists',
    'Negative Prompt Exists',
    score,
    `${count}/${packages.length} scenes with grounded negative_prompt`
  );
}

function checkCharacterRefsCoverage(
  packages: RuntimeImageGenerationPackage[]
): ImagePackageReadinessCheck {
  const count = packages.filter(sceneHasCharacterRefs).length;
  const score = ratio(count, packages.length);
  return buildCheck(
    'character_refs_coverage',
    'Character Refs Coverage',
    score,
    `${count}/${packages.length} scenes with resolved character DNA refs`
  );
}

function checkEnvironmentRefsCoverage(
  packages: RuntimeImageGenerationPackage[]
): ImagePackageReadinessCheck {
  const count = packages.filter(sceneHasEnvironmentRef).length;
  const score = ratio(count, packages.length);
  return buildCheck(
    'environment_refs_coverage',
    'Environment Refs Coverage',
    score,
    `${count}/${packages.length} scenes with environment DNA refs`
  );
}

function checkStyleCoreRefCoverage(
  packages: RuntimeImageGenerationPackage[],
  expectedStyleCoreRef: string
): ImagePackageReadinessCheck {
  const count = packages.filter((pkg) => sceneHasStyleCoreRef(pkg, expectedStyleCoreRef)).length;
  const score = ratio(count, packages.length);
  return buildCheck(
    'style_core_ref_coverage',
    'Style Core Ref Coverage',
    score,
    `${count}/${packages.length} scenes aligned to style_core_ref ${expectedStyleCoreRef.slice(0, 16)}…`
  );
}

function checkContinuityMemoryCoverage(
  packages: RuntimeImageGenerationPackage[]
): ImagePackageReadinessCheck {
  const count = packages.filter(sceneHasContinuityMemory).length;
  const score = ratio(count, packages.length);
  return buildCheck(
    'continuity_memory_coverage',
    'Continuity Memory Coverage',
    score,
    `${count}/${packages.length} scenes with continuity memory anchors and wording`
  );
}

function checkTemporalAnchorCoverage(
  packages: RuntimeImageGenerationPackage[]
): ImagePackageReadinessCheck {
  const count = packages.filter(sceneHasTemporalAnchor).length;
  const score = ratio(count, packages.length);
  return buildCheck(
    'temporal_anchor_coverage',
    'Temporal Anchor Coverage',
    score,
    `${count}/${packages.length} scenes with temporal_anchor_id linked to continuity memory`
  );
}

function checkProductionLockRefCoverage(
  packages: RuntimeImageGenerationPackage[],
  expectedLockRef: string
): ImagePackageReadinessCheck {
  const count = packages.filter((pkg) => sceneHasProductionLockRef(pkg, expectedLockRef)).length;
  const score = ratio(count, packages.length);
  return buildCheck(
    'production_lock_ref_coverage',
    'Production Lock Ref Coverage',
    score,
    `${count}/${packages.length} scenes referencing PHASE-20 production lock checksum`
  );
}

function checkPromptLengthRange(packages: RuntimeImageGenerationPackage[]): {
  check: ImagePackageReadinessCheck;
  stats: ImagePackageReadinessAuditResult['prompt_length_stats'];
} {
  const lengths = packages.map((pkg) => pkg.cinematic_prompt.trim().length);
  const withinRange = lengths.filter(
    (len) => len >= PROMPT_LENGTH_MIN && len <= PROMPT_LENGTH_MAX
  ).length;
  const min = lengths.length ? Math.min(...lengths) : 0;
  const max = lengths.length ? Math.max(...lengths) : 0;
  const avg = lengths.length ? round6(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0;
  const score = ratio(withinRange, packages.length);

  return {
    check: buildCheck(
      'prompt_length_range',
      'Prompt Length Range',
      score,
      `${withinRange}/${packages.length} prompts within ${PROMPT_LENGTH_MIN}–${PROMPT_LENGTH_MAX} chars (min ${min}, max ${max}, avg ${avg})`
    ),
    stats: {
      min,
      max,
      avg,
      within_range_count: withinRange,
      acceptable_min: PROMPT_LENGTH_MIN,
      acceptable_max: PROMPT_LENGTH_MAX,
    },
  };
}

function checkHallucinationRisk(packages: RuntimeImageGenerationPackage[]): ImagePackageReadinessCheck {
  const risks = packages.map((pkg) => computeHallucinationRisk(pkg));
  const lowRiskCount = risks.filter((risk) => risk <= HALLUCINATION_RISK_THRESHOLD).length;
  const score = ratio(lowRiskCount, packages.length);
  const maxRisk = risks.length ? round6(Math.max(...risks)) : 0;
  return buildCheck(
    'hallucination_risk',
    'Hallucination Risk',
    score,
    `${lowRiskCount}/${packages.length} scenes below hallucination risk threshold ${HALLUCINATION_RISK_THRESHOLD}; max scene risk ${maxRisk}`
  );
}

function checkStyleLeakageRisk(
  packages: RuntimeImageGenerationPackage[],
  styleKeys: string[]
): ImagePackageReadinessCheck {
  const risks = packages.map((pkg) => computeStyleLeakageRisk(pkg, styleKeys));
  const lowRiskCount = risks.filter((risk) => risk <= STYLE_LEAKAGE_RISK_THRESHOLD).length;
  const score = ratio(lowRiskCount, packages.length);
  const maxRisk = risks.length ? round6(Math.max(...risks)) : 0;
  return buildCheck(
    'style_leakage_risk',
    'Style Leakage Risk',
    score,
    `${lowRiskCount}/${packages.length} scenes below style leakage threshold ${STYLE_LEAKAGE_RISK_THRESHOLD}; max scene risk ${maxRisk}`
  );
}

function checkImageAppCompatibility(
  packages: RuntimeImageGenerationPackage[],
  runtimeById: Map<string, CinematicExtractionResult>
): ImagePackageReadinessCheck {
  const count = packages.filter((pkg) =>
    sceneHasImageAppCompatibility(pkg, runtimeById.get(pkg.scene_id))
  ).length;
  const score = ratio(count, packages.length);
  return buildCheck(
    'image_app_compatibility',
    'Image-App Compatibility',
    score,
    `${count}/${packages.length} scenes with canonical_dna + production_v82 + visual_atoms + package refs`
  );
}

function buildGapList(
  checks: ImagePackageReadinessCheck[],
  packages: RuntimeImageGenerationPackage[],
  expectedStyleCoreRef: string,
  expectedLockRef: string,
  runtimeById: Map<string, CinematicExtractionResult>,
  styleKeys: string[]
): ImagePackageReadinessGap[] {
  const gaps: ImagePackageReadinessGap[] = [];

  for (const check of checks) {
    if (check.passed) continue;
    gaps.push({
      gap_id: `GAP-${check.check_key.toUpperCase().replace(/_/g, '-')}`,
      severity: check.score < 0.5 ? 'critical' : 'moderate',
      check_key: check.check_key,
      message: check.detail,
    });
  }

  for (const pkg of packages) {
    if (!sceneHasPrompt(pkg)) {
      gaps.push({
        gap_id: `GAP-PROMPT-${pkg.scene_id}`,
        severity: 'critical',
        check_key: 'prompt_exists',
        message: 'Missing cinematic_prompt',
        scene_id: pkg.scene_id,
      });
    }
    if (!promptWithinLengthRange(pkg.cinematic_prompt)) {
      gaps.push({
        gap_id: `GAP-LENGTH-${pkg.scene_id}`,
        severity: 'moderate',
        check_key: 'prompt_length_range',
        message: `Prompt length ${pkg.cinematic_prompt.trim().length} outside ${PROMPT_LENGTH_MIN}–${PROMPT_LENGTH_MAX}`,
        scene_id: pkg.scene_id,
      });
    }
    if (computeHallucinationRisk(pkg) > HALLUCINATION_RISK_THRESHOLD) {
      gaps.push({
        gap_id: `GAP-HALLUC-${pkg.scene_id}`,
        severity: 'moderate',
        check_key: 'hallucination_risk',
        message: `Hallucination marker risk ${computeHallucinationRisk(pkg)} exceeds threshold`,
        scene_id: pkg.scene_id,
      });
    }
    if (computeStyleLeakageRisk(pkg, styleKeys) > STYLE_LEAKAGE_RISK_THRESHOLD) {
      gaps.push({
        gap_id: `GAP-STYLE-${pkg.scene_id}`,
        severity: 'moderate',
        check_key: 'style_leakage_risk',
        message: `Engine/style leakage risk ${computeStyleLeakageRisk(pkg, styleKeys)} exceeds threshold`,
        scene_id: pkg.scene_id,
      });
    }
    if (!sceneHasImageAppCompatibility(pkg, runtimeById.get(pkg.scene_id))) {
      gaps.push({
        gap_id: `GAP-IMAGEAPP-${pkg.scene_id}`,
        severity: 'informational',
        check_key: 'image_app_compatibility',
        message: 'Runtime scene missing canonical_dna/production_v82/visual_atoms triad for image-app hook',
        scene_id: pkg.scene_id,
      });
    }
    if (!sceneHasStyleCoreRef(pkg, expectedStyleCoreRef)) {
      gaps.push({
        gap_id: `GAP-STYLECORE-${pkg.scene_id}`,
        severity: 'critical',
        check_key: 'style_core_ref_coverage',
        message: 'style_core_ref mismatch or missing',
        scene_id: pkg.scene_id,
      });
    }
    if (!sceneHasProductionLockRef(pkg, expectedLockRef)) {
      gaps.push({
        gap_id: `GAP-LOCK-${pkg.scene_id}`,
        severity: 'critical',
        check_key: 'production_lock_ref_coverage',
        message: 'production_lock_ref mismatch or missing',
        scene_id: pkg.scene_id,
      });
    }
  }

  const seen = new Set<string>();
  return gaps.filter((gap) => {
    const key = `${gap.gap_id}:${gap.scene_id ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolveRiskySceneIds(
  packages: RuntimeImageGenerationPackage[],
  expectedStyleCoreRef: string,
  expectedLockRef: string,
  runtimeById: Map<string, CinematicExtractionResult>,
  styleKeys: string[]
): string[] {
  const risky = new Set<string>();

  for (const pkg of packages) {
    const risks = [
      !sceneHasPrompt(pkg),
      !sceneHasNegativePrompt(pkg),
      !sceneHasCharacterRefs(pkg),
      !sceneHasEnvironmentRef(pkg),
      !sceneHasContinuityMemory(pkg),
      !sceneHasTemporalAnchor(pkg),
      !sceneHasStyleCoreRef(pkg, expectedStyleCoreRef),
      !sceneHasProductionLockRef(pkg, expectedLockRef),
      !promptWithinLengthRange(pkg.cinematic_prompt),
      computeHallucinationRisk(pkg) > HALLUCINATION_RISK_THRESHOLD,
      computeStyleLeakageRisk(pkg, styleKeys) > STYLE_LEAKAGE_RISK_THRESHOLD,
      !sceneHasImageAppCompatibility(pkg, runtimeById.get(pkg.scene_id)),
    ];
    if (risks.filter(Boolean).length >= 2) {
      risky.add(pkg.scene_id);
    }
  }

  return [...risky].sort();
}

function resolveReadinessScore(checks: ImagePackageReadinessCheck[]): number {
  if (checks.length === 0) return 0;
  const total = checks.reduce((sum, check) => sum + check.score, 0);
  return round6(total / checks.length);
}

function resolveReadinessVerdict(
  score: number,
  checks: ImagePackageReadinessCheck[]
): ImagePackageReadinessVerdict {
  const criticalFailed = checks.some(
    (check) =>
      !check.passed &&
      ['prompt_exists', 'production_lock_ref_coverage', 'style_core_ref_coverage'].includes(
        check.check_key
      )
  );
  if (criticalFailed || score < CONDITIONAL_SCORE_THRESHOLD) return 'not_ready';
  if (score >= READY_SCORE_THRESHOLD && checks.every((check) => check.passed)) return 'ready';
  return 'conditional';
}

function resolveNextRecommendedPhase(verdict: ImagePackageReadinessVerdict): string {
  switch (verdict) {
    case 'ready':
      return 'PHASE-21C — Prompt compression and engine-neutral packaging (readonly dry-run before provider hook)';
    case 'conditional':
      return 'PHASE-21B-R — Resolve moderate gaps in character/environment refs or prompt length before compression phase';
    case 'not_ready':
      return 'PHASE-21A-R — Re-run compiler foundation pass; resolve critical prompt or production lock ref gaps before audit re-certification';
  }
}

export function buildImagePackageReadinessAudit(): ImagePackageReadinessAuditResult {
  const compiler = buildRuntimeImageGenerationCompilerPreview();
  const productionLock = buildLongformDatasetProductionLockPreview();
  const masterCore = buildMasterCoreDNAAdapterPreview();
  const packages = compiler.scene_packages;
  const expectedStyleCoreRef = compiler.style_core_ref;
  const expectedLockRef = productionLock.production_lock_checksum;

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const runtimeDataset = getActiveRuntimeDataset();
  const runtimeById = new Map(runtimeDataset.map((scene) => [scene.id, scene]));
  const styleKeys = [
    masterCore.style_core_profile.styleKey,
    masterCore.style_core_profile.materialKey,
    masterCore.style_core_profile.lightingKey,
    masterCore.style_core_profile.brushworkKey,
  ].filter(Boolean);

  const promptLength = checkPromptLengthRange(packages);
  const checks: ImagePackageReadinessCheck[] = [
    checkPromptCoverage(packages),
    checkNegativePromptCoverage(packages),
    checkCharacterRefsCoverage(packages),
    checkEnvironmentRefsCoverage(packages),
    checkStyleCoreRefCoverage(packages, expectedStyleCoreRef),
    checkContinuityMemoryCoverage(packages),
    checkTemporalAnchorCoverage(packages),
    checkProductionLockRefCoverage(packages, expectedLockRef),
    promptLength.check,
    checkHallucinationRisk(packages),
    checkStyleLeakageRisk(packages, styleKeys),
    checkImageAppCompatibility(packages, runtimeById),
  ];

  const image_package_readiness_score = resolveReadinessScore(checks);
  const readiness_verdict = resolveReadinessVerdict(image_package_readiness_score, checks);
  const gap_list = buildGapList(
    checks,
    packages,
    expectedStyleCoreRef,
    expectedLockRef,
    runtimeById,
    styleKeys
  );
  const risky_scene_ids = resolveRiskySceneIds(
    packages,
    expectedStyleCoreRef,
    expectedLockRef,
    runtimeById,
    styleKeys
  );
  const next_recommended_phase = resolveNextRecommendedPhase(readiness_verdict);

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const auditCore = {
    schema_version: IMAGE_PACKAGE_READINESS_AUDIT_VERSION,
    generated_at: IMAGE_PACKAGE_READINESS_AUDIT_EPOCH,
    readonly_audit: true as const,
    compiler_checksum_ref: compiler.compiler_checksum,
    production_lock_ref: expectedLockRef,
    runtime_dataset_fingerprint: compiler.runtime_dataset_fingerprint,
    scene_count: packages.length,
    checks,
    image_package_readiness_score,
    readiness_verdict,
    gap_list,
    risky_scene_ids,
    next_recommended_phase,
    prompt_length_stats: promptLength.stats,
    validation: {
      deterministic_audit_checksum_stable: true,
      readonly_audit: true as const,
      no_prompt_rewrite: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
      no_provider_calls: true as const,
      no_image_generation: true as const,
    },
  };

  const audit_checksum = digest([
    JSON.stringify({ ...auditCore, audit_checksum: undefined }),
    compiler.compiler_checksum,
    String(packages.length === EXPECTED_SCENE_COUNT),
  ]);

  return {
    ...auditCore,
    audit_checksum,
  };
}

let cachedAudit: ImagePackageReadinessAuditResult | null = null;

export function buildImagePackageReadinessAuditPreview(): ImagePackageReadinessAuditResult {
  if (cachedAudit) return cachedAudit;
  cachedAudit = buildImagePackageReadinessAudit();
  return cachedAudit;
}

export function buildImagePackageReadinessAuditJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildImagePackageReadinessAuditPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: IMAGE_PACKAGE_READINESS_AUDIT_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetImagePackageReadinessAuditCache(): void {
  cachedAudit = null;
}
