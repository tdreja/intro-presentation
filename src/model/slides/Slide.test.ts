import { Temporal } from '@js-temporal/polyfill';
import { createSlideId, importSlide, importSlideJSON } from './Slide';
import type { FullImageSlide, HalfTextHalfImageSlide } from './Slide';
import type { AppId } from '../identifier/AppId';
import { PLACEHOLDER_IMAGE } from './Image';

const VALID_SLIDE_ID = 'slide-2026-08-18-10-00-00-000' as AppId;
const VALID_IMAGE = PLACEHOLDER_IMAGE;

// ---------------------------------------------------------------------------
// createSlideId
// ---------------------------------------------------------------------------

describe('createSlideId', () => {
    test('returns an id starting with "slide-"', () => {
        expect(createSlideId()).toMatch(/^slide-/);
    });

    test('produces a deterministic id from a fixed PlainDateTime', () => {
        const date = Temporal.PlainDateTime.from('2026-08-18T10:00:00');
        const id = createSlideId(date);
        expect(id).toBe('slide-2026-08-18-10-00-00-000');
    });

    test('returns an id matching the full slide-id format without a date argument', () => {
        const id = createSlideId();
        expect(id).toMatch(/^slide-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-\d{3}$/);
    });
});

// ---------------------------------------------------------------------------
// importSlide — invalid inputs
// ---------------------------------------------------------------------------

