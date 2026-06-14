import fs from 'node:fs';
import path from 'node:path';
import {
  GONEGI_GPU_PAYLOAD_REGISTRY_PATH,
  GONEGI_GPU_PAYLOAD_SCHEMA_PATH,
  GONEGI_GPU_PAYLOADS_DIR,
  type GonegiGpuPayload,
  loadGonegiGpuPayload,
} from './gonegiMotionToGpuPayloadCompiler.js';
import { PROVIDER_REGISTRY_PATH } from './videoRuntimeProviderRegistry.js';
import { VIDEO_RUNTIME_SCHEMA_PATH } from './videoRuntimeInterfaceValidator.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RUNTIME_INTERFACE_COMPILER_PHASE =
  'PHASE-SOURCE-VIDEO-018-GONEGI_GPU_PAYLOAD_TO_RUNTIME_INTERFACE_V2' as const;
export const GONEGI_RUNTIME_INTERFACE_SCHEMA_PATH =
  'datasets/gonegi_runtime_interface/gonegi-runtime-interface.schema.json' as const;
export const GONEGI_RUNTIME_INTERFACE_REGISTRY_PATH =
  'datasets/gonegi_runtime_interface/gonegi-runtime-interface-registry.json' as const;
export const GONEGI_RUNTIME_INTERFACES_DIR =
  'datasets/gonegi_runtime_interface/interfaces' as const;
export const PROVIDER_WIRING_REGISTRY_PATH =
  'datasets/video_runtime/provider-wiring-registry.json' as const;

export const RUNTIME_TARGETS = Object.freeze(['local_stub', 'remote_stub', 'deferred'] as const);
export type RuntimeTarget = (typeof RUNTIME_TARGETS)[number];

export const SEED_GONEGI_RUNTIME_INTERFACE_SPECS = Object.freeze([
  {
    gonegi_runtime_interface_id: 'gonegi_runtime_ghibli_kitchen_v1',
    source_gpu_payload_id: 'gonegi_gpu_payload_ghibli_kitchen_v1',
  },
  {
    gonegi_runtime_interface_id: 'gonegi_runtime_shinkai_sky_light_v1',
    source_gpu_payload_id: 'gonegi_gpu_payload_shinkai_sky_light_v1',
  },
  {
    gonegi_runtime_interface_id: 'gonegi_runtime_live_action_dialogue_v1',
    source_gpu_payload_id: 'gonegi_gpu_payload_live_action_dialogue_v1',
  },
  {
    gonegi_runtime_interface_id: 'gonegi_runtime_mori_emotion_flow_v1',
    source_gpu_payload_id: 'gonegi_gpu_payload_mori_emotion_flow_v1',
  },
] as const);

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  external_call_allowed: false as const,
  provider_activation: false as const,
  preparation_only: true as const,
  frame_extraction: false as const,
  ocr: false as const,
  generation: false as const,
};

type ProviderRegistryEntry = {
  provider_id: string;
  capabilities?: { max_duration_seconds?: number };
};

type ProviderWiringEntry = {
  wiring_id: string;
  provider_id: string;
};

export type GonegiRuntimeInterface = {
  gonegi_runtime_interface_id: string;
  phase: typeof RUNTIME_INTERFACE_COMPILER_PHASE;
  source_gpu_payload_id: string;
  runtime_target: RuntimeTarget;
  provider_hint: {
    recommended_provider_id: string;
    mapped_provider_id: string;
    wiring_id: string;
    provider_activation: false;
    runtime_target: RuntimeTarget;
    selection_basis: string;
  };
  input_contract: {
    artifact_type: 'gonegi_gpu_payload';
    artifact_path: string;
    payload_schema: typeof GONEGI_GPU_PAYLOAD_SCHEMA_PATH;
    required_fields: string[];
    submission_allowed: false;
  };
  output_contract: {
    artifact_type: 'video_render_placeholder';
    output_path: string;
    format: 'mp4_placeholder';
    generation_allowed: false;
  };
  handshake_contract: {
    payload_schema_version: string;
    reference_runtime_schema: typeof VIDEO_RUNTIME_SCHEMA_PATH;
    preflight_checks: string[];
    identity_lock_count: number;
  };
  identity_lock_contract: {
    identity_locks: string[];
    lock_count: number;
    preservation_required: true;
  };
  continuity_lock_contract: {
    identity_locks: string[];
    location_locks: string[];
    composition_locks: string[];
  };
  execution_flags: typeof EXECUTION_FLAGS;
  readiness_status: 'design_only_not_wired';
  production_status: {
    isolated: true;
    storage_domain: 'gonegi_runtime_interface';
    production_registry: false;
    draft_status: 'gonegi_runtime_interface_compiled_v1';
  };
  compiled_at: string;
};

