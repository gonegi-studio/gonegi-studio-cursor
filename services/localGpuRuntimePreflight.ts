import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  evaluateRuntimeReadiness,
  READINESS_LEVELS,
  type ReadinessEvaluation,
  type ReadinessLevel,
} from './runtimeReadinessEvaluator.js';
import {
  PROVIDER_PASS_VERDICT,
  PROVIDER_REPORT_PATH,
} from './videoRuntimeProviderValidator.js';

export const PREFLIGHT_PHASE = 'PHASE-26-LOCAL-GPU-RUNTIME-PREFLIGHT-001' as const;
export const RUNTIME_REQUIREMENTS_PATH = 'datasets/video_runtime/runtime-requirements.json' as const;
export const PREFLIGHT_REPORT_PATH = 'reports/local-gpu-runtime-preflight-report.json' as const;
export const PREFLIGHT_MD_PATH = 'reports/LOCAL_GPU_RUNTIME_PREFLIGHT.md' as const;
export const PREFLIGHT_PASS_VERDICT = 'PASS_LOCAL_GPU_RUNTIME_PREFLIGHT_V1' as const;
export const PREFLIGHT_FAIL_VERDICT = 'FAIL_LOCAL_GPU_RUNTIME_PREFLIGHT_V1' as const;

export type GpuInfo = {
  detected: boolean;
  gpu_model: string;
  vram_gb: number;
  vram_free_gb: number | null;
  driver_note: string;
};

export type LocalMachineSnapshot = {
  os: {
    platform: string;
    release: string;
    arch: string;
    hostname: string;
  };
  cpu: {
    model: string;
    cores: number;
    logical_processors: number;
  };
  ram_gb: number;
  ram_free_gb: number;
  gpu: GpuInfo;
  storage: {
    project_root: string;
    storage_free_gb: number;
    storage_total_gb: number;
  };
  runtime_versions: {
    node_version: string;
    python_version: string | null;
    git_version: string | null;
  };
  collected_at: string;
  inspection_only: true;
  gpu_execution: false;
};

function runCommand(command: string, args: string[]): { ok: boolean; stdout: string } {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 10_000,
  });
  const stdout = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  return { ok: result.status === 0 && stdout.length > 0, stdout };
}

function collectPythonVersion(): string | null {
  for (const cmd of ['python', 'python3', 'py']) {
    const args = cmd === 'py' ? ['-3', '--version'] : ['--version'];
    const result = runCommand(cmd, args);
    if (result.ok) return result.stdout;
  }
  return null;
}

function collectGitVersion(): string | null {
  const result = runCommand('git', ['--version']);
  return result.ok ? result.stdout : null;
}

function bytesToGb(bytes: number): number {
  return Math.round((bytes / 1024 ** 3) * 100) / 100;
}

function collectStorage(projectRoot: string): LocalMachineSnapshot['storage'] {
  const root = resolveProjectRoot(projectRoot);
  try {
    const stat = fs.statfsSync(root);
    const freeBytes = stat.bfree * stat.bsize;
    const totalBytes = stat.blocks * stat.bsize;
    return {
      project_root: root,
      storage_free_gb: bytesToGb(freeBytes),
      storage_total_gb: bytesToGb(totalBytes),
    };
  } catch {
    return {
      project_root: root,
      storage_free_gb: 0,
      storage_total_gb: 0,
    };
  }
}

function collectNvidiaGpu(): GpuInfo | null {
  const result = runCommand('nvidia-smi', [
    '--query-gpu=name,memory.total,memory.free',
    '--format=csv,noheader,nounits',
  ]);

  if (!result.ok) return null;

  const line = result.stdout.split('\n')[0]?.trim();
  if (!line) return null;

  const parts = line.split(',').map((p) => p.trim());
  if (parts.length < 3) return null;

  const vramMb = Number(parts[1]);
  const vramFreeMb = Number(parts[2]);
  if (!Number.isFinite(vramMb)) return null;

  return {
    detected: true,
    gpu_model: parts[0],
    vram_gb: Math.round((vramMb / 1024) * 100) / 100,
    vram_free_gb: Number.isFinite(vramFreeMb)
      ? Math.round((vramFreeMb / 1024) * 100) / 100
      : null,
    driver_note: 'detected_via_nvidia_smi_read_only',
  };
}

