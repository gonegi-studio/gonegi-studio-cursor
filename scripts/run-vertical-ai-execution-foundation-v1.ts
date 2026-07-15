import { writeVerticalAiExecutionFoundationV1EngineReport } from '../services/verticalAiExecutionFoundationV1Engine.js';

const result = writeVerticalAiExecutionFoundationV1EngineReport();
console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