describe('importSlide — invalid inputs', () => {
    test('returns null for null', () => {
        expect(importSlide(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(importSlide(undefined)).toBeNull();
    });

    test('returns null for empty string', () => {
        expect(importSlideJSON('')).toBeNull();
    });

    test('returns null when slideId is missing', () => {
        const json = JSON.stringify({ slideType: 'full-image', image: VALID_IMAGE });
        expect(importSlideJSON(json)).toBeNull();
    });

    test('returns null when slideType is missing', () => {
        const json = JSON.stringify({ slideId: VALID_SLIDE_ID, image: VALID_IMAGE });
        expect(importSlideJSON(json)).toBeNull();
    });

    test('returns null when slideId has an invalid format', () => {
        const json = JSON.stringify({ slideId: 'not-a-valid-id', slideType: 'full-image', image: VALID_IMAGE });
        expect(importSlideJSON(json)).toBeNull();
    });

    test('returns null for an unknown slideType', () => {
        const json = JSON.stringify({ slideId: VALID_SLIDE_ID, slideType: 'unknown-type' });
        expect(importSlideJSON(json)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// importSlide — full-image
// ---------------------------------------------------------------------------

describe('importSlide — full-image', () => {
    test('returns a FullImageSlide for valid input', () => {
        const json = JSON.stringify({ slideId: VALID_SLIDE_ID, slideType: 'full-image', image: VALID_IMAGE });
        const result = importSlideJSON(json) as FullImageSlide;
        expect(result).not.toBeNull();
        expect(result.slideType).toBe('full-image');
        expect(result.slideId).toBe(VALID_SLIDE_ID);
        expect(result.image).toBe(VALID_IMAGE);
    });

    test('returns null when image is missing', () => {
        const json = JSON.stringify({ slideId: VALID_SLIDE_ID, slideType: 'full-image' });
        expect(importSlideJSON(json)).toBeNull();
    });

    test('returns null when image is not a valid base64 data URL', () => {
        const json = JSON.stringify({ slideId: VALID_SLIDE_ID, slideType: 'full-image', image: 'not-an-image' });
        expect(importSlideJSON(json)).toBeNull();
    });

    test('round-trips a FullImageSlide through JSON.stringify', () => {
        const slide: FullImageSlide = { slideId: VALID_SLIDE_ID, slideType: 'full-image', image: VALID_IMAGE };
        const result = importSlideJSON(JSON.stringify(slide));
        expect(result).toEqual(slide);
    });

    test('preserves headline when present', () => {
        const slide: FullImageSlide = { slideId: VALID_SLIDE_ID, slideType: 'full-image', image: VALID_IMAGE, headline: 'My Title' };
        const result = importSlideJSON(JSON.stringify(slide)) as FullImageSlide;
        expect(result).not.toBeNull();
        expect(result.headline).toBe('My Title');
    });

    test('headline is undefined when not provided', () => {
        const json = JSON.stringify({ slideId: VALID_SLIDE_ID, slideType: 'full-image', image: VALID_IMAGE });
        const result = importSlideJSON(json) as FullImageSlide;
        expect(result).not.toBeNull();
        expect(result.headline).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// importSlide — half-text-half-image
// ---------------------------------------------------------------------------

describe('importSlide — half-text-half-image', () => {
    test('returns a HalfTextHalfImageSlide for valid input', () => {
        const json = JSON.stringify({
            slideId: VALID_SLIDE_ID,
            slideType: 'half-text-half-image',
            text: 'Hello World',
            image: VALID_IMAGE,
            layout: 'half-half',
        });
        const result = importSlideJSON(json) as HalfTextHalfImageSlide;
        expect(result).not.toBeNull();
        expect(result.slideType).toBe('half-text-half-image');
        expect(result.slideId).toBe(VALID_SLIDE_ID);
        expect(result.text).toBe('Hello World');
        expect(result.image).toBe(VALID_IMAGE);
        expect(result.layout).toBe('half-half');
    });

    test('returns null when text is missing', () => {
        const json = JSON.stringify({ slideId: VALID_SLIDE_ID, slideType: 'half-text-half-image', image: VALID_IMAGE, layout: 'half-half' });
        expect(importSlideJSON(json)).toBeNull();
    });

    test('returns null when image is missing', () => {
        const json = JSON.stringify({ slideId: VALID_SLIDE_ID, slideType: 'half-text-half-image', text: 'Hello', layout: 'half-half' });
        expect(importSlideJSON(json)).toBeNull();
    });

    test('returns null when image is not a valid base64 data URL', () => {
        const json = JSON.stringify({
            slideId: VALID_SLIDE_ID,
            slideType: 'half-text-half-image',
            text: 'Hello',
            image: 'not-an-image',
            layout: 'half-half',
        });
        expect(importSlideJSON(json)).toBeNull();
    });

    test('returns null when layout is missing', () => {
        const json = JSON.stringify({ slideId: VALID_SLIDE_ID, slideType: 'half-text-half-image', text: 'Hello', image: VALID_IMAGE });
        expect(importSlideJSON(json)).toBeNull();
    });

    test('returns null when layout is invalid', () => {
        const json = JSON.stringify({ slideId: VALID_SLIDE_ID, slideType: 'half-text-half-image', text: 'Hello', image: VALID_IMAGE, layout: 'invalid-layout' });
        expect(importSlideJSON(json)).toBeNull();
    });

    test('round-trips a HalfTextHalfImageSlide through JSON.stringify', () => {
        const slide: HalfTextHalfImageSlide = {
            slideId: VALID_SLIDE_ID,
            slideType: 'half-text-half-image',
            text: 'Hello World',
            image: VALID_IMAGE,
            layout: 'half-half',
        };
        const result = importSlideJSON(JSON.stringify(slide));
        expect(result).toEqual(slide);
    });

    test.each(['half-half', 'one-third-left', 'one-third-right'] as const)('round-trips layout "%s"', (layout) => {
        const slide: HalfTextHalfImageSlide = {
            slideId: VALID_SLIDE_ID,
            slideType: 'half-text-half-image',
            text: 'Hello World',
            image: VALID_IMAGE,
            layout,
        };
        const result = importSlideJSON(JSON.stringify(slide)) as HalfTextHalfImageSlide;
        expect(result).not.toBeNull();
        expect(result.layout).toBe(layout);
    });

    test('preserves headline when present', () => {
        const slide: HalfTextHalfImageSlide = {
            slideId: VALID_SLIDE_ID,
            slideType: 'half-text-half-image',
            text: 'Hello World',
            image: VALID_IMAGE,
            layout: 'half-half',
            headline: 'My Title',
        };
        const result = importSlideJSON(JSON.stringify(slide)) as HalfTextHalfImageSlide;
        expect(result).not.toBeNull();
        expect(result.headline).toBe('My Title');
    });

    test('headline is undefined when not provided', () => {
        const json = JSON.stringify({ slideId: VALID_SLIDE_ID, slideType: 'half-text-half-image', text: 'Hello World', image: VALID_IMAGE, layout: 'half-half' });
        const result = importSlideJSON(json) as HalfTextHalfImageSlide;
        expect(result).not.toBeNull();
        expect(result.headline).toBeUndefined();
    });
});
