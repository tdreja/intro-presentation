import { Temporal } from '@js-temporal/polyfill';
import type { AppId } from '../identifier/AppId.ts';
import { asAppId, newAppId } from '../identifier/AppId.ts';
import { asBase64Image, type Base64Image } from './Image.ts';

export function createSlideId(date?: Temporal.PlainDateTime | null): AppId {
    return newAppId('slide', date);
}

export interface Slide {
    readonly slideId: AppId
    readonly slideType: 'full-image' | 'half-text-half-image'
}

export interface FullImageSlide extends Slide {
    readonly image: Base64Image
    readonly slideType: 'full-image'
}

export interface HalfTextHalfImageSlide extends Slide {
    readonly text: string
    readonly image: Base64Image
    readonly slideType: 'half-text-half-image'
}

type JsonSlide = Partial<Slide> & Partial<FullImageSlide> & Partial<HalfTextHalfImageSlide>;

export function importSlide(json?: string | null): Slide | null {
    if (!json) {
        return null;
    }
    const raw: JsonSlide = JSON.parse(json);
    if (!raw || !raw.slideId || !raw.slideType) {
        return null;
    }
    const slideId = asAppId(raw.slideId);
    if (!slideId) {
        return null;
    }
    const image = asBase64Image(raw.image);
    switch (raw.slideType) {
        case 'full-image':
            if (!image) {
                return null;
            }
            return {
                slideId,
                slideType: 'full-image',
                image,
            } as FullImageSlide;
        case 'half-text-half-image':
            if (!raw.text || !image) {
                return null;
            }
            return {
                slideId,
                text: raw.text,
                slideType: 'half-text-half-image',
                image,
            } as HalfTextHalfImageSlide;
        default:
            return null;
    }
}
