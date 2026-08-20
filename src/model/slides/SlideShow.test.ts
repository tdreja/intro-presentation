import { describe, test, expect } from 'vitest';
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
        const json = { slides: [FULL_IMAGE_SLIDE] } as never;
        expect(SLIDE_SHOW_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when id has an invalid format', () => {
        const json = { id: 'not-a-valid-id', slides: [FULL_IMAGE_SLIDE] } as never;
        expect(SLIDE_SHOW_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when slides is null', () => {
        const json = { id: VALID_SHOW_ID, slides: null } as never;
        expect(SLIDE_SHOW_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when slides contains an invalid slide', () => {
        const badSlide = { slideType: 'full-image' }; // missing slideId and image
        const json = { id: VALID_SHOW_ID, slides: [badSlide] } as never;
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

    test('empty slides array is preserved', () => {
        const json = { id: VALID_SHOW_ID, slides: [] };
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
});

// ---------------------------------------------------------------------------
// Round-trip: fromJson ∘ toJson
// ---------------------------------------------------------------------------

describe('SLIDE_SHOW_CONVERTER round-trip', () => {
    test('SlideShow survives a full round-trip', () => {
        const json = SLIDE_SHOW_CONVERTER.toJson(MINIMAL_SLIDESHOW)!;
        const result = SLIDE_SHOW_CONVERTER.fromJson(json)!;
        expect(result).not.toBeNull();
        expect(result.id).toBe(MINIMAL_SLIDESHOW.id);
        expect(result.slides).toHaveLength(MINIMAL_SLIDESHOW.slides.length);
        expect(result.slides[0].slideId).toBe(MINIMAL_SLIDESHOW.slides[0].slideId);
        expect(result.slides[0].slideType).toBe(MINIMAL_SLIDESHOW.slides[0].slideType);
    });

    test('SlideShow with empty slides array round-trips correctly', () => {
        const empty: SlideShow = { id: VALID_SHOW_ID, slides: [] };
        const json = SLIDE_SHOW_CONVERTER.toJson(empty)!;
        const result = SLIDE_SHOW_CONVERTER.fromJson(json)!;
        expect(result).not.toBeNull();
        expect(result.id).toBe(VALID_SHOW_ID);
        expect(result.slides).toEqual([]);
    });
});
