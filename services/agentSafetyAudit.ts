import fs from 'node:fs';
import path from 'node:path';

export type AgentSafetyAuditResult =
  | 'PASS'
  | 'FAIL_BACKGROUND_TASK'
  | 'FAIL_DEBUG_FILE'
  | 'FAIL_TEMP_FILE'
  | 'FAIL_TIMEOUT'
  | 'FAIL_VERIFY_LIMIT';

export interface AgentConfig {
  safeMode: boolean;
  allowBackgroundTask: boolean;
  allowDebugFile: boolean;
  allowTempFile: boolean;
  maxVerifyCount: number;
  verifyTimeoutSeconds: number;
}

export interface AgentSafetyViolation {
  code: AgentSafetyAuditResult;
  message: string;
  path?: string;
}

export interface AgentVerifyRun {
  label: string;
  durationSeconds: number;
  timestamp: string;
}

export interface AgentSessionLog {
  backgroundTasks: Array<{ id: string; startedAt: string }>;
  verifyRuns: AgentVerifyRun[];
}

export interface AgentSafetyReport {
  auditTimestamp: string;
  auditResult: AgentSafetyAuditResult;
  violations: AgentSafetyViolation[];
}

const CONFIG_FILE = 'AGENT_CONFIG.json';
const SESSION_LOG_FILE = path.join('.agent', 'session-log.json');

const SCAN_DIRS = ['services', 'scripts', 'exports'] as const;
const SCAN_ROOT_FILES = [
  'AGENT_CONFIG.json',
  'AGENT_RULES.md',
  'README_AGENT_WORKFLOW.md',
  'package.json',
  'tsconfig.json',
] as const;

const DEBUG_FILE_PATTERN = /(?:^|[/\\])debug\.log$|\.debug(?:\.|$)/i;
const TEMP_FILE_PATTERN = /(?:^|[/\\])(?:temp|tmp|\.temp)[/\\]|\.tmp$/i;

const SKIP_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  '.git',
  'AppData',
  '.cursor',
]);

export function loadAgentConfig(projectRoot: string): AgentConfig {
  const configPath = path.join(projectRoot, CONFIG_FILE);
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw) as AgentConfig;
}

export function enforceSafeMode(config: AgentConfig): AgentSafetyViolation | null {
  if (config.safeMode !== true) {
    return {
      code: 'FAIL_VERIFY_LIMIT',
      message: 'AGENT_CONFIG.json safeMode must be true',
      path: CONFIG_FILE,
    };
  }
  return null;
}

function readSessionLog(projectRoot: string): AgentSessionLog {
  const logPath = path.join(projectRoot, SESSION_LOG_FILE);
  if (!fs.existsSync(logPath)) {
    return { backgroundTasks: [], verifyRuns: [] };
  }
  return JSON.parse(fs.readFileSync(logPath, 'utf8')) as AgentSessionLog;
}

function collectScanPaths(projectRoot: string): string[] {
  const paths: string[] = [];

  for (const fileName of SCAN_ROOT_FILES) {
    const filePath = path.join(projectRoot, fileName);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      paths.push(filePath);
    }
  }

  for (const dirName of SCAN_DIRS) {
    const dirPath = path.join(projectRoot, dirName);
    if (!fs.existsSync(dirPath)) continue;
    walkDirectory(dirPath, paths);
  }

  return paths;
}

function walkDirectory(dirPath: string, paths: string[]): void {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(fullPath, paths);
      continue;
    }
    if (entry.isFile()) {
      paths.push(fullPath);
    }
  }
}

function relativePath(projectRoot: string, filePath: string): string {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/');
}

export function findDebugFileViolations(
  projectRoot: string,
  config: AgentConfig
): AgentSafetyViolation[] {
  if (config.allowDebugFile) return [];

  const violations: AgentSafetyViolation[] = [];
  for (const filePath of collectScanPaths(projectRoot)) {
    const rel = relativePath(projectRoot, filePath);
    if (DEBUG_FILE_PATTERN.test(rel)) {
      violations.push({
        code: 'FAIL_DEBUG_FILE',
        message: 'Debug file detected',
        path: rel,
      });
    }
  }
  return violations;
}

