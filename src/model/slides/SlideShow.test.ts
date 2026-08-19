import { Temporal } from '@js-temporal/polyfill';
import { exportSlideShow, importSlideShowJSON, toJsonSlideShow, type SlideShow } from './SlideShow';
import type { FullImageSlide, HalfTextHalfImageSlide } from './Slide';
import type { AppId } from '../identifier/AppId';
import { PLACEHOLDER_IMAGE } from './Image';

const VALID_ID = 'show-2026-08-18-10-00-00-000' as AppId;
const VALID_SLIDE_ID = 'slide-2026-08-18-10-00-00-000' as AppId;
const VALID_SLIDE_ID_2 = 'slide-2026-08-18-11-00-00-000' as AppId;
const VALID_IMAGE = PLACEHOLDER_IMAGE;
const VALID_COUNTDOWN = Temporal.PlainDateTime.from('2026-12-31T23:59:59');

const FULL_IMAGE_SLIDE: FullImageSlide = {
    slideId: VALID_SLIDE_ID,
    slideType: 'full-image',
    image: VALID_IMAGE,
};

const HALF_TEXT_SLIDE: HalfTextHalfImageSlide = {
    slideId: VALID_SLIDE_ID_2,
    slideType: 'half-text-half-image',
    text: 'Hello World',
    image: VALID_IMAGE,
    layout: 'half-half',
};

const VALID_SHOW: SlideShow = {
    id: VALID_ID,
    slides: [FULL_IMAGE_SLIDE, HALF_TEXT_SLIDE],
    currentSlideIndex: 1,
};

// ---------------------------------------------------------------------------
// toJsonSlideShow
// ---------------------------------------------------------------------------

describe('toJsonSlideShow', () => {
    test('returns an object with id, slides, and currentSlideIndex', () => {
        const result = toJsonSlideShow(VALID_SHOW);
        expect(result.id).toBe(VALID_ID);
        expect(result.slides).toBe(VALID_SHOW.slides);
        expect(result.currentSlideIndex).toBe(1);
    });

    test('converts countdownTarget to ISO string when set', () => {
        const show: SlideShow = { ...VALID_SHOW, countdownTarget: VALID_COUNTDOWN };
        const result = toJsonSlideShow(show);
        expect(result.countdownTarget).toBe(VALID_COUNTDOWN.toString());
    });

    test('leaves countdownTarget as undefined when not set', () => {
        const result = toJsonSlideShow(VALID_SHOW);
        expect(result.countdownTarget).toBeUndefined();
    });

    test('does not mutate the original slideshow', () => {
        const show: SlideShow = { ...VALID_SHOW, countdownTarget: VALID_COUNTDOWN };
        toJsonSlideShow(show);
        expect(show.countdownTarget).toBe(VALID_COUNTDOWN);
    });

    test('slides array reference is preserved', () => {
        const result = toJsonSlideShow(VALID_SHOW);
        expect(result.slides).toBe(VALID_SHOW.slides);
    });
});

// ---------------------------------------------------------------------------
// exportSlideShow
// ---------------------------------------------------------------------------

