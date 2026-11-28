import { Temporal } from '@js-temporal/polyfill';
import { APP_ID_CONVERTER, type AppId, newAppId } from '../identifier/AppId.ts';
import type { JsonConverter, RawJson } from '../json/json.ts';
import { ArrayConverter, NUMBER_CONVERTER } from '../json/common.ts';
import { type Area, AREA_CONVERTER, type RawJsonArea } from './Area.ts';

/**
 * Size of new slides, in slide units. Slides are scaled to fit the screen, so this only sets the aspect ratio
 * and how large text and other content is compared to the slide.
 */
export const DEFAULT_SLIDE_WIDTH = 1920;
export const DEFAULT_SLIDE_HEIGHT = 1080;

export function createSlideId(date?: Temporal.PlainDateTime | null): AppId {
    return newAppId('slide', date);
}

/**
 * A single slide in the presentation: a canvas of fixed size with areas placed on it.
 */
export interface Slide {
    /**
     * ID identifying the slide, references its creation date
     */
    readonly slideId: AppId
    /**
     * Width of the slide in slide units, the unit of all area positions and sizes
     */
    readonly width: number
    /**
     * Height of the slide in slide units
     */
    readonly height: number
    /**
     * Areas of the slide, in paint order: later areas are drawn on top of earlier ones
     */
    readonly areas: Area[]
}

/**
 * JSON representation of a slide, used to restore the original
 */
export type RawJsonSlide = RawJson<Slide>;

const AREAS_CONVERTER = new ArrayConverter<Area, RawJsonArea>(AREA_CONVERTER);

function parseSize(json: unknown): number | null {
    const size = NUMBER_CONVERTER.fromJson(json);
    return size !== null && size > 0 ? size : null;
}

/**
 * Imports and exports slides to JSON.
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
        const width = parseSize(parsed.width);
        const height = parseSize(parsed.height);
        if (width === null || height === null) {
            return null;
        }
        const areas = AREAS_CONVERTER.fromJson(parsed.areas);
        if (!areas) {
            return null;
        }
        return { slideId, width, height, areas };
    },

    toJson(data: Slide | null | undefined): RawJsonSlide | null {
        if (!data) {
            return null;
        }
        return {
            slideId: APP_ID_CONVERTER.toJson(data.slideId),
            width: data.width,
            height: data.height,
            areas: AREAS_CONVERTER.toJson(data.areas),
        };
    },
};
