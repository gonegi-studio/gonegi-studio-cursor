import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
  IMAGE_APP_HANDOFF_REPORT_JSON_PATH,
} from './datasetBoundaryAudit.js';
import {
  IMAGE_DATASET_EXPORT_JSON_PATH,
  VIDEO_DATASET_EXPORT_JSON_PATH,
  type VideoDatasetExport,
} from './videoDatasetExport.js';
import { loadVideoDatasetExport } from './videoDatasetExportAudit.js';
import {
  VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
  loadVideoAppHandoffPackage,
  type VideoAppHandoffPackage,
} from './videoAppHandoffPackage.js';

export const IMAGE_VIDEO_DEPENDENCY_FINGERPRINT_SCHEMA_VERSION =
  'IMAGE-VIDEO-DEPENDENCY-FINGERPRINT-PHASE-65-v1' as const;

export const DEPENDENCY_NODE_IMAGE_DATASET = 'image_dataset' as const;
export const DEPENDENCY_NODE_IMAGE_HANDOFF = 'image_handoff' as const;
export const DEPENDENCY_NODE_VIDEO_DATASET = 'video_dataset' as const;
export const DEPENDENCY_NODE_VIDEO_HANDOFF = 'video_handoff' as const;

export type DependencyNodeId =
  | typeof DEPENDENCY_NODE_IMAGE_DATASET
  | typeof DEPENDENCY_NODE_IMAGE_HANDOFF
  | typeof DEPENDENCY_NODE_VIDEO_DATASET
  | typeof DEPENDENCY_NODE_VIDEO_HANDOFF;

export type ImageVideoDependencyAuditResult =
  | 'PASS'
  | 'FAIL_REFERENCE_INTEGRITY'
  | 'FAIL_HANDOFF_REFERENCE'
  | 'FAIL_MISSING_DEPENDENCY'
  | 'FAIL_INVALID_DEPENDENCY_PATH'
  | 'FAIL_CIRCULAR_DEPENDENCY'
  | 'FAIL_DEPENDENCY_OWNERSHIP';

export interface ImageVideoDependencyViolation {
  code: ImageVideoDependencyAuditResult;
  message: string;
  field?: string;
}

export interface ImageVideoDependencyReference {
  from: DependencyNodeId;
  to: string;
  reference_type: 'direct' | 'pipeline' | 'boundary';
}

export interface ImageVideoDependencyFingerprint {
  schemaVersion: typeof IMAGE_VIDEO_DEPENDENCY_FINGERPRINT_SCHEMA_VERSION;
  imageDatasetReferences: ImageVideoDependencyReference[];
  imageHandoffReferences: ImageVideoDependencyReference[];
  videoDatasetReferences: ImageVideoDependencyReference[];
  dependencyGraph: Record<DependencyNodeId, DependencyNodeId[]>;
  frozenAt: string;
}

export interface ImageVideoDependencyReport {
  auditTimestamp: string;
  auditResult: ImageVideoDependencyAuditResult;
  violations: ImageVideoDependencyViolation[];
}

interface LooseImageDatasetExport {
  export_metadata?: {
    export_type?: string;
    export_json_path?: string;
    video_dataset_export_path?: string;
    image_dataset_export_separate?: boolean;
  };
}

interface LooseImageAppHandoffPackage {
  handoff_metadata?: {
    handoff_type?: string;
    image_dataset_export_path?: string;
    video_dataset_export_path?: string;
  };
  export_reference?: {
    path?: string;
  };
  manifest?: {
    assets?: Array<{ path?: string }>;
  };
}

const FINGERPRINT_FILE = 'image-video-dependency-fingerprint.json';
const REPORT_FILE = 'image-video-dependency-report.json';

const VALID_EXPORT_PATHS = new Set<string>([
  IMAGE_DATASET_EXPORT_JSON_PATH,
  VIDEO_DATASET_EXPORT_JSON_PATH,
]);

const IMAGE_HANDOFF_PATHS = new Set<string>([
  IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
  IMAGE_APP_HANDOFF_REPORT_JSON_PATH,
]);

const VIDEO_HANDOFF_PATHS = new Set<string>([
  VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
  'exports/video-app-handoff-report.json',
]);

function emptyDependencyGraph(): Record<DependencyNodeId, DependencyNodeId[]> {
  return {
    [DEPENDENCY_NODE_IMAGE_DATASET]: [],
    [DEPENDENCY_NODE_IMAGE_HANDOFF]: [],
    [DEPENDENCY_NODE_VIDEO_DATASET]: [],
    [DEPENDENCY_NODE_VIDEO_HANDOFF]: [],
  };
}

