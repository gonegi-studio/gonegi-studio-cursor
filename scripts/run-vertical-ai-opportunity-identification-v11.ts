import { writeVerticalAiOpportunityIdentificationV11EngineReport } from '../services/verticalAiOpportunityIdentificationV11Engine.js';

const result = writeVerticalAiOpportunityIdentificationV11EngineReport();
console.log(result.verdict);
if (result.selectedDomainId) {
  console.log(`selected_domain=${result.selectedDomainId}`);
}
process.exit(result.passed ? 0 : 1);
