import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { detectNamedCharactersInPrompt } from '../promptBridge';
import type { MasterReferenceOrderEntry } from '../selectMasterAssets';
import { buildAllScenePairQualityRecords } from './buildCueQualityGate';
import {
  ESTIMATED_BRIDGED_PROMPT_BASELINE,
  PROMPT_MODULATION_MAX_CHARS,
  PROMPT_MODULATION_MAX_RATIO,
  type RuntimeCinematicContext,
} from './buildRuntimeCueBridge';
import {
  resolveMusicDramaRuntimeCue,
  type MusicDramaRuntimeBridgeResult,
  type MusicDramaSlotScenario,
} from './musicDramaRuntimeBridge';
import { buildMasterCoreV175Snapshot } from './aiStudioControlledJsonRebuild.fixtures';
import type { CharacterBook } from '../../types';
import { selectMasterAssets } from '../selectMasterAssets';
import {
  detectCharactersInPromptWithAnchorDna,
  validateAnchorDnaForCharacters,
} from '../loadCharacterAnchorDNA';

export const RENDER_SAFETY_GATE_VERSION = 'PHASE-36C-v1' as const;
export const RENDER_SAFETY_GATE_PHASE = 'PHASE-36C' as const;
export const RENDER_SAFETY_REPORT_FILENAME = 'render-safety-report.json';
export const RENDER_SAFETY_REPORT_PATH = 'exports/render-safety-report.json';

export const CONTINUITY_CAMERA_WARNING_MIN = 0.75;
export const CONTINUITY_EMOTION_WARNING_MIN = 0.8;

const GENERIC_DRIFT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bgeneric\s+boy\b/i, label: 'generic boy' },
  { pattern: /\bgeneric\s+girl\b/i, label: 'generic girl' },
  { pattern: /\byoung\s+companion\b/i, label: 'young companion' },
  { pattern: /\banonymous\s+child\b/i, label: 'anonymous child' },
];

export type RenderSafetyStatus = 'READY' | 'NOT_READY';

export interface RenderSafetyGateInput {
  controlledPrompt: string;
  runtimeCue: MusicDramaRuntimeBridgeResult;
  detected_characters: string[];
  injected_elite_image_ids: string[];
  reference_order: MasterReferenceOrderEntry[];
  identity_before_style: boolean;
  anchor_dna_ready: boolean;
  asset_selection_ready: boolean;
}

export interface RenderSafetyGateResult {
  status: RenderSafetyStatus;
  runtime_bridge_ready: boolean;
  identity_ready: boolean;
  reference_order_ready: boolean;
  budget_ready: boolean;
  prompt_integrity_ready: boolean;
  continuity_warning: boolean;
  failed_checks: string[];
  warnings: string[];
  blocked_reason?: string;
  modulation_length: number;
  within_budget: boolean;
  modulation_ratio_estimate: number;
  continuity_scores?: {
    camera_continuity: number | null;
    emotional_continuity: number | null;
  };
}

export interface RenderSafetyPreview {
  phase: typeof RENDER_SAFETY_GATE_PHASE;
  schema_version: typeof RENDER_SAFETY_GATE_VERSION;
  status: RenderSafetyStatus;
  failed_checks: string[];
  warnings: string[];
  modulation_length: number;
  within_budget: boolean;
  gate: RenderSafetyGateResult;
  probe_prompt: string;
  diagnosis_only: true;
  no_auto_fix: true;
  generated_at: string;
}

export interface RenderSafetyReportExport extends RenderSafetyPreview {
  report_checksum: string;
}

function hasRuntimeContext(context: RuntimeCinematicContext | null | undefined): boolean {
  if (!context) return false;
  return Boolean(
    context.camera_momentum &&
      context.emotional_carryover &&
      context.montage_rhythm &&
      context.spatial_continuity &&
      context.scene_energy_waveform &&
      context.motion_bridge
  );
}

function detectGenericDrift(prompt: string): string[] {
  const hits: string[] = [];
  for (const { pattern, label } of GENERIC_DRIFT_PATTERNS) {
    if (pattern.test(prompt)) hits.push(label);
  }
  return hits;
}

function resolveIncomingContinuityScores(sceneId: string): {
  camera_continuity: number | null;
  emotional_continuity: number | null;
} {
  const pairs = buildAllScenePairQualityRecords();
  const incoming = pairs.find((pair) => pair.to_scene_id === sceneId);
  if (!incoming) {
    return { camera_continuity: null, emotional_continuity: null };
  }
  return {
    camera_continuity: incoming.camera_continuity,
    emotional_continuity: incoming.emotional_continuity,
  };
}

