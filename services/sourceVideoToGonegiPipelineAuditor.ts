import fs from 'node:fs';
import path from 'node:path';
import { REPLACEMENT_CONTRACT_PATH } from './characterReplacementContractBuilder.js';
import { BLEND_PROFILE_PATH } from './directorGrammarBlendBuilder.js';
import { TRANSLATION_PROFILE_PATH } from './gonegiWorldTranslationBuilder.js';
import { loadGonegiGpuPayload } from './gonegiMotionToGpuPayloadCompiler.js';
import { loadGonegiMotionPlan } from './gonegiKeyframeToMotionCompiler.js';
import { loadGonegiKeyframePlan } from './gonegiVideoStateToKeyframeCompiler.js';
import { loadGonegiRuntimeInterface } from './gonegiGpuPayloadToRuntimeInterfaceCompiler.js';
import { loadGonegiRuntimeJob } from './gonegiRuntimeStubExecutor.js';
import { loadGonegiVideoState } from './gonegiStateToVideoStateTranslator.js';
import { loadGonegiSceneState } from './sourceStateToGonegiStateCompiler.js';
import { DIRECTOR_GRAMMAR_REGISTRY_PATH } from './directorGrammarExtractor.js';
import {
  loadCoordinateRecord,
  SEED_COORDINATE_SPECS,
} from './sourceVideoSegmentToCoordinateCompiler.js';
import { loadSceneSegment, SEED_SEGMENT_SPECS } from './sourceVideoSceneSegmentBuilder.js';
import {
  FINAL_SET_PATH,
  FINAL_SET_REGISTRY_PATH,
} from './sourceVideoFinalSetBuilder.js';
import {
  loadStateDraft,
  SEED_STATE_DRAFT_SPECS,
} from './sourceVideoCoordinateToStateCompiler.js';
import { VIDEO_STATE_DEFAULTS_PATH } from './sourceVideoGrammarToVideoStateCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PIPELINE_AUDIT_PHASE =
  'PHASE-SOURCE-VIDEO-020-SOURCE_VIDEO_TO_GONEGI_PIPELINE_AUDIT_V1' as const;

