/**
 * [Scene Truth Production Contract Materialization V1]
 *
 * Attempts to materialize a REAL 8-channel DSC conditioning packet (the
 * original six + Lighting/Environment from DSC Scene Truth Compatibility V1)
 * directly from a real, already-built Canonical Scene Truth. Every value
 * placed in a channel is read straight out of an already-computed Scene
 * Truth field -- this file computes nothing new, infers nothing new, and
 * never invents a default when a real source does not exist.
 *
 * ---------------------------------------------------------------------
 * The real finding this file is built around: 4 of the original 6 channels
 * have NO genuine source in Scene Truth at all
 * ---------------------------------------------------------------------
 * Read directly before writing this file (not assumed):
 *   - camera_pose_field needs translation_u/translation_v/rotation_rad/
 *     zoom_scale (3D camera extrinsics). sceneMeasurementCameraAnalyzer.ts's
 *     CameraFramingMeasurement has frameAspectRatio, subjectFrameRelativeScale,
 *     subjectScreenPosition, headroomRatio, ruleOfThirdsDistance -- 2D
 *     screen-space framing evidence, never a camera pose. No camera-pose-
 *     estimation module exists anywhere across sceneMeasurement*.ts.
 *   - camera_temporal_track needs motion across ADJACENT FRAME PAIRS. Scene
 *     Truth is built per single frame (buildSceneTruth() takes one
 *     ExtractedFrameEvidence); no temporal/camera-motion module exists.
 *   - edit_rhythm_boundaries needs cut_timestamp_ms/shot_duration_ms across
 *     a whole timeline -- shot/cut-boundary detection was never built here
 *     when this file was first written. Edit Boundary Measurement V1 later
 *     closed this gap too (see sceneMeasurementEditBoundaryAnalyzer.ts --
 *     reuses already-measured MAD + a new color-mean-shift distance, no new
 *     detector/dependency), but only via an explicit, opt-in
 *     editBoundarySequence parameter -- omitting it still yields the same
 *     honest 'no_real_source' as before (see materializeEditRhythmBoundaries()).
 *   - scene_energy_field needs motion_magnitude/relative_velocity -- also
 *     temporal, also never built.
 *   - subject_position_field's center_u/center_v ARE genuinely available
 *     (camera.measured.value.subjectScreenPosition, already normalized to
 *     [0,1]) but displacement_u/displacement_v are temporal -- not available.
 *   - framing_composition_map's shot_scale IS genuinely available
 *     (camera.interpreted.framingType.value.guess); composition_region was
 *     also unavailable when this file was first written, but Composition
 *     Region Measurement V1 closed that gap (see
 *     sceneMeasurementCameraAnalyzer.ts's compositionRegion -- a nine-region
 *     grid bucket over the SAME already-measured subjectScreenPosition,
 *     never a new detector), so framing_composition_map is now fully
 *     materializable, not merely partial.
 *
 * This file does NOT invent 0.0 translations, a fabricated "static" motion
 * type, an empty cut-boundary array, or a guessed composition_region to
 * force these channels to look complete -- that is exactly the synthetic/
 * default/fallback behavior this phase forbids. Instead, every field this
 * file cannot genuinely source is reported as 'no_real_source' with the
 * specific reason, and the channel's own status is 'partial' or
 * 'no_real_source' accordingly. Lighting, Environment (DSC Scene Truth
 * Compatibility V1), and now framing_composition_map (Composition Region
 * Measurement V1) are fully, genuinely materializable today.
 *
 * ---------------------------------------------------------------------
 * Materialized-null vs. no_real_source -- a real, structural distinction
 * ---------------------------------------------------------------------
 * A field can be 'materialized' with a null VALUE (e.g. weather_guess is
 * unconditionally null -- Scene Truth genuinely tried and honestly reports
 * "unknown", carrying real INFERRED provenance) -- this is not the same as
 * 'no_real_source' (Scene Truth has no code path that ever attempts to
 * answer this question at all, e.g. camera translation). Collapsing these
 * two into one "missing" bucket would hide the difference between "honestly
 * unknown" and "never measured" -- this file keeps them distinct throughout.
 *
 * ---------------------------------------------------------------------
 * Real Occlusion evidence: kept separate, connected via the same binding
 * ---------------------------------------------------------------------
 * The materialized contract's real_occlusion field is exactly
 * bindRealOcclusionToSceneTruth()'s own result (Canonical Frame Identity V1
 * / Scene Truth Final Integration V2) -- reused, not recomputed, and never
 * folded into any channel's components. A consumer reading channels[] never
 * sees occlusion data; a consumer reading real_occlusion never sees it
 * merged with the bbox-overlap proxy either (that stays inside
 * sceneTruth.occlusion, untouched, and is not surfaced in this contract at
 * all -- only the real, mask-evidence-backed occlusion is).
 *
 * ---------------------------------------------------------------------
 * Verdict: PRODUCTION_CONTRACT_MATERIALIZED / REAL_GAP
 * ---------------------------------------------------------------------
 * PRODUCTION_CONTRACT_MATERIALIZED requires ALL 8 channels fully
 * materialized (every declared field has a real source), real_occlusion
 * genuinely 'integrated', and the Character/Style swap boundary exclusive.
 * Given the finding above, this will not hold for today's Scene Truth
 * pipeline -- this file reports REAL_GAP with the exact channel/field list,
 * rather than silently downgrading the requirement to make the packet look
 * complete.
 */

