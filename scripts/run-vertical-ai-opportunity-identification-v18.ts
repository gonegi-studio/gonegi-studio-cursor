import { writeVerticalAiOpportunityIdentificationV18EngineReport } from '../services/verticalAiOpportunityIdentificationV18Engine.js';

const result = writeVerticalAiOpportunityIdentificationV18EngineReport();

console.log(result.verdict);
if (result.selectedDomainId) {
  console.log(`selected_domain=${result.selectedDomainId}`);
}
process.exit(result.passed ? 0 : 1);
