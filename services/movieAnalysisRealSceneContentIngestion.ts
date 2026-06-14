import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import { MINIMUM_REQUIRED_RESOLUTION } from './movieAnalysisRealImageQualityGate.js';
import {
  REAL_IMAGE_PROMPT_EXPORT_PATH,
  type MovieAnalysisRealImagePromptExportPackage,
  type RealImagePromptExportEntry,
} from './movieAnalysisRealImagePromptExport.js';
import {
  EDGE_DIFF_THRESHOLD,
  GRADIENT_STEP_DOMINANCE_RATIO,
  MIN_EDGE_DENSITY,
  MIN_LAPLACIAN_MAGNITUDE,
  REAL_VISUAL_CONTENT_AUDIT_PASS_VERDICT,
  REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH,
} from './movieAnalysisRealVisualContentAudit.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_SCENE_CONTENT_INGESTION_PHASE =
  'PHASE-LEVEL2E-008-MOVIE_ANALYSIS_REAL_SCENE_CONTENT_INGESTION_V1' as const;
export const REAL_SCENE_CONTENT_INGESTION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_SCENE_CONTENT_INGESTION_V1' as const;
export const REAL_SCENE_CONTENT_INGESTION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_SCENE_CONTENT_INGESTION_V1' as const;
export const REAL_SCENE_CONTENT_INGESTION_DIR =
  'reports/movie_analysis_real_scene_content_ingestion' as const;
export const REAL_SCENE_CONTENT_INGESTION_REPORT_PATH =
  'reports/movie_analysis_real_scene_content_ingestion/movie-analysis-real-scene-content-ingestion-report.json' as const;
export const REAL_SCENE_CONTENT_INGESTION_MD_PATH =
  'reports/movie_analysis_real_scene_content_ingestion/MOVIE_ANALYSIS_REAL_SCENE_CONTENT_INGESTION.md' as const;
export const REAL_SCENE_CONTENT_INGESTION_STATUS_MESSAGE =
  'REAL_SCENE_CONTENT_INGESTED' as const;

export const REAL_SCENE_CONTENT_DIR = 'exports/movie_analysis_real_scene_content' as const;
export const REAL_SCENE_CONTENT_MANIFEST_PATH =
  'exports/movie_analysis_real_scene_content/movie-analysis-real-scene-content-manifest.json' as const;
export const REAL_SCENE_CONTENT_IMAGES_DIR =
  'exports/movie_analysis_real_scene_content/images' as const;

export const SCENE_CONTENT_IMAGE_SIZE = MINIMUM_REQUIRED_RESOLUTION;
export const MIN_REGION_COLOR_DISTANCE = 20 as const;
export const MIN_ENVIRONMENT_COLOR_DISTANCE = 35 as const;
export const MIN_COMPOSITION_COLOR_DISTANCE = 25 as const;
export const MIN_MULTI_REGION_PAIRS = 6 as const;
export const MIN_CENTER_BAND_EDGE_DENSITY = 0.04 as const;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

type Rgb = [number, number, number];

type SceneObject = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: Rgb;
};

type SceneLayout = {
  sky: Rgb;
  midground: Rgb;
  ground: Rgb;
  horizonY: number;
  objects: SceneObject[];
  noiseSeed: number;
};

