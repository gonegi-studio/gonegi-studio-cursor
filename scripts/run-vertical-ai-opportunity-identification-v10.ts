import { writeVerticalAiOpportunityIdentificationV10EngineReport } from '../services/verticalAiOpportunityIdentificationV10Engine.js';

const result = writeVerticalAiOpportunityIdentificationV10EngineReport();
console.log(result.verdict);
if (result.selectedDomainId) {
  console.log(`selected_domain=${result.selectedDomainId}`);
}
process.exit(result.passed ? 0 : 1);
