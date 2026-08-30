import { describe, test, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { findNextSlideId, findSlide, indexOfSlide, pickNewest, SLIDE_SHOW_CONVERTER, type SlideShow } from './SlideShow';
import type { AppId } from '../identifier/AppId';
import type { FullImageSlide } from './Slide';
import { PLACEHOLDER_IMAGE } from './Image';

const VALID_SHOW_ID = 'show-2026-08-18-10-00-00-000' as AppId;
const VALID_SLIDE_ID = 'slide-2026-08-18-10-00-00-000' as AppId;
const VALID_IMAGE = PLACEHOLDER_IMAGE;
const VALID_TIME_PER_SLIDE = Temporal.Duration.from({ seconds: 10 });

const FULL_IMAGE_SLIDE: FullImageSlide = {
    slideId: VALID_SLIDE_ID,
    slideType: 'full-image',
    image: VALID_IMAGE,
};

const MINIMAL_SLIDESHOW: SlideShow = {
    id: VALID_SHOW_ID,
    slides: [FULL_IMAGE_SLIDE],
    timePerSlide: VALID_TIME_PER_SLIDE,
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
        const json = { id: VALID_SHOW_ID, slides: [badSlide], timePerSlide: 'PT10S' } as never;
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
        timePerSlide: 'PT10S',
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
        const json = { id: VALID_SHOW_ID, slides: [], timePerSlide: 'PT10S' };
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
        const empty: SlideShow = { id: VALID_SHOW_ID, slides: [], timePerSlide: VALID_TIME_PER_SLIDE };
        const json = SLIDE_SHOW_CONVERTER.toJson(empty)!;
        const result = SLIDE_SHOW_CONVERTER.fromJson(json)!;
        expect(result).not.toBeNull();
        expect(result.id).toBe(VALID_SHOW_ID);
        expect(result.slides).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// findSlide
// ---------------------------------------------------------------------------

describe('findSlide', () => {
    const OTHER_SLIDE_ID = 'slide-2099-01-01-00-00-00-000' as AppId;

    test('returns null when both arguments are undefined', () => {
        expect(findSlide()).toBeNull();
    });

    test('returns null when slideShow is null', () => {
        expect(findSlide(null, VALID_SLIDE_ID)).toBeNull();
    });

    test('returns null when slideId is null', () => {
        expect(findSlide(MINIMAL_SLIDESHOW, null)).toBeNull();
    });

    test('returns null when both arguments are null', () => {
        expect(findSlide(null, null)).toBeNull();
    });

    test('returns the matching slide', () => {
        expect(findSlide(MINIMAL_SLIDESHOW, VALID_SLIDE_ID)).toBe(FULL_IMAGE_SLIDE);
    });

    test('returns null when no slide matches the given id', () => {
        expect(findSlide(MINIMAL_SLIDESHOW, OTHER_SLIDE_ID)).toBeNull();
    });

    test('returns null when the slides array is empty', () => {
        const empty: SlideShow = { id: VALID_SHOW_ID, slides: [], timePerSlide: VALID_TIME_PER_SLIDE };
        expect(findSlide(empty, VALID_SLIDE_ID)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Shared fixtures for multi-slide tests
// ---------------------------------------------------------------------------

const SLIDE_2_ID = 'slide-2026-08-18-10-00-00-001' as AppId;
const SLIDE_3_ID = 'slide-2026-08-18-10-00-00-002' as AppId;
const OTHER_SLIDE_ID = 'slide-2099-01-01-00-00-00-000' as AppId;

const SLIDE_2: FullImageSlide = { slideId: SLIDE_2_ID, slideType: 'full-image', image: VALID_IMAGE };
const SLIDE_3: FullImageSlide = { slideId: SLIDE_3_ID, slideType: 'full-image', image: VALID_IMAGE };

const TWO_SLIDE_SHOW: SlideShow = { id: VALID_SHOW_ID, slides: [FULL_IMAGE_SLIDE, SLIDE_2], timePerSlide: VALID_TIME_PER_SLIDE };
const THREE_SLIDE_SHOW: SlideShow = { id: VALID_SHOW_ID, slides: [FULL_IMAGE_SLIDE, SLIDE_2, SLIDE_3], timePerSlide: VALID_TIME_PER_SLIDE };

// ---------------------------------------------------------------------------
// indexOfSlide
// ---------------------------------------------------------------------------

describe('indexOfSlide', () => {
    test('returns -1 when both arguments are undefined', () => {
        expect(indexOfSlide()).toBe(-1);
    });

    test('returns -1 when slideShow is null', () => {
        expect(indexOfSlide(null, VALID_SLIDE_ID)).toBe(-1);
    });

    test('returns -1 when slideId is null', () => {
        expect(indexOfSlide(MINIMAL_SLIDESHOW, null)).toBe(-1);
    });

    test('returns -1 when slide is not found', () => {
        expect(indexOfSlide(MINIMAL_SLIDESHOW, OTHER_SLIDE_ID)).toBe(-1);
    });

    test('returns -1 for an empty slides array', () => {
        const empty: SlideShow = { id: VALID_SHOW_ID, slides: [], timePerSlide: VALID_TIME_PER_SLIDE };
        expect(indexOfSlide(empty, VALID_SLIDE_ID)).toBe(-1);
    });

    test('returns 0 for the only slide', () => {
        expect(indexOfSlide(MINIMAL_SLIDESHOW, VALID_SLIDE_ID)).toBe(0);
    });

    test('returns 0 for the first slide in a multi-slide show', () => {
        expect(indexOfSlide(TWO_SLIDE_SHOW, VALID_SLIDE_ID)).toBe(0);
    });

    test('returns 1 for the second slide in a multi-slide show', () => {
        expect(indexOfSlide(TWO_SLIDE_SHOW, SLIDE_2_ID)).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// findNextSlideId
// ---------------------------------------------------------------------------

describe('findNextSlideId', () => {
    test('returns null when slideShow is undefined', () => {
        expect(findNextSlideId()).toBeNull();
    });

    test('returns null when slideShow is null', () => {
        expect(findNextSlideId(null, VALID_SLIDE_ID)).toBeNull();
    });

    test('returns null for an empty slides array', () => {
        const empty: SlideShow = { id: VALID_SHOW_ID, slides: [], timePerSlide: VALID_TIME_PER_SLIDE };
        expect(findNextSlideId(empty, VALID_SLIDE_ID)).toBeNull();
    });

    test('wraps to first slide when currentSlideId is null', () => {
        expect(findNextSlideId(MINIMAL_SLIDESHOW, null)).toBe(VALID_SLIDE_ID);
    });

    test('wraps to first slide when currentSlideId is not found', () => {
        expect(findNextSlideId(TWO_SLIDE_SHOW, OTHER_SLIDE_ID)).toBe(VALID_SLIDE_ID);
    });

    test('returns the second slide when current is the first', () => {
        expect(findNextSlideId(TWO_SLIDE_SHOW, VALID_SLIDE_ID)).toBe(SLIDE_2_ID);
    });

    test('wraps to first slide when current is the last', () => {
        expect(findNextSlideId(TWO_SLIDE_SHOW, SLIDE_2_ID)).toBe(VALID_SLIDE_ID);
    });

    test('returns the next slide for a middle slide in a three-slide show', () => {
        expect(findNextSlideId(THREE_SLIDE_SHOW, SLIDE_2_ID)).toBe(SLIDE_3_ID);
    });
});

// ---------------------------------------------------------------------------
// SLIDE_SHOW_CONVERTER.fromJson — timePerSlide
// ---------------------------------------------------------------------------

describe('SLIDE_SHOW_CONVERTER.fromJson — timePerSlide', () => {
    const baseJson = {
        id: VALID_SHOW_ID,
        slides: [{
            slideId: VALID_SLIDE_ID,
            slideType: 'full-image' as const,
            image: VALID_IMAGE,
        }],
    };

    test('returns null when timePerSlide is missing', () => {
        expect(SLIDE_SHOW_CONVERTER.fromJson(baseJson)).toBeNull();
    });

    test('returns null when timePerSlide is an invalid string', () => {
        const json = { ...baseJson, timePerSlide: 'not-a-duration' };
        expect(SLIDE_SHOW_CONVERTER.fromJson(json)).toBeNull();
    });

    test('parses a valid ISO 8601 duration string', () => {
        const json = { ...baseJson, timePerSlide: 'PT10S' };
        const result = SLIDE_SHOW_CONVERTER.fromJson(json)!;
        expect(result).not.toBeNull();
        expect(result.timePerSlide.seconds).toBe(10);
    });
});

// ---------------------------------------------------------------------------
// SLIDE_SHOW_CONVERTER.toJson — timePerSlide
// ---------------------------------------------------------------------------

describe('SLIDE_SHOW_CONVERTER.toJson — timePerSlide', () => {
    test('serializes timePerSlide to its ISO 8601 string', () => {
        const result = SLIDE_SHOW_CONVERTER.toJson(MINIMAL_SLIDESHOW)!;
        expect(result.timePerSlide).toBe('PT10S');
    });
});

// ---------------------------------------------------------------------------
// SLIDE_SHOW_CONVERTER round-trip — timePerSlide
// ---------------------------------------------------------------------------

describe('SLIDE_SHOW_CONVERTER round-trip — timePerSlide', () => {
    test('timePerSlide survives a full round-trip', () => {
        const json = SLIDE_SHOW_CONVERTER.toJson(MINIMAL_SLIDESHOW)!;
        const result = SLIDE_SHOW_CONVERTER.fromJson(json)!;
        expect(result).not.toBeNull();
        expect(Temporal.Duration.compare(result.timePerSlide, VALID_TIME_PER_SLIDE)).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// SLIDE_SHOW_CONVERTER — darkMode
// ---------------------------------------------------------------------------

const BASE_VALID_JSON = {
    id: VALID_SHOW_ID,
    slides: [{
        slideId: VALID_SLIDE_ID,
        slideType: 'full-image' as const,
        image: VALID_IMAGE,
    }],
    timePerSlide: 'PT10S',
};

describe('SLIDE_SHOW_CONVERTER.fromJson — darkMode', () => {
    test('reads darkMode: true', () => {
        const result = SLIDE_SHOW_CONVERTER.fromJson({ ...BASE_VALID_JSON, darkMode: true })!;
        expect(result.darkMode).toBe(true);
    });

    test('reads darkMode: false', () => {
        const result = SLIDE_SHOW_CONVERTER.fromJson({ ...BASE_VALID_JSON, darkMode: false })!;
        expect(result.darkMode).toBe(false);
    });

    test('reads darkMode: null as null', () => {
        const result = SLIDE_SHOW_CONVERTER.fromJson({ ...BASE_VALID_JSON, darkMode: null })!;
        expect(result.darkMode).toBeNull();
    });

    test('reads absent darkMode as null', () => {
        const result = SLIDE_SHOW_CONVERTER.fromJson(BASE_VALID_JSON)!;
        expect(result.darkMode).toBeNull();
    });
});

describe('SLIDE_SHOW_CONVERTER.toJson — darkMode', () => {
    test('serializes darkMode: true', () => {
        const show: SlideShow = { ...MINIMAL_SLIDESHOW, darkMode: true };
        expect(SLIDE_SHOW_CONVERTER.toJson(show)!.darkMode).toBe(true);
    });

    test('serializes darkMode: false', () => {
        const show: SlideShow = { ...MINIMAL_SLIDESHOW, darkMode: false };
        expect(SLIDE_SHOW_CONVERTER.toJson(show)!.darkMode).toBe(false);
    });

    test('serializes darkMode: null as null', () => {
        const show: SlideShow = { ...MINIMAL_SLIDESHOW, darkMode: null };
        expect(SLIDE_SHOW_CONVERTER.toJson(show)!.darkMode).toBeNull();
    });

    test('serializes absent darkMode as null', () => {
        expect(SLIDE_SHOW_CONVERTER.toJson(MINIMAL_SLIDESHOW)!.darkMode).toBeNull();
    });
});

describe('SLIDE_SHOW_CONVERTER round-trip — darkMode', () => {
    test('darkMode: true survives a round-trip', () => {
        const show: SlideShow = { ...MINIMAL_SLIDESHOW, darkMode: true };
        const result = SLIDE_SHOW_CONVERTER.fromJson(SLIDE_SHOW_CONVERTER.toJson(show))!;
        expect(result.darkMode).toBe(true);
    });

    test('darkMode: false survives a round-trip', () => {
        const show: SlideShow = { ...MINIMAL_SLIDESHOW, darkMode: false };
        const result = SLIDE_SHOW_CONVERTER.fromJson(SLIDE_SHOW_CONVERTER.toJson(show))!;
        expect(result.darkMode).toBe(false);
    });

    test('darkMode: null survives a round-trip', () => {
        const show: SlideShow = { ...MINIMAL_SLIDESHOW, darkMode: null };
        const result = SLIDE_SHOW_CONVERTER.fromJson(SLIDE_SHOW_CONVERTER.toJson(show))!;
        expect(result.darkMode).toBeNull();
    });

    test('absent darkMode survives a round-trip as null', () => {
        const result = SLIDE_SHOW_CONVERTER.fromJson(SLIDE_SHOW_CONVERTER.toJson(MINIMAL_SLIDESHOW))!;
        expect(result.darkMode).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// pickNewest
// ---------------------------------------------------------------------------

const OLDER_SHOW_ID = 'show-2026-01-01-00-00-00-000' as AppId;
const NEWER_SHOW_ID = 'show-2026-12-31-23-59-59-999' as AppId;

const OLDER_SLIDESHOW: SlideShow = { id: OLDER_SHOW_ID, slides: [FULL_IMAGE_SLIDE], timePerSlide: VALID_TIME_PER_SLIDE };
const NEWER_SLIDESHOW: SlideShow = { id: NEWER_SHOW_ID, slides: [FULL_IMAGE_SLIDE], timePerSlide: VALID_TIME_PER_SLIDE };

describe('pickNewest', () => {
    test('returns null when both arguments are undefined', () => {
        expect(pickNewest()).toBeNull();
    });

    test('returns null when both arguments are null', () => {
        expect(pickNewest(null, null)).toBeNull();
    });

    test('returns B when A is null', () => {
        expect(pickNewest(null, NEWER_SLIDESHOW)).toBe(NEWER_SLIDESHOW);
    });

    test('returns A when B is null', () => {
        expect(pickNewest(OLDER_SLIDESHOW, null)).toBe(OLDER_SLIDESHOW);
    });

    test('returns A when only A is provided', () => {
        expect(pickNewest(OLDER_SLIDESHOW)).toBe(OLDER_SLIDESHOW);
    });

    test('returns B when only B is provided', () => {
        expect(pickNewest(undefined, NEWER_SLIDESHOW)).toBe(NEWER_SLIDESHOW);
    });

    test('returns A when A has a newer id than B', () => {
        expect(pickNewest(NEWER_SLIDESHOW, OLDER_SLIDESHOW)).toBe(NEWER_SLIDESHOW);
    });

    test('returns B when B has a newer id than A', () => {
        expect(pickNewest(OLDER_SLIDESHOW, NEWER_SLIDESHOW)).toBe(NEWER_SLIDESHOW);
    });

    test('returns A when both ids are equal', () => {
        const sameIdShow: SlideShow = { id: OLDER_SHOW_ID, slides: [], timePerSlide: VALID_TIME_PER_SLIDE };
        expect(pickNewest(OLDER_SLIDESHOW, sameIdShow)).toBe(OLDER_SLIDESHOW);
    });
});