import type { SceneTruth } from './sceneMeasurementSceneTruthIntegrator.js';
import type { ExtractedFrameEvidence } from './sceneMeasurementEvidenceCore.js';
import {
  bindRealOcclusionToSceneTruth,
  type RealOcclusionSceneBinding,
} from './sceneMeasurementSceneTruthV2Integrator.js';
import {
  measureFramePairMotion,
  interpretFramePairMotion,
  measureSubjectDisplacement,
  interpretCameraSubjectRelationship,
  computeSubjectRelativeVelocity,
  type FramePairMotionMeasurement,
  type SubjectDisplacementMeasurement,
} from './sceneMeasurementTemporalMotionAnalyzer.js';
import type { CameraMotionVectorPair } from './cameraMotionVectorIntegration.js';
import type { EditBoundarySequenceResult } from './sceneMeasurementEditBoundaryAnalyzer.js';
import {
  LIGHTING_CONDITION_FIELD_SCHEMA,
  ENVIRONMENT_CONDITION_FIELD_SCHEMA,
  buildLightingConditionComponentsFromSceneTruth,
  buildEnvironmentConditionComponentsFromSceneTruth,
  CONDITIONING_SWAP_BOUNDARY,
  assertOnlyCharacterAndStyleSwappable,
  type SceneTruthChannelId,
} from './directSpatialConditioningSceneTruthCompatibility.js';
import type { ConditioningChannelId } from './directSpatialConditioningFoundationBuilder.js';

export const PRODUCTION_CONTRACT_MATERIALIZATION_PHASE = 'PHASE-DSC-SCENE-TRUTH-MATERIALIZATION-001' as const;

export type MaterializedChannelId = ConditioningChannelId | SceneTruthChannelId;

// ============================================================
// Field / channel materialization result shapes
// ============================================================

export interface FieldMaterializationResult {
  name: string;
  status: 'materialized' | 'no_real_source';
  value?: unknown;
  provenance: 'measured' | 'inferred' | null;
  reason?: string;
}

export type ChannelMaterializationStatus = 'materialized' | 'partial' | 'no_real_source';

export interface ChannelMaterializationResult {
  channel_id: MaterializedChannelId;
  status: ChannelMaterializationStatus;
  fields: readonly FieldMaterializationResult[];
}

function summarizeChannelStatus(fields: readonly FieldMaterializationResult[]): ChannelMaterializationStatus {
  const materializedCount = fields.filter((f) => f.status === 'materialized').length;
  if (materializedCount === fields.length) return 'materialized';
  if (materializedCount === 0) return 'no_real_source';
  return 'partial';
}

// ============================================================
// camera_pose_field: unconditionally no source (3D camera pose estimation
// is a categorically different capability from anything measured here --
// see this file's own header). edit_rhythm_boundaries now has a real
// source too (Edit Boundary Measurement V1) when a sequence is supplied --
// see materializeEditRhythmBoundaries() below.
// ============================================================

const NO_CAMERA_POSE_REASON =
  'No camera-pose-estimation module exists anywhere in this pipeline -- CameraFramingMeasurement measures 2D subject framing only (frameAspectRatio, subjectScreenPosition, headroomRatio, ruleOfThirdsDistance), never 3D camera extrinsics.';
const NO_EDIT_BOUNDARY_SEQUENCE_REASON =
  'No editBoundarySequence was provided to materializeProductionContract() for this call -- edit-rhythm fields require a real, already-computed sequence of consecutive frame-pair cut evidence (see sceneMeasurementEditBoundaryAnalyzer.ts).';

function unmaterializedField(name: string, reason: string): FieldMaterializationResult {
  return { name, status: 'no_real_source', provenance: null, reason };
}

