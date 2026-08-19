import { Temporal } from '@js-temporal/polyfill';
import { SLIDE_SHOW_CONVERTER, type SlideShow } from './SlideShow';
import type { AppId } from '../identifier/AppId';
import type { FullImageSlide } from './Slide';
import { PLACEHOLDER_IMAGE } from './Image';

const VALID_SHOW_ID = 'show-2026-08-18-10-00-00-000' as AppId;
const VALID_SLIDE_ID = 'slide-2026-08-18-10-00-00-000' as AppId;
const VALID_IMAGE = PLACEHOLDER_IMAGE;

const FULL_IMAGE_SLIDE: FullImageSlide = {
    slideId: VALID_SLIDE_ID,
    slideType: 'full-image',
    image: VALID_IMAGE,
};

const MINIMAL_SLIDESHOW: SlideShow = {
    id: VALID_SHOW_ID,
    slides: [FULL_IMAGE_SLIDE],
    currentSlideIndex: 0,
};

const COUNTDOWN_TARGET = Temporal.PlainDateTime.from('2026-12-31T23:59:59.000');

const SLIDESHOW_WITH_COUNTDOWN: SlideShow = {
    ...MINIMAL_SLIDESHOW,
    countdownTarget: COUNTDOWN_TARGET,
};

// ---------------------------------------------------------------------------
// SLIDE_SHOW_CONVERTER.fromJson — null / invalid guards
// ---------------------------------------------------------------------------