export function findTempFileViolations(
  projectRoot: string,
  config: AgentConfig
): AgentSafetyViolation[] {
  if (config.allowTempFile) return [];

  const violations: AgentSafetyViolation[] = [];
  for (const dirName of ['temp', 'tmp', '.temp'] as const) {
    const dirPath = path.join(projectRoot, dirName);
    if (fs.existsSync(dirPath)) {
      violations.push({
        code: 'FAIL_TEMP_FILE',
        message: 'Temp directory detected',
        path: dirName,
      });
    }
  }

  for (const filePath of collectScanPaths(projectRoot)) {
    const rel = relativePath(projectRoot, filePath);
    if (TEMP_FILE_PATTERN.test(rel)) {
      violations.push({
        code: 'FAIL_TEMP_FILE',
        message: 'Temp file detected',
        path: rel,
      });
    }
  }
  return violations;
}

export function findBackgroundTaskViolations(
  projectRoot: string,
  config: AgentConfig
): AgentSafetyViolation[] {
  if (config.allowBackgroundTask) return [];

  const session = readSessionLog(projectRoot);
  if (session.backgroundTasks.length === 0) return [];

  return session.backgroundTasks.map((task) => ({
    code: 'FAIL_BACKGROUND_TASK',
    message: `Background task active: ${task.id}`,
    path: SESSION_LOG_FILE,
  }));
}

export function findVerifyLimitViolations(
  projectRoot: string,
  config: AgentConfig
): AgentSafetyViolation[] {
  const session = readSessionLog(projectRoot);
  if (session.verifyRuns.length <= config.maxVerifyCount) return [];

  return [
    {
      code: 'FAIL_VERIFY_LIMIT',
      message: `Verify count ${session.verifyRuns.length} exceeds maxVerifyCount ${config.maxVerifyCount}`,
      path: SESSION_LOG_FILE,
    },
  ];
}

export function findTimeoutViolations(
  projectRoot: string,
  config: AgentConfig
): AgentSafetyViolation[] {
  const session = readSessionLog(projectRoot);
  return session.verifyRuns
    .filter((run) => run.durationSeconds > config.verifyTimeoutSeconds)
    .map((run) => ({
      code: 'FAIL_TIMEOUT',
      message: `Verify "${run.label}" exceeded timeout (${run.durationSeconds}s > ${config.verifyTimeoutSeconds}s)`,
      path: SESSION_LOG_FILE,
    }));
}

function primaryFailure(
  violations: AgentSafetyViolation[]
): AgentSafetyAuditResult {
  const priority: AgentSafetyAuditResult[] = [
    'FAIL_BACKGROUND_TASK',
    'FAIL_DEBUG_FILE',
    'FAIL_TEMP_FILE',
    'FAIL_TIMEOUT',
    'FAIL_VERIFY_LIMIT',
  ];

  for (const code of priority) {
    if (violations.some((v) => v.code === code)) return code;
  }
  return 'PASS';
}

export function runAgentSafetyAudit(projectRoot: string): AgentSafetyReport {
  const config = loadAgentConfig(projectRoot);
  const violations: AgentSafetyViolation[] = [];

  const safeModeViolation = enforceSafeMode(config);
  if (safeModeViolation) violations.push(safeModeViolation);

  violations.push(
    ...findBackgroundTaskViolations(projectRoot, config),
    ...findDebugFileViolations(projectRoot, config),
    ...findTempFileViolations(projectRoot, config),
    ...findTimeoutViolations(projectRoot, config),
    ...findVerifyLimitViolations(projectRoot, config)
  );

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  return {
    auditTimestamp: new Date().toISOString(),
    auditResult,
    violations,
  };
}

export function writeAgentSafetyReport(
  projectRoot: string,
  report: AgentSafetyReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, 'agent-safety-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}
