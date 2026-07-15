import { writeVerticalAiCertificationFoundationV1EngineReport } from '../services/verticalAiCertificationFoundationV1Engine.js';

const result = writeVerticalAiCertificationFoundationV1EngineReport();
console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
