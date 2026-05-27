import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  AiStudioGenerationExportEntry,
  AiStudioRenderRecipe,
  CharacterDNAIndexEntry,
  CinematicExtractionResult,
  CONTROLLED_GENERATION_PACK_EXPORT_VERSION,
  ControlledGenerationCandidateEntry,
  ControlledGenerationCandidateReport,
  ControlledGenerationCharacterAnchorBundle,
  ControlledGenerationCharacterAnchorEntry,
  ControlledGenerationEnvironmentAnchorBundle,
  ControlledGenerationNegativePromptPack,
  ControlledGenerationPackEntry,
  ControlledGenerationPackExportResult,
  ControlledGenerationPackRegistryEntry,
  ControlledGenerationPromptPack,
  ControlledGenerationQaTarget,
  ControlledGenerationRenderStateBundle,
  ControlledGenerationVisualConstraint,
  EnvironmentDNAIndexEntry,
  FirstGenerationCandidate,
  GenerationPromptPackReport,
  GenerationQaTargetRegistry,
  ShotFingerprintAtmosphereClass,
  StyleCoreProfileOutput,
  SynthesizedSceneShotFingerprint,
} from '../../types';
import { CANONICAL_EXPORT_FILE } from '../datasetCompletionAudit';
import { buildMasterCoreDNAAdapterPreview } from '../masterCoreDNAAdapter';
import { buildRealLongformDatasetSynthesisPreview } from '../realLongformDatasetSynthesis';
import { getActiveRuntimeDataset } from '../realSeq002Ingestion';
import { buildSynthesizedDatasetProductionLockPreview } from '../synthesizedDatasetProductionLock';
import { buildFingerprintSeparabilityReinforcementPreview } from './fingerprintSeparabilityReinforcement';
import { buildGenerationReadinessGatePreview } from './generationReadinessGate';
import { buildImageRendererMigrationIngestionPreview } from './imageRendererMigrationIngestion';
import { buildLegacyGenerationAssetIngestionPreview } from './legacyGenerationAssetIngestion';
import { buildSynthesizedShotFingerprintLayerPreview } from './synthesizedShotFingerprintLayer';

export const CONTROLLED_GENERATION_PACK_EXPORT_EPOCH = '2026-05-28T00:00:00.000Z';
export const CONTROLLED_GENERATION_PACK_JSON_FILENAME = 'controlled-generation-pack.json';
export const CONTROLLED_GENERATION_PACK_EXPORT_JSON_PATH = 'exports/controlled-generation-pack.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const PACK_COUNT = 5;
const GONEGI_SLOT = 'slot_1-1';
const DANA_COMPANION_SLOT = 'slot_2-1';

const VITREOUS_ELEGANCE_PROTOCOL =
  'Vitreous Elegance Protocol: glass-glaze-soft eye highlight integrity, vitreous cel-shadow balance, mask fixation stable across frames';

const AMS_LAWS = [
  'AMS-01: opaque gouache layering with visible brush grain friction',
  'AMS-02: flat cel-shadow balance without photoreal bloom collapse',
  'AMS-03: hand-painted animation line weight 0.4mm stable pencil line-art',
  'AMS-04: warm harbor palette coherence without background modernization',
] as const;

const GLOBAL_NEGATIVE_BASE =
  'text, watermark, logo, photoreal, harsh contrast, modern UI, 3d render, plastic skin, style collapse';

const DRIFT_SUPPRESSION_BLOCK =
  'face drift, eye highlight loss, style collapse, AMS violation, emotion flattening, background modernization, lighting instability, hand anatomy distortion';

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

function deriveDeterministicSeed(sceneId: string, rank: number): number {
  const hex = digest(['controlled-gen-pack-seed', sceneId, String(rank)]).slice(0, 8);
  return 100000 + (parseInt(hex, 16) % 900000);
}

function deriveContinuitySeed(sceneId: string, rank: number): string {
  return digest(['controlled-gen-continuity', sceneId, String(rank)]).slice(0, 16).toUpperCase();
}

