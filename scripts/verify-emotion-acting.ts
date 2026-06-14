import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runEmotionActingAudit,
  type EmotionActingVerdict,
} from '../services/emotionActingAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runEmotionActingAudit(projectRoot);

const verdict: EmotionActingVerdict = report.final_verdict;
console.log(verdict);

if (verdict !== 'PASS_EMOTION_ACTING_DNA_V1') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
