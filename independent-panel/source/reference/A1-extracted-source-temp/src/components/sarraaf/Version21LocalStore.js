const DB_NAME = 'hisab-sarraf-v21-local';
const STORE = 'workspace';
const VERSION = 1;

function localKey() {
  try {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}') || {};
    const exchangeCode = localStorage.getItem('app_ec') || user.exchange_code || 'no-exchange';
    return `user:${user.id || 'anonymous'}:exchange:${exchangeCode}`;
  } catch {
    return 'user:anonymous:exchange:no-exchange';
  }
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local workspace database'));
  });
}

export async function loadVersion21LocalState() {
  const key = localKey();
  try {
    const db = await openDb();
    const value = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result?.value || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return value || {};
  } catch {
    try { return JSON.parse(localStorage.getItem(`${DB_NAME}:${key}`) || '{}'); }
    catch { return {}; }
  }
}

export async function saveVersion21LocalState(value) {
  const key = localKey();
  const payload = { ...value, savedAt: new Date().toISOString() };
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ key, value: payload });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Local save aborted'));
    });
    db.close();
    return true;
  } catch {
    try {
      localStorage.setItem(`${DB_NAME}:${key}`, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }
}
