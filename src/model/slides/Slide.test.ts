import { describe, test, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import {
    createSlideId,
    getImageFromSection,
    getTextFromSection,
    SLIDE_CONVERTER,
    SLIDE_SECTION_CONVERTER,
    type ImageSlideSection,
    type Slide,
    type TextSlideSection,
} from './Slide';
import type { AppId } from '../identifier/AppId';
import { PLACEHOLDER_IMAGE } from './Image';
import type { QrCode } from './QrCode';

const VALID_SLIDE_ID = 'slide-2026-08-18-10-00-00-000' as AppId;
const VALID_IMAGE = PLACEHOLDER_IMAGE;

const IMAGE_SECTION: ImageSlideSection = {
    widthPercent: 100,
    image: VALID_IMAGE,
};

const TEXT_SECTION: TextSlideSection = {
    widthPercent: 50,
    text: 'Hello **World**',
};

const IMAGE_SLIDE: Slide = {
    slideId: VALID_SLIDE_ID,
    sections: [IMAGE_SECTION],
};

const IMAGE_SLIDE_WITH_HEADLINE: Slide = {
    ...IMAGE_SLIDE,
    headline: 'My Headline',
};

const IMAGE_SLIDE_WITH_QR: Slide = {
    ...IMAGE_SLIDE,
    qrCode: { data: 'https://example.com/qr', corner: 'top-right' } satisfies QrCode,
};

const SECOND_IMAGE_SECTION: ImageSlideSection = { widthPercent: 50, image: VALID_IMAGE };

const MULTI_SECTION_SLIDE: Slide = {
    slideId: VALID_SLIDE_ID,
    sections: [TEXT_SECTION, SECOND_IMAGE_SECTION],
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
// getImageFromSection / getTextFromSection
// ---------------------------------------------------------------------------

describe('getImageFromSection', () => {
    test('returns null for null/undefined section', () => {
        expect(getImageFromSection(null)).toBeNull();
        expect(getImageFromSection(undefined)).toBeNull();
    });

    test('returns the image for an image section', () => {
        expect(getImageFromSection(IMAGE_SECTION)).toBe(VALID_IMAGE);
    });

    test('returns null for a text section', () => {
        expect(getImageFromSection(TEXT_SECTION)).toBeNull();
    });
});

describe('getTextFromSection', () => {
    test('returns null for null/undefined section', () => {
        expect(getTextFromSection(null)).toBeNull();
        expect(getTextFromSection(undefined)).toBeNull();
    });

    test('returns the text for a text section', () => {
        expect(getTextFromSection(TEXT_SECTION)).toBe('Hello **World**');
    });

    test('returns null for an image section', () => {
        expect(getTextFromSection(IMAGE_SECTION)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// SLIDE_SECTION_CONVERTER.fromJson
// ---------------------------------------------------------------------------

describe('SLIDE_SECTION_CONVERTER.fromJson', () => {
    test('returns null for null', () => {
        expect(SLIDE_SECTION_CONVERTER.fromJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(SLIDE_SECTION_CONVERTER.fromJson(undefined)).toBeNull();
    });

    test('returns an ImageSlideSection for valid image JSON', () => {
        const result = SLIDE_SECTION_CONVERTER.fromJson({ widthPercent: 100, image: VALID_IMAGE });
        expect(result).toEqual(IMAGE_SECTION);
    });

    test('returns a TextSlideSection for valid text JSON', () => {
        const result = SLIDE_SECTION_CONVERTER.fromJson({ widthPercent: 50, text: 'Hello **World**' });
        expect(result).toEqual(TEXT_SECTION);
    });

    test('returns null when widthPercent is missing', () => {
        expect(SLIDE_SECTION_CONVERTER.fromJson({ image: VALID_IMAGE } as never)).toBeNull();
    });

    test('returns null when widthPercent is not a number', () => {
        expect(SLIDE_SECTION_CONVERTER.fromJson({ widthPercent: '100', image: VALID_IMAGE } as never)).toBeNull();
    });

    test('returns null when widthPercent is 0', () => {
        expect(SLIDE_SECTION_CONVERTER.fromJson({ widthPercent: 0, image: VALID_IMAGE })).toBeNull();
    });

    test('returns null when widthPercent is negative', () => {
        expect(SLIDE_SECTION_CONVERTER.fromJson({ widthPercent: -10, image: VALID_IMAGE })).toBeNull();
    });

    test('returns null when widthPercent is greater than 100', () => {
        expect(SLIDE_SECTION_CONVERTER.fromJson({ widthPercent: 101, image: VALID_IMAGE })).toBeNull();
    });

    test('returns null when neither image nor text is present', () => {
        expect(SLIDE_SECTION_CONVERTER.fromJson({ widthPercent: 100 })).toBeNull();
    });

    test('returns null when image has an invalid format', () => {
        expect(SLIDE_SECTION_CONVERTER.fromJson({ widthPercent: 100, image: 'not-a-base64-image' } as never)).toBeNull();
    });

    test('prefers the image when both image and text are present', () => {
        const result = SLIDE_SECTION_CONVERTER.fromJson({ widthPercent: 100, image: VALID_IMAGE, text: 'ignored' });
        expect(getImageFromSection(result)).toBe(VALID_IMAGE);
        expect(getTextFromSection(result)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// SLIDE_SECTION_CONVERTER.toJson
// ---------------------------------------------------------------------------

describe('SLIDE_SECTION_CONVERTER.toJson', () => {
    test('returns null for null', () => {
        expect(SLIDE_SECTION_CONVERTER.toJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(SLIDE_SECTION_CONVERTER.toJson(undefined)).toBeNull();
    });

    test('serializes an image section', () => {
        const result = SLIDE_SECTION_CONVERTER.toJson(IMAGE_SECTION)!;
        expect(result.widthPercent).toBe(100);
        expect(result.image).toBe(VALID_IMAGE);
    });

    test('serializes a text section', () => {
        const result = SLIDE_SECTION_CONVERTER.toJson(TEXT_SECTION)!;
        expect(result.widthPercent).toBe(50);
        expect(result.text).toBe('Hello **World**');
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

    test('returns null when slideId is missing', () => {
        const json = { sections: [IMAGE_SECTION] } as never;
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when slideId has an invalid format', () => {
        const json = { slideId: 'not-a-valid-id', sections: [IMAGE_SECTION] } as never;
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when sections is missing', () => {
        const json = { slideId: VALID_SLIDE_ID } as never;
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when sections is null', () => {
        const json = { slideId: VALID_SLIDE_ID, sections: null } as never;
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when sections contains an invalid section', () => {
        const json = { slideId: VALID_SLIDE_ID, sections: [{ widthPercent: 100 }] } as never;
        expect(SLIDE_CONVERTER.fromJson(json)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// SLIDE_CONVERTER.fromJson — valid inputs
// ---------------------------------------------------------------------------

describe('SLIDE_CONVERTER.fromJson — valid inputs', () => {
    const validJson = {
        slideId: VALID_SLIDE_ID,
        sections: [IMAGE_SECTION],
    };

    test('returns a Slide for valid JSON', () => {
        const result = SLIDE_CONVERTER.fromJson(validJson);
        expect(result).not.toBeNull();
    });

    test('slideId matches the input', () => {
        const result = SLIDE_CONVERTER.fromJson(validJson)!;
        expect(result.slideId).toBe(VALID_SLIDE_ID);
    });

    test('sections match the input', () => {
        const result = SLIDE_CONVERTER.fromJson(validJson)!;
        expect(result.sections).toEqual([IMAGE_SECTION]);
    });

    test('empty sections array is preserved', () => {
        const json = { slideId: VALID_SLIDE_ID, sections: [] };
        const result = SLIDE_CONVERTER.fromJson(json)!;
        expect(result.sections).toEqual([]);
    });

    test('multiple sections are preserved in order', () => {
        const json = {
            slideId: VALID_SLIDE_ID,
            sections: [
                { widthPercent: 50, text: 'Hello **World**' },
                { widthPercent: 50, image: VALID_IMAGE },
            ],
        };
        const result = SLIDE_CONVERTER.fromJson(json)!;
        expect(result.sections).toEqual(MULTI_SECTION_SLIDE.sections);
    });

    test('headline is set when provided', () => {
        const json = { ...validJson, headline: 'My Headline' };
        const result = SLIDE_CONVERTER.fromJson(json)!;
        expect(result.headline).toBe('My Headline');
    });

    test('headline is null when omitted', () => {
        const result = SLIDE_CONVERTER.fromJson(validJson)!;
        expect(result.headline).toBeNull();
    });

    test('qrCode is set when provided', () => {
        const json = { ...validJson, qrCode: { data: 'https://example.com/qr', corner: 'top-right' } };
        const result = SLIDE_CONVERTER.fromJson(json)!;
        expect(result.qrCode).toEqual({ data: 'https://example.com/qr', corner: 'top-right' });
    });

    test('qrCode is null when omitted', () => {
        const result = SLIDE_CONVERTER.fromJson(validJson)!;
        expect(result.qrCode).toBeNull();
    });
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
// SLIDE_CONVERTER.toJson — valid inputs
// ---------------------------------------------------------------------------

describe('SLIDE_CONVERTER.toJson — valid inputs', () => {
    test('serializes slideId and sections correctly', () => {
        const result = SLIDE_CONVERTER.toJson(IMAGE_SLIDE)!;
        expect(result.slideId).toBe(VALID_SLIDE_ID);
        expect(result.sections).toEqual([IMAGE_SECTION]);
    });

    test('includes headline when set', () => {
        const result = SLIDE_CONVERTER.toJson(IMAGE_SLIDE_WITH_HEADLINE)!;
        expect(result.headline).toBe('My Headline');
    });

    test('headline is null when not set on the slide', () => {
        const result = SLIDE_CONVERTER.toJson(IMAGE_SLIDE)!;
        expect(result.headline).toBeNull();
    });

    test('includes qrCode when set', () => {
        const result = SLIDE_CONVERTER.toJson(IMAGE_SLIDE_WITH_QR)!;
        expect(result.qrCode).toEqual({ data: 'https://example.com/qr', corner: 'top-right' });
    });

    test('qrCode is null when not set on the slide', () => {
        const result = SLIDE_CONVERTER.toJson(IMAGE_SLIDE)!;
        expect(result.qrCode).toBeNull();
    });

    test('serializes multiple sections', () => {
        const result = SLIDE_CONVERTER.toJson(MULTI_SECTION_SLIDE)!;
        expect(result.sections).toHaveLength(2);
    });
});

// ---------------------------------------------------------------------------
// Round-trip: fromJson ∘ toJson
// ---------------------------------------------------------------------------

describe('SLIDE_CONVERTER round-trip', () => {
    test('image-only Slide survives a full round-trip', () => {
        const json = SLIDE_CONVERTER.toJson(IMAGE_SLIDE_WITH_HEADLINE)!;
        const result = SLIDE_CONVERTER.fromJson(json);
        expect(result).toEqual({ ...IMAGE_SLIDE_WITH_HEADLINE, qrCode: null });
    });

    test('Slide with qrCode survives a full round-trip', () => {
        const json = SLIDE_CONVERTER.toJson(IMAGE_SLIDE_WITH_QR)!;
        const result = SLIDE_CONVERTER.fromJson(json);
        expect(result).toEqual({ ...IMAGE_SLIDE_WITH_QR, headline: null });
    });

    test('multi-section Slide survives a full round-trip', () => {
        const slideWithHeadline: Slide = { ...MULTI_SECTION_SLIDE, headline: 'Title' };
        const json = SLIDE_CONVERTER.toJson(slideWithHeadline)!;
        const result = SLIDE_CONVERTER.fromJson(json);
        expect(result).toEqual({ ...slideWithHeadline, qrCode: null });
    });
});
