import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeGhibli01GrammarCatalog } from '../services/ghibli01GrammarCatalog.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = writeGhibli01GrammarCatalog(projectRoot);

console.log(`Wrote ${catalog.candidate_counts.camera} camera candidates`);
console.log(`Wrote ${catalog.candidate_counts.acting} acting candidates`);
console.log(`Wrote ${catalog.candidate_counts.daily_life} daily_life candidates`);
console.log(`Wrote ${catalog.candidate_counts.object_interaction} object_interaction candidates`);
console.log(`Wrote ${catalog.candidate_counts.extra_actor} extra_actor candidates`);
console.log(`Wrote ${catalog.candidate_counts.animal} animal candidates`);
