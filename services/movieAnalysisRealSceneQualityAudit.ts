import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  REAL_SCENE_CONTENT_INGESTION_PASS_VERDICT,
  REAL_SCENE_CONTENT_INGESTION_REPORT_PATH,
  REAL_SCENE_CONTENT_MANIFEST_PATH,
  type MovieAnalysisRealSceneContentIngestionReport,
  type RealSceneContentEntry,
  type RealSceneContentManifest,
} from './movieAnalysisRealSceneContentIngestion.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_SCENE_QUALITY_AUDIT_PHASE =
  'PHASE-LEVEL2E-009-MOVIE_ANALYSIS_REAL_SCENE_QUALITY_AUDIT_V1' as const;
export const REAL_SCENE_QUALITY_AUDIT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_SCENE_QUALITY_AUDIT_V1' as const;
export const REAL_SCENE_QUALITY_AUDIT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_SCENE_QUALITY_AUDIT_V1' as const;
export const REAL_SCENE_QUALITY_AUDIT_DIR =
  'reports/movie_analysis_real_scene_quality_audit' as const;
export const REAL_SCENE_QUALITY_AUDIT_REPORT_PATH =
  'reports/movie_analysis_real_scene_quality_audit/movie-analysis-real-scene-quality-audit-report.json' as const;
export const REAL_SCENE_QUALITY_AUDIT_MD_PATH =
  'reports/movie_analysis_real_scene_quality_audit/MOVIE_ANALYSIS_REAL_SCENE_QUALITY_AUDIT.md' as const;
export const BLOCKED_REAL_SCENE_QUALITY_REQUIRED_STATUS =
  'BLOCKED_REAL_SCENE_QUALITY_REQUIRED' as const;
export const REAL_SCENE_QUALITY_AUDIT_READY_STATUS = 'REAL_SCENE_QUALITY_AUDITED' as const;

export const MAX_FLAT_REGION_RATIO = 0.58 as const;
export const MIN_MICRO_NOISE_RATIO = 0.42 as const;
export const MIN_AXIS_ALIGNED_EDGE_RATIO = 0.82 as const;
export const MAX_COLOR_ENTROPY = 5.8 as const;
export const MIN_SUBJECT_CONTRAST = 28 as const;
export const MIN_COMPOSITION_ZONE_SPREAD = 22 as const;
export const MIN_ENVIRONMENT_LAYER_DISTANCE = 32 as const;
export const MIN_SCENE_COMPLEXITY_SCORE = 0.45 as const;
export const MIN_CINEMATIC_LAYER_SCORE = 0.55 as const;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const STRONG_EDGE_THRESHOLD = 22 as const;
const MICRO_NOISE_MIN = 1 as const;
const MICRO_NOISE_MAX = 14 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type AuditStatus = 'PASS' | 'FAIL';

export type SceneQualityMetrics = {
  flat_region_ratio: number;
  micro_noise_ratio: number;
  axis_aligned_edge_ratio: number;
  color_entropy: number;
  subject_contrast: number;
  composition_zone_spread: number;
  environment_layer_distance: number;
  scene_complexity_score: number;
  cinematic_layer_score: number;
  low_detail_scene: boolean;
  random_noise_scene: boolean;
  low_information_scene: boolean;
};

export type RealSceneQualityAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceRealSceneQualityAudit = {
  source_video_id: string;
  subject_clarity: AuditStatus;
  composition_quality: AuditStatus;
  environment_quality: AuditStatus;
  scene_complexity: AuditStatus;
  cinematic_structure: AuditStatus;
  adapter_traceability: AuditStatus;
  low_detail_scene: boolean;
  random_noise_scene: boolean;
  low_information_scene: boolean;
  blocked: boolean;
  scene_quality_present: boolean;
  source_scene_quality_audit_ready: AuditStatus;
  metrics: SceneQualityMetrics | null;
  dimensions: { width: number; height: number } | null;
};

