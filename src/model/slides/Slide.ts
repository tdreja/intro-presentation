import { Temporal } from '@js-temporal/polyfill';
import { APP_ID_CONVERTER, type AppId, newAppId } from '../identifier/AppId.ts';
import { type Base64Image, BASE_64_IMAGE_CONVERTER } from './Image.ts';
import type { JsonConverter, RawJson } from '../json/json.ts';
import { ArrayConverter, STRING_CONVERTER } from '../json/common.ts';
import { type QrCode, QR_CODE_CONVERTER } from './QrCode.ts';

export function createSlideId(date?: Temporal.PlainDateTime | null): AppId {
    return newAppId('slide', date);
}

/**
 * Marker type for Markdown text
 */
export type Markdown = string;

/**
 * Shared API for a single slide in the presentation
 */
export interface Slide {
    /**
     * ID identifying the slide, references its creation date
     */
    readonly slideId: AppId
    /**
     * Optional headline for the slide, used as optional title in the layout
     */
    readonly headline?: string | null
    /**
     * Optional QR code to be rendered on the slide
     */
    readonly qrCode?: QrCode | null

    /**
     * Sections of the slide, each section can contain either text or an image
     */
    readonly sections: SlideSection[]
}

/**
 * Each slide is split into one or more sections
 */
export interface SlideSection {
    /**
     * Width of the slide relative to the overall screen
     */
    readonly widthPercent: number
}

/**
 * A section within the slide containing an image
 */
export interface ImageSlideSection extends SlideSection {
    /**
     * The image within the slide
     */
    readonly image: Base64Image
}

/**
 * A section within the slide containing text in Markdown format
 */
export interface TextSlideSection extends SlideSection {
    /**
     * The text within the slide, in Markdown format
     */
    readonly text: Markdown
}

/**
 * Extracts the image from a slide section, if it contains one
 * @param section Section to extract the image from
 */
export function getImageFromSection(section?: SlideSection | null): Base64Image | null {
    if (!section) {
        return null;
    }
    if ('image' in section) {
        return (section as ImageSlideSection).image;
    }
    return null;
}

/**
 * Extracts the text from a slide section, if it contains one
 * @param section Section to extract the text from
 */
export function getTextFromSection(section?: SlideSection | null): Markdown | null {
    if (!section) {
        return null;
    }
    if ('text' in section) {
        return (section as TextSlideSection).text;
    }
    return null;
}

/**
 * JSON representation of a SlideSection
 */
export type RawJsonSlideSection = RawJson<ImageSlideSection> & RawJson<TextSlideSection>;

/**
 * JSON representation of a slide, used to restore the original
 */
export type RawJsonSlide = RawJson<Slide> & {
    readonly sections?: RawJsonSlideSection[] | null
};

export const SLIDE_SECTION_CONVERTER: JsonConverter<SlideSection, RawJsonSlideSection> = {
    fromJson(json: unknown | null | undefined): SlideSection | null {
        if (!json) {
            return null;
        }
        const parsed = json as RawJsonSlideSection;
        const widthPercent = parsed.widthPercent;
        if (typeof widthPercent !== 'number'
          || !Number.isFinite(widthPercent)
          || widthPercent <= 0
          || widthPercent > 100) {
            return null;
        }
        const image = BASE_64_IMAGE_CONVERTER.fromJson(parsed.image);
        if (image) {
            return {
                widthPercent,
                image,
            } as ImageSlideSection;
        }
        const text = STRING_CONVERTER.fromJson(parsed.text);
        if (text) {
            return {
                widthPercent,
                text,
            } as TextSlideSection;
        }
        return null;
    },
    toJson(data: SlideSection | null | undefined): RawJsonSlideSection | null {
        if (!data) {
            return null;
        }
        const image = getImageFromSection(data);
        if (image) {
            return {
                widthPercent: data.widthPercent,
                image: BASE_64_IMAGE_CONVERTER.toJson(image),
            };
        }
        const text = getTextFromSection(data);
        if (text) {
            return {
                widthPercent: data.widthPercent,
                text: STRING_CONVERTER.toJson(text),
            };
        }
        return null;
    },
};

const SLIDE_SECTIONS_CONVERTER = new ArrayConverter<SlideSection, RawJsonSlideSection>(SLIDE_SECTION_CONVERTER);

/**
 * Imports and exports slides to JSON
 */
export const SLIDE_CONVERTER: JsonConverter<Slide, RawJsonSlide> = {
    fromJson(json: unknown | null | undefined): Slide | null {
        if (!json) {
            return null;
        }
        const parsed = json as RawJsonSlide;
        const slideId = APP_ID_CONVERTER.fromJson(parsed.slideId);
        if (!slideId) {
            return null;
        }
        const sections = SLIDE_SECTIONS_CONVERTER.fromJson(parsed.sections);
        if (!sections) {
            return null;
        }
        const headline = STRING_CONVERTER.fromJson(parsed.headline);
        const qrCode = QR_CODE_CONVERTER.fromJson(parsed.qrCode);
        return {
            slideId,
            sections,
            headline,
            qrCode,
        };
    },

    toJson(data: Slide | null | undefined): RawJsonSlide | null {
        if (!data) {
            return null;
        }
        return {
            slideId: APP_ID_CONVERTER.toJson(data.slideId),
            sections: SLIDE_SECTIONS_CONVERTER.toJson(data.sections),
            headline: STRING_CONVERTER.toJson(data.headline),
            qrCode: QR_CODE_CONVERTER.toJson(data.qrCode),
        };
    },
};
