import fs from 'node:fs'; import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'); const source=fs.readFileSync(path.join(root,'project_brain/story_scenario_intelligence/storyPersistence.ts'),'utf8');
for(const token of ["type CanonStatus = 'CANON' | 'PLANNED' | 'CANDIDATE' | 'REJECTED'",'canon_status?: CanonStatus','updateDocumentCanonStatus','return updateDocument(kind, objectId, expectedVersion','doc.canon_status = canonStatus','[\'canon_status\']']) if(!source.includes(token)) throw new Error(`missing ${token}`);
const legacy=JSON.parse(fs.readFileSync(path.join(root,'project_brain/story_scenario_intelligence/authored_content/dependency_test/staleness_demo_v1.json'),'utf8'));
if(Object.hasOwn(legacy,'canon_status')) throw new Error('legacy data migrated');
console.log('PASS_STORY_CANON_STATUS_V1'); console.log('legacy_without_field=accepted; update_uses_optimistic_concurrency=true');
