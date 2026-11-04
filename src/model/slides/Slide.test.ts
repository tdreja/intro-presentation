import { describe, test, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { createSlideId, SLIDE_CONVERTER, type Slide } from './Slide';
import type { AppId } from '../identifier/AppId';
import { PLACEHOLDER_IMAGE } from './Image';

const VALID_SLIDE_ID = 'slide-2026-08-18-10-00-00-000' as AppId;
const VALID_IMAGE = PLACEHOLDER_IMAGE;

const MIXED_SLIDE: Slide = {
    slideId: VALID_SLIDE_ID,
    slices: [
        { sliceType: 'text', width: 50, text: 'Hello **World**' },
        { sliceType: 'image', width: 30, image: VALID_IMAGE },
        { sliceType: 'qr-code', width: 20, data: 'https://example.com' },
    ],
};

// ---------------------------------------------------------------------------
// createSlideId
// ---------------------------------------------------------------------------

describe('createSlideId', () => {
    test('returns a string matching the slide-YYYY-MM-DD-HH-mm-ss-mmm pattern', () => {
        expect(createSlideId()).toMatch(/^slide-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-\d{3}$/);
    });

    test('uses the supplied PlainDateTime when provided', () => {
        const date = Temporal.PlainDateTime.from('2026-03-15T12:34:56.789');
        expect(createSlideId(date)).toBe('slide-2026-03-15-12-34-56-789');
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
        expect(SLIDE_CONVERTER.fromJson({ slices: MIXED_SLIDE.slices })).toBeNull();
    });

    test('returns null when slideId has an invalid format', () => {
        expect(SLIDE_CONVERTER.fromJson({ slideId: 'not-a-valid-id', slices: MIXED_SLIDE.slices })).toBeNull();
    });

    test('returns null when slices is missing', () => {
        expect(SLIDE_CONVERTER.fromJson({ slideId: VALID_SLIDE_ID })).toBeNull();
    });

    test('returns null when slices is empty', () => {
        expect(SLIDE_CONVERTER.fromJson({ slideId: VALID_SLIDE_ID, slices: [] })).toBeNull();
    });

    test('returns null when one slice is invalid', () => {
        const slices = [...MIXED_SLIDE.slices, { sliceType: 'video', width: 10 }];
        expect(SLIDE_CONVERTER.fromJson({ slideId: VALID_SLIDE_ID, slices })).toBeNull();
    });

    test('returns null for a slide in the old format', () => {
        const json = { slideId: VALID_SLIDE_ID, slideType: 'full-image', image: VALID_IMAGE };
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });
});

describe('SLIDE_CONVERTER.fromJson — valid input', () => {
    test('reads slideId and all slices in order', () => {
        expect(SLIDE_CONVERTER.fromJson(MIXED_SLIDE)).toEqual(MIXED_SLIDE);
    });

    test('keeps widths that already add up to 100', () => {
        const result = SLIDE_CONVERTER.fromJson(MIXED_SLIDE)!;
        expect(result.slices.map(s => s.width)).toEqual([50, 30, 20]);
    });

    test('scales widths that add up to less than 100', () => {
        const json = {
            slideId: VALID_SLIDE_ID,
            slices: [
                { sliceType: 'text', width: 30, text: 'a' },
                { sliceType: 'text', width: 30, text: 'b' },
            ],
        };
        const result = SLIDE_CONVERTER.fromJson(json)!;
        expect(result.slices.map(s => s.width)).toEqual([50, 50]);
    });

    test('scales widths that add up to more than 100', () => {
        const json = {
            slideId: VALID_SLIDE_ID,
            slices: [
                { sliceType: 'text', width: 150, text: 'a' },
                { sliceType: 'text', width: 50, text: 'b' },
            ],
        };
        const result = SLIDE_CONVERTER.fromJson(json)!;
        expect(result.slices.map(s => s.width)).toEqual([75, 25]);
    });

    test('a single slice always fills the slide', () => {
        const json = { slideId: VALID_SLIDE_ID, slices: [{ sliceType: 'image', width: 40, image: VALID_IMAGE }] };
        expect(SLIDE_CONVERTER.fromJson(json)!.slices[0].width).toBe(100);
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

    test('serializes slideId and slices', () => {
        expect(SLIDE_CONVERTER.toJson(MIXED_SLIDE)).toEqual({
            slideId: VALID_SLIDE_ID,
            slices: [
                { sliceType: 'text', width: 50, text: 'Hello **World**' },
                { sliceType: 'image', width: 30, image: VALID_IMAGE },
                { sliceType: 'qr-code', width: 20, data: 'https://example.com' },
            ],
        });
    });

    test('survives a round-trip through JSON.stringify', () => {
        const json = JSON.parse(JSON.stringify(SLIDE_CONVERTER.toJson(MIXED_SLIDE)));
        expect(SLIDE_CONVERTER.fromJson(json)).toEqual(MIXED_SLIDE);
    });
});
