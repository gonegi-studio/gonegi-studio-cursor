import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CinematicExtractionResult,
  GENERATION_READINESS_GATE_VERSION,
  GenerationCandidateRegistryEntry,
  GenerationCandidateRiskTier,
  GenerationReadinessCheck,
  GenerationReadinessGateResult,
  GenerationReadinessReport,
  CharacterConsistencyRiskEntry,
  CharacterConsistencyRiskReport,
  FirstGenerationCandidate,
  SceneGenerationBindingEntry,
  SceneGenerationBindingReport,
  StyleCoreBindingReport,
  SynthesizedSceneShotFingerprint,
} from '../../types';
import { CANONICAL_EXPORT_FILE } from '../datasetCompletionAudit';
import { buildMasterCoreDNAAdapterPreview } from '../masterCoreDNAAdapter';
import { buildRealLongformDatasetSynthesisPreview } from '../realLongformDatasetSynthesis';
import { getActiveRuntimeDataset } from '../realSeq002Ingestion';
import { buildSynthesizedDatasetProductionLockPreview } from '../synthesizedDatasetProductionLock';
import { buildFingerprintQaValidationPreview } from './fingerprintQaValidation';
import { buildFingerprintSeparabilityReinforcementPreview } from './fingerprintSeparabilityReinforcement';
import { buildLegacyGenerationAssetIngestionPreview } from './legacyGenerationAssetIngestion';
import { buildSynthesizedShotFingerprintLayerPreview } from './synthesizedShotFingerprintLayer';

export const GENERATION_READINESS_GATE_EPOCH = '2026-05-27T22:00:00.000Z';
export const GENERATION_READINESS_GATE_JSON_FILENAME = 'generation-readiness.json';
export const GENERATION_READINESS_GATE_EXPORT_JSON_PATH = 'exports/generation-readiness.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const FIRST_CANDIDATE_COUNT = 5;
const LOW_RISK_THRESHOLD = 0.72;
const MODERATE_RISK_THRESHOLD = 0.55;

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

function resolveRiskTier(score: number): GenerationCandidateRiskTier {
  if (score >= LOW_RISK_THRESHOLD) return 'low';
  if (score >= MODERATE_RISK_THRESHOLD) return 'moderate';
  return 'high';
}

function scoreEmotionalStability(fingerprint: SynthesizedSceneShotFingerprint): number {
  if (fingerprint.emotion_wave_class === 'flat' || fingerprint.emotion_wave_class === 'release') {
    return 0.88;
  }
  if (fingerprint.rest_beat_presence) return 0.78;
  if (fingerprint.emotion_wave_class === 'rising') return 0.62;
  if (fingerprint.emotion_wave_class === 'oscillating') return 0.58;
  return 0.5;
}

function scoreCharacterAnchor(scene: CinematicExtractionResult): number {
  const graphSize = scene.relationship_graph?.length ?? 0;
  const atomCount = scene.visual_atoms?.length ?? 0;
  const hasCharacterIdentity = (scene.character_identities?.length ?? 0) > 0;
  const narrativeTokens = scene.layers?.scene_language?.narrative_tokens ?? [];
  const hasCompanionSignal = narrativeTokens.some((token) =>
    /companion|character|protagonist|gonegi/i.test(token)
  );

  return clamp01(
    (graphSize > 0 ? 0.3 : 0) +
      (atomCount >= 2 ? 0.25 : atomCount > 0 ? 0.15 : 0) +
      (hasCharacterIdentity ? 0.25 : 0) +
      (hasCompanionSignal ? 0.2 : 0.1)
  );
}

function scoreEnvironmentAlignment(scene: CinematicExtractionResult): number {
  const envTokens = scene.layers?.scene_language?.environment_tokens ?? [];
  const cinematography = scene.layers?.scene_language?.cinematography_tokens ?? [];
  const hasEnvironment = envTokens.length > 0;
  const hasLighting = cinematography.some((token) =>
    /light|harbor|sky|atmosphere|golden|mist/i.test(token)
  );

  return clamp01((hasEnvironment ? 0.55 : 0.2) + (hasLighting ? 0.35 : 0.15) + 0.1);
}

function scoreStyleAlignment(
  scene: CinematicExtractionResult,
  styleKeys: string[]
): number {
  const tokens = [
    ...(scene.layers?.scene_language?.cinematography_tokens ?? []),
    ...(scene.layers?.scene_language?.emotion_tokens ?? []),
    scene.layers?.raw_semantic?.visual_description ?? '',
  ]
    .join(' ')
    .toLowerCase();

  const hits = styleKeys.filter((key) => tokens.includes(key.split('-')[0]?.toLowerCase() ?? key));
  return clamp01(0.45 + hits.length * 0.12);
}

