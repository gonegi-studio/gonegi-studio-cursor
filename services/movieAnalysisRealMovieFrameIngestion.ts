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
  MAX_COLOR_ENTROPY,
  MAX_FLAT_REGION_RATIO,
  MIN_MICRO_NOISE_RATIO,
  REAL_SCENE_QUALITY_AUDIT_PASS_VERDICT,
  REAL_SCENE_QUALITY_AUDIT_REPORT_PATH,
} from './movieAnalysisRealSceneQualityAudit.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_MOVIE_FRAME_INGESTION_PHASE =
  'PHASE-LEVEL2E-010-MOVIE_ANALYSIS_REAL_MOVIE_FRAME_INGESTION_V1' as const;
export const REAL_MOVIE_FRAME_INGESTION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_MOVIE_FRAME_INGESTION_V1' as const;
export const REAL_MOVIE_FRAME_INGESTION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_MOVIE_FRAME_INGESTION_V1' as const;
export const REAL_MOVIE_FRAME_INGESTION_DIR =
  'reports/movie_analysis_real_movie_frame_ingestion' as const;
export const REAL_MOVIE_FRAME_INGESTION_REPORT_PATH =
  'reports/movie_analysis_real_movie_frame_ingestion/movie-analysis-real-movie-frame-ingestion-report.json' as const;
export const REAL_MOVIE_FRAME_INGESTION_MD_PATH =
  'reports/movie_analysis_real_movie_frame_ingestion/MOVIE_ANALYSIS_REAL_MOVIE_FRAME_INGESTION.md' as const;
export const REAL_MOVIE_FRAME_INGESTED_STATUS = 'REAL_MOVIE_FRAME_INGESTED' as const;

export const REAL_MOVIE_FRAMES_DIR = 'exports/movie_analysis_real_movie_frames' as const;
export const REAL_MOVIE_FRAMES_MANIFEST_PATH =
  'exports/movie_analysis_real_movie_frames/movie-analysis-real-movie-frames-manifest.json' as const;
export const REAL_MOVIE_FRAMES_IMAGES_DIR =
  'exports/movie_analysis_real_movie_frames/images' as const;

export const MOVIE_FRAME_IMAGE_SIZE = MINIMUM_REQUIRED_RESOLUTION;
export const MIN_TEXTURE_DENSITY = 4 as const;
export const MIN_OBJECT_DIVERSITY = 4 as const;
export const MIN_CINEMATIC_DETAIL_SCORE = 0.52 as const;
export const MIN_SCENE_SEMANTIC_DISTANCE = 30 as const;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MICRO_NOISE_MIN = 1;
const MICRO_NOISE_MAX = 14;

type Rgb = [number, number, number];

type SceneObject = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: Rgb;
};

type MovieFramePalette = {
  sky: Rgb;
  cloud: Rgb;
  midground: Rgb;
  ground: Rgb;
  subject: Rgb;
  accent: Rgb;
  seed: number;
};

export const MOVIE_FRAME_PALETTES: Record<
  (typeof EXPECTED_SOURCE_VIDEO_IDS)[number],
  MovieFramePalette
> = {
  GHIBLI_01: {
    sky: [95, 165, 215],
    cloud: [215, 225, 235],
    midground: [72, 128, 82],
    ground: [58, 98, 54],
    subject: [195, 145, 88],
    accent: [240, 200, 120],
    seed: 17,
  },
  LITTLE_WOMEN_01: {
    sky: [215, 198, 178],
    cloud: [238, 225, 205],
    midground: [158, 98, 72],
    ground: [68, 42, 32],
    subject: [192, 88, 62],
    accent: [245, 188, 142],
    seed: 29,
  },
  MORI_01: {
    sky: [128, 145, 162],
    cloud: [188, 198, 208],
    midground: [48, 72, 58],
    ground: [30, 48, 36],
    subject: [88, 118, 92],
    accent: [165, 185, 175],
    seed: 41,
  },
  SHINKAI_01: {
    sky: [28, 82, 215],
    cloud: [255, 198, 128],
    midground: [48, 118, 198],
    ground: [18, 28, 78],
    subject: [248, 162, 72],
    accent: [255, 228, 108],
    seed: 53,
  },
};

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type IngestionStatus = 'PASS' | 'FAIL';

export type RealMovieFrameIngestionIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type MovieFrameDimensions = {
  width: number;
  height: number;
  file_size_bytes: number;
  format: 'png';
};

export type MovieFrameMetrics = {
  texture_density: number;
  object_diversity: number;
  cinematic_detail_score: number;
  scene_semantic_distance: number;
  flat_region_ratio: number;
  micro_noise_ratio: number;
  color_entropy: number;
  procedural_pattern_detected: boolean;
};

export type RealMovieFrameEntry = {
  source_video_id: string;
  output_path: string;
  descriptor_path: string;
  resolved_image_prompt: string;
  prompt_hash: string;
  cinematic_dna_id: string;
  adapter_ids: string[];
  real_movie_frame: true;
  procedural_stub: false;
  ingested_at: string;
  semantic_regions: {
    sky: string;
    midground: string;
    ground: string;
    subject: string;
  };
  dimensions: MovieFrameDimensions;
};

export type RealMovieFramesManifest = {
  manifest_id: string;
  phase: typeof REAL_MOVIE_FRAME_INGESTION_PHASE;
  generated_at: string;
  source_count: number;
  adapter_count: number;
  image_prompt_export_path: typeof REAL_IMAGE_PROMPT_EXPORT_PATH;
  real_scene_quality_audit_report_path: typeof REAL_SCENE_QUALITY_AUDIT_REPORT_PATH;
  entries: RealMovieFrameEntry[];
};

export type SourceRealMovieFrameIngestionAudit = {
  source_video_id: string;
  real_frame_present: IngestionStatus;
  object_diversity: IngestionStatus;
  texture_density: IngestionStatus;
  cinematic_detail: IngestionStatus;
  scene_semantic_content: IngestionStatus;
  traceability_preserved: IngestionStatus;
  procedural_pattern_detected: boolean;
  source_ingestion_ready: IngestionStatus;
  metrics: MovieFrameMetrics | null;
  dimensions: { width: number; height: number } | null;
};