export type MovieAnalysisRealSceneQualityAuditReport = {
  report_id: string;
  phase: typeof REAL_SCENE_QUALITY_AUDIT_PHASE;
  timestamp: string;
  real_scene_content_ingestion_report_path: typeof REAL_SCENE_CONTENT_INGESTION_REPORT_PATH;
  scene_content_manifest_path: typeof REAL_SCENE_CONTENT_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  subject_clarity: AuditStatus;
  composition_quality: AuditStatus;
  environment_quality: AuditStatus;
  scene_complexity: AuditStatus;
  cinematic_structure: AuditStatus;
  adapter_traceability: AuditStatus;
  low_detail_scene: boolean;
  random_noise_scene: boolean;
  low_information_scene: boolean;
  real_scene_quality_audit_ready: AuditStatus;
  certification_status:
    | typeof BLOCKED_REAL_SCENE_QUALITY_REQUIRED_STATUS
    | typeof REAL_SCENE_QUALITY_AUDIT_READY_STATUS
    | null;
  source_audits: SourceRealSceneQualityAudit[];
  final_verdict:
    | typeof REAL_SCENE_QUALITY_AUDIT_PASS_VERDICT
    | typeof REAL_SCENE_QUALITY_AUDIT_FAIL_VERDICT;
  issues: RealSceneQualityAuditIssue[];
};

type Rgb = [number, number, number];

function loadIngestionReport(
  projectRoot: string
): MovieAnalysisRealSceneContentIngestionReport | null {
  const abs = path.join(projectRoot, REAL_SCENE_CONTENT_INGESTION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRealSceneContentIngestionReport;
}

function loadSceneContentManifest(projectRoot: string): RealSceneContentManifest | null {
  const abs = path.join(projectRoot, REAL_SCENE_CONTENT_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as RealSceneContentManifest;
}

function decodePngRgb(
  buffer: Buffer
): { width: number; height: number; pixels: Buffer } | null {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return null;
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = -1;
  const idatParts: Buffer[] = [];

  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd > buffer.length) {
      return null;
    }
    const data = buffer.subarray(dataStart, dataEnd);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatParts.push(data);
    } else if (type === 'IEND') {
      break;
    }

    offset = dataEnd + 4;
  }

  if (width <= 0 || height <= 0 || colorType !== 2 || idatParts.length === 0) {
    return null;
  }

  const inflated = zlib.inflateSync(Buffer.concat(idatParts));
  const bytesPerPixel = 3;
  const rowSize = 1 + width * bytesPerPixel;
  const pixels = Buffer.alloc(width * height * bytesPerPixel);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowSize;
    if (rowStart >= inflated.length || inflated[rowStart] !== 0) {
      return null;
    }
    inflated.copy(
      pixels,
      y * width * bytesPerPixel,
      rowStart + 1,
      rowStart + 1 + width * bytesPerPixel
    );
  }

  return { width, height, pixels };
}

function colorDistance(left: Rgb, right: Rgb): number {
  return Math.sqrt(
    (left[0] - right[0]) ** 2 + (left[1] - right[1]) ** 2 + (left[2] - right[2]) ** 2
  );
}

function zoneAverage(
  pixels: Buffer,
  width: number,
  height: number,
  zoneRow: number,
  zoneCol: number
): Rgb {
  const xStart = Math.floor((zoneCol * width) / 3);
  const xEnd = Math.floor(((zoneCol + 1) * width) / 3);
  const yStart = Math.floor((zoneRow * height) / 3);
  const yEnd = Math.floor(((zoneRow + 1) * height) / 3);
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let y = yStart; y < yEnd; y += 4) {
    for (let x = xStart; x < xEnd; x += 4) {
      const index = (y * width + x) * 3;
      red += pixels[index];
      green += pixels[index + 1];
      blue += pixels[index + 2];
      count += 1;
    }
  }

  if (count === 0) {
    return [0, 0, 0];
  }

  return [red / count, green / count, blue / count];
}