function loadProviderRegistry(projectRoot: string): ProviderRegistryEntry[] {
  const abs = path.join(projectRoot, PROVIDER_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return [];
  const registry = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    providers?: ProviderRegistryEntry[];
  };
  return registry.providers ?? [];
}

function loadProviderWiringRegistry(projectRoot: string): ProviderWiringEntry[] {
  const abs = path.join(projectRoot, PROVIDER_WIRING_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return [];
  const registry = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    wiring_designs?: ProviderWiringEntry[];
  };
  return registry.wiring_designs ?? [];
}

function mapProvider(
  payload: GonegiGpuPayload,
  providers: ProviderRegistryEntry[],
  wiring: ProviderWiringEntry[]
): { mapped_provider_id: string; wiring_id: string } {
  const candidates: Array<{ provider_id: string; wiring_id: string }> = [
    { provider_id: 'provider_stub_local_animatediff', wiring_id: 'wiring_local_animatediff_design_v1' },
    { provider_id: 'provider_stub_local_wan', wiring_id: 'wiring_local_wan_design_v1' },
    { provider_id: 'provider_stub_remote_api', wiring_id: 'wiring_remote_gpu_design_v1' },
  ];

  const providerIds = new Set(providers.map((p) => p.provider_id));
  const wiringByProvider = new Map(wiring.map((w) => [w.provider_id, w.wiring_id]));

  for (const candidate of candidates) {
    if (!providerIds.has(candidate.provider_id)) continue;
    const provider = providers.find((p) => p.provider_id === candidate.provider_id);
    const maxDuration = provider?.capabilities?.max_duration_seconds ?? 0;
    if (payload.duration_seconds <= maxDuration) {
      const wiringId = wiringByProvider.get(candidate.provider_id) ?? candidate.wiring_id;
      return { mapped_provider_id: candidate.provider_id, wiring_id: wiringId };
    }
  }

  const fallback = candidates[candidates.length - 1];
  const wiringId = wiringByProvider.get(fallback.provider_id) ?? fallback.wiring_id;
  return { mapped_provider_id: fallback.provider_id, wiring_id: wiringId };
}

function buildPreflightChecks(payload: GonegiGpuPayload): string[] {
  return [
    'verify:gonegi-motion-to-gpu-payload',
    'identity_locks_present',
    'continuity_locks_present',
    'motion_segments_aligned_with_keyframes',
    `duration_seconds:${payload.duration_seconds}`,
    `fps_target:${payload.fps_target}`,
    'execution_flags.gpu_execution=false',
    'execution_flags.external_call_allowed=false',
    'execution_flags.provider_activation=false',
    `complexity_score:${payload.keyframes.length + payload.motion_segments.length}`,
  ];
}