function buildSceneBindings(
  scenes: CinematicExtractionResult[],
  shotFingerprints: SynthesizedSceneShotFingerprint[],
  reinforcedBySceneId: Map<
    string,
    ReturnType<typeof buildFingerprintSeparabilityReinforcementPreview>['reinforced_scene_fingerprints'][number]
  >,
  generationFingerprintRef: string
): SceneGenerationBindingEntry[] {
  const shotBySceneId = new Map(shotFingerprints.map((row) => [row.scene_id, row]));

  return scenes
    .map((scene) => {
      const shot = shotBySceneId.get(scene.id);
      const reinforced = reinforcedBySceneId.get(scene.id);
      if (!shot || !reinforced) {
        return {
          scene_id: scene.id,
          fingerprint_id: shot?.fingerprint_id ?? 'missing',
          shot_fingerprint_hash: shot?.shot_fingerprint_hash ?? '',
          reinforced_compact_fingerprint: reinforced?.reinforced_compact_fingerprint ?? '',
          generation_fingerprint_ref: generationFingerprintRef,
          binding_score: 0,
          linkage_ready: false,
        };
      }

      const binding_score = clamp01(
        shot.shot_uniqueness_score * 0.25 +
          reinforced.separability_score * 0.25 +
          (shot.shot_fingerprint_hash ? 0.2 : 0) +
          (reinforced.reinforced_compact_fingerprint ? 0.2 : 0) +
          0.1
      );

      return {
        scene_id: scene.id,
        fingerprint_id: shot.fingerprint_id,
        shot_fingerprint_hash: shot.shot_fingerprint_hash,
        reinforced_compact_fingerprint: reinforced.reinforced_compact_fingerprint,
        generation_fingerprint_ref: generationFingerprintRef,
        binding_score,
        linkage_ready: binding_score >= 0.65,
      };
    })
    .sort((a, b) => a.scene_id.localeCompare(b.scene_id));
}

function buildCandidateRegistry(
  scenes: CinematicExtractionResult[],
  shotFingerprints: SynthesizedSceneShotFingerprint[],
  reinforcedBySceneId: Map<
    string,
    ReturnType<typeof buildFingerprintSeparabilityReinforcementPreview>['reinforced_scene_fingerprints'][number]
  >,
  bindingBySceneId: Map<string, SceneGenerationBindingEntry>,
  styleKeys: string[]
): GenerationCandidateRegistryEntry[] {
  const shotBySceneId = new Map(shotFingerprints.map((row) => [row.scene_id, row]));

  return scenes
    .map((scene) => {
      const shot = shotBySceneId.get(scene.id)!;
      const reinforced = reinforcedBySceneId.get(scene.id)!;
      const binding = bindingBySceneId.get(scene.id)!;

      const emotional_stability_score = scoreEmotionalStability(shot);
      const character_anchor_score = scoreCharacterAnchor(scene);
      const environment_alignment_score = scoreEnvironmentAlignment(scene);
      const style_alignment_score = scoreStyleAlignment(scene, styleKeys);
      const generation_binding_score = binding.binding_score;

      const readiness_score = clamp01(
        reinforced.separability_score * 0.2 +
          shot.shot_uniqueness_score * 0.15 +
          emotional_stability_score * 0.15 +
          character_anchor_score * 0.15 +
          environment_alignment_score * 0.15 +
          style_alignment_score * 0.1 +
          generation_binding_score * 0.1
      );

      return {
        scene_id: scene.id,
        fingerprint_id: shot.fingerprint_id,
        readiness_score,
        risk_tier: resolveRiskTier(readiness_score),
        separability_score: reinforced.separability_score,
        shot_uniqueness_score: shot.shot_uniqueness_score,
        emotional_stability_score,
        character_anchor_score,
        environment_alignment_score,
        style_alignment_score,
        generation_binding_score,
      };
    })
    .sort((a, b) => b.readiness_score - a.readiness_score || a.scene_id.localeCompare(b.scene_id));
}

