import { describe, test, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { createSlideId, SLIDE_CONVERTER, type Slide } from './Slide';
import type { AppId } from '../identifier/AppId';
import { PLACEHOLDER_IMAGE } from './Image';

const VALID_SLIDE_ID = 'slide-2026-08-18-10-00-00-000_v2' as AppId;
const VALID_IMAGE = PLACEHOLDER_IMAGE;

const TEXT_AREA = { areaType: 'text', left: 0, top: 0, width: 960, height: 1080, text: 'Hello **World**' } as const;

const MIXED_SLIDE: Slide = {
    slideId: VALID_SLIDE_ID,
    width: 1920,
    height: 1080,
    areas: [
        TEXT_AREA,
        { areaType: 'image', left: 960, top: 0, width: 960, height: 540, image: VALID_IMAGE },
        { areaType: 'qr-code', left: 960, top: 540, width: 960, height: 540, data: 'https://example.com' },
    ],
};

// ---------------------------------------------------------------------------
// createSlideId
// ---------------------------------------------------------------------------

describe('createSlideId', () => {
    test('returns a string matching the slide-YYYY-MM-DD-HH-mm-ss-mmm pattern', () => {
        expect(createSlideId()).toMatch(/^slide-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-\d{3}_v2$/);
    });

    test('uses the supplied PlainDateTime when provided', () => {
        const date = Temporal.PlainDateTime.from('2026-03-15T12:34:56.789');
        expect(createSlideId(date)).toBe('slide-2026-03-15-12-34-56-789_v2');
    });
});

// ---------------------------------------------------------------------------
// SLIDE_CONVERTER.fromJson
// ---------------------------------------------------------------------------

describe('SLIDE_CONVERTER.fromJson — invalid input', () => {
    test.each([null, undefined, 'slide', 42])('returns null for %s', (json) => {
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when slideId is missing', () => {
        const json: Record<string, unknown> = { ...MIXED_SLIDE };
        delete json.slideId;
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when slideId has an invalid format', () => {
        expect(SLIDE_CONVERTER.fromJson({ ...MIXED_SLIDE, slideId: 'not-a-valid-id' })).toBeNull();
    });

    test('returns null when slideId has no _v2 suffix', () => {
        expect(SLIDE_CONVERTER.fromJson({ ...MIXED_SLIDE, slideId: 'slide-2026-08-18-10-00-00-000' })).toBeNull();
    });

    test.each(['width', 'height'])('returns null when %s is missing or not positive', (field) => {
        for (const value of [undefined, null, '1920', 0, -1, Number.NaN]) {
            expect(SLIDE_CONVERTER.fromJson({ ...MIXED_SLIDE, [field]: value })).toBeNull();
        }
    });

    test('returns null when areas is missing', () => {
        const json: Record<string, unknown> = { ...MIXED_SLIDE };
        delete json.areas;
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when one area is invalid', () => {
        const areas = [...MIXED_SLIDE.areas, { areaType: 'video', left: 0, top: 0, width: 10, height: 10 }];
        expect(SLIDE_CONVERTER.fromJson({ ...MIXED_SLIDE, areas })).toBeNull();
    });

    test('returns null for a slide of the slice format', () => {
        const json = { slideId: VALID_SLIDE_ID, slices: [{ sliceType: 'text', width: 100, text: 'a' }] };
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null for a slide in the old format', () => {
        const json = { slideId: VALID_SLIDE_ID, slideType: 'full-image', image: VALID_IMAGE };
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });
});

describe('SLIDE_CONVERTER.fromJson — valid input', () => {
    test('reads slideId, size and all areas in order', () => {
        expect(SLIDE_CONVERTER.fromJson(MIXED_SLIDE)).toEqual(MIXED_SLIDE);
    });

    test('keeps areas as they are, even when they overlap', () => {
        const json = { ...MIXED_SLIDE, areas: [TEXT_AREA, { ...TEXT_AREA, text: 'b' }] };
        expect(SLIDE_CONVERTER.fromJson(json)!.areas).toEqual(json.areas);
    });

    test('accepts a slide without areas', () => {
        expect(SLIDE_CONVERTER.fromJson({ ...MIXED_SLIDE, areas: [] })!.areas).toEqual([]);
    });

    test('accepts other slide sizes', () => {
        expect(SLIDE_CONVERTER.fromJson({ ...MIXED_SLIDE, width: 1024, height: 768 })).toMatchObject({ width: 1024, height: 768 });
    });
});

// ---------------------------------------------------------------------------
// SLIDE_CONVERTER.toJson
// ---------------------------------------------------------------------------

describe('SLIDE_CONVERTER.toJson', () => {
    test('returns null for null and undefined', () => {
        expect(SLIDE_CONVERTER.toJson(null)).toBeNull();
        expect(SLIDE_CONVERTER.toJson(undefined)).toBeNull();
    });

    test('serializes slideId, size and areas', () => {
        expect(SLIDE_CONVERTER.toJson(MIXED_SLIDE)).toEqual({
            slideId: VALID_SLIDE_ID,
            width: 1920,
            height: 1080,
            areas: MIXED_SLIDE.areas,
        });
    });

    test('survives a round-trip through JSON.stringify', () => {
        const json = JSON.parse(JSON.stringify(SLIDE_CONVERTER.toJson(MIXED_SLIDE)));
        expect(SLIDE_CONVERTER.fromJson(json)).toEqual(MIXED_SLIDE);
    });
});
