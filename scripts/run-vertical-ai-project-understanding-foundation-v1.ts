import { writeVerticalAiProjectUnderstandingFoundationV1EngineReport } from '../services/verticalAiProjectUnderstandingFoundationV1Engine.js';

const result = writeVerticalAiProjectUnderstandingFoundationV1EngineReport();
console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