function localStdDev(pixels: Buffer, width: number, height: number, x: number, y: number): number {
  const values: number[] = [];
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const px = x + dx;
      const py = y + dy;
      if (px < 0 || py < 0 || px >= width || py >= height) {
        continue;
      }
      const index = (py * width + px) * 3;
      values.push((pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3);
    }
  }

  if (values.length === 0) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function computeFlatRegionRatio(pixels: Buffer, width: number, height: number): number {
  let flat = 0;
  let total = 0;

  for (let y = 2; y < height - 2; y += 3) {
    for (let x = 2; x < width - 2; x += 3) {
      total += 1;
      if (localStdDev(pixels, width, height, x, y) < 9) {
        flat += 1;
      }
    }
  }

  return total === 0 ? 1 : flat / total;
}

function computeMicroNoiseRatio(pixels: Buffer, width: number, height: number): number {
  let micro = 0;
  let total = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 3;
      if (x + 1 < width) {
        const right = index + 3;
        const diff = Math.max(
          Math.abs(pixels[index] - pixels[right]),
          Math.abs(pixels[index + 1] - pixels[right + 1]),
          Math.abs(pixels[index + 2] - pixels[right + 2])
        );
        total += 1;
        if (diff >= MICRO_NOISE_MIN && diff <= MICRO_NOISE_MAX) {
          micro += 1;
        }
      }
    }
  }

  return total === 0 ? 0 : micro / total;
}

function computeAxisAlignedEdgeRatio(pixels: Buffer, width: number, height: number): number {
  let axisAligned = 0;
  let strongEdges = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 3;
      let horizontalDiff = 0;
      let verticalDiff = 0;

      if (x + 1 < width) {
        const right = index + 3;
        horizontalDiff = Math.max(
          Math.abs(pixels[index] - pixels[right]),
          Math.abs(pixels[index + 1] - pixels[right + 1]),
          Math.abs(pixels[index + 2] - pixels[right + 2])
        );
      }

      if (y + 1 < height) {
        const down = index + width * 3;
        verticalDiff = Math.max(
          Math.abs(pixels[index] - pixels[down]),
          Math.abs(pixels[index + 1] - pixels[down + 1]),
          Math.abs(pixels[index + 2] - pixels[down + 2])
        );
      }

      const maxDiff = Math.max(horizontalDiff, verticalDiff);
      if (maxDiff < STRONG_EDGE_THRESHOLD) {
        continue;
      }

      strongEdges += 1;
      if (
        (horizontalDiff >= STRONG_EDGE_THRESHOLD && verticalDiff < 10) ||
        (verticalDiff >= STRONG_EDGE_THRESHOLD && horizontalDiff < 10) ||
        (horizontalDiff >= STRONG_EDGE_THRESHOLD && verticalDiff >= STRONG_EDGE_THRESHOLD)
      ) {
        axisAligned += 1;
      }
    }
  }

  return strongEdges === 0 ? 0 : axisAligned / strongEdges;
}

