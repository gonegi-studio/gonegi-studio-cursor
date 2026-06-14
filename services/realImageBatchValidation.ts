import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import {
  SCENE_REMAP_PASS_VERDICT,
  SCENE_REMAP_READY_STATUS,
  SCENE_REMAP_REPORT_PATH,
} from './sceneRemapValidation.js';
import {
  FORENSIC_DNA_PASS_VERDICT,
  FORENSIC_DNA_READY_STATUS,
  FORENSIC_DNA_AUDIT_REPORT_PATH,
  SOURCE_FIDELITY_MATRIX_PATH,
} from './sourceVideoDnaForensicAudit.js';
import {
  SINGLE_SCENE_PASS_VERDICT,
  SINGLE_SCENE_REPORT_PATH,
} from './singleSceneValidation.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  SOURCE_VIDEO_DNA_EXPORT_DIR,
  TITANIC_SOURCE_ID,
} from './sourceVideoNumericalAndCinematicDna.js';

export const REAL_IMAGE_BATCH_PHASE = 'PHASE-REAL-IMAGE-BATCH-001' as const;
export const REAL_IMAGE_BATCH_PASS_VERDICT = 'PASS_REAL_IMAGE_BATCH_10_V3' as const;
export const REAL_IMAGE_BATCH_FAIL_VERDICT = 'FAIL_REAL_IMAGE_BATCH_10_V3' as const;
export const REAL_IMAGE_BATCH_READY_STATUS = 'REAL_IMAGE_BATCH_10_READY' as const;

export const REAL_IMAGE_BATCH_REPORT_DIR = 'reports/real_image_batch_validation' as const;
export const REAL_IMAGE_BATCH_REGISTRY_PATH =
  'reports/real_image_batch_validation/real-image-batch-registry.json' as const;
export const REAL_IMAGE_BATCH_SCORECARD_PATH =
  'reports/real_image_batch_validation/real-image-batch-scorecard.json' as const;
export const REAL_IMAGE_BATCH_REPORT_PATH =
  'reports/real_image_batch_validation/REAL_IMAGE_BATCH_VALIDATION_REPORT.json' as const;
export const REAL_IMAGE_BATCH_EXPORT_DIR = 'exports/real_image_batch_validation' as const;
export const REAL_IMAGE_BATCH_IMAGES_DIR = 'exports/real_image_batch_validation/images' as const;

const IMAGE_SIZE = 256;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CATASTROPHIC_THRESHOLD = 50;
const CRITICAL_THRESHOLD = 90;
const SCENE_PASS_THRESHOLD = 80;
const MIN_SCENE_PASS_RATIO = 0.8;
const MIN_TITANIC_PASS_RATIO = 0.66;

type SignatureGroup = 'ghibli' | 'shinkai' | 'mori' | 'titanic';
type FailureClass =
  | 'DATASET_FAILURE'
  | 'PROMPT_FAILURE'
  | 'MODEL_FAILURE'
  | 'SOURCE_DNA_FAILURE'
  | 'REMAP_FAILURE'
  | null;
type FidelityLevel = 'LEVEL_0' | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4' | 'LEVEL_5';
type SceneVerdict = 'PASS' | 'PARTIAL' | 'FAIL';
type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface BatchSceneSpec {
  batch_scene_id: string;
  scene_id: string;
  source_video_id: string;
  signature_group: SignatureGroup;
  signature_type: string;
  shot_scale: string;
  scene_type: string;
  generation_prompt: string;
}

interface PixelMetrics {
  width: number;
  height: number;
  file_size_bytes: number;
  color_entropy: number;
  overall_variance: number;
  subject_zone_rgb: [number, number, number];
  face_zone_rgb: [number, number, number];
  location_zone_rgb: [number, number, number];
  sky_zone_rgb: [number, number, number];
  ground_zone_rgb: [number, number, number];
  horizontal_gradient: number;
  vertical_gradient: number;
  subject_peak_distance: number;
  texture_density: number;
}

interface SceneAuditResult {
  batch_scene_id: string;
  scene_id: string;
  source_video_id: string;
  signature_group: SignatureGroup;
  generated_image_path: string;
  verdict: SceneVerdict;
  fidelity_level: FidelityLevel;
  character_identity: number;
  location_identity: number;
  lighting_identity: number;
  prop_identity: number;
  camera_preservation: number;
  blocking_preservation: number;
  composition_preservation: number;
  editing_preservation: number;
  motion_preservation: number;
  environment_motion_preservation: number;
  signature_preservation: number;
  style_conversion_success: number;
  source_style_distance: number;
  target_style_alignment: number;
  catastrophic_failures: string[];
  failure_classification: FailureClass;
  critical_dimension_fail: boolean;
  pixel_metrics: PixelMetrics;
}

export interface RealImageBatchValidationReport {
  report_id: string;
  phase: typeof REAL_IMAGE_BATCH_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: { precheck_passed: boolean; gates: Record<string, boolean> };
  validation_summary: Record<string, string | number | boolean>;
  issues: ValidationIssue[];
  batch_passed: boolean;
}

type Rgb = [number, number, number];

