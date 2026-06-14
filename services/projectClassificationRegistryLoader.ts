import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_CLASSIFICATION_REGISTRY_PATH,
  type ProjectClassificationRegistry,
} from './projectClassificationBuilder.js';
import { normalizePath } from './projectInventoryBuilder.js';

export function loadClassificationRegistry(root: string): ProjectClassificationRegistry {
  return JSON.parse(
    fs.readFileSync(path.join(root, PROJECT_CLASSIFICATION_REGISTRY_PATH), 'utf8')
  ) as ProjectClassificationRegistry;
}

export { normalizePath };
