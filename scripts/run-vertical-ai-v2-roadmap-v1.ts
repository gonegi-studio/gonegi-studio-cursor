import { writeVerticalAiV2RoadmapV1EngineReport } from '../services/verticalAiV2RoadmapV1Engine.js';

const result = writeVerticalAiV2RoadmapV1EngineReport();
console.log(result.verdict);
process.exit(result.passed ? 0 : 1);
