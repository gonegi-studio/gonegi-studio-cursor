import { writeVerticalAiValidationFoundationV1EngineReport } from '../services/verticalAiValidationFoundationV1Engine.js';

const result = writeVerticalAiValidationFoundationV1EngineReport();
console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
