import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { asAppId, type AppId } from '../model/identifier/AppId.ts';
import { APP_ID_CONVERTER } from '../model/identifier/AppId.ts';
import { type SlideShow } from '../model/slides/SlideShow.ts';
import {
    fromStorage,
    toStorage,
    slideShowToStorage,
    slideShowFromStorage,
    currentSlideIdToStorage,
    currentSlideIdFromStorage,
    countdownTimeToStorage,
    countdownTimeFromStorage,
} from './LocalStorage.ts';

// ---------------------------------------------------------------------------
// localStorage stub (Map-backed, node has no DOM)
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
});

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const OLDER_SLIDE_ID = asAppId('slide-2026-01-01-00-00-00-000')!;
const NEWER_SLIDE_ID = asAppId('slide-2026-06-15-12-30-00-000')!;

const OLDER_TIME = Temporal.PlainDateTime.from('2026-01-01T00:00:00');
const NEWER_TIME = Temporal.PlainDateTime.from('2026-06-15T12:30:00');

function makeSlideShow(id: AppId): SlideShow {
    return { id, slides: [] };
}

// ---------------------------------------------------------------------------
// fromStorage
// ---------------------------------------------------------------------------

describe('fromStorage', () => {
    test('returns null when key is absent', () => {
        expect(fromStorage(APP_ID_CONVERTER, 'missing-key')).toBeNull();
    });

    test('returns null when stored string is malformed JSON', () => {
        storage.setItem('bad-json', '{not valid json');
        expect(fromStorage(APP_ID_CONVERTER, 'bad-json')).toBeNull();
    });

    test('returns null when JSON is valid but converter rejects it', () => {
        storage.setItem('wrong-type', JSON.stringify(42));
        expect(fromStorage(APP_ID_CONVERTER, 'wrong-type')).toBeNull();
    });

    test('returns parsed value when JSON and converter accept it', () => {
        storage.setItem('app-id', JSON.stringify(OLDER_SLIDE_ID));
        expect(fromStorage(APP_ID_CONVERTER, 'app-id')).toBe(OLDER_SLIDE_ID);
    });
});

// ---------------------------------------------------------------------------
// toStorage
// ---------------------------------------------------------------------------

describe('toStorage', () => {
    test('writes data when storage is empty', () => {
        toStorage(APP_ID_CONVERTER, 'app-id', OLDER_SLIDE_ID, (newer, older) => newer >= older);
        expect(fromStorage(APP_ID_CONVERTER, 'app-id')).toBe(OLDER_SLIDE_ID);
    });

    test('does not overwrite when existing value is newer (isNewerThan returns true)', () => {
        // Store the newer ID first, then try to write the older one
        toStorage(APP_ID_CONVERTER, 'app-id', NEWER_SLIDE_ID, (newer, older) => newer >= older);
        toStorage(APP_ID_CONVERTER, 'app-id', OLDER_SLIDE_ID, (newer, older) => newer >= older);
        expect(fromStorage(APP_ID_CONVERTER, 'app-id')).toBe(NEWER_SLIDE_ID);
    });

    test('overwrites when existing value is older (isNewerThan returns false)', () => {
        toStorage(APP_ID_CONVERTER, 'app-id', OLDER_SLIDE_ID, (newer, older) => newer >= older);
        toStorage(APP_ID_CONVERTER, 'app-id', NEWER_SLIDE_ID, (newer, older) => newer >= older);
        expect(fromStorage(APP_ID_CONVERTER, 'app-id')).toBe(NEWER_SLIDE_ID);
    });
});

// ---------------------------------------------------------------------------
// slideShowToStorage / slideShowFromStorage
// ---------------------------------------------------------------------------

describe('slideShowFromStorage', () => {
    test('returns null when nothing is stored', () => {
        expect(slideShowFromStorage()).toBeNull();
    });
});

describe('slideShowToStorage / slideShowFromStorage round-trip', () => {
    test('stores and retrieves a SlideShow', () => {
        const show = makeSlideShow(OLDER_SLIDE_ID);
        slideShowToStorage(show);
        const result = slideShowFromStorage();
        expect(result).not.toBeNull();
        expect(result!.id).toBe(OLDER_SLIDE_ID);
        expect(result!.slides).toEqual([]);
    });

    test('does not overwrite a slideshow with a higher id', () => {
        slideShowToStorage(makeSlideShow(NEWER_SLIDE_ID));
        slideShowToStorage(makeSlideShow(OLDER_SLIDE_ID));
        expect(slideShowFromStorage()!.id).toBe(NEWER_SLIDE_ID);
    });

    test('overwrites a slideshow with a lower id', () => {
        slideShowToStorage(makeSlideShow(OLDER_SLIDE_ID));
        slideShowToStorage(makeSlideShow(NEWER_SLIDE_ID));
        expect(slideShowFromStorage()!.id).toBe(NEWER_SLIDE_ID);
    });
});

// ---------------------------------------------------------------------------
// currentSlideIdToStorage / currentSlideIdFromStorage
// ---------------------------------------------------------------------------

describe('currentSlideIdFromStorage', () => {
    test('returns null when nothing is stored', () => {
        expect(currentSlideIdFromStorage()).toBeNull();
    });
});

describe('currentSlideIdToStorage / currentSlideIdFromStorage round-trip', () => {
    test('stores and retrieves an AppId', () => {
        currentSlideIdToStorage(OLDER_SLIDE_ID);
        expect(currentSlideIdFromStorage()).toBe(OLDER_SLIDE_ID);
    });

    test('does not overwrite a newer id', () => {
        currentSlideIdToStorage(NEWER_SLIDE_ID);
        currentSlideIdToStorage(OLDER_SLIDE_ID);
        expect(currentSlideIdFromStorage()).toBe(NEWER_SLIDE_ID);
    });

    test('overwrites an older id', () => {
        currentSlideIdToStorage(OLDER_SLIDE_ID);
        currentSlideIdToStorage(NEWER_SLIDE_ID);
        expect(currentSlideIdFromStorage()).toBe(NEWER_SLIDE_ID);
    });
});

// ---------------------------------------------------------------------------
// countdownTimeToStorage / countdownTimeFromStorage
// ---------------------------------------------------------------------------

describe('countdownTimeFromStorage', () => {
    test('returns null when nothing is stored', () => {
        expect(countdownTimeFromStorage()).toBeNull();
    });
});

describe('countdownTimeToStorage / countdownTimeFromStorage round-trip', () => {
    test('stores and retrieves a Temporal.PlainDateTime', () => {
        countdownTimeToStorage(OLDER_TIME);
        const result = countdownTimeFromStorage();
        expect(result).not.toBeNull();
        expect(Temporal.PlainDateTime.compare(result!, OLDER_TIME)).toBe(0);
    });

    test('does not overwrite when stored time is the same', () => {
        countdownTimeToStorage(NEWER_TIME);
        countdownTimeToStorage(OLDER_TIME);
        const result = countdownTimeFromStorage();
        expect(Temporal.PlainDateTime.compare(result!, NEWER_TIME)).toBe(0);
    });

    test('does not overwrite when stored time is later', () => {
        countdownTimeToStorage(NEWER_TIME);
        countdownTimeToStorage(OLDER_TIME);
        expect(Temporal.PlainDateTime.compare(countdownTimeFromStorage()!, NEWER_TIME)).toBe(0);
    });

    test('overwrites when stored time is earlier', () => {
        countdownTimeToStorage(OLDER_TIME);
        countdownTimeToStorage(NEWER_TIME);
        expect(Temporal.PlainDateTime.compare(countdownTimeFromStorage()!, NEWER_TIME)).toBe(0);
    });
});