function addGraphEdge(
  graph: Record<DependencyNodeId, DependencyNodeId[]>,
  from: DependencyNodeId,
  to: DependencyNodeId
): void {
  if (!graph[from].includes(to)) {
    graph[from].push(to);
  }
}

function loadImageDatasetExport(projectRoot: string): LooseImageDatasetExport | null {
  const exportPath = path.join(projectRoot, IMAGE_DATASET_EXPORT_JSON_PATH);
  if (!fs.existsSync(exportPath)) return null;
  return JSON.parse(fs.readFileSync(exportPath, 'utf8')) as LooseImageDatasetExport;
}

function loadImageAppHandoffPackage(projectRoot: string): LooseImageAppHandoffPackage | null {
  const packagePath = path.join(projectRoot, IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH);
  if (!fs.existsSync(packagePath)) return null;
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as LooseImageAppHandoffPackage;
}

function isInvalidDependencyPath(targetPath: string): boolean {
  if (!targetPath.startsWith('exports/') || !targetPath.endsWith('.json')) return true;
  if (IMAGE_HANDOFF_PATHS.has(targetPath)) return false;
  if (VIDEO_HANDOFF_PATHS.has(targetPath)) return false;
  return !VALID_EXPORT_PATHS.has(targetPath);
}

function collectDependencyFingerprint(
  projectRoot: string,
  frozenAt: string
): ImageVideoDependencyFingerprint {
  const imageDatasetReferences: ImageVideoDependencyReference[] = [];
  const imageHandoffReferences: ImageVideoDependencyReference[] = [];
  const videoDatasetReferences: ImageVideoDependencyReference[] = [];
  const dependencyGraph = emptyDependencyGraph();

  const videoExport = loadVideoDatasetExport(projectRoot);
  const videoHandoff = loadVideoAppHandoffPackage(projectRoot);
  const imageExport = loadImageDatasetExport(projectRoot);
  const imageHandoff = loadImageAppHandoffPackage(projectRoot);

  if (videoExport?.export_metadata.image_dataset_export_path) {
    const target = videoExport.export_metadata.image_dataset_export_path;
    imageDatasetReferences.push({
      from: DEPENDENCY_NODE_VIDEO_DATASET,
      to: target,
      reference_type: 'direct',
    });
    addGraphEdge(dependencyGraph, DEPENDENCY_NODE_VIDEO_DATASET, DEPENDENCY_NODE_IMAGE_DATASET);
  }

  if (videoHandoff?.handoff_metadata?.image_dataset_export_path) {
    imageDatasetReferences.push({
      from: DEPENDENCY_NODE_VIDEO_HANDOFF,
      to: videoHandoff.handoff_metadata.image_dataset_export_path,
      reference_type: 'boundary',
    });
  }

  if (imageExport?.export_metadata?.export_json_path) {
    imageDatasetReferences.push({
      from: DEPENDENCY_NODE_IMAGE_DATASET,
      to: imageExport.export_metadata.export_json_path,
      reference_type: 'direct',
    });
  }

  if (imageExport?.export_metadata?.video_dataset_export_path) {
    videoDatasetReferences.push({
      from: DEPENDENCY_NODE_IMAGE_DATASET,
      to: imageExport.export_metadata.video_dataset_export_path,
      reference_type: 'boundary',
    });
  }

  if (imageHandoff?.export_reference?.path) {
    imageHandoffReferences.push({
      from: DEPENDENCY_NODE_IMAGE_HANDOFF,
      to: imageHandoff.export_reference.path,
      reference_type: 'pipeline',
    });
  }

  if (imageHandoff?.handoff_metadata?.video_dataset_export_path) {
    videoDatasetReferences.push({
      from: DEPENDENCY_NODE_IMAGE_HANDOFF,
      to: imageHandoff.handoff_metadata.video_dataset_export_path,
      reference_type: 'pipeline',
    });
    addGraphEdge(dependencyGraph, DEPENDENCY_NODE_IMAGE_HANDOFF, DEPENDENCY_NODE_VIDEO_DATASET);
  }

  if (imageHandoff) {
    addGraphEdge(dependencyGraph, DEPENDENCY_NODE_IMAGE_DATASET, DEPENDENCY_NODE_IMAGE_HANDOFF);
  }

  if (videoHandoff) {
    videoDatasetReferences.push({
      from: DEPENDENCY_NODE_VIDEO_HANDOFF,
      to: VIDEO_DATASET_EXPORT_JSON_PATH,
      reference_type: 'direct',
    });
    addGraphEdge(dependencyGraph, DEPENDENCY_NODE_VIDEO_HANDOFF, DEPENDENCY_NODE_VIDEO_DATASET);
  }

  for (const node of Object.keys(dependencyGraph) as DependencyNodeId[]) {
    dependencyGraph[node].sort();
  }

  return {
    schemaVersion: IMAGE_VIDEO_DEPENDENCY_FINGERPRINT_SCHEMA_VERSION,
    imageDatasetReferences: imageDatasetReferences.sort((left, right) =>
      `${left.from}:${left.to}`.localeCompare(`${right.from}:${right.to}`)
    ),
    imageHandoffReferences: imageHandoffReferences.sort((left, right) =>
      `${left.from}:${left.to}`.localeCompare(`${right.from}:${right.to}`)
    ),
    videoDatasetReferences: videoDatasetReferences.sort((left, right) =>
      `${left.from}:${left.to}`.localeCompare(`${right.from}:${right.to}`)
    ),
    dependencyGraph,
    frozenAt,
  };
}