function collectWindowsGpuFallback(): GpuInfo {
  const ps = spawnSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      "Get-CimInstance Win32_VideoController | Select-Object -First 1 Name, AdapterRAM | ConvertTo-Json -Compress",
    ],
    { encoding: 'utf8', windowsHide: true, timeout: 10_000 }
  );

  if (ps.status !== 0 || !ps.stdout?.trim()) {
    return {
      detected: false,
      gpu_model: 'not_detected',
      vram_gb: 0,
      vram_free_gb: null,
      driver_note: 'no_gpu_detected_read_only',
    };
  }

  try {
    const parsed = JSON.parse(ps.stdout.trim()) as { Name?: string; AdapterRAM?: number };
    const adapterRam = Number(parsed.AdapterRAM ?? 0);
    const vramGb = adapterRam > 0 ? bytesToGb(adapterRam) : 0;
    return {
      detected: Boolean(parsed.Name),
      gpu_model: parsed.Name ?? 'unknown',
      vram_gb: vramGb,
      vram_free_gb: null,
      driver_note: 'detected_via_wmi_read_only_estimate',
    };
  } catch {
    return {
      detected: false,
      gpu_model: 'not_detected',
      vram_gb: 0,
      vram_free_gb: null,
      driver_note: 'wmi_parse_failed',
    };
  }
}

function collectGpu(): GpuInfo {
  return collectNvidiaGpu() ?? (process.platform === 'win32' ? collectWindowsGpuFallback() : {
    detected: false,
    gpu_model: 'not_detected',
    vram_gb: 0,
    vram_free_gb: null,
    driver_note: 'no_gpu_detection_path_for_platform',
  });
}

export function collectLocalMachineSnapshot(projectRoot?: string): LocalMachineSnapshot {
  const cpus = os.cpus();
  const root = resolveProjectRoot(projectRoot);

  return {
    os: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      hostname: os.hostname(),
    },
    cpu: {
      model: cpus[0]?.model ?? 'unknown',
      cores: cpus.length,
      logical_processors: cpus.length,
    },
    ram_gb: bytesToGb(os.totalmem()),
    ram_free_gb: bytesToGb(os.freemem()),
    gpu: collectGpu(),
    storage: collectStorage(root),
    runtime_versions: {
      node_version: process.version,
      python_version: collectPythonVersion(),
      git_version: collectGitVersion(),
    },
    collected_at: new Date().toISOString(),
    inspection_only: true,
    gpu_execution: false,
  };
}

export type LocalGpuPreflightReport = {
  preflight_id: string;
  phase: typeof PREFLIGHT_PHASE;
  timestamp: string;
  gpu_model: string;
  vram_gb: number;
  vram_free_gb: number | null;
  ram_gb: number;
  ram_free_gb: number;
  storage_free_gb: number;
  storage_total_gb: number;
  node_version: string;
  python_version: string | null;
  git_version: string | null;
  readiness_level: ReadinessLevel;
  upgrade_recommendations: string[];
  machine_snapshot: LocalMachineSnapshot;
  readiness_evaluation: ReadinessEvaluation;
  inspection_only: true;
  gpu_execution: false;
  external_call_allowed: false;
  final_verdict: typeof PREFLIGHT_PASS_VERDICT | typeof PREFLIGHT_FAIL_VERDICT;
};

export function runLocalGpuPreflight(projectRoot?: string): LocalGpuPreflightReport {
  const root = resolveProjectRoot(projectRoot);
  const snapshot = collectLocalMachineSnapshot(root);
  const readiness_evaluation = evaluateRuntimeReadiness(snapshot, root);

  const upstreamPath = path.join(root, PROVIDER_REPORT_PATH);
  let upstreamOk = false;
  if (fs.existsSync(upstreamPath)) {
    const upstream = JSON.parse(fs.readFileSync(upstreamPath, 'utf8')) as {
      final_verdict?: string;
    };
    upstreamOk = upstream.final_verdict === PROVIDER_PASS_VERDICT;
  }

  const pass =
    upstreamOk &&
    Boolean(snapshot.collected_at) &&
    READINESS_LEVELS.includes(readiness_evaluation.readiness_level);

  return {
    preflight_id: `gpu_preflight_${Date.now().toString(36)}`,
    phase: PREFLIGHT_PHASE,
    timestamp: new Date().toISOString(),
    gpu_model: snapshot.gpu.gpu_model,
    vram_gb: snapshot.gpu.vram_gb,
    vram_free_gb: snapshot.gpu.vram_free_gb,
    ram_gb: snapshot.ram_gb,
    ram_free_gb: snapshot.ram_free_gb,
    storage_free_gb: snapshot.storage.storage_free_gb,
    storage_total_gb: snapshot.storage.storage_total_gb,
    node_version: snapshot.runtime_versions.node_version,
    python_version: snapshot.runtime_versions.python_version,
    git_version: snapshot.runtime_versions.git_version,
    readiness_level: readiness_evaluation.readiness_level,
    upgrade_recommendations: readiness_evaluation.upgrade_recommendations,
    machine_snapshot: snapshot,
    readiness_evaluation,
    inspection_only: true,
    gpu_execution: false,
    external_call_allowed: false,
    final_verdict: pass ? PREFLIGHT_PASS_VERDICT : PREFLIGHT_FAIL_VERDICT,
  };
}