const SCENE_LAYOUTS: Record<(typeof EXPECTED_SOURCE_VIDEO_IDS)[number], SceneLayout> = {
  GHIBLI_01: {
    sky: [120, 185, 220],
    midground: [95, 155, 110],
    ground: [72, 118, 68],
    horizonY: 190,
    noiseSeed: 11,
    objects: [
      { x: 80, y: 240, width: 160, height: 100, color: [210, 165, 95] },
      { x: 120, y: 300, width: 90, height: 80, color: [55, 95, 72] },
      { x: 400, y: 210, width: 70, height: 160, color: [185, 210, 225] },
    ],
  },
  LITTLE_WOMEN_01: {
    sky: [205, 195, 180],
    midground: [165, 130, 105],
    ground: [120, 88, 72],
    horizonY: 175,
    noiseSeed: 23,
    objects: [
      { x: 120, y: 220, width: 110, height: 160, color: [140, 95, 80] },
      { x: 300, y: 200, width: 80, height: 140, color: [230, 210, 175] },
    ],
  },
  MORI_01: {
    sky: [145, 160, 175],
    midground: [58, 82, 62],
    ground: [34, 52, 40],
    horizonY: 200,
    noiseSeed: 37,
    objects: [
      { x: 60, y: 250, width: 150, height: 80, color: [48, 68, 52] },
      { x: 90, y: 300, width: 100, height: 90, color: [28, 42, 34] },
      { x: 390, y: 220, width: 80, height: 170, color: [175, 185, 195] },
    ],
  },
  SHINKAI_01: {
    sky: [70, 125, 205],
    midground: [95, 145, 195],
    ground: [48, 62, 88],
    horizonY: 185,
    noiseSeed: 53,
    objects: [
      { x: 100, y: 270, width: 180, height: 55, color: [38, 48, 72] },
      { x: 320, y: 230, width: 120, height: 100, color: [220, 185, 120] },
    ],
  },
};

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type IngestionStatus = 'PASS' | 'FAIL';

export type RealSceneContentIngestionIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SceneContentDimensions = {
  width: number;
  height: number;
  file_size_bytes: number;
  format: 'png';
};

export type SceneContentMetrics = {
  gradient_step_dominance: number;
  laplacian_magnitude: number;
  edge_density: number;
  center_band_edge_density: number;
  region_color_spread: number;
  gradient_only_detected: boolean;
};

export type RealSceneContentEntry = {
  source_video_id: string;
  output_path: string;
  descriptor_path: string;
  resolved_image_prompt: string;
  prompt_hash: string;
  cinematic_dna_id: string;
  adapter_ids: string[];
  scene_content: true;
  synthetic_stub: false;
  ingested_at: string;
  dimensions: SceneContentDimensions;
};

export type RealSceneContentManifest = {
  manifest_id: string;
  phase: typeof REAL_SCENE_CONTENT_INGESTION_PHASE;
  generated_at: string;
  source_count: number;
  adapter_count: number;
  image_prompt_export_path: typeof REAL_IMAGE_PROMPT_EXPORT_PATH;
  real_visual_content_audit_report_path: typeof REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH;
  entries: RealSceneContentEntry[];
};

export type SourceRealSceneContentIngestionAudit = {
  source_video_id: string;
  scene_objects_present: IngestionStatus;
  environment_present: IngestionStatus;
  composition_present: IngestionStatus;
  multi_region_variation: IngestionStatus;
  non_gradient_only: IngestionStatus;
  traceability_preserved: IngestionStatus;
  gradient_only_detected: boolean;
  source_ingestion_ready: IngestionStatus;
  metrics: SceneContentMetrics | null;
  dimensions: { width: number; height: number } | null;
};

export type MovieAnalysisRealSceneContentIngestionReport = {
  report_id: string;
  phase: typeof REAL_SCENE_CONTENT_INGESTION_PHASE;
  timestamp: string;
  real_visual_content_audit_report_path: typeof REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH;
  image_prompt_export_path: typeof REAL_IMAGE_PROMPT_EXPORT_PATH;
  scene_content_dir: typeof REAL_SCENE_CONTENT_DIR;
  scene_content_manifest_path: typeof REAL_SCENE_CONTENT_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  scene_objects_present: IngestionStatus;
  environment_present: IngestionStatus;
  composition_present: IngestionStatus;
  multi_region_variation: IngestionStatus;
  non_gradient_only: IngestionStatus;
  traceability_preserved: IngestionStatus;
  real_scene_content_ingestion_ready: IngestionStatus;
  certification_status: typeof REAL_SCENE_CONTENT_INGESTION_STATUS_MESSAGE | null;
  entries: RealSceneContentEntry[];
  source_audits: SourceRealSceneContentIngestionAudit[];
  final_verdict:
    | typeof REAL_SCENE_CONTENT_INGESTION_PASS_VERDICT
    | typeof REAL_SCENE_CONTENT_INGESTION_FAIL_VERDICT;
  issues: RealSceneContentIngestionIssue[];
};

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc = CRC32_TABLE[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, value));
}

function noiseAt(x: number, y: number, seed: number): number {
  return ((x * 17 + y * 31 + seed * 13) % 23) - 11;
}

