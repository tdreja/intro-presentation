import { Temporal } from '@js-temporal/polyfill';
import { APP_ID_CONVERTER, type AppId, newAppId } from '../identifier/AppId.ts';
import type { JsonConverter, RawJson } from '../json/json.ts';
import { ArrayConverter } from '../json/common.ts';
import { type RawJsonSlice, scaleSliceWidths, type Slice, SLICE_CONVERTER } from './Slice.ts';

export function createSlideId(date?: Temporal.PlainDateTime | null): AppId {
    return newAppId('slide', date);
}

/**
 * A single slide in the presentation: a row of vertical slices, left to right.
 */
export interface Slide {
    /**
     * ID identifying the slide, references its creation date
     */
    readonly slideId: AppId
    /**
     * Vertical slices of the slide, from left to right. Their widths add up to 100.
     */
    readonly slices: Slice[]
}

/**
 * JSON representation of a slide, used to restore the original
 */
export type RawJsonSlide = RawJson<Slide>;

const SLICES_CONVERTER = new ArrayConverter<Slice, RawJsonSlice>(SLICE_CONVERTER);

/**
 * Imports and exports slides to JSON. Slice widths that don't add up to 100 are scaled to fit.
 */
export const SLIDE_CONVERTER: JsonConverter<Slide, RawJsonSlide> = {
    fromJson(json: unknown | null | undefined): Slide | null {
        if (!json || typeof json !== 'object') {
            return null;
        }
        const parsed = json as RawJsonSlide;
        const slideId = APP_ID_CONVERTER.fromJson(parsed.slideId);
        if (!slideId) {
            return null;
        }
        const slices = SLICES_CONVERTER.fromJson(parsed.slices);
        if (!slices || slices.length === 0) {
            return null;
        }
        return { slideId, slices: scaleSliceWidths(slices) };
    },

    toJson(data: Slide | null | undefined): RawJsonSlide | null {
        if (!data) {
            return null;
        }
        return {
            slideId: APP_ID_CONVERTER.toJson(data.slideId),
            slices: SLICES_CONVERTER.toJson(data.slices),
        };
    },
};
