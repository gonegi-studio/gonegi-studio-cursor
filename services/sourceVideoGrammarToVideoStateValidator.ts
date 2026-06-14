import fs from 'node:fs';
import path from 'node:path';
import {
  BLEND_CONTRACT_PATH,
  BLEND_PROFILE_PATH,
  type DirectorGrammarBlendProfile,
} from './directorGrammarBlendBuilder.js';
import { BLEND_PASS_VERDICT, BLEND_REPORT_PATH } from './directorGrammarBlendValidator.js';
import {
  COMPILER_PHASE,
  VIDEO_STATE_DEFAULTS_PATH,
  VIDEO_STATE_DEFAULTS_SCHEMA_PATH,
  type VideoStateDefaults,
  loadVideoStateDefaults,
} from './sourceVideoGrammarToVideoStateCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const COMPILER_PASS_VERDICT = 'PASS_SOURCE_VIDEO_GRAMMAR_TO_VIDEO_STATE_COMPILER_V1' as const;
export const COMPILER_FAIL_VERDICT = 'FAIL_SOURCE_VIDEO_GRAMMAR_TO_VIDEO_STATE_COMPILER_V1' as const;
export const COMPILER_REPORT_PATH = 'reports/source-video-grammar-to-video-state-report.json' as const;
export const COMPILER_MD_PATH = 'reports/SOURCE_VIDEO_GRAMMAR_TO_VIDEO_STATE_SUMMARY.md' as const;

const REQUIRED_DEFAULT_FIELDS = [
  'visual_style_defaults',
  'camera_defaults',
  'lighting_defaults',
  'blocking_defaults',
  'emotion_defaults',
  'motion_defaults',
  'environment_defaults',
  'identity_safety_defaults',
] as const;

export type CompilerValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
};

export type SourceVideoGrammarToVideoStateReport = {
  report_id: string;
  phase: typeof COMPILER_PHASE;
  timestamp: string;
  defaults_created: boolean;
  blend_contract: 'PASS' | 'FAIL';
  identity_priority: 'PASS' | 'FAIL';
  video_state_ready: 'PASS' | 'FAIL';
  family_provenance: 'PASS' | 'FAIL';
  grammar_sources_linked: 'PASS' | 'FAIL';
  design_only: true;
  gpu_execution: false;
  final_verdict: typeof COMPILER_PASS_VERDICT | typeof COMPILER_FAIL_VERDICT;
  issues: CompilerValidationIssue[];
};