function materializeCameraPoseField(): ChannelMaterializationResult {
  const fields = ['translation_u', 'translation_v', 'rotation_rad', 'zoom_scale'].map((name) =>
    unmaterializedField(name, NO_CAMERA_POSE_REASON)
  );
  return { channel_id: 'camera_pose_field', status: summarizeChannelStatus(fields), fields };
}

/**
 * Real frame-pair evidence -- MAD-based motion + matched-subject
 * displacement -- computed once by materializeProductionContract() and
 * threaded into the three channels below. See
 * sceneMeasurementTemporalMotionAnalyzer.ts's own header for exactly what
 * each field can and cannot honestly claim (no direction, no camera/subject
 * disambiguation).
 */
export interface TemporalMotionEvidence {
  pairMotion: FramePairMotionMeasurement;
  pairMotionProvenance: 'measured' | 'inferred';
  motionType: { guess: 'static' | 'global-motion-detected' };
  motionTypeProvenance: 'measured' | 'inferred';
  displacement: SubjectDisplacementMeasurement;
  displacementProvenance: 'measured' | 'inferred';
  relationship: { guess: 'approaching' | 'receding' | 'static-relationship' | 'unknown' };
  relationshipProvenance: 'measured' | 'inferred';
  relativeVelocity: number | null;
}

// Camera Motion Vector Measurement V1 added a real translation-vector source
// (skimage.registration.phase_cross_correlation, background-masked -- see
// cameraMotionVectorIntegration.ts). It only covers the specific real
// GHIBLI frame pairs it was run against, though -- for any other pair, this
// reason still applies honestly.
const NO_TRANSLATION_VECTOR_REASON =
  'No real camera-motion-vector evidence exists for this specific frame pair (see cameraMotionVectorIntegration.ts -- it currently covers only the real GHIBLI_01 1280-1281/1281-1282 pairs it was measured against).';
const NO_TEMPORAL_NEIGHBOR_REASON =
  'No adjacent frame was provided to materializeProductionContract() for this call -- temporal fields require a real, already-verified neighboring frame.';
const NO_CONTINUOUS_SUBJECT_REASON =
  'No primary subject with the same detected class was found in both this frame and its temporal neighbor (COCO labels are generic classes, not object identity -- a class mismatch is treated as no continuous subject, never guessed past).';

function materializeCameraTemporalTrack(
  temporal: TemporalMotionEvidence | null,
  cameraMotionVector: CameraMotionVectorPair | null
): ChannelMaterializationResult {
  const translationFields: FieldMaterializationResult[] = cameraMotionVector
    ? [
        {
          name: 'translation_u',
          status: 'materialized',
          value: cameraMotionVector.measured.translation_u_normalized,
          provenance: 'measured',
        },
        {
          name: 'translation_v',
          status: 'materialized',
          value: cameraMotionVector.measured.translation_v_normalized,
          provenance: 'measured',
        },
      ]
    : [unmaterializedField('translation_u', NO_TRANSLATION_VECTOR_REASON), unmaterializedField('translation_v', NO_TRANSLATION_VECTOR_REASON)];

  const fields: FieldMaterializationResult[] = temporal
    ? [
        { name: 'motion_type', status: 'materialized', value: temporal.motionType.guess, provenance: temporal.motionTypeProvenance },
        { name: 'magnitude', status: 'materialized', value: temporal.pairMotion.meanAbsoluteDifference, provenance: temporal.pairMotionProvenance },
        ...translationFields,
      ]
    : ['motion_type', 'magnitude', 'translation_u', 'translation_v'].map((name) =>
        unmaterializedField(name, NO_TEMPORAL_NEIGHBOR_REASON)
      );
  return { channel_id: 'camera_temporal_track', status: summarizeChannelStatus(fields), fields };
}

/**
 * Reuses an already-built EditBoundarySequenceResult verbatim (see
 * sceneMeasurementEditBoundaryAnalyzer.ts) -- computes nothing new here.
 * An empty cutTimestampsMs/shotDurationsMs array is a real, valid "zero
 * cuts detected in the analyzed window" outcome, not treated as missing --
 * status is 'materialized' whenever a real sequence was actually run,
 * regardless of how many (if any) cuts it found. Only the absence of any
 * sequence at all (no editBoundarySequence supplied) is 'no_real_source'.
 */
function materializeEditRhythmBoundaries(sequence: EditBoundarySequenceResult | null): ChannelMaterializationResult {
  const fields: FieldMaterializationResult[] = sequence
    ? [
        { name: 'cut_timestamp_ms', status: 'materialized', value: sequence.cutTimestampsMs, provenance: 'inferred' },
        { name: 'shot_duration_ms', status: 'materialized', value: sequence.shotDurationsMs, provenance: 'inferred' },
      ]
    : ['cut_timestamp_ms', 'shot_duration_ms'].map((name) => unmaterializedField(name, NO_EDIT_BOUNDARY_SEQUENCE_REASON));
  return { channel_id: 'edit_rhythm_boundaries', status: summarizeChannelStatus(fields), fields };
}