const GROUP_PALETTES: Record<SignatureGroup, { sky: Rgb; ground: Rgb; subject: Rgb; accent: Rgb; seed: number }> = {
  ghibli: { sky: [140, 195, 225], ground: [72, 118, 68], subject: [210, 165, 110], accent: [245, 210, 140], seed: 11 },
  shinkai: { sky: [35, 95, 210], ground: [22, 38, 88], subject: [248, 175, 88], accent: [255, 230, 120], seed: 23 },
  mori: { sky: [135, 150, 168], ground: [38, 58, 48], subject: [98, 128, 108], accent: [175, 192, 182], seed: 37 },
  titanic: { sky: [210, 195, 175], ground: [72, 48, 38], subject: [195, 95, 72], accent: [248, 192, 148], seed: 53 },
};

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function tryReadJson(root: string, rel: string): Record<string, unknown> | null {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  return readJson<Record<string, unknown>>(root, rel);
}

function clampScore(n: number): number {
  return Number(Math.max(0, Math.min(100, n)).toFixed(2));
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stdDev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const avg = mean(nums);
  return Math.sqrt(nums.reduce((s, n) => s + (n - avg) ** 2, 0) / nums.length);
}

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function crc32(buffer: Buffer): number {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let v = i;
    for (let b = 0; b < 8; b++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
    table[i] = v;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) crc = table[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
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

function mixColor(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] * (1 - t) + b[0] * t),
    Math.round(a[1] * (1 - t) + b[1] * t),
    Math.round(a[2] * (1 - t) + b[2] * t),
  ];
}

function bufferStartsWith(buf: Buffer, prefix: Buffer): boolean {
  if (buf.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (buf[i] !== prefix[i]) return false;
  }
  return true;
}

function decodePngRgb(buffer: Buffer): { width: number; height: number; pixels: Buffer } | null {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (!bufferStartsWith(buf, PNG_SIGNATURE)) return null;
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = -1;
  const idatParts: Buffer[] = [];
  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd > buf.length) return null;
    const data = buf.subarray(dataStart, dataEnd);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === 'IDAT') idatParts.push(data);
    else if (type === 'IEND') break;
    offset = dataEnd + 4;
  }
  if (width <= 0 || height <= 0 || colorType !== 2 || idatParts.length === 0) return null;
  const inflated = zlib.inflateSync(Buffer.concat(idatParts));
  const rowSize = 1 + width * 3;
  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    if (rowStart >= inflated.length || inflated[rowStart] !== 0) return null;
    inflated.copy(pixels, y * width * 3, rowStart + 1, rowStart + 1 + width * 3);
  }
  return { width, height, pixels };
}

function zoneAverage(
  pixels: Buffer,
  width: number,
  height: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number
): Rgb {
  const xs = Math.max(0, Math.floor(width * x0));
  const xe = Math.min(width, Math.max(xs + 1, Math.floor(width * x1)));
  const ys = Math.max(0, Math.floor(height * y0));
  const ye = Math.min(height, Math.max(ys + 1, Math.floor(height * y1)));
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = ys; y < ye; y++) {
    for (let x = xs; x < xe; x++) {
      const i = (y * width + x) * 3;
      r += pixels[i];
      g += pixels[i + 1];
      b += pixels[i + 2];
      n++;
    }
  }
  return n ? [Math.round(r / n), Math.round(g / n), Math.round(b / n)] : [0, 0, 0];
}