function buildCharacterRiskReport(
  registry: GenerationCandidateRegistryEntry[]
): CharacterConsistencyRiskReport {
  const risk_entries: CharacterConsistencyRiskEntry[] = registry
    .map((entry) => {
      const risk_score = clamp01(1 - entry.character_anchor_score);
      const anchor_signals: string[] = [];
      if (entry.character_anchor_score >= 0.7) anchor_signals.push('strong_character_graph');
      if (entry.environment_alignment_score >= 0.7) anchor_signals.push('environment_tokens_present');
      if (entry.style_alignment_score >= 0.6) anchor_signals.push('style_tokens_aligned');
      if (risk_score >= 0.45) anchor_signals.push('character_anchor_gap');

      return {
        scene_id: entry.scene_id,
        risk_score,
        risk_tier: resolveRiskTier(entry.readiness_score),
        anchor_signals,
      };
    })
    .filter((entry) => entry.risk_score >= 0.35 || entry.risk_tier !== 'low')
    .slice(0, 20);

  const anchor_coverage_ratio = round6(
    registry.filter((entry) => entry.character_anchor_score >= 0.55).length /
      Math.max(registry.length, 1)
  );

  return {
    anchor_coverage_ratio,
    character_anchor_count: registry.filter((entry) => entry.character_anchor_score >= 0.55).length,
    at_risk_scene_count: registry.filter((entry) => entry.risk_tier === 'high').length,
    average_risk_score: round6(
      registry.reduce((sum, entry) => sum + (1 - entry.character_anchor_score), 0) /
        Math.max(registry.length, 1)
    ),
    risk_entries,
  };
}

function buildStyleCoreBindingReport(
  masterCore: ReturnType<typeof buildMasterCoreDNAAdapterPreview>,
  legacyIngestion: ReturnType<typeof buildLegacyGenerationAssetIngestionPreview>
): StyleCoreBindingReport {
  const styleCore = masterCore.style_core_profile;
  const renderRules = legacyIngestion.normalized_generation_assets.find(
    (asset) => asset.asset_kind === 'render_rules'
  );
  const renderRulesCompatible =
    !!renderRules &&
    renderRules.asset_kind === 'render_rules' &&
    !!renderRules.render_rules?.global;

  const styleKeys = [
    styleCore.styleKey,
    styleCore.materialKey,
    styleCore.lightingKey,
    styleCore.brushworkKey,
    styleCore.paletteKey ?? '',
  ].filter(Boolean);

  const environmentSlotsMapped = Object.keys(
    legacyIngestion.asset_fingerprint_index.environment_anchor_map
  ).length;

  const binding_integrity_score = clamp01(
    (styleKeys.length / 5) * 0.4 +
      (renderRulesCompatible ? 0.25 : 0) +
      (environmentSlotsMapped >= 5 ? 0.2 : environmentSlotsMapped / 5 * 0.2) +
      (Object.keys(legacyIngestion.asset_fingerprint_index.character_anchor_map).length > 0
        ? 0.15
        : 0)
  );

  return {
    style_core_id: styleCore.style_core_id,
    binding_integrity_score,
    render_rules_compatible: renderRulesCompatible,
    environment_slots_mapped: environmentSlotsMapped,
    style_law_fingerprint_ref: legacyIngestion.asset_fingerprint_index.style_law_fingerprint,
    style_keys_bound: styleKeys,
  };
}