export const PIPELINE_CHAIN_SPECS = Object.freeze([
  {
    chain_id: 'chain_ghibli_kitchen_v1',
    source_video_id: 'GHIBLI_01',
    segment_id: 'segment_ghibli_kitchen_001_v1',
    coordinate_record_id: 'coord_ghibli_kitchen_001_v1',
    state_draft_id: 'state_draft_ghibli_kitchen_001_v2',
    gonegi_state_id: 'gonegi_state_ghibli_kitchen_v1',
    gonegi_video_state_id: 'gonegi_video_state_ghibli_kitchen_v1',
    keyframe_plan_id: 'gonegi_keyframe_ghibli_kitchen_v1',
    motion_plan_id: 'gonegi_motion_ghibli_kitchen_v1',
    gpu_payload_id: 'gonegi_gpu_payload_ghibli_kitchen_v1',
    runtime_interface_id: 'gonegi_runtime_ghibli_kitchen_v1',
    runtime_job_id: 'gonegi_runtime_job_ghibli_kitchen_v1',
  },
  {
    chain_id: 'chain_shinkai_sky_light_v1',
    source_video_id: 'SHINKAI_01',
    segment_id: 'segment_shinkai_sky_light_001_v1',
    coordinate_record_id: 'coord_shinkai_sky_light_001_v1',
    state_draft_id: 'state_draft_shinkai_sky_light_001_v2',
    gonegi_state_id: 'gonegi_state_shinkai_sky_light_v1',
    gonegi_video_state_id: 'gonegi_video_state_shinkai_sky_light_v1',
    keyframe_plan_id: 'gonegi_keyframe_shinkai_sky_light_v1',
    motion_plan_id: 'gonegi_motion_shinkai_sky_light_v1',
    gpu_payload_id: 'gonegi_gpu_payload_shinkai_sky_light_v1',
    runtime_interface_id: 'gonegi_runtime_shinkai_sky_light_v1',
    runtime_job_id: 'gonegi_runtime_job_shinkai_sky_light_v1',
  },
  {
    chain_id: 'chain_live_action_dialogue_v1',
    source_video_id: 'LITTLE_WOMEN_01',
    segment_id: 'segment_live_action_dialogue_001_v1',
    coordinate_record_id: 'coord_live_action_dialogue_001_v1',
    state_draft_id: 'state_draft_live_action_dialogue_001_v2',
    gonegi_state_id: 'gonegi_state_live_action_dialogue_v1',
    gonegi_video_state_id: 'gonegi_video_state_live_action_dialogue_v1',
    keyframe_plan_id: 'gonegi_keyframe_live_action_dialogue_v1',
    motion_plan_id: 'gonegi_motion_live_action_dialogue_v1',
    gpu_payload_id: 'gonegi_gpu_payload_live_action_dialogue_v1',
    runtime_interface_id: 'gonegi_runtime_live_action_dialogue_v1',
    runtime_job_id: 'gonegi_runtime_job_live_action_dialogue_v1',
  },
  {
    chain_id: 'chain_mori_emotion_flow_v1',
    source_video_id: 'MORI_01',
    segment_id: 'segment_mori_emotion_flow_001_v1',
    coordinate_record_id: 'coord_mori_emotion_flow_001_v1',
    state_draft_id: 'state_draft_mori_emotion_flow_001_v2',
    gonegi_state_id: 'gonegi_state_mori_emotion_flow_v1',
    gonegi_video_state_id: 'gonegi_video_state_mori_emotion_flow_v1',
    keyframe_plan_id: 'gonegi_keyframe_mori_emotion_flow_v1',
    motion_plan_id: 'gonegi_motion_mori_emotion_flow_v1',
    gpu_payload_id: 'gonegi_gpu_payload_mori_emotion_flow_v1',
    runtime_interface_id: 'gonegi_runtime_mori_emotion_flow_v1',
    runtime_job_id: 'gonegi_runtime_job_mori_emotion_flow_v1',
  },
] as const);

export type PipelineAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  chain_id?: string;
  stage?: string;
};

export type PipelineChainTrace = {
  chain_id: string;
  source_video_id: string;
  segment_id: string;
  coordinate_record_id: string;
  state_draft_id: string;
  gonegi_state_id: string;
  gonegi_video_state_id: string;
  keyframe_plan_id: string;
  motion_plan_id: string;
  gpu_payload_id: string;
  runtime_interface_id: string;
  runtime_job_id: string;
  link_status: 'PASS' | 'FAIL';
  issues: string[];
};

export type PipelineStageStatus = {
  stage: string;
  present: boolean;
  count: number;
  expected_pipeline_count: number;
};

export type SourceVideoToGonegiPipelineAudit = {
  report_id: string;
  phase: typeof PIPELINE_AUDIT_PHASE;
  timestamp: string;
  chain_status: 'PASS' | 'FAIL';
  source_count: number;
  segment_count: number;
  coordinate_count: number;
  state_draft_count: number;
  gonegi_state_count: number;
  video_state_count: number;
  keyframe_plan_count: number;
  motion_plan_count: number;
  gpu_payload_count: number;
  runtime_interface_count: number;
  runtime_job_count: number;
  identity_status: 'PASS' | 'FAIL';
  continuity_status: 'PASS' | 'FAIL';
  traceability_status: 'PASS' | 'FAIL';
  execution_safety_status: 'PASS' | 'FAIL';
  missing_links: string[];
  orphan_records: string[];
  stage_statuses: PipelineStageStatus[];
  chain_traces: PipelineChainTrace[];
  issues: PipelineAuditIssue[];
};

