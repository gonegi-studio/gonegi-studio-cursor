import { writeVerticalAiOpportunityIdentificationV12EngineReport } from '../services/verticalAiOpportunityIdentificationV12Engine.js';

const result = writeVerticalAiOpportunityIdentificationV12EngineReport();
console.log(result.verdict);
if (result.selectedDomainId) {
  console.log(`selected_domain=${result.selectedDomainId}`);
}
process.exit(result.passed ? 0 : 1);
