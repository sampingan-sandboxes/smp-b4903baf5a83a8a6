// PROVIDED — do not modify.
function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(dbName: string, storeName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error as unknown as Error);
  });
}

function idbGet<T>(dbName: string, storeName: string, key: string): Promise<T | undefined> {
  return openDb(dbName, storeName).then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const request = tx.objectStore(storeName).get(key);
        request.onsuccess = () => resolve(request.result as T | undefined);
        request.onerror = () => reject(request.error as unknown as Error);
      }),
  );
}

function idbSet<T>(dbName: string, storeName: string, key: string, value: T): Promise<void> {
  return openDb(dbName, storeName).then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error as unknown as Error);
      }),
  );
}

// IndexedDB-backed key-value store used by the msw mock handlers, falling back to a
// plain in-memory variable when IndexedDB isn't available (jsdom, used by the Vitest
// unit suite, has no implementation). Backed by IndexedDB (rather than only memory) so
// state survives MSW service worker restarts in a real browser — Chromium is free to
// terminate an idle service worker as soon as a page has zero controlled clients, which
// happens on every full navigation, not just cross-origin ones.
export function createIdbStore<T>(dbName: string, storeName: string, key: string, initial: T) {
  let memoryState = initial;

  return {
    async get(): Promise<T> {
      if (!hasIndexedDb()) return memoryState;
      const stored = await idbGet<T>(dbName, storeName, key);
      if (stored !== undefined) return stored;
      await idbSet(dbName, storeName, key, memoryState);
      return memoryState;
    },
    async set(value: T): Promise<void> {
      memoryState = value;
      if (hasIndexedDb()) await idbSet(dbName, storeName, key, value);
    },
  };
}
