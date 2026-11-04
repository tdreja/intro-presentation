import { describe, test, expect } from 'vitest';
import { scaleSliceWidths, SLICE_CONVERTER, type Slice } from './Slice';
import { PLACEHOLDER_IMAGE } from './Image';

const IMAGE_SLICE: Slice = { sliceType: 'image', width: 40, image: PLACEHOLDER_IMAGE };
const TEXT_SLICE: Slice = { sliceType: 'text', width: 40, text: '# Title' };
const QR_SLICE: Slice = { sliceType: 'qr-code', width: 20, data: 'https://example.com' };

// ---------------------------------------------------------------------------
// SLICE_CONVERTER.fromJson
// ---------------------------------------------------------------------------

describe('SLICE_CONVERTER.fromJson — valid input', () => {
    test.each([IMAGE_SLICE, TEXT_SLICE, QR_SLICE])('reads a $sliceType slice', (slice) => {
        expect(SLICE_CONVERTER.fromJson(slice)).toEqual(slice);
    });

    test('accepts a non-integer width', () => {
        expect(SLICE_CONVERTER.fromJson({ ...TEXT_SLICE, width: 33.3 })!.width).toBe(33.3);
    });

    test('accepts empty markdown text', () => {
        expect(SLICE_CONVERTER.fromJson({ ...TEXT_SLICE, text: '' })).toEqual({ ...TEXT_SLICE, text: '' });
    });

    test('accepts any base64 image type, e.g. webp and png', () => {
        const webp = 'data:image/webp;base64,UklGRg==';
        const png = 'data:image/png;base64,iVBORw0KGgo=';
        expect(SLICE_CONVERTER.fromJson({ sliceType: 'image', width: 10, image: webp })).not.toBeNull();
        expect(SLICE_CONVERTER.fromJson({ sliceType: 'image', width: 10, image: png })).not.toBeNull();
    });

    test('drops unknown extra fields', () => {
        expect(SLICE_CONVERTER.fromJson({ ...QR_SLICE, corner: 'top-left' })).toEqual(QR_SLICE);
    });
});

describe('SLICE_CONVERTER.fromJson — invalid input', () => {
    test.each([null, undefined, 'image', 5])('returns null for %s', (json) => {
        expect(SLICE_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null for an unknown sliceType', () => {
        expect(SLICE_CONVERTER.fromJson({ sliceType: 'video', width: 10 })).toBeNull();
    });

    test('returns null when sliceType is missing', () => {
        expect(SLICE_CONVERTER.fromJson({ width: 10, text: 'x' })).toBeNull();
    });

    test.each([undefined, null, '50', 0, -10, Number.NaN, Number.POSITIVE_INFINITY])(
        'returns null for width %s',
        (width) => {
            expect(SLICE_CONVERTER.fromJson({ ...TEXT_SLICE, width })).toBeNull();
        },
    );

    test('returns null for an image slice without an image', () => {
        expect(SLICE_CONVERTER.fromJson({ sliceType: 'image', width: 10 })).toBeNull();
    });

    test('returns null for an image slice with a non data-URL image', () => {
        expect(SLICE_CONVERTER.fromJson({ sliceType: 'image', width: 10, image: 'https://example.com/a.png' })).toBeNull();
    });

    test('returns null for a text slice without text', () => {
        expect(SLICE_CONVERTER.fromJson({ sliceType: 'text', width: 10 })).toBeNull();
    });

    test('returns null for a qr-code slice without data', () => {
        expect(SLICE_CONVERTER.fromJson({ sliceType: 'qr-code', width: 10 })).toBeNull();
    });

    test('returns null for a qr-code slice with empty data', () => {
        expect(SLICE_CONVERTER.fromJson({ sliceType: 'qr-code', width: 10, data: '' })).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// SLICE_CONVERTER.toJson
// ---------------------------------------------------------------------------

describe('SLICE_CONVERTER.toJson', () => {
    test('returns null for null and undefined', () => {
        expect(SLICE_CONVERTER.toJson(null)).toBeNull();
        expect(SLICE_CONVERTER.toJson(undefined)).toBeNull();
    });

    test.each([IMAGE_SLICE, TEXT_SLICE, QR_SLICE])('round-trips a $sliceType slice', (slice) => {
        const json = JSON.parse(JSON.stringify(SLICE_CONVERTER.toJson(slice)));
        expect(SLICE_CONVERTER.fromJson(json)).toEqual(slice);
    });
});

// ---------------------------------------------------------------------------
// scaleSliceWidths
// ---------------------------------------------------------------------------

describe('scaleSliceWidths', () => {
    test('returns the same array when widths already add up to 100', () => {
        const slices = [IMAGE_SLICE, TEXT_SLICE, QR_SLICE];
        expect(scaleSliceWidths(slices)).toBe(slices);
    });

    test('scales proportionally to 100', () => {
        const result = scaleSliceWidths([{ ...TEXT_SLICE, width: 1 }, { ...QR_SLICE, width: 3 }]);
        expect(result.map(s => s.width)).toEqual([25, 75]);
    });

    test('keeps every other field of the slices', () => {
        const [result] = scaleSliceWidths([{ ...TEXT_SLICE, width: 50 }]);
        expect(result).toEqual({ ...TEXT_SLICE, width: 100 });
    });

    test('scaled widths add up to 100 (within floating point tolerance)', () => {
        const result = scaleSliceWidths([1, 1, 1].map(width => ({ ...TEXT_SLICE, width })));
        expect(result.reduce((sum, s) => sum + s.width, 0)).toBeCloseTo(100);
    });

    test('returns an empty array unchanged', () => {
        expect(scaleSliceWidths([])).toEqual([]);
    });
});