function auditImageDatasetReferenceIntegrity(
  videoExport: VideoDatasetExport | null,
  videoHandoff: VideoAppHandoffPackage | null
): ImageVideoDependencyViolation[] {
  const violations: ImageVideoDependencyViolation[] = [];

  if (!videoExport) {
    violations.push({
      code: 'FAIL_REFERENCE_INTEGRITY',
      message: 'video-dataset-export.json required for dependency audit',
      field: VIDEO_DATASET_EXPORT_JSON_PATH,
    });
    return violations;
  }

  const metadata = videoExport.export_metadata;

  if (metadata.image_dataset_export_separate !== true) {
    violations.push({
      code: 'FAIL_REFERENCE_INTEGRITY',
      message: 'Video export must declare image dataset separation',
      field: 'export_metadata.image_dataset_export_separate',
    });
  }

  if (metadata.image_dataset_export_path !== IMAGE_DATASET_EXPORT_JSON_PATH) {
    violations.push({
      code: 'FAIL_REFERENCE_INTEGRITY',
      message: 'Video export image dataset reference must point to exports/image-dataset-export.json',
      field: 'export_metadata.image_dataset_export_path',
    });
  }

  if (metadata.export_json_path !== VIDEO_DATASET_EXPORT_JSON_PATH) {
    violations.push({
      code: 'FAIL_REFERENCE_INTEGRITY',
      message: 'Video export active path must remain exports/video-dataset-export.json',
      field: 'export_metadata.export_json_path',
    });
  }

  if (videoHandoff) {
    if (videoHandoff.handoff_metadata.image_dataset_export_path !== IMAGE_DATASET_EXPORT_JSON_PATH) {
      violations.push({
        code: 'FAIL_REFERENCE_INTEGRITY',
        message: 'Video handoff image dataset boundary reference must point to image-dataset-export.json',
        field: 'handoff_metadata.image_dataset_export_path',
      });
    }

    const exportMetadata = videoHandoff.export_reference.export_metadata;
    if (exportMetadata.image_dataset_export_path !== IMAGE_DATASET_EXPORT_JSON_PATH) {
      violations.push({
        code: 'FAIL_REFERENCE_INTEGRITY',
        message: 'Video handoff export_reference metadata image dataset path mismatch',
        field: 'export_reference.export_metadata.image_dataset_export_path',
      });
    }
  }

  return violations;
}