function materializeSceneEnergyField(temporal: TemporalMotionEvidence | null): ChannelMaterializationResult {
  if (!temporal) {
    const fields = ['motion_magnitude', 'camera_subject_relationship', 'relative_velocity'].map((name) =>
      unmaterializedField(name, NO_TEMPORAL_NEIGHBOR_REASON)
    );
    return { channel_id: 'scene_energy_field', status: summarizeChannelStatus(fields), fields };
  }
  const fields: FieldMaterializationResult[] = [
    { name: 'motion_magnitude', status: 'materialized', value: temporal.pairMotion.meanAbsoluteDifference, provenance: temporal.pairMotionProvenance },
    { name: 'camera_subject_relationship', status: 'materialized', value: temporal.relationship.guess, provenance: temporal.relationshipProvenance },
    temporal.relativeVelocity === null
      ? unmaterializedField('relative_velocity', NO_CONTINUOUS_SUBJECT_REASON)
      : { name: 'relative_velocity', status: 'materialized', value: temporal.relativeVelocity, provenance: temporal.displacementProvenance },
  ];
  return { channel_id: 'scene_energy_field', status: summarizeChannelStatus(fields), fields };
}

// ============================================================
// The two partially-sourceable original channels
// ============================================================

function materializeSubjectPositionField(sceneTruth: SceneTruth, temporal: TemporalMotionEvidence | null): ChannelMaterializationResult {
  const cameraMeasured = sceneTruth.camera.measured;
  const screenPosition = cameraMeasured.value.subjectScreenPosition;

  const centerFields: FieldMaterializationResult[] =
    screenPosition === null
      ? [
          unmaterializedField('center_u', 'no subject was detected in this frame (camera.measured.value.subjectScreenPosition is null)'),
          unmaterializedField('center_v', 'no subject was detected in this frame (camera.measured.value.subjectScreenPosition is null)'),
        ]
      : [
          { name: 'center_u', status: 'materialized', value: screenPosition.x, provenance: cameraMeasured.provenance },
          { name: 'center_v', status: 'materialized', value: screenPosition.y, provenance: cameraMeasured.provenance },
        ];

  const displacementFields: FieldMaterializationResult[] = !temporal
    ? [
        unmaterializedField('displacement_u', NO_TEMPORAL_NEIGHBOR_REASON),
        unmaterializedField('displacement_v', NO_TEMPORAL_NEIGHBOR_REASON),
      ]
    : temporal.displacement.displacementU === null || temporal.displacement.displacementV === null
      ? [
          unmaterializedField('displacement_u', NO_CONTINUOUS_SUBJECT_REASON),
          unmaterializedField('displacement_v', NO_CONTINUOUS_SUBJECT_REASON),
        ]
      : [
          { name: 'displacement_u', status: 'materialized', value: temporal.displacement.displacementU, provenance: temporal.displacementProvenance },
          { name: 'displacement_v', status: 'materialized', value: temporal.displacement.displacementV, provenance: temporal.displacementProvenance },
        ];

  const fields: FieldMaterializationResult[] = [...centerFields, ...displacementFields];
  return { channel_id: 'subject_position_field', status: summarizeChannelStatus(fields), fields };
}

function materializeFramingCompositionMap(sceneTruth: SceneTruth): ChannelMaterializationResult {
  const framingType = sceneTruth.camera.interpreted.framingType;
  // Composition Region Measurement V1: compositionRegion reuses the exact
  // same already-measured subjectScreenPosition subject_position_field's
  // own center_u/center_v already read -- no new detector, no new
  // measurement. 'materialized' with a null value (not 'no_real_source')
  // when there is no subject: Scene Truth genuinely attempted this and
  // honestly reports "no region to report", the same treatment
  // weather_guess/indoor_outdoor_guess already established for a real,
  // attempted-but-unknown outcome -- never a fabricated default like 'center'.
  const compositionRegion = sceneTruth.camera.interpreted.compositionRegion;
  const fields: FieldMaterializationResult[] = [
    { name: 'shot_scale', status: 'materialized', value: framingType.value.guess, provenance: framingType.provenance },
    { name: 'composition_region', status: 'materialized', value: compositionRegion.value.guess, provenance: compositionRegion.provenance },
  ];
  return { channel_id: 'framing_composition_map', status: summarizeChannelStatus(fields), fields };
}

// ============================================================
// The two fully-sourceable channels (DSC Scene Truth Compatibility V1)
// ============================================================

