import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * PHASE-PROJECT-BRAIN-PRODUCTION-APPLICATION-011: shared JSON file I/O.
 *
 * Real repository-wide discovery (PHASE-PROJECT-BRAIN-PRODUCTION-APPLICATION-007,
 * confirmed with real Impact/Risk numbers in ...-008) found that `writeJson`
 * is independently redefined in 1,714 real service files -- the single
 * largest duplicated-algorithm pattern in this repository, ~30x larger than
 * the PNG codec cluster (which had a real, proven bug requiring a 22-file
 * fix). 92.8% of those 1,714 instances (1,590 files) are one mechanically
 * identical form; the remaining ~8% differ only in parameter naming
 * (`rel` vs `relativePath`) or whether the joined path is stored in a local
 * variable before use -- purely cosmetic, never a behavioral difference.
 *
 * This module is that canonical form. Per PHASE-...-011's own scope
 * (`1,714개 전체 금지` / batch migration forbidden), only a small,
 * representative PoC migration (3-5 files, one per real variant) is
 * performed against it in this phase -- see
 * reports/project_brain_production_application/ProjectBrainProductionApplicationV11Report.md
 * for the real regression evidence.
 *
 * API 미사용: no network, no live client, pure `node:fs`/`node:path`.
 */
export function writeJsonFile(root: string, relativePath: string, value: unknown): void {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/**
 * Real, non-tautological self-test: proves the written file round-trips
 * back to the exact original value (positive case), and that the byte
 * output is stable/deterministic across repeated calls with the same input
 * (negative-adjacent case: proves it's not accidentally embedding a
 * timestamp or other nondeterministic content that would silently break
 * every one of the 1,714 real call sites' own regression expectations).
 * Run via scripts/verify-json-file-io.ts.
 */
export function runJsonFileIoSelfTest(): { pass: boolean; checks: Array<{ id: string; pass: boolean; detail: string }> } {
  const scratchRoot = path.join(os.tmpdir(), 'json-file-io-self-test-v11');
  fs.rmSync(scratchRoot, { recursive: true, force: true });
  fs.mkdirSync(scratchRoot, { recursive: true });

  const checks: Array<{ id: string; pass: boolean; detail: string }> = [];

  // Positive case: write a real, non-trivial nested value, read it back,
  // confirm exact structural equality.
  const sampleValue = {
    phase: 'PHASE-TEST',
    nested: { a: 1, b: [1, 2, 3], c: null },
    note: 'self_test_sample',
  };
  writeJsonFile(scratchRoot, 'nested/dir/sample.json', sampleValue);
  const readBack = JSON.parse(fs.readFileSync(path.join(scratchRoot, 'nested/dir/sample.json'), 'utf8'));
  const roundTripOk = JSON.stringify(readBack) === JSON.stringify(sampleValue);
  checks.push({
    id: 'self_test_round_trip_exact',
    pass: roundTripOk,
    detail: roundTripOk
      ? 'writeJsonFile -> read back reproduced the original value exactly'
      : 'round-trip did NOT reproduce the original value',
  });

  // Positive case: parent directories that do not yet exist must be created.
  const dirCreated = fs.existsSync(path.join(scratchRoot, 'nested/dir'));
  checks.push({
    id: 'self_test_creates_missing_parent_dirs',
    pass: dirCreated,
    detail: dirCreated
      ? 'missing nested parent directories were created'
      : 'parent directory was not created',
  });

  // Determinism case: writing the same value twice must produce byte-identical output.
  writeJsonFile(scratchRoot, 'a.json', sampleValue);
  const bytesA = fs.readFileSync(path.join(scratchRoot, 'a.json'), 'utf8');
  writeJsonFile(scratchRoot, 'b.json', sampleValue);
  const bytesB = fs.readFileSync(path.join(scratchRoot, 'b.json'), 'utf8');
  const deterministicOk = bytesA === bytesB;
  checks.push({
    id: 'self_test_deterministic_output',
    pass: deterministicOk,
    detail: deterministicOk
      ? 'writing the same value twice produced byte-identical output'
      : 'output was not deterministic for identical input',
  });

  // Format case: output must be 2-space-indented JSON with a trailing
  // newline, matching every one of the 1,714 real call sites' own format.
  const formatOk = bytesA === `${JSON.stringify(sampleValue, null, 2)}\n`;
  checks.push({
    id: 'self_test_matches_dominant_format',
    pass: formatOk,
    detail: formatOk
      ? 'output format matches the dominant real writeJson variant exactly (2-space indent + trailing newline)'
      : 'output format diverges from the dominant real variant',
  });

  fs.rmSync(scratchRoot, { recursive: true, force: true });

  return { pass: checks.every((c) => c.pass), checks };
}
