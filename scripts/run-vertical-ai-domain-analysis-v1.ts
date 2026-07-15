import { writeVerticalAiDomainAnalysisV1EngineReport } from '../services/verticalAiDomainAnalysisV1Engine.js';

const result = writeVerticalAiDomainAnalysisV1EngineReport();
console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