function toFieldResults(
  schema: typeof LIGHTING_CONDITION_FIELD_SCHEMA,
  values: Record<string, unknown>
): FieldMaterializationResult[] {
  return schema.map((field) => {
    const value = values[field.name];
    // Every declared field in these two schemas is always present as a key
    // (proven in DSC Scene Truth Compatibility V1's own verify script) --
    // 'materialized' covers both a real value and a real, honestly-null one.
    const provenanceKey = field.provenance_component;
    const provenance = provenanceKey ? (values[provenanceKey] as 'measured' | 'inferred') : null;
    return { name: field.name, status: 'materialized', value, provenance };
  });
}

function materializeLightingConditionField(sceneTruth: SceneTruth): ChannelMaterializationResult {
  const values = buildLightingConditionComponentsFromSceneTruth(sceneTruth);
  const fields = toFieldResults(LIGHTING_CONDITION_FIELD_SCHEMA, values);
  return { channel_id: 'lighting_condition_field', status: summarizeChannelStatus(fields), fields };
}

function materializeEnvironmentConditionField(sceneTruth: SceneTruth): ChannelMaterializationResult {
  const values = buildEnvironmentConditionComponentsFromSceneTruth(sceneTruth);
  const fields = toFieldResults(ENVIRONMENT_CONDITION_FIELD_SCHEMA, values);
  return { channel_id: 'environment_condition_field', status: summarizeChannelStatus(fields), fields };
}

// ============================================================
// Whole-contract materialization
// ============================================================

export interface MaterializedProductionContract {
  phase: typeof PRODUCTION_CONTRACT_MATERIALIZATION_PHASE;
  frame_fingerprint: string;
  source_video_fingerprint: string;
  timestamp_seconds: string;
  channels: readonly ChannelMaterializationResult[];
  /** Kept structurally separate from channels[] -- see file header. */
  real_occlusion: RealOcclusionSceneBinding;
  swap_boundary: typeof CONDITIONING_SWAP_BOUNDARY;
}

/** A real, adjacent, already-verified frame -- the "evidence" object is
 *  required (not just its SceneTruth) because MAD needs the raw frame bytes,
 *  which SceneTruth itself does not carry (only frame_fingerprint). */
export interface TemporalNeighbor {
  evidence: ExtractedFrameEvidence;
  sceneTruth: SceneTruth;
}

function computeTemporalMotionEvidence(
  projectRoot: string,
  evidence: ExtractedFrameEvidence,
  sceneTruth: SceneTruth,
  neighbor: TemporalNeighbor
): TemporalMotionEvidence {
  const pairMotionValue = measureFramePairMotion(projectRoot, evidence, neighbor.evidence);
  const motionInterp = interpretFramePairMotion(projectRoot, neighbor.evidence, pairMotionValue.value);
  const displacementValue = measureSubjectDisplacement(
    projectRoot,
    evidence,
    sceneTruth.geometry,
    neighbor.evidence,
    neighbor.sceneTruth.geometry
  );
  const relationshipInterp = interpretCameraSubjectRelationship(projectRoot, neighbor.evidence, displacementValue.value);
  const relativeVelocity = computeSubjectRelativeVelocity(displacementValue.value, pairMotionValue.value.timestampDeltaSeconds);

  return {
    pairMotion: pairMotionValue.value,
    pairMotionProvenance: pairMotionValue.provenance,
    motionType: motionInterp.motionType.value,
    motionTypeProvenance: motionInterp.motionType.provenance,
    displacement: displacementValue.value,
    displacementProvenance: displacementValue.provenance,
    relationship: relationshipInterp.relationship.value,
    relationshipProvenance: relationshipInterp.relationship.provenance,
    relativeVelocity,
  };
}

export function materializeProductionContract(
  projectRoot: string,
  sceneTruth: SceneTruth,
  evidence: ExtractedFrameEvidence,
  temporalNeighbor: TemporalNeighbor | null = null,
  cameraMotionVector: CameraMotionVectorPair | null = null,
  editBoundarySequence: EditBoundarySequenceResult | null = null
): MaterializedProductionContract {
  const temporal = temporalNeighbor ? computeTemporalMotionEvidence(projectRoot, evidence, sceneTruth, temporalNeighbor) : null;

  const channels: ChannelMaterializationResult[] = [
    materializeCameraPoseField(),
    materializeCameraTemporalTrack(temporal, cameraMotionVector),
    materializeSubjectPositionField(sceneTruth, temporal),
    materializeFramingCompositionMap(sceneTruth),
    materializeEditRhythmBoundaries(editBoundarySequence),
    materializeSceneEnergyField(temporal),
    materializeLightingConditionField(sceneTruth),
    materializeEnvironmentConditionField(sceneTruth),
  ];

  return {
    phase: PRODUCTION_CONTRACT_MATERIALIZATION_PHASE,
    frame_fingerprint: sceneTruth.frame_fingerprint,
    source_video_fingerprint: sceneTruth.source_video_fingerprint,
    timestamp_seconds: sceneTruth.timestamp_seconds,
    channels: Object.freeze(channels),
    real_occlusion: bindRealOcclusionToSceneTruth(projectRoot, sceneTruth),
    swap_boundary: CONDITIONING_SWAP_BOUNDARY,
  };
}

