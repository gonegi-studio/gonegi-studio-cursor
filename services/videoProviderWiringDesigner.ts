import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import {
  PREFLIGHT_REPORT_PATH,
  type LocalGpuPreflightReport,
} from './localGpuRuntimePreflight.js';
import { loadRuntimeRequirements } from './runtimeReadinessEvaluator.js';
import type { ReadinessLevel } from './runtimeReadinessEvaluator.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  getProviderById,
  type VideoRuntimeProvider,
} from './videoRuntimeProviderRegistry.js';

export const WIRING_DESIGN_PHASE = 'PHASE-27-VIDEO-PROVIDER-WIRING-DESIGN-001' as const;
export const WIRING_REGISTRY_PATH = 'datasets/video_runtime/provider-wiring-registry.json' as const;
export const WIRING_SCHEMA_PATH = 'datasets/video_runtime/provider-wiring.schema.json' as const;

export const SEED_WIRING_SPECS = Object.freeze([
  {
    wiring_id: 'wiring_local_comfyui_design_v1',
    provider_id: 'provider_stub_local_comfyui',
    wiring_mode: 'local_comfyui' as const,
    runtime_target: 'local' as const,
    readiness_profile_min: 'recommended' as const,
  },
  {
    wiring_id: 'wiring_local_wan_design_v1',
    provider_id: 'provider_stub_local_wan',
    wiring_mode: 'local_wan' as const,
    runtime_target: 'local' as const,
    readiness_profile_min: 'recommended' as const,
  },
  {
    wiring_id: 'wiring_local_animatediff_design_v1',
    provider_id: 'provider_stub_local_animatediff',
    wiring_mode: 'local_animatediff' as const,
    runtime_target: 'local' as const,
    readiness_profile_min: 'minimal' as const,
  },
  {
    wiring_id: 'wiring_remote_gpu_design_v1',
    provider_id: 'provider_stub_remote_api',
    wiring_mode: 'remote_gpu_rental' as const,
    runtime_target: 'remote' as const,
    readiness_profile_min: 'none' as const,
  },
  {
    wiring_id: 'wiring_remote_api_design_v1',
    provider_id: 'provider_stub_remote_api',
    wiring_mode: 'remote_api' as const,
    runtime_target: 'remote' as const,
    readiness_profile_min: 'none' as const,
  },
] as const);

export type WiringMode = (typeof SEED_WIRING_SPECS)[number]['wiring_mode'];

export type ProviderWiringDesign = {
  wiring_id: string;
  phase: typeof WIRING_DESIGN_PHASE;
  provider_id: string;
  wiring_mode: WiringMode;
  runtime_target: 'local' | 'remote';
  required_environment: {
    readiness_profile_min: 'minimal' | 'recommended' | 'production' | 'none';
    gpu_required: boolean;
    network_required: boolean;
    python_min: string;
    node_min: string;
    vram_gb_min: number;
  };
  input_contract: {
    gpu_render_payload_path: string;
    video_runtime_interface_path: string;
    provider_id: string;
    contract_version: 'video-provider-input-v1';
  };
  output_contract: {
    video_job_request_stub: string;
    expected_artifact_stub: string;
    contract_version: 'video-provider-output-v1';
  };
  safety_contract: {
    gpu_execution: false;
    external_call_allowed: false;
    activation_status: 'design_only';
    executable: null;
    endpoint: null;
    local_execution_blocked: boolean;
  };
  activation_status: 'design_only';
  execution_status: 'blocked_for_execution' | 'design_only_possible';
  machine_readiness_gate: string;
  notes: string;
  built_at: string;
};

export type ReadinessAwareRecommendation = {
  machine_readiness: ReadinessLevel;
  local_providers_status: 'blocked_for_execution' | 'design_only_possible';
  remote_providers_status: 'design_only_possible';
  recommended_future_path: string;
};

function loadPreflightReport(projectRoot: string): LocalGpuPreflightReport | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, PREFLIGHT_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as LocalGpuPreflightReport;
}

function localExecutionBlocked(readinessLevel: ReadinessLevel): boolean {
  return readinessLevel === 'NOT_READY';
}

function resolveExecutionStatus(
  runtimeTarget: 'local' | 'remote',
  readinessLevel: ReadinessLevel
): ProviderWiringDesign['execution_status'] {
  if (runtimeTarget === 'remote') return 'design_only_possible';
  return localExecutionBlocked(readinessLevel)
    ? 'blocked_for_execution'
    : 'design_only_possible';
}

