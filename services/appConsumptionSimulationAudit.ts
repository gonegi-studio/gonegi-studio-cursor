import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  loadAppHandoffContractFingerprint,
  type AppHandoffContractFingerprint,
} from './appHandoffContractFreeze.js';
import {
  IMAGE_DATASET_EXPORT_SCHEMA_VERSION,
  IMAGE_DATASET_EXPORT_JSON_PATH,
  type ImageDatasetExport,
} from './imageDatasetExport.js';
import { loadImageDatasetExport } from './imageDatasetExportAudit.js';
import {
  IMAGE_APP_HANDOFF_CONSUMER_TARGET,
  IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
  IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
  loadImageAppHandoffPackage,
  type ImageAppHandoffPackage,
} from './imageAppHandoffPackage.js';
import { loadImageDatasetQualityReport } from './imageDatasetQualityAudit.js';
import {
  VIDEO_DATASET_EXPORT_SCHEMA_VERSION,
  VIDEO_DATASET_EXPORT_JSON_PATH,
  type VideoDatasetExport,
} from './videoDatasetExport.js';
import { loadVideoDatasetExport } from './videoDatasetExportAudit.js';
import {
  VIDEO_APP_HANDOFF_CONSUMER_TARGET,
  VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
  VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
  loadVideoAppHandoffPackage,
  type VideoAppHandoffPackage,
} from './videoAppHandoffPackage.js';
import { loadVideoDatasetQualityReport } from './videoDatasetQualityAudit.js';

export const APP_CONSUMPTION_SIMULATION_FINGERPRINT_SCHEMA_VERSION =
  'APP-CONSUMPTION-SIMULATION-FINGERPRINT-PHASE-73-v1' as const;

export type AppConsumptionSimulationAuditResult =
  | 'PASS'
  | 'FAIL_IMAGE_CONSUMPTION'
  | 'FAIL_VIDEO_CONSUMPTION'
  | 'FAIL_CONTRACT_COMPATIBILITY'
  | 'FAIL_EXPORT_COMPATIBILITY'
  | 'FAIL_QUALITY_GATE'
  | 'FAIL_GENERATION_TRIGGERED'
  | 'FAIL_DATASET_MUTATION';

export interface AppConsumptionSimulationViolation {
  code: AppConsumptionSimulationAuditResult;
  message: string;
  field?: string;
}

export interface ExportSchemaSummary {
  schema_version: string;
  export_type: string;
  scene_count: number;
}

export interface QualityGateStatus {
  auditResult: string;
  quality_score: number;
}

export interface AppConsumptionSimulationFingerprint {
  schemaVersion: typeof APP_CONSUMPTION_SIMULATION_FINGERPRINT_SCHEMA_VERSION;
  imageAppTarget: typeof IMAGE_APP_HANDOFF_CONSUMER_TARGET;
  videoAppTarget: typeof VIDEO_APP_HANDOFF_CONSUMER_TARGET;
  consumedHandoffAssets: {
    image: Array<{ asset_id: string; path: string; role: string }>;
    video: Array<{ asset_id: string; path: string; role: string }>;
  };
  exportSchemaSummary: {
    image: ExportSchemaSummary;
    video: ExportSchemaSummary;
  };
  qualityGateStatus: {
    image: QualityGateStatus;
    video: QualityGateStatus;
  };
  frozenAt: string;
}

export interface AppConsumptionSimulationReport {
  auditTimestamp: string;
  auditResult: AppConsumptionSimulationAuditResult;
  violations: AppConsumptionSimulationViolation[];
  image_consumption_simulated: boolean;
  video_consumption_simulated: boolean;
}

interface FileSnapshot {
  path: string;
  checksum: string;
  mtimeMs: number;
}

const REPORT_FILE = 'app-consumption-simulation-report.json';
const FINGERPRINT_FILE = 'app-consumption-simulation-fingerprint.json';

const PROTECTED_RELEASE_PATHS = [
  IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
  VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
  IMAGE_DATASET_EXPORT_JSON_PATH,
  VIDEO_DATASET_EXPORT_JSON_PATH,
  IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
  VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
  'exports/dataset-release-manifest.json',
  'exports/dataset-release-lock.json',
  'exports/app-handoff-contract-fingerprint.json',
] as const;

const DATASET_MUTATION_PATHS = [
  IMAGE_DATASET_EXPORT_JSON_PATH,
  VIDEO_DATASET_EXPORT_JSON_PATH,
  IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
  VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
] as const;