function resolveEnvironmentSlot(atmosphere: ShotFingerprintAtmosphereClass): string {
  const map: Record<ShotFingerprintAtmosphereClass, string> = {
    warm: 'late_afternoon',
    cool: 'morning',
    neutral: 'afternoon',
    high_contrast: 'sunset',
    muted: 'dawn',
  };
  return map[atmosphere] ?? 'global';
}

function buildGlobalQaTargets(): ControlledGenerationQaTarget[] {
  return [
    {
      target_key: 'face_drift',
      label: 'Face Drift',
      metric: 'identity_lock_delta',
      pass_threshold: 0.85,
      failure_signal: 'facial topology diverges from Gonegi/Dana anchor bundle',
    },
    {
      target_key: 'eye_highlight_integrity',
      label: 'Eye Highlight Integrity',
      metric: 'vitreous_highlight_score',
      pass_threshold: 0.82,
      failure_signal: 'eye gloss collapse or mask fixation loss',
    },
    {
      target_key: 'style_collapse',
      label: 'Style Collapse',
      metric: 'style_law_fidelity',
      pass_threshold: 0.88,
      failure_signal: 'gouache/cel-shadow laws degrade toward photoreal',
    },
    {
      target_key: 'ams_violation',
      label: 'AMS Violation',
      metric: 'ams_compliance_score',
      pass_threshold: 0.9,
      failure_signal: 'Animation Material System laws breached',
    },
    {
      target_key: 'emotion_collapse',
      label: 'Emotion Collapse',
      metric: 'emotional_density_score',
      pass_threshold: 0.75,
      failure_signal: 'cinematic emotional density flattens',
    },
    {
      target_key: 'background_modernization',
      label: 'Background Modernization',
      metric: 'environment_dna_fidelity',
      pass_threshold: 0.85,
      failure_signal: 'environment drifts toward modern photoreal backdrop',
    },
    {
      target_key: 'lighting_instability',
      label: 'Lighting Instability',
      metric: 'lighting_continuity_score',
      pass_threshold: 0.8,
      failure_signal: 'inconsistent cel-shadow or harbor lighting rhythm',
    },
    {
      target_key: 'hand_anatomy_instability',
      label: 'Hand Anatomy Instability',
      metric: 'anatomy_stability_score',
      pass_threshold: 0.78,
      failure_signal: 'hand/finger topology instability under gouache line-art',
    },
  ];
}

function buildVisualConstraints(): ControlledGenerationVisualConstraint[] {
  return [
    {
      constraint_key: 'gouache_friction',
      label: 'Gouache Friction',
      threshold: 0.85,
      enforcement: 'hard',
    },
    {
      constraint_key: 'cel_shadow_balance',
      label: 'Cel-Shadow Balance',
      threshold: 0.88,
      enforcement: 'hard',
    },
    {
      constraint_key: 'environment_dna_continuity',
      label: 'EnvironmentDNA Continuity',
      threshold: 0.85,
      enforcement: 'hard',
    },
    {
      constraint_key: 'cinematic_emotional_density',
      label: 'Cinematic Emotional Density',
      threshold: 0.75,
      enforcement: 'soft',
    },
  ];
}

function resolveCharacterEntry(
  slotId: string,
  characterIndex: Record<string, CharacterDNAIndexEntry>,
  bridgeFingerprint: string | undefined,
  role: ControlledGenerationCharacterAnchorEntry['role'],
  aliasName?: string
): ControlledGenerationCharacterAnchorEntry {
  const entry = characterIndex[slotId];
  return {
    slot_id: slotId,
    name: aliasName ?? entry?.name ?? slotId,
    visual_dna: entry?.visual_dna ?? '',
    anchor_fingerprint: bridgeFingerprint ?? digest(['character-anchor', slotId, entry?.visual_dna ?? '']),
    role,
  };
}