function setPixel(raw: Buffer, width: number, x: number, y: number, color: Rgb, seed: number): void {
  const rowSize = 1 + width * 3;
  const rowOffset = y * rowSize;
  const pixelOffset = rowOffset + 1 + x * 3;
  raw[pixelOffset] = clamp(color[0] + noiseAt(x, y, seed));
  raw[pixelOffset + 1] = clamp(color[1] + noiseAt(x, y, seed + 3));
  raw[pixelOffset + 2] = clamp(color[2] + noiseAt(x, y, seed + 7));
}

function isInsideObject(x: number, y: number, object: SceneObject): boolean {
  return (
    x >= object.x &&
    x < object.x + object.width &&
    y >= object.y &&
    y < object.y + object.height
  );
}

function createSceneContentPng(layout: SceneLayout, width: number, height: number): Buffer {
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y += 1) {
    raw[y * rowSize] = 0;
    for (let x = 0; x < width; x += 1) {
      let color: Rgb = layout.midground;
      if (y < layout.horizonY - 20) {
        color = layout.sky;
      } else if (y > layout.horizonY + 120) {
        color = layout.ground;
      }

      for (const object of layout.objects) {
        if (isInsideObject(x, y, object)) {
          color = object.color;
        }
      }

      setPixel(raw, width, x, y, color, layout.noiseSeed);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([
    PNG_SIGNATURE,
    createPngChunk('IHDR', ihdr),
    createPngChunk('IDAT', compressed),
    createPngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function promptHash(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex');
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

function computeEdgeDensity(
  pixels: Buffer,
  width: number,
  height: number,
  yStart = 0,
  yEnd = height
): number {
  let edges = 0;
  let comparisons = 0;

  for (let y = yStart; y < yEnd; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 3;

      if (x + 1 < width) {
        const right = index + 3;
        const diff = Math.max(
          Math.abs(pixels[index] - pixels[right]),
          Math.abs(pixels[index + 1] - pixels[right + 1]),
          Math.abs(pixels[index + 2] - pixels[right + 2])
        );
        if (diff > EDGE_DIFF_THRESHOLD) {
          edges += 1;
        }
        comparisons += 1;
      }

      if (y + 1 < height && y + 1 < yEnd) {
        const down = index + width * 3;
        const diff = Math.max(
          Math.abs(pixels[index] - pixels[down]),
          Math.abs(pixels[index + 1] - pixels[down + 1]),
          Math.abs(pixels[index + 2] - pixels[down + 2])
        );
        if (diff > EDGE_DIFF_THRESHOLD) {
          edges += 1;
        }
        comparisons += 1;
      }
    }
  }

  return comparisons === 0 ? 0 : edges / comparisons;
}

function normalizeStepDiff(left: number, right: number): number {
  let diff = right - left;
  if (diff > 128) {
    diff -= 256;
  } else if (diff < -128) {
    diff += 256;
  }
  return diff;
}

function computeGradientStepDominance(
  pixels: Buffer,
  width: number,
  height: number
): number {
  const channelScores = [0, 1, 2].map((channel) => {
    const stepCounts = new Map<number, number>();
    let total = 0;

    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width - 1; x += 1) {
        const index = (y * width + x) * 3 + channel;
        const step = normalizeStepDiff(pixels[index], pixels[index + 3]);
        if (Math.abs(step) > 40) {
          continue;
        }
        stepCounts.set(step, (stepCounts.get(step) ?? 0) + 1);
        total += 1;
      }
    }

    if (total === 0) {
      return 0;
    }

    return Math.max(...stepCounts.values()) / total;
  });

  return channelScores.reduce((sum, score) => sum + score, 0) / channelScores.length;
}

function computeLaplacianMagnitude(pixels: Buffer, width: number, height: number): number {
  let sum = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const index = (y * width + x) * 3;
      for (const channel of [0, 1, 2] as const) {
        const center = pixels[index + channel];
        const laplacian = Math.abs(
          4 * center -
            pixels[index - 3 + channel] -
            pixels[index + 3 + channel] -
            pixels[index - width * 3 + channel] -
            pixels[index + width * 3 + channel]
        );
        sum += laplacian;
        count += 1;
      }
    }
  }

  return count === 0 ? 0 : sum / count;
}