function auditImageHandoffReferenceIntegrity(
  projectRoot: string,
  videoExport: VideoDatasetExport | null,
  videoHandoff: VideoAppHandoffPackage | null
): ImageVideoDependencyViolation[] {
  const violations: ImageVideoDependencyViolation[] = [];
  const imageHandoff = loadImageAppHandoffPackage(projectRoot);

  const videoLayerPaths = [
    videoExport?.export_metadata.image_dataset_export_path,
    videoHandoff?.handoff_metadata.image_dataset_export_path,
    ...(videoHandoff?.manifest.assets.map((asset) => asset.path) ?? []),
  ].filter((value): value is string => typeof value === 'string');

  for (const referencePath of videoLayerPaths) {
    if (IMAGE_HANDOFF_PATHS.has(referencePath)) {
      violations.push({
        code: 'FAIL_HANDOFF_REFERENCE',
        message: `Video layer must not reference image handoff asset: ${referencePath}`,
        field: 'video_layer_references',
      });
    }
  }

  if (videoHandoff?.handoff_metadata.image_app_handoff_included !== false) {
    violations.push({
      code: 'FAIL_HANDOFF_REFERENCE',
      message: 'Video handoff must not include image app handoff',
      field: 'handoff_metadata.image_app_handoff_included',
    });
  }

  if (imageHandoff) {
    if (imageHandoff.handoff_metadata?.handoff_type !== 'image_app') {
      violations.push({
        code: 'FAIL_HANDOFF_REFERENCE',
        message: 'Image handoff package must remain image_app type',
        field: 'handoff_metadata.handoff_type',
      });
    }

    if (imageHandoff.export_reference?.path !== IMAGE_DATASET_EXPORT_JSON_PATH) {
      violations.push({
        code: 'FAIL_HANDOFF_REFERENCE',
        message: 'Image handoff export_reference must point to image-dataset-export.json',
        field: 'export_reference.path',
      });
    }

    for (const asset of imageHandoff.manifest?.assets ?? []) {
      if (asset.path && VIDEO_HANDOFF_PATHS.has(asset.path)) {
        violations.push({
          code: 'FAIL_HANDOFF_REFERENCE',
          message: `Image handoff must not bundle video handoff asset: ${asset.path}`,
          field: 'manifest.assets',
        });
      }
    }
  }

  return violations;
}

function auditMissingDependencies(
  videoExport: VideoDatasetExport | null
): ImageVideoDependencyViolation[] {
  const violations: ImageVideoDependencyViolation[] = [];

  if (!videoExport) {
    violations.push({
      code: 'FAIL_MISSING_DEPENDENCY',
      message: 'Missing video dataset export for dependency resolution',
      field: VIDEO_DATASET_EXPORT_JSON_PATH,
    });
    return violations;
  }

  if (!videoExport.export_metadata.image_dataset_export_path) {
    violations.push({
      code: 'FAIL_MISSING_DEPENDENCY',
      message: 'Video dataset export missing image_dataset_export_path dependency',
      field: 'export_metadata.image_dataset_export_path',
    });
  }

  return violations;
}

function auditInvalidDependencyPaths(
  fingerprint: ImageVideoDependencyFingerprint
): ImageVideoDependencyViolation[] {
  const violations: ImageVideoDependencyViolation[] = [];
  const allReferences = [
    ...fingerprint.imageDatasetReferences,
    ...fingerprint.imageHandoffReferences,
    ...fingerprint.videoDatasetReferences,
  ];

  for (const reference of allReferences) {
    if (isInvalidDependencyPath(reference.to)) {
      violations.push({
        code: 'FAIL_INVALID_DEPENDENCY_PATH',
        message: `Invalid dependency path: ${reference.from} → ${reference.to}`,
        field: `${reference.from}`,
      });
    }

    if (reference.reference_type === 'direct' && reference.to === IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH) {
      violations.push({
        code: 'FAIL_INVALID_DEPENDENCY_PATH',
        message: 'Direct dependency must not target image handoff package',
        field: reference.to,
      });
    }
  }

  return violations;
}

function hasForbiddenVideoThroughHandoffPath(
  graph: Record<DependencyNodeId, DependencyNodeId[]>
): boolean {
  const videoToImageHandoff =
    graph[DEPENDENCY_NODE_VIDEO_DATASET].includes(DEPENDENCY_NODE_IMAGE_HANDOFF) ||
    graph[DEPENDENCY_NODE_VIDEO_HANDOFF].includes(DEPENDENCY_NODE_IMAGE_HANDOFF);

  if (!videoToImageHandoff) return false;

  const handoffToImage = graph[DEPENDENCY_NODE_IMAGE_HANDOFF].includes(
    DEPENDENCY_NODE_IMAGE_DATASET
  );
  const imageToVideo = graph[DEPENDENCY_NODE_IMAGE_DATASET].includes(
    DEPENDENCY_NODE_VIDEO_DATASET
  );
  const videoToImage = graph[DEPENDENCY_NODE_VIDEO_DATASET].includes(
    DEPENDENCY_NODE_IMAGE_DATASET
  );

  return handoffToImage && imageToVideo && videoToImage;
}

