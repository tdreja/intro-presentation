import { SLIDE_SHOW_CONVERTER, type SlideShow } from '../model/slides/SlideShow.ts';
import { fromStorage } from './LocalStorage.ts';

/**
 * The slideshow (with its images) lives in IndexedDB: localStorage is capped at ~5 MB per origin,
 * IndexedDB may use a share of the free disk space.
 */
const DATABASE_NAME = 'intro-presentation';
const DATABASE_VERSION = 1;
const STORE_NAME = 'slide-show';
const SLIDE_SHOW_KEY = 'current';

/**
 * Key the slideshow was kept under in localStorage before it moved to IndexedDB.
 */
export const LEGACY_LOCAL_STORAGE_KEY = 'slide-show';

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error ?? new Error('Transaction aborted'));
    });
}

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
    if (!databasePromise) {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(STORE_NAME)) {
                request.result.createObjectStore(STORE_NAME);
            }
        };
        databasePromise = requestToPromise(request);
        // Allow a retry on the next call if opening failed
        databasePromise.catch(() => {
            databasePromise = null;
        });
    }
    return databasePromise;
}

/**
 * Closes the database connection, e.g. between tests.
 */
export async function closeDatabase(): Promise<void> {
    const promise = databasePromise;
    databasePromise = null;
    if (promise) {
        try {
            (await promise).close();
        }
        catch {
            // Was never opened
        }
    }
}

async function readStored(): Promise<SlideShow | null> {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const json = await requestToPromise(transaction.objectStore(STORE_NAME).get(SLIDE_SHOW_KEY));
    return SLIDE_SHOW_CONVERTER.fromJson(json);
}

/**
 * Stores the slideshow unless a newer one (higher id) is already stored. Same id overwrites,
 * so a re-encoded (smaller) copy of the same slideshow replaces the original.
 */
export async function saveSlideShow(slideShow: SlideShow): Promise<void> {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const done = transactionDone(transaction);
    const store = transaction.objectStore(STORE_NAME);
    const existing = SLIDE_SHOW_CONVERTER.fromJson(await requestToPromise(store.get(SLIDE_SHOW_KEY)));
    if (!existing || existing.id <= slideShow.id) {
        store.put(SLIDE_SHOW_CONVERTER.toJson(slideShow), SLIDE_SHOW_KEY);
    }
    await done;
}

/**
 * Moves a slideshow left in localStorage by older versions into IndexedDB.
 */
async function migrateFromLocalStorage(): Promise<SlideShow | null> {
    // Unreadable entries come back as null and are removed as well
    const legacy = fromStorage(SLIDE_SHOW_CONVERTER, LEGACY_LOCAL_STORAGE_KEY);
    if (legacy) {
        await saveSlideShow(legacy);
    }
    try {
        localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
    }
    catch {
        // Nothing to clean up
    }
    return legacy;
}

/**
 * Loads the stored slideshow, null if there is none or it can't be read.
 */
export async function loadSlideShow(): Promise<SlideShow | null> {
    try {
        const migrated = await migrateFromLocalStorage();
        const stored = await readStored();
        return stored ?? migrated;
    }
    catch (error) {
        console.error('Could not load the slideshow from IndexedDB', error);
        return null;
    }
}

/**
 * Asks the browser not to evict the stored slideshow when disk space runs low.
 */
export function requestPersistentStorage(): void {
    navigator.storage?.persist?.()
        .catch((error: unknown) => console.warn('Could not request persistent storage', error));
}

/**
 * Wraps an async save so at most one write runs at a time and only the latest value waits for the next one.
 * Rapid edits (typing) thereby don't queue up writes of several MB each. Errors are logged, never thrown.
 */
export function createLatestOnlyWriter<T>(save: (value: T) => Promise<void>): (value: T) => Promise<void> {
    let running: Promise<void> | null = null;
    let pending: { value: T } | null = null;

    const run = async () => {
        while (pending) {
            const { value } = pending;
            pending = null;
            try {
                await save(value);
            }
            catch (error) {
                console.error('Could not save', error);
            }
        }
        running = null;
    };

    return (value: T) => {
        pending = { value };
        if (!running) {
            running = run();
        }
        return running;
    };
}

/**
 * Shared writer for the slideshow, used by every place that changes it.
 */
export const writeSlideShow = createLatestOnlyWriter(saveSlideShow);
