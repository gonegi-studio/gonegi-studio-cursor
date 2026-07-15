import { writeVerticalAiOpportunityIdentificationV8EngineReport } from '../services/verticalAiOpportunityIdentificationV8Engine.js';

const result = writeVerticalAiOpportunityIdentificationV8EngineReport();
console.log(result.verdict);
if (result.selectedDomainId) {
  console.log(`selected_domain=${result.selectedDomainId}`);
}
process.exit(result.passed ? 0 : 1);
