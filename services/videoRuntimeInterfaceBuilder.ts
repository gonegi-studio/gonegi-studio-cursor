import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import {
  loadGpuRenderPayload,
  type GpuRenderPayload,
} from './gpuRenderPayloadBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VIDEO_RUNTIME_PHASE = 'PHASE-23-VIDEO-RUNTIME-INTERFACE-DESIGN-001' as const;
export const VIDEO_RUNTIME_REGISTRY_PATH =
  'datasets/video_runtime/video-runtime-interface-registry.json' as const;

export const RUNTIME_TARGETS = Object.freeze(['local_stub', 'remote_stub', 'deferred'] as const);
export type RuntimeTarget = (typeof RUNTIME_TARGETS)[number];

export const SEED_VIDEO_RUNTIME_SPECS = Object.freeze([
  {
    runtime_interface_id: 'video_runtime_gonegi_bedroom_reading_6s_v1',
    source_gpu_payload_id: 'gpu_payload_gonegi_bedroom_reading_6s_v1',
    runtime_target: 'deferred' as RuntimeTarget,
  },
  {
    runtime_interface_id: 'video_runtime_gonegi_dana_harbor_reunion_8s_v1',
    source_gpu_payload_id: 'gpu_payload_gonegi_dana_harbor_reunion_8s_v1',
    runtime_target: 'deferred' as RuntimeTarget,
  },
  {
    runtime_interface_id: 'video_runtime_olive_hill_wonder_6s_v1',
    source_gpu_payload_id: 'gpu_payload_olive_hill_wonder_6s_v1',
    runtime_target: 'deferred' as RuntimeTarget,
  },
] as const);

export type VideoRuntimeInterface = {
  runtime_interface_id: string;
  phase: typeof VIDEO_RUNTIME_PHASE;
  source_gpu_payload_id: string;
  runtime_target: RuntimeTarget;
  handshake: {
    payload_schema_version: string;
    required_lock_categories: string[];
    preflight_checks: string[];
    identity_lock_count: number;
  };
  submission_contract: {
    method: 'submit_render_job_stub';
    input_artifact_path: string;
    output_artifact_placeholder: string;
    timeout_seconds: number;
    submission_allowed: false;
  };
  local_adapter: {
    adapter_id: string;
    runtime_kind: 'local_gpu_stub';
    executable: null;
    status: 'not_wired';
    notes: string;
  };
  remote_adapter: {
    adapter_id: string;
    runtime_kind: 'remote_api_stub';
    endpoint: null;
    status: 'not_wired';
    notes: string;
  };
  payload_summary: {
    duration_seconds: number;
    fps_target: number;
    resolution: string;
    aspect_ratio: string;
    keyframe_count: number;
    motion_segment_count: number;
    source_scene_state_id: string;
  };
  execution_flags: {
    gpu_execution: false;
    preparation_only: true;
    external_call_allowed: false;
  };
  readiness: 'design_only';
  built_at: string;
};

function buildPreflightChecks(payload: GpuRenderPayload): string[] {
  return [
    'verify:gpu-payload',
    'identity_locks_present',
    'location_locks_present',
    'motion_segments_aligned_with_keyframes',
    `duration_seconds:${payload.duration_seconds}`,
    `fps_target:${payload.fps_target}`,
    'execution_flags.gpu_execution=false',
    'execution_flags.external_call_allowed=false',
  ];
}

export function buildVideoRuntimeInterface(
  payload: GpuRenderPayload,
  runtimeInterfaceId: string,
  runtimeTarget: RuntimeTarget = 'deferred'
): VideoRuntimeInterface {
  const payloadPath = `datasets/gpu_payload/payloads/${payload.gpu_payload_id}.json`;

  return {
    runtime_interface_id: runtimeInterfaceId,
    phase: VIDEO_RUNTIME_PHASE,
    source_gpu_payload_id: payload.gpu_payload_id,
    runtime_target: runtimeTarget,
    handshake: {
      payload_schema_version: 'gpu-render-payload-v1',
      required_lock_categories: ['identity_locks', 'location_locks', 'composition_locks'],
      preflight_checks: buildPreflightChecks(payload),
      identity_lock_count: payload.identity_locks.length,
    },
    submission_contract: {
      method: 'submit_render_job_stub',
      input_artifact_path: payloadPath,
      output_artifact_placeholder: `renders/stub/${payload.gpu_payload_id}.mp4.not_generated`,
      timeout_seconds: Math.ceil(payload.duration_seconds * 30),
      submission_allowed: false,
    },
    local_adapter: {
      adapter_id: `local_gpu_stub_${payload.gpu_payload_id}`,
      runtime_kind: 'local_gpu_stub',
      executable: null,
      status: 'not_wired',
      notes:
        'Future local runtime will load gpu_payload, validate locks, and enqueue frame synthesis without modifying identity anchors.',
    },
    remote_adapter: {
      adapter_id: `remote_api_stub_${payload.gpu_payload_id}`,
      runtime_kind: 'remote_api_stub',
      endpoint: null,
      status: 'not_wired',
      notes:
        'Future remote runtime will accept serialized gpu_payload JSON; no endpoint configured in PHASE-23 design.',
    },
    payload_summary: {
      duration_seconds: payload.duration_seconds,
      fps_target: payload.fps_target,
      resolution: payload.resolution,
      aspect_ratio: payload.aspect_ratio,
      keyframe_count: payload.keyframes.length,
      motion_segment_count: payload.motion_segments.length,
      source_scene_state_id: payload.source_scene_state_id,
    },
    execution_flags: {
      gpu_execution: false,
      preparation_only: true,
      external_call_allowed: false,
    },
    readiness: 'design_only',
    built_at: new Date().toISOString(),
  };
}

export function buildSeedVideoRuntimeInterfaces(projectRoot?: string): VideoRuntimeInterface[] {
  const root = resolveProjectRoot(projectRoot);
  const interfaces: VideoRuntimeInterface[] = [];

  for (const spec of SEED_VIDEO_RUNTIME_SPECS) {
    const payload = loadGpuRenderPayload(root, spec.source_gpu_payload_id);
    if (!payload) {
      throw new Error(`Missing GPU payload: ${spec.source_gpu_payload_id}`);
    }
    interfaces.push(
      buildVideoRuntimeInterface(payload, spec.runtime_interface_id, spec.runtime_target)
    );
  }

  return interfaces;
}

export function loadVideoRuntimeInterface(
  projectRoot: string,
  runtimeInterfaceId: string
): VideoRuntimeInterface | null {
  const registry = readJsonRecord(projectRoot, VIDEO_RUNTIME_REGISTRY_PATH) as {
    runtime_interfaces?: Array<{ runtime_interface_id: string; interface_path: string }>;
  } | null;

  const entry = registry?.runtime_interfaces?.find(
    (i) => i.runtime_interface_id === runtimeInterfaceId
  );
  if (!entry) return null;

  const abs = path.join(resolveProjectRoot(projectRoot), entry.interface_path);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as VideoRuntimeInterface;
}

export function writeVideoRuntimeInterfaces(
  projectRoot: string,
  interfaces: VideoRuntimeInterface[],
  storageDir = 'datasets/video_runtime/interfaces'
): string[] {
  const root = resolveProjectRoot(projectRoot);
  const absDir = path.join(root, storageDir);
  fs.mkdirSync(absDir, { recursive: true });

  const written: string[] = [];
  for (const iface of interfaces) {
    const rel = `${storageDir}/${iface.runtime_interface_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(iface, null, 2)}\n`, 'utf8');
    written.push(rel);
  }
  return written;
}
