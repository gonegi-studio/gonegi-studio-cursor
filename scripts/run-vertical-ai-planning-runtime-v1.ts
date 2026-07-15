import { writeVerticalAiPlanningRuntimeV1EngineReport } from '../services/verticalAiPlanningRuntimeV1Engine.js';

const result = writeVerticalAiPlanningRuntimeV1EngineReport();
console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
