import { writeVerticalAiFinalCertificationV1EngineReport } from '../services/verticalAiFinalCertificationV1Engine.js';

const result = writeVerticalAiFinalCertificationV1EngineReport();
console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