function fileExists(projectRoot: string, relPath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relPath));
}

function locksSubset(source: string[], target: string[]): boolean {
  return source.every((lock) => target.includes(lock));
}

function auditChain(projectRoot: string, chain: (typeof PIPELINE_CHAIN_SPECS)[number]): PipelineChainTrace {
  const issues: string[] = [];

  const segment = loadSceneSegment(projectRoot, chain.segment_id);
  if (!segment) {
    issues.push(`Missing segment: ${chain.segment_id}`);
  } else if (segment.source_video_id !== chain.source_video_id) {
    issues.push(`Segment source_video_id mismatch: ${segment.source_video_id}`);
  }

  const coord = loadCoordinateRecord(projectRoot, chain.coordinate_record_id);
  if (!coord) {
    issues.push(`Missing coordinate: ${chain.coordinate_record_id}`);
  } else if (coord.segment_id !== chain.segment_id) {
    issues.push(`Coordinate segment link mismatch`);
  }

  const draft = loadStateDraft(projectRoot, chain.state_draft_id);
  if (!draft) {
    issues.push(`Missing state draft: ${chain.state_draft_id}`);
  } else {
    if (draft.source_coordinate_record_id !== chain.coordinate_record_id) {
      issues.push('State draft coordinate link mismatch');
    }
    if (draft.source_video_id !== chain.source_video_id) {
      issues.push('State draft source_video_id mismatch');
    }
  }

  const gonegiState = loadGonegiSceneState(projectRoot, chain.gonegi_state_id);
  if (!gonegiState) {
    issues.push(`Missing gonegi state: ${chain.gonegi_state_id}`);
  } else if (gonegiState.source_state_draft_id !== chain.state_draft_id) {
    issues.push('Gonegi state source draft link mismatch');
  }

  const videoState = loadGonegiVideoState(projectRoot, chain.gonegi_video_state_id);
  if (!videoState) {
    issues.push(`Missing gonegi video state: ${chain.gonegi_video_state_id}`);
  } else if (videoState.gonegi_state_id !== chain.gonegi_state_id) {
    issues.push('Video state gonegi_state link mismatch');
  }

  const keyframePlan = loadGonegiKeyframePlan(projectRoot, chain.keyframe_plan_id);
  if (!keyframePlan) {
    issues.push(`Missing keyframe plan: ${chain.keyframe_plan_id}`);
  } else if (keyframePlan.source_gonegi_video_state_id !== chain.gonegi_video_state_id) {
    issues.push('Keyframe plan video state link mismatch');
  }

  const motionPlan = loadGonegiMotionPlan(projectRoot, chain.motion_plan_id);
  if (!motionPlan) {
    issues.push(`Missing motion plan: ${chain.motion_plan_id}`);
  } else if (motionPlan.source_keyframe_plan_id !== chain.keyframe_plan_id) {
    issues.push('Motion plan keyframe link mismatch');
  }

  const gpuPayload = loadGonegiGpuPayload(projectRoot, chain.gpu_payload_id);
  if (!gpuPayload) {
    issues.push(`Missing gpu payload: ${chain.gpu_payload_id}`);
  } else if (gpuPayload.source_motion_plan_id !== chain.motion_plan_id) {
    issues.push('GPU payload motion plan link mismatch');
  }

  const runtimeIface = loadGonegiRuntimeInterface(projectRoot, chain.runtime_interface_id);
  if (!runtimeIface) {
    issues.push(`Missing runtime interface: ${chain.runtime_interface_id}`);
  } else if (runtimeIface.source_gpu_payload_id !== chain.gpu_payload_id) {
    issues.push('Runtime interface payload link mismatch');
  }

  const runtimeJob = loadGonegiRuntimeJob(projectRoot, chain.runtime_job_id);
  if (!runtimeJob) {
    issues.push(`Missing runtime job: ${chain.runtime_job_id}`);
  } else {
    if (runtimeJob.runtime_interface_id !== chain.runtime_interface_id) {
      issues.push('Runtime job interface link mismatch');
    }
    if (runtimeJob.job_state !== 'SIMULATED_COMPLETE') {
      issues.push(`Runtime job not complete: ${runtimeJob.job_state}`);
    }
  }

  if (gonegiState && videoState && gpuPayload && runtimeJob) {
    if (
      gonegiState.translation_trace.translation_id !==
      videoState.translation_trace.translation_id
    ) {
      issues.push('Translation trace broken at video state');
    }
    if (
      gonegiState.translation_trace.translation_id !==
      gpuPayload.translation_trace.translation_id
    ) {
      issues.push('Translation trace broken at gpu payload');
    }
    if (
      gonegiState.replacement_trace.contract_id !==
      gpuPayload.replacement_trace.contract_id
    ) {
      issues.push('Replacement trace broken at gpu payload');
    }
    if (!locksSubset(gonegiState.continuity_locks.identity_locks, gpuPayload.identity_locks)) {
      issues.push('Identity locks not preserved to gpu payload');
    }
    if (
      runtimeIface &&
      !locksSubset(
        gonegiState.continuity_locks.identity_locks,
        runtimeIface.identity_lock_contract.identity_locks
      )
    ) {
      issues.push('Identity locks not preserved to runtime interface');
    }
    if (runtimeJob.identity_lock_result !== 'PASS') {
      issues.push('Runtime job identity_lock_result not PASS');
    }
    if (runtimeJob.continuity_lock_result !== 'PASS') {
      issues.push('Runtime job continuity_lock_result not PASS');
    }
  }

  const executionArtifacts = [draft, gonegiState, videoState, gpuPayload, runtimeIface, runtimeJob].filter(
    Boolean
  ) as Array<{ execution_flags?: Record<string, boolean> }>;
  for (const artifact of executionArtifacts) {
    const flags = artifact.execution_flags;
    if (!flags) continue;
    if (flags.gpu_execution !== false) issues.push('gpu_execution must be false');
    if (flags.external_call_allowed !== false) issues.push('external_call_allowed must be false');
    if (flags.design_only !== true && flags.simulation_only !== true) {
      issues.push('artifact must be design_only or simulation_only');
    }
  }

  return {
    chain_id: chain.chain_id,
    source_video_id: chain.source_video_id,
    segment_id: chain.segment_id,
    coordinate_record_id: chain.coordinate_record_id,
    state_draft_id: chain.state_draft_id,
    gonegi_state_id: chain.gonegi_state_id,
    gonegi_video_state_id: chain.gonegi_video_state_id,
    keyframe_plan_id: chain.keyframe_plan_id,
    motion_plan_id: chain.motion_plan_id,
    gpu_payload_id: chain.gpu_payload_id,
    runtime_interface_id: chain.runtime_interface_id,
    runtime_job_id: chain.runtime_job_id,
    link_status: issues.length === 0 ? 'PASS' : 'FAIL',
    issues,
  };
}