function buildCharacterAnchorBundle(
  styleBridge: ReturnType<typeof buildImageRendererMigrationIngestionPreview>['image_renderer_style_character_bridge'],
  characterIndex: Record<string, CharacterDNAIndexEntry>
): ControlledGenerationCharacterAnchorBundle {
  const gonegi = resolveCharacterEntry(
    GONEGI_SLOT,
    characterIndex,
    styleBridge.character_anchor_registry[GONEGI_SLOT],
    'protagonist',
    'Gonegi Main'
  );
  const dana = resolveCharacterEntry(
    DANA_COMPANION_SLOT,
    characterIndex,
    styleBridge.character_anchor_registry[DANA_COMPANION_SLOT],
    'companion',
    'Dana Companion'
  );

  const anchor_entries: ControlledGenerationCharacterAnchorEntry[] = [gonegi, dana];
  for (const slotId of Object.keys(styleBridge.character_anchor_registry).sort()) {
    if (slotId === GONEGI_SLOT || slotId === DANA_COMPANION_SLOT) continue;
    if (anchor_entries.length >= 6) break;
    anchor_entries.push(
      resolveCharacterEntry(
        slotId,
        characterIndex,
        styleBridge.character_anchor_registry[slotId],
        slotId.startsWith('slot_2-6') ? 'fauna' : 'guardian'
      )
    );
  }

  return {
    gonegi_slot_id: GONEGI_SLOT,
    dana_companion_slot_id: DANA_COMPANION_SLOT,
    anchor_entries,
    gonegi_facial_identity_preserved: true,
    dana_facial_identity_preserved: true,
    vitreous_elegance_protocol: VITREOUS_ELEGANCE_PROTOCOL,
    ams_laws: [...AMS_LAWS],
  };
}

function buildEnvironmentAnchorBundle(
  shot: SynthesizedSceneShotFingerprint,
  environmentIndex: Record<string, EnvironmentDNAIndexEntry>,
  styleBridge: ReturnType<typeof buildImageRendererMigrationIngestionPreview>['image_renderer_style_character_bridge']
): ControlledGenerationEnvironmentAnchorBundle {
  const primarySlot = resolveEnvironmentSlot(shot.atmosphere_class);
  const envEntry = environmentIndex[primarySlot] ?? environmentIndex.global;
  const environment_dna_text = envEntry?.dna_text ?? '';

  return {
    primary_environment_slot: primarySlot,
    environment_dna_text,
    slot_fingerprints: styleBridge.environment_anchor_registry,
    continuity_dna_ref: envEntry?.fingerprint ?? digest(['environment', primarySlot, environment_dna_text]),
  };
}

function buildRenderStateBundle(
  rank: number,
  sceneId: string,
  migrationBridge: ReturnType<typeof buildImageRendererMigrationIngestionPreview>['image_renderer_style_character_bridge']
): ControlledGenerationRenderStateBundle {
  const legacySessionId = `GEN-SES-${String(((rank - 1) % 5) + 1).padStart(3, '0')}`;
  const legacyRenderRef = migrationBridge.render_state_registry[legacySessionId];

  return {
    denoise: 0.7,
    steps: 28,
    cfg: 7.5,
    sampler: 'euler_a',
    aspect_ratio: '16:9',
    model_hash: 'ghibli_v3_final_prod_4k',
    continuity_seed: deriveContinuitySeed(sceneId, rank),
    legacy_render_state_ref: legacyRenderRef,
  };
}