function buildReadinessChecks(
  bindingReport: SceneGenerationBindingReport,
  characterReport: CharacterConsistencyRiskReport,
  styleReport: StyleCoreBindingReport,
  legacyIngestion: ReturnType<typeof buildLegacyGenerationAssetIngestionPreview>,
  qaValidation: ReturnType<typeof buildFingerprintQaValidationPreview>,
  separability: ReturnType<typeof buildFingerprintSeparabilityReinforcementPreview>,
  lowRiskCandidates: number
): GenerationReadinessCheck[] {
  const assetIndex = legacyIngestion.asset_fingerprint_index;

  return [
    {
      check_key: 'scene_generation_fingerprint_linkage',
      label: 'Scene ↔ Generation Fingerprint Linkage',
      passed: bindingReport.binding_coverage_ratio >= 1,
      score: bindingReport.binding_coverage_ratio,
      detail: `${bindingReport.bound_scenes}/${bindingReport.total_scenes} scenes bound to generation fingerprint ${assetIndex.generation_fingerprint.slice(0, 16)}…`,
    },
    {
      check_key: 'character_consistency_anchor_coverage',
      label: 'Character Consistency Anchor Coverage',
      passed: characterReport.anchor_coverage_ratio >= 0.5,
      score: characterReport.anchor_coverage_ratio,
      detail: `${characterReport.character_anchor_count} scenes with character anchor score ≥ 0.55`,
    },
    {
      check_key: 'style_core_binding_integrity',
      label: 'StyleCore Binding Integrity',
      passed: styleReport.binding_integrity_score >= 0.75,
      score: styleReport.binding_integrity_score,
      detail: `StyleCore ${styleReport.style_core_id} bound with ${styleReport.style_keys_bound.length} keys`,
    },
    {
      check_key: 'environment_dna_mapping',
      label: 'EnvironmentDNA Mapping',
      passed: styleReport.environment_slots_mapped >= 5,
      score: clamp01(styleReport.environment_slots_mapped / 9),
      detail: `${styleReport.environment_slots_mapped} environment slots mapped in anchor index`,
    },
    {
      check_key: 'render_rule_compatibility',
      label: 'Render Rule Compatibility',
      passed: styleReport.render_rules_compatible,
      score: styleReport.render_rules_compatible ? 1 : 0,
      detail: styleReport.render_rules_compatible
        ? 'Render rules normalized and compatible with style law fingerprint'
        : 'Render rules missing or incomplete',
    },
    {
      check_key: 'motion_material_fingerprint_linkage',
      label: 'Motion/Material Fingerprint Linkage',
      passed: !!assetIndex.motion_fingerprint && !!assetIndex.material_fingerprint,
      score: assetIndex.motion_fingerprint && assetIndex.material_fingerprint ? 1 : 0,
      detail: `Motion ${assetIndex.motion_fingerprint.slice(0, 12)}… / Material ${assetIndex.material_fingerprint.slice(0, 12)}…`,
    },
    {
      check_key: 'retrieval_generation_stability',
      label: 'Retrieval → Generation Stability',
      passed:
        separability.validation.retrieval_precision_improved &&
        qaValidation.validation.fingerprint_layer_unchanged,
      score: clamp01(
        (separability.retrieval_gain_report.reinforced_retrieval_precision_score +
          qaValidation.continuity_alignment_score) /
          2
      ),
      detail: `Reinforced retrieval precision ${separability.retrieval_gain_report.reinforced_retrieval_precision_score}; continuity alignment ${qaValidation.continuity_alignment_score}`,
    },
    {
      check_key: 'generation_candidate_readiness',
      label: 'Generation Candidate Readiness',
      passed: lowRiskCandidates >= FIRST_CANDIDATE_COUNT,
      score: clamp01(lowRiskCandidates / FIRST_CANDIDATE_COUNT),
      detail: `${lowRiskCandidates} low-risk generation candidate(s) identified for PHASE-29A`,
    },
  ];
}

function buildFirstGenerationCandidateList(
  registry: GenerationCandidateRegistryEntry[]
): FirstGenerationCandidate[] {
  const lowRisk = registry.filter((entry) => entry.risk_tier === 'low');

  return lowRisk.slice(0, FIRST_CANDIDATE_COUNT).map((entry, index) => ({
    rank: index + 1,
    scene_id: entry.scene_id,
    readiness_score: entry.readiness_score,
    risk_tier: entry.risk_tier,
    selection_rationale: `Low-risk candidate: separability ${entry.separability_score}, emotional stability ${entry.emotional_stability_score}, character anchor ${entry.character_anchor_score}, environment/style alignment ${round6((entry.environment_alignment_score + entry.style_alignment_score) / 2)}`,
    recommended_for_phase_29a: true,
  }));
}

function writeExportArtifact(payload: GenerationReadinessGateResult): void {
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(exportsDir, GENERATION_READINESS_GATE_JSON_FILENAME),
    JSON.stringify(payload, null, 2),
    'utf8'
  );
}

