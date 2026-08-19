import { asAppId, type AppId } from '../identifier/AppId.ts';
import { importSlide, importSlideJSON, type Slide } from './Slide.ts';
import { asArray, asDateTime, asNumberOrZero } from '../JsonUtils.ts';
import { Temporal } from '@js-temporal/polyfill';

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

type JsonSlideShow = Partial<Omit<SlideShow, 'slides' | 'id'>> & {
    /**
     * Unknown ID
     */
    id?: unknown
    /**
     * Array of slides
     */
    slides?: unknown[]
    /**
     * The countdown target stores as JSON value
     */
    countdownTarget?: unknown
};

export function exportSlideShow(show: SlideShow): string {
    return JSON.stringify({
        ...show,
        countdownTarget: show.countdownTarget ? show.countdownTarget.toString() : undefined,
    });
}

export function importSlideShow(json?: string | null): SlideShow | null {
    if (!json) {
        return null;
    }
    const raw: JsonSlideShow = JSON.parse(json);
    if (!raw) {
        return null;
    }
    const id = asAppId(raw.id as string);
    if (!id) {
        return null;
    }
    const rawArray = asArray(raw.slides);
    if (!rawArray) {
        return null;
    }
    const currentSlideIndex = asNumberOrZero(raw.currentSlideIndex);
    const countdownTarget = asDateTime(raw.countdownTarget);
    const slides: Slide[] = [];
    for (const raw of rawArray) {
        const slide = typeof raw === 'string' ? importSlideJSON(raw) : importSlide(raw);
        if (slide) {
            slides.push(slide);
        }
    }
    return { id, slides, currentSlideIndex, countdownTarget };
}