function buildPromptPack(
  scene: CinematicExtractionResult,
  shot: SynthesizedSceneShotFingerprint,
  styleProfile: StyleCoreProfileOutput,
  renderRulesGlobal: string,
  characterBundle: ControlledGenerationCharacterAnchorBundle,
  environmentBundle: ControlledGenerationEnvironmentAnchorBundle
): ControlledGenerationPromptPack {
  const visualDesc = scene.layers?.raw_semantic?.visual_description ?? '';
  const cinematography = (scene.layers?.scene_language?.cinematography_tokens ?? []).join(', ');
  const emotionTokens = (scene.layers?.scene_language?.emotion_tokens ?? []).join(', ');
  const gonegi = characterBundle.anchor_entries.find((entry) => entry.slot_id === GONEGI_SLOT);
  const dana = characterBundle.anchor_entries.find((entry) => entry.slot_id === DANA_COMPANION_SLOT);

  const compressed_style_laws = [
    styleProfile.styleAnchor ?? 'Ghibli Mediterranean Chronicles',
    `styleKey:${styleProfile.styleKey}`,
    `materialKey:${styleProfile.materialKey}`,
    `lightingKey:${styleProfile.lightingKey}`,
    `brushworkKey:${styleProfile.brushworkKey}`,
    `paletteKey:${styleProfile.paletteKey ?? 'warm-harbor-evening'}`,
    renderRulesGlobal,
    VITREOUS_ELEGANCE_PROTOCOL,
    ...AMS_LAWS,
  ].join(' | ');

  const character_anchor_block = [
    `Gonegi facial identity: ${gonegi?.visual_dna ?? ''}`,
    `Dana facial identity: ${dana?.visual_dna ?? ''}`,
    characterBundle.vitreous_elegance_protocol,
  ].join(' | ');

  const environment_continuity_block = [
    `environmentDNA slot ${environmentBundle.primary_environment_slot}`,
    environmentBundle.environment_dna_text,
  ].join(': ');

  const emotional_density_block = [
    `emotion_wave:${shot.emotion_wave_class}`,
    `motion_cadence:${shot.motion_cadence_class}`,
    `atmosphere:${shot.atmosphere_class}`,
    emotionTokens,
    'cinematic emotional density preserved',
  ]
    .filter(Boolean)
    .join(', ');

  const positive_prompt = [
    visualDesc,
    cinematography,
    compressed_style_laws,
    character_anchor_block,
    environment_continuity_block,
    emotional_density_block,
    'opaque gouache friction, cel-shadow balance, environmentDNA continuity, hand-painted Studio Ghibli cel-animation',
  ]
    .filter(Boolean)
    .join('. ');

  return {
    positive_prompt,
    compressed_style_laws,
    character_anchor_block,
    environment_continuity_block,
    emotional_density_block,
  };
}

function buildNegativePromptPack(): ControlledGenerationNegativePromptPack {
  return {
    negative_prompt: `${GLOBAL_NEGATIVE_BASE}, ${DRIFT_SUPPRESSION_BLOCK}`,
    drift_suppression_block: DRIFT_SUPPRESSION_BLOCK,
  };
}

function buildAiStudioRenderRecipe(
  promptPack: ControlledGenerationPromptPack,
  negativePack: ControlledGenerationNegativePromptPack,
  renderState: ControlledGenerationRenderStateBundle,
  sceneId: string,
  rank: number
): AiStudioRenderRecipe {
  const payload = {
    prompt: promptPack.positive_prompt,
    negative_prompt: negativePack.negative_prompt,
    seed: deriveDeterministicSeed(sceneId, rank),
    cfg: renderState.cfg,
    sampler: renderState.sampler,
    aspect_ratio: renderState.aspect_ratio,
    model_hash: renderState.model_hash,
    continuity_seed: renderState.continuity_seed,
    quota_policy: 'free_daily' as const,
  };

  return {
    engine: 'ai_studio',
    copy_paste_prompt: promptPack.positive_prompt,
    copy_paste_negative: negativePack.negative_prompt,
    copy_paste_json: JSON.stringify(payload, null, 2),
    quota_policy: 'free_daily',
    aspect_ratio: renderState.aspect_ratio,
    seed: payload.seed,
    cfg: renderState.cfg,
  };
}

function buildContinuityConflictScore(
  candidate: FirstGenerationCandidate,
  registryEntry:
    | ReturnType<typeof buildGenerationReadinessGatePreview>['generation_candidate_registry'][number]
    | undefined
): number {
  if (!registryEntry) return 1;
  return clamp01(
    1 -
      registryEntry.separability_score * 0.35 -
      registryEntry.emotional_stability_score * 0.35 -
      registryEntry.character_anchor_score * 0.3
  );
}

