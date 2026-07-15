import { writeVerticalAiOpportunityIdentificationV4EngineReport } from '../services/verticalAiOpportunityIdentificationV4Engine.js';

const result = writeVerticalAiOpportunityIdentificationV4EngineReport();
console.log(result.verdict);
if (result.selectedDomainId) {
  console.log(`selected_domain=${result.selectedDomainId}`);
}
process.exit(result.passed ? 0 : 1);