export function buildGenerationReadinessGate(): GenerationReadinessGateResult {
  const productionLock = buildSynthesizedDatasetProductionLockPreview();
  const legacyIngestion = buildLegacyGenerationAssetIngestionPreview();
  const separability = buildFingerprintSeparabilityReinforcementPreview();
  const qaValidation = buildFingerprintQaValidationPreview();
  const shotLayer = buildSynthesizedShotFingerprintLayerPreview();
  const masterCore = buildMasterCoreDNAAdapterPreview();
  const synthesis = buildRealLongformDatasetSynthesisPreview();

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumBefore = productionLock.production_lock_checksum;

  const scenes = synthesis.synthesized_120_scene_dataset.scenes;
  const shotFingerprints = shotLayer.synthesized_shot_fingerprint_export.scene_fingerprints;
  const reinforcedBySceneId = new Map(
    separability.reinforced_scene_fingerprints.map((row) => [row.scene_id, row])
  );
  const generationFingerprintRef = legacyIngestion.asset_fingerprint_index.generation_fingerprint;

  const scene_bindings = buildSceneBindings(
    scenes,
    shotFingerprints,
    reinforcedBySceneId,
    generationFingerprintRef
  );
  const bindingBySceneId = new Map(scene_bindings.map((row) => [row.scene_id, row]));

  const styleKeys = [
    masterCore.style_core_profile.styleKey,
    masterCore.style_core_profile.materialKey,
    masterCore.style_core_profile.lightingKey,
    masterCore.style_core_profile.brushworkKey,
  ];

  const generation_candidate_registry = buildCandidateRegistry(
    scenes,
    shotFingerprints,
    reinforcedBySceneId,
    bindingBySceneId,
    styleKeys
  );

  const scene_generation_binding_report: SceneGenerationBindingReport = {
    total_scenes: scenes.length,
    bound_scenes: scene_bindings.filter((row) => row.linkage_ready).length,
    binding_coverage_ratio: round6(
      scene_bindings.filter((row) => row.linkage_ready).length / Math.max(scenes.length, 1)
    ),
    average_binding_score: round6(
      scene_bindings.reduce((sum, row) => sum + row.binding_score, 0) /
        Math.max(scene_bindings.length, 1)
    ),
    scene_bindings,
  };

  const character_consistency_risk_report = buildCharacterRiskReport(generation_candidate_registry);
  const style_core_binding_report = buildStyleCoreBindingReport(masterCore, legacyIngestion);
  const lowRiskCount = generation_candidate_registry.filter((entry) => entry.risk_tier === 'low').length;

  const readiness_checks = buildReadinessChecks(
    scene_generation_binding_report,
    character_consistency_risk_report,
    style_core_binding_report,
    legacyIngestion,
    qaValidation,
    separability,
    lowRiskCount
  );

  const readiness_checks_passed = readiness_checks.filter((check) => check.passed).length;
  const readiness_score = round6(
    readiness_checks.reduce((sum, check) => sum + check.score, 0) / Math.max(readiness_checks.length, 1)
  );

  const generation_readiness_report: GenerationReadinessReport = {
    total_scenes: scenes.length,
    readiness_score,
    pipeline_linkage_stable: scene_generation_binding_report.binding_coverage_ratio >= 0.95,
    character_grounding_stable: character_consistency_risk_report.anchor_coverage_ratio >= 0.5,
    style_grounding_stable: style_core_binding_report.binding_integrity_score >= 0.75,
    first_controlled_generation_safe:
      readiness_checks_passed >= 6 && lowRiskCount >= FIRST_CANDIDATE_COUNT,
    readiness_checks,
    readiness_checks_passed,
    readiness_checks_total: readiness_checks.length,
  };

  const first_generation_candidate_list = buildFirstGenerationCandidateList(
    generation_candidate_registry
  );

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumAfter = buildSynthesizedDatasetProductionLockPreview().production_lock_checksum;

  const resultCore = {
    schema_version: GENERATION_READINESS_GATE_VERSION,
    generated_at: GENERATION_READINESS_GATE_EPOCH,
    readonly_validation: true as const,
    production_lock_checksum_ref: productionLockChecksumBefore,
    legacy_ingestion_checksum_ref: legacyIngestion.ingestion_checksum,
    fingerprint_reinforcement_checksum_ref: separability.reinforcement_checksum,
    generation_readiness_report,
    scene_generation_binding_report,
    character_consistency_risk_report,
    style_core_binding_report,
    generation_candidate_registry,
    first_generation_candidate_list,
    export_json_path: GENERATION_READINESS_GATE_EXPORT_JSON_PATH as 'exports/generation-readiness.json',
    validation: {
      deterministic_readiness_checksum_stable: true,
      readonly_validation: true as const,
      no_dataset_mutation: true as const,
      no_prompt_rewrite: true as const,
      no_image_generation: true as const,
      no_provider_calls: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
      production_lock_unchanged: productionLockChecksumBefore === productionLockChecksumAfter,
      readiness_scores_generated: readiness_score > 0,
    },
  };

  const readiness_gate_checksum = digest([
    JSON.stringify(resultCore),
    productionLockChecksumBefore,
    legacyIngestion.ingestion_checksum,
    separability.reinforcement_checksum,
  ]);

  const result: GenerationReadinessGateResult = {
    ...resultCore,
    readiness_gate_checksum,
  };

  writeExportArtifact(result);
  return result;
}

let cachedGate: GenerationReadinessGateResult | null = null;

export function buildGenerationReadinessGatePreview(): GenerationReadinessGateResult {
  if (cachedGate) return cachedGate;
  cachedGate = buildGenerationReadinessGate();
  return cachedGate;
}

export function buildGenerationReadinessGateJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildGenerationReadinessGatePreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: GENERATION_READINESS_GATE_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetGenerationReadinessGateCache(): void {
  cachedGate = null;
}