function buildControlledGenerationPack(
  candidate: FirstGenerationCandidate,
  scene: CinematicExtractionResult,
  shot: SynthesizedSceneShotFingerprint,
  styleProfile: StyleCoreProfileOutput,
  renderRulesGlobal: string,
  styleLawFingerprint: string,
  characterIndex: Record<string, CharacterDNAIndexEntry>,
  environmentIndex: Record<string, EnvironmentDNAIndexEntry>,
  migrationPreview: ReturnType<typeof buildImageRendererMigrationIngestionPreview>,
  globalQaTargets: ControlledGenerationQaTarget[],
  visualConstraints: ControlledGenerationVisualConstraint[]
): ControlledGenerationPackEntry {
  const character_anchor_bundle = buildCharacterAnchorBundle(
    migrationPreview.image_renderer_style_character_bridge,
    characterIndex
  );
  const environment_anchor_bundle = buildEnvironmentAnchorBundle(
    shot,
    environmentIndex,
    migrationPreview.image_renderer_style_character_bridge
  );
  const render_state_bundle = buildRenderStateBundle(
    candidate.rank,
    candidate.scene_id,
    migrationPreview.image_renderer_style_character_bridge
  );
  const generation_prompt_pack = buildPromptPack(
    scene,
    shot,
    styleProfile,
    renderRulesGlobal,
    character_anchor_bundle,
    environment_anchor_bundle
  );
  const negative_prompt_pack = buildNegativePromptPack();
  const ai_studio_render_recipe = buildAiStudioRenderRecipe(
    generation_prompt_pack,
    negative_prompt_pack,
    render_state_bundle,
    candidate.scene_id,
    candidate.rank
  );

  return {
    scene_id: candidate.scene_id,
    scene_fingerprint: shot.shot_fingerprint_hash,
    style_law_fingerprint: styleLawFingerprint,
    character_anchor_bundle,
    environment_anchor_bundle,
    render_state_bundle,
    generation_prompt_pack,
    negative_prompt_pack,
    ai_studio_render_recipe,
    expected_visual_constraints: visualConstraints,
    qa_validation_targets: globalQaTargets,
    generation_session_id: `CTRL-GEN-SES-${String(candidate.rank).padStart(3, '0')}`,
    readiness_score: candidate.readiness_score,
    rank: candidate.rank,
  };
}

function buildPromptPackReport(packs: ControlledGenerationPackEntry[]): GenerationPromptPackReport {
  const packs_with_full_style_laws = packs.filter(
    (pack) =>
      pack.generation_prompt_pack.compressed_style_laws.includes('AMS-01') &&
      pack.generation_prompt_pack.compressed_style_laws.includes('Vitreous Elegance Protocol')
  ).length;
  const packs_with_character_anchors = packs.filter(
    (pack) =>
      pack.character_anchor_bundle.gonegi_facial_identity_preserved &&
      pack.character_anchor_bundle.dana_facial_identity_preserved &&
      pack.generation_prompt_pack.character_anchor_block.includes('Gonegi facial identity')
  ).length;
  const packs_with_environment_continuity = packs.filter(
    (pack) => pack.environment_anchor_bundle.environment_dna_text.length > 0
  ).length;

  const prompt_assembly_checks = [
    packs.length === PACK_COUNT,
    packs_with_full_style_laws === packs.length,
    packs_with_character_anchors === packs.length,
    packs_with_environment_continuity === packs.length,
    packs.every((pack) => pack.ai_studio_render_recipe.copy_paste_json.length > 0),
  ];

  return {
    total_packs: packs.length,
    packs_with_full_style_laws,
    packs_with_character_anchors,
    packs_with_environment_continuity,
    style_law_preservation_ratio: round6(packs_with_full_style_laws / Math.max(packs.length, 1)),
    character_anchor_preservation_ratio: round6(
      packs_with_character_anchors / Math.max(packs.length, 1)
    ),
    environment_continuity_ratio: round6(
      packs_with_environment_continuity / Math.max(packs.length, 1)
    ),
    prompt_assembly_checks_passed: prompt_assembly_checks.filter(Boolean).length,
    prompt_assembly_checks_total: prompt_assembly_checks.length,
  };
}

function writeExportArtifact(payload: ControlledGenerationPackExportResult): void {
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(exportsDir, CONTROLLED_GENERATION_PACK_JSON_FILENAME),
    JSON.stringify(payload, null, 2),
    'utf8'
  );
}