function buildRequiredEnvironment(
  spec: (typeof SEED_WIRING_SPECS)[number],
  projectRoot: string
): ProviderWiringDesign['required_environment'] {
  const requirements = loadRuntimeRequirements(projectRoot);
  const profileKey =
    spec.readiness_profile_min === 'none' ? 'minimal' : spec.readiness_profile_min;
  const profile = requirements?.profiles?.[profileKey];

  return {
    readiness_profile_min: spec.readiness_profile_min,
    gpu_required: spec.runtime_target === 'local',
    network_required: spec.runtime_target === 'remote',
    python_min: profile?.python_version_min ?? '3.10.0',
    node_min: profile?.node_version_min ?? '18.0.0',
    vram_gb_min: profile?.vram_gb_min ?? 0,
  };
}

function buildOutputStub(
  wiringId: string,
  provider: VideoRuntimeProvider,
  wiringMode: WiringMode
): ProviderWiringDesign['output_contract'] {
  const suffix = wiringMode.replace(/_/g, '-');
  return {
    video_job_request_stub: `job_requests/stub/${wiringId}_${suffix}.request.json.not_submitted`,
    expected_artifact_stub: `renders/stub/${provider.provider_id}_${suffix}.mp4.not_generated`,
    contract_version: 'video-provider-output-v1',
  };
}

export function buildReadinessAwareRecommendation(
  readinessLevel: ReadinessLevel
): ReadinessAwareRecommendation {
  const blocked = localExecutionBlocked(readinessLevel);

  return {
    machine_readiness: readinessLevel,
    local_providers_status: blocked ? 'blocked_for_execution' : 'design_only_possible',
    remote_providers_status: 'design_only_possible',
    recommended_future_path: blocked
      ? 'remote GPU rental or future upgraded local GPU (16GB+ VRAM recommended)'
      : 'local provider wiring can proceed to PHASE-28 remote/local selection',
  };
}

export function buildProviderWiringDesign(
  projectRoot: string,
  spec: (typeof SEED_WIRING_SPECS)[number],
  readinessLevel: ReadinessLevel
): ProviderWiringDesign {
  const provider = getProviderById(projectRoot, spec.provider_id);
  if (!provider) {
    throw new Error(`Missing provider: ${spec.provider_id}`);
  }

  const blocked = spec.runtime_target === 'local' && localExecutionBlocked(readinessLevel);

  return {
    wiring_id: spec.wiring_id,
    phase: WIRING_DESIGN_PHASE,
    provider_id: spec.provider_id,
    wiring_mode: spec.wiring_mode,
    runtime_target: spec.runtime_target,
    required_environment: buildRequiredEnvironment(spec, projectRoot),
    input_contract: {
      gpu_render_payload_path: 'datasets/gpu_payload/payloads/{gpu_payload_id}.json',
      video_runtime_interface_path: 'datasets/video_runtime/interfaces/{runtime_interface_id}.json',
      provider_id: spec.provider_id,
      contract_version: 'video-provider-input-v1',
    },
    output_contract: buildOutputStub(spec.wiring_id, provider, spec.wiring_mode),
    safety_contract: {
      gpu_execution: false,
      external_call_allowed: false,
      activation_status: 'design_only',
      executable: null,
      endpoint: null,
      local_execution_blocked: blocked,
    },
    activation_status: 'design_only',
    execution_status: resolveExecutionStatus(spec.runtime_target, readinessLevel),
    machine_readiness_gate: `requires_${readinessLevel}_or_higher_for_local_activation`,
    notes:
      spec.runtime_target === 'local'
        ? `Local ${spec.wiring_mode} wiring design — activation blocked when machine is NOT_READY.`
        : `Remote ${spec.wiring_mode} wiring design — design-only until PHASE-28 provider selection.`,
    built_at: new Date().toISOString(),
  };
}

export function buildSeedWiringDesigns(projectRoot?: string): {
  designs: ProviderWiringDesign[];
  recommendation: ReadinessAwareRecommendation;
  preflight: LocalGpuPreflightReport | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const preflight = loadPreflightReport(root);
  const readinessLevel = preflight?.readiness_level ?? 'NOT_READY';
  const recommendation = buildReadinessAwareRecommendation(readinessLevel);

  const designs = SEED_WIRING_SPECS.map((spec) =>
    buildProviderWiringDesign(root, spec, readinessLevel)
  );

  return { designs, recommendation, preflight };
}

export function writeWiringDesigns(
  projectRoot: string,
  designs: ProviderWiringDesign[],
  storageDir = 'datasets/video_runtime/wiring-designs'
): string[] {
  const root = resolveProjectRoot(projectRoot);
  const absDir = path.join(root, storageDir);
  fs.mkdirSync(absDir, { recursive: true });

  const written: string[] = [];
  for (const design of designs) {
    const rel = `${storageDir}/${design.wiring_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(design, null, 2)}\n`, 'utf8');
    written.push(rel);
  }
  return written;
}

export function loadWiringRegistry(projectRoot?: string) {
  return readJsonRecord(resolveProjectRoot(projectRoot), WIRING_REGISTRY_PATH);
}
