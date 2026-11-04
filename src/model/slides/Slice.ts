import { type Base64Image, BASE_64_IMAGE_CONVERTER } from './Image.ts';
import type { JsonConverter, RawJson } from '../json/json.ts';
import { NUMBER_CONVERTER, STRING_CONVERTER } from '../json/common.ts';

/**
 * Marker type for Markdown text
 */
export type Markdown = string;

/**
 * All supported types of slices
 */
export type SliceType = 'image' | 'text' | 'qr-code';

/**
 * Shared API for a vertical slice of a slide
 */
interface BaseSlice {
    /**
     * What type of slice is this?
     */
    readonly sliceType: SliceType
    /**
     * Width of the slice in percent of the slide. All slices of a slide add up to 100.
     */
    readonly width: number
}

/**
 * Slice showing an image, filling the slice.
 */
export interface ImageSlice extends BaseSlice {
    readonly sliceType: 'image'
    /**
     * Image as Base64 data URL. Raster images are re-encoded to WEBP in the browser.
     */
    readonly image: Base64Image
}

/**
 * Slice showing Markdown text.
 */
export interface TextSlice extends BaseSlice {
    readonly sliceType: 'text'
    readonly text: Markdown
}

/**
 * Slice showing a QR code, centered in the slice.
 */
export interface QrCodeSlice extends BaseSlice {
    readonly sliceType: 'qr-code'
    /**
     * Content encoded in the QR code, usually a URL
     */
    readonly data: string
}

export type Slice = ImageSlice | TextSlice | QrCodeSlice;

/**
 * JSON representation of a slice, used to restore the original
 */
export type RawJsonSlice = RawJson<ImageSlice> & RawJson<TextSlice> & RawJson<QrCodeSlice>;

/**
 * Imports and exports slices to JSON. Widths are only checked to be positive here;
 * scaling them to add up to 100 happens on the slide.
 */
export const SLICE_CONVERTER: JsonConverter<Slice, RawJsonSlice> = {
    fromJson(json: unknown | null | undefined): Slice | null {
        if (!json || typeof json !== 'object') {
            return null;
        }
        const parsed = json as RawJsonSlice;
        const width = NUMBER_CONVERTER.fromJson(parsed.width);
        if (width === null || width <= 0) {
            return null;
        }
        switch (parsed.sliceType) {
            case 'image': {
                const image = BASE_64_IMAGE_CONVERTER.fromJson(parsed.image);
                return image ? { sliceType: 'image', width, image } : null;
            }
            case 'text': {
                const text = STRING_CONVERTER.fromJson(parsed.text);
                return text !== null ? { sliceType: 'text', width, text } : null;
            }
            case 'qr-code': {
                const data = STRING_CONVERTER.fromJson(parsed.data);
                return data ? { sliceType: 'qr-code', width, data } : null;
            }
            default:
                return null;
        }
    },

    toJson(data: Slice | null | undefined): RawJsonSlice | null {
        if (!data) {
            return null;
        }
        switch (data.sliceType) {
            case 'image':
                return { sliceType: 'image', width: data.width, image: BASE_64_IMAGE_CONVERTER.toJson(data.image) };
            case 'text':
                return { sliceType: 'text', width: data.width, text: data.text };
            case 'qr-code':
                return { sliceType: 'qr-code', width: data.width, data: data.data };
            default:
                return null;
        }
    },
};

/**
 * Scales the widths of the slices proportionally, so they add up to exactly 100.
 * E.g. widths 30 and 30 become 50 and 50.
 */
export function scaleSliceWidths(slices: Slice[]): Slice[] {
    const total = slices.reduce((sum, slice) => sum + slice.width, 0);
    if (total <= 0 || total === 100) {
        return slices;
    }
    return slices.map(slice => ({ ...slice, width: slice.width * 100 / total }));
}
