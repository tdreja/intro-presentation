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
 * Vertical position of the content within a slice
 */
export type VerticalAlign = 'top' | 'middle' | 'bottom';

export const VERTICAL_ALIGNS: readonly VerticalAlign[] = ['top', 'middle', 'bottom'];

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
    /**
     * Vertical position of the content. Absent means the default of the slice type, see {@link verticalAlignOf}.
     */
    readonly verticalAlign?: VerticalAlign
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
 * Default vertical alignment of a slice type: text starts at the top, images and QR codes are centered.
 */
export function defaultVerticalAlign(type: SliceType): VerticalAlign {
    return type === 'text' ? 'top' : 'middle';
}

/**
 * Effective vertical alignment of a slice, falling back to the default of its type.
 */
export function verticalAlignOf(slice: Slice): VerticalAlign {
    return slice.verticalAlign ?? defaultVerticalAlign(slice.sliceType);
}

function parseVerticalAlign(json: unknown): VerticalAlign | null {
    return VERTICAL_ALIGNS.find(align => align === json) ?? null;
}

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
        const verticalAlign = parseVerticalAlign(parsed.verticalAlign);
        // Invalid or missing alignments are left out, so the default of the type applies
        const common = verticalAlign ? { width, verticalAlign } : { width };
        switch (parsed.sliceType) {
            case 'image': {
                const image = BASE_64_IMAGE_CONVERTER.fromJson(parsed.image);
                return image ? { sliceType: 'image', ...common, image } : null;
            }
            case 'text': {
                const text = STRING_CONVERTER.fromJson(parsed.text);
                return text !== null ? { sliceType: 'text', ...common, text } : null;
            }
            case 'qr-code': {
                const data = STRING_CONVERTER.fromJson(parsed.data);
                return data ? { sliceType: 'qr-code', ...common, data } : null;
            }
            default:
                return null;
        }
    },

    toJson(data: Slice | null | undefined): RawJsonSlice | null {
        if (!data) {
            return null;
        }
        const common = data.verticalAlign ? { width: data.width, verticalAlign: data.verticalAlign } : { width: data.width };
        switch (data.sliceType) {
            case 'image':
                return { sliceType: 'image', ...common, image: BASE_64_IMAGE_CONVERTER.toJson(data.image) };
            case 'text':
                return { sliceType: 'text', ...common, text: data.text };
            case 'qr-code':
                return { sliceType: 'qr-code', ...common, data: data.data };
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