function fileExists(projectRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function snapshotPaths(projectRoot: string, paths: readonly string[]): FileSnapshot[] {
  return paths.map((relativePath) => {
    const filePath = path.join(projectRoot, relativePath);
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath);
    return {
      path: relativePath,
      checksum: crypto.createHash('sha256').update(content).digest('hex'),
      mtimeMs: stat.mtimeMs,
    };
  });
}

function compareSnapshots(
  before: FileSnapshot[],
  after: FileSnapshot[],
  generationCode: AppConsumptionSimulationAuditResult,
  mutationCode: AppConsumptionSimulationAuditResult,
  datasetPaths: readonly string[]
): AppConsumptionSimulationViolation[] {
  const violations: AppConsumptionSimulationViolation[] = [];
  const afterByPath = new Map(after.map((snapshot) => [snapshot.path, snapshot]));
  const datasetPathSet = new Set(datasetPaths);

  for (const snapshot of before) {
    const next = afterByPath.get(snapshot.path);
    if (!next) {
      violations.push({
        code: generationCode,
        message: `Protected file removed during simulation: ${snapshot.path}`,
        field: snapshot.path,
      });
      continue;
    }

    if (next.checksum !== snapshot.checksum || next.mtimeMs !== snapshot.mtimeMs) {
      violations.push({
        code: datasetPathSet.has(snapshot.path) ? mutationCode : generationCode,
        message: `Protected file modified during simulation: ${snapshot.path}`,
        field: snapshot.path,
      });
    }
  }

  return violations;
}