function auditCircularDependencies(
  fingerprint: ImageVideoDependencyFingerprint
): ImageVideoDependencyViolation[] {
  const violations: ImageVideoDependencyViolation[] = [];
  const graph = fingerprint.dependencyGraph;

  const videoToImageHandoff =
    graph[DEPENDENCY_NODE_VIDEO_DATASET].includes(DEPENDENCY_NODE_IMAGE_HANDOFF) ||
    graph[DEPENDENCY_NODE_VIDEO_HANDOFF].includes(DEPENDENCY_NODE_IMAGE_HANDOFF);

  if (videoToImageHandoff) {
    violations.push({
      code: 'FAIL_CIRCULAR_DEPENDENCY',
      message: 'Video layer must not depend on image handoff (direct reference forbidden)',
      field: 'dependencyGraph',
    });
  }

  if (hasForbiddenVideoThroughHandoffPath(graph)) {
    violations.push({
      code: 'FAIL_CIRCULAR_DEPENDENCY',
      message:
        'Forbidden dependency cycle detected: video dataset → image handoff → image dataset → video dataset',
      field: 'dependencyGraph',
    });
  }

  return violations;
}

function auditDependencyOwnership(
  videoExport: VideoDatasetExport | null,
  videoHandoff: VideoAppHandoffPackage | null
): ImageVideoDependencyViolation[] {
  const violations: ImageVideoDependencyViolation[] = [];

  if (videoExport?.export_metadata.image_dataset_export_path) {
    const pathValue = videoExport.export_metadata.image_dataset_export_path;
    if (pathValue !== IMAGE_DATASET_EXPORT_JSON_PATH) {
      violations.push({
        code: 'FAIL_DEPENDENCY_OWNERSHIP',
        message: 'Video dataset may only depend on image dataset export ownership path',
        field: 'export_metadata.image_dataset_export_path',
      });
    }
  }

  for (const asset of videoHandoff?.manifest.assets ?? []) {
    if (asset.path === IMAGE_DATASET_EXPORT_JSON_PATH) {
      violations.push({
        code: 'FAIL_DEPENDENCY_OWNERSHIP',
        message: 'Video handoff manifest must not bundle image dataset export asset',
        field: 'manifest.assets',
      });
    }

    if (IMAGE_HANDOFF_PATHS.has(asset.path)) {
      violations.push({
        code: 'FAIL_DEPENDENCY_OWNERSHIP',
        message: `Video handoff manifest must not bundle image handoff asset: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
  }

  return violations;
}

function primaryFailure(
  violations: ImageVideoDependencyViolation[]
): ImageVideoDependencyAuditResult {
  const priority: ImageVideoDependencyAuditResult[] = [
    'FAIL_CIRCULAR_DEPENDENCY',
    'FAIL_HANDOFF_REFERENCE',
    'FAIL_DEPENDENCY_OWNERSHIP',
    'FAIL_INVALID_DEPENDENCY_PATH',
    'FAIL_MISSING_DEPENDENCY',
    'FAIL_REFERENCE_INTEGRITY',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditImageVideoDependency(
  projectRoot: string,
  fingerprint: ImageVideoDependencyFingerprint
): ImageVideoDependencyViolation[] {
  const videoExport = loadVideoDatasetExport(projectRoot);
  const videoHandoff = loadVideoAppHandoffPackage(projectRoot);
  const violations: ImageVideoDependencyViolation[] = [];

  violations.push(...auditMissingDependencies(videoExport));
  violations.push(...auditImageDatasetReferenceIntegrity(videoExport, videoHandoff));
  violations.push(...auditImageHandoffReferenceIntegrity(projectRoot, videoExport, videoHandoff));
  violations.push(...auditInvalidDependencyPaths(fingerprint));
  violations.push(...auditDependencyOwnership(videoExport, videoHandoff));
  violations.push(...auditCircularDependencies(fingerprint));

  return violations;
}

export function writeImageVideoDependencyFingerprint(
  projectRoot: string,
  fingerprint: ImageVideoDependencyFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function writeImageVideoDependencyReport(
  projectRoot: string,
  report: ImageVideoDependencyReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runImageVideoDependencyAudit(projectRoot: string): ImageVideoDependencyReport {
  const auditTimestamp = new Date().toISOString();
  const fingerprint = collectDependencyFingerprint(projectRoot, auditTimestamp);
  writeImageVideoDependencyFingerprint(projectRoot, fingerprint);

  const violations = auditImageVideoDependency(projectRoot, fingerprint);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: ImageVideoDependencyReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeImageVideoDependencyReport(projectRoot, report);
  return report;
}
