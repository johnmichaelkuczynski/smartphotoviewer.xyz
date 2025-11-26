import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { EmbeddingCache } from '../types';

interface PhotoViewerDB extends DBSchema {
  embeddings: {
    key: string;
    value: EmbeddingCache;
    indexes: { 'by-path': string };
  };
}

const DB_NAME = 'PhotoViewerDB';
const DB_VERSION = 1;
const STORE_NAME = 'embeddings';

let dbInstance: IDBPDatabase<PhotoViewerDB> | null = null;

async function getDB(): Promise<IDBPDatabase<PhotoViewerDB>> {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB<PhotoViewerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'path' });
        store.createIndex('by-path', 'path');
      }
    },
  });
  
  return dbInstance;
}

export async function saveEmbedding(cache: EmbeddingCache): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, cache);
}

export async function getEmbedding(path: string): Promise<EmbeddingCache | null> {
  const db = await getDB();
  const result = await db.get(STORE_NAME, path);
  return result || null;
}

export async function getAllEmbeddings(): Promise<EmbeddingCache[]> {
  const db = await getDB();
  return await db.getAll(STORE_NAME);
}

export async function deleteEmbedding(path: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, path);
}

export async function clearAllEmbeddings(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

export async function getEmbeddingsByPaths(paths: string[]): Promise<Map<string, EmbeddingCache>> {
  const db = await getDB();
  const map = new Map<string, EmbeddingCache>();
  
  for (const path of paths) {
    const cache = await db.get(STORE_NAME, path);
    if (cache) {
      map.set(path, cache);
    }
  }
  
  return map;
}