export function runSourceVideoToGonegiPipelineAudit(
  projectRoot?: string
): SourceVideoToGonegiPipelineAudit {
  const root = resolveProjectRoot(projectRoot);
  const timestamp = new Date().toISOString();
  const issues: PipelineAuditIssue[] = [];
  const missing_links: string[] = [];
  const orphan_records: string[] = [];

  const upstreamStages: Array<{ stage: string; path: string; expected: number }> = [
    { stage: 'source_video_final_set', path: FINAL_SET_PATH, expected: 15 },
    { stage: 'director_grammar', path: DIRECTOR_GRAMMAR_REGISTRY_PATH, expected: 4 },
    { stage: 'director_blend', path: BLEND_PROFILE_PATH, expected: 1 },
    { stage: 'video_state_defaults', path: VIDEO_STATE_DEFAULTS_PATH, expected: 1 },
    { stage: 'world_translation', path: TRANSLATION_PROFILE_PATH, expected: 1 },
    { stage: 'character_replacement', path: REPLACEMENT_CONTRACT_PATH, expected: 1 },
  ];

  const stage_statuses: PipelineStageStatus[] = [];

  let source_count = 0;
  if (fileExists(root, FINAL_SET_PATH)) {
    const finalSet = JSON.parse(fs.readFileSync(path.join(root, FINAL_SET_PATH), 'utf8')) as {
      active_count?: number;
      videos?: Array<{ tier?: string }>;
    };
    source_count =
      finalSet.active_count ??
      finalSet.videos?.filter((v) => v.tier === 'active').length ??
      0;
  } else {
    issues.push({
      code: 'MISSING_FINAL_SET',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
      stage: 'source_video_final_set',
    });
  }

  if (!fileExists(root, FINAL_SET_REGISTRY_PATH)) {
    issues.push({
      code: 'MISSING_FINAL_SET_REGISTRY',
      message: `Missing ${FINAL_SET_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  for (const stage of upstreamStages) {
    const present = fileExists(root, stage.path);
    stage_statuses.push({
      stage: stage.stage,
      present,
      count: present ? stage.expected : 0,
      expected_pipeline_count: stage.stage.includes('final') ? 15 : stage.expected,
    });
    if (!present) {
      issues.push({
        code: 'MISSING_STAGE_ARTIFACT',
        message: `Missing ${stage.stage}: ${stage.path}`,
        severity: 'error',
        stage: stage.stage,
      });
    }
  }

  const pipelineStages = [
    { stage: 'scene_segments', specs: SEED_SEGMENT_SPECS, idKey: 'segment_id' as const },
    { stage: 'source_video_coordinates', specs: SEED_COORDINATE_SPECS, idKey: 'coordinate_record_id' as const },
    { stage: 'source_video_state_drafts', specs: SEED_STATE_DRAFT_SPECS, idKey: 'state_draft_id' as const },
  ];

  for (const { stage, specs } of pipelineStages) {
    stage_statuses.push({
      stage,
      present: true,
      count: specs.length,
      expected_pipeline_count: 4,
    });
  }

  const chain_traces = PIPELINE_CHAIN_SPECS.map((chain) => auditChain(root, chain));

  for (const trace of chain_traces) {
    if (trace.link_status === 'FAIL') {
      for (const msg of trace.issues) {
        missing_links.push(`${trace.chain_id}: ${msg}`);
        issues.push({
          code: 'CHAIN_LINK_FAIL',
          message: msg,
          severity: 'error',
          chain_id: trace.chain_id,
        });
      }
    }
  }

  const pipelineIds = new Set(PIPELINE_CHAIN_SPECS.flatMap((c) => [
    c.segment_id,
    c.coordinate_record_id,
    c.state_draft_id,
    c.gonegi_state_id,
    c.gonegi_video_state_id,
    c.keyframe_plan_id,
    c.motion_plan_id,
    c.gpu_payload_id,
    c.runtime_interface_id,
    c.runtime_job_id,
  ]));

  for (const spec of SEED_SEGMENT_SPECS) {
    if (!pipelineIds.has(spec.segment_id)) {
      orphan_records.push(`segment:${spec.segment_id}`);
    }
  }

  const segment_count = chain_traces.filter((t) => t.link_status === 'PASS' || loadSceneSegment(root, t.segment_id)).length;
  const coordinate_count = PIPELINE_CHAIN_SPECS.length;
  const state_draft_count = PIPELINE_CHAIN_SPECS.length;
  const gonegi_state_count = chain_traces.filter((t) => loadGonegiSceneState(root, t.gonegi_state_id)).length;
  const video_state_count = chain_traces.filter((t) => loadGonegiVideoState(root, t.gonegi_video_state_id)).length;
  const keyframe_plan_count = chain_traces.filter((t) => loadGonegiKeyframePlan(root, t.keyframe_plan_id)).length;
  const motion_plan_count = chain_traces.filter((t) => loadGonegiMotionPlan(root, t.motion_plan_id)).length;
  const gpu_payload_count = chain_traces.filter((t) => loadGonegiGpuPayload(root, t.gpu_payload_id)).length;
  const runtime_interface_count = chain_traces.filter((t) =>
    loadGonegiRuntimeInterface(root, t.runtime_interface_id)
  ).length;
  const runtime_job_count = chain_traces.filter(
    (t) => loadGonegiRuntimeJob(root, t.runtime_job_id)?.job_state === 'SIMULATED_COMPLETE'
  ).length;

  const downstreamStages = [
    { stage: 'gonegi_states', count: gonegi_state_count },
    { stage: 'gonegi_video_states', count: video_state_count },
    { stage: 'gonegi_keyframe_plans', count: keyframe_plan_count },
    { stage: 'gonegi_motion_plans', count: motion_plan_count },
    { stage: 'gonegi_gpu_payloads', count: gpu_payload_count },
    { stage: 'gonegi_runtime_interfaces', count: runtime_interface_count },
    { stage: 'gonegi_runtime_jobs', count: runtime_job_count },
  ];

  for (const ds of downstreamStages) {
    stage_statuses.push({
      stage: ds.stage,
      present: ds.count === 4,
      count: ds.count,
      expected_pipeline_count: 4,
    });
    if (ds.count !== 4) {
      issues.push({
        code: 'PIPELINE_COUNT_MISMATCH',
        message: `${ds.stage} expected 4, got ${ds.count}`,
        severity: 'error',
        stage: ds.stage,
      });
    }
  }

  const identity_status = chain_traces.every((t) => {
    const gonegi = loadGonegiSceneState(root, t.gonegi_state_id);
    const job = loadGonegiRuntimeJob(root, t.runtime_job_id);
    if (!gonegi || !job) return false;
    return (
      job.identity_lock_result === 'PASS' &&
      locksSubset(gonegi.continuity_locks.identity_locks, gonegi.identity_state.identity_lock_tokens)
    );
  })
    ? 'PASS'
    : 'FAIL';

  const continuity_status = chain_traces.every((t) => {
    const job = loadGonegiRuntimeJob(root, t.runtime_job_id);
    return job?.continuity_lock_result === 'PASS';
  })
    ? 'PASS'
    : 'FAIL';

  const traceability_status = chain_traces.every((t) => {
    const gonegi = loadGonegiSceneState(root, t.gonegi_state_id);
    const gpu = loadGonegiGpuPayload(root, t.gpu_payload_id);
    if (!gonegi || !gpu) return false;
    return (
      gonegi.translation_trace.translation_id === gpu.translation_trace.translation_id &&
      gonegi.replacement_trace.contract_id === gpu.replacement_trace.contract_id
    );
  })
    ? 'PASS'
    : 'FAIL';

  const execution_safety_status = chain_traces.every((t) => {
    const job = loadGonegiRuntimeJob(root, t.runtime_job_id);
    const gpu = loadGonegiGpuPayload(root, t.gpu_payload_id);
    if (!job || !gpu) return false;
    return (
      job.execution_flags.gpu_execution === false &&
      job.execution_flags.external_call_allowed === false &&
      job.execution_flags.provider_activation === false &&
      job.execution_flags.simulation_only === true &&
      gpu.execution_flags.gpu_execution === false &&
      gpu.execution_flags.design_only === true
    );
  })
    ? 'PASS'
    : 'FAIL';

  if (identity_status === 'FAIL') {
    issues.push({ code: 'IDENTITY_STATUS_FAIL', message: 'Identity locks not preserved across chain', severity: 'error' });
  }
  if (continuity_status === 'FAIL') {
    issues.push({ code: 'CONTINUITY_STATUS_FAIL', message: 'Continuity locks not preserved across chain', severity: 'error' });
  }
  if (traceability_status === 'FAIL') {
    issues.push({ code: 'TRACEABILITY_STATUS_FAIL', message: 'Translation/replacement trace broken', severity: 'error' });
  }
  if (execution_safety_status === 'FAIL') {
    issues.push({ code: 'EXECUTION_SAFETY_FAIL', message: 'Execution flags unsafe in chain', severity: 'error' });
  }

  for (const chain of PIPELINE_CHAIN_SPECS) {
    if (!loadSceneSegment(root, chain.segment_id)) continue;
    const finalSet = fileExists(root, FINAL_SET_PATH)
      ? (JSON.parse(fs.readFileSync(path.join(root, FINAL_SET_PATH), 'utf8')) as {
          videos?: Array<{ source_video_id: string; tier?: string }>;
        })
      : null;
    const inFinalSet = finalSet?.videos?.some(
      (v) => v.source_video_id === chain.source_video_id && v.tier === 'active'
    );
    if (!inFinalSet) {
      orphan_records.push(`source_video:${chain.source_video_id}`);
      issues.push({
        code: 'SOURCE_VIDEO_NOT_IN_FINAL_SET',
        message: `${chain.source_video_id} not in final set`,
        severity: 'error',
        chain_id: chain.chain_id,
      });
    }
  }

  const chain_status =
    chain_traces.every((t) => t.link_status === 'PASS') &&
    missing_links.length === 0 &&
    runtime_job_count === 4
      ? 'PASS'
      : 'FAIL';

  return {
    report_id: 'source-video-to-gonegi-pipeline-audit-report-v1',
    phase: PIPELINE_AUDIT_PHASE,
    timestamp,
    chain_status,
    source_count,
    segment_count: SEED_SEGMENT_SPECS.length,
    coordinate_count,
    state_draft_count,
    gonegi_state_count,
    video_state_count,
    keyframe_plan_count,
    motion_plan_count,
    gpu_payload_count,
    runtime_interface_count,
    runtime_job_count,
    identity_status,
    continuity_status,
    traceability_status,
    execution_safety_status,
    missing_links,
    orphan_records,
    stage_statuses,
    chain_traces,
    issues,
  };
}

export type PipelineTraceChain = {
  chain_id: string;
  source_video_id: string;
  segment_id: string;
  coordinate_record_id: string;
  state_draft_id: string;
  gonegi_state_id: string;
  gonegi_video_state_id: string;
  keyframe_plan_id: string;
  motion_plan_id: string;
  gpu_payload_id: string;
  runtime_interface_id: string;
  runtime_job_id: string;
};

export function buildTraceMap(audit: SourceVideoToGonegiPipelineAudit): {
  trace_map_id: string;
  phase: typeof PIPELINE_AUDIT_PHASE;
  timestamp: string;
  chains: PipelineTraceChain[];
} {
  return {
    trace_map_id: 'source-video-to-gonegi-trace-map-v1',
    phase: PIPELINE_AUDIT_PHASE,
    timestamp: audit.timestamp,
    chains: PIPELINE_CHAIN_SPECS.map((chain) => ({
      chain_id: chain.chain_id,
      source_video_id: chain.source_video_id,
      segment_id: chain.segment_id,
      coordinate_record_id: chain.coordinate_record_id,
      state_draft_id: chain.state_draft_id,
      gonegi_state_id: chain.gonegi_state_id,
      gonegi_video_state_id: chain.gonegi_video_state_id,
      keyframe_plan_id: chain.keyframe_plan_id,
      motion_plan_id: chain.motion_plan_id,
      gpu_payload_id: chain.gpu_payload_id,
      runtime_interface_id: chain.runtime_interface_id,
      runtime_job_id: chain.runtime_job_id,
    })),
  };
}
