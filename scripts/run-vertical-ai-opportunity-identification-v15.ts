import { writeVerticalAiOpportunityIdentificationV15EngineReport } from '../services/verticalAiOpportunityIdentificationV15Engine.js';

const result = writeVerticalAiOpportunityIdentificationV15EngineReport();

console.log(result.verdict);
console.log(result.selectedDomainId ?? 'none');
process.exit(result.passed ? 0 : 1);
