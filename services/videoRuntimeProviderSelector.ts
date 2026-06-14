import type { GpuRenderPayload } from './gpuRenderPayloadBuilder.js';
import {
  listProviders,
  providerSupportsPayload,
  type VideoRuntimeProvider,
} from './videoRuntimeProviderRegistry.js';
import type { VideoRuntimeInterface } from './videoRuntimeInterfaceBuilder.js';

export type ProviderSelectionCriteria = {
  duration_seconds: number;
  fps_target: number;
  resolution: string;
  motion_segment_count: number;
  keyframe_count: number;
  identity_lock_count: number;
  runtime_target: VideoRuntimeInterface['runtime_target'];
  preparation_only: boolean;
};

export type ProviderSelectionResult = {
  gpu_payload_id: string;
  runtime_interface_id: string;
  recommended_provider_id: string;
  recommended_provider_type: 'local' | 'remote';
  candidate_scores: Array<{
    provider_id: string;
    score: number;
    eligible: boolean;
    rationale: string[];
  }>;
  selection_rationale: string[];
};

function motionComplexityTier(segmentCount: number, keyframeCount: number): 'low' | 'medium' | 'high' {
  const score = segmentCount + keyframeCount;
  if (score <= 5) return 'low';
  if (score <= 7) return 'medium';
  return 'high';
}

function preferLocal(runtimeTarget: VideoRuntimeInterface['runtime_target']): boolean {
  return runtimeTarget === 'local_stub' || runtimeTarget === 'deferred';
}

function scoreProvider(
  provider: VideoRuntimeProvider,
  criteria: ProviderSelectionCriteria
): { score: number; eligible: boolean; rationale: string[] } {
  const rationale: string[] = [];
  const eligible = providerSupportsPayload(
    provider,
    criteria.duration_seconds,
    criteria.fps_target,
    criteria.resolution
  );

  if (!eligible) {
    rationale.push('payload exceeds provider capability limits');
    return { score: -1, eligible: false, rationale };
  }

  if (!provider.capabilities.motion_segment_support && criteria.motion_segment_count > 0) {
    rationale.push('provider lacks motion_segment_support');
    return { score: -1, eligible: false, rationale };
  }

  if (criteria.preparation_only && !provider.execution_flags.preparation_only) {
    rationale.push('preparation_only safety required');
    return { score: -1, eligible: false, rationale };
  }

  let score = 0;
  const complexity = motionComplexityTier(
    criteria.motion_segment_count,
    criteria.keyframe_count
  );

  if (provider.capabilities.motion_complexity_tier === complexity) {
    score += 30;
    rationale.push(`motion_complexity_tier match: ${complexity}`);
  } else if (
    provider.capabilities.motion_complexity_tier === 'high' &&
    complexity !== 'low'
  ) {
    score += 15;
    rationale.push('high-tier provider acceptable for medium complexity');
  }

  const durationHeadroom =
    provider.capabilities.max_duration_seconds - criteria.duration_seconds;
  const headroomScore = Math.min(16, durationHeadroom * 2);
  const overProvisionPenalty = durationHeadroom > 6 ? (durationHeadroom - 6) * 3 : 0;
  score += headroomScore - overProvisionPenalty;
  rationale.push(
    `duration headroom: ${durationHeadroom}s (score ${headroomScore - overProvisionPenalty})`
  );

  if (criteria.identity_lock_count >= 4 && provider.capabilities.identity_lock_preservation) {
    score += 10;
    rationale.push('identity lock preservation required');
  }

  if (preferLocal(criteria.runtime_target) && provider.provider_type === 'local') {
    score += 25;
    rationale.push('local preference from runtime_target');
  } else if (criteria.runtime_target === 'remote_stub' && provider.provider_type === 'remote') {
    score += 25;
    rationale.push('remote preference from runtime_target');
  } else if (criteria.runtime_target === 'deferred' && provider.provider_type === 'local') {
    score += 15;
    rationale.push('deferred target defaults to local candidate');
  }

  if (provider.capabilities.keyframe_interpolation && criteria.keyframe_count >= 3) {
    score += 10;
    rationale.push('keyframe interpolation valuable');
  }

  if (provider.execution_flags.gpu_execution === false) {
    score += 5;
    rationale.push('gpu_execution=false safety');
  }

  return { score, eligible: true, rationale };
}

export function buildSelectionCriteria(
  payload: GpuRenderPayload,
  iface: VideoRuntimeInterface
): ProviderSelectionCriteria {
  return {
    duration_seconds: payload.duration_seconds,
    fps_target: payload.fps_target,
    resolution: payload.resolution,
    motion_segment_count: payload.motion_segments.length,
    keyframe_count: payload.keyframes.length,
    identity_lock_count: payload.identity_locks.length,
    runtime_target: iface.runtime_target,
    preparation_only: iface.execution_flags.preparation_only,
  };
}

export function selectProviderCandidate(
  projectRoot: string | undefined,
  payload: GpuRenderPayload,
  iface: VideoRuntimeInterface
): ProviderSelectionResult {
  const criteria = buildSelectionCriteria(payload, iface);
  const providers = listProviders(projectRoot);

  const candidate_scores = providers.map((provider) => {
    const result = scoreProvider(provider, criteria);
    return {
      provider_id: provider.provider_id,
      score: result.score,
      eligible: result.eligible,
      rationale: result.rationale,
    };
  });

  const eligible = candidate_scores.filter((c) => c.eligible && c.score >= 0);
  eligible.sort((a, b) => b.score - a.score);

  const winner = eligible[0];
  const recommended = getProviderByIdFromList(providers, winner?.provider_id);

  const selection_rationale = winner
    ? [
        `Selected ${winner.provider_id} with score ${winner.score}`,
        `duration=${criteria.duration_seconds}s fps=${criteria.fps_target} resolution=${criteria.resolution}`,
        `motion_segments=${criteria.motion_segment_count} keyframes=${criteria.keyframe_count}`,
        `identity_locks=${criteria.identity_lock_count} runtime_target=${criteria.runtime_target}`,
        ...winner.rationale,
      ]
    : ['No eligible provider candidate found'];

  return {
    gpu_payload_id: payload.gpu_payload_id,
    runtime_interface_id: iface.runtime_interface_id,
    recommended_provider_id: recommended?.provider_id ?? 'none',
    recommended_provider_type: recommended?.provider_type ?? 'local',
    candidate_scores,
    selection_rationale,
  };
}

function getProviderByIdFromList(
  providers: VideoRuntimeProvider[],
  providerId?: string
): VideoRuntimeProvider | null {
  if (!providerId) return null;
  return providers.find((p) => p.provider_id === providerId) ?? null;
}

export function selectProvidersForSeedPayloads(
  projectRoot: string | undefined,
  pairs: Array<{ payload: GpuRenderPayload; iface: VideoRuntimeInterface }>
): ProviderSelectionResult[] {
  return pairs.map(({ payload, iface }) =>
    selectProviderCandidate(projectRoot, payload, iface)
  );
}
