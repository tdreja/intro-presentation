import { describe, test, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { createSlideId, SLIDE_CONVERTER, type FullImageSlide, type HalfTextHalfImageSlide } from './Slide';
import type { AppId } from '../identifier/AppId';
import { PLACEHOLDER_IMAGE } from './Image';

const VALID_SLIDE_ID = 'slide-2026-08-18-10-00-00-000' as AppId;
const VALID_IMAGE = PLACEHOLDER_IMAGE;

const FULL_IMAGE_SLIDE: FullImageSlide = {
    slideId: VALID_SLIDE_ID,
    slideType: 'full-image',
    image: VALID_IMAGE,
};

const FULL_IMAGE_SLIDE_WITH_HEADLINE: FullImageSlide = {
    ...FULL_IMAGE_SLIDE,
    headline: 'My Headline',
};

const FULL_IMAGE_SLIDE_WITH_QR: FullImageSlide = {
    ...FULL_IMAGE_SLIDE,
    qrCode: 'https://example.com/qr',
};

const HALF_TEXT_SLIDE: HalfTextHalfImageSlide = {
    slideId: VALID_SLIDE_ID,
    slideType: 'half-text-half-image',
    text: 'Hello **World**',
    image: VALID_IMAGE,
    layout: 'half-half',
};

// ---------------------------------------------------------------------------
// createSlideId
// ---------------------------------------------------------------------------

describe('createSlideId', () => {
    const APP_ID_REGEX = /^[a-zA-Z]+-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-\d{3}$/;

    test('returns a string matching the slide-YYYY-MM-DD-HH-mm-ss-mmm pattern', () => {
        const id = createSlideId();
        expect(id).toMatch(/^slide-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-\d{3}$/);
    });

    test('uses the supplied PlainDateTime when provided', () => {
        const date = Temporal.PlainDateTime.from('2026-03-15T12:34:56.789');
        const id = createSlideId(date);
        expect(id).toBe('slide-2026-03-15-12-34-56-789');
    });

    test('returns a valid AppId pattern', () => {
        const id = createSlideId();
        expect(id).toMatch(APP_ID_REGEX);
    });
});

// ---------------------------------------------------------------------------
// SLIDE_CONVERTER.fromJson — null / invalid guards
// ---------------------------------------------------------------------------

describe('SLIDE_CONVERTER.fromJson — null / invalid guards', () => {
    test('returns null for null', () => {
        expect(SLIDE_CONVERTER.fromJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(SLIDE_CONVERTER.fromJson(undefined)).toBeNull();
    });

    test('returns null when slideType is missing', () => {
        const json = { slideId: VALID_SLIDE_ID, image: VALID_IMAGE } as never;
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when slideId is missing', () => {
        const json = { slideType: 'full-image', image: VALID_IMAGE } as never;
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when slideId has an invalid format', () => {
        const json = { slideId: 'not-a-valid-id', slideType: 'full-image', image: VALID_IMAGE } as never;
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null for an unknown slideType', () => {
        const json = { slideId: VALID_SLIDE_ID, slideType: 'unknown-type', image: VALID_IMAGE } as never;
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// SLIDE_CONVERTER.fromJson — full-image
// ---------------------------------------------------------------------------

describe('SLIDE_CONVERTER.fromJson — full-image', () => {
    const validJson = {
        slideId: VALID_SLIDE_ID,
        slideType: 'full-image' as const,
        image: VALID_IMAGE,
    };

    test('returns a FullImageSlide for valid JSON', () => {
        const result = SLIDE_CONVERTER.fromJson(validJson);
        expect(result).not.toBeNull();
    });

    test('slideType is full-image', () => {
        const result = SLIDE_CONVERTER.fromJson(validJson)!;
        expect(result.slideType).toBe('full-image');
    });

    test('slideId matches the input', () => {
        const result = SLIDE_CONVERTER.fromJson(validJson)!;
        expect(result.slideId).toBe(VALID_SLIDE_ID);
    });

    test('image matches the input', () => {
        const result = SLIDE_CONVERTER.fromJson(validJson) as FullImageSlide;
        expect(result.image).toBe(VALID_IMAGE);
    });

    test('headline is set when provided', () => {
        const json = { ...validJson, headline: 'My Headline' };
        const result = SLIDE_CONVERTER.fromJson(json)!;
        expect(result.headline).toBe('My Headline');
    });

    test('headline is undefined when omitted', () => {
        const result = SLIDE_CONVERTER.fromJson(validJson)!;
        expect(result.headline).toBeUndefined();
    });

    test('qrCode is set when provided', () => {
        const json = { ...validJson, qrCode: 'https://example.com/qr' };
        const result = SLIDE_CONVERTER.fromJson(json)!;
        expect(result.qrCode).toBe('https://example.com/qr');
    });

    test('qrCode is undefined when omitted', () => {
        const result = SLIDE_CONVERTER.fromJson(validJson)!;
        expect(result.qrCode).toBeUndefined();
    });

    test('returns null when image is missing', () => {
        const json = { slideId: VALID_SLIDE_ID, slideType: 'full-image' as const } as never;
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when image has an invalid format', () => {
        const json = { slideId: VALID_SLIDE_ID, slideType: 'full-image' as const, image: 'not-a-base64-image' } as never;
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// SLIDE_CONVERTER.fromJson — half-text-half-image
// ---------------------------------------------------------------------------

describe('SLIDE_CONVERTER.fromJson — half-text-half-image', () => {
    const validJson = {
        slideId: VALID_SLIDE_ID,
        slideType: 'half-text-half-image' as const,
        text: 'Hello **World**',
        image: VALID_IMAGE,
        layout: 'half-half' as const,
    };

    test('returns a HalfTextHalfImageSlide for valid JSON', () => {
        const result = SLIDE_CONVERTER.fromJson(validJson);
        expect(result).not.toBeNull();
    });

    test('slideType is half-text-half-image', () => {
        const result = SLIDE_CONVERTER.fromJson(validJson)!;
        expect(result.slideType).toBe('half-text-half-image');
    });

    test('text, image, and layout are set correctly', () => {
        const result = SLIDE_CONVERTER.fromJson(validJson) as HalfTextHalfImageSlide;
        expect(result.text).toBe('Hello **World**');
        expect(result.image).toBe(VALID_IMAGE);
        expect(result.layout).toBe('half-half');
    });

    test('headline is set when provided', () => {
        const json = { ...validJson, headline: 'Section Title' };
        const result = SLIDE_CONVERTER.fromJson(json)!;
        expect(result.headline).toBe('Section Title');
    });

    test('returns null when image is missing', () => {
        const { slideId, slideType, text, layout } = validJson;
        expect(SLIDE_CONVERTER.fromJson({ slideId, slideType, text, layout } as never)).toBeNull();
    });

    test('returns null when text is missing', () => {
        const { slideId, slideType, image, layout } = validJson;
        expect(SLIDE_CONVERTER.fromJson({ slideId, slideType, image, layout } as never)).toBeNull();
    });

    test('returns null when layout is missing', () => {
        const { slideId, slideType, text, image } = validJson;
        expect(SLIDE_CONVERTER.fromJson({ slideId, slideType, text, image } as never)).toBeNull();
    });

    test.each(['half-half', 'one-third-left', 'one-third-right'] as const)(
        'all SlideLayout values round-trip correctly: %s',
        (layout) => {
            const json = { ...validJson, layout };
            const result = SLIDE_CONVERTER.fromJson(json) as HalfTextHalfImageSlide;
            expect(result).not.toBeNull();
            expect(result.layout).toBe(layout);
        },
    );
});

// ---------------------------------------------------------------------------
// SLIDE_CONVERTER.toJson — null guards
// ---------------------------------------------------------------------------

describe('SLIDE_CONVERTER.toJson — null guards', () => {
    test('returns null for null', () => {
        expect(SLIDE_CONVERTER.toJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(SLIDE_CONVERTER.toJson(undefined)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// SLIDE_CONVERTER.toJson — full-image
// ---------------------------------------------------------------------------

describe('SLIDE_CONVERTER.toJson — full-image', () => {
    test('serializes slideId, slideType, and image correctly', () => {
        const result = SLIDE_CONVERTER.toJson(FULL_IMAGE_SLIDE)!;
        expect(result.slideId).toBe(VALID_SLIDE_ID);
        expect(result.slideType).toBe('full-image');
        expect(result.image).toBe(VALID_IMAGE);
    });

    test('includes headline when set', () => {
        const result = SLIDE_CONVERTER.toJson(FULL_IMAGE_SLIDE_WITH_HEADLINE)!;
        expect(result.headline).toBe('My Headline');
    });

    test('headline is undefined when not set on the slide', () => {
        const result = SLIDE_CONVERTER.toJson(FULL_IMAGE_SLIDE)!;
        expect(result.headline).toBeUndefined();
    });

    test('includes qrCode when set', () => {
        const result = SLIDE_CONVERTER.toJson(FULL_IMAGE_SLIDE_WITH_QR)!;
        expect(result.qrCode).toBe('https://example.com/qr');
    });

    test('qrCode is undefined when not set on the slide', () => {
        const result = SLIDE_CONVERTER.toJson(FULL_IMAGE_SLIDE)!;
        expect(result.qrCode).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// SLIDE_CONVERTER.toJson — half-text-half-image
// ---------------------------------------------------------------------------

describe('SLIDE_CONVERTER.toJson — half-text-half-image', () => {
    test('serializes all fields correctly', () => {
        const result = SLIDE_CONVERTER.toJson(HALF_TEXT_SLIDE)!;
        expect(result.slideId).toBe(VALID_SLIDE_ID);
        expect(result.slideType).toBe('half-text-half-image');
        expect(result.text).toBe('Hello **World**');
        expect(result.image).toBe(VALID_IMAGE);
        expect(result.layout).toBe('half-half');
    });

    test('includes headline when set', () => {
        const slide: HalfTextHalfImageSlide = { ...HALF_TEXT_SLIDE, headline: 'Section' };
        const result = SLIDE_CONVERTER.toJson(slide)!;
        expect(result.headline).toBe('Section');
    });
});

// ---------------------------------------------------------------------------
// Round-trip: fromJson ∘ toJson
// ---------------------------------------------------------------------------

describe('SLIDE_CONVERTER round-trip', () => {
    test('FullImageSlide survives a full round-trip', () => {
        const json = SLIDE_CONVERTER.toJson(FULL_IMAGE_SLIDE_WITH_HEADLINE)!;
        const result = SLIDE_CONVERTER.fromJson(json);
        expect(result).toEqual(FULL_IMAGE_SLIDE_WITH_HEADLINE);
    });

    test('FullImageSlide with qrCode survives a full round-trip', () => {
        const json = SLIDE_CONVERTER.toJson(FULL_IMAGE_SLIDE_WITH_QR)!;
        const result = SLIDE_CONVERTER.fromJson(json);
        expect(result).toEqual(FULL_IMAGE_SLIDE_WITH_QR);
    });

    test('HalfTextHalfImageSlide survives a full round-trip', () => {
        const slideWithHeadline: HalfTextHalfImageSlide = { ...HALF_TEXT_SLIDE, headline: 'Title' };
        const json = SLIDE_CONVERTER.toJson(slideWithHeadline)!;
        const result = SLIDE_CONVERTER.fromJson(json);
        expect(result).toEqual(slideWithHeadline);
    });
});
