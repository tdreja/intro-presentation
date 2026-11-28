import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { asAppId, type AppId } from '../model/identifier/AppId.ts';
import { SLIDE_SHOW_CONVERTER, type SlideShow } from '../model/slides/SlideShow.ts';
import {
    closeDatabase,
    createLatestOnlyWriter,
    LEGACY_LOCAL_STORAGE_KEY,
    loadSlideShow,
    saveSlideShow,
} from './SlideShowDatabase.ts';

// ---------------------------------------------------------------------------
// Fresh in-memory IndexedDB and localStorage per test (node has no DOM)
// ---------------------------------------------------------------------------

function makeLocalStorageStub() {
    const store = new Map<string, string>();
    return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => { store.set(key, value); },
        removeItem: (key: string) => { store.delete(key); },
        clear: () => { store.clear(); },
        get length() { return store.size; },
        key: (index: number) => [...store.keys()][index] ?? null,
    };
}

let storage: ReturnType<typeof makeLocalStorageStub>;

beforeEach(() => {
    storage = makeLocalStorageStub();
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('indexedDB', new IDBFactory());
});

afterEach(async () => {
    await closeDatabase();
    vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const OLDER_ID = asAppId('slide-2026-01-01-00-00-00-000_v2')!;
const NEWER_ID = asAppId('slide-2026-06-15-12-30-00-000_v2')!;

function makeSlideShow(id: AppId, darkMode?: boolean): SlideShow {
    return { id, slides: [], timePerSlide: Temporal.Duration.from({ seconds: 10 }), darkMode };
}

// ---------------------------------------------------------------------------
// saveSlideShow / loadSlideShow
// ---------------------------------------------------------------------------

describe('loadSlideShow', () => {
    test('returns null when nothing is stored', async () => {
        expect(await loadSlideShow()).toBeNull();
    });

    test('returns a saved slideshow', async () => {
        await saveSlideShow(makeSlideShow(OLDER_ID));
        const result = await loadSlideShow();
        expect(result!.id).toBe(OLDER_ID);
        expect(result!.slides).toEqual([]);
    });
});

describe('saveSlideShow', () => {
    test('does not overwrite a slideshow with a higher id', async () => {
        await saveSlideShow(makeSlideShow(NEWER_ID));
        await saveSlideShow(makeSlideShow(OLDER_ID));
        expect((await loadSlideShow())!.id).toBe(NEWER_ID);
    });

    test('overwrites a slideshow with a lower id', async () => {
        await saveSlideShow(makeSlideShow(OLDER_ID));
        await saveSlideShow(makeSlideShow(NEWER_ID));
        expect((await loadSlideShow())!.id).toBe(NEWER_ID);
    });

    test('overwrites a slideshow with the same id (e.g. after re-encoding its images)', async () => {
        await saveSlideShow(makeSlideShow(OLDER_ID));
        await saveSlideShow(makeSlideShow(OLDER_ID, true));
        expect((await loadSlideShow())!.darkMode).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Migration from localStorage
// ---------------------------------------------------------------------------

describe('migration from localStorage', () => {
    test('moves a slideshow from localStorage into IndexedDB', async () => {
        storage.setItem(LEGACY_LOCAL_STORAGE_KEY, JSON.stringify(SLIDE_SHOW_CONVERTER.toJson(makeSlideShow(OLDER_ID))));
        expect((await loadSlideShow())!.id).toBe(OLDER_ID);
        expect(storage.getItem(LEGACY_LOCAL_STORAGE_KEY)).toBeNull();
        // Still there once localStorage is empty
        expect((await loadSlideShow())!.id).toBe(OLDER_ID);
    });

    test('keeps a newer slideshow already in IndexedDB', async () => {
        await saveSlideShow(makeSlideShow(NEWER_ID));
        storage.setItem(LEGACY_LOCAL_STORAGE_KEY, JSON.stringify(SLIDE_SHOW_CONVERTER.toJson(makeSlideShow(OLDER_ID))));
        expect((await loadSlideShow())!.id).toBe(NEWER_ID);
        expect(storage.getItem(LEGACY_LOCAL_STORAGE_KEY)).toBeNull();
    });

    test('removes an unreadable localStorage entry', async () => {
        storage.setItem(LEGACY_LOCAL_STORAGE_KEY, '{not valid json');
        expect(await loadSlideShow()).toBeNull();
        expect(storage.getItem(LEGACY_LOCAL_STORAGE_KEY)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// createLatestOnlyWriter
// ---------------------------------------------------------------------------

describe('createLatestOnlyWriter', () => {
    test('writes only the first and the latest value while a write is running', async () => {
        const written: number[] = [];
        let release: () => void = () => {};
        const save = vi.fn((value: number) => {
            written.push(value);
            return value === 1
                ? new Promise<void>((resolve) => {
                    release = resolve;
                })
                : Promise.resolve();
        });
        const write = createLatestOnlyWriter(save);
        const done = write(1);
        void write(2);
        void write(3);
        release();
        await done;
        expect(written).toEqual([1, 3]);
    });

    test('logs a failed write and continues with the next one', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const save = vi.fn()
            .mockRejectedValueOnce(new Error('full'))
            .mockResolvedValue(undefined);
        const write = createLatestOnlyWriter<number>(save);
        await expect(write(1)).resolves.toBeUndefined();
        await write(2);
        expect(save).toHaveBeenCalledTimes(2);
        expect(error).toHaveBeenCalled();
        error.mockRestore();
    });
});
