import { writeVerticalAiOpportunityIdentificationV16EngineReport } from '../services/verticalAiOpportunityIdentificationV16Engine.js';

const result = writeVerticalAiOpportunityIdentificationV16EngineReport();

console.log(result.verdict);
console.log(result.selectedDomainId ?? 'none');
process.exit(result.passed ? 0 : 1);
