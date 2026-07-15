import { writeVerticalAiOpportunityIdentificationV20EngineReport } from '../services/verticalAiOpportunityIdentificationV20Engine.js';

const result = writeVerticalAiOpportunityIdentificationV20EngineReport();

console.log(result.verdict);
if (result.selectedDomainId) {
  console.log(`selected_domain=${result.selectedDomainId}`);
}
process.exit(result.passed ? 0 : 1);
