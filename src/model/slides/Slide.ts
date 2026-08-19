import { Temporal } from '@js-temporal/polyfill';
import type { AppId } from '../identifier/AppId.ts';
import { asAppId, newAppId } from '../identifier/AppId.ts';
import { asBase64Image, type Base64Image } from './Image.ts';
import { asString } from '../JsonUtils.ts';

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
    readonly headline?: string
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
const VALID_LAYOUTS: SlideLayout[] = ['half-half', 'one-third-left', 'one-third-right'];

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

type JsonSlide = Partial<Slide> & Partial<FullImageSlide> & Partial<HalfTextHalfImageSlide>;

/**
 * Imports the slide from a JSON string, returning null if the input is invalid or cannot be parsed
 * @param json Input
 */
export function importSlideJSON(json?: string | null): Slide | null {
    if (!json) {
        return null;
    }
    return importSlide(JSON.parse(json));
}

/**
 * Imports the slide from an unknown object, returning null if the input is invalid or cannot be parsed
 * @param raw Input
 */
export function importSlide(raw?: unknown | null): Slide | null {
    const parsed = raw as JsonSlide | null | undefined;
    if (!parsed || !parsed.slideId || !parsed.slideType) {
        return null;
    }
    const slideId = asAppId(parsed.slideId);
    if (!slideId) {
        return null;
    }
    const image = asBase64Image(parsed.image);
    const headline = asString(parsed.headline);
    switch (parsed.slideType) {
        case 'full-image':
            if (!image) {
                return null;
            }
            return {
                slideId,
                slideType: 'full-image',
                image,
                headline,
            } as FullImageSlide;
        case 'half-text-half-image':
            if (!parsed.text || !image || !parsed.layout || !VALID_LAYOUTS.includes(parsed.layout)) {
                return null;
            }
            return {
                slideId,
                text: parsed.text,
                slideType: 'half-text-half-image',
                image,
                layout: parsed.layout,
                headline,
            } as HalfTextHalfImageSlide;
        default:
            return null;
    }
}
