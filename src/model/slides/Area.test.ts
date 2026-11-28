import { describe, test, expect } from 'vitest';
import {
    defaultVerticalAlign,
    AREA_CONVERTER,
    type Area,
    TEXT_ALIGNS,
    textAlignOf,
    type TextArea,
    VERTICAL_ALIGNS,
    verticalAlignOf,
} from './Area';
import { PLACEHOLDER_IMAGE } from './Image';

const BOUNDS = { left: 100, top: 50, width: 400, height: 300 };

const IMAGE_AREA: Area = { areaType: 'image', ...BOUNDS, image: PLACEHOLDER_IMAGE };
const TEXT_AREA: Area = { areaType: 'text', ...BOUNDS, text: '# Title' };
const QR_AREA: Area = { areaType: 'qr-code', ...BOUNDS, data: 'https://example.com' };

// ---------------------------------------------------------------------------
// AREA_CONVERTER.fromJson
// ---------------------------------------------------------------------------

describe('AREA_CONVERTER.fromJson — valid input', () => {
    test.each([IMAGE_AREA, TEXT_AREA, QR_AREA])('reads a $areaType area', (area) => {
        expect(AREA_CONVERTER.fromJson(area)).toEqual(area);
    });

    test('accepts non-integer bounds', () => {
        const bounds = { left: 0.5, top: 1.25, width: 33.3, height: 66.6 };
        expect(AREA_CONVERTER.fromJson({ ...TEXT_AREA, ...bounds })).toEqual({ ...TEXT_AREA, ...bounds });
    });

    test('accepts negative positions, e.g. an area sticking out of the slide', () => {
        expect(AREA_CONVERTER.fromJson({ ...TEXT_AREA, left: -20, top: -10 })).toEqual({ ...TEXT_AREA, left: -20, top: -10 });
    });

    test('accepts empty markdown text', () => {
        expect(AREA_CONVERTER.fromJson({ ...TEXT_AREA, text: '' })).toEqual({ ...TEXT_AREA, text: '' });
    });

    test('accepts any base64 image type, e.g. webp and png', () => {
        const webp = 'data:image/webp;base64,UklGRg==';
        const png = 'data:image/png;base64,iVBORw0KGgo=';
        expect(AREA_CONVERTER.fromJson({ areaType: 'image', ...BOUNDS, image: webp })).not.toBeNull();
        expect(AREA_CONVERTER.fromJson({ areaType: 'image', ...BOUNDS, image: png })).not.toBeNull();
    });

    test('drops unknown extra fields', () => {
        expect(AREA_CONVERTER.fromJson({ ...QR_AREA, corner: 'top-left' })).toEqual(QR_AREA);
    });
});

