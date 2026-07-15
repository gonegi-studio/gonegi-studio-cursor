import { writeVerticalAiOpportunityIdentificationV19EngineReport } from '../services/verticalAiOpportunityIdentificationV19Engine.js';

const result = writeVerticalAiOpportunityIdentificationV19EngineReport();

console.log(result.verdict);
if (result.selectedDomainId) {
  console.log(`selected_domain=${result.selectedDomainId}`);
}
process.exit(result.passed ? 0 : 1);
