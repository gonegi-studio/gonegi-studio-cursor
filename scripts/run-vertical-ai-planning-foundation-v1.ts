import { writeVerticalAiPlanningFoundationV1EngineReport } from '../services/verticalAiPlanningFoundationV1Engine.js';

const result = writeVerticalAiPlanningFoundationV1EngineReport();
console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
