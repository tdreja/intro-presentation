import { APP_ID_CONVERTER, type AppId } from '../identifier/AppId.ts';
import { SLIDE_CONVERTER, type Slide } from './Slide.ts';
import { Temporal } from '@js-temporal/polyfill';
import type { JsonConverter, RawJson } from '../json/json.ts';
import { ArrayConverter, DATE_TIME_CONVERTER, NUMBER_CONVERTER } from '../json/common.ts';

/**
 * Represents a slideshow with multiple slides, the current slide index, and a countdown timer target.
 */
export interface SlideShow {
    /**
     * All slides in the slideshow, in order
     */
    readonly slides: Slide[]
    /**
     * Which slide is currently being shown?
     */
    readonly currentSlideIndex: number
    /**
     * Target date and time for the countdown, if it is active
     */
    readonly countdownTarget?: Temporal.PlainDateTime
    /**
     * Unique ID of the slideshow, referencing its creation date. This ID is used to identify the slideshow across multiple tabs and devices.
     */
    readonly id: AppId
}

export type RawJsonSlideShow = RawJson<SlideShow>;

const SLIDES_CONVERTER = new ArrayConverter<Slide, unknown>(SLIDE_CONVERTER);

export const SLIDE_SHOW_CONVERTER: JsonConverter<SlideShow, RawJsonSlideShow> = {
    fromJson(json: RawJsonSlideShow | null | undefined): SlideShow | null {
        if (!json) {
            return null;
        }
        const id = APP_ID_CONVERTER.fromJson(json.id);
        if (!id) {
            return null;
        }
        const slides = SLIDES_CONVERTER.fromJson(json.slides);
        if (slides === null) {
            return null;
        }
        const currentSlideIndex = NUMBER_CONVERTER.fromJson(json.currentSlideIndex) ?? 0;
        const countdownTarget = DATE_TIME_CONVERTER.fromJson(json.countdownTarget) ?? undefined;
        return { id, slides, currentSlideIndex, countdownTarget };
    },
    toJson(data: SlideShow | null | undefined): RawJsonSlideShow | null {
        if (!data) {
            return null;
        }
        return {
            id: APP_ID_CONVERTER.toJson(data.id),
            slides: SLIDES_CONVERTER.toJson(data.slides),
            currentSlideIndex: NUMBER_CONVERTER.toJson(data.currentSlideIndex),
            countdownTarget: DATE_TIME_CONVERTER.toJson(data.countdownTarget),
        };
    },
};
