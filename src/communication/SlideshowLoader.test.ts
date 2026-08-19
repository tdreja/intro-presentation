import { Temporal } from '@js-temporal/polyfill';
import { newAppId } from '../model/identifier/AppId';
import { PLACEHOLDER_IMAGE } from '../model/slides/Image';
import { SLIDE_SHOW_CONVERTER, type SlideShow } from '../model/slides/SlideShow';
import type { FullImageSlide } from '../model/slides/Slide';
import { loadSlideshowFromStorage, storeSlideshowToStorage } from './SlideshowLoader';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const OLDER_DATE = Temporal.PlainDateTime.from('2026-01-01T10:00:00.000');
const NEWER_DATE = Temporal.PlainDateTime.from('2026-06-01T10:00:00.000');

const OLDER_ID = newAppId('show', OLDER_DATE);
const NEWER_ID = newAppId('show', NEWER_DATE);

const SLIDE: FullImageSlide = {
    slideId: newAppId('slide', OLDER_DATE),
    slideType: 'full-image',
    image: PLACEHOLDER_IMAGE,
};

const OLDER_SHOW: SlideShow = { id: OLDER_ID, slides: [SLIDE], currentSlideIndex: 0 };
const NEWER_SHOW: SlideShow = { id: NEWER_ID, slides: [SLIDE], currentSlideIndex: 0 };

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

const SLIDESHOW_STORAGE_KEY = 'slideshow';

let store: Record<string, string> = {};
const setItemSpy = jest.fn((key: string, value: string) => {
    store[key] = value;
});
const localStorageMock = {
    getItem: (key: string) => store[key] ?? null,
    setItem: setItemSpy,
};

beforeEach(() => {
    store = {};
    setItemSpy.mockClear();
    Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true, configurable: true });
});

/** Helper: put a serialized SlideShow into the mock storage. */
function storeInMock(slideshow: SlideShow): void {
    store[SLIDESHOW_STORAGE_KEY] = JSON.stringify(SLIDE_SHOW_CONVERTER.toJson(slideshow));
}

// ---------------------------------------------------------------------------
// loadSlideshowFromStorage — no data
// ---------------------------------------------------------------------------

describe('loadSlideshowFromStorage — no data', () => {
    test('returns null when storage is empty and no export arg is given', () => {
        expect(loadSlideshowFromStorage()).toBeNull();
    });

    test('returns null when storage is empty and export arg is undefined', () => {
        expect(loadSlideshowFromStorage(undefined)).toBeNull();
    });

    test('returns null when storage is empty and export arg is null', () => {
        expect(loadSlideshowFromStorage(null)).toBeNull();
    });

    test('returns null when storage is empty and export arg is an invalid object', () => {
        expect(loadSlideshowFromStorage({})).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// loadSlideshowFromStorage — export only (storage empty)
// ---------------------------------------------------------------------------

describe('loadSlideshowFromStorage — export only (storage empty)', () => {
    const exportedJson = SLIDE_SHOW_CONVERTER.toJson(OLDER_SHOW);

    test('returns the exported slideshow when storage is empty', () => {
        const result = loadSlideshowFromStorage(exportedJson);
        expect(result).not.toBeNull();
    });

    test('returned slideshow id matches the exported id', () => {
        const result = loadSlideshowFromStorage(exportedJson)!;
        expect(result.id).toBe(OLDER_ID);
    });
});

// ---------------------------------------------------------------------------
// loadSlideshowFromStorage — storage only (no export arg)
// ---------------------------------------------------------------------------

describe('loadSlideshowFromStorage — storage only (no export arg)', () => {
    beforeEach(() => storeInMock(OLDER_SHOW));

    test('returns the stored slideshow when no export arg is given', () => {
        const result = loadSlideshowFromStorage();
        expect(result).not.toBeNull();
    });

    test('returned slideshow id matches the stored id', () => {
        const result = loadSlideshowFromStorage()!;
        expect(result.id).toBe(OLDER_ID);
    });
});

// ---------------------------------------------------------------------------
// loadSlideshowFromStorage — both present, pick newest
// ---------------------------------------------------------------------------

describe('loadSlideshowFromStorage — both present, pick newest', () => {
    test('returns storage when storage id is newer than export', () => {
        storeInMock(NEWER_SHOW);
        const result = loadSlideshowFromStorage(SLIDE_SHOW_CONVERTER.toJson(OLDER_SHOW))!;
        expect(result.id).toBe(NEWER_ID);
    });

    test('returns export when export id is newer than storage', () => {
        storeInMock(OLDER_SHOW);
        const result = loadSlideshowFromStorage(SLIDE_SHOW_CONVERTER.toJson(NEWER_SHOW))!;
        expect(result.id).toBe(NEWER_ID);
    });

    test('returns storage when both have the same id (>= favours storage)', () => {
        storeInMock(OLDER_SHOW);
        const result = loadSlideshowFromStorage(SLIDE_SHOW_CONVERTER.toJson(OLDER_SHOW))!;
        expect(result.id).toBe(OLDER_ID);
    });
});

// ---------------------------------------------------------------------------
// storeSlideshowToStorage — empty storage
// ---------------------------------------------------------------------------

describe('storeSlideshowToStorage — empty storage', () => {
    test('calls setItem once when storage is empty', () => {
        storeSlideshowToStorage(OLDER_SHOW);
        expect(setItemSpy).toHaveBeenCalledTimes(1);
    });

    test('stored JSON round-trips back to the original slideshow', () => {
        storeSlideshowToStorage(OLDER_SHOW);
        const [, storedValue] = setItemSpy.mock.calls[0] as [string, string];
        const parsed = SLIDE_SHOW_CONVERTER.fromJson(JSON.parse(storedValue));
        expect(parsed).not.toBeNull();
        expect(parsed!.id).toBe(OLDER_SHOW.id);
        expect(parsed!.currentSlideIndex).toBe(OLDER_SHOW.currentSlideIndex);
        expect(parsed!.slides).toHaveLength(OLDER_SHOW.slides.length);
    });
});

// ---------------------------------------------------------------------------
// storeSlideshowToStorage — storage has older slideshow
// ---------------------------------------------------------------------------

describe('storeSlideshowToStorage — storage has older slideshow', () => {
    beforeEach(() => storeInMock(OLDER_SHOW));

    test('calls setItem when the incoming slideshow is newer', () => {
        storeSlideshowToStorage(NEWER_SHOW);
        expect(setItemSpy).toHaveBeenCalledTimes(1);
    });

    test('stored value after update contains the newer id', () => {
        storeSlideshowToStorage(NEWER_SHOW);
        const [, storedValue] = setItemSpy.mock.calls[0] as [string, string];
        const parsed = SLIDE_SHOW_CONVERTER.fromJson(JSON.parse(storedValue));
        expect(parsed!.id).toBe(NEWER_ID);
    });
});

// ---------------------------------------------------------------------------
// storeSlideshowToStorage — storage has equal or newer id
// ---------------------------------------------------------------------------

describe('storeSlideshowToStorage — storage has equal or newer id', () => {
    test('does not call setItem when stored id is newer than incoming', () => {
        storeInMock(NEWER_SHOW);
        storeSlideshowToStorage(OLDER_SHOW);
        expect(setItemSpy).not.toHaveBeenCalled();
    });

    test('does not call setItem when stored id equals incoming id', () => {
        storeInMock(OLDER_SHOW);
        storeSlideshowToStorage(OLDER_SHOW);
        expect(setItemSpy).not.toHaveBeenCalled();
    });
});
