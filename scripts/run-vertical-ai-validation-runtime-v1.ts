import { writeVerticalAiValidationRuntimeV1EngineReport } from '../services/verticalAiValidationRuntimeV1Engine.js';

const result = writeVerticalAiValidationRuntimeV1EngineReport();
console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
