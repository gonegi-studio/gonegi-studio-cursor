import { writeVerticalAiOpportunityIdentificationV1EngineReport } from '../services/verticalAiOpportunityIdentificationV1Engine.js';

const result = writeVerticalAiOpportunityIdentificationV1EngineReport();
console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
