import fs from 'node:fs';
import path from 'node:path';
import {
  buildImageDatasetExport,
  IMAGE_DATASET_EXPORT_JSON_PATH,
  type ImageDatasetExport,
} from './imageDatasetExport.js';

const EXPORT_FILE = 'image-dataset-export.json';

export function writeImageDatasetExportFile(
  projectRoot: string,
  exportData: ImageDatasetExport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const exportPath = path.join(exportsDir, EXPORT_FILE);
  fs.writeFileSync(exportPath, `${JSON.stringify(exportData, null, 2)}\n`, 'utf8');
  return exportPath;
}

export function loadImageDatasetExport(projectRoot: string): ImageDatasetExport | null {
  const exportPath = path.join(projectRoot, 'exports', EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return null;
  return JSON.parse(fs.readFileSync(exportPath, 'utf8')) as ImageDatasetExport;
}

export function ensureImageDatasetExport(projectRoot: string): ImageDatasetExport {
  const existing = loadImageDatasetExport(projectRoot);
  if (existing) return existing;

  const exportData = buildImageDatasetExport(new Date().toISOString());
  writeImageDatasetExportFile(projectRoot, exportData);
  return exportData;
}
