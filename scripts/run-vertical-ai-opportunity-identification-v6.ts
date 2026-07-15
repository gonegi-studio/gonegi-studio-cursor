import { writeVerticalAiOpportunityIdentificationV6EngineReport } from '../services/verticalAiOpportunityIdentificationV6Engine.js';

const result = writeVerticalAiOpportunityIdentificationV6EngineReport();
console.log(result.verdict);
if (result.selectedDomainId) {
  console.log(`selected_domain=${result.selectedDomainId}`);
}
process.exit(result.passed ? 0 : 1);