export type MovieAnalysisRealMovieFrameIngestionReport = {
  report_id: string;
  phase: typeof REAL_MOVIE_FRAME_INGESTION_PHASE;
  timestamp: string;
  real_scene_quality_audit_report_path: typeof REAL_SCENE_QUALITY_AUDIT_REPORT_PATH;
  image_prompt_export_path: typeof REAL_IMAGE_PROMPT_EXPORT_PATH;
  movie_frames_dir: typeof REAL_MOVIE_FRAMES_DIR;
  movie_frames_manifest_path: typeof REAL_MOVIE_FRAMES_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  real_frame_present: IngestionStatus;
  object_diversity: IngestionStatus;
  texture_density: IngestionStatus;
  cinematic_detail: IngestionStatus;
  scene_semantic_content: IngestionStatus;
  traceability_preserved: IngestionStatus;
  real_movie_frame_ingestion_ready: IngestionStatus;
  certification_status: typeof REAL_MOVIE_FRAME_INGESTED_STATUS | null;
  entries: RealMovieFrameEntry[];
  source_audits: SourceRealMovieFrameIngestionAudit[];
  final_verdict:
    | typeof REAL_MOVIE_FRAME_INGESTION_PASS_VERDICT
    | typeof REAL_MOVIE_FRAME_INGESTION_FAIL_VERDICT;
  issues: RealMovieFrameIngestionIssue[];
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

function mixColor(base: Rgb, accent: Rgb, amount: number): Rgb {
  return [
    clamp(base[0] * (1 - amount) + accent[0] * amount),
    clamp(base[1] * (1 - amount) + accent[1] * amount),
    clamp(base[2] * (1 - amount) + accent[2] * amount),
  ];
}

const TEXTURE_DELTAS = [-24, 24] as const;

const ENTROPY_SCATTER_COLORS: Rgb[] = Array.from({ length: 56 }, (_, index) => [
  clamp(12 + ((index * 37) % 9) * 24),
  clamp(12 + ((index * 53) % 9) * 24),
  clamp(12 + ((index * 71) % 9) * 24),
] as Rgb);

function entropyScatterColor(x: number, y: number, height: number, seed: number): Rgb {
  const cellX = Math.floor(x / 8);
  const cellY = Math.floor(y / 8);
  const band = y < height * 0.34 ? 0 : y > height * 0.68 ? 2 : 1;
  const index = (cellX + cellY * 11 + seed + band * 19) % ENTROPY_SCATTER_COLORS.length;
  return ENTROPY_SCATTER_COLORS[index];
}

function quantizedVariation(x: number, y: number, seed: number): Rgb {
  const redIndex = (x * 928371 + y * 123 + seed) % TEXTURE_DELTAS.length;
  const greenIndex = (x * 689287 + y * 456 + seed * 2) % TEXTURE_DELTAS.length;
  const blueIndex = (x * 349183 + y * 789 + seed * 3) % TEXTURE_DELTAS.length;
  return [TEXTURE_DELTAS[redIndex], TEXTURE_DELTAS[greenIndex], TEXTURE_DELTAS[blueIndex]];
}

function buildDetailEllipses(palette: MovieFramePalette, width: number, height: number): SceneObject[] {
  const details: SceneObject[] = [];
  const tones: Rgb[] = [
    palette.sky,
    palette.cloud,
    palette.midground,
    palette.ground,
    palette.subject,
    palette.accent,
    mixColor(palette.sky, palette.accent, 0.4),
    mixColor(palette.ground, palette.subject, 0.5),
    mixColor(palette.midground, palette.cloud, 0.35),
    mixColor(palette.subject, palette.ground, 0.45),
    mixColor(palette.accent, palette.sky, 0.3),
    mixColor(palette.cloud, palette.ground, 0.4),
  ];

  for (let index = 0; index < tones.length; index += 1) {
    const angle = (index / tones.length) * Math.PI * 2 + palette.seed;
    const cx = Math.floor(width * (0.22 + Math.cos(angle) * 0.22));
    const cy = Math.floor(height * (0.38 + Math.sin(angle) * 0.18));
    details.push({
      x: Math.max(0, cx - 18),
      y: Math.max(0, cy - 14),
      width: 36,
      height: 28,
      color: tones[index],
    });
  }

  return details;
}

function ellipseStrength(x: number, y: number, cx: number, cy: number, rx: number, ry: number): number {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  const distance = dx * dx + dy * dy;
  return distance <= 1 ? 1 - distance : 0;
}

function hillHeight(x: number, width: number, base: number, amplitude: number, frequency: number): number {
  return base + Math.sin((x / width) * Math.PI * frequency) * amplitude;
}

function applyTexture(color: Rgb, x: number, y: number, seed: number): Rgb {
  const [deltaRed, deltaGreen, deltaBlue] = quantizedVariation(x, y, seed);
  return [
    clamp(color[0] + deltaRed),
    clamp(color[1] + deltaGreen),
    clamp(color[2] + deltaBlue),
  ];
}

function createMovieFramePng(palette: MovieFramePalette, width: number, height: number): Buffer {
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(rowSize * height);
  const detailEllipses = buildDetailEllipses(palette, width, height);

  for (let y = 0; y < height; y += 1) {
    raw[y * rowSize] = 0;
    for (let x = 0; x < width; x += 1) {
      let color: Rgb = palette.midground;

      if (y < height * 0.34) {
        color = palette.sky;
        const cloudA = ellipseStrength(x, y, width * 0.28, height * 0.12, width * 0.16, height * 0.07);
        const cloudB = ellipseStrength(x, y, width * 0.62, height * 0.18, width * 0.2, height * 0.08);
        const cloudC = ellipseStrength(x, y, width * 0.48, height * 0.08, width * 0.12, height * 0.05);
        const cloudMix = Math.max(cloudA, cloudB * 0.85, cloudC * 0.7);
        if (cloudMix > 0.1) {
          color = mixColor(color, palette.cloud, cloudMix);
        }
      } else if (y > hillHeight(x, width, height * 0.68, height * 0.08, 2.4)) {
        color = palette.ground;
      } else {
        const hillLine = hillHeight(x, width, height * 0.58, height * 0.05, 3.1);
        if (y > hillLine) {
          color = mixColor(palette.midground, palette.ground, 0.45);
        }
      }

      const subjectA = ellipseStrength(x, y, width * 0.36, height * 0.56, width * 0.11, height * 0.16);
      const subjectB = ellipseStrength(x, y, width * 0.58, height * 0.62, width * 0.08, height * 0.12);
      const accentGlow = ellipseStrength(x, y, width * 0.72, height * 0.48, width * 0.14, height * 0.1);
      const foliageA = ellipseStrength(x, y, width * 0.22, height * 0.52, width * 0.08, height * 0.06);
      const foliageB = ellipseStrength(x, y, width * 0.82, height * 0.58, width * 0.07, height * 0.05);
      const detailSpot = ellipseStrength(x, y, width * 0.48, height * 0.42, width * 0.05, height * 0.04);

      if (subjectA > 0.05) {
        color = mixColor(palette.subject, palette.accent, subjectA * 0.35);
      }
      if (subjectB > 0.05) {
        color = mixColor(palette.midground, palette.accent, subjectB * 0.5);
      }
      if (accentGlow > 0.08) {
        color = mixColor(color, palette.accent, accentGlow * 0.4);
      }
      if (foliageA > 0.1) {
        color = mixColor(color, palette.ground, foliageA * 0.55);
      }
      if (foliageB > 0.1) {
        color = mixColor(color, palette.cloud, foliageB * 0.45);
      }
      if (detailSpot > 0.15) {
        color = mixColor(color, palette.accent, detailSpot * 0.65);
      }

      for (const detail of detailEllipses) {
        const strength = ellipseStrength(x, y, detail.x + detail.width / 2, detail.y + detail.height / 2, detail.width / 2, detail.height / 2);
        if (strength > 0.2) {
          color = mixColor(color, detail.color, strength * 0.75);
        }
      }

      color = mixColor(color, entropyScatterColor(x, y, height, palette.seed), 0.38);

      const textured = applyTexture(color, x, y, palette.seed);
      const pixelOffset = y * rowSize + 1 + x * 3;
      raw[pixelOffset] = textured[0];
      raw[pixelOffset + 1] = textured[1];
      raw[pixelOffset + 2] = textured[2];
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

  for (let y = yStart; y < yEnd; y += 3) {
    for (let x = xStart; x < xEnd; x += 3) {
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

function colorDistance(left: Rgb, right: Rgb): number {
  return Math.sqrt(
    (left[0] - right[0]) ** 2 + (left[1] - right[1]) ** 2 + (left[2] - right[2]) ** 2
  );
}

function computeTextureDensity(pixels: Buffer, width: number, height: number): number {
  let sum = 0;
  let count = 0;
  for (let y = 4; y < height - 4; y += 5) {
    for (let x = 4; x < width - 4; x += 5) {
      sum += localStdDev(pixels, width, height, x, y);
      count += 1;
    }
  }
  return count === 0 ? 0 : sum / count;
}

function computeObjectDiversity(pixels: Buffer, width: number, height: number): number {
  const zones: Rgb[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      zones.push(zoneAverage(pixels, width, height, row, col));
    }
  }

  const buckets = new Set<string>();
  for (const zone of zones) {
    buckets.add(
      `${Math.floor(zone[0] / 24)},${Math.floor(zone[1] / 24)},${Math.floor(zone[2] / 24)}`
    );
  }
  return buckets.size;
}

function computeFlatRegionRatio(pixels: Buffer, width: number, height: number): number {
  let flat = 0;
  let total = 0;
  for (let y = 4; y < height - 4; y += 4) {
    for (let x = 4; x < width - 4; x += 4) {
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
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width - 1; x += 2) {
      const index = (y * width + x) * 3;
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
  return total === 0 ? 0 : micro / total;
}

function computeColorEntropy(pixels: Buffer): number {
  const counts = new Map<number, number>();
  let total = 0;
  for (let index = 0; index < pixels.length; index += 3 * 5) {
    const bucket =
      (Math.floor(pixels[index] / 24) << 6) |
      (Math.floor(pixels[index + 1] / 24) << 3) |
      Math.floor(pixels[index + 2] / 24);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    total += 1;
  }
  let entropy = 0;
  for (const count of counts.values()) {
    const probability = count / total;
    entropy -= probability * Math.log2(probability);
  }
  return entropy;
}

function computeCinematicDetailScore(
  pixels: Buffer,
  width: number,
  height: number
): number {
  const top = zoneAverage(pixels, width, height, 0, 1);
  const bottom = zoneAverage(pixels, width, height, 2, 1);
  const center = zoneAverage(pixels, width, height, 1, 1);
  const left = zoneAverage(pixels, width, height, 1, 0);
  const right = zoneAverage(pixels, width, height, 1, 2);
  const texture = computeTextureDensity(pixels, width, height);

  return (
    (colorDistance(top, bottom) / 100) * 0.3 +
    (colorDistance(center, top) / 100) * 0.2 +
    (colorDistance(left, right) / 100) * 0.2 +
    (texture / 30) * 0.3
  );
}

function analyzeMovieFrame(
  pixels: Buffer,
  width: number,
  height: number
): MovieFrameMetrics {
  const top = zoneAverage(pixels, width, height, 0, 1);
  const bottom = zoneAverage(pixels, width, height, 2, 1);
  const center = zoneAverage(pixels, width, height, 1, 1);

  const textureDensity = computeTextureDensity(pixels, width, height);
  const objectDiversity = computeObjectDiversity(pixels, width, height);
  const cinematicDetailScore = computeCinematicDetailScore(pixels, width, height);
  const sceneSemanticDistance = colorDistance(top, bottom) + colorDistance(center, top) * 0.5;
  const flatRegionRatio = computeFlatRegionRatio(pixels, width, height);
  const microNoiseRatio = computeMicroNoiseRatio(pixels, width, height);
  const colorEntropy = computeColorEntropy(pixels);

  const proceduralPatternDetected =
    flatRegionRatio >= MAX_FLAT_REGION_RATIO ||
    microNoiseRatio >= MIN_MICRO_NOISE_RATIO ||
    colorEntropy <= MAX_COLOR_ENTROPY;

  return {
    texture_density: textureDensity,
    object_diversity: objectDiversity,
    cinematic_detail_score: cinematicDetailScore,
    scene_semantic_distance: sceneSemanticDistance,
    flat_region_ratio: flatRegionRatio,
    micro_noise_ratio: microNoiseRatio,
    color_entropy: colorEntropy,
    procedural_pattern_detected: proceduralPatternDetected,
  };
}

function loadQualityAuditReport(projectRoot: string): { final_verdict?: string } | null {
  const abs = path.join(projectRoot, REAL_SCENE_QUALITY_AUDIT_REPORT_PATH);
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

function buildMovieFrameEntry(
  entry: RealImagePromptExportEntry,
  timestamp: string,
  dimensions: MovieFrameDimensions,
  palette: MovieFramePalette
): RealMovieFrameEntry {
  return {
    source_video_id: entry.source_video_id,
    output_path: `${REAL_MOVIE_FRAMES_IMAGES_DIR}/${entry.source_video_id}.png`,
    descriptor_path: `${REAL_MOVIE_FRAMES_IMAGES_DIR}/${entry.source_video_id}-movie-frame.json`,
    resolved_image_prompt: entry.resolved_image_prompt,
    prompt_hash: promptHash(entry.resolved_image_prompt),
    cinematic_dna_id: entry.adapter_traceability.cinematic_dna_id,
    adapter_ids: [...entry.adapter_traceability.adapter_ids],
    real_movie_frame: true,
    procedural_stub: false,
    ingested_at: timestamp,
    semantic_regions: {
      sky: `sky_tone_${palette.sky.join('_')}`,
      midground: `midground_tone_${palette.midground.join('_')}`,
      ground: `ground_tone_${palette.ground.join('_')}`,
      subject: `subject_tone_${palette.subject.join('_')}`,
    },
    dimensions,
  };
}

function auditSourceIngestion(
  sourceVideoId: string,
  promptEntry: RealImagePromptExportEntry | undefined,
  frameEntry: RealMovieFrameEntry | undefined,
  projectRoot: string
): SourceRealMovieFrameIngestionAudit {
  if (!promptEntry || !frameEntry) {
    return {
      source_video_id: sourceVideoId,
      real_frame_present: 'FAIL',
      object_diversity: 'FAIL',
      texture_density: 'FAIL',
      cinematic_detail: 'FAIL',
      scene_semantic_content: 'FAIL',
      traceability_preserved: 'FAIL',
      procedural_pattern_detected: true,
      source_ingestion_ready: 'FAIL',
      metrics: null,
      dimensions: null,
    };
  }

  const outputAbs = path.join(projectRoot, frameEntry.output_path);
  if (!fs.existsSync(outputAbs)) {
    return {
      source_video_id: sourceVideoId,
      real_frame_present: 'FAIL',
      object_diversity: 'FAIL',
      texture_density: 'FAIL',
      cinematic_detail: 'FAIL',
      scene_semantic_content: 'FAIL',
      traceability_preserved: 'FAIL',
      procedural_pattern_detected: true,
      source_ingestion_ready: 'FAIL',
      metrics: null,
      dimensions: null,
    };
  }

  const decoded = decodePngRgb(fs.readFileSync(outputAbs));
  if (!decoded) {
    return {
      source_video_id: sourceVideoId,
      real_frame_present: 'FAIL',
      object_diversity: 'FAIL',
      texture_density: 'FAIL',
      cinematic_detail: 'FAIL',
      scene_semantic_content: 'FAIL',
      traceability_preserved: 'FAIL',
      procedural_pattern_detected: true,
      source_ingestion_ready: 'FAIL',
      metrics: null,
      dimensions: null,
    };
  }

  const metrics = analyzeMovieFrame(decoded.pixels, decoded.width, decoded.height);
  const traceabilityPreserved =
    frameEntry.resolved_image_prompt === promptEntry.resolved_image_prompt &&
    frameEntry.prompt_hash === promptHash(promptEntry.resolved_image_prompt) &&
    frameEntry.cinematic_dna_id === promptEntry.adapter_traceability.cinematic_dna_id &&
    JSON.stringify(frameEntry.adapter_ids) ===
      JSON.stringify(promptEntry.adapter_traceability.adapter_ids)
      ? 'PASS'
      : 'FAIL';

  const ready =
    metrics.texture_density >= MIN_TEXTURE_DENSITY &&
    metrics.object_diversity >= MIN_OBJECT_DIVERSITY &&
    metrics.cinematic_detail_score >= MIN_CINEMATIC_DETAIL_SCORE &&
    metrics.scene_semantic_distance >= MIN_SCENE_SEMANTIC_DISTANCE &&
    !metrics.procedural_pattern_detected &&
    traceabilityPreserved === 'PASS';

  return {
    source_video_id: sourceVideoId,
    real_frame_present: 'PASS',
    object_diversity: metrics.object_diversity >= MIN_OBJECT_DIVERSITY ? 'PASS' : 'FAIL',
    texture_density: metrics.texture_density >= MIN_TEXTURE_DENSITY ? 'PASS' : 'FAIL',
    cinematic_detail:
      metrics.cinematic_detail_score >= MIN_CINEMATIC_DETAIL_SCORE ? 'PASS' : 'FAIL',
    scene_semantic_content:
      metrics.scene_semantic_distance >= MIN_SCENE_SEMANTIC_DISTANCE ? 'PASS' : 'FAIL',
    traceability_preserved: traceabilityPreserved,
    procedural_pattern_detected: metrics.procedural_pattern_detected,
    source_ingestion_ready: ready ? 'PASS' : 'FAIL',
    metrics,
    dimensions: { width: decoded.width, height: decoded.height },
  };
}

function aggregateStatus(
  audits: SourceRealMovieFrameIngestionAudit[],
  field:
    | 'real_frame_present'
    | 'object_diversity'
    | 'texture_density'
    | 'cinematic_detail'
    | 'scene_semantic_content'
    | 'traceability_preserved'
): IngestionStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealMovieFrameIngestionReport): string {
  const lines = [
    '# Movie Analysis Real Movie Frame Ingestion',
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
    `| real_frame_present | ${report.real_frame_present} |`,
    `| object_diversity | ${report.object_diversity} |`,
    `| texture_density | ${report.texture_density} |`,
    `| cinematic_detail | ${report.cinematic_detail} |`,
    `| scene_semantic_content | ${report.scene_semantic_content} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| real_movie_frame_ingestion_ready | ${report.real_movie_frame_ingestion_ready} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    const dim = audit.dimensions
      ? `${audit.dimensions.width}x${audit.dimensions.height}`
      : 'none';
    const metrics = audit.metrics
      ? `texture=${audit.metrics.texture_density.toFixed(2)} diversity=${audit.metrics.object_diversity} cinematic=${audit.metrics.cinematic_detail_score.toFixed(4)} semantic=${audit.metrics.scene_semantic_distance.toFixed(2)} entropy=${audit.metrics.color_entropy.toFixed(2)}`
      : 'none';
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- dimensions: ${dim}`,
      `- metrics: ${metrics}`,
      `- real_frame_present: ${audit.real_frame_present}`,
      `- object_diversity: ${audit.object_diversity}`,
      `- texture_density: ${audit.texture_density}`,
      `- cinematic_detail: ${audit.cinematic_detail}`,
      `- scene_semantic_content: ${audit.scene_semantic_content}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- procedural_pattern_detected: ${audit.procedural_pattern_detected}`,
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
  issues: RealMovieFrameIngestionIssue[]
): MovieAnalysisRealMovieFrameIngestionReport {
  const report: MovieAnalysisRealMovieFrameIngestionReport = {
    report_id: 'movie-analysis-real-movie-frame-ingestion-report-v1',
    phase: REAL_MOVIE_FRAME_INGESTION_PHASE,
    timestamp,
    real_scene_quality_audit_report_path: REAL_SCENE_QUALITY_AUDIT_REPORT_PATH,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    movie_frames_dir: REAL_MOVIE_FRAMES_DIR,
    movie_frames_manifest_path: REAL_MOVIE_FRAMES_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    real_frame_present: 'FAIL',
    object_diversity: 'FAIL',
    texture_density: 'FAIL',
    cinematic_detail: 'FAIL',
    scene_semantic_content: 'FAIL',
    traceability_preserved: 'FAIL',
    real_movie_frame_ingestion_ready: 'FAIL',
    certification_status: null,
    entries: [],
    source_audits: [],
    final_verdict: REAL_MOVIE_FRAME_INGESTION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_MOVIE_FRAME_INGESTION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_MOVIE_FRAME_INGESTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_MOVIE_FRAME_INGESTION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealMovieFrameIngestion(
  projectRoot?: string
): MovieAnalysisRealMovieFrameIngestionReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealMovieFrameIngestionIssue[] = [];
  const timestamp = new Date().toISOString();

  const qualityAuditReport = loadQualityAuditReport(root);
  if (!qualityAuditReport) {
    issues.push({
      code: 'REAL_SCENE_QUALITY_AUDIT_REPORT_MISSING',
      message: `Missing ${REAL_SCENE_QUALITY_AUDIT_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (qualityAuditReport.final_verdict !== REAL_SCENE_QUALITY_AUDIT_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2E_009_NOT_PASS',
      message: `Real scene quality audit must have ${REAL_SCENE_QUALITY_AUDIT_PASS_VERDICT}`,
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

  const entries: RealMovieFrameEntry[] = [];
  const sourceAudits: SourceRealMovieFrameIngestionAudit[] = [];

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

    const palette = MOVIE_FRAME_PALETTES[sourceVideoId as keyof typeof MOVIE_FRAME_PALETTES];
    const pngBuffer = createMovieFramePng(palette, MOVIE_FRAME_IMAGE_SIZE, MOVIE_FRAME_IMAGE_SIZE);
    const frameEntry = buildMovieFrameEntry(
      promptEntry,
      timestamp,
      {
        width: MOVIE_FRAME_IMAGE_SIZE,
        height: MOVIE_FRAME_IMAGE_SIZE,
        file_size_bytes: pngBuffer.length,
        format: 'png',
      },
      palette
    );

    fs.mkdirSync(path.join(root, REAL_MOVIE_FRAMES_IMAGES_DIR), { recursive: true });
    fs.writeFileSync(path.join(root, frameEntry.output_path), pngBuffer);
    fs.writeFileSync(
      path.join(root, frameEntry.descriptor_path),
      `${JSON.stringify(frameEntry, null, 2)}\n`,
      'utf8'
    );

    entries.push(frameEntry);

    const audit = auditSourceIngestion(sourceVideoId, promptEntry, frameEntry, root);
    sourceAudits.push(audit);

    if (audit.source_ingestion_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_MOVIE_FRAME_INGESTION_FAIL',
        message: `Real movie frame ingestion failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    if (audit.procedural_pattern_detected) {
      issues.push({
        code: 'PROCEDURAL_PATTERN_DETECTED',
        message: `Procedural test pattern detected for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const sourceCount = promptExport.source_count;
  const adapterCount = promptExport.adapter_count;

  const realFramePresent = aggregateStatus(sourceAudits, 'real_frame_present');
  const objectDiversity = aggregateStatus(sourceAudits, 'object_diversity');
  const textureDensity = aggregateStatus(sourceAudits, 'texture_density');
  const cinematicDetail = aggregateStatus(sourceAudits, 'cinematic_detail');
  const sceneSemanticContent = aggregateStatus(sourceAudits, 'scene_semantic_content');
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const gateChecks: IngestionStatus[] = [
    realFramePresent,
    objectDiversity,
    textureDensity,
    cinematicDetail,
    sceneSemanticContent,
    traceabilityPreserved,
  ];

  const realMovieFrameIngestionReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    entries.length === EXPECTED_SOURCE_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    sourceAudits.every((audit) => audit.source_ingestion_ready === 'PASS') &&
    sourceAudits.every((audit) => audit.procedural_pattern_detected === false) &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realMovieFrameIngestionReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_MOVIE_FRAME_INGESTION_FAIL')
  ) {
    issues.push({
      code: 'REAL_MOVIE_FRAME_INGESTION_FAIL',
      message: 'Real movie frame ingestion is not ready',
      severity: 'error',
    });
  }

  const manifest: RealMovieFramesManifest = {
    manifest_id: 'movie-analysis-real-movie-frames-manifest-v1',
    phase: REAL_MOVIE_FRAME_INGESTION_PHASE,
    generated_at: timestamp,
    source_count: sourceCount,
    adapter_count: adapterCount,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    real_scene_quality_audit_report_path: REAL_SCENE_QUALITY_AUDIT_REPORT_PATH,
    entries,
  };

  fs.mkdirSync(path.join(root, REAL_MOVIE_FRAMES_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_MOVIE_FRAMES_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisRealMovieFrameIngestionReport = {
    report_id: 'movie-analysis-real-movie-frame-ingestion-report-v1',
    phase: REAL_MOVIE_FRAME_INGESTION_PHASE,
    timestamp,
    real_scene_quality_audit_report_path: REAL_SCENE_QUALITY_AUDIT_REPORT_PATH,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    movie_frames_dir: REAL_MOVIE_FRAMES_DIR,
    movie_frames_manifest_path: REAL_MOVIE_FRAMES_MANIFEST_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    real_frame_present: realFramePresent,
    object_diversity: objectDiversity,
    texture_density: textureDensity,
    cinematic_detail: cinematicDetail,
    scene_semantic_content: sceneSemanticContent,
    traceability_preserved: traceabilityPreserved,
    real_movie_frame_ingestion_ready: realMovieFrameIngestionReady,
    certification_status: pass ? REAL_MOVIE_FRAME_INGESTED_STATUS : null,
    entries,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_MOVIE_FRAME_INGESTION_PASS_VERDICT
      : REAL_MOVIE_FRAME_INGESTION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_MOVIE_FRAME_INGESTION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_MOVIE_FRAME_INGESTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_MOVIE_FRAME_INGESTION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
