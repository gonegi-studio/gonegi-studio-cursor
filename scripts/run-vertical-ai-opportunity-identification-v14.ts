import { writeVerticalAiOpportunityIdentificationV14EngineReport } from '../services/verticalAiOpportunityIdentificationV14Engine.js';

const result = writeVerticalAiOpportunityIdentificationV14EngineReport();

console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
