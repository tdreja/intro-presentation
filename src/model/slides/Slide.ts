import { Temporal } from '@js-temporal/polyfill';
import type { AppId } from '../identifier/AppId.ts';
import { asAppId, newAppId } from '../identifier/AppId.ts';
import { asBase64Image, type Base64Image } from './Image.ts';
import { asString } from '../JsonUtils.ts';

export function createSlideId(date?: Temporal.PlainDateTime | null): AppId {
    return newAppId('slide', date);
}

export type SlideType = 'full-image' | 'half-text-half-image';

export interface Slide {
    readonly slideId: AppId
    readonly slideType: SlideType
    readonly headline?: string
}

export interface FullImageSlide extends Slide {
    readonly image: Base64Image
    readonly slideType: 'full-image'
}

export type SlideLayout = 'half-half' | 'one-third-left' | 'one-third-right';

const VALID_LAYOUTS: SlideLayout[] = ['half-half', 'one-third-left', 'one-third-right'];

export interface HalfTextHalfImageSlide extends Slide {
    readonly text: string
    readonly image: Base64Image
    readonly layout: SlideLayout
    readonly slideType: 'half-text-half-image'
}

type JsonSlide = Partial<Slide> & Partial<FullImageSlide> & Partial<HalfTextHalfImageSlide>;

export function exportSlide(slide: Slide): string {
    return JSON.stringify(slide);
}

export function importSlideJSON(json?: string | null): Slide | null {
    if (!json) {
        return null;
    }
    return importSlide(JSON.parse(json));
}

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
