import type { Base64Image } from './Image.ts';
import type { Slide } from './Slide.ts';
import type { Slice } from './Slice.ts';
import type { SlideShow } from './SlideShow.ts';

/**
 * Images wider than this are scaled down when re-encoded.
 */
export const MAX_IMAGE_WIDTH = 2000;

/**
 * WEBP quality (0..1) used when re-encoding images.
 */
export const WEBP_QUALITY = 0.85;

/**
 * Re-encodes a single image, returning the original if nothing needs to change.
 */
export type ImageEncoder = (image: Base64Image) => Promise<Base64Image>;

/**
 * MIME type of a data URL, e.g. 'image/png' for 'data:image/png;base64,...'
 */
export function mimeTypeOf(image: string): string {
    const end = image.indexOf(';');
    return image.startsWith('data:') && end > 5 ? image.substring(5, end).toLowerCase() : '';
}

/**
 * SVGs stay as they are: they are already small and lose quality when rasterized.
 */
export function isVectorImage(image: string): boolean {
    return mimeTypeOf(image) === 'image/svg+xml';
}

/**
 * Whether an image of the given format and width has to be re-encoded.
 */
export function needsReencoding(mimeType: string, width: number, maxWidth: number = MAX_IMAGE_WIDTH): boolean {
    if (mimeType === 'image/svg+xml') {
        return false;
    }
    return mimeType !== 'image/webp' || width > maxWidth;
}

/**
 * Size to scale an image to, keeping its aspect ratio and never scaling up.
 */
export function targetSize(width: number, height: number, maxWidth: number = MAX_IMAGE_WIDTH): { width: number, height: number } {
    if (width <= maxWidth) {
        return { width, height };
    }
    return { width: maxWidth, height: Math.max(1, Math.round(height * maxWidth / width)) };
}

/**
 * Browser-only: re-encodes a raster image as WEBP, at most MAX_IMAGE_WIDTH wide.
 * Returns the original image if it is an SVG, already fine, or the browser can't encode WEBP.
 */
export const encodeAsWebp: ImageEncoder = async (image) => {
    if (isVectorImage(image)) {
        return image;
    }
    try {
        const blob = await (await fetch(image)).blob();
        const bitmap = await createImageBitmap(blob);
        try {
            if (!needsReencoding(mimeTypeOf(image), bitmap.width)) {
                return image;
            }
            const { width, height } = targetSize(bitmap.width, bitmap.height);
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');
            if (!context) {
                return image;
            }
            context.drawImage(bitmap, 0, 0, width, height);
            const encoded = canvas.toDataURL('image/webp', WEBP_QUALITY);
            // Browsers without WEBP encoding silently fall back to PNG
            return mimeTypeOf(encoded) === 'image/webp' ? encoded as Base64Image : image;
        }
        finally {
            bitmap.close();
        }
    }
    catch (error) {
        console.warn('Could not re-encode image as WEBP', error);
        return image;
    }
};

async function compressSlice(slice: Slice, encode: ImageEncoder): Promise<Slice> {
    if (slice.sliceType !== 'image') {
        return slice;
    }
    const image = await encode(slice.image);
    return image === slice.image ? slice : { ...slice, image };
}

async function compressSlide(slide: Slide, encode: ImageEncoder): Promise<Slide> {
    const slices = await Promise.all(slide.slices.map(slice => compressSlice(slice, encode)));
    return slices.every((slice, i) => slice === slide.slices[i]) ? slide : { ...slide, slices };
}

/**
 * Re-encodes all image slices of a slideshow.
 * Returns the same object if no image changed, so callers can detect a no-op by identity.
 */
export async function compressSlideShowImages(slideShow: SlideShow, encode: ImageEncoder = encodeAsWebp): Promise<SlideShow> {
    const slides = await Promise.all(slideShow.slides.map(slide => compressSlide(slide, encode)));
    return slides.every((slide, i) => slide === slideShow.slides[i]) ? slideShow : { ...slideShow, slides };
}