export function compileGonegiRuntimeInterface(
  payload: GonegiGpuPayload,
  spec: (typeof SEED_GONEGI_RUNTIME_INTERFACE_SPECS)[number],
  providers: ProviderRegistryEntry[],
  wiring: ProviderWiringEntry[]
): GonegiRuntimeInterface {
  const payloadPath = `${GONEGI_GPU_PAYLOADS_DIR}/${payload.gonegi_gpu_payload_id}.json`;
  const runtimeTarget = payload.provider_hint.runtime_target as RuntimeTarget;
  const { mapped_provider_id, wiring_id } = mapProvider(payload, providers, wiring);

  return {
    gonegi_runtime_interface_id: spec.gonegi_runtime_interface_id,
    phase: RUNTIME_INTERFACE_COMPILER_PHASE,
    source_gpu_payload_id: payload.gonegi_gpu_payload_id,
    runtime_target: runtimeTarget,
    provider_hint: {
      recommended_provider_id: payload.provider_hint.recommended_provider_id,
      mapped_provider_id,
      wiring_id,
      provider_activation: false,
      runtime_target: runtimeTarget,
      selection_basis: payload.provider_hint.selection_basis,
    },
    input_contract: {
      artifact_type: 'gonegi_gpu_payload',
      artifact_path: payloadPath,
      payload_schema: GONEGI_GPU_PAYLOAD_SCHEMA_PATH,
      required_fields: [
        'gonegi_gpu_payload_id',
        'duration_seconds',
        'fps_target',
        'identity_locks',
        'continuity_locks',
        'keyframes',
        'motion_segments',
        'execution_flags',
      ],
      submission_allowed: false,
    },
    output_contract: {
      artifact_type: 'video_render_placeholder',
      output_path: `renders/gonegi_stub/${payload.gonegi_gpu_payload_id}.mp4.not_generated`,
      format: 'mp4_placeholder',
      generation_allowed: false,
    },
    handshake_contract: {
      payload_schema_version: 'gonegi-gpu-payload-v1',
      reference_runtime_schema: VIDEO_RUNTIME_SCHEMA_PATH,
      preflight_checks: buildPreflightChecks(payload),
      identity_lock_count: payload.identity_locks.length,
    },
    identity_lock_contract: {
      identity_locks: [...payload.identity_locks],
      lock_count: payload.identity_locks.length,
      preservation_required: true,
    },
    continuity_lock_contract: {
      identity_locks: [...payload.continuity_locks.identity_locks],
      location_locks: [...payload.continuity_locks.location_locks],
      composition_locks: [...(payload.continuity_locks.composition_locks ?? [])],
    },
    execution_flags: { ...EXECUTION_FLAGS },
    readiness_status: 'design_only_not_wired',
    production_status: {
      isolated: true,
      storage_domain: 'gonegi_runtime_interface',
      production_registry: false,
      draft_status: 'gonegi_runtime_interface_compiled_v1',
    },
    compiled_at: new Date().toISOString(),
  };
}

export function compileAllGonegiRuntimeInterfaces(projectRoot?: string): GonegiRuntimeInterface[] {
  const root = resolveProjectRoot(projectRoot);

  if (!fs.existsSync(path.join(root, GONEGI_GPU_PAYLOAD_REGISTRY_PATH))) {
    throw new Error(`Missing gonegi gpu payload registry: ${GONEGI_GPU_PAYLOAD_REGISTRY_PATH}`);
  }
  if (!fs.existsSync(path.join(root, VIDEO_RUNTIME_SCHEMA_PATH))) {
    throw new Error(`Missing reference runtime schema: ${VIDEO_RUNTIME_SCHEMA_PATH}`);
  }
  if (!fs.existsSync(path.join(root, PROVIDER_REGISTRY_PATH))) {
    throw new Error(`Missing provider registry: ${PROVIDER_REGISTRY_PATH}`);
  }
  if (!fs.existsSync(path.join(root, PROVIDER_WIRING_REGISTRY_PATH))) {
    throw new Error(`Missing provider wiring registry: ${PROVIDER_WIRING_REGISTRY_PATH}`);
  }

  const providers = loadProviderRegistry(root);
  const wiring = loadProviderWiringRegistry(root);
  const interfaces: GonegiRuntimeInterface[] = [];

  for (const spec of SEED_GONEGI_RUNTIME_INTERFACE_SPECS) {
    const payload = loadGonegiGpuPayload(root, spec.source_gpu_payload_id);
    if (!payload) {
      throw new Error(`Missing gonegi gpu payload: ${spec.source_gpu_payload_id}`);
    }
    interfaces.push(compileGonegiRuntimeInterface(payload, spec, providers, wiring));
  }

  return interfaces;
}

export function writeGonegiRuntimeInterfaces(projectRoot?: string): {
  interfaces: GonegiRuntimeInterface[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const interfaces = compileAllGonegiRuntimeInterfaces(root);
  const outDir = path.join(root, GONEGI_RUNTIME_INTERFACES_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const iface of interfaces) {
    const rel = `${GONEGI_RUNTIME_INTERFACES_DIR}/${iface.gonegi_runtime_interface_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(iface, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  return { interfaces, written };
}

export function loadGonegiRuntimeInterface(
  projectRoot: string,
  gonegiRuntimeInterfaceId: string
): GonegiRuntimeInterface | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, GONEGI_RUNTIME_INTERFACES_DIR, `${gonegiRuntimeInterfaceId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as GonegiRuntimeInterface;
}
