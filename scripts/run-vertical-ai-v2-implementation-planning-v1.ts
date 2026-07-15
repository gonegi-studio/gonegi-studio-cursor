import { writeVerticalAiV2ImplementationPlanningV1EngineReport } from '../services/verticalAiV2ImplementationPlanningV1Engine.js';

const result = writeVerticalAiV2ImplementationPlanningV1EngineReport();
console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
