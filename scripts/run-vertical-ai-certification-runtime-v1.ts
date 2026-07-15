import { writeVerticalAiCertificationRuntimeV1EngineReport } from '../services/verticalAiCertificationRuntimeV1Engine.js';

const result = writeVerticalAiCertificationRuntimeV1EngineReport();
console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