export function evaluateRenderSafetyGate(input: RenderSafetyGateInput): RenderSafetyGateResult {
  const failed_checks: string[] = [];
  const warnings: string[] = [];

  const runtime_bridge_ready =
    input.runtimeCue.debug.runtime_bridge_used && hasRuntimeContext(input.runtimeCue.runtime_context);
  if (!runtime_bridge_ready) {
    failed_checks.push('runtime cue missing');
  }

  const namedInPrompt = detectNamedCharactersInPrompt(input.controlledPrompt);
  const requiresIdentity = namedInPrompt.length > 0;

  const identity_ready =
    !requiresIdentity ||
    (input.detected_characters.length > 0 &&
      input.anchor_dna_ready &&
      input.injected_elite_image_ids.length >= namedInPrompt.length &&
      input.asset_selection_ready);
  if (!identity_ready) {
    failed_checks.push('identity assets missing');
  }

  const reference_order_ready = input.identity_before_style;
  if (!reference_order_ready) {
    failed_checks.push('reference priority broken');
  }

  const budget_ready =
    input.runtimeCue.bridge.modulation_length <= PROMPT_MODULATION_MAX_CHARS &&
    input.runtimeCue.bridge.within_budget &&
    input.runtimeCue.bridge.modulation_ratio_estimate <= PROMPT_MODULATION_MAX_RATIO;
  if (!budget_ready) {
    failed_checks.push('modulation overflow');
  }

  const driftHits = detectGenericDrift(input.controlledPrompt);
  const prompt_integrity_ready = driftHits.length === 0;
  if (!prompt_integrity_ready) {
    failed_checks.push('generic drift detected');
  }

  const continuity_scores = resolveIncomingContinuityScores(input.runtimeCue.debug.scene_id);
  let continuity_warning = false;
  if (
    continuity_scores.camera_continuity != null &&
    continuity_scores.camera_continuity < CONTINUITY_CAMERA_WARNING_MIN
  ) {
    continuity_warning = true;
    warnings.push(
      `camera_continuity ${continuity_scores.camera_continuity} below ${CONTINUITY_CAMERA_WARNING_MIN}`
    );
  }
  if (
    continuity_scores.emotional_continuity != null &&
    continuity_scores.emotional_continuity < CONTINUITY_EMOTION_WARNING_MIN
  ) {
    continuity_warning = true;
    warnings.push(
      `emotional_continuity ${continuity_scores.emotional_continuity} below ${CONTINUITY_EMOTION_WARNING_MIN}`
    );
  }

  const status: RenderSafetyStatus = failed_checks.length === 0 ? 'READY' : 'NOT_READY';
  const blocked_reason =
    status === 'NOT_READY' ? `PHASE-36C render safety NOT_READY: ${failed_checks[0]}` : undefined;

  return {
    status,
    runtime_bridge_ready,
    identity_ready,
    reference_order_ready,
    budget_ready,
    prompt_integrity_ready,
    continuity_warning,
    failed_checks,
    warnings,
    blocked_reason,
    modulation_length: input.runtimeCue.bridge.modulation_length,
    within_budget: input.runtimeCue.bridge.within_budget,
    modulation_ratio_estimate: input.runtimeCue.bridge.modulation_ratio_estimate,
    continuity_scores,
  };
}

function buildProbeGateInput(
  characterBook: CharacterBook,
  controlledPrompt: string,
  slot: MusicDramaSlotScenario
): RenderSafetyGateInput {
  const anchorDetected = detectCharactersInPromptWithAnchorDna(controlledPrompt);
  const dnaGate = validateAnchorDnaForCharacters(
    anchorDetected.map((record) => ({ name: record.name, slot_id: record.slot_id }))
  );
  const runtimeCue = resolveMusicDramaRuntimeCue(slot, {
    baselinePromptLength: ESTIMATED_BRIDGED_PROMPT_BASELINE,
  });
  const assetSelection = selectMasterAssets({
    controlledPrompt,
    characterBook,
  });

  const styleIndex = assetSelection.reference_order.findIndex((e) => e.kind === 'style');
  const identityIndex = assetSelection.reference_order.findIndex((e) => e.kind === 'identity');
  const identity_before_style =
    identityIndex >= 0 && (styleIndex < 0 || identityIndex < styleIndex);

  return {
    controlledPrompt,
    runtimeCue,
    detected_characters: assetSelection.detected_characters,
    injected_elite_image_ids: assetSelection.injected_elite_image_ids,
    reference_order: assetSelection.reference_order,
    identity_before_style,
    anchor_dna_ready: dnaGate.ready,
    asset_selection_ready: assetSelection.readiness === 'READY',
  };
}

const CANONICAL_PROBE_PROMPT =
  'Gonegi and Dana walk along the harbor terrace at golden hour, hopeful forward motion.';

let cachedPreview: RenderSafetyPreview | null = null;
let cachedReport: RenderSafetyReportExport | null = null;

export function buildRenderSafetyPreview(): RenderSafetyPreview {
  if (cachedPreview) return cachedPreview;

  const snapshot = buildMasterCoreV175Snapshot();
  const slot: MusicDramaSlotScenario = {
    slot_id: 'render-safety-probe',
    scenario: CANONICAL_PROBE_PROMPT,
  };
  const gateInput = buildProbeGateInput(snapshot.characterBook as CharacterBook, CANONICAL_PROBE_PROMPT, slot);
  const gate = evaluateRenderSafetyGate(gateInput);

  cachedPreview = {
    phase: RENDER_SAFETY_GATE_PHASE,
    schema_version: RENDER_SAFETY_GATE_VERSION,
    status: gate.status,
    failed_checks: gate.failed_checks,
    warnings: gate.warnings,
    modulation_length: gate.modulation_length,
    within_budget: gate.within_budget,
    gate,
    probe_prompt: CANONICAL_PROBE_PROMPT,
    diagnosis_only: true,
    no_auto_fix: true,
    generated_at: new Date().toISOString(),
  };

  return cachedPreview;
}

export function buildRenderSafetyReportExport(): RenderSafetyReportExport {
  if (cachedReport) return cachedReport;

  const preview = buildRenderSafetyPreview();
  cachedReport = {
    ...preview,
    report_checksum: crypto.createHash('sha256').update(JSON.stringify(preview)).digest('hex'),
  };

  return cachedReport;
}

export function buildRenderSafetyReportDownload(rootDir = process.cwd()): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const report = buildRenderSafetyReportExport();
  const body = JSON.stringify(report, null, 2);

  const exportsDir = path.join(rootDir, 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(exportsDir, RENDER_SAFETY_REPORT_FILENAME), body, 'utf8');

  return {
    filename: RENDER_SAFETY_REPORT_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetRenderSafetyGateCache(): void {
  cachedPreview = null;
  cachedReport = null;
}
