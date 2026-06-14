import fs from 'node:fs';
import path from 'node:path';
import {
  RUNTIME_REQUIREMENTS_PATH,
  type LocalMachineSnapshot,
} from './localGpuRuntimePreflight.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const READINESS_LEVELS = Object.freeze([
  'NOT_READY',
  'MINIMAL_READY',
  'RECOMMENDED_READY',
  'PRODUCTION_READY',
] as const);

export type ReadinessLevel = (typeof READINESS_LEVELS)[number];

function parseSemver(version: string): string | null {
  const match = /(\d+\.\d+\.\d+)/.exec(version);
  return match?.[1] ?? null;
}

export function compareSemver(current: string, minimum: string): boolean {
  const cur = parseSemver(current);
  const min = parseSemver(minimum);
  if (!cur || !min) return false;

  const curParts = cur.split('.').map(Number);
  const minParts = min.split('.').map(Number);

  for (let i = 0; i < 3; i += 1) {
    const c = curParts[i] ?? 0;
    const m = minParts[i] ?? 0;
    if (c > m) return true;
    if (c < m) return false;
  }
  return true;
}

export function loadRuntimeRequirements(projectRoot?: string): {
  profiles: Record<string, RuntimeProfile>;
} | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, RUNTIME_REQUIREMENTS_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    profiles: Record<string, RuntimeProfile>;
  };
}

export type ProfileEvaluation = {
  profile: string;
  met: boolean;
  gaps: string[];
};

export type ReadinessEvaluation = {
  readiness_level: ReadinessLevel;
  profile_evaluations: ProfileEvaluation[];
  upgrade_recommendations: string[];
};

type RuntimeProfile = {
  label: string;
  description: string;
  vram_gb_min: number;
  ram_gb_min: number;
  storage_free_gb_min: number;
  gpu_required: boolean;
  node_version_min: string;
  python_version_min: string;
  git_required: boolean;
  supported_providers: string[];
};

function evaluateProfile(
  snapshot: LocalMachineSnapshot,
  profile: RuntimeProfile
): ProfileEvaluation {
  const gaps: string[] = [];

  if (profile.gpu_required && !snapshot.gpu.detected) {
    gaps.push('GPU not detected');
  }
  if (snapshot.gpu.vram_gb < profile.vram_gb_min) {
    gaps.push(
      `VRAM ${snapshot.gpu.vram_gb}GB below ${profile.label} minimum ${profile.vram_gb_min}GB`
    );
  }
  if (snapshot.ram_gb < profile.ram_gb_min) {
    gaps.push(`RAM ${snapshot.ram_gb}GB below ${profile.label} minimum ${profile.ram_gb_min}GB`);
  }
  if (snapshot.storage.storage_free_gb < profile.storage_free_gb_min) {
    gaps.push(
      `Storage ${snapshot.storage.storage_free_gb}GB free below ${profile.label} minimum ${profile.storage_free_gb_min}GB`
    );
  }
  if (!compareSemver(snapshot.runtime_versions.node_version, profile.node_version_min)) {
    gaps.push(
      `Node ${snapshot.runtime_versions.node_version} below minimum ${profile.node_version_min}`
    );
  }
  if (
    !snapshot.runtime_versions.python_version ||
    !compareSemver(snapshot.runtime_versions.python_version, profile.python_version_min)
  ) {
    gaps.push(
      snapshot.runtime_versions.python_version
        ? `Python ${snapshot.runtime_versions.python_version} below minimum ${profile.python_version_min}`
        : 'Python not detected'
    );
  }
  if (profile.git_required && !snapshot.runtime_versions.git_version) {
    gaps.push('Git not detected');
  }

  return {
    profile: profile.label,
    met: gaps.length === 0,
    gaps,
  };
}

function buildUpgradeRecommendations(
  snapshot: LocalMachineSnapshot,
  profileEvaluations: ProfileEvaluation[],
  targetLevel: ReadinessLevel
): string[] {
  const recommendations: string[] = [];

  if (!snapshot.gpu.detected) {
    recommendations.push(
      'Install or expose an NVIDIA GPU with a current driver; verify with nvidia-smi (read-only).'
    );
  }

  const recommended = profileEvaluations.find((p) => p.profile === 'recommended');
  const production = profileEvaluations.find((p) => p.profile === 'production');

  if (targetLevel === 'NOT_READY' || targetLevel === 'MINIMAL_READY') {
    for (const gap of recommended?.gaps ?? []) {
      if (gap.includes('VRAM')) {
        recommendations.push('Upgrade GPU VRAM to at least 16GB for ComfyUI/Wan comfort.');
      }
      if (gap.includes('RAM')) {
        recommendations.push('Increase system RAM to 32GB for recommended local video runtime.');
      }
      if (gap.includes('Storage')) {
        recommendations.push('Free at least 100GB on the project drive for model caches and outputs.');
      }
    }
  }

  if (targetLevel !== 'PRODUCTION_READY') {
    for (const gap of production?.gaps ?? []) {
      if (gap.includes('VRAM')) {
        recommendations.push('Target 24GB+ VRAM for production-grade Hunyuan/Wan batch workflows.');
      }
      if (gap.includes('RAM')) {
        recommendations.push('Target 64GB RAM for production local GPU orchestration.');
      }
    }
  }

  if (!snapshot.runtime_versions.python_version) {
    recommendations.push('Install Python 3.11+ for future ComfyUI/Wan provider wiring.');
  }
  if (!snapshot.runtime_versions.git_version) {
    recommendations.push('Install Git for provider workflow checkout and version pinning.');
  }

  return [...new Set(recommendations)];
}

export function evaluateRuntimeReadiness(
  snapshot: LocalMachineSnapshot,
  projectRoot?: string
): ReadinessEvaluation {
  const requirements = loadRuntimeRequirements(projectRoot);
  const profileOrder = ['minimal', 'recommended', 'production'] as const;

  const profile_evaluations: ProfileEvaluation[] = [];
  if (requirements?.profiles) {
    for (const key of profileOrder) {
      const profile = requirements.profiles[key];
      if (profile) {
        profile_evaluations.push(evaluateProfile(snapshot, profile));
      }
    }
  }

  let readiness_level: ReadinessLevel = 'NOT_READY';
  const minimal = profile_evaluations.find((p) => p.profile === 'minimal');
  const recommended = profile_evaluations.find((p) => p.profile === 'recommended');
  const production = profile_evaluations.find((p) => p.profile === 'production');

  if (production?.met) {
    readiness_level = 'PRODUCTION_READY';
  } else if (recommended?.met) {
    readiness_level = 'RECOMMENDED_READY';
  } else if (minimal?.met) {
    readiness_level = 'MINIMAL_READY';
  }

  const upgrade_recommendations = buildUpgradeRecommendations(
    snapshot,
    profile_evaluations,
    readiness_level
  );

  return {
    readiness_level,
    profile_evaluations,
    upgrade_recommendations,
  };
}
