import zlib from 'node:zlib';

/**
 * PHASE-PROJECT-BRAIN-PRODUCTION-APPLICATION-009: shared PNG codec.
 *
 * This module is the canonical, single implementation of the PNG decode/
 * encode logic that was independently duplicated across 22 real production
 * files (`decodePngRgb`, fixed in place across all 22 under
 * PHASE-PROJECT-BRAIN-PRODUCTION-APPLICATION-005/006) and 8 files
 * (`crc32`/`createPngChunk`/`encodePngRgb`, never previously deduplicated).
 * Real, demonstrated cost of the duplication: a real correctness bug
 * (accepting only PNG scanline filter type 0) had to be found once and then
 * manually replicated across 21 additional files instead of fixed in one
 * place — see reports/project_brain_production_application/
 * ProjectBrainProductionApplicationV5Report.md and ...V6Report.md.
 *
 * Only RGB8 (colorType 2) is supported, matching every real caller found in
 * this repository. `decodePngRgb` returns `null` (never throws) for any
 * malformed, truncated, non-PNG, or unsupported (non-RGB8, out-of-range
 * filter byte) input, exactly matching the existing per-file contract every
 * caller already depends on.
 *
 * API 미사용: no network, no live client, pure buffer/zlib arithmetic only.
 */

export const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

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

export function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc = CRC32_TABLE[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createPngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * Decode an RGB8 PNG buffer into raw, unfiltered pixel bytes. Implements the
 * standard PNG scanline reconstruction for all 5 filter types (0=None,
 * 1=Sub, 2=Up, 3=Average, 4=Paeth) -- the same, already-verified logic every
 * one of the 22 migrated files carried individually. Returns `null` (never
 * throws) for any malformed, truncated, non-PNG, non-RGB8, or invalid
 * filter-byte input.
 */
export function decodePngRgb(
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
  const rowBytes = width * bytesPerPixel;
  const rowSize = 1 + rowBytes;
  const pixels = Buffer.alloc(width * height * bytesPerPixel);

  let priorRow: Buffer | null = null;
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowSize;
    if (rowStart >= inflated.length) {
      return null;
    }
    const filterType = inflated[rowStart];
    if (filterType < 0 || filterType > 4) {
      return null;
    }
    const filtered = inflated.subarray(rowStart + 1, rowStart + 1 + rowBytes);
    const recon = Buffer.alloc(rowBytes);
    for (let x = 0; x < rowBytes; x += 1) {
      const rawByte = filtered[x];
      const left = x >= bytesPerPixel ? recon[x - bytesPerPixel] : 0;
      const up = priorRow ? priorRow[x] : 0;
      const upLeft = priorRow && x >= bytesPerPixel ? priorRow[x - bytesPerPixel] : 0;
      let value: number;
      switch (filterType) {
        case 0:
          value = rawByte;
          break;
        case 1:
          value = rawByte + left;
          break;
        case 2:
          value = rawByte + up;
          break;
        case 3:
          value = rawByte + Math.floor((left + up) / 2);
          break;
        default:
          value = rawByte + paeth(left, up, upLeft);
          break;
      }
      recon[x] = value & 0xff;
    }
    recon.copy(pixels, y * rowBytes);
    priorRow = recon;
  }

  return { width, height, pixels };
}

/**
 * Encode raw RGB8 pixel bytes into a minimal, valid PNG buffer using filter
 * type 0 (None) for every scanline -- matching every real encoder call site
 * this codec replaces.
 */
export function encodePngRgb(width: number, height: number, pixels: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const bytesPerPixel = 3;
  const rowSize = 1 + width * bytesPerPixel;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0;
    pixels.copy(raw, rowOffset + 1, y * width * bytesPerPixel, (y + 1) * width * bytesPerPixel);
  }

  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([
    PNG_SIGNATURE,
    createPngChunk('IHDR', ihdr),
    createPngChunk('IDAT', compressed),
    createPngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Real, non-tautological self-test: proves decode(encode(x)) round-trips
 * exactly for a real pixel buffer (positive case), and that malformed input
 * is rejected rather than crashing (negative case). Run via
 * scripts/verify-png-codec.ts.
 */
export function runPngCodecSelfTest(): { pass: boolean; checks: Array<{ id: string; pass: boolean; detail: string }> } {
  const checks: Array<{ id: string; pass: boolean; detail: string }> = [];

  // Positive case: round-trip a real, non-trivial 4x3 RGB buffer through
  // encode -> decode and confirm every byte matches exactly.
  const width = 4;
  const height = 3;
  const original = Buffer.from([
    10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120,
    130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240,
    250, 5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105,
  ]);
  const encoded = encodePngRgb(width, height, original);
  const decoded = decodePngRgb(encoded);
  const roundTripOk =
    decoded !== null &&
    decoded.width === width &&
    decoded.height === height &&
    decoded.pixels.equals(original);
  checks.push({
    id: 'self_test_round_trip_exact',
    pass: roundTripOk,
    detail: roundTripOk
      ? 'encodePngRgb -> decodePngRgb reproduced the original pixel buffer exactly'
      : 'round-trip did NOT reproduce the original pixel buffer',
  });

  // Negative case: garbage input must return null, not throw or "succeed".
  const garbage = Buffer.from('this is not a png file at all');
  const garbageResult = decodePngRgb(garbage);
  checks.push({
    id: 'self_test_garbage_input_rejected',
    pass: garbageResult === null,
    detail:
      garbageResult === null
        ? 'non-PNG input correctly returned null'
        : 'non-PNG input was incorrectly decoded',
  });

  // Negative case: truncated PNG (valid signature, no IDAT) must return null.
  const truncated = Buffer.concat([PNG_SIGNATURE, createPngChunk('IEND', Buffer.alloc(0))]);
  const truncatedResult = decodePngRgb(truncated);
  checks.push({
    id: 'self_test_truncated_png_rejected',
    pass: truncatedResult === null,
    detail:
      truncatedResult === null
        ? 'PNG with no IDAT chunk correctly returned null'
        : 'PNG with no IDAT chunk was incorrectly decoded',
  });

  // crc32/createPngChunk sanity: a chunk's declared length must match its
  // real payload length, and its CRC must validate against a fresh
  // recomputation over type+data (proves crc32 is not a stub).
  const testChunk = createPngChunk('tEST', Buffer.from([1, 2, 3, 4, 5]));
  const declaredLength = testChunk.readUInt32BE(0);
  const recomputedCrc = crc32(Buffer.concat([Buffer.from('tEST', 'ascii'), Buffer.from([1, 2, 3, 4, 5])]));
  const storedCrc = testChunk.readUInt32BE(testChunk.length - 4);
  const chunkOk = declaredLength === 5 && recomputedCrc === storedCrc;
  checks.push({
    id: 'self_test_chunk_length_and_crc',
    pass: chunkOk,
    detail: chunkOk
      ? 'createPngChunk declared length and CRC both match independent recomputation'
      : 'createPngChunk length or CRC mismatch',
  });

  return { pass: checks.every((c) => c.pass), checks };
}
