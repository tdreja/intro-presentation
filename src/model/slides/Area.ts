import { type Base64Image, BASE_64_IMAGE_CONVERTER } from './Image.ts';
import type { JsonConverter, RawJson } from '../json/json.ts';
import { NUMBER_CONVERTER, STRING_CONVERTER } from '../json/common.ts';

/**
 * Marker type for Markdown text
 */
export type Markdown = string;

/**
 * All supported types of areas
 */
export type AreaType = 'image' | 'text' | 'qr-code';

/**
 * Vertical position of the content within an area
 */
export type VerticalAlign = 'top' | 'middle' | 'bottom';

export const VERTICAL_ALIGNS: readonly VerticalAlign[] = ['top', 'middle', 'bottom'];

/**
 * Horizontal alignment of the text within a text area
 */
export type TextAlign = 'left' | 'center' | 'right';

export const TEXT_ALIGNS: readonly TextAlign[] = ['left', 'center', 'right'];

/**
 * Position and size of a rectangle on a slide, in unscaled slide units (see {@link Slide.width}).
 */
export interface Bounds {
    /**
     * Distance of the left edge from the left edge of the slide
     */
    readonly left: number
    /**
     * Distance of the top edge from the top edge of the slide
     */
    readonly top: number
    readonly width: number
    readonly height: number
}

/**
 * Shared API for a rectangular area placed on a slide
 */
interface BaseArea extends Bounds {
    /**
     * What type of area is this?
     */
    readonly areaType: AreaType
    /**
     * Vertical position of the content. Absent means the default of the area type, see {@link verticalAlignOf}.
     */
    readonly verticalAlign?: VerticalAlign
}

/**
 * Area showing an image, filling the area.
 */
export interface ImageArea extends BaseArea {
    readonly areaType: 'image'
    /**
     * Image as Base64 data URL. Raster images are re-encoded to WEBP in the browser.
     */
    readonly image: Base64Image
}

/**
 * Area showing Markdown text.
 */
export interface TextArea extends BaseArea {
    readonly areaType: 'text'
    readonly text: Markdown
    /**
     * Horizontal alignment of the whole text. Absent means left, see {@link textAlignOf}.
     */
    readonly textAlign?: TextAlign
}

/**
 * Area showing a QR code, centered in the area.
 */
export interface QrCodeArea extends BaseArea {
    readonly areaType: 'qr-code'
    /**
     * Content encoded in the QR code, usually a URL
     */
    readonly data: string
}

export type Area = ImageArea | TextArea | QrCodeArea;

/**
 * JSON representation of an area, used to restore the original
 */
export type RawJsonArea = RawJson<ImageArea> & RawJson<TextArea> & RawJson<QrCodeArea>;

/**
 * Default vertical alignment of an area type: text starts at the top, images and QR codes are centered.
 */
export function defaultVerticalAlign(type: AreaType): VerticalAlign {
    return type === 'text' ? 'top' : 'middle';
}

/**
 * Effective vertical alignment of an area, falling back to the default of its type.
 */
export function verticalAlignOf(area: Area): VerticalAlign {
    return area.verticalAlign ?? defaultVerticalAlign(area.areaType);
}

function parseVerticalAlign(json: unknown): VerticalAlign | null {
    return VERTICAL_ALIGNS.find(align => align === json) ?? null;
}

/**
 * Effective horizontal alignment of a text area, left unless set.
 */
export function textAlignOf(area: TextArea): TextAlign {
    return area.textAlign ?? 'left';
}

function parseTextAlign(json: unknown): TextAlign | null {
    return TEXT_ALIGNS.find(align => align === json) ?? null;
}

/**
 * Reads the position and size of an area. Positions may be any finite number, sizes must be positive.
 */
function parseBounds(parsed: RawJsonArea): Bounds | null {
    const left = NUMBER_CONVERTER.fromJson(parsed.left);
    const top = NUMBER_CONVERTER.fromJson(parsed.top);
    const width = NUMBER_CONVERTER.fromJson(parsed.width);
    const height = NUMBER_CONVERTER.fromJson(parsed.height);
    if (left === null || top === null || width === null || height === null || width <= 0 || height <= 0) {
        return null;
    }
    return { left, top, width, height };
}

/**
 * Imports and exports areas to JSON.
 */
export const AREA_CONVERTER: JsonConverter<Area, RawJsonArea> = {
    fromJson(json: unknown | null | undefined): Area | null {
        if (!json || typeof json !== 'object') {
            return null;
        }
        const parsed = json as RawJsonArea;
        const bounds = parseBounds(parsed);
        if (!bounds) {
            return null;
        }
        const verticalAlign = parseVerticalAlign(parsed.verticalAlign);
        // Invalid or missing alignments are left out, so the default of the type applies
        const common = verticalAlign ? { ...bounds, verticalAlign } : bounds;
        switch (parsed.areaType) {
            case 'image': {
                const image = BASE_64_IMAGE_CONVERTER.fromJson(parsed.image);
                return image ? { areaType: 'image', ...common, image } : null;
            }
            case 'text': {
                const text = STRING_CONVERTER.fromJson(parsed.text);
                if (text === null) {
                    return null;
                }
                // Like the vertical alignment, an invalid or missing value is left out
                const textAlign = parseTextAlign(parsed.textAlign);
                return textAlign ? { areaType: 'text', ...common, text, textAlign } : { areaType: 'text', ...common, text };
            }
            case 'qr-code': {
                const data = STRING_CONVERTER.fromJson(parsed.data);
                return data ? { areaType: 'qr-code', ...common, data } : null;
            }
            default:
                return null;
        }
    },

    toJson(data: Area | null | undefined): RawJsonArea | null {
        if (!data) {
            return null;
        }
        const bounds = { left: data.left, top: data.top, width: data.width, height: data.height };
        const common = data.verticalAlign ? { ...bounds, verticalAlign: data.verticalAlign } : bounds;
        switch (data.areaType) {
            case 'image':
                return { areaType: 'image', ...common, image: BASE_64_IMAGE_CONVERTER.toJson(data.image) };
            case 'text':
                return data.textAlign
                    ? { areaType: 'text', ...common, text: data.text, textAlign: data.textAlign }
                    : { areaType: 'text', ...common, text: data.text };
            case 'qr-code':
                return { areaType: 'qr-code', ...common, data: data.data };
            default:
                return null;
        }
    },
};