function computeColorEntropy(pixels: Buffer, sampleStride = 6): number {
  const counts = new Map<number, number>();
  let total = 0;

  for (let index = 0; index < pixels.length; index += 3 * sampleStride) {
    const bucket =
      (Math.floor(pixels[index] / 32) << 6) |
      (Math.floor(pixels[index + 1] / 32) << 3) |
      Math.floor(pixels[index + 2] / 32);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    total += 1;
  }

  if (total === 0) {
    return 0;
  }

  let entropy = 0;
  for (const count of counts.values()) {
    const probability = count / total;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

function analyzeSceneQuality(
  pixels: Buffer,
  width: number,
  height: number
): {
  metrics: SceneQualityMetrics;
  subjectClarity: boolean;
  compositionQuality: boolean;
  environmentQuality: boolean;
  sceneComplexity: boolean;
  cinematicStructure: boolean;
} {
  const topZone = zoneAverage(pixels, width, height, 0, 1);
  const bottomZone = zoneAverage(pixels, width, height, 2, 1);
  const leftZone = zoneAverage(pixels, width, height, 1, 0);
  const rightZone = zoneAverage(pixels, width, height, 1, 2);
  const centerZone = zoneAverage(pixels, width, height, 1, 1);

  const flatRegionRatio = computeFlatRegionRatio(pixels, width, height);
  const microNoiseRatio = computeMicroNoiseRatio(pixels, width, height);
  const axisAlignedEdgeRatio = computeAxisAlignedEdgeRatio(pixels, width, height);
  const colorEntropy = computeColorEntropy(pixels);

  const subjectContrast = colorDistance(centerZone, topZone);
  const environmentLayerDistance = colorDistance(topZone, bottomZone);
  const compositionZoneSpread = colorDistance(leftZone, rightZone);

  const zoneDistances = [
    colorDistance(topZone, bottomZone),
    colorDistance(leftZone, rightZone),
    colorDistance(centerZone, topZone),
    colorDistance(centerZone, bottomZone),
  ];
  const sceneComplexityScore =
    zoneDistances.reduce((sum, value) => sum + value, 0) / zoneDistances.length / 100;

  const cinematicLayerScore =
    (environmentLayerDistance / 100) * 0.4 +
    (subjectContrast / 100) * 0.35 +
    (compositionZoneSpread / 100) * 0.25;

  const lowDetailScene = flatRegionRatio >= MAX_FLAT_REGION_RATIO;
  const randomNoiseScene = microNoiseRatio >= MIN_MICRO_NOISE_RATIO;
  const lowInformationScene =
    axisAlignedEdgeRatio >= MIN_AXIS_ALIGNED_EDGE_RATIO ||
    colorEntropy <= MAX_COLOR_ENTROPY;

  const blocked = lowDetailScene || randomNoiseScene || lowInformationScene;

  const subjectClarity =
    !blocked && subjectContrast >= MIN_SUBJECT_CONTRAST;
  const compositionQuality =
    !blocked && compositionZoneSpread >= MIN_COMPOSITION_ZONE_SPREAD;
  const environmentQuality =
    !blocked && environmentLayerDistance >= MIN_ENVIRONMENT_LAYER_DISTANCE;
  const sceneComplexity =
    !blocked &&
    sceneComplexityScore >= MIN_SCENE_COMPLEXITY_SCORE &&
    !lowInformationScene;
  const cinematicStructure =
    !blocked &&
    cinematicLayerScore >= MIN_CINEMATIC_LAYER_SCORE &&
    !lowDetailScene;

  return {
    metrics: {
      flat_region_ratio: flatRegionRatio,
      micro_noise_ratio: microNoiseRatio,
      axis_aligned_edge_ratio: axisAlignedEdgeRatio,
      color_entropy: colorEntropy,
      subject_contrast: subjectContrast,
      composition_zone_spread: compositionZoneSpread,
      environment_layer_distance: environmentLayerDistance,
      scene_complexity_score: sceneComplexityScore,
      cinematic_layer_score: cinematicLayerScore,
      low_detail_scene: lowDetailScene,
      random_noise_scene: randomNoiseScene,
      low_information_scene: lowInformationScene,
    },
    subjectClarity,
    compositionQuality,
    environmentQuality,
    sceneComplexity,
    cinematicStructure,
  };
}

function auditSourceSceneQuality(
  sourceVideoId: string,
  manifestEntry: RealSceneContentEntry | undefined,
  ingestionEntry: RealSceneContentEntry | undefined,
  projectRoot: string
): SourceRealSceneQualityAudit {
  if (!manifestEntry) {
    return {
      source_video_id: sourceVideoId,
      subject_clarity: 'FAIL',
      composition_quality: 'FAIL',
      environment_quality: 'FAIL',
      scene_complexity: 'FAIL',
      cinematic_structure: 'FAIL',
      adapter_traceability: 'FAIL',
      low_detail_scene: true,
      random_noise_scene: true,
      low_information_scene: true,
      blocked: true,
      scene_quality_present: false,
      source_scene_quality_audit_ready: 'FAIL',
      metrics: null,
      dimensions: null,
    };
  }

  const outputAbs = path.join(projectRoot, manifestEntry.output_path);
  if (!fs.existsSync(outputAbs)) {
    return {
      source_video_id: sourceVideoId,
      subject_clarity: 'FAIL',
      composition_quality: 'FAIL',
      environment_quality: 'FAIL',
      scene_complexity: 'FAIL',
      cinematic_structure: 'FAIL',
      adapter_traceability: 'FAIL',
      low_detail_scene: true,
      random_noise_scene: true,
      low_information_scene: true,
      blocked: true,
      scene_quality_present: false,
      source_scene_quality_audit_ready: 'FAIL',
      metrics: null,
      dimensions: null,
    };
  }

  const decoded = decodePngRgb(fs.readFileSync(outputAbs));
  if (!decoded) {
    return {
      source_video_id: sourceVideoId,
      subject_clarity: 'FAIL',
      composition_quality: 'FAIL',
      environment_quality: 'FAIL',
      scene_complexity: 'FAIL',
      cinematic_structure: 'FAIL',
      adapter_traceability: 'FAIL',
      low_detail_scene: true,
      random_noise_scene: true,
      low_information_scene: true,
      blocked: true,
      scene_quality_present: false,
      source_scene_quality_audit_ready: 'FAIL',
      metrics: null,
      dimensions: null,
    };
  }

  const analysis = analyzeSceneQuality(decoded.pixels, decoded.width, decoded.height);
  const adapterTraceability =
    ingestionEntry &&
    manifestEntry.resolved_image_prompt === ingestionEntry.resolved_image_prompt &&
    manifestEntry.prompt_hash === ingestionEntry.prompt_hash &&
    manifestEntry.cinematic_dna_id === ingestionEntry.cinematic_dna_id &&
    JSON.stringify(manifestEntry.adapter_ids) === JSON.stringify(ingestionEntry.adapter_ids)
      ? 'PASS'
      : 'FAIL';

  const sceneQualityPresent =
    analysis.subjectClarity &&
    analysis.compositionQuality &&
    analysis.environmentQuality &&
    analysis.sceneComplexity &&
    analysis.cinematicStructure;

  const sourceReady =
    adapterTraceability === 'PASS' &&
    (sceneQualityPresent || (analysis.metrics.low_detail_scene ||
      analysis.metrics.random_noise_scene ||
      analysis.metrics.low_information_scene));

  return {
    source_video_id: sourceVideoId,
    subject_clarity: analysis.subjectClarity ? 'PASS' : 'FAIL',
    composition_quality: analysis.compositionQuality ? 'PASS' : 'FAIL',
    environment_quality: analysis.environmentQuality ? 'PASS' : 'FAIL',
    scene_complexity: analysis.sceneComplexity ? 'PASS' : 'FAIL',
    cinematic_structure: analysis.cinematicStructure ? 'PASS' : 'FAIL',
    adapter_traceability: adapterTraceability,
    low_detail_scene: analysis.metrics.low_detail_scene,
    random_noise_scene: analysis.metrics.random_noise_scene,
    low_information_scene: analysis.metrics.low_information_scene,
    blocked: analysis.metrics.low_detail_scene ||
      analysis.metrics.random_noise_scene ||
      analysis.metrics.low_information_scene,
    scene_quality_present: sceneQualityPresent,
    source_scene_quality_audit_ready: sourceReady ? 'PASS' : 'FAIL',
    metrics: analysis.metrics,
    dimensions: { width: decoded.width, height: decoded.height },
  };
}

function aggregateStatus(
  audits: SourceRealSceneQualityAudit[],
  field:
    | 'subject_clarity'
    | 'composition_quality'
    | 'environment_quality'
    | 'scene_complexity'
    | 'cinematic_structure'
    | 'adapter_traceability'
): AuditStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealSceneQualityAuditReport): string {
  const lines = [
    '# Movie Analysis Real Scene Quality Audit',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## Status: ${report.certification_status}`, '');
  }

  lines.push(
    '## Audit Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| subject_clarity | ${report.subject_clarity} |`,
    `| composition_quality | ${report.composition_quality} |`,
    `| environment_quality | ${report.environment_quality} |`,
    `| scene_complexity | ${report.scene_complexity} |`,
    `| cinematic_structure | ${report.cinematic_structure} |`,
    `| adapter_traceability | ${report.adapter_traceability} |`,
    `| low_detail_scene | ${report.low_detail_scene} |`,
    `| random_noise_scene | ${report.random_noise_scene} |`,
    `| low_information_scene | ${report.low_information_scene} |`,
    `| real_scene_quality_audit_ready | ${report.real_scene_quality_audit_ready} |`,
    '',
    '## Block Rule',
    '',
    '- `low_detail_scene`',
    '- `random_noise_scene`',
    '- `low_information_scene`',
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    const dim = audit.dimensions
      ? `${audit.dimensions.width}x${audit.dimensions.height}`
      : 'none';
    const metrics = audit.metrics
      ? `flat=${audit.metrics.flat_region_ratio.toFixed(4)} noise=${audit.metrics.micro_noise_ratio.toFixed(4)} axis=${audit.metrics.axis_aligned_edge_ratio.toFixed(4)} entropy=${audit.metrics.color_entropy.toFixed(2)} complexity=${audit.metrics.scene_complexity_score.toFixed(4)}`
      : 'none';
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- blocked: ${audit.blocked}`,
      `- scene_quality_present: ${audit.scene_quality_present}`,
      `- dimensions: ${dim}`,
      `- metrics: ${metrics}`,
      `- subject_clarity: ${audit.subject_clarity}`,
      `- composition_quality: ${audit.composition_quality}`,
      `- environment_quality: ${audit.environment_quality}`,
      `- scene_complexity: ${audit.scene_complexity}`,
      `- cinematic_structure: ${audit.cinematic_structure}`,
      `- adapter_traceability: ${audit.adapter_traceability}`,
      `- low_detail_scene: ${audit.low_detail_scene}`,
      `- random_noise_scene: ${audit.random_noise_scene}`,
      `- low_information_scene: ${audit.low_information_scene}`,
      `- source_scene_quality_audit_ready: ${audit.source_scene_quality_audit_ready}`,
      ''
    );
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: RealSceneQualityAuditIssue[]
): MovieAnalysisRealSceneQualityAuditReport {
  const report: MovieAnalysisRealSceneQualityAuditReport = {
    report_id: 'movie-analysis-real-scene-quality-audit-report-v1',
    phase: REAL_SCENE_QUALITY_AUDIT_PHASE,
    timestamp,
    real_scene_content_ingestion_report_path: REAL_SCENE_CONTENT_INGESTION_REPORT_PATH,
    scene_content_manifest_path: REAL_SCENE_CONTENT_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    subject_clarity: 'FAIL',
    composition_quality: 'FAIL',
    environment_quality: 'FAIL',
    scene_complexity: 'FAIL',
    cinematic_structure: 'FAIL',
    adapter_traceability: 'FAIL',
    low_detail_scene: true,
    random_noise_scene: true,
    low_information_scene: true,
    real_scene_quality_audit_ready: 'FAIL',
    certification_status: null,
    source_audits: [],
    final_verdict: REAL_SCENE_QUALITY_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_SCENE_QUALITY_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_SCENE_QUALITY_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_SCENE_QUALITY_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealSceneQualityAudit(
  projectRoot?: string
): MovieAnalysisRealSceneQualityAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealSceneQualityAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const ingestionReport = loadIngestionReport(root);
  if (!ingestionReport) {
    issues.push({
      code: 'REAL_SCENE_CONTENT_INGESTION_REPORT_MISSING',
      message: `Missing ${REAL_SCENE_CONTENT_INGESTION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (ingestionReport.final_verdict !== REAL_SCENE_CONTENT_INGESTION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2E_008_NOT_PASS',
      message: `Real scene content ingestion must have ${REAL_SCENE_CONTENT_INGESTION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const manifest = loadSceneContentManifest(root);
  if (!manifest) {
    issues.push({
      code: 'REAL_SCENE_CONTENT_MANIFEST_MISSING',
      message: `Missing ${REAL_SCENE_CONTENT_MANIFEST_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const sourceAudits: SourceRealSceneQualityAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const manifestEntry = manifest.entries.find(
      (item) => item.source_video_id === sourceVideoId
    );
    const ingestionEntry = ingestionReport.entries.find(
      (item) => item.source_video_id === sourceVideoId
    );
    const audit = auditSourceSceneQuality(
      sourceVideoId,
      manifestEntry,
      ingestionEntry,
      root
    );
    sourceAudits.push(audit);

    if (audit.source_scene_quality_audit_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_SCENE_QUALITY_AUDIT_FAIL',
        message: `Real scene quality audit failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const sourceCount = ingestionReport.source_count;
  const adapterCount = ingestionReport.adapter_count;

  const subjectClarity = aggregateStatus(sourceAudits, 'subject_clarity');
  const compositionQuality = aggregateStatus(sourceAudits, 'composition_quality');
  const environmentQuality = aggregateStatus(sourceAudits, 'environment_quality');
  const sceneComplexity = aggregateStatus(sourceAudits, 'scene_complexity');
  const cinematicStructure = aggregateStatus(sourceAudits, 'cinematic_structure');
  const adapterTraceability = aggregateStatus(sourceAudits, 'adapter_traceability');

  const lowDetailScene = sourceAudits.some((audit) => audit.low_detail_scene);
  const randomNoiseScene = sourceAudits.some((audit) => audit.random_noise_scene);
  const lowInformationScene = sourceAudits.some((audit) => audit.low_information_scene);
  const anyBlocked = sourceAudits.some((audit) => audit.blocked);
  const anySceneQuality = sourceAudits.some((audit) => audit.scene_quality_present);

  const certificationStatus =
    anyBlocked && (lowDetailScene || randomNoiseScene || lowInformationScene) && !anySceneQuality
      ? BLOCKED_REAL_SCENE_QUALITY_REQUIRED_STATUS
      : REAL_SCENE_QUALITY_AUDIT_READY_STATUS;

  const auditReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    adapterTraceability === 'PASS' &&
    sourceAudits.every((audit) => audit.source_scene_quality_audit_ready === 'PASS') &&
    (anyBlocked
      ? certificationStatus === BLOCKED_REAL_SCENE_QUALITY_REQUIRED_STATUS
      : certificationStatus === REAL_SCENE_QUALITY_AUDIT_READY_STATUS) &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = auditReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'REAL_SCENE_QUALITY_AUDIT_FAIL')) {
    issues.push({
      code: 'REAL_SCENE_QUALITY_AUDIT_FAIL',
      message: 'Real scene quality audit is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealSceneQualityAuditReport = {
    report_id: 'movie-analysis-real-scene-quality-audit-report-v1',
    phase: REAL_SCENE_QUALITY_AUDIT_PHASE,
    timestamp,
    real_scene_content_ingestion_report_path: REAL_SCENE_CONTENT_INGESTION_REPORT_PATH,
    scene_content_manifest_path: REAL_SCENE_CONTENT_MANIFEST_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    subject_clarity: subjectClarity,
    composition_quality: compositionQuality,
    environment_quality: environmentQuality,
    scene_complexity: sceneComplexity,
    cinematic_structure: cinematicStructure,
    adapter_traceability: adapterTraceability,
    low_detail_scene: lowDetailScene,
    random_noise_scene: randomNoiseScene,
    low_information_scene: lowInformationScene,
    real_scene_quality_audit_ready: auditReady,
    certification_status: pass ? certificationStatus : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_SCENE_QUALITY_AUDIT_PASS_VERDICT
      : REAL_SCENE_QUALITY_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_SCENE_QUALITY_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_SCENE_QUALITY_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_SCENE_QUALITY_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
