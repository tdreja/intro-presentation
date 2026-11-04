import { describe, test, expect, vi } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import {
    compressSlideShowImages,
    encodeAsWebp,
    isVectorImage,
    MAX_IMAGE_WIDTH,
    mimeTypeOf,
    needsReencoding,
    targetSize,
    type ImageEncoder,
} from './ImageCompression';
import type { Base64Image } from './Image';
import type { SlideShow } from './SlideShow';
import type { AppId } from '../identifier/AppId';

const PNG = 'data:image/png;base64,iVBORw0KGgo=' as Base64Image;
const JPEG = 'data:image/jpeg;base64,/9j/4AAQ' as Base64Image;
const WEBP = 'data:image/webp;base64,UklGRg==' as Base64Image;
const SVG = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' as Base64Image;

function makeSlideShow(): SlideShow {
    return {
        id: 'show-2026-01-01-00-00-00-000' as AppId,
        timePerSlide: Temporal.Duration.from({ seconds: 10 }),
        slides: [
            {
                slideId: 'slide-2026-01-01-00-00-00-001' as AppId,
                slices: [
                    { sliceType: 'image', width: 50, image: PNG },
                    { sliceType: 'text', width: 50, text: 'Hi' },
                ],
            },
            {
                slideId: 'slide-2026-01-01-00-00-00-002' as AppId,
                slices: [
                    { sliceType: 'qr-code', width: 30, data: 'https://example.com' },
                    { sliceType: 'image', width: 70, image: SVG },
                ],
            },
        ],
    };
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

describe('mimeTypeOf', () => {
    test.each([
        [PNG, 'image/png'],
        [JPEG, 'image/jpeg'],
        [WEBP, 'image/webp'],
        [SVG, 'image/svg+xml'],
        ['data:IMAGE/PNG;base64,abc', 'image/png'],
        ['not a data url', ''],
        ['data:;base64,abc', ''],
    ])('%s → %s', (input, expected) => {
        expect(mimeTypeOf(input)).toBe(expected);
    });
});

describe('isVectorImage', () => {
    test('is true for SVG only', () => {
        expect(isVectorImage(SVG)).toBe(true);
        expect(isVectorImage(PNG)).toBe(false);
        expect(isVectorImage(WEBP)).toBe(false);
    });
});

describe('needsReencoding', () => {
    test('re-encodes non-WEBP raster images of any size', () => {
        expect(needsReencoding('image/png', 100)).toBe(true);
        expect(needsReencoding('image/jpeg', 100)).toBe(true);
        expect(needsReencoding('image/gif', 100)).toBe(true);
    });

    test('keeps WEBP images up to the maximum width', () => {
        expect(needsReencoding('image/webp', 100)).toBe(false);
        expect(needsReencoding('image/webp', MAX_IMAGE_WIDTH)).toBe(false);
    });

    test('re-encodes WEBP images wider than the maximum width', () => {
        expect(needsReencoding('image/webp', MAX_IMAGE_WIDTH + 1)).toBe(true);
    });

    test('never re-encodes SVG, however wide', () => {
        expect(needsReencoding('image/svg+xml', 10_000)).toBe(false);
    });
});

describe('targetSize', () => {
    test('keeps images up to the maximum width unchanged', () => {
        expect(targetSize(1920, 1080)).toEqual({ width: 1920, height: 1080 });
        expect(targetSize(MAX_IMAGE_WIDTH, 500)).toEqual({ width: MAX_IMAGE_WIDTH, height: 500 });
    });

    test('scales wider images down to the maximum width, keeping the aspect ratio', () => {
        expect(targetSize(4000, 3000)).toEqual({ width: 2000, height: 1500 });
    });

    test('rounds the height and never returns 0', () => {
        expect(targetSize(3000, 1001)).toEqual({ width: 2000, height: 667 });
        expect(targetSize(100_000, 1)).toEqual({ width: 2000, height: 1 });
    });

    test('accepts a custom maximum width', () => {
        expect(targetSize(1000, 500, 500)).toEqual({ width: 500, height: 250 });
    });
});

describe('encodeAsWebp', () => {
    test('returns SVGs unchanged without touching browser APIs', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        await expect(encodeAsWebp(SVG)).resolves.toBe(SVG);
        expect(fetchSpy).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    test('returns the original image when decoding fails (no canvas in node)', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        await expect(encodeAsWebp(PNG)).resolves.toBe(PNG);
        vi.restoreAllMocks();
    });
});

// ---------------------------------------------------------------------------
// compressSlideShowImages
// ---------------------------------------------------------------------------

describe('compressSlideShowImages', () => {
    test('passes every image slice to the encoder, and nothing else', async () => {
        const encode = vi.fn<ImageEncoder>(async image => image);
        await compressSlideShowImages(makeSlideShow(), encode);
        expect(encode.mock.calls.map(([image]) => image)).toEqual([PNG, SVG]);
    });

    test('returns the same object when no image changed', async () => {
        const show = makeSlideShow();
        const result = await compressSlideShowImages(show, async image => image);
        expect(result).toBe(show);
    });

    test('replaces changed images and keeps everything else', async () => {
        const show = makeSlideShow();
        const result = await compressSlideShowImages(show, async image => image === PNG ? WEBP : image);

        expect(result).not.toBe(show);
        expect(result.slides[0].slices[0]).toEqual({ sliceType: 'image', width: 50, image: WEBP });
        expect(result.slides[0].slices[1]).toBe(show.slides[0].slices[1]);
        // Unchanged slides keep their identity
        expect(result.slides[1]).toBe(show.slides[1]);
        expect(result.id).toBe(show.id);
        expect(result.timePerSlide).toBe(show.timePerSlide);
    });

    test('does not modify the input slideshow', async () => {
        const show = makeSlideShow();
        await compressSlideShowImages(show, async () => WEBP);
        expect(show.slides[0].slices[0]).toEqual({ sliceType: 'image', width: 50, image: PNG });
    });

    test('handles a slideshow without slides', async () => {
        const show = { ...makeSlideShow(), slides: [] };
        await expect(compressSlideShowImages(show, async () => WEBP)).resolves.toBe(show);
    });
});