// ============================================================
// Verdict: PRODUCTION_CONTRACT_MATERIALIZED / REAL_GAP
// ============================================================

export interface ProductionContractMaterializationReadiness {
  verdict: 'PRODUCTION_CONTRACT_MATERIALIZED' | 'REAL_GAP';
  reason: string;
}

export function assessProductionContractMaterialization(
  contract: MaterializedProductionContract
): ProductionContractMaterializationReadiness {
  const incomplete = contract.channels.filter((c) => c.status !== 'materialized');
  if (incomplete.length > 0) {
    const detail = incomplete
      .map((c) => `${c.channel_id}(${c.status}: ${c.fields.filter((f) => f.status !== 'materialized').map((f) => f.name).join(',')})`)
      .join('; ');
    return {
      verdict: 'REAL_GAP',
      reason: `${incomplete.length} of ${contract.channels.length} channels could not be fully materialized from real Scene Truth data without a synthetic/default/fallback value: ${detail}`,
    };
  }

  if (contract.real_occlusion.status !== 'integrated') {
    return {
      verdict: 'REAL_GAP',
      reason: `real occlusion evidence is not integrated for this frame: ${contract.real_occlusion.reason}`,
    };
  }

  const swapCheck = assertOnlyCharacterAndStyleSwappable();
  if (!swapCheck.valid) {
    return { verdict: 'REAL_GAP', reason: `Character/Style swap boundary is not exclusive: ${swapCheck.issues.join('; ')}` };
  }

  return {
    verdict: 'PRODUCTION_CONTRACT_MATERIALIZED',
    reason: `all ${contract.channels.length} channels fully materialized from real Scene Truth data, real occlusion genuinely integrated (matched_via=${contract.real_occlusion.matched_via}), Character/Style swap boundary exclusive.`,
  };
}

// ============================================================
// Verdict: TEMPORAL_CONTRACT_INTEGRATED / REAL_GAP
// ============================================================

/**
 * A narrower, separate claim from PRODUCTION_CONTRACT_MATERIALIZED above:
 * whether real temporal (frame-pair MAD / matched-subject displacement)
 * evidence was genuinely wired into the channels that can honestly carry
 * it -- NOT whether all 8 channels are complete. At the time this function
 * was written, camera_pose_field, edit_rhythm_boundaries, translation_u/v,
 * and composition_region were all real, structural gaps this phase did not
 * claim to close; translation_u/v, composition_region, and edit_rhythm_boundaries
 * were all independently closed by later phases (Camera Motion Vector
 * Measurement V1, Composition Region Measurement V1, Edit Boundary
 * Measurement V1) without changing this function's own criteria below,
 * which still only asserts what its own name promises. camera_pose_field
 * remains a real gap; see this file's own header. TEMPORAL_CONTRACT_INTEGRATED
 * requires:
 *   1. camera_temporal_track.motion_type/magnitude and
 *      scene_energy_field.motion_magnitude/camera_subject_relationship are
 *      genuinely materialized from real MAD evidence (these never depend on
 *      subject continuity, so they succeed whenever a real temporal
 *      neighbor was supplied).
 *   2. edit_rhythm_boundaries is STILL exactly no_real_source on both
 *      fields for a call that never supplied an editBoundarySequence --
 *      explicitly checked as a pass condition, not merely left alone, so a
 *      future accidental fabrication there (independent of Edit Boundary
 *      Measurement V1's own, separately opt-in capability) would fail this
 *      verdict rather than silently slip through.
 *   3. No field anywhere carries a value without a real provenance tag.
 */
export interface TemporalContractIntegrationReadiness {
  verdict: 'TEMPORAL_CONTRACT_INTEGRATED' | 'REAL_GAP';
  reason: string;
}