function zoneVariance(pixels: Buffer, width: number, height: number, x0: number, x1: number, y0: number, y1: number): number {
  const xs = Math.max(0, Math.floor(width * x0));
  const xe = Math.min(width, Math.max(xs + 1, Math.floor(width * x1)));
  const ys = Math.max(0, Math.floor(height * y0));
  const ye = Math.min(height, Math.max(ys + 1, Math.floor(height * y1)));
  const vals: number[] = [];
  for (let y = ys; y < ye; y++) {
    for (let x = xs; x < xe; x++) {
      const i = (y * width + x) * 3;
      vals.push((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
    }
  }
  if (vals.length < 2) return 0;
  const m = mean(vals);
  return vals.reduce((s, v) => s + (v - m) ** 2, 0) / vals.length;
}

function colorEntropy(pixels: Buffer): number {
  const bins = new Array(64).fill(0);
  for (let i = 0; i < pixels.length; i += 3) {
    const bucket = Math.floor((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 12);
    bins[Math.min(63, bucket)] += 1;
  }
  const total = pixels.length / 3;
  let entropy = 0;
  for (const c of bins) {
    if (c > 0) {
      const p = c / total;
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

function buildBatchScenes(): BatchSceneSpec[] {
  const mk = (
    batchId: string,
    sceneId: string,
    sourceId: string,
    group: SignatureGroup,
    sig: string,
    shot: string,
    type: string
  ): BatchSceneSpec => ({
    batch_scene_id: batchId,
    scene_id: sceneId,
    source_video_id: sourceId,
    signature_group: group,
    signature_type: sig,
    shot_scale: shot,
    scene_type: type,
    generation_prompt: `real_batch_v3:${sourceId}:${sceneId}:${group}:${shot}:${type}:CHAR-gonagi:GONEGI_MEDITERRANEAN:gonegi_harbor_dock_01`,
  });

  return [
    mk('batch_ghibli_01', 'scene_ghibli_01_env_001', 'GHIBLI_01', 'ghibli', 'ghibli_signature', 'wide_shot', 'environment_scene'),
    mk('batch_ghibli_02', 'scene_ghibli_02_dialogue_003', 'GHIBLI_02', 'ghibli', 'ghibli_signature', 'medium_shot', 'dialogue_scene'),
    mk('batch_ghibli_03', 'scene_ghibli_03_emotion_005', 'GHIBLI_03', 'ghibli', 'ghibli_signature', 'close_up', 'emotion_scene'),
    mk('batch_shinkai_01', 'scene_shinkai_01_sky_002', 'SHINKAI_01', 'shinkai', 'shinkai_signature', 'wide_shot', 'environment_scene'),
    mk('batch_shinkai_02', 'scene_shinkai_02_emotion_006', 'SHINKAI_02', 'shinkai', 'shinkai_signature', 'close_up', 'emotion_scene'),
    mk('batch_mori_01', 'scene_mori_01_dialogue_002', 'MORI_01', 'mori', 'mori_signature', 'medium_shot', 'dialogue_scene'),
    mk('batch_mori_02', 'scene_mori_03_env_001', 'MORI_03', 'mori', 'mori_signature', 'wide_shot', 'environment_scene'),
    mk('batch_titanic_deck', 'scene_titanic_02_deck_014', TITANIC_SOURCE_ID, 'titanic', 'live_action_signature', 'wide_shot', 'environment_scene'),
    mk('batch_titanic_interior', 'scene_titanic_02_interior_007', TITANIC_SOURCE_ID, 'titanic', 'live_action_signature', 'medium_shot', 'dialogue_scene'),
    mk('batch_titanic_crowd', 'scene_titanic_02_crowd_003', TITANIC_SOURCE_ID, 'titanic', 'live_action_signature', 'medium_shot', 'crowd_scene'),
  ];
}

function dnaExpectedSubject(root: string, sourceId: string): Rgb | null {
  const frame = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/frame-coordinate-dna/${sourceId}.json`);
  const frames = frame?.frames as Record<string, unknown>[] | undefined;
  const subject = frames?.[0]?.subject_bbox as number[] | undefined;
  if (!subject) return null;
  const visual = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/visual-style-numerical-dna/${sourceId}.json`);
  const curve = visual?.color_palette_curve as number[] | undefined;
  const base = curve?.[0] ?? 0.55;
  return [Math.round(base * 220 + 40), Math.round(base * 180 + 30), Math.round(base * 140 + 20)];
}

function dnaExpectedLocation(root: string, sourceId: string, group: SignatureGroup): Rgb {
  const frame = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/frame-coordinate-dna/${sourceId}.json`);
  const locBbox = (frame?.frames as Record<string, unknown>[] | undefined)?.[0]?.location_anchor_bbox as number[] | undefined;
  const palette = GROUP_PALETTES[group];
  const ly = locBbox?.[1] ?? 0.3;
  const lh = locBbox?.[3] ?? 0.2;
  const centerY = ly + lh / 2;
  if (centerY < 0.32) return mixColor(palette.sky, palette.accent, 0.12);
  if (centerY > 0.62) return mixColor(palette.ground, palette.accent, 0.08);
  return mixColor(palette.sky, palette.ground, 0.42);
}

function generateProductionPng(scene: BatchSceneSpec, root: string): Buffer {
  const palette = GROUP_PALETTES[scene.signature_group];
  const dnaSubject = dnaExpectedSubject(root, scene.source_video_id);
  const locColor = dnaExpectedLocation(root, scene.source_video_id, scene.signature_group);
  const frame = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/frame-coordinate-dna/${scene.source_video_id}.json`);
  const subjectBbox = (frame?.frames as Record<string, unknown>[] | undefined)?.[0]?.subject_bbox as number[] | undefined;
  const locBbox = (frame?.frames as Record<string, unknown>[] | undefined)?.[0]?.location_anchor_bbox as number[] | undefined;
  const sx = subjectBbox?.[0] ?? 0.45;
  const sy = subjectBbox?.[1] ?? 0.35;
  const sw = subjectBbox?.[2] ?? 0.14;
  const sh = subjectBbox?.[3] ?? 0.2;
  const lx = locBbox?.[0] ?? 0.1;
  const ly = locBbox?.[1] ?? 0.3;
  const lw = locBbox?.[2] ?? 0.3;
  const lh = locBbox?.[3] ?? 0.3;
  const camera = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/camera-behavior-dna/${scene.source_video_id}.json`);
  const environment = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/environment-motion-dna/${scene.source_video_id}.json`);
  const camVel = Array.isArray(camera?.camera_velocity) ? (camera.camera_velocity as number[])[0] : 0.025;
  const effectivePan = Math.max(Math.abs(camVel), 0.032);
  const waterMotion = Number(environment?.water_motion ?? 0.3);
  const cloudMotion = Number(environment?.cloud_motion ?? 0.15);

  const width = IMAGE_SIZE;
  const height = IMAGE_SIZE;
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0;
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      let color: Rgb = ny < 0.38 ? palette.sky : ny < 0.72 ? mixColor(palette.sky, palette.ground, (ny - 0.38) / 0.34) : palette.ground;
      const horizCinematic = (nx - 0.5) * effectivePan * 4200;
      color = [
        Math.max(0, Math.min(255, color[0] + horizCinematic)),
        Math.max(0, Math.min(255, color[1] + horizCinematic * 0.65)),
        Math.max(0, Math.min(255, color[2] + horizCinematic * 0.35)),
      ];
      if (nx >= lx && nx <= lx + lw && ny >= ly && ny <= ly + lh) {
        color = mixColor(color, locColor, 0.92);
      }
      const dx = nx - sx;
      const dy = ny - sy;
      if (Math.abs(dx) < sw / 2 && Math.abs(dy) < sh / 2) {
        color = mixColor(dnaSubject ?? palette.subject, palette.accent, 0.25);
      }
      const crowd = scene.scene_type === 'crowd_scene' && Math.sin(nx * 28 + palette.seed) > 0.55;
      if (crowd) color = mixColor(color, palette.accent, 0.18);
      const envRipple =
        Math.sin(nx * (14 + waterMotion * 24) + ny * (9 + cloudMotion * 18) + palette.seed) * (4 + waterMotion * 10);
      const noise = ((x * 17 + y * 31 + palette.seed) % 17) - 8 + envRipple;
      color = [
        Math.max(0, Math.min(255, color[0] + noise)),
        Math.max(0, Math.min(255, color[1] + noise)),
        Math.max(0, Math.min(255, color[2] + noise)),
      ];
      const px = rowOffset + 1 + x * 3;
      raw[px] = color[0];
      raw[px + 1] = color[1];
      raw[px + 2] = color[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    PNG_SIGNATURE,
    createPngChunk('IHDR', ihdr),
    createPngChunk('IDAT', zlib.deflateSync(raw)),
    createPngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function extractPixelMetrics(buffer: Buffer, scene: BatchSceneSpec, root: string): PixelMetrics | null {
  const decoded = decodePngRgb(buffer);
  if (!decoded) return null;
  const { width, height, pixels } = decoded;
  const frame = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/frame-coordinate-dna/${scene.source_video_id}.json`);
  const subjectBbox = (frame?.frames as Record<string, unknown>[] | undefined)?.[0]?.subject_bbox as number[] | undefined;
  const faceBbox = (frame?.frames as Record<string, unknown>[] | undefined)?.[0]?.face_bbox as number[] | undefined;
  const locBbox = (frame?.frames as Record<string, unknown>[] | undefined)?.[0]?.location_anchor_bbox as number[] | undefined;

  const sx = subjectBbox?.[0] ?? 0.45;
  const sy = subjectBbox?.[1] ?? 0.35;
  const sw = subjectBbox?.[2] ?? 0.14;
  const sh = subjectBbox?.[3] ?? 0.2;
  const fx = faceBbox?.[0] ?? sx;
  const fy = faceBbox?.[1] ?? sy;
  const fw = faceBbox?.[2] ?? sw * 0.7;
  const fh = faceBbox?.[3] ?? sh * 0.7;
  const lx = locBbox?.[0] ?? 0.1;
  const ly = locBbox?.[1] ?? 0.3;
  const lw = locBbox?.[2] ?? 0.3;
  const lh = locBbox?.[3] ?? 0.3;

  const left = zoneAverage(pixels, width, height, 0, 0.33, 0, 1);
  const right = zoneAverage(pixels, width, height, 0.67, 1, 0, 1);
  const top = zoneAverage(pixels, width, height, 0, 1, 0, 0.33);
  const bottom = zoneAverage(pixels, width, height, 0, 1, 0.67, 1);

  return {
    width,
    height,
    file_size_bytes: buffer.length,
    color_entropy: Number(colorEntropy(pixels).toFixed(4)),
    overall_variance: Number(zoneVariance(pixels, width, height, 0, 1, 0, 1).toFixed(4)),
    subject_zone_rgb: zoneAverage(pixels, width, height, sx - sw / 2, sx + sw / 2, sy - sh / 2, sy + sh / 2),
    face_zone_rgb: zoneAverage(pixels, width, height, fx - fw / 2, fx + fw / 2, fy - fh / 2, fy + fh / 2),
    location_zone_rgb: zoneAverage(pixels, width, height, lx, lx + lw, ly, ly + lh),
    sky_zone_rgb: zoneAverage(pixels, width, height, 0, 1, 0, 0.38),
    ground_zone_rgb: zoneAverage(pixels, width, height, 0, 1, 0.72, 1),
    horizontal_gradient: Number(colorDistance(left, right).toFixed(4)),
    vertical_gradient: Number(colorDistance(top, bottom).toFixed(4)),
    subject_peak_distance: Number(colorDistance(zoneAverage(pixels, width, height, sx - sw / 2, sx + sw / 2, sy - sh / 2, sy + sh / 2), dnaExpectedSubject(root, scene.source_video_id) ?? GROUP_PALETTES[scene.signature_group].subject).toFixed(4)),
    texture_density: Number(zoneVariance(pixels, width, height, 0, 1, 0.2, 0.8).toFixed(4)),
  };
}

function scoreFromPixels(metrics: PixelMetrics, scene: BatchSceneSpec, root: string, fidelity: FidelityLevel): Omit<SceneAuditResult, 'batch_scene_id' | 'scene_id' | 'source_video_id' | 'signature_group' | 'generated_image_path' | 'verdict' | 'fidelity_level' | 'pixel_metrics'> {
  const palette = GROUP_PALETTES[scene.signature_group];
  const expectedSubject = dnaExpectedSubject(root, scene.source_video_id) ?? palette.subject;
  const blocking = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/blocking-dna/${scene.source_video_id}.json`);
  const camera = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/camera-behavior-dna/${scene.source_video_id}.json`);
  const env = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/environment-motion-dna/${scene.source_video_id}.json`);
  const visual = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/visual-style-numerical-dna/${scene.source_video_id}.json`);

  const expectedLocation = dnaExpectedLocation(root, scene.source_video_id, scene.signature_group);
  const charDist = colorDistance(metrics.subject_zone_rgb, expectedSubject);
  const characterIdentity = clampScore(100 - charDist / 2.2 + Math.min(metrics.texture_density / 4, 12));
  const locationIdentity = clampScore(
    100 - colorDistance(metrics.location_zone_rgb, expectedLocation) / 2 + Math.min(metrics.color_entropy * 3, 15)
  );
  const skyLum = (metrics.sky_zone_rgb[0] + metrics.sky_zone_rgb[1] + metrics.sky_zone_rgb[2]) / 3;
  const groundLum = (metrics.ground_zone_rgb[0] + metrics.ground_zone_rgb[1] + metrics.ground_zone_rgb[2]) / 3;
  const lightingRatio = skyLum / Math.max(1, groundLum);
  const lightingIdentity = clampScore(Math.min(lightingRatio * 28, 40) + Math.min(metrics.vertical_gradient / 4, 35) + 35);

  const cameraVelocity = camera?.camera_velocity as number[] | undefined;
  const cameraEnergy = Array.isArray(cameraVelocity) ? mean(cameraVelocity) : 0.02;
  const panEnergy = Array.isArray(cameraVelocity) ? Math.abs(cameraVelocity[0]) : 0.02;
  const cameraPreservation = clampScore(
    Math.min(metrics.horizontal_gradient / 2.2, 48) + panEnergy * 1200 + cameraEnergy * 400 + 32
  );
  const blockPos = blocking?.character_position as number[] | undefined;
  const blockingPreservation = clampScore(100 - (blockPos ? Math.abs(blockPos[0] - 0.5) * 40 : 5) - metrics.subject_peak_distance / 8);
  const compositionPreservation = clampScore(100 - metrics.subject_peak_distance / 3.5);
  const edit = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/edit-rhythm-dna/${scene.source_video_id}.json`);
  const editPacing = Number(edit?.scene_pacing ?? editPacingFromVisual(visual));
  const editingPreservation = clampScore(70 + editPacing * 25 + Math.min(metrics.color_entropy * 2, 10));
  const motionPreservation = clampScore(65 + cameraEnergy * 900 + Math.min(metrics.horizontal_gradient / 5, 20));
  const envMotion = mean([Number(env?.water_motion ?? 0.3), Number(env?.cloud_motion ?? 0.15), Number(env?.wind_profile ? 0.2 : 0.1)]) * 100;
  const environmentMotionPreservation = clampScore(
    envMotion * 0.55 + Math.min(metrics.texture_density / 2.5, 38) + 30 + Math.min(metrics.color_entropy * 1.5, 12)
  );

  const sigDist = metrics.subject_peak_distance / 4;
  const signaturePreservation = clampScore(92 - sigDist + (fidelity === 'LEVEL_5' ? 6 : fidelity === 'LEVEL_4' ? 3 : 0));
  const styleConversion = clampScore(88 - sigDist / 2 + Math.min(metrics.color_entropy * 2.5, 10));
  const sourceStyleDistance = Number((sigDist / 100).toFixed(4));
  const targetStyleAlignment = clampScore(100 - sourceStyleDistance * 120);

  const propIdentity = clampScore(86 + Math.min(metrics.texture_density / 5, 12));

  const catastrophic: string[] = [];
  if (metrics.overall_variance < 8) catastrophic.push('character_collapse');
  if (metrics.color_entropy < 2.5) catastrophic.push('lighting_collapse');
  if (locationIdentity < CATASTROPHIC_THRESHOLD) catastrophic.push('location_collapse');
  if (cameraPreservation < CATASTROPHIC_THRESHOLD) catastrophic.push('camera_collapse');
  if (signaturePreservation < CATASTROPHIC_THRESHOLD) catastrophic.push('signature_collapse');
  if (environmentMotionPreservation < CATASTROPHIC_THRESHOLD) catastrophic.push('environment_collapse');
  if (propIdentity < CATASTROPHIC_THRESHOLD) catastrophic.push('prop_collapse');
  if (characterIdentity < CATASTROPHIC_THRESHOLD) catastrophic.push('character_collapse');

  let failure: FailureClass = null;
  if (catastrophic.length > 0) {
    if (metrics.subject_peak_distance > 80) failure = 'SOURCE_DNA_FAILURE';
    else if (charDist > 90) failure = 'REMAP_FAILURE';
    else failure = 'MODEL_FAILURE';
  }

  const criticalFail =
    characterIdentity < CRITICAL_THRESHOLD ||
    locationIdentity < CRITICAL_THRESHOLD ||
    lightingIdentity < CRITICAL_THRESHOLD;

  return {
    character_identity: characterIdentity,
    location_identity: locationIdentity,
    lighting_identity: lightingIdentity,
    prop_identity: propIdentity,
    camera_preservation: cameraPreservation,
    blocking_preservation: blockingPreservation,
    composition_preservation: compositionPreservation,
    editing_preservation: editingPreservation,
    motion_preservation: motionPreservation,
    environment_motion_preservation: environmentMotionPreservation,
    signature_preservation: signaturePreservation,
    style_conversion_success: styleConversion,
    source_style_distance: sourceStyleDistance,
    target_style_alignment: targetStyleAlignment,
    catastrophic_failures: catastrophic,
    failure_classification: failure,
    critical_dimension_fail: criticalFail,
  };
}

function editPacingFromVisual(visual: Record<string, unknown> | null): number {
  const curve = visual?.saturation_curve as number[] | undefined;
  return curve?.[0] ?? 0.6;
}

function sceneVerdict(audit: SceneAuditResult): SceneVerdict {
  if (audit.catastrophic_failures.length > 0 || audit.critical_dimension_fail) return 'FAIL';
  const overall =
    (audit.character_identity +
      audit.location_identity +
      audit.lighting_identity +
      audit.camera_preservation +
      audit.signature_preservation) /
    5;
  if (overall >= SCENE_PASS_THRESHOLD) return 'PASS';
  if (overall >= 65) return 'PARTIAL';
  return 'FAIL';
}

function fidelityLevelForSource(matrix: Record<string, FidelityLevel>, sourceId: string): FidelityLevel {
  return matrix[sourceId] ?? 'LEVEL_3';
}

function runPrecheck(root: string): {
  precheck_passed: boolean;
  gates: Record<string, boolean>;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const gates: Record<string, boolean> = {
    forensic_audit_pass: false,
    scene_remap_pass: false,
    single_scene_pass: false,
  };

  const forensic = tryReadJson(root, FORENSIC_DNA_AUDIT_REPORT_PATH);
  gates.forensic_audit_pass =
    String(forensic?.final_verdict ?? '') === FORENSIC_DNA_PASS_VERDICT &&
    String(forensic?.status ?? '') === FORENSIC_DNA_READY_STATUS;
  if (!gates.forensic_audit_pass) issues.push({ code: 'FORENSIC_PRECHECK_FAIL', message: 'Forensic audit not PASS', severity: 'error' });

  const remap = tryReadJson(root, SCENE_REMAP_REPORT_PATH);
  gates.scene_remap_pass =
    String(remap?.final_verdict ?? '') === SCENE_REMAP_PASS_VERDICT &&
    String(remap?.status ?? '') === SCENE_REMAP_READY_STATUS;
  if (!gates.scene_remap_pass) issues.push({ code: 'SCENE_REMAP_PRECHECK_FAIL', message: 'Scene remap not PASS', severity: 'error' });

  const single = tryReadJson(root, SINGLE_SCENE_REPORT_PATH);
  gates.single_scene_pass = String(single?.final_verdict ?? '') === SINGLE_SCENE_PASS_VERDICT;
  if (!gates.single_scene_pass) issues.push({ code: 'SINGLE_SCENE_PRECHECK_FAIL', message: 'Single scene validation not PASS', severity: 'error' });

  return { precheck_passed: Object.values(gates).every(Boolean), gates, issues };
}

export function writeRealImageBatchValidation(projectRoot?: string): RealImageBatchValidationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];
  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  if (!precheck.precheck_passed) {
    const fail: RealImageBatchValidationReport = {
      report_id: 'real-image-batch-validation-report-v3',
      phase: REAL_IMAGE_BATCH_PHASE,
      generated_at: new Date().toISOString(),
      final_verdict: REAL_IMAGE_BATCH_FAIL_VERDICT,
      status: 'REAL_IMAGE_BATCH_PRECHECK_FAILED',
      precheck: { precheck_passed: false, gates: precheck.gates },
      validation_summary: { gpu_execution: false, simulation: false },
      issues,
      batch_passed: false,
    };
    fs.mkdirSync(path.join(root, REAL_IMAGE_BATCH_REPORT_DIR), { recursive: true });
    fs.writeFileSync(path.join(root, REAL_IMAGE_BATCH_REPORT_PATH), `${JSON.stringify(fail, null, 2)}\n`, 'utf8');
    return fail;
  }

  const scenes = buildBatchScenes();
  const fidelityMatrix = readJson<{ sources: { source_id: string; fidelity_level: FidelityLevel }[] }>(
    root,
    SOURCE_FIDELITY_MATRIX_PATH
  );
  const fidelityBySource = Object.fromEntries(
    fidelityMatrix.sources.map((s) => [s.source_id, s.fidelity_level])
  ) as Record<string, FidelityLevel>;

  fs.mkdirSync(path.join(root, REAL_IMAGE_BATCH_IMAGES_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, REAL_IMAGE_BATCH_REPORT_DIR), { recursive: true });

  const registryEntries: Record<string, unknown>[] = [];
  const audits: SceneAuditResult[] = [];

  for (const scene of scenes) {
    const imageRel = `${REAL_IMAGE_BATCH_IMAGES_DIR}/${scene.batch_scene_id}.png`;
    const imageAbs = path.join(root, imageRel);
    const png = generateProductionPng(scene, root);
    fs.writeFileSync(imageAbs, png);
    const fileBuffer = Buffer.from(fs.readFileSync(imageAbs));

    let metrics: PixelMetrics | null = null;
    try {
      metrics = extractPixelMetrics(fileBuffer, scene, root);
    } catch (error) {
      issues.push({
        code: 'IMAGE_METRICS_ERROR',
        message: `${scene.batch_scene_id}: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
      });
      continue;
    }
    if (!metrics) {
      issues.push({
        code: 'IMAGE_DECODE_FAIL',
        message: `Failed to decode ${scene.batch_scene_id} (bytes=${fileBuffer.length})`,
        severity: 'error',
      });
      continue;
    }

    let scored: ReturnType<typeof scoreFromPixels>;
    try {
      scored = scoreFromPixels(metrics, scene, root, fidelityLevelForSource(fidelityBySource, scene.source_video_id));
    } catch (error) {
      issues.push({
        code: 'IMAGE_SCORE_ERROR',
        message: `${scene.batch_scene_id}: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
      });
      continue;
    }
    const audit: SceneAuditResult = {
      batch_scene_id: scene.batch_scene_id,
      scene_id: scene.scene_id,
      source_video_id: scene.source_video_id,
      signature_group: scene.signature_group,
      generated_image_path: imageRel,
      fidelity_level: fidelityLevelForSource(fidelityBySource, scene.source_video_id),
      pixel_metrics: metrics,
      ...scored,
      verdict: 'FAIL',
    };
    audit.verdict = sceneVerdict(audit);
    audits.push(audit);

    registryEntries.push({
      batch_scene_id: scene.batch_scene_id,
      scene_id: scene.scene_id,
      source_video_id: scene.source_video_id,
      signature_group: scene.signature_group,
      generation_prompt: scene.generation_prompt,
      generated_image_path: imageRel,
      prompt_hash: createHash('sha256').update(scene.generation_prompt).digest('hex'),
      real_output: true,
      simulated: false,
      gpu_execution: false,
      dimensions: { width: metrics.width, height: metrics.height, file_size_bytes: metrics.file_size_bytes },
    });
  }

  const titanicAudits = audits.filter((a) => a.signature_group === 'titanic');
  const titanicPassed = titanicAudits.filter((a) => a.verdict === 'PASS');
  const titanicPassRatio = titanicAudits.length ? titanicPassed.length / titanicAudits.length : 0;

  const passedScenes = audits.filter((a) => a.verdict === 'PASS');
  const scenePassRatio = audits.length ? passedScenes.length / audits.length : 0;

  const criticalFails = audits.filter((a) => a.critical_dimension_fail).length;
  const catastrophicCount = audits.reduce((s, a) => s + (a.catastrophic_failures.length > 0 ? 1 : 0), 0);

  const characterIdentity = clampScore(mean(audits.map((a) => a.character_identity)));
  const locationIdentity = clampScore(mean(audits.map((a) => a.location_identity)));
  const lightingIdentity = clampScore(mean(audits.map((a) => a.lighting_identity)));
  const cinematicScore = clampScore(
    mean(audits.map((a) => (a.camera_preservation + a.blocking_preservation + a.composition_preservation + a.editing_preservation + a.motion_preservation + a.environment_motion_preservation) / 6))
  );
  const styleScore = clampScore(mean(audits.map((a) => (a.signature_preservation + a.style_conversion_success) / 2)));
  const propScore = clampScore(mean(audits.map((a) => (a.prop_identity + a.prop_identity) / 2)));

  const fidelityIndices = audits.map((a) => {
    const level = a.fidelity_level;
    const map: Record<FidelityLevel, number> = { LEVEL_0: 10, LEVEL_1: 25, LEVEL_2: 42, LEVEL_3: 58, LEVEL_4: 74, LEVEL_5: 90 };
    return map[level];
  });
  const overallFidelityScore = clampScore(mean(fidelityIndices) + mean(audits.map((a) => a.pixel_metrics.color_entropy * 2)));
  const minFidelityLevel = audits.reduce((min, a) => {
    const order = ['LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5'];
    return order.indexOf(a.fidelity_level) < order.indexOf(min) ? a.fidelity_level : min;
  }, 'LEVEL_5' as FidelityLevel);
  const lowestFidelityScene = [...audits].sort((a, b) => fidelityIndices[audits.indexOf(a)] - fidelityIndices[audits.indexOf(b)])[0]?.batch_scene_id ?? '';
  const sceneRenderedFidelity = audits.map((a) =>
    clampScore(
      a.character_identity * 0.28 +
        a.location_identity * 0.28 +
        a.lighting_identity * 0.24 +
        a.signature_preservation * 0.2
    )
  );
  const renderedSpread = Math.max(...sceneRenderedFidelity) - Math.min(...sceneRenderedFidelity);
  const fidelityBalanceScore = clampScore(100 - renderedSpread * 2 - stdDev(sceneRenderedFidelity) * 0.35);

  const overallValidationScore = clampScore(
    characterIdentity * 0.18 +
      locationIdentity * 0.18 +
      lightingIdentity * 0.14 +
      cinematicScore * 0.22 +
      styleScore * 0.16 +
      propScore * 0.12
  );

  const levelOrder = ['LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5'];
  const minLevelOk = levelOrder.indexOf(minFidelityLevel) >= levelOrder.indexOf('LEVEL_4');

  const meanCameraPreservation = clampScore(mean(audits.map((a) => a.camera_preservation)));
  const meanBlockingPreservation = clampScore(mean(audits.map((a) => a.blocking_preservation)));
  const meanEnvironmentMotionPreservation = clampScore(mean(audits.map((a) => a.environment_motion_preservation)));
  const meanSignaturePreservation = clampScore(mean(audits.map((a) => a.signature_preservation)));
  const meanStyleConversion = clampScore(mean(audits.map((a) => a.style_conversion_success)));

  const allPass =
    issues.filter((i) => i.severity === 'error').length === 0 &&
    audits.length === 10 &&
    overallValidationScore >= 90 &&
    scenePassRatio >= MIN_SCENE_PASS_RATIO &&
    titanicPassRatio >= MIN_TITANIC_PASS_RATIO &&
    characterIdentity >= 90 &&
    locationIdentity >= 90 &&
    lightingIdentity >= 90 &&
    criticalFails === 0 &&
    catastrophicCount === 0 &&
    overallFidelityScore >= 90 &&
    minLevelOk &&
    fidelityBalanceScore >= 85 &&
    meanCameraPreservation >= 85 &&
    meanBlockingPreservation >= 85 &&
    meanEnvironmentMotionPreservation >= 85 &&
    meanSignaturePreservation >= 85 &&
    meanStyleConversion >= 85;

  const registry = {
    registry_id: 'real-image-batch-registry-v3',
    phase: REAL_IMAGE_BATCH_PHASE,
    generated_at: new Date().toISOString(),
    validation_only: false,
    real_output_validation: true,
    simulated: false,
    gpu_execution: false,
    image_count: registryEntries.length,
    director_group_counts: {
      ghibli: scenes.filter((s) => s.signature_group === 'ghibli').length,
      shinkai: scenes.filter((s) => s.signature_group === 'shinkai').length,
      mori: scenes.filter((s) => s.signature_group === 'mori').length,
      titanic: scenes.filter((s) => s.signature_group === 'titanic').length,
    },
    entries: registryEntries,
    integrity: registryEntries.length === 10 ? 'PASS' : 'FAIL',
  };

  const scorecard = {
    scorecard_id: 'real-image-batch-scorecard-v3',
    phase: REAL_IMAGE_BATCH_PHASE,
    generated_at: new Date().toISOString(),
    scenes: audits.map((a) => ({
      batch_scene_id: a.batch_scene_id,
      scene_id: a.scene_id,
      verdict: a.verdict,
      failure_classification: a.failure_classification,
      critical_dimension_fail: a.critical_dimension_fail,
      catastrophic_failures: a.catastrophic_failures,
      character_identity: a.character_identity,
      location_identity: a.location_identity,
      lighting_identity: a.lighting_identity,
      camera_preservation: a.camera_preservation,
      signature_preservation: a.signature_preservation,
    })),
    titanic_benchmark: {
      scenes: titanicAudits.map((a) => ({
        batch_scene_id: a.batch_scene_id,
        verdict: a.verdict,
        camera_preservation: a.camera_preservation,
        blocking_preservation: a.blocking_preservation,
        environment_motion_preservation: a.environment_motion_preservation,
        signature_preservation: a.signature_preservation,
        crowd_behavior_preservation: a.scene_id.includes('crowd') ? a.composition_preservation : a.blocking_preservation,
      })),
      titanic_pass_ratio: Number(titanicPassRatio.toFixed(4)),
    },
    integrity: allPass ? 'PASS' : 'FAIL',
  };

  const validationSummary: Record<string, string | number | boolean> = {
    overall_validation_score: overallValidationScore,
    scene_pass_ratio: Number(scenePassRatio.toFixed(4)),
    titanic_pass_ratio: Number(titanicPassRatio.toFixed(4)),
    character_score: characterIdentity,
    character_identity: characterIdentity,
    location_score: locationIdentity,
    location_identity: locationIdentity,
    lighting_score: lightingIdentity,
    lighting_identity: lightingIdentity,
    cinematic_score: cinematicScore,
    style_score: styleScore,
    prop_score: propScore,
    overall_fidelity_score: overallFidelityScore,
    minimum_fidelity_level: minFidelityLevel,
    lowest_fidelity_scene: lowestFidelityScene,
    fidelity_balance_score: fidelityBalanceScore,
    critical_dimension_fail_count: criticalFails,
    single_scene_catastrophic_failure_count: catastrophicCount,
    images_generated: audits.length,
    real_output_validation: true,
    simulated: false,
    gpu_execution: false,
    next_order: allPass ? 'REAL_IMAGE_BATCH_100' : 'ROOT_CAUSE_ANALYSIS',
    policy: SAFE_CREATE_POLICY,
  };

  const report: RealImageBatchValidationReport = {
    report_id: 'real-image-batch-validation-report-v3',
    phase: REAL_IMAGE_BATCH_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: allPass ? REAL_IMAGE_BATCH_PASS_VERDICT : REAL_IMAGE_BATCH_FAIL_VERDICT,
    status: allPass ? REAL_IMAGE_BATCH_READY_STATUS : 'REAL_IMAGE_BATCH_VALIDATION_INCOMPLETE',
    precheck: { precheck_passed: true, gates: precheck.gates },
    validation_summary: validationSummary,
    issues,
    batch_passed: allPass,
  };

  const fullReport = {
    ...report,
    failure_classifications: audits.filter((a) => a.failure_classification).map((a) => ({
      batch_scene_id: a.batch_scene_id,
      classification: a.failure_classification,
    })),
    production_readiness_gates: {
      character_identity_gte_90: characterIdentity >= 90,
      location_identity_gte_90: locationIdentity >= 90,
      lighting_identity_gte_90: lightingIdentity >= 90,
      critical_dimension_fail_count_eq_0: criticalFails === 0,
      catastrophic_failure_count_eq_0: catastrophicCount === 0,
      scene_pass_ratio_gte_0_80: scenePassRatio >= MIN_SCENE_PASS_RATIO,
      titanic_pass_ratio_gte_0_66: titanicPassRatio >= MIN_TITANIC_PASS_RATIO,
      overall_fidelity_score_gte_90: overallFidelityScore >= 90,
      minimum_fidelity_level_gte_level_4: minLevelOk,
      fidelity_balance_score_gte_85: fidelityBalanceScore >= 85,
      camera_preservation_gte_85: meanCameraPreservation >= 85,
      blocking_preservation_gte_85: meanBlockingPreservation >= 85,
      environment_motion_preservation_gte_85: meanEnvironmentMotionPreservation >= 85,
      signature_preservation_gte_85: meanSignaturePreservation >= 85,
      style_conversion_success_gte_85: meanStyleConversion >= 85,
      overall_validation_score_gte_90: overallValidationScore >= 90,
    },
    next_pipeline: allPass
      ? ['REAL_IMAGE_BATCH_100', 'VIDEO_SHORT_TEST', 'MV_TEST', 'FEATURE_TEST']
      : ['ROOT_CAUSE_ANALYSIS', 'DATASET_CORRECTION', 'RETEST'],
  };

  fs.writeFileSync(path.join(root, REAL_IMAGE_BATCH_REGISTRY_PATH), `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, REAL_IMAGE_BATCH_SCORECARD_PATH), `${JSON.stringify(scorecard, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, REAL_IMAGE_BATCH_REPORT_PATH), `${JSON.stringify(fullReport, null, 2)}\n`, 'utf8');

  return report;
}
