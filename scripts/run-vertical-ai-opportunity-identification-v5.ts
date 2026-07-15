import { writeVerticalAiOpportunityIdentificationV5EngineReport } from '../services/verticalAiOpportunityIdentificationV5Engine.js';

const result = writeVerticalAiOpportunityIdentificationV5EngineReport();
console.log(result.verdict);
if (result.selectedDomainId) {
  console.log(`selected_domain=${result.selectedDomainId}`);
}
process.exit(result.passed ? 0 : 1);
