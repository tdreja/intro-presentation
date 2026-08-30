import { Temporal } from '@js-temporal/polyfill';
import { APP_ID_CONVERTER, type AppId } from '../identifier/AppId.ts';
import { SLIDE_CONVERTER, type Slide } from './Slide.ts';
import type { JsonConverter, RawJson } from '../json/json.ts';
import { ArrayConverter, DURATION_CONVERTER } from '../json/common.ts';

/**
 * Represents a slideshow with multiple slides.
 */
export interface SlideShow {
    /**
     * All slides in the slideshow, in order
     */
    readonly slides: Slide[]
    /**
     * Unique ID of the slideshow, referencing its creation date. This ID is used to identify the slideshow across multiple tabs and devices.
     */
    readonly id: AppId
    /**
     * Duration each slide is shown before advancing to the next one automatically.
     */
    readonly timePerSlide: Temporal.Duration
    /**
     * Whether the slideshow is displayed in dark mode. Null or absent means the system default is used.
     */
    readonly darkMode?: boolean | null
}

export type RawJsonSlideShow = RawJson<SlideShow>;

const SLIDES_CONVERTER = new ArrayConverter<Slide, unknown>(SLIDE_CONVERTER);

export const SLIDE_SHOW_CONVERTER: JsonConverter<SlideShow, RawJsonSlideShow> = {
    fromJson(json: unknown | null | undefined): SlideShow | null {
        if (!json) {
            return null;
        }
        const parsed = json as RawJsonSlideShow;
        const id = APP_ID_CONVERTER.fromJson(parsed.id);
        if (!id) {
            return null;
        }
        const slides = SLIDES_CONVERTER.fromJson(parsed.slides);
        if (slides === null) {
            return null;
        }
        const timePerSlide = DURATION_CONVERTER.fromJson(parsed.timePerSlide);
        if (!timePerSlide) {
            return null;
        }
        return { id, slides, timePerSlide, darkMode: parsed.darkMode ?? null };
    },
    toJson(data: SlideShow | null | undefined): RawJsonSlideShow | null {
        if (!data) {
            return null;
        }
        return {
            id: APP_ID_CONVERTER.toJson(data.id),
            slides: SLIDES_CONVERTER.toJson(data.slides),
            timePerSlide: DURATION_CONVERTER.toJson(data.timePerSlide),
            darkMode: data.darkMode ?? null,
        };
    },
};

export function findSlide(slideShow?: SlideShow | null, slideId?: AppId | null): Slide | null {
    if (slideShow && slideId) {
        return slideShow.slides.find(slide => slide.slideId === slideId) ?? null;
    }
    return null;
}

export function indexOfSlide(slideShow?: SlideShow | null, slideId?: AppId | null): number {
    if (slideShow && slideId) {
        return slideShow.slides.findIndex(slide => slide.slideId === slideId);
    }
    return -1;
}

export function findNextSlideId(slideShow?: SlideShow | null, currentSlideId?: AppId | null): AppId | null {
    if (slideShow) {
        if (slideShow.slides.length === 0) {
            return null;
        }
        const index = indexOfSlide(slideShow, currentSlideId);
        if (index >= 0 && index < slideShow.slides.length - 1) {
            return slideShow.slides[index + 1].slideId;
        }
        return slideShow.slides[0].slideId;
    }
    return null;
}

export function pickNewest(slideShowA?: SlideShow | null, slideShowB?: SlideShow | null): SlideShow | null {
    if (slideShowA && slideShowB) {
        return slideShowA.id >= slideShowB.id ? slideShowA : slideShowB;
    }
    return slideShowA ?? slideShowB ?? null;
}