export function renderPreflightMarkdown(report: LocalGpuPreflightReport): string {
  const profileLines = report.readiness_evaluation.profile_evaluations
    .map((p) => {
      const status = p.met ? 'MET' : 'NOT MET';
      const gaps = p.gaps.length > 0 ? ` — ${p.gaps.join('; ')}` : '';
      return `- **${p.profile}**: ${status}${gaps}`;
    })
    .join('\n');

  const upgradeLines =
    report.upgrade_recommendations.length > 0
      ? report.upgrade_recommendations.map((r) => `- ${r}`).join('\n')
      : '- None — machine meets production profile.';

  return [
    '# Local GPU Runtime Preflight',
    '',
    '## Verdict',
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| **Verdict** | ${report.final_verdict} |`,
    `| **Readiness level** | ${report.readiness_level} |`,
    `| **Inspection only** | ${report.inspection_only} |`,
    `| **GPU execution** | ${report.gpu_execution} |`,
    '',
    '## Machine Snapshot',
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| **OS** | ${report.machine_snapshot.os.platform} ${report.machine_snapshot.os.release} (${report.machine_snapshot.os.arch}) |`,
    `| **CPU** | ${report.machine_snapshot.cpu.model} (${report.machine_snapshot.cpu.cores} cores) |`,
    `| **RAM** | ${report.ram_gb} GB total / ${report.ram_free_gb} GB free |`,
    `| **GPU** | ${report.gpu_model} |`,
    `| **VRAM** | ${report.vram_gb} GB total${report.vram_free_gb != null ? ` / ${report.vram_free_gb} GB free` : ''} |`,
    `| **Storage (project drive)** | ${report.storage_free_gb} GB free / ${report.storage_total_gb} GB total |`,
    `| **Node** | ${report.node_version} |`,
    `| **Python** | ${report.python_version ?? 'not detected'} |`,
    `| **Git** | ${report.git_version ?? 'not detected'} |`,
    '',
    '## Profile Evaluation',
    '',
    profileLines,
    '',
    '## Upgrade Recommendations',
    '',
    upgradeLines,
    '',
    '## Safety',
    '',
    '- Read-only inspection only — no GPU execution, no image/video generation.',
    '- Future ComfyUI/Wan/AnimateDiff/Hunyuan wiring depends on this preflight baseline.',
    '',
    `*Generated ${report.timestamp} · ${report.phase}*`,
    '',
  ].join('\n');
}

export function writeLocalGpuPreflightReports(projectRoot?: string): LocalGpuPreflightReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runLocalGpuPreflight(root);

  const payload = {
    ...report,
    report_type: 'local_gpu_runtime_preflight_report',
    report_version: 'v1',
    export_path: PREFLIGHT_REPORT_PATH,
    markdown_path: PREFLIGHT_MD_PATH,
    requirements_path: RUNTIME_REQUIREMENTS_PATH,
    upstream_report_path: PROVIDER_REPORT_PATH,
    pipeline_chain:
      'Provider Abstraction → Local GPU Runtime Preflight',
    next_phase: 'PHASE-27 VIDEO_PROVIDER_WIRING_DESIGN_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, PREFLIGHT_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, PREFLIGHT_MD_PATH), `${renderPreflightMarkdown(report)}\n`, 'utf8');

  return report;
}