export function assessTemporalContractIntegration(
  contract: MaterializedProductionContract
): TemporalContractIntegrationReadiness {
  const cameraTemporal = contract.channels.find((c) => c.channel_id === 'camera_temporal_track');
  const sceneEnergy = contract.channels.find((c) => c.channel_id === 'scene_energy_field');
  const editRhythm = contract.channels.find((c) => c.channel_id === 'edit_rhythm_boundaries');

  if (!cameraTemporal || !sceneEnergy || !editRhythm) {
    return { verdict: 'REAL_GAP', reason: 'materialized contract is missing an expected channel' };
  }

  const motionType = cameraTemporal.fields.find((f) => f.name === 'motion_type');
  const camTemporalMagnitude = cameraTemporal.fields.find((f) => f.name === 'magnitude');
  const motionMagnitude = sceneEnergy.fields.find((f) => f.name === 'motion_magnitude');
  const cameraSubjectRelationship = sceneEnergy.fields.find((f) => f.name === 'camera_subject_relationship');

  const madWired =
    motionType?.status === 'materialized' &&
    camTemporalMagnitude?.status === 'materialized' &&
    motionMagnitude?.status === 'materialized' &&
    cameraSubjectRelationship?.status === 'materialized';

  if (!madWired) {
    return {
      verdict: 'REAL_GAP',
      reason: 'real MAD-based motion evidence was not materialized into camera_temporal_track/scene_energy_field -- no temporal neighbor was supplied, or the underlying measurement failed',
    };
  }

  const editRhythmStillGapped = editRhythm.status === 'no_real_source' && editRhythm.fields.every((f) => f.status === 'no_real_source');
  if (!editRhythmStillGapped) {
    return {
      verdict: 'REAL_GAP',
      reason: 'edit_rhythm_boundaries is no longer no_real_source even though no editBoundarySequence was supplied to this call -- this phase requires that specific combination to stay no_real_source (a real cut detector exists since Edit Boundary Measurement V1, but only via that explicit, opt-in parameter)',
    };
  }

  // Fields named "*_provenance" (from the Lighting/Environment channels) ARE
  // the provenance tag itself -- see directSpatialConditioningSceneTruthCompatibility.ts's
  // provenance_component: null convention -- so they carry no separate
  // provenance pointer of their own and are excluded from this check.
  const anyValueWithoutProvenance = contract.channels.some((c) =>
    c.fields.some((f) => f.status === 'materialized' && !f.name.endsWith('_provenance') && f.provenance === null)
  );
  if (anyValueWithoutProvenance) {
    return { verdict: 'REAL_GAP', reason: 'a materialized field carries no provenance tag -- provenance was not preserved' };
  }

  const displacementWired = contract.channels
    .find((c) => c.channel_id === 'subject_position_field')
    ?.fields.some((f) => f.name === 'displacement_u' && f.status === 'materialized');

  return {
    verdict: 'TEMPORAL_CONTRACT_INTEGRATED',
    reason: `real frame-pair MAD evidence wired into camera_temporal_track (motion_type, magnitude) and scene_energy_field (motion_magnitude, camera_subject_relationship); edit_rhythm_boundaries correctly remains no_real_source; provenance intact throughout${displacementWired ? '; a continuous matched subject also allowed displacement_u/v and relative_velocity to materialize' : '; no continuous matched subject was found across this frame pair, so displacement_u/v and relative_velocity honestly remain no_real_source'}.`,
  };
}

// ============================================================
// Verdict: REAL_COMPOSITION_REGION_READY / REAL_GAP
// ============================================================

export interface CompositionRegionReadiness {
  verdict: 'REAL_COMPOSITION_REGION_READY' | 'REAL_GAP';
  reason: string;
}

/**
 * Composition Region Measurement V1's own claim: composition_region is
 * genuinely materialized from real, reused Geometry/Camera evidence (never
 * a new detector), tagged INFERRED (the region-bucket judgment call, not
 * the underlying continuous position), and its null-ness is structurally
 * consistent with whether a real subject was actually detected (per
 * subject_position_field.center_u's own status) -- never an independent,
 * possibly-disagreeing default.
 */
