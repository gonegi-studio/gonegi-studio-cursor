import { writeVerticalAiOpportunityIdentificationV7EngineReport } from '../services/verticalAiOpportunityIdentificationV7Engine.js';

const result = writeVerticalAiOpportunityIdentificationV7EngineReport();
console.log(result.verdict);
if (result.selectedDomainId) {
  console.log(`selected_domain=${result.selectedDomainId}`);
}
process.exit(result.passed ? 0 : 1);
