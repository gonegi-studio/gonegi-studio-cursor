import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'GhibliMasterpieceDB';
const STORE_NAME = 'images';

export async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function saveImageToDB(id: string, dataUrl: string) {
  const db = await initDB();
  await db.put(STORE_NAME, dataUrl, id);
}

export async function getImageFromDB(id: string): Promise<string | undefined> {
  const db = await initDB();
  return db.get(STORE_NAME, id);
}

export async function getAllImagesFromDB(): Promise<Record<string, string>> {
  const db = await initDB();
  const keys = await db.getAllKeys(STORE_NAME);
  const images: Record<string, string> = {};
  for (const key of keys) {
    const val = await db.get(STORE_NAME, key);
    images[key.toString()] = val;
  }
  return images;
}

export async function deleteImageFromDB(id: string) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}