describe('AREA_CONVERTER.fromJson — invalid input', () => {
    test.each([null, undefined, 'image', 5])('returns null for %s', (json) => {
        expect(AREA_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null for an unknown areaType', () => {
        expect(AREA_CONVERTER.fromJson({ areaType: 'video', ...BOUNDS })).toBeNull();
    });

    test('returns null when areaType is missing', () => {
        expect(AREA_CONVERTER.fromJson({ ...BOUNDS, text: 'x' })).toBeNull();
    });

    test.each(['width', 'height'])('returns null for a %s that is not positive', (field) => {
        for (const value of [undefined, null, '50', 0, -10, Number.NaN, Number.POSITIVE_INFINITY]) {
            expect(AREA_CONVERTER.fromJson({ ...TEXT_AREA, [field]: value })).toBeNull();
        }
    });

    test.each(['left', 'top'])('returns null for a missing or non-numeric %s', (field) => {
        for (const value of [undefined, null, '50', Number.NaN, Number.NEGATIVE_INFINITY]) {
            expect(AREA_CONVERTER.fromJson({ ...TEXT_AREA, [field]: value })).toBeNull();
        }
    });

    test('returns null for a slice of the previous format, which only had a percent width', () => {
        expect(AREA_CONVERTER.fromJson({ sliceType: 'text', width: 50, text: 'x' })).toBeNull();
    });

    test('returns null for an image area without an image', () => {
        expect(AREA_CONVERTER.fromJson({ areaType: 'image', ...BOUNDS })).toBeNull();
    });

    test('returns null for an image area with a non data-URL image', () => {
        expect(AREA_CONVERTER.fromJson({ areaType: 'image', ...BOUNDS, image: 'https://example.com/a.png' })).toBeNull();
    });

    test('returns null for a text area without text', () => {
        expect(AREA_CONVERTER.fromJson({ areaType: 'text', ...BOUNDS })).toBeNull();
    });

    test('returns null for a qr-code area without data', () => {
        expect(AREA_CONVERTER.fromJson({ areaType: 'qr-code', ...BOUNDS })).toBeNull();
    });

    test('returns null for a qr-code area with empty data', () => {
        expect(AREA_CONVERTER.fromJson({ areaType: 'qr-code', ...BOUNDS, data: '' })).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// AREA_CONVERTER.toJson
// ---------------------------------------------------------------------------

describe('AREA_CONVERTER.toJson', () => {
    test('returns null for null and undefined', () => {
        expect(AREA_CONVERTER.toJson(null)).toBeNull();
        expect(AREA_CONVERTER.toJson(undefined)).toBeNull();
    });

    test('writes the bounds', () => {
        expect(AREA_CONVERTER.toJson(QR_AREA)).toMatchObject(BOUNDS);
    });

    test.each([IMAGE_AREA, TEXT_AREA, QR_AREA])('round-trips a $areaType area', (area) => {
        const json = JSON.parse(JSON.stringify(AREA_CONVERTER.toJson(area)));
        expect(AREA_CONVERTER.fromJson(json)).toEqual(area);
    });

    test('leaves out verticalAlign when it is not set', () => {
        expect(AREA_CONVERTER.toJson(TEXT_AREA)).not.toHaveProperty('verticalAlign');
    });

    test.each(VERTICAL_ALIGNS)('round-trips verticalAlign %s', (verticalAlign) => {
        const area: Area = { ...QR_AREA, verticalAlign };
        const json = JSON.parse(JSON.stringify(AREA_CONVERTER.toJson(area)));
        expect(json.verticalAlign).toBe(verticalAlign);
        expect(AREA_CONVERTER.fromJson(json)).toEqual(area);
    });
});

// ---------------------------------------------------------------------------
// Vertical alignment
// ---------------------------------------------------------------------------

describe('vertical alignment', () => {
    test('text defaults to top, image and QR code to middle', () => {
        expect(defaultVerticalAlign('text')).toBe('top');
        expect(defaultVerticalAlign('image')).toBe('middle');
        expect(defaultVerticalAlign('qr-code')).toBe('middle');
    });

    test('verticalAlignOf falls back to the default of the type', () => {
        expect(verticalAlignOf(TEXT_AREA)).toBe('top');
        expect(verticalAlignOf(IMAGE_AREA)).toBe('middle');
        expect(verticalAlignOf({ ...TEXT_AREA, verticalAlign: 'bottom' })).toBe('bottom');
    });

    test.each(VERTICAL_ALIGNS)('fromJson reads verticalAlign %s', (verticalAlign) => {
        expect(AREA_CONVERTER.fromJson({ ...IMAGE_AREA, verticalAlign })!.verticalAlign).toBe(verticalAlign);
    });

    test.each(['center', 'TOP', 5, null])('fromJson drops the invalid verticalAlign %s', (verticalAlign) => {
        const area = AREA_CONVERTER.fromJson({ ...TEXT_AREA, verticalAlign });
        expect(area).toEqual(TEXT_AREA);
        expect(area).not.toHaveProperty('verticalAlign');
    });
});

// ---------------------------------------------------------------------------
// Text alignment
// ---------------------------------------------------------------------------

describe('text alignment', () => {
    const textArea: TextArea = { areaType: 'text', ...BOUNDS, text: '# Title' };

    test('textAlignOf defaults to left', () => {
        expect(textAlignOf(textArea)).toBe('left');
        expect(textAlignOf({ ...textArea, textAlign: 'right' })).toBe('right');
    });

    test('leaves out textAlign when it is not set', () => {
        expect(AREA_CONVERTER.toJson(textArea)).not.toHaveProperty('textAlign');
    });

    test.each(TEXT_ALIGNS)('round-trips textAlign %s', (textAlign) => {
        const area: Area = { ...textArea, textAlign };
        const json = JSON.parse(JSON.stringify(AREA_CONVERTER.toJson(area)));
        expect(json.textAlign).toBe(textAlign);
        expect(AREA_CONVERTER.fromJson(json)).toEqual(area);
    });

    test.each(['middle', 'LEFT', 5, null])('fromJson drops the invalid textAlign %s', (textAlign) => {
        const area = AREA_CONVERTER.fromJson({ ...textArea, textAlign });
        expect(area).toEqual(textArea);
        expect(area).not.toHaveProperty('textAlign');
    });

    test('other area types ignore textAlign', () => {
        expect(AREA_CONVERTER.fromJson({ ...QR_AREA, textAlign: 'center' })).toEqual(QR_AREA);
    });
});
