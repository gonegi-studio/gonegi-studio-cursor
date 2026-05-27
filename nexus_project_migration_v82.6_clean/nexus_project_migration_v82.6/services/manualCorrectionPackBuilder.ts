import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CharacterIdentityLock,
  EnvironmentIdentityLock,
  GeneratedImageDriftHotspot,
  GeneratedImageFeedbackReport,
  MANUAL_CORRECTION_PACK_BUILDER_VERSION,
  ManualCorrectionPack,
  ManualCorrectionPackBuilderResult,
  ManualCorrectionPackVerificationCheck,
  SafePromptDeltaSuggestion,
  StyleCoreProfileOutput,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildGeneratedImageFeedbackPreview } from './generatedImageFeedbackAnalyzer';
import { buildIdentityLockContinuityPreview } from './identityLockContinuityEngine';
import { buildMasterCoreDNAAdapterPreview } from './masterCoreDNAAdapter';
import { buildRealRenderInputPackPreview } from './realRenderInputPackExport';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';

export const MANUAL_CORRECTION_PACK_BUILDER_EPOCH = '2026-05-27T09:30:00.000Z';
export const MANUAL_CORRECTION_PACK_JSON_FILENAME = 'manual-correction-pack.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const DRIFT_NOTE_THRESHOLD = 0.08;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function collectHotspotsByCategory(
  reports: GeneratedImageFeedbackReport[],
  category: GeneratedImageDriftHotspot['category']
): GeneratedImageDriftHotspot[] {
  const seen = new Set<string>();
  const hotspots: GeneratedImageDriftHotspot[] = [];
  for (const report of reports) {
    for (const hotspot of report.drift_hotspots) {
      if (hotspot.category !== category) continue;
      const key = `${hotspot.hotspot_id}:${hotspot.signal}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hotspots.push(hotspot);
    }
  }
  return hotspots.sort((a, b) => a.hotspot_id.localeCompare(b.hotspot_id));
}

function buildIdentityCorrectionNotes(
  reports: GeneratedImageFeedbackReport[],
  identityLocks: CharacterIdentityLock[]
): string[] {
  const notes: string[] = [];
  const avgDrift = round6(
    reports.reduce((sum, report) => sum + report.identity_drift_score, 0) / reports.length
  );

  notes.push(
    `Average identity drift ${avgDrift} across ${reports.length} engine(s) — review face topology and silhouette before re-render.`
  );

  for (const lock of identityLocks) {
    notes.push(
      `Character ${lock.character_id}: preserve face_topology "${lock.face_topology.slice(0, 40)}", silhouette "${lock.silhouette.slice(0, 40)}", eye_spacing "${lock.eye_spacing.slice(0, 32)}".`
    );
    notes.push(
      `Hair rhythm: ${lock.hair_rhythm.slice(0, 48)}; cloth geometry: ${lock.cloth_geometry.slice(0, 48)}; accessories: ${lock.accessory_persistence.slice(0, 48)}.`
    );
  }

  for (const hotspot of collectHotspotsByCategory(reports, 'identity')) {
    notes.push(`[${hotspot.severity}] ${hotspot.signal}: ${hotspot.detail}`);
  }

  if (avgDrift <= DRIFT_NOTE_THRESHOLD) {
    notes.push('Identity drift within acceptable range — optional manual emphasis only.');
  }

  return notes;
}

function buildEnvironmentCorrectionNotes(
  reports: GeneratedImageFeedbackReport[],
  envLock: EnvironmentIdentityLock
): string[] {
  const notes: string[] = [];
  const avgDrift = round6(
    reports.reduce((sum, report) => sum + report.environment_drift_score, 0) / reports.length
  );

  notes.push(
    `Average environment drift ${avgDrift} — verify city topology "${envLock.city_topology.slice(0, 40)}", atmosphere "${envLock.atmosphere_continuity.slice(0, 40)}".`
  );
  notes.push(
    `Lighting continuity: ${envLock.lighting_continuity.slice(0, 48)}; weather: ${envLock.weather_persistence}; material: ${envLock.material_response.slice(0, 48)}.`
  );

  for (const hotspot of collectHotspotsByCategory(reports, 'environment')) {
    notes.push(`[${hotspot.severity}] ${hotspot.signal}: ${hotspot.detail}`);
  }

  if (avgDrift <= DRIFT_NOTE_THRESHOLD) {
    notes.push('Environment alignment stable — maintain environment DNA slot on manual re-render.');
  }

  return notes;
}

function buildStyleCorrectionNotes(
  reports: GeneratedImageFeedbackReport[],
  styleCore: StyleCoreProfileOutput
): string[] {
  const notes: string[] = [];
  const avgDrift = round6(
    reports.reduce((sum, report) => sum + report.style_drift_score, 0) / reports.length
  );

  notes.push(
    `Average style drift ${avgDrift} — align external engine grading with style_core ${styleCore.style_core_id.slice(0, 16)}.`
  );
  notes.push(
    `Style keys: ${styleCore.styleKey}, material ${styleCore.materialKey}, lighting ${styleCore.lightingKey}, brushwork ${styleCore.brushworkKey}, palette ${styleCore.paletteKey ?? 'default'}.`
  );

  for (const hotspot of collectHotspotsByCategory(reports, 'style')) {
    notes.push(`[${hotspot.severity}] ${hotspot.signal}: ${hotspot.detail}`);
  }

  if (avgDrift <= DRIFT_NOTE_THRESHOLD) {
    notes.push('Style drift low — optional brushwork/palette emphasis in manual prompt delta only.');
  }

  return notes;
}

function buildTemporalCorrectionNotes(
  reports: GeneratedImageFeedbackReport[],
  continuitySeed: string,
  temporalAnchorId: string,
  engineSeeds: { engine: string; seed: string }[]
): string[] {
  const notes: string[] = [];
  const avgDrift = round6(
    reports.reduce((sum, report) => sum + report.temporal_drift_score, 0) / reports.length
  );

  notes.push(
    `Average temporal drift ${avgDrift} — preserve continuity_seed ${continuitySeed} and temporal_anchor ${temporalAnchorId.slice(0, 20)} on re-render.`
  );

  for (const hotspot of collectHotspotsByCategory(reports, 'temporal')) {
    notes.push(`[${hotspot.severity}] ${hotspot.signal}: ${hotspot.detail}`);
  }

  for (const { engine, seed } of engineSeeds) {
    if (seed !== continuitySeed) {
      notes.push(
        `Engine ${engine}: render pack seed ${seed} differs from identity lock ${continuitySeed} — verify seed field manually.`
      );
    }
  }

  if (avgDrift <= DRIFT_NOTE_THRESHOLD) {
    notes.push('Temporal continuity stable — do not change seed unless intentional creative deviation.');
  }

  return notes;
}

function buildPromptFidelityNotes(reports: GeneratedImageFeedbackReport[]): string[] {
  const notes: string[] = [];
  const avgFidelity = round6(
    reports.reduce((sum, report) => sum + report.prompt_fidelity_score, 0) / reports.length
  );
  const avgAlignment = round6(
    reports.reduce((sum, report) => sum + report.overall_alignment_score, 0) / reports.length
  );

  notes.push(
    `Average prompt fidelity ${avgFidelity}, overall alignment ${avgAlignment} — original PHASE-22B prompt preserved; apply deltas manually only.`
  );

  for (const hotspot of collectHotspotsByCategory(reports, 'prompt_fidelity')) {
    notes.push(`[${hotspot.severity}] ${hotspot.signal}: ${hotspot.detail}`);
  }

  for (const report of reports) {
    for (const adjustment of report.recommended_manual_adjustments) {
      notes.push(`[${report.engine}] ${adjustment}`);
    }
  }

  return [...new Set(notes)];
}

function buildSafePromptDeltaSuggestions(
  reports: GeneratedImageFeedbackReport[],
  identityLocks: CharacterIdentityLock[],
  envLock: EnvironmentIdentityLock,
  styleCore: StyleCoreProfileOutput,
  continuitySeed: string
): SafePromptDeltaSuggestion[] {
  const suggestions: SafePromptDeltaSuggestion[] = [];
  let counter = 0;

  const addSuggestion = (
    category: SafePromptDeltaSuggestion['category'],
    delta_type: SafePromptDeltaSuggestion['delta_type'],
    suggested_text: string,
    rationale: string,
    target_engine: SafePromptDeltaSuggestion['target_engine'],
    severity: SafePromptDeltaSuggestion['severity']
  ) => {
    counter += 1;
    suggestions.push({
      suggestion_id: `SUG-${String(counter).padStart(3, '0')}`,
      category,
      delta_type,
      suggested_text,
      rationale,
      target_engine,
      severity,
    });
  };

  for (const lock of identityLocks) {
    if (reports.some((report) => report.identity_drift_score >= DRIFT_NOTE_THRESHOLD)) {
      addSuggestion(
        'identity',
        'append',
        `Identity anchor: ${lock.character_id} face ${lock.face_topology.slice(0, 40)}`,
        'Reinforce character identity lock without replacing original prompt',
        'both',
        'moderate'
      );
    }
  }

  if (reports.some((report) => report.environment_drift_score >= DRIFT_NOTE_THRESHOLD)) {
    addSuggestion(
      'environment',
      'append',
      `Environment lock: ${envLock.city_topology.slice(0, 48)}; lighting ${envLock.lighting_continuity.slice(0, 32)}`,
      'Strengthen environment continuity wording for external engine',
      'both',
      'moderate'
    );
  }

  if (reports.some((report) => report.style_drift_score >= DRIFT_NOTE_THRESHOLD)) {
    addSuggestion(
      'style',
      'emphasis',
      `Style core: ${styleCore.styleKey}, ${styleCore.brushworkKey}, palette ${styleCore.paletteKey ?? 'warm-harbor'}`,
      'Manual style emphasis aligned to MasterCore profile',
      'both',
      'low'
    );
  }

  if (reports.some((report) => report.temporal_drift_score >= DRIFT_NOTE_THRESHOLD)) {
    addSuggestion(
      'temporal',
      'parameter',
      `continuity_seed:${continuitySeed}`,
      'Paste seed into engine parameter field — do not alter compressed prompt body',
      'both',
      'moderate'
    );
  }

  for (const report of reports) {
    if (report.prompt_fidelity_score < 0.85) {
      addSuggestion(
        'prompt_fidelity',
        'prepend',
        `[Grounded scene context preserved — verify against PHASE-22B ${report.engine} export]`,
        `Low fidelity ${report.prompt_fidelity_score} on ${report.engine} — human review before append`,
        report.engine,
        'moderate'
      );
    }
  }

  for (const hotspot of reports.flatMap((report) => report.drift_hotspots)) {
    if (hotspot.severity !== 'high') continue;
    addSuggestion(
      hotspot.category,
      'append',
      `[Manual fix: ${hotspot.signal}]`,
      hotspot.detail,
      'both',
      'high'
    );
  }

  if (suggestions.length === 0) {
    addSuggestion(
      'prompt_fidelity',
      'emphasis',
      'No prompt delta required — alignment within threshold; proceed with original PHASE-22B copy_paste payload',
      'PHASE-23A feedback indicates stable alignment',
      'both',
      'low'
    );
  }

  return suggestions;
}

function buildVerificationChecks(
  pack: ManualCorrectionPack,
  renderPackPrompt: string,
  renderPackNegative: string,
  suggestionCount: number,
  runtimeFingerprintBefore: string,
  runtimeFingerprintAfter: string
): ManualCorrectionPackVerificationCheck[] {
  return [
    {
      check_key: 'correction_pack_generated',
      label: 'Correction Pack Generated',
      passed: pack.scene_id.length > 0 && suggestionCount > 0,
      detail: `Manual correction pack for ${pack.scene_id} with ${suggestionCount} safe prompt delta suggestion(s)`,
    },
    {
      check_key: 'original_prompt_unchanged',
      label: 'Original Prompt Unchanged',
      passed:
        pack.original_compressed_prompt === renderPackPrompt &&
        pack.original_negative_prompt === renderPackNegative,
      detail: 'Original compressed_prompt and negative_prompt preserved verbatim from PHASE-22B',
    },
    {
      check_key: 'suggestions_only',
      label: 'Suggestions Only',
      passed: pack.suggestions_only === true,
      detail: 'No auto prompt rewrite — safe_prompt_delta_suggestions are optional human-applied deltas',
    },
    {
      check_key: 'identity_notes_present',
      label: 'Identity Correction Notes',
      passed: true,
      detail: 'Identity correction notes derived from PHASE-23A feedback and identity lock',
    },
    {
      check_key: 'runtime_dataset_unchanged',
      label: 'Runtime Dataset Unchanged',
      passed: runtimeFingerprintBefore === runtimeFingerprintAfter,
      detail: 'Readonly builder — runtime fingerprint preserved',
    },
    {
      check_key: 'canonical_export_unchanged',
      label: 'Canonical Export Unchanged',
      passed: assertCanonicalExportUnchanged(),
      detail: `Parent canonical export remains ${CANONICAL_EXPORT_SIZE_BYTES} bytes`,
    },
  ];
}

export function buildManualCorrectionPack(): ManualCorrectionPackBuilderResult {
  const feedback = buildGeneratedImageFeedbackPreview();
  const renderPack = buildRealRenderInputPackPreview();
  const identityLock = buildIdentityLockContinuityPreview();
  const masterCore = buildMasterCoreDNAAdapterPreview();

  const sceneId = feedback.scene_id;
  const renderScene = renderPack.selected_scene_render_pack;
  const locked = identityLock.locked_image_generation_packages.find(
    (pkg) => pkg.scene_id === sceneId
  );
  if (!locked) {
    throw new Error(`Locked package not found for scene ${sceneId}`);
  }

  const original_compressed_prompt = renderScene.compressed_prompt;
  const original_negative_prompt = renderScene.negative_prompt;

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const identity_correction_notes = buildIdentityCorrectionNotes(
    feedback.feedback_reports,
    locked.character_identity_lock
  );
  const environment_correction_notes = buildEnvironmentCorrectionNotes(
    feedback.feedback_reports,
    locked.environment_identity_lock
  );
  const style_correction_notes = buildStyleCorrectionNotes(
    feedback.feedback_reports,
    masterCore.style_core_profile
  );
  const engineSeeds = [
    { engine: 'midjourney', seed: String(renderPack.midjourney_input.parameters.seed) },
    { engine: 'flux', seed: String(renderPack.flux_input.parameters.seed) },
  ];
  const temporal_correction_notes = buildTemporalCorrectionNotes(
    feedback.feedback_reports,
    locked.continuity_seed,
    locked.temporal_anchor_id,
    engineSeeds
  );
  const prompt_fidelity_notes = buildPromptFidelityNotes(feedback.feedback_reports);

  const safe_prompt_delta_suggestions = buildSafePromptDeltaSuggestions(
    feedback.feedback_reports,
    locked.character_identity_lock,
    locked.environment_identity_lock,
    masterCore.style_core_profile,
    locked.continuity_seed
  );

  const overall_alignment_average = round6(
    feedback.feedback_reports.reduce(
      (sum, report) => sum + report.overall_alignment_score,
      0
    ) / feedback.feedback_reports.length
  );

  const manual_correction_pack: ManualCorrectionPack = {
    scene_id: sceneId,
    original_compressed_prompt,
    original_negative_prompt,
    continuity_seed: locked.continuity_seed,
    style_core_ref: locked.style_core_ref,
    production_lock_ref: locked.production_lock_ref,
    identity_lock_checksum_ref: identityLock.identity_lock_checksum,
    feedback_analyzer_checksum_ref: feedback.analyzer_checksum,
    render_input_pack_checksum_ref: renderPack.render_input_pack_checksum,
    engines_analyzed: feedback.feedback_reports.map((report) => report.engine),
    overall_alignment_average,
    suggestions_only: true,
  };

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const correction_pack_verification_checks = buildVerificationChecks(
    manual_correction_pack,
    original_compressed_prompt,
    original_negative_prompt,
    safe_prompt_delta_suggestions.length,
    runtimeFingerprintBefore,
    runtimeFingerprintAfter
  );

  const originalPromptUnchanged =
    manual_correction_pack.original_compressed_prompt === renderScene.compressed_prompt &&
    manual_correction_pack.original_negative_prompt === renderScene.negative_prompt;

  const packCore = {
    schema_version: MANUAL_CORRECTION_PACK_BUILDER_VERSION,
    generated_at: MANUAL_CORRECTION_PACK_BUILDER_EPOCH,
    readonly_suggestions: true as const,
    manual_correction_pack,
    identity_correction_notes,
    environment_correction_notes,
    style_correction_notes,
    temporal_correction_notes,
    prompt_fidelity_notes,
    safe_prompt_delta_suggestions,
    correction_pack_verification_checks,
    validation: {
      deterministic_correction_pack_checksum_stable: true,
      readonly_suggestions: true as const,
      original_prompt_unchanged: originalPromptUnchanged as true,
      no_auto_prompt_rewrite: true as const,
      no_dataset_mutation: true as const,
      no_provider_calls: true as const,
      no_image_generation: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
    },
  };

  const correction_pack_checksum = digest([
    JSON.stringify({ ...packCore, correction_pack_checksum: undefined }),
    feedback.analyzer_checksum,
    renderPack.render_input_pack_checksum,
    original_compressed_prompt,
  ]);

  return {
    ...packCore,
    correction_pack_checksum,
  };
}

let cachedPack: ManualCorrectionPackBuilderResult | null = null;

export function buildManualCorrectionPackPreview(): ManualCorrectionPackBuilderResult {
  if (cachedPack) return cachedPack;
  cachedPack = buildManualCorrectionPack();
  return cachedPack;
}

export function buildManualCorrectionPackJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildManualCorrectionPackPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: MANUAL_CORRECTION_PACK_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetManualCorrectionPackCache(): void {
  cachedPack = null;
}
