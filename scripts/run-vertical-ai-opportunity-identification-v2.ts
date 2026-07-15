import { writeVerticalAiOpportunityIdentificationV2EngineReport } from '../services/verticalAiOpportunityIdentificationV2Engine.js';

const result = writeVerticalAiOpportunityIdentificationV2EngineReport();
console.log(result.verdict);
if (result.selectedDomainId) {
  console.log(`selected_domain=${result.selectedDomainId}`);
}
process.exit(result.passed ? 0 : 1);
