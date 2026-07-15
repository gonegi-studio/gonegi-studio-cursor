import { writeVerticalAiGlobalCertificationV1EngineReport } from '../services/verticalAiGlobalCertificationV1Engine.js';

const result = writeVerticalAiGlobalCertificationV1EngineReport();

console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