function loadBlendProfile(projectRoot: string): DirectorGrammarBlendProfile | null {
  const abs = path.join(projectRoot, BLEND_PROFILE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as DirectorGrammarBlendProfile;
}

function isCompleteGrammarBlock(block: {
  summary?: string;
  patterns?: string[];
  source_family?: string;
  source_grammar_id?: string;
}): boolean {
  return Boolean(
    block.summary?.trim() &&
      block.patterns?.length &&
      block.source_family &&
      block.source_grammar_id
  );
}

export function validateSourceVideoGrammarToVideoState(
  projectRoot?: string
): SourceVideoGrammarToVideoStateReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: CompilerValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  let blendContract: 'PASS' | 'FAIL' = 'FAIL';
  let grammarSourcesLinked: 'PASS' | 'FAIL' = 'FAIL';
  let identityPriority: 'PASS' | 'FAIL' = 'FAIL';
  let familyProvenance: 'PASS' | 'FAIL' = 'FAIL';
  let videoStateReady: 'PASS' | 'FAIL' = 'FAIL';
  let defaultsCreated = false;

  if (!fs.existsSync(path.join(root, BLEND_CONTRACT_PATH))) {
    issues.push({
      code: 'MISSING_BLEND_CONTRACT',
      message: `Missing ${BLEND_CONTRACT_PATH}`,
      severity: 'error',
    });
  }

  const blendReportPath = path.join(root, BLEND_REPORT_PATH);
  if (!fs.existsSync(blendReportPath)) {
    issues.push({
      code: 'MISSING_BLEND_REPORT',
      message: `Missing ${BLEND_REPORT_PATH}. Run npm run verify:director-grammar-blend first.`,
      severity: 'error',
    });
  } else {
    const blendReport = JSON.parse(fs.readFileSync(blendReportPath, 'utf8')) as {
      final_verdict?: string;
      family_links?: Record<string, string>;
    };
    if (blendReport.final_verdict === BLEND_PASS_VERDICT) {
      blendContract = 'PASS';
      const allLinked = blendReport.family_links
        ? Object.values(blendReport.family_links).every((s) => s === 'linked')
        : false;
      grammarSourcesLinked = allLinked ? 'PASS' : 'FAIL';
      if (!allLinked) {
        issues.push({
          code: 'GRAMMAR_SOURCES_NOT_LINKED',
          message: 'Not all director grammar families are linked in blend report',
          severity: 'error',
        });
      }
    } else {
      issues.push({
        code: 'BLEND_CONTRACT_NOT_PASS',
        message: `Blend report verdict is not ${BLEND_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  const blend = loadBlendProfile(root);
  if (!blend) {
    issues.push({
      code: 'MISSING_BLEND_PROFILE',
      message: `Missing ${BLEND_PROFILE_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, VIDEO_STATE_DEFAULTS_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `Missing ${VIDEO_STATE_DEFAULTS_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  const defaults = loadVideoStateDefaults(root);
  if (!defaults) {
    issues.push({
      code: 'MISSING_DEFAULTS',
      message: `Missing ${VIDEO_STATE_DEFAULTS_PATH}`,
      severity: 'error',
    });
  } else {
    defaultsCreated = true;

    for (const field of REQUIRED_DEFAULT_FIELDS) {
      if (!defaults[field]) {
        issues.push({
          code: 'INCOMPLETE_DEFAULTS',
          message: `Missing required field: ${field}`,
          severity: 'error',
          field,
        });
      }
    }

    const blocks = [
      defaults.visual_style_defaults,
      defaults.camera_defaults,
      defaults.lighting_defaults,
      defaults.blocking_defaults,
      defaults.emotion_defaults,
      defaults.motion_defaults,
      defaults.environment_defaults,
    ];
    if (!blocks.every(isCompleteGrammarBlock)) {
      issues.push({
        code: 'INCOMPLETE_GRAMMAR_BLOCKS',
        message: 'One or more grammar default blocks are incomplete',
        severity: 'error',
      });
    }

    if (defaults.identity_safety_defaults.identity_priority_first !== true) {
      issues.push({
        code: 'IDENTITY_PRIORITY_NOT_FIRST',
        message: 'identity_safety_defaults.identity_priority_first must be true',
        severity: 'error',
      });
      identityPriority = 'FAIL';
    } else if (defaults.identity_safety_defaults.priority_rules[0] !== 'identity_priority') {
      issues.push({
        code: 'IDENTITY_PRIORITY_ORDER',
        message: 'priority_rules must start with identity_priority',
        severity: 'error',
      });
      identityPriority = 'FAIL';
    } else {
      identityPriority = 'PASS';
    }

    const prov = defaults.family_provenance;
    const expected = {
      visual_style: 'GHIBLI',
      camera: 'SHINKAI',
      lighting: 'SHINKAI',
      blocking: 'LIVE_ACTION',
      emotion: 'GHIBLI',
      motion: 'MORI',
      environment: 'GHIBLI',
    } as const;

    let provPass = true;
    for (const [key, expectedFamily] of Object.entries(expected)) {
      if (prov[key as keyof typeof prov] !== expectedFamily) {
        issues.push({
          code: 'FAMILY_PROVENANCE_MISMATCH',
          message: `family_provenance.${key} expected ${expectedFamily}`,
          severity: 'error',
          field: `family_provenance.${key}`,
        });
        provPass = false;
      }
    }

    if (defaults.camera_defaults.source_family !== 'SHINKAI') {
      issues.push({
        code: 'CAMERA_FAMILY_MISMATCH',
        message: 'camera_defaults must derive from SHINKAI',
        severity: 'error',
      });
      provPass = false;
    }
    if (defaults.lighting_defaults.source_family !== 'SHINKAI') {
      issues.push({
        code: 'LIGHTING_FAMILY_MISMATCH',
        message: 'lighting_defaults must derive from SHINKAI',
        severity: 'error',
      });
      provPass = false;
    }
    if (defaults.blocking_defaults.source_family !== 'LIVE_ACTION') {
      issues.push({
        code: 'BLOCKING_FAMILY_MISMATCH',
        message: 'blocking_defaults must derive from LIVE_ACTION',
        severity: 'error',
      });
      provPass = false;
    }
    if (defaults.visual_style_defaults.source_family !== 'GHIBLI') {
      issues.push({
        code: 'VISUAL_FAMILY_MISMATCH',
        message: 'visual_style_defaults must derive from GHIBLI',
        severity: 'error',
      });
      provPass = false;
    }
    if (defaults.emotion_defaults.source_family !== 'GHIBLI') {
      issues.push({
        code: 'EMOTION_FAMILY_MISMATCH',
        message: 'emotion_defaults must derive from GHIBLI',
        severity: 'error',
      });
      provPass = false;
    }
    if (defaults.environment_defaults.source_family !== 'GHIBLI') {
      issues.push({
        code: 'ENVIRONMENT_FAMILY_MISMATCH',
        message: 'environment_defaults must derive from GHIBLI',
        severity: 'error',
      });
      provPass = false;
    }
    if (defaults.motion_defaults.source_family !== 'MORI') {
      issues.push({
        code: 'MOTION_FAMILY_MISMATCH',
        message: 'motion_defaults must derive from MORI',
        severity: 'error',
      });
      provPass = false;
    }
    familyProvenance = provPass ? 'PASS' : 'FAIL';

    if (blend && defaults.source_blend_id !== blend.blend_id) {
      issues.push({
        code: 'BLEND_ID_MISMATCH',
        message: `source_blend_id ${defaults.source_blend_id} does not match ${blend.blend_id}`,
        severity: 'error',
      });
    }

    const downstream = defaults.downstream_defaults;
    if (
      !downstream?.video_shot_state ||
      !downstream?.keyframe_plan ||
      !downstream?.motion_plan ||
      !downstream?.gpu_payload
    ) {
      issues.push({
        code: 'INCOMPLETE_DOWNSTREAM_DEFAULTS',
        message: 'downstream_defaults must include video_shot_state, keyframe_plan, motion_plan, gpu_payload',
        severity: 'error',
      });
      videoStateReady = 'FAIL';
    } else if (
      downstream.video_shot_state.render_intent.gpu_execution !== false ||
      downstream.gpu_payload.execution_flags.gpu_execution !== false
    ) {
      issues.push({
        code: 'GPU_EXECUTION_ENABLED',
        message: 'Downstream defaults must not enable gpu_execution',
        severity: 'error',
      });
      videoStateReady = 'FAIL';
    } else {
      videoStateReady = 'PASS';
    }

    const flags = defaults.execution_flags;
    if (
      flags.design_only !== true ||
      flags.gpu_execution !== false ||
      flags.external_call_allowed !== false ||
      flags.frame_extraction !== false ||
      flags.ocr !== false ||
      flags.generation !== false
    ) {
      issues.push({
        code: 'EXECUTION_FLAGS_INVALID',
        message: 'execution_flags must be design-only with all execution disabled',
        severity: 'error',
      });
    }
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const final_verdict =
    errors.length === 0 &&
    defaultsCreated &&
    blendContract === 'PASS' &&
    identityPriority === 'PASS' &&
    videoStateReady === 'PASS' &&
    familyProvenance === 'PASS' &&
    grammarSourcesLinked === 'PASS'
      ? COMPILER_PASS_VERDICT
      : COMPILER_FAIL_VERDICT;

  return {
    report_id: 'source-video-grammar-to-video-state-report-v1',
    phase: COMPILER_PHASE,
    timestamp,
    defaults_created: defaultsCreated,
    blend_contract: blendContract,
    identity_priority: identityPriority,
    video_state_ready: videoStateReady,
    family_provenance: familyProvenance,
    grammar_sources_linked: grammarSourcesLinked,
    design_only: true,
    gpu_execution: false,
    final_verdict,
    issues,
  };
}

function buildMarkdown(
  report: SourceVideoGrammarToVideoStateReport,
  defaults: VideoStateDefaults | null
): string {
  const lines = [
    '# Source Video Grammar to Video State Summary',
    '',
    `**Phase:** ${COMPILER_PHASE}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Pass Metrics',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| defaults_created | ${report.defaults_created} |`,
    `| blend_contract | ${report.blend_contract} |`,
    `| identity_priority | ${report.identity_priority} |`,
    `| video_state_ready | ${report.video_state_ready} |`,
    `| family_provenance | ${report.family_provenance} |`,
    `| grammar_sources_linked | ${report.grammar_sources_linked} |`,
    `| design_only | ${report.design_only} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    '',
    '## Family Provenance',
    '',
    '| Dimension | Source Family |',
    '|-----------|---------------|',
    '| visual_style | GHIBLI |',
    '| camera | SHINKAI |',
    '| lighting | SHINKAI |',
    '| blocking | LIVE_ACTION |',
    '| emotion | GHIBLI |',
    '| motion | MORI |',
    '| environment | GHIBLI |',
    '',
    '## Pipeline Chain',
    '',
    '```',
    'director grammar blend → video state defaults → keyframe defaults → motion defaults → GPU payload defaults',
    '```',
    '',
  ];

  if (defaults) {
    lines.push('## Compiled Defaults', '');
    lines.push(`**defaults_id:** ${defaults.defaults_id}`);
    lines.push(`**source_blend_id:** ${defaults.source_blend_id}`);
    lines.push('');
    lines.push('### Downstream Seeds', '');
    lines.push(`- fps_target: ${defaults.downstream_defaults.video_shot_state.fps_target}`);
    lines.push(`- min_keyframes: ${defaults.downstream_defaults.keyframe_plan.min_keyframes}`);
    lines.push(`- min_segments: ${defaults.downstream_defaults.motion_plan.min_segments}`);
    lines.push(`- render_mode: ${defaults.downstream_defaults.gpu_payload.render_mode}`);
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] **${issue.code}**: ${issue.message}`);
    }
    lines.push('');
  }

  lines.push('## Artifacts', '');
  lines.push(`- Schema: \`${VIDEO_STATE_DEFAULTS_SCHEMA_PATH}\``);
  lines.push(`- Defaults: \`${VIDEO_STATE_DEFAULTS_PATH}\``);
  lines.push(`- Report: \`${COMPILER_REPORT_PATH}\``);
  lines.push('');

  return lines.join('\n');
}

export function writeSourceVideoGrammarToVideoStateReport(projectRoot?: string): {
  report: SourceVideoGrammarToVideoStateReport;
  defaults: VideoStateDefaults | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const report = validateSourceVideoGrammarToVideoState(root);
  const defaults = loadVideoStateDefaults(root);

  fs.writeFileSync(path.join(root, COMPILER_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, COMPILER_MD_PATH), buildMarkdown(report, defaults), 'utf8');

  return { report, defaults };
}
