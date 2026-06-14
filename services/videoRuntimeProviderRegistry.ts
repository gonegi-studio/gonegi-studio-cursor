import { readJsonRecord } from './auditors/auditorShared.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROVIDER_ABSTRACTION_PHASE =
  'PHASE-25-VIDEO-RUNTIME-PROVIDER-ABSTRACTION-001' as const;
export const PROVIDER_REGISTRY_PATH = 'datasets/video_runtime/provider-registry.json' as const;
export const PROVIDER_SCHEMA_PATH = 'datasets/video_runtime/provider.schema.json' as const;

export type ProviderCapabilities = {
  max_duration_seconds: number;
  max_fps: number;
  max_resolution: string;
  identity_lock_preservation: boolean;
  motion_segment_support: boolean;
  keyframe_interpolation: boolean;
  local_gpu_required?: boolean;
  remote_api?: boolean;
  motion_complexity_tier?: 'low' | 'medium' | 'high';
};

export type VideoRuntimeProvider = {
  provider_id: string;
  phase: typeof PROVIDER_ABSTRACTION_PHASE;
  provider_type: 'local' | 'remote';
  runtime_mode: 'stub' | 'preparation_only';
  status: 'not_wired';
  supported_inputs: string[];
  supported_outputs: string[];
  capabilities: ProviderCapabilities;
  limitations: string[];
  execution_flags: {
    gpu_execution: false;
    preparation_only: true;
    external_call_allowed: false;
  };
  wiring: {
    executable: null;
    endpoint: null;
  };
  notes?: string;
};

export type ProviderRegistry = {
  registry_id: string;
  phase: typeof PROVIDER_ABSTRACTION_PHASE;
  registry_version: string;
  schema_path: string;
  providers: VideoRuntimeProvider[];
};

export type CapabilityValidationResult = {
  provider_id: string;
  valid: boolean;
  issues: string[];
};

function parseResolution(resolution: string): { width: number; height: number } | null {
  const match = /^(\d+)x(\d+)$/.exec(resolution);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

export function loadProviderRegistry(projectRoot?: string): ProviderRegistry | null {
  const record = readJsonRecord(resolveProjectRoot(projectRoot), PROVIDER_REGISTRY_PATH) as
    | ProviderRegistry
    | null;
  if (!record?.providers?.length) return null;
  return record;
}

export function listProviders(projectRoot?: string): VideoRuntimeProvider[] {
  return loadProviderRegistry(projectRoot)?.providers ?? [];
}

export function getProviderById(
  projectRoot: string | undefined,
  providerId: string
): VideoRuntimeProvider | null {
  return listProviders(projectRoot).find((p) => p.provider_id === providerId) ?? null;
}

export function validateProviderCapabilities(
  provider: VideoRuntimeProvider
): CapabilityValidationResult {
  const issues: string[] = [];
  const caps = provider.capabilities;

  if (caps.max_duration_seconds <= 0) {
    issues.push('max_duration_seconds must be positive');
  }
  if (caps.max_fps <= 0) {
    issues.push('max_fps must be positive');
  }
  if (!parseResolution(caps.max_resolution)) {
    issues.push(`invalid max_resolution: ${caps.max_resolution}`);
  }
  if (!provider.supported_inputs.includes('gpu_render_payload_v1')) {
    issues.push('must support gpu_render_payload_v1 input');
  }
  if (!provider.supported_outputs.length) {
    issues.push('supported_outputs must not be empty');
  }
  if (provider.provider_type === 'local' && caps.remote_api === true) {
    issues.push('local provider must not declare remote_api=true');
  }
  if (provider.provider_type === 'remote' && caps.local_gpu_required === true) {
    issues.push('remote provider must not require local_gpu');
  }
  if (!caps.identity_lock_preservation) {
    issues.push('identity_lock_preservation must be true for Gonegi runtime');
  }
  if (provider.status !== 'not_wired') {
    issues.push('provider status must be not_wired in PHASE-25');
  }

  return {
    provider_id: provider.provider_id,
    valid: issues.length === 0,
    issues,
  };
}

export function providerSupportsPayload(
  provider: VideoRuntimeProvider,
  durationSeconds: number,
  fpsTarget: number,
  resolution: string
): boolean {
  const payloadRes = parseResolution(resolution);
  const maxRes = parseResolution(provider.capabilities.max_resolution);
  if (!payloadRes || !maxRes) return false;

  return (
    durationSeconds <= provider.capabilities.max_duration_seconds &&
    fpsTarget <= provider.capabilities.max_fps &&
    payloadRes.width <= maxRes.width &&
    payloadRes.height <= maxRes.height &&
    provider.capabilities.identity_lock_preservation
  );
}

export function buildCapabilityMatrix(
  providers: VideoRuntimeProvider[]
): Record<string, ProviderCapabilities & { provider_type: string; status: string }> {
  const matrix: Record<
    string,
    ProviderCapabilities & { provider_type: string; status: string }
  > = {};

  for (const provider of providers) {
    matrix[provider.provider_id] = {
      ...provider.capabilities,
      provider_type: provider.provider_type,
      status: provider.status,
    };
  }

  return matrix;
}