describe('SLIDE_SHOW_CONVERTER.fromJson — null / invalid guards', () => {
    test('returns null for null', () => {
        expect(SLIDE_SHOW_CONVERTER.fromJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(SLIDE_SHOW_CONVERTER.fromJson(undefined)).toBeNull();
    });

    test('returns null when id is missing', () => {
        const json = { slides: [FULL_IMAGE_SLIDE], currentSlideIndex: 0 } as never;
        expect(SLIDE_SHOW_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when id has an invalid format', () => {
        const json = { id: 'not-a-valid-id', slides: [FULL_IMAGE_SLIDE], currentSlideIndex: 0 } as never;
        expect(SLIDE_SHOW_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when slides is null', () => {
        const json = { id: VALID_SHOW_ID, slides: null, currentSlideIndex: 0 } as never;
        expect(SLIDE_SHOW_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when slides contains an invalid slide', () => {
        const badSlide = { slideType: 'full-image' }; // missing slideId and image
        const json = { id: VALID_SHOW_ID, slides: [badSlide], currentSlideIndex: 0 } as never;
        expect(SLIDE_SHOW_CONVERTER.fromJson(json)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// SLIDE_SHOW_CONVERTER.fromJson — valid inputs
// ---------------------------------------------------------------------------

describe('SLIDE_SHOW_CONVERTER.fromJson — valid inputs', () => {
    const validJson = {
        id: VALID_SHOW_ID,
        slides: [{
            slideId: VALID_SLIDE_ID,
            slideType: 'full-image' as const,
            image: VALID_IMAGE,
        }],
        currentSlideIndex: 0,
    };

    test('returns a SlideShow for minimal valid JSON', () => {
        expect(SLIDE_SHOW_CONVERTER.fromJson(validJson)).not.toBeNull();
    });

    test('id matches the input', () => {
        const result = SLIDE_SHOW_CONVERTER.fromJson(validJson)!;
        expect(result.id).toBe(VALID_SHOW_ID);
    });

    test('slides array is populated correctly', () => {
        const result = SLIDE_SHOW_CONVERTER.fromJson(validJson)!;
        expect(result.slides).toHaveLength(1);
        expect(result.slides[0].slideType).toBe('full-image');
        expect(result.slides[0].slideId).toBe(VALID_SLIDE_ID);
    });

    test('currentSlideIndex defaults to 0 when missing', () => {
        const json = { id: VALID_SHOW_ID, slides: [] } as never;
        const result = SLIDE_SHOW_CONVERTER.fromJson(json)!;
        expect(result.currentSlideIndex).toBe(0);
    });

    test('currentSlideIndex defaults to 0 when null', () => {
        const json = { id: VALID_SHOW_ID, slides: [], currentSlideIndex: null } as never;
        const result = SLIDE_SHOW_CONVERTER.fromJson(json)!;
        expect(result.currentSlideIndex).toBe(0);
    });

    test('currentSlideIndex is set when present', () => {
        const json = { ...validJson, currentSlideIndex: 3 };
        const result = SLIDE_SHOW_CONVERTER.fromJson(json)!;
        expect(result.currentSlideIndex).toBe(3);
    });

    test('countdownTarget is undefined when missing', () => {
        const result = SLIDE_SHOW_CONVERTER.fromJson(validJson)!;
        expect(result.countdownTarget).toBeUndefined();
    });

    test('countdownTarget is set when present', () => {
        const json = { ...validJson, countdownTarget: '2026-12-31T23:59:59' };
        const result = SLIDE_SHOW_CONVERTER.fromJson(json)!;
        expect(result.countdownTarget).toBeDefined();
        expect(result.countdownTarget?.year).toBe(2026);
        expect(result.countdownTarget?.month).toBe(12);
        expect(result.countdownTarget?.day).toBe(31);
    });

    test('countdownTarget is undefined when the string is invalid', () => {
        const json = { ...validJson, countdownTarget: 'not-a-date' };
        const result = SLIDE_SHOW_CONVERTER.fromJson(json)!;
        expect(result.countdownTarget).toBeUndefined();
    });

    test('empty slides array is preserved', () => {
        const json = { id: VALID_SHOW_ID, slides: [], currentSlideIndex: 0 };
        const result = SLIDE_SHOW_CONVERTER.fromJson(json)!;
        expect(result.slides).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// SLIDE_SHOW_CONVERTER.toJson — null guards
// ---------------------------------------------------------------------------

describe('SLIDE_SHOW_CONVERTER.toJson — null guards', () => {
    test('returns null for null', () => {
        expect(SLIDE_SHOW_CONVERTER.toJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(SLIDE_SHOW_CONVERTER.toJson(undefined)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// SLIDE_SHOW_CONVERTER.toJson — valid inputs
// ---------------------------------------------------------------------------

describe('SLIDE_SHOW_CONVERTER.toJson — valid inputs', () => {
    test('serializes id correctly', () => {
        const result = SLIDE_SHOW_CONVERTER.toJson(MINIMAL_SLIDESHOW)!;
        expect(result.id).toBe(VALID_SHOW_ID);
    });

    test('serializes slides array', () => {
        const result = SLIDE_SHOW_CONVERTER.toJson(MINIMAL_SLIDESHOW)!;
        expect(Array.isArray(result.slides)).toBe(true);
        const slides = result.slides as unknown[];
        expect(slides).toHaveLength(1);
    });

    test('serializes currentSlideIndex', () => {
        const slideshow: SlideShow = { ...MINIMAL_SLIDESHOW, currentSlideIndex: 2 };
        const result = SLIDE_SHOW_CONVERTER.toJson(slideshow)!;
        expect(result.currentSlideIndex).toBe(2);
    });

    test('serializes countdownTarget as ISO string when present', () => {
        const result = SLIDE_SHOW_CONVERTER.toJson(SLIDESHOW_WITH_COUNTDOWN)!;
        expect(typeof result.countdownTarget).toBe('string');
        expect(result.countdownTarget as string).toContain('2026-12-31');
    });

    test('countdownTarget is null in JSON when absent on the object', () => {
        const result = SLIDE_SHOW_CONVERTER.toJson(MINIMAL_SLIDESHOW)!;
        expect(result.countdownTarget).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Round-trip: fromJson ∘ toJson
// ---------------------------------------------------------------------------

describe('SLIDE_SHOW_CONVERTER round-trip', () => {
    test('SlideShow without countdown survives a full round-trip', () => {
        const json = SLIDE_SHOW_CONVERTER.toJson(MINIMAL_SLIDESHOW)!;
        const result = SLIDE_SHOW_CONVERTER.fromJson(json)!;
        expect(result).not.toBeNull();
        expect(result.id).toBe(MINIMAL_SLIDESHOW.id);
        expect(result.currentSlideIndex).toBe(MINIMAL_SLIDESHOW.currentSlideIndex);
        expect(result.slides).toHaveLength(MINIMAL_SLIDESHOW.slides.length);
        expect(result.slides[0].slideId).toBe(MINIMAL_SLIDESHOW.slides[0].slideId);
        expect(result.slides[0].slideType).toBe(MINIMAL_SLIDESHOW.slides[0].slideType);
        expect(result.countdownTarget).toBeUndefined();
    });

    test('SlideShow with countdown survives a full round-trip', () => {
        const json = SLIDE_SHOW_CONVERTER.toJson(SLIDESHOW_WITH_COUNTDOWN)!;
        const result = SLIDE_SHOW_CONVERTER.fromJson(json);
        expect(result).not.toBeNull();
        expect(result!.id).toBe(VALID_SHOW_ID);
        expect(result!.countdownTarget?.toString()).toBe(COUNTDOWN_TARGET.toString());
    });

    test('SlideShow with empty slides array round-trips correctly', () => {
        const empty: SlideShow = { id: VALID_SHOW_ID, slides: [], currentSlideIndex: 0 };
        const json = SLIDE_SHOW_CONVERTER.toJson(empty)!;
        const result = SLIDE_SHOW_CONVERTER.fromJson(json)!;
        expect(result).not.toBeNull();
        expect(result.id).toBe(VALID_SHOW_ID);
        expect(result.slides).toEqual([]);
        expect(result.currentSlideIndex).toBe(0);
        expect(result.countdownTarget).toBeUndefined();
    });
});
