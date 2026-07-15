import { writeVerticalAiProjectUnderstandingRuntimeV1EngineReport } from '../services/verticalAiProjectUnderstandingRuntimeV1Engine.js';

const result = writeVerticalAiProjectUnderstandingRuntimeV1EngineReport();
console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
