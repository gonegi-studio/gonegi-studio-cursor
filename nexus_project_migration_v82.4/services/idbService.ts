import { openDB, IDBPDatabase } from 'idb';
import { CinematicExtractionResult } from '../types';
import { APP_VERSION } from '../components/features/lab/constants/lab.constants';

const DB_NAME = `CinematicCognitionDB_${APP_VERSION}`;
const STORE_NAME = 'cinematic_results';
const RECIPE_STORE = 'production_recipes';
const SETTINGS_STORE = 'system_settings';
const DB_VERSION = 3;

export class CinematicIDBService {
  public dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('source_material', 'scene_indexing.source_material');
          store.createIndex('analysis_timestamp', 'analysis_timestamp');
        }
        if (!db.objectStoreNames.contains(RECIPE_STORE)) {
          db.createObjectStore(RECIPE_STORE, { keyPath: 'recipe_id' });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE);
        }
      },
    });
  }

  async saveResult(result: CinematicExtractionResult): Promise<string> {
    const db = await this.dbPromise;
    await db.put(STORE_NAME, result);
    return result.id;
  }

  async setSetting(key: string, value: any): Promise<void> {
    const db = await this.dbPromise;
    await db.put(SETTINGS_STORE, value, key);
  }

  async getSetting(key: string): Promise<any> {
    const db = await this.dbPromise;
    return db.get(SETTINGS_STORE, key);
  }

  async saveRecipe(recipe: any): Promise<string> {
    const db = await this.dbPromise;
    await db.put(RECIPE_STORE, recipe);
    return recipe.recipe_id;
  }

  async getAllRecipes(): Promise<any[]> {
    const db = await this.dbPromise;
    return db.getAll(RECIPE_STORE);
  }

  async deleteRecipe(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(RECIPE_STORE, id);
  }

  async saveResults(results: CinematicExtractionResult[]): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const result of results) {
      await tx.store.put(result);
    }
    await tx.done;
  }

  async getAllResults(): Promise<CinematicExtractionResult[]> {
    const db = await this.dbPromise;
    return db.getAll(STORE_NAME);
  }

  async getResultsBySource(sourceMaterial: string): Promise<CinematicExtractionResult[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex(STORE_NAME, 'source_material', sourceMaterial);
  }

  async deleteResult(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, id);
  }

  async clearAll(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear(STORE_NAME);
  }

  async getCount(): Promise<number> {
    const db = await this.dbPromise;
    return db.count(STORE_NAME);
  }
}

export const cinematicDB = new CinematicIDBService();
