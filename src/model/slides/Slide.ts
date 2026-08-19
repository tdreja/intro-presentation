import { Temporal } from '@js-temporal/polyfill';
import { APP_ID_CONVERTER, type AppId, newAppId } from '../identifier/AppId.ts';
import { type Base64Image, BASE_64_IMAGE_CONVERTER } from './Image.ts';
import type { JsonConverter, RawJson } from '../json/json.ts';
import { STRING_CONVERTER } from '../json/common.ts';

export function createSlideId(date?: Temporal.PlainDateTime | null): AppId {
    return newAppId('slide', date);
}

/**
 * Marker type for Markdown text
 */
export type Markdown = string;

/**
 * All supported types of slides in the presentation
 */
export type SlideType = 'full-image' | 'half-text-half-image';

/**
 * Shared API for a single slide in the presentation
 */
export interface Slide {
    /**
     * ID identifying the slide, references its creation date
     */
    readonly slideId: AppId
    /**
     * What type of slide is this?
     */
    readonly slideType: SlideType
    /**
     * Optional headline for the slide, used as optional title in the layout
     */
    readonly headline?: string | null
}

/**
 * Slide only shows a single image, filling the screen. Optional headline can be shown as a title in the layout.
 */
export interface FullImageSlide extends Slide {
    /**
     * Screen-filling image to show on the slide, encoded as a Base64 string.
     */
    readonly image: Base64Image
    /**
     * What type of slide is this? Always 'full-image' for this slide type.
     */
    readonly slideType: 'full-image'
}

/**
 * Layout options for a slide that combines text and image
 */
export type SlideLayout = 'half-half' | 'one-third-left' | 'one-third-right';

/**
 * Slide shows a combination of text and image, with the image taking up half or one-third of the screen.
 * Optional headline can be shown as a title in the layout.
 */
export interface HalfTextHalfImageSlide extends Slide {
    /**
     * Text (in Markdown) to show on the slide, taking up half or two-thirds of the screen depending on the layout.
     */
    readonly text: Markdown
    /**
     * Image to show on the slide, taking up half or one-third of the screen depending on the layout, encoded as a Base64 string.
     */
    readonly image: Base64Image
    /**
     * How is the slide arranged? Half text and half image, or one-third text and two-thirds image, or two-thirds text and one-third image?
     */
    readonly layout: SlideLayout
    /**
     * Fixed slide type for this slide, always 'half-text-half-image' for this slide type.
     */
    readonly slideType: 'half-text-half-image'
}

/**
 * JSON representation of a slide, used to restore the original
 */
export type RawJsonSlide = RawJson<Slide> & RawJson<FullImageSlide> & RawJson<HalfTextHalfImageSlide>;

/**
 * Imports and exports slides to JSON
 */
export const SLIDE_CONVERTER: JsonConverter<Slide, RawJsonSlide> = {
    fromJson(json: RawJsonSlide | null | undefined): Slide | null {
        if (!json) {
            return null;
        }
        const slideType = STRING_CONVERTER.fromJson(json.slideType);
        if (!slideType) {
            return null;
        }
        const slideId = APP_ID_CONVERTER.fromJson(json.slideId);
        if (!slideId) {
            return null;
        }
        const headline = STRING_CONVERTER.fromJson(json.headline);
        switch (slideType) {
            case 'full-image': {
                const img = BASE_64_IMAGE_CONVERTER.fromJson(json.image);
                if (img) {
                    return {
                        headline,
                        slideType: 'full-image',
                        image: img,
                        slideId,
                    } as FullImageSlide;
                }
                return null;
            }
            case 'half-text-half-image': {
                const img = BASE_64_IMAGE_CONVERTER.fromJson(json.image);
                const text = STRING_CONVERTER.fromJson(json.text);
                const layout = STRING_CONVERTER.fromJson(json.layout);
                if (img && text && layout) {
                    return {
                        headline,
                        slideId,
                        slideType: 'half-text-half-image',
                        image: img,
                        text,
                        layout: layout as SlideLayout,
                    } as HalfTextHalfImageSlide;
                }
                return null;
            }
            default:
                return null;
        }
    },

    toJson(data: Slide | null | undefined): RawJsonSlide | null {
        if (!data) {
            return null;
        }
        switch (data.slideType) {
            case 'full-image': {
                const fullImageSlide = data as FullImageSlide;
                return {
                    slideId: APP_ID_CONVERTER.toJson(fullImageSlide.slideId),
                    slideType: fullImageSlide.slideType,
                    image: BASE_64_IMAGE_CONVERTER.toJson(fullImageSlide.image),
                    headline: fullImageSlide.headline,
                };
            }
            case 'half-text-half-image': {
                const halfTextHalfImageSlide = data as HalfTextHalfImageSlide;
                return {
                    slideId: APP_ID_CONVERTER.toJson(halfTextHalfImageSlide.slideId),
                    slideType: halfTextHalfImageSlide.slideType,
                    text: halfTextHalfImageSlide.text,
                    image: BASE_64_IMAGE_CONVERTER.toJson(halfTextHalfImageSlide.image),
                    layout: halfTextHalfImageSlide.layout,
                    headline: halfTextHalfImageSlide.headline,
                };
            }
            default:
                return null;
        }
    },
};