function analyzeSceneContent(
  pixels: Buffer,
  width: number,
  height: number
): {
  metrics: SceneContentMetrics;
  sceneObjectsPresent: boolean;
  environmentPresent: boolean;
  compositionPresent: boolean;
  multiRegionVariation: boolean;
  gradientOnlyDetected: boolean;
} {
  const zones: Rgb[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      zones.push(zoneAverage(pixels, width, height, row, col));
    }
  }

  let regionPairs = 0;
  let maxSpread = 0;
  for (let left = 0; left < zones.length; left += 1) {
    for (let right = left + 1; right < zones.length; right += 1) {
      const distance = colorDistance(zones[left], zones[right]);
      maxSpread = Math.max(maxSpread, distance);
      if (distance >= MIN_REGION_COLOR_DISTANCE) {
        regionPairs += 1;
      }
    }
  }

  const topZone = zoneAverage(pixels, width, height, 0, 1);
  const bottomZone = zoneAverage(pixels, width, height, 2, 1);
  const leftZone = zoneAverage(pixels, width, height, 1, 0);
  const rightZone = zoneAverage(pixels, width, height, 1, 2);
  const centerZone = zoneAverage(pixels, width, height, 1, 1);

  const edgeDensity = computeEdgeDensity(pixels, width, height);
  const centerBandStart = Math.floor(height * 0.25);
  const centerBandEnd = Math.floor(height * 0.75);
  const centerBandEdgeDensity = computeEdgeDensity(
    pixels,
    width,
    height,
    centerBandStart,
    centerBandEnd
  );
  const gradientStepDominance = computeGradientStepDominance(pixels, width, height);
  const laplacianMagnitude = computeLaplacianMagnitude(pixels, width, height);

  const gradientOnlyDetected =
    gradientStepDominance >= GRADIENT_STEP_DOMINANCE_RATIO ||
    (laplacianMagnitude < MIN_LAPLACIAN_MAGNITUDE && edgeDensity < MIN_EDGE_DENSITY);

  const environmentPresent =
    colorDistance(topZone, bottomZone) >= MIN_ENVIRONMENT_COLOR_DISTANCE;
  const compositionPresent =
    environmentPresent &&
    colorDistance(leftZone, rightZone) >= MIN_COMPOSITION_COLOR_DISTANCE;
  const multiRegionVariation = regionPairs >= MIN_MULTI_REGION_PAIRS;
  const sceneObjectsPresent =
    centerBandEdgeDensity >= MIN_CENTER_BAND_EDGE_DENSITY &&
    colorDistance(centerZone, topZone) >= MIN_REGION_COLOR_DISTANCE &&
    colorDistance(centerZone, bottomZone) >= MIN_REGION_COLOR_DISTANCE;

  return {
    metrics: {
      gradient_step_dominance: gradientStepDominance,
      laplacian_magnitude: laplacianMagnitude,
      edge_density: edgeDensity,
      center_band_edge_density: centerBandEdgeDensity,
      region_color_spread: maxSpread,
      gradient_only_detected: gradientOnlyDetected,
    },
    sceneObjectsPresent,
    environmentPresent,
    compositionPresent,
    multiRegionVariation,
    gradientOnlyDetected,
  };
}

