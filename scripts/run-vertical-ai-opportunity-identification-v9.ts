import { writeVerticalAiOpportunityIdentificationV9EngineReport } from '../services/verticalAiOpportunityIdentificationV9Engine.js';

const result = writeVerticalAiOpportunityIdentificationV9EngineReport();
console.log(result.verdict);
if (result.selectedDomainId) {
  console.log(`selected_domain=${result.selectedDomainId}`);
}
process.exit(result.passed ? 0 : 1);