describe('exportSlideShow', () => {
    test('returns a string', () => {
        expect(typeof exportSlideShow(VALID_SHOW)).toBe('string');
    });

    test('round-trips through importSlideShowJSON', () => {
        const json = exportSlideShow(VALID_SHOW);
        const result = importSlideShowJSON(json);
        expect(result).toEqual(VALID_SHOW);
    });

    test('serializes id and currentSlideIndex', () => {
        const json = exportSlideShow(VALID_SHOW);
        const parsed = JSON.parse(json);
        expect(parsed.id).toBe(VALID_ID);
        expect(parsed.currentSlideIndex).toBe(1);
    });

    test('serializes all slides', () => {
        const json = exportSlideShow(VALID_SHOW);
        const parsed = JSON.parse(json);
        expect(parsed.slides).toHaveLength(2);
    });

    test('serializes countdownTarget as ISO string', () => {
        const show: SlideShow = { ...VALID_SHOW, countdownTarget: VALID_COUNTDOWN };
        const parsed = JSON.parse(exportSlideShow(show));
        expect(parsed.countdownTarget).toBe(VALID_COUNTDOWN.toString());
    });

    test('omits countdownTarget when not set', () => {
        const parsed = JSON.parse(exportSlideShow(VALID_SHOW));
        expect(parsed.countdownTarget).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// importSlideShow — invalid inputs
// ---------------------------------------------------------------------------

describe('importSlideShowJSON — invalid inputs', () => {
    test('returns null for null', () => {
        expect(importSlideShowJSON(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(importSlideShowJSON(undefined)).toBeNull();
    });

    test('returns null for empty string', () => {
        expect(importSlideShowJSON('')).toBeNull();
    });

    test('returns null when id is missing', () => {
        const json = JSON.stringify({ slides: [], currentSlideIndex: 0 });
        expect(importSlideShowJSON(json)).toBeNull();
    });

    test('returns null when id has invalid format', () => {
        const json = JSON.stringify({ id: 'not-a-valid-id', slides: [], currentSlideIndex: 0 });
        expect(importSlideShowJSON(json)).toBeNull();
    });

    test('returns null when slides is missing', () => {
        const json = JSON.stringify({ id: VALID_ID, currentSlideIndex: 0 });
        expect(importSlideShowJSON(json)).toBeNull();
    });

    test('returns null when slides is not an array', () => {
        const json = JSON.stringify({ id: VALID_ID, slides: 'not-an-array', currentSlideIndex: 0 });
        expect(importSlideShowJSON(json)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// importSlideShow — valid inputs
// ---------------------------------------------------------------------------

describe('importSlideShowJSON — valid inputs', () => {
    test('returns a SlideShow with correct id', () => {
        const result = importSlideShowJSON(exportSlideShow(VALID_SHOW))!;
        expect(result).not.toBeNull();
        expect(result.id).toBe(VALID_ID);
    });

    test('returns a SlideShow with correct currentSlideIndex', () => {
        const result = importSlideShowJSON(exportSlideShow(VALID_SHOW))!;
        expect(result.currentSlideIndex).toBe(1);
    });

    test('defaults currentSlideIndex to 0 when missing', () => {
        const raw = { id: VALID_ID, slides: [FULL_IMAGE_SLIDE] };
        const result = importSlideShowJSON(JSON.stringify(raw))!;
        expect(result).not.toBeNull();
        expect(result.currentSlideIndex).toBe(0);
    });

    test('parses countdownTarget from ISO string', () => {
        const show: SlideShow = { ...VALID_SHOW, countdownTarget: VALID_COUNTDOWN };
        const result = importSlideShowJSON(exportSlideShow(show))!;
        expect(result.countdownTarget).toEqual(VALID_COUNTDOWN);
    });

    test('leaves countdownTarget undefined when not set', () => {
        const result = importSlideShowJSON(exportSlideShow(VALID_SHOW))!;
        expect(result.countdownTarget).toBeUndefined();
    });

    test('leaves countdownTarget undefined for invalid string', () => {
        const raw = { id: VALID_ID, slides: [], currentSlideIndex: 0, countdownTarget: 'not-a-date' };
        const result = importSlideShowJSON(JSON.stringify(raw))!;
        expect(result.countdownTarget).toBeUndefined();
    });

    test('parses an empty slides array', () => {
        const show: SlideShow = { id: VALID_ID, slides: [], currentSlideIndex: 0 };
        const result = importSlideShowJSON(exportSlideShow(show))!;
        expect(result).not.toBeNull();
        expect(result.slides).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// importSlideShow — slides handling
// ---------------------------------------------------------------------------

describe('importSlideShowJSON — slides handling', () => {
    test('parses a FullImageSlide correctly', () => {
        const show: SlideShow = { id: VALID_ID, slides: [FULL_IMAGE_SLIDE], currentSlideIndex: 0 };
        const result = importSlideShowJSON(exportSlideShow(show))!;
        expect(result.slides).toHaveLength(1);
        expect(result.slides[0]).toEqual(FULL_IMAGE_SLIDE);
    });

    test('parses a HalfTextHalfImageSlide correctly', () => {
        const show: SlideShow = { id: VALID_ID, slides: [HALF_TEXT_SLIDE], currentSlideIndex: 0 };
        const result = importSlideShowJSON(exportSlideShow(show))!;
        expect(result.slides).toHaveLength(1);
        expect(result.slides[0]).toEqual(HALF_TEXT_SLIDE);
    });

    test('parses mixed slide types', () => {
        const result = importSlideShowJSON(exportSlideShow(VALID_SHOW))!;
        expect(result.slides).toHaveLength(2);
        expect(result.slides[0]).toEqual(FULL_IMAGE_SLIDE);
        expect(result.slides[1]).toEqual(HALF_TEXT_SLIDE);
    });

    test('skips invalid slide entries', () => {
        const rawShow = {
            id: VALID_ID,
            slides: [FULL_IMAGE_SLIDE, { slideType: 'full-image' /* missing image and slideId */ }],
            currentSlideIndex: 0,
        };
        const result = importSlideShowJSON(JSON.stringify(rawShow))!;
        expect(result).not.toBeNull();
        expect(result.slides).toHaveLength(1);
        expect(result.slides[0]).toEqual(FULL_IMAGE_SLIDE);
    });

    test('returns empty slides array when all entries are invalid', () => {
        const rawShow = {
            id: VALID_ID,
            slides: [{ slideType: 'full-image' }, { slideType: 'half-text-half-image' }],
            currentSlideIndex: 0,
        };
        const result = importSlideShowJSON(JSON.stringify(rawShow))!;
        expect(result).not.toBeNull();
        expect(result.slides).toHaveLength(0);
    });

    test('preserves slide headline', () => {
        const slideWithHeadline: FullImageSlide = { ...FULL_IMAGE_SLIDE, headline: 'My Title' };
        const show: SlideShow = { id: VALID_ID, slides: [slideWithHeadline], currentSlideIndex: 0 };
        const result = importSlideShowJSON(exportSlideShow(show))!;
        expect((result.slides[0] as FullImageSlide).headline).toBe('My Title');
    });
});