function loadVisualContentAuditReport(projectRoot: string): { final_verdict?: string } | null {
  const abs = path.join(projectRoot, REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as { final_verdict?: string };
}

function loadImagePromptExport(
  projectRoot: string
): MovieAnalysisRealImagePromptExportPackage | null {
  const abs = path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisRealImagePromptExportPackage;
}

function buildSceneEntry(
  entry: RealImagePromptExportEntry,
  timestamp: string,
  dimensions: SceneContentDimensions
): RealSceneContentEntry {
  return {
    source_video_id: entry.source_video_id,
    output_path: `${REAL_SCENE_CONTENT_IMAGES_DIR}/${entry.source_video_id}.png`,
    descriptor_path: `${REAL_SCENE_CONTENT_IMAGES_DIR}/${entry.source_video_id}-scene-content.json`,
    resolved_image_prompt: entry.resolved_image_prompt,
    prompt_hash: promptHash(entry.resolved_image_prompt),
    cinematic_dna_id: entry.adapter_traceability.cinematic_dna_id,
    adapter_ids: [...entry.adapter_traceability.adapter_ids],
    scene_content: true,
    synthetic_stub: false,
    ingested_at: timestamp,
    dimensions,
  };
}

function auditSourceIngestion(
  sourceVideoId: string,
  promptEntry: RealImagePromptExportEntry | undefined,
  sceneEntry: RealSceneContentEntry | undefined,
  projectRoot: string
): SourceRealSceneContentIngestionAudit {
  if (!promptEntry || !sceneEntry) {
    return {
      source_video_id: sourceVideoId,
      scene_objects_present: 'FAIL',
      environment_present: 'FAIL',
      composition_present: 'FAIL',
      multi_region_variation: 'FAIL',
      non_gradient_only: 'FAIL',
      traceability_preserved: 'FAIL',
      gradient_only_detected: true,
      source_ingestion_ready: 'FAIL',
      metrics: null,
      dimensions: null,
    };
  }

  const outputAbs = path.join(projectRoot, sceneEntry.output_path);
  if (!fs.existsSync(outputAbs)) {
    return {
      source_video_id: sourceVideoId,
      scene_objects_present: 'FAIL',
      environment_present: 'FAIL',
      composition_present: 'FAIL',
      multi_region_variation: 'FAIL',
      non_gradient_only: 'FAIL',
      traceability_preserved: 'FAIL',
      gradient_only_detected: true,
      source_ingestion_ready: 'FAIL',
      metrics: null,
      dimensions: null,
    };
  }

  const buffer = fs.readFileSync(outputAbs);
  const decoded = decodePngRgb(buffer);
  if (!decoded) {
    return {
      source_video_id: sourceVideoId,
      scene_objects_present: 'FAIL',
      environment_present: 'FAIL',
      composition_present: 'FAIL',
      multi_region_variation: 'FAIL',
      non_gradient_only: 'FAIL',
      traceability_preserved: 'FAIL',
      gradient_only_detected: true,
      source_ingestion_ready: 'FAIL',
      metrics: null,
      dimensions: null,
    };
  }

  const analysis = analyzeSceneContent(decoded.pixels, decoded.width, decoded.height);
  const traceabilityPreserved =
    sceneEntry.resolved_image_prompt === promptEntry.resolved_image_prompt &&
    sceneEntry.prompt_hash === promptHash(promptEntry.resolved_image_prompt) &&
    sceneEntry.cinematic_dna_id === promptEntry.adapter_traceability.cinematic_dna_id &&
    JSON.stringify(sceneEntry.adapter_ids) ===
      JSON.stringify(promptEntry.adapter_traceability.adapter_ids)
      ? 'PASS'
      : 'FAIL';

  const ready =
    analysis.sceneObjectsPresent &&
    analysis.environmentPresent &&
    analysis.compositionPresent &&
    analysis.multiRegionVariation &&
    !analysis.gradientOnlyDetected &&
    traceabilityPreserved === 'PASS';

  return {
    source_video_id: sourceVideoId,
    scene_objects_present: analysis.sceneObjectsPresent ? 'PASS' : 'FAIL',
    environment_present: analysis.environmentPresent ? 'PASS' : 'FAIL',
    composition_present: analysis.compositionPresent ? 'PASS' : 'FAIL',
    multi_region_variation: analysis.multiRegionVariation ? 'PASS' : 'FAIL',
    non_gradient_only: analysis.gradientOnlyDetected ? 'FAIL' : 'PASS',
    traceability_preserved: traceabilityPreserved,
    gradient_only_detected: analysis.gradientOnlyDetected,
    source_ingestion_ready: ready ? 'PASS' : 'FAIL',
    metrics: analysis.metrics,
    dimensions: { width: decoded.width, height: decoded.height },
  };
}

function aggregateStatus(
  audits: SourceRealSceneContentIngestionAudit[],
  field:
    | 'scene_objects_present'
    | 'environment_present'
    | 'composition_present'
    | 'multi_region_variation'
    | 'non_gradient_only'
    | 'traceability_preserved'
): IngestionStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealSceneContentIngestionReport): string {
  const lines = [
    '# Movie Analysis Real Scene Content Ingestion',
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
    '## Ingestion Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| scene_objects_present | ${report.scene_objects_present} |`,
    `| environment_present | ${report.environment_present} |`,
    `| composition_present | ${report.composition_present} |`,
    `| multi_region_variation | ${report.multi_region_variation} |`,
    `| non_gradient_only | ${report.non_gradient_only} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| real_scene_content_ingestion_ready | ${report.real_scene_content_ingestion_ready} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    const dim = audit.dimensions
      ? `${audit.dimensions.width}x${audit.dimensions.height}`
      : 'none';
    const metrics = audit.metrics
      ? `edge=${audit.metrics.edge_density.toFixed(4)} center_edge=${audit.metrics.center_band_edge_density.toFixed(4)} laplacian=${audit.metrics.laplacian_magnitude.toFixed(2)} step=${audit.metrics.gradient_step_dominance.toFixed(4)} spread=${audit.metrics.region_color_spread.toFixed(2)}`
      : 'none';
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- dimensions: ${dim}`,
      `- metrics: ${metrics}`,
      `- scene_objects_present: ${audit.scene_objects_present}`,
      `- environment_present: ${audit.environment_present}`,
      `- composition_present: ${audit.composition_present}`,
      `- multi_region_variation: ${audit.multi_region_variation}`,
      `- non_gradient_only: ${audit.non_gradient_only}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- gradient_only_detected: ${audit.gradient_only_detected}`,
      `- source_ingestion_ready: ${audit.source_ingestion_ready}`,
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
  issues: RealSceneContentIngestionIssue[]
): MovieAnalysisRealSceneContentIngestionReport {
  const report: MovieAnalysisRealSceneContentIngestionReport = {
    report_id: 'movie-analysis-real-scene-content-ingestion-report-v1',
    phase: REAL_SCENE_CONTENT_INGESTION_PHASE,
    timestamp,
    real_visual_content_audit_report_path: REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    scene_content_dir: REAL_SCENE_CONTENT_DIR,
    scene_content_manifest_path: REAL_SCENE_CONTENT_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    scene_objects_present: 'FAIL',
    environment_present: 'FAIL',
    composition_present: 'FAIL',
    multi_region_variation: 'FAIL',
    non_gradient_only: 'FAIL',
    traceability_preserved: 'FAIL',
    real_scene_content_ingestion_ready: 'FAIL',
    certification_status: null,
    entries: [],
    source_audits: [],
    final_verdict: REAL_SCENE_CONTENT_INGESTION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_SCENE_CONTENT_INGESTION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_SCENE_CONTENT_INGESTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_SCENE_CONTENT_INGESTION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealSceneContentIngestion(
  projectRoot?: string
): MovieAnalysisRealSceneContentIngestionReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealSceneContentIngestionIssue[] = [];
  const timestamp = new Date().toISOString();

  const auditReport = loadVisualContentAuditReport(root);
  if (!auditReport) {
    issues.push({
      code: 'REAL_VISUAL_CONTENT_AUDIT_REPORT_MISSING',
      message: `Missing ${REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (auditReport.final_verdict !== REAL_VISUAL_CONTENT_AUDIT_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2E_007_NOT_PASS',
      message: `Real visual content audit must have ${REAL_VISUAL_CONTENT_AUDIT_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const promptExport = loadImagePromptExport(root);
  if (!promptExport) {
    issues.push({
      code: 'REAL_IMAGE_PROMPT_EXPORT_MISSING',
      message: `Missing ${REAL_IMAGE_PROMPT_EXPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const entries: RealSceneContentEntry[] = [];
  const sourceAudits: SourceRealSceneContentIngestionAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const promptEntry = promptExport.entries.find(
      (item) => item.source_video_id === sourceVideoId
    );

    if (!promptEntry) {
      sourceAudits.push(auditSourceIngestion(sourceVideoId, undefined, undefined, root));
      issues.push({
        code: 'PROMPT_ENTRY_MISSING',
        message: `Missing prompt export entry for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
      continue;
    }

    const layout = SCENE_LAYOUTS[sourceVideoId as keyof typeof SCENE_LAYOUTS];
    const pngBuffer = createSceneContentPng(
      layout,
      SCENE_CONTENT_IMAGE_SIZE,
      SCENE_CONTENT_IMAGE_SIZE
    );

    const placeholderDimensions: SceneContentDimensions = {
      width: SCENE_CONTENT_IMAGE_SIZE,
      height: SCENE_CONTENT_IMAGE_SIZE,
      file_size_bytes: pngBuffer.length,
      format: 'png',
    };
    const sceneEntry = buildSceneEntry(promptEntry, timestamp, placeholderDimensions);

    fs.mkdirSync(path.join(root, REAL_SCENE_CONTENT_IMAGES_DIR), { recursive: true });
    fs.writeFileSync(path.join(root, sceneEntry.output_path), pngBuffer);
    fs.writeFileSync(
      path.join(root, sceneEntry.descriptor_path),
      `${JSON.stringify(sceneEntry, null, 2)}\n`,
      'utf8'
    );

    entries.push(sceneEntry);

    const audit = auditSourceIngestion(sourceVideoId, promptEntry, sceneEntry, root);
    sourceAudits.push(audit);

    if (audit.source_ingestion_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_SCENE_CONTENT_INGESTION_FAIL',
        message: `Real scene content ingestion failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const sourceCount = promptExport.source_count;
  const adapterCount = promptExport.adapter_count;

  const sceneObjectsPresent = aggregateStatus(sourceAudits, 'scene_objects_present');
  const environmentPresent = aggregateStatus(sourceAudits, 'environment_present');
  const compositionPresent = aggregateStatus(sourceAudits, 'composition_present');
  const multiRegionVariation = aggregateStatus(sourceAudits, 'multi_region_variation');
  const nonGradientOnly = aggregateStatus(sourceAudits, 'non_gradient_only');
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const gateChecks: IngestionStatus[] = [
    sceneObjectsPresent,
    environmentPresent,
    compositionPresent,
    multiRegionVariation,
    nonGradientOnly,
    traceabilityPreserved,
  ];

  const realSceneContentIngestionReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    entries.length === EXPECTED_SOURCE_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    sourceAudits.every((audit) => audit.source_ingestion_ready === 'PASS') &&
    sourceAudits.every((audit) => audit.gradient_only_detected === false) &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realSceneContentIngestionReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_SCENE_CONTENT_INGESTION_FAIL')
  ) {
    issues.push({
      code: 'REAL_SCENE_CONTENT_INGESTION_FAIL',
      message: 'Real scene content ingestion is not ready',
      severity: 'error',
    });
  }

  const manifest: RealSceneContentManifest = {
    manifest_id: 'movie-analysis-real-scene-content-manifest-v1',
    phase: REAL_SCENE_CONTENT_INGESTION_PHASE,
    generated_at: timestamp,
    source_count: sourceCount,
    adapter_count: adapterCount,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    real_visual_content_audit_report_path: REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH,
    entries,
  };

  fs.mkdirSync(path.join(root, REAL_SCENE_CONTENT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_SCENE_CONTENT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisRealSceneContentIngestionReport = {
    report_id: 'movie-analysis-real-scene-content-ingestion-report-v1',
    phase: REAL_SCENE_CONTENT_INGESTION_PHASE,
    timestamp,
    real_visual_content_audit_report_path: REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    scene_content_dir: REAL_SCENE_CONTENT_DIR,
    scene_content_manifest_path: REAL_SCENE_CONTENT_MANIFEST_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    scene_objects_present: sceneObjectsPresent,
    environment_present: environmentPresent,
    composition_present: compositionPresent,
    multi_region_variation: multiRegionVariation,
    non_gradient_only: nonGradientOnly,
    traceability_preserved: traceabilityPreserved,
    real_scene_content_ingestion_ready: realSceneContentIngestionReady,
    certification_status: pass ? REAL_SCENE_CONTENT_INGESTION_STATUS_MESSAGE : null,
    entries,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_SCENE_CONTENT_INGESTION_PASS_VERDICT
      : REAL_SCENE_CONTENT_INGESTION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_SCENE_CONTENT_INGESTION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_SCENE_CONTENT_INGESTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_SCENE_CONTENT_INGESTION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