function simulateImageAppConsumption(
  projectRoot: string
): { violations: AppConsumptionSimulationViolation[]; simulated: boolean } {
  const violations: AppConsumptionSimulationViolation[] = [];
  const handoff = loadImageAppHandoffPackage(projectRoot);

  if (!handoff) {
    violations.push({
      code: 'FAIL_IMAGE_CONSUMPTION',
      message: 'Image app consumption simulation failed at handoff entrypoint',
      field: IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
    });
    return { violations, simulated: false };
  }

  if (handoff.handoff_metadata.consumer_target !== IMAGE_APP_HANDOFF_CONSUMER_TARGET) {
    violations.push({
      code: 'FAIL_IMAGE_CONSUMPTION',
      message: 'Image app consumer target mismatch during simulation',
      field: 'handoff_metadata.consumer_target',
    });
  }

  if (!fileExists(projectRoot, handoff.export_reference.path)) {
    violations.push({
      code: 'FAIL_IMAGE_CONSUMPTION',
      message: 'Image app simulation cannot resolve export_reference',
      field: 'export_reference.path',
    });
  }

  if (!fileExists(projectRoot, handoff.quality_reference.path)) {
    violations.push({
      code: 'FAIL_IMAGE_CONSUMPTION',
      message: 'Image app simulation cannot resolve quality_reference',
      field: 'quality_reference.path',
    });
  }

  for (const asset of handoff.manifest.assets) {
    if (!fileExists(projectRoot, asset.path)) {
      violations.push({
        code: 'FAIL_IMAGE_CONSUMPTION',
        message: `Image app simulation missing manifest asset: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
  }

  const simulated = violations.length === 0;
  return { violations, simulated };
}

function simulateVideoAppConsumption(
  projectRoot: string
): { violations: AppConsumptionSimulationViolation[]; simulated: boolean } {
  const violations: AppConsumptionSimulationViolation[] = [];
  const handoff = loadVideoAppHandoffPackage(projectRoot);

  if (!handoff) {
    violations.push({
      code: 'FAIL_VIDEO_CONSUMPTION',
      message: 'Video app consumption simulation failed at handoff entrypoint',
      field: VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
    });
    return { violations, simulated: false };
  }

  if (handoff.handoff_metadata.consumer_target !== VIDEO_APP_HANDOFF_CONSUMER_TARGET) {
    violations.push({
      code: 'FAIL_VIDEO_CONSUMPTION',
      message: 'Video app consumer target mismatch during simulation',
      field: 'handoff_metadata.consumer_target',
    });
  }

  if (!fileExists(projectRoot, handoff.export_reference.path)) {
    violations.push({
      code: 'FAIL_VIDEO_CONSUMPTION',
      message: 'Video app simulation cannot resolve export_reference',
      field: 'export_reference.path',
    });
  }

  if (!fileExists(projectRoot, handoff.quality_reference.path)) {
    violations.push({
      code: 'FAIL_VIDEO_CONSUMPTION',
      message: 'Video app simulation cannot resolve quality_reference',
      field: 'quality_reference.path',
    });
  }

  for (const asset of handoff.manifest.assets) {
    if (!fileExists(projectRoot, asset.path)) {
      violations.push({
        code: 'FAIL_VIDEO_CONSUMPTION',
        message: `Video app simulation missing manifest asset: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
  }

  const simulated = violations.length === 0;
  return { violations, simulated };
}

function auditHandoffContractCompatibility(
  projectRoot: string,
  imageHandoff: ImageAppHandoffPackage | null,
  videoHandoff: VideoAppHandoffPackage | null
): AppConsumptionSimulationViolation[] {
  const violations: AppConsumptionSimulationViolation[] = [];
  const contract = loadAppHandoffContractFingerprint(projectRoot);

  if (!contract) {
    violations.push({
      code: 'FAIL_CONTRACT_COMPATIBILITY',
      message: 'Frozen app handoff contract fingerprint not found',
      field: 'exports/app-handoff-contract-fingerprint.json',
    });
    return violations;
  }

  violations.push(...compareHandoffAgainstContract('image', imageHandoff, contract));
  violations.push(...compareHandoffAgainstContract('video', videoHandoff, contract));

  return violations;
}

function compareHandoffAgainstContract(
  domain: 'image' | 'video',
  handoff: ImageAppHandoffPackage | VideoAppHandoffPackage | null,
  contract: AppHandoffContractFingerprint
): AppConsumptionSimulationViolation[] {
  const violations: AppConsumptionSimulationViolation[] = [];
  if (!handoff) return violations;

  const contractSnapshot =
    domain === 'image' ? contract.imageHandoffContract : contract.videoHandoffContract;
  const exportPath = domain === 'image' ? contract.exportPaths.image : contract.exportPaths.video;
  const qualityPath =
    domain === 'image' ? contract.qualityPaths.image : contract.qualityPaths.video;
  const handoffPath =
    domain === 'image' ? contract.handoffPaths.image : contract.handoffPaths.video;

  if (handoff.handoff_metadata.consumer_target !== contractSnapshot.consumer_target) {
    violations.push({
      code: 'FAIL_CONTRACT_COMPATIBILITY',
      message: `${domain} handoff consumer_target incompatible with frozen contract`,
      field: `${domain}HandoffContract.consumer_target`,
    });
  }

  if (handoff.export_reference.path !== exportPath) {
    violations.push({
      code: 'FAIL_CONTRACT_COMPATIBILITY',
      message: `${domain} export path incompatible with frozen contract`,
      field: `${domain} export_reference.path`,
    });
  }

  if (handoff.quality_reference.path !== qualityPath) {
    violations.push({
      code: 'FAIL_CONTRACT_COMPATIBILITY',
      message: `${domain} quality path incompatible with frozen contract`,
      field: `${domain} quality_reference.path`,
    });
  }

  if (handoff.handoff_metadata.package_json_path !== handoffPath) {
    violations.push({
      code: 'FAIL_CONTRACT_COMPATIBILITY',
      message: `${domain} handoff path incompatible with frozen contract`,
      field: `${domain} handoff_metadata.package_json_path`,
    });
  }

  return violations;
}

function auditExportPayloadCompatibility(
  projectRoot: string
): AppConsumptionSimulationViolation[] {
  const violations: AppConsumptionSimulationViolation[] = [];
  const imageExport = loadImageDatasetExport(projectRoot);
  const videoExport = loadVideoDatasetExport(projectRoot);

  if (!imageExport) {
    violations.push({
      code: 'FAIL_EXPORT_COMPATIBILITY',
      message: 'Image export payload not readable for simulation',
      field: IMAGE_DATASET_EXPORT_JSON_PATH,
    });
  } else {
    violations.push(...validateImageExportPayload(imageExport));
  }

  if (!videoExport) {
    violations.push({
      code: 'FAIL_EXPORT_COMPATIBILITY',
      message: 'Video export payload not readable for simulation',
      field: VIDEO_DATASET_EXPORT_JSON_PATH,
    });
  } else {
    violations.push(...validateVideoExportPayload(videoExport));
  }

  return violations;
}

function validateImageExportPayload(exportData: ImageDatasetExport): AppConsumptionSimulationViolation[] {
  const violations: AppConsumptionSimulationViolation[] = [];

  if (exportData.export_metadata.schema_version !== IMAGE_DATASET_EXPORT_SCHEMA_VERSION) {
    violations.push({
      code: 'FAIL_EXPORT_COMPATIBILITY',
      message: 'Image export schema_version incompatible with consumption simulation',
      field: 'export_metadata.schema_version',
    });
  }

  if (exportData.export_metadata.export_type !== 'image_dataset') {
    violations.push({
      code: 'FAIL_EXPORT_COMPATIBILITY',
      message: 'Image export export_type incompatible with consumption simulation',
      field: 'export_metadata.export_type',
    });
  }

  if (exportData.export_metadata.scene_count !== exportData.scene_records.length) {
    violations.push({
      code: 'FAIL_EXPORT_COMPATIBILITY',
      message: 'Image export scene_count incompatible with scene_records payload',
      field: 'export_metadata.scene_count',
    });
  }

  return violations;
}

function validateVideoExportPayload(exportData: VideoDatasetExport): AppConsumptionSimulationViolation[] {
  const violations: AppConsumptionSimulationViolation[] = [];

  if (exportData.export_metadata.schema_version !== VIDEO_DATASET_EXPORT_SCHEMA_VERSION) {
    violations.push({
      code: 'FAIL_EXPORT_COMPATIBILITY',
      message: 'Video export schema_version incompatible with consumption simulation',
      field: 'export_metadata.schema_version',
    });
  }

  if (exportData.export_metadata.export_type !== 'video_dataset') {
    violations.push({
      code: 'FAIL_EXPORT_COMPATIBILITY',
      message: 'Video export export_type incompatible with consumption simulation',
      field: 'export_metadata.export_type',
    });
  }

  if (exportData.export_metadata.scene_count !== exportData.scene_records.length) {
    violations.push({
      code: 'FAIL_EXPORT_COMPATIBILITY',
      message: 'Video export scene_count incompatible with scene_records payload',
      field: 'export_metadata.scene_count',
    });
  }

  return violations;
}

function auditQualityGateCompatibility(
  projectRoot: string
): AppConsumptionSimulationViolation[] {
  const violations: AppConsumptionSimulationViolation[] = [];
  const imageQuality = loadImageDatasetQualityReport(projectRoot);
  const videoQuality = loadVideoDatasetQualityReport(projectRoot);

  if (!imageQuality) {
    violations.push({
      code: 'FAIL_QUALITY_GATE',
      message: 'Image quality gate report not readable',
      field: IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
    });
  } else {
    if (imageQuality.auditResult !== 'PASS') {
      violations.push({
        code: 'FAIL_QUALITY_GATE',
        message: 'Image quality gate must PASS for consumption simulation',
        field: 'image-dataset-quality-report.auditResult',
      });
    }
    if (imageQuality.quality_score !== 100) {
      violations.push({
        code: 'FAIL_QUALITY_GATE',
        message: 'Image quality gate score must be 100 for consumption simulation',
        field: 'image-dataset-quality-report.quality_score',
      });
    }
  }

  if (!videoQuality) {
    violations.push({
      code: 'FAIL_QUALITY_GATE',
      message: 'Video quality gate report not readable',
      field: VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
    });
  } else {
    if (videoQuality.auditResult !== 'PASS') {
      violations.push({
        code: 'FAIL_QUALITY_GATE',
        message: 'Video quality gate must PASS for consumption simulation',
        field: 'video-dataset-quality-report.auditResult',
      });
    }
    if (videoQuality.quality_score !== 100) {
      violations.push({
        code: 'FAIL_QUALITY_GATE',
        message: 'Video quality gate score must be 100 for consumption simulation',
        field: 'video-dataset-quality-report.quality_score',
      });
    }
  }

  return violations;
}

export function buildAppConsumptionSimulationFingerprint(
  projectRoot: string,
  frozenAt: string
): AppConsumptionSimulationFingerprint | null {
  const imageHandoff = loadImageAppHandoffPackage(projectRoot);
  const videoHandoff = loadVideoAppHandoffPackage(projectRoot);
  const imageExport = loadImageDatasetExport(projectRoot);
  const videoExport = loadVideoDatasetExport(projectRoot);
  const imageQuality = loadImageDatasetQualityReport(projectRoot);
  const videoQuality = loadVideoDatasetQualityReport(projectRoot);

  if (!imageHandoff || !videoHandoff || !imageExport || !videoExport || !imageQuality || !videoQuality) {
    return null;
  }

  return {
    schemaVersion: APP_CONSUMPTION_SIMULATION_FINGERPRINT_SCHEMA_VERSION,
    imageAppTarget: IMAGE_APP_HANDOFF_CONSUMER_TARGET,
    videoAppTarget: VIDEO_APP_HANDOFF_CONSUMER_TARGET,
    consumedHandoffAssets: {
      image: imageHandoff.manifest.assets.map((asset) => ({
        asset_id: asset.asset_id,
        path: asset.path,
        role: asset.role,
      })),
      video: videoHandoff.manifest.assets.map((asset) => ({
        asset_id: asset.asset_id,
        path: asset.path,
        role: asset.role,
      })),
    },
    exportSchemaSummary: {
      image: {
        schema_version: imageExport.export_metadata.schema_version,
        export_type: imageExport.export_metadata.export_type,
        scene_count: imageExport.export_metadata.scene_count,
      },
      video: {
        schema_version: videoExport.export_metadata.schema_version,
        export_type: videoExport.export_metadata.export_type,
        scene_count: videoExport.export_metadata.scene_count,
      },
    },
    qualityGateStatus: {
      image: {
        auditResult: imageQuality.auditResult,
        quality_score: imageQuality.quality_score,
      },
      video: {
        auditResult: videoQuality.auditResult,
        quality_score: videoQuality.quality_score,
      },
    },
    frozenAt,
  };
}

function primaryFailure(
  violations: AppConsumptionSimulationViolation[]
): AppConsumptionSimulationAuditResult {
  const priority: AppConsumptionSimulationAuditResult[] = [
    'FAIL_GENERATION_TRIGGERED',
    'FAIL_DATASET_MUTATION',
    'FAIL_CONTRACT_COMPATIBILITY',
    'FAIL_QUALITY_GATE',
    'FAIL_EXPORT_COMPATIBILITY',
    'FAIL_IMAGE_CONSUMPTION',
    'FAIL_VIDEO_CONSUMPTION',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditAppConsumptionSimulation(
  projectRoot: string
): {
  violations: AppConsumptionSimulationViolation[];
  image_consumption_simulated: boolean;
  video_consumption_simulated: boolean;
} {
  const beforeSnapshot = snapshotPaths(projectRoot, PROTECTED_RELEASE_PATHS);
  const violations: AppConsumptionSimulationViolation[] = [];

  const imageHandoff = loadImageAppHandoffPackage(projectRoot);
  const videoHandoff = loadVideoAppHandoffPackage(projectRoot);

  const imageSimulation = simulateImageAppConsumption(projectRoot);
  const videoSimulation = simulateVideoAppConsumption(projectRoot);

  violations.push(...imageSimulation.violations);
  violations.push(...videoSimulation.violations);
  violations.push(...auditHandoffContractCompatibility(projectRoot, imageHandoff, videoHandoff));
  violations.push(...auditExportPayloadCompatibility(projectRoot));
  violations.push(...auditQualityGateCompatibility(projectRoot));

  const afterSnapshot = snapshotPaths(projectRoot, PROTECTED_RELEASE_PATHS);
  violations.push(
    ...compareSnapshots(
      beforeSnapshot,
      afterSnapshot,
      'FAIL_GENERATION_TRIGGERED',
      'FAIL_DATASET_MUTATION',
      DATASET_MUTATION_PATHS
    )
  );

  return {
    violations,
    image_consumption_simulated: imageSimulation.simulated,
    video_consumption_simulated: videoSimulation.simulated,
  };
}

export function writeAppConsumptionSimulationReport(
  projectRoot: string,
  report: AppConsumptionSimulationReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function writeAppConsumptionSimulationFingerprint(
  projectRoot: string,
  fingerprint: AppConsumptionSimulationFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function runAppConsumptionSimulationAudit(
  projectRoot: string
): AppConsumptionSimulationReport {
  const auditTimestamp = new Date().toISOString();
  const simulation = auditAppConsumptionSimulation(projectRoot);
  const auditResult =
    simulation.violations.length === 0 ? 'PASS' : primaryFailure(simulation.violations);

  const report: AppConsumptionSimulationReport = {
    auditTimestamp,
    auditResult,
    violations: simulation.violations,
    image_consumption_simulated:
      simulation.image_consumption_simulated && auditResult === 'PASS',
    video_consumption_simulated:
      simulation.video_consumption_simulated && auditResult === 'PASS',
  };

  writeAppConsumptionSimulationReport(projectRoot, report);

  const fingerprint = buildAppConsumptionSimulationFingerprint(projectRoot, auditTimestamp);
  if (fingerprint) {
    writeAppConsumptionSimulationFingerprint(projectRoot, fingerprint);
  }

  return report;
}
