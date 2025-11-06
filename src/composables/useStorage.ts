import { ref } from 'vue';
import { Storage, Drivers } from '@ionic/storage';
import CordovaSQLiteDriver from 'localforage-cordovasqlitedriver';

let storageInstance: Storage | null = null;

export function useStorage() {
  const storage = ref<Storage | null>(null);
  const isReady = ref(false);
  const error = ref<string | null>(null);

  const initializeStorage = async () => {
    try {
      if (!storageInstance) {
        storageInstance = new Storage({
          driverOrder: [CordovaSQLiteDriver._driver, Drivers.IndexedDB, Drivers.LocalStorage],
        });
        await storageInstance.create();
      }
      storage.value = storageInstance;
      isReady.value = true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize storage';
      console.error('Storage initialization error:', err);
    }
  };

  const storageGet = async (key: string) => {
    await initializeStorage();
    if (!storage.value) {
      throw new Error('Storage not initialized');
    }
    return await storage.value.get(key);
  };

  const storageGetJson = async (key: string) => {
    await initializeStorage();
    if (!storage.value) {
      throw new Error('Storage not initialized');
    }
    const item = await storage.value.get(key);
    if (item) {
      return JSON.parse(item);
    }
    return;
  };

  const storageSet = async (key: string, value: any) => {
    await initializeStorage();
    if (!storage.value) {
      throw new Error('Storage not initialized');
    }
    return await storage.value.set(key, value);
  };

  const storageSetJson = async (key: string, value: any) => {
    await initializeStorage();
    if (!storage.value) {
      throw new Error('Storage not initialized');
    }
    return await storage.value.set(key, JSON.stringify(value));
  };

  const storageRemove = async (key: string) => {
    await initializeStorage();
    if (!storage.value) {
      throw new Error('Storage not initialized');
    }
    return await storage.value.remove(key);
  };

  const storageClear = async () => {
    await initializeStorage();
    if (!storage.value) {
      throw new Error('Storage not initialized');
    }
    return await storage.value.clear();
  };

  const storageKeys = async () => {
    await initializeStorage();
    if (!storage.value) {
      throw new Error('Storage not initialized');
    }
    return await storage.value.keys();
  };

  const storageLength = async () => {
    await initializeStorage();
    if (!storage.value) {
      throw new Error('Storage not initialized');
    }
    return await storage.value.length();
  };

  return {
    storage: storage.value,
    isReady,
    error,
    storageGet,
    storageGetJson,
    storageSet,
    storageSetJson,
    storageRemove,
    storageClear,
    storageKeys,
    storageLength,
  };
}