export function assessCompositionRegionReadiness(contract: MaterializedProductionContract): CompositionRegionReadiness {
  const framingComposition = contract.channels.find((c) => c.channel_id === 'framing_composition_map');
  if (!framingComposition) {
    return { verdict: 'REAL_GAP', reason: 'materialized contract is missing framing_composition_map' };
  }

  const compositionRegion = framingComposition.fields.find((f) => f.name === 'composition_region');
  if (!compositionRegion || compositionRegion.status !== 'materialized') {
    return { verdict: 'REAL_GAP', reason: `composition_region is not materialized (status=${compositionRegion?.status ?? 'missing'})` };
  }
  if (compositionRegion.provenance !== 'inferred') {
    return { verdict: 'REAL_GAP', reason: `composition_region has provenance '${compositionRegion.provenance}', expected 'inferred'` };
  }

  const centerU = contract.channels.find((c) => c.channel_id === 'subject_position_field')?.fields.find((f) => f.name === 'center_u');
  const subjectWasDetected = centerU?.status === 'materialized';
  const regionIsNull = compositionRegion.value === null;
  if (subjectWasDetected === regionIsNull) {
    return {
      verdict: 'REAL_GAP',
      reason: `composition_region null-ness (value=${JSON.stringify(compositionRegion.value)}) disagrees with whether a real subject was actually detected (subject_position_field.center_u materialized=${subjectWasDetected}) -- possible arbitrary default`,
    };
  }

  return {
    verdict: 'REAL_COMPOSITION_REGION_READY',
    reason: `composition_region genuinely materialized (guess=${JSON.stringify(compositionRegion.value)}) from real, reused Geometry/Camera evidence (subjectScreenPosition), correctly INFERRED, and its null-ness is consistent with real subject-detection state -- no arbitrary default.`,
  };
}

// ============================================================
// Verdict: REAL_EDIT_BOUNDARY_READY / REAL_GAP
// ============================================================

export interface EditBoundaryReadiness {
  verdict: 'REAL_EDIT_BOUNDARY_READY' | 'REAL_GAP';
  reason: string;
}

/**
 * Edit Boundary Measurement V1's own claim: edit_rhythm_boundaries is
 * genuinely materialized from a real, threshold-gated cut-boundary
 * sequence -- never a forced/fabricated entry. Requires the sequence to
 * have actually run (materialized status) and, structurally, that every
 * timestamp appearing in cut_timestamp_ms corresponds to a pair the
 * sequence itself classified 'cut-boundary' -- never an entry the
 * threshold didn't clear.
 */
export function assessEditBoundaryReadiness(
  contract: MaterializedProductionContract,
  sequence: EditBoundarySequenceResult | null
): EditBoundaryReadiness {
  const editRhythm = contract.channels.find((c) => c.channel_id === 'edit_rhythm_boundaries');
  if (!editRhythm) {
    return { verdict: 'REAL_GAP', reason: 'materialized contract is missing edit_rhythm_boundaries' };
  }
  if (editRhythm.status !== 'materialized') {
    return { verdict: 'REAL_GAP', reason: `edit_rhythm_boundaries is not materialized (status=${editRhythm.status}) -- no editBoundarySequence was supplied` };
  }
  if (!sequence) {
    return { verdict: 'REAL_GAP', reason: 'no EditBoundarySequenceResult was provided to assess' };
  }

  const cutField = editRhythm.fields.find((f) => f.name === 'cut_timestamp_ms');
  const durationField = editRhythm.fields.find((f) => f.name === 'shot_duration_ms');
  if (cutField?.provenance !== 'inferred' || durationField?.provenance !== 'inferred') {
    return { verdict: 'REAL_GAP', reason: 'cut_timestamp_ms/shot_duration_ms do not carry inferred provenance as expected' };
  }

  // Structural "never forced" check: every cut timestamp in the sequence
  // must trace back to a pair this sequence itself classified
  // 'cut-boundary' -- never an entry the threshold didn't clear.
  const realCutTimestamps = new Set(
    sequence.pairs.filter((p) => p.interpreted.value.guess === 'cut-boundary').map((p) => p.timestampMsB)
  );
  const everyTimestampIsReal = sequence.cutTimestampsMs.every((ts) => realCutTimestamps.has(ts));
  if (!everyTimestampIsReal) {
    return { verdict: 'REAL_GAP', reason: 'cut_timestamp_ms contains an entry not backed by a real threshold-cleared pair -- possible forced boundary' };
  }

  const belowThresholdPairs = sequence.pairs.filter((p) => p.interpreted.value.guess === 'continuous');
  const noForcedEntriesFromBelowThreshold = belowThresholdPairs.every((p) => !sequence.cutTimestampsMs.includes(p.timestampMsB));
  if (!noForcedEntriesFromBelowThreshold) {
    return { verdict: 'REAL_GAP', reason: 'a pair classified continuous (threshold not met) still produced a boundary entry -- forced generation detected' };
  }

  return {
    verdict: 'REAL_EDIT_BOUNDARY_READY',
    reason: `${sequence.pairs.length} real consecutive frame pair(s) evaluated with a real, threshold-gated cut detector (reused MAD + color-mean-shift, see sceneMeasurementEditBoundaryAnalyzer.ts); ${sequence.cutTimestampsMs.length} real cut boundary(ies) found, ${belowThresholdPairs.length} pair(s) correctly produced no forced boundary; edit_rhythm_boundaries genuinely materialized with inferred provenance.`,
  };
}
