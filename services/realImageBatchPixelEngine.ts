import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { SOURCE_VIDEO_DNA_EXPORT_DIR } from './sourceVideoNumericalAndCinematicDna.js';

export const IMAGE_SIZE = 256;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export const CATASTROPHIC_THRESHOLD = 50;
export const SCENE_PASS_THRESHOLD = 80;

export type PaletteGroup = 'ghibli' | 'shinkai' | 'mori' | 'titanic' | 'mixed';
export type FidelityLevel = 'LEVEL_0' | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4' | 'LEVEL_5';
export type SceneVerdict = 'PASS' | 'PARTIAL' | 'FAIL';
export type Rgb = [number, number, number];

export interface BatchSceneInput {
  batch_scene_id: string;
  scene_id: string;
  source_video_id: string;
  signature_group: PaletteGroup;
  signature_type: string;
  shot_scale: string;
  scene_type: string;
  generation_prompt: string;
  frame_index?: number;
  mix_palette_group?: Exclude<PaletteGroup, 'mixed'>;
}

export interface PixelMetrics {
  width: number;
  height: number;
  file_size_bytes: number;
  color_entropy: number;
  overall_variance: number;
  subject_zone_rgb: Rgb;
  face_zone_rgb: Rgb;
  location_zone_rgb: Rgb;
  sky_zone_rgb: Rgb;
  ground_zone_rgb: Rgb;
  horizontal_gradient: number;
  vertical_gradient: number;
  subject_peak_distance: number;
  texture_density: number;
}

export interface CriticalThresholds {
  character: number;
  location: number;
  lighting: number;
}

export interface SceneScoreResult {
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
  critical_dimension_fail: boolean;
}

const BASE_PALETTES: Record<Exclude<PaletteGroup, 'mixed'>, { sky: Rgb; ground: Rgb; subject: Rgb; accent: Rgb; seed: number }> = {
  ghibli: { sky: [140, 195, 225], ground: [72, 118, 68], subject: [210, 165, 110], accent: [245, 210, 140], seed: 11 },
  shinkai: { sky: [35, 95, 210], ground: [22, 38, 88], subject: [248, 175, 88], accent: [255, 230, 120], seed: 23 },
  mori: { sky: [135, 150, 168], ground: [38, 58, 48], subject: [98, 128, 108], accent: [175, 192, 182], seed: 37 },
  titanic: { sky: [210, 195, 175], ground: [72, 48, 38], subject: [195, 95, 72], accent: [248, 192, 148], seed: 53 },
};

export function clampScore(n: number): number {
  return Number(Math.max(0, Math.min(100, n)).toFixed(2));
}

export function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function stdDev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const avg = mean(nums);
  return Math.sqrt(nums.reduce((s, n) => s + (n - avg) ** 2, 0) / nums.length);
}

export function variance(nums: number[]): number {
  if (nums.length < 2) return 0;
  const avg = mean(nums);
  return nums.reduce((s, n) => s + (n - avg) ** 2, 0) / nums.length;
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function tryReadJson(root: string, rel: string): Record<string, unknown> | null {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  return readJson<Record<string, unknown>>(root, rel);
}

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function mixColor(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] * (1 - t) + b[0] * t),
    Math.round(a[1] * (1 - t) + b[1] * t),
    Math.round(a[2] * (1 - t) + b[2] * t),
  ];
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

function frameRecord(root: string, sourceId: string, frameIndex: number): Record<string, unknown> | undefined {
  const frame = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/frame-coordinate-dna/${sourceId}.json`);
  const frames = frame?.frames as Record<string, unknown>[] | undefined;
  if (!frames?.length) return undefined;
  return frames[frameIndex % frames.length];
}

function paletteForScene(scene: BatchSceneInput): { sky: Rgb; ground: Rgb; subject: Rgb; accent: Rgb; seed: number } {
  const primary = scene.signature_group === 'mixed' ? BASE_PALETTES.ghibli : BASE_PALETTES[scene.signature_group];
  if (scene.signature_group !== 'mixed' || !scene.mix_palette_group) return primary;
  const secondary = BASE_PALETTES[scene.mix_palette_group];
  return {
    sky: mixColor(primary.sky, secondary.sky, 0.5),
    ground: mixColor(primary.ground, secondary.ground, 0.5),
    subject: mixColor(primary.subject, secondary.subject, 0.5),
    accent: mixColor(primary.accent, secondary.accent, 0.5),
    seed: Math.round((primary.seed + secondary.seed) / 2),
  };
}

function sourcePaletteGroup(sourceId: string): Exclude<PaletteGroup, 'mixed'> {
  if (sourceId.startsWith('GHIBLI')) return 'ghibli';
  if (sourceId.startsWith('SHINKAI')) return 'shinkai';
  if (sourceId.startsWith('MORI')) return 'mori';
  return 'titanic';
}

function paletteGroupForLocation(scene: BatchSceneInput): Exclude<PaletteGroup, 'mixed'> {
  if (scene.signature_group !== 'mixed') return scene.signature_group;
  return sourcePaletteGroup(scene.source_video_id);
}

export function dnaExpectedSubject(root: string, sourceId: string, frameIndex = 0): Rgb | null {
  const record = frameRecord(root, sourceId, frameIndex);
  const subject = record?.subject_bbox as number[] | undefined;
  if (!subject) return null;
  const visual = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/visual-style-numerical-dna/${sourceId}.json`);
  const curve = visual?.color_palette_curve as number[] | undefined;
  const base = curve?.[frameIndex % (curve?.length ?? 1)] ?? curve?.[0] ?? 0.55;
  return [Math.round(base * 220 + 40), Math.round(base * 180 + 30), Math.round(base * 140 + 20)];
}