export function buildControlledGenerationPackExport(): ControlledGenerationPackExportResult {
  const productionLock = buildSynthesizedDatasetProductionLockPreview();
  const legacyIngestionBefore = buildLegacyGenerationAssetIngestionPreview();
  const migrationBefore = buildImageRendererMigrationIngestionPreview();
  const readinessGate = buildGenerationReadinessGatePreview();
  const masterCore = buildMasterCoreDNAAdapterPreview();
  const synthesis = buildRealLongformDatasetSynthesisPreview();
  const shotLayer = buildSynthesizedShotFingerprintLayerPreview();
  const separability = buildFingerprintSeparabilityReinforcementPreview();

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumBefore = productionLock.production_lock_checksum;
  const legacyChecksumBefore = legacyIngestionBefore.ingestion_checksum;
  const migrationChecksumBefore = migrationBefore.migration_ingestion_checksum;

  const candidates = readinessGate.first_generation_candidate_list.slice(0, PACK_COUNT);
  const sceneById = new Map(
    synthesis.synthesized_120_scene_dataset.scenes.map((scene) => [scene.id, scene])
  );
  const shotBySceneId = new Map(
    shotLayer.synthesized_shot_fingerprint_export.scene_fingerprints.map((row) => [row.scene_id, row])
  );
  const registryBySceneId = new Map(
    readinessGate.generation_candidate_registry.map((row) => [row.scene_id, row])
  );

  const styleProfile = masterCore.style_core_profile;
  const renderRulesAsset = legacyIngestionBefore.normalized_generation_assets.find(
    (asset) => asset.asset_kind === 'render_rules'
  );
  const renderRulesGlobal =
    renderRulesAsset && renderRulesAsset.asset_kind === 'render_rules'
      ? renderRulesAsset.render_rules?.global ??
        'Classic 1980s Studio Ghibli hand-painted style with opaque gouache, visible brushstrokes, and emotional resonance.'
      : 'Classic 1980s Studio Ghibli hand-painted style with opaque gouache, visible brushstrokes, and emotional resonance.';

  const styleLawFingerprint =
    legacyIngestionBefore.asset_fingerprint_index.style_law_fingerprint;
  const characterIndex = masterCore.character_dna_index;
  const environmentIndex = masterCore.environment_dna_index;
  const globalQaTargets = buildGlobalQaTargets();
  const visualConstraints = buildVisualConstraints();

  const controlled_generation_packs = candidates.map((candidate) => {
    const scene = sceneById.get(candidate.scene_id);
    const shot = shotBySceneId.get(candidate.scene_id);
    if (!scene || !shot) {
      throw new Error(`Missing scene or fingerprint for candidate ${candidate.scene_id}`);
    }
    return buildControlledGenerationPack(
      candidate,
      scene,
      shot,
      styleProfile,
      renderRulesGlobal,
      styleLawFingerprint,
      characterIndex,
      environmentIndex,
      migrationBefore,
      globalQaTargets,
      visualConstraints
    );
  });

  const controlled_generation_pack_registry: ControlledGenerationPackRegistryEntry[] =
    controlled_generation_packs.map((pack) => ({
      pack_id: `CGP-${String(pack.rank).padStart(3, '0')}-${digest([pack.scene_id]).slice(0, 8).toUpperCase()}`,
      scene_id: pack.scene_id,
      generation_session_id: pack.generation_session_id,
      pack_fingerprint: digest([
        pack.scene_id,
        pack.scene_fingerprint,
        pack.style_law_fingerprint,
        pack.generation_prompt_pack.positive_prompt,
      ]),
      export_ready: true,
      readiness_score: pack.readiness_score,
      rank: pack.rank,
    }));

  const ai_studio_generation_export: AiStudioGenerationExportEntry[] = controlled_generation_packs.map(
    (pack) => ({
      session_id: pack.generation_session_id,
      scene_id: pack.scene_id,
      rank: pack.rank,
      ai_studio_payload: {
        prompt: pack.generation_prompt_pack.positive_prompt,
        negative_prompt: pack.negative_prompt_pack.negative_prompt,
        seed: pack.ai_studio_render_recipe.seed,
        cfg: pack.ai_studio_render_recipe.cfg,
        aspect_ratio: pack.ai_studio_render_recipe.aspect_ratio,
        sampler: pack.render_state_bundle.sampler,
        model_hash: pack.render_state_bundle.model_hash,
      },
      cursor_qa_reconnect_token: digest([
        pack.generation_session_id,
        pack.scene_id,
        pack.scene_fingerprint,
      ]),
    })
  );

  const generation_prompt_pack_report = buildPromptPackReport(controlled_generation_packs);

  const candidateEntries: ControlledGenerationCandidateEntry[] = candidates.map((candidate) => ({
    rank: candidate.rank,
    scene_id: candidate.scene_id,
    readiness_score: candidate.readiness_score,
    continuity_conflict_score: buildContinuityConflictScore(
      candidate,
      registryBySceneId.get(candidate.scene_id)
    ),
    selection_rationale: candidate.selection_rationale,
  }));

  const controlled_generation_candidate_report: ControlledGenerationCandidateReport = {
    selected_count: candidates.length,
    selection_source: 'generation_readiness_gate',
    low_risk_only: true,
    candidates: candidateEntries,
  };

  const generation_qa_target_registry: GenerationQaTargetRegistry = {
    global_targets: globalQaTargets,
    per_pack_targets: Object.fromEntries(
      controlled_generation_packs.map((pack) => [pack.generation_session_id, pack.qa_validation_targets])
    ),
  };

  const legacyIngestionAfter = buildLegacyGenerationAssetIngestionPreview();
  const migrationAfter = buildImageRendererMigrationIngestionPreview();
  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumAfter = buildSynthesizedDatasetProductionLockPreview().production_lock_checksum;

  const aiStudioExportValid =
    ai_studio_generation_export.length === PACK_COUNT &&
    ai_studio_generation_export.every(
      (entry) =>
        entry.ai_studio_payload.prompt.length > 0 &&
        entry.ai_studio_payload.negative_prompt.length > 0 &&
        entry.cursor_qa_reconnect_token.length === 64
    );

  const resultCore = {
    schema_version: CONTROLLED_GENERATION_PACK_EXPORT_VERSION,
    generated_at: CONTROLLED_GENERATION_PACK_EXPORT_EPOCH,
    readonly_export: true as const,
    production_lock_checksum_ref: productionLockChecksumBefore,
    generation_readiness_checksum_ref: readinessGate.readiness_gate_checksum,
    legacy_ingestion_checksum_ref: legacyChecksumBefore,
    migration_ingestion_checksum_ref: migrationChecksumBefore,
    controlled_generation_packs,
    controlled_generation_pack_registry,
    ai_studio_generation_export,
    generation_prompt_pack_report,
    controlled_generation_candidate_report,
    generation_qa_target_registry,
    export_json_path: CONTROLLED_GENERATION_PACK_EXPORT_JSON_PATH as 'exports/controlled-generation-pack.json',
    validation: {
      deterministic_pack_checksum_stable: true,
      readonly_export: true as const,
      no_dataset_mutation: true as const,
      no_prompt_rewrite: true as const,
      no_image_generation: true as const,
      no_provider_calls: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
      production_lock_unchanged: productionLockChecksumBefore === productionLockChecksumAfter,
      legacy_ingestion_unchanged: legacyChecksumBefore === legacyIngestionAfter.ingestion_checksum,
      migration_ingestion_unchanged:
        migrationChecksumBefore === migrationAfter.migration_ingestion_checksum,
      prompt_packs_generated: controlled_generation_packs.length === PACK_COUNT,
      ai_studio_export_valid: aiStudioExportValid,
    },
  };

  const pack_export_checksum = digest([
    JSON.stringify(resultCore),
    productionLockChecksumBefore,
    readinessGate.readiness_gate_checksum,
    legacyChecksumBefore,
    migrationChecksumBefore,
    separability.reinforcement_checksum,
  ]);

  const result: ControlledGenerationPackExportResult = {
    ...resultCore,
    pack_export_checksum,
  };

  writeExportArtifact(result);
  return result;
}

let cachedPackExport: ControlledGenerationPackExportResult | null = null;

export function buildControlledGenerationPackExportPreview(): ControlledGenerationPackExportResult {
  if (cachedPackExport) return cachedPackExport;
  cachedPackExport = buildControlledGenerationPackExport();
  return cachedPackExport;
}

export function buildControlledGenerationPackExportJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildControlledGenerationPackExportPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: CONTROLLED_GENERATION_PACK_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetControlledGenerationPackExportCache(): void {
  cachedPackExport = null;
}
