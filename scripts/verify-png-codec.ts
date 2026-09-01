import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import { runPngCodecSelfTest } from '../services/pngCodec.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const result = runPngCodecSelfTest();

for (const check of result.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

if (!result.pass) {
  console.log('FAIL_PNG_CODEC_V1');
  process.exit(1);
}

console.log('PASS_PNG_CODEC_V1');
process.exit(0);
