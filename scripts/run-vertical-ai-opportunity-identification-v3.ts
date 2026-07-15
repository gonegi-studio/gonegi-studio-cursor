import { writeVerticalAiOpportunityIdentificationV3EngineReport } from '../services/verticalAiOpportunityIdentificationV3Engine.js';

const result = writeVerticalAiOpportunityIdentificationV3EngineReport();
console.log(result.verdict);
if (result.selectedDomainId) {
  console.log(`selected_domain=${result.selectedDomainId}`);
}
process.exit(result.passed ? 0 : 1);
