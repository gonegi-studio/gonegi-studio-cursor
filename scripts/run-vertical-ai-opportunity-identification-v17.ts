import { writeVerticalAiOpportunityIdentificationV17EngineReport } from '../services/verticalAiOpportunityIdentificationV17Engine.js';

const result = writeVerticalAiOpportunityIdentificationV17EngineReport();

console.log(result.verdict);
console.log(result.selectedDomainId ?? 'none');
process.exit(result.passed ? 0 : 1);
