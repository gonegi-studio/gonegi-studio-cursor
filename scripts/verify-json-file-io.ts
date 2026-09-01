import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import { runJsonFileIoSelfTest } from '../services/jsonFileIo.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const result = runJsonFileIoSelfTest();

for (const check of result.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

if (!result.pass) {
  console.log('FAIL_JSON_FILE_IO_V1');
  process.exit(1);
}

console.log('PASS_JSON_FILE_IO_V1');
process.exit(0);