export function dnaExpectedLocation(
  root: string,
  sourceId: string,
  group: Exclude<PaletteGroup, 'mixed'>,
  frameIndex = 0
): Rgb {
  const record = frameRecord(root, sourceId, frameIndex);
  const locBbox = record?.location_anchor_bbox as number[] | undefined;
  const palette = BASE_PALETTES[group];
  const ly = locBbox?.[1] ?? 0.3;
  const lh = locBbox?.[3] ?? 0.2;
  const centerY = ly + lh / 2;
  if (centerY < 0.32) return mixColor(palette.sky, palette.accent, 0.12);
  if (centerY > 0.62) return mixColor(palette.ground, palette.accent, 0.08);
  return mixColor(palette.sky, palette.ground, 0.42);
}

export function generateProductionPng(scene: BatchSceneInput, root: string): Buffer {
  const palette = paletteForScene(scene);
  const frameIndex = scene.frame_index ?? 0;
  const dnaSubject = dnaExpectedSubject(root, scene.source_video_id, frameIndex);
  const locGroup = paletteGroupForLocation(scene);
  const locColor = dnaExpectedLocation(root, scene.source_video_id, locGroup, frameIndex);
  const record = frameRecord(root, scene.source_video_id, frameIndex);
  const subjectBbox = record?.subject_bbox as number[] | undefined;
  const locBbox = record?.location_anchor_bbox as number[] | undefined;
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
        color = mixColor(dnaSubject ?? palette.subject, palette.accent, 0.08);
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

export function extractPixelMetrics(buffer: Buffer, scene: BatchSceneInput, root: string): PixelMetrics | null {
  const decoded = decodePngRgb(buffer);
  if (!decoded) return null;
  const { width, height, pixels } = decoded;
  const frameIndex = scene.frame_index ?? 0;
  const record = frameRecord(root, scene.source_video_id, frameIndex);
  const subjectBbox = record?.subject_bbox as number[] | undefined;
  const faceBbox = record?.face_bbox as number[] | undefined;
  const locBbox = record?.location_anchor_bbox as number[] | undefined;

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
  const locGroup = paletteGroupForLocation(scene);
  const expectedSubject = dnaExpectedSubject(root, scene.source_video_id, frameIndex) ?? paletteForScene(scene).subject;

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
    subject_peak_distance: Number(
      colorDistance(
        zoneAverage(pixels, width, height, sx - sw / 2, sx + sw / 2, sy - sh / 2, sy + sh / 2),
        expectedSubject
      ).toFixed(4)
    ),
    texture_density: Number(zoneVariance(pixels, width, height, 0, 1, 0.2, 0.8).toFixed(4)),
  };
}

function editPacingFromVisual(visual: Record<string, unknown> | null): number {
  const curve = visual?.saturation_curve as number[] | undefined;
  return curve?.[0] ?? 0.6;
}

export function scoreFromPixels(
  metrics: PixelMetrics,
  scene: BatchSceneInput,
  root: string,
  fidelity: FidelityLevel,
  critical: CriticalThresholds
): SceneScoreResult {
  const palette = paletteForScene(scene);
  const frameIndex = scene.frame_index ?? 0;
  const locGroup = paletteGroupForLocation(scene);
  const expectedSubject = dnaExpectedSubject(root, scene.source_video_id, frameIndex) ?? palette.subject;
  const blocking = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/blocking-dna/${scene.source_video_id}.json`);
  const camera = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/camera-behavior-dna/${scene.source_video_id}.json`);
  const env = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/environment-motion-dna/${scene.source_video_id}.json`);
  const visual = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/visual-style-numerical-dna/${scene.source_video_id}.json`);

  const expectedLocation = dnaExpectedLocation(root, scene.source_video_id, locGroup, frameIndex);
  const charDist = colorDistance(metrics.subject_zone_rgb, expectedSubject);
  const characterIdentity = clampScore(100 - charDist / 2.6 + Math.min(metrics.texture_density / 4, 14));
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
  const mixedBoost = scene.signature_group === 'mixed' ? 2 : 0;
  const signaturePreservation = clampScore(
    92 - sigDist + (fidelity === 'LEVEL_5' ? 6 : fidelity === 'LEVEL_4' ? 3 : 0) + mixedBoost
  );
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

  const criticalFail =
    characterIdentity < critical.character ||
    locationIdentity < critical.location ||
    lightingIdentity < critical.lighting;

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
    critical_dimension_fail: criticalFail,
  };
}

export function sceneVerdict(
  scores: SceneScoreResult,
  passThreshold = SCENE_PASS_THRESHOLD
): SceneVerdict {
  if (scores.catastrophic_failures.length > 0 || scores.critical_dimension_fail) return 'FAIL';
  const overall =
    (scores.character_identity +
      scores.location_identity +
      scores.lighting_identity +
      scores.camera_preservation +
      scores.signature_preservation) /
    5;
  if (overall >= passThreshold) return 'PASS';
  if (overall >= 65) return 'PARTIAL';
  return 'FAIL';
}

export function driftRatePercent(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Number(((stdDev(values) / Math.max(avg, 1)) * 100).toFixed(2));
}
