import { exportSlideShow, type SlideShow } from '../model/slides/SlideShow';
import { loadSlideshowFromStorage, storeSlideshowToStorage } from './SlideshowLoader';
import type { AppId } from '../model/identifier/AppId';
import type { FullImageSlide } from '../model/slides/Slide';
import { PLACEHOLDER_IMAGE } from '../model/slides/Image';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SLIDE_ID = 'slide-2026-08-18-10-00-00-000' as AppId;

const FULL_IMAGE_SLIDE: FullImageSlide = {
    slideId: SLIDE_ID,
    slideType: 'full-image',
    image: PLACEHOLDER_IMAGE,
};

const SHOW_OLDER: SlideShow = {
    id: 'show-2026-08-18-09-00-00-000' as AppId,
    slides: [FULL_IMAGE_SLIDE],
    currentSlideIndex: 0,
};

const SHOW_NEWER: SlideShow = {
    id: 'show-2026-08-18-11-00-00-000' as AppId,
    slides: [FULL_IMAGE_SLIDE],
    currentSlideIndex: 0,
};

// ---------------------------------------------------------------------------
// localStorage mock helpers
// ---------------------------------------------------------------------------

let storedValue: string | null = null;

const localStorageMock = {
    getItem: (_key: string): string | null => storedValue,
    setItem: (_key: string, value: string): void => { storedValue = value; },
    removeItem: (_key: string): void => { storedValue = null; },
    clear: (): void => { storedValue = null; },
    length: 0,
    key: (_index: number): string | null => null,
};

beforeAll(() => {
    Object.defineProperty(global, 'localStorage', {
        value: localStorageMock,
        writable: true,
    });
});

beforeEach(() => {
    storedValue = null;
});

// ---------------------------------------------------------------------------
// No argument, no storage
// ---------------------------------------------------------------------------

describe('loadSlideshowFromStorage — no storage, no argument', () => {
    test('returns null when localStorage is empty', () => {
        expect(loadSlideshowFromStorage()).toBeNull();
    });

    test('returns null when localStorage returns an empty string', () => {
        storedValue = '';
        expect(loadSlideshowFromStorage()).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// From storage only (no argument)
// ---------------------------------------------------------------------------

describe('loadSlideshowFromStorage — from storage only', () => {
    test('returns the slideshow from storage when JSON is valid', () => {
        storedValue = exportSlideShow(SHOW_OLDER);
        const result = loadSlideshowFromStorage();
        expect(result).not.toBeNull();
        expect(result!.id).toBe(SHOW_OLDER.id);
    });

    test('returns null when storage contains JSON with missing id', () => {
        storedValue = JSON.stringify({ slides: [], currentSlideIndex: 0 });
        expect(loadSlideshowFromStorage()).toBeNull();
    });

    test('returns null when storage contains JSON with invalid id format', () => {
        storedValue = JSON.stringify({ id: 'not-valid', slides: [], currentSlideIndex: 0 });
        expect(loadSlideshowFromStorage()).toBeNull();
    });

    test('throws a SyntaxError when storage contains non-JSON garbage', () => {
        storedValue = 'not json at all {{';
        expect(() => loadSlideshowFromStorage()).toThrow(SyntaxError);
    });
});

// ---------------------------------------------------------------------------
// From export argument only (no storage)
// ---------------------------------------------------------------------------

describe('loadSlideshowFromStorage — from argument only', () => {
    test('returns the slideshow from the argument when storage is empty', () => {
        const exported = JSON.parse(exportSlideShow(SHOW_NEWER));
        const result = loadSlideshowFromStorage(exported);
        expect(result).not.toBeNull();
        expect(result!.id).toBe(SHOW_NEWER.id);
    });

    test('returns null when argument is an object missing required fields', () => {
        const result = loadSlideshowFromStorage({ slides: [], currentSlideIndex: 0 });
        expect(result).toBeNull();
    });

    test('returns null when argument is null', () => {
        const result = loadSlideshowFromStorage(null as unknown);
        expect(result).toBeNull();
    });

    test('returns null when argument is a plain string', () => {
        const result = loadSlideshowFromStorage('not-an-object' as unknown);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Both sources present — pickNewest logic
// ---------------------------------------------------------------------------

describe('loadSlideshowFromStorage — pickNewest when both sources present', () => {
    test('returns argument slideshow when its id is newer than storage', () => {
        storedValue = exportSlideShow(SHOW_OLDER);
        const exported = JSON.parse(exportSlideShow(SHOW_NEWER));
        const result = loadSlideshowFromStorage(exported);
        expect(result!.id).toBe(SHOW_NEWER.id);
    });

    test('returns storage slideshow when its id is newer than argument', () => {
        storedValue = exportSlideShow(SHOW_NEWER);
        const exported = JSON.parse(exportSlideShow(SHOW_OLDER));
        const result = loadSlideshowFromStorage(exported);
        expect(result!.id).toBe(SHOW_NEWER.id);
    });

    test('returns storage slideshow when both ids are equal (storage wins via >=)', () => {
        storedValue = exportSlideShow(SHOW_OLDER);
        const exported = JSON.parse(exportSlideShow(SHOW_OLDER));
        const result = loadSlideshowFromStorage(exported);
        expect(result!.id).toBe(SHOW_OLDER.id);
    });
});

// ---------------------------------------------------------------------------
// storeSlideshowToStorage
// ---------------------------------------------------------------------------

describe('storeSlideshowToStorage', () => {
    test('writes to storage when storage is empty', () => {
        storeSlideshowToStorage(SHOW_NEWER);
        expect(loadSlideshowFromStorage()!.id).toBe(SHOW_NEWER.id);
    });

    test('round-trips: stored slideshow is readable with the same id', () => {
        storeSlideshowToStorage(SHOW_OLDER);
        expect(loadSlideshowFromStorage()!.id).toBe(SHOW_OLDER.id);
    });

    test('overwrites when incoming slideshow is newer than stored', () => {
        storeSlideshowToStorage(SHOW_OLDER);
        storeSlideshowToStorage(SHOW_NEWER);
        expect(loadSlideshowFromStorage()!.id).toBe(SHOW_NEWER.id);
    });

    test('does not overwrite when incoming slideshow is older than stored', () => {
        storeSlideshowToStorage(SHOW_NEWER);
        storeSlideshowToStorage(SHOW_OLDER);
        expect(loadSlideshowFromStorage()!.id).toBe(SHOW_NEWER.id);
    });

    test('does not overwrite when incoming slideshow has the same id as stored', () => {
        storeSlideshowToStorage(SHOW_OLDER);
        storeSlideshowToStorage(SHOW_OLDER);
        expect(loadSlideshowFromStorage()!.id).toBe(SHOW_OLDER.id);
    });
});
