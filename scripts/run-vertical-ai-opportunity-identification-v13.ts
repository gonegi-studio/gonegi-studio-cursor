import { writeVerticalAiOpportunityIdentificationV13EngineReport } from '../services/verticalAiOpportunityIdentificationV13Engine.js';

const result = writeVerticalAiOpportunityIdentificationV13EngineReport();

console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
