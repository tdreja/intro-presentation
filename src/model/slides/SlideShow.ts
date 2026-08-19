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

export type JsonSlideShow = Partial<Omit<SlideShow, 'slides' | 'id'>> & {
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

/**
 * Imports the slideshow from a JSON string, returning null if the input is invalid or cannot be parsed
 * @param json Input
 */
export function importSlideShowJSON(json?: string | null): SlideShow | null {
    if (!json) {
        return null;
    }
    return importSlideShow(JSON.parse(json));
}

/**
 * Imports the slideshow from an unknown object, returning null if the input is invalid or cannot be parsed
 * @param raw Input
 */
export function importSlideShow(raw?: unknown | null): SlideShow | null {
    const parsed = raw as JsonSlideShow | null | undefined;
    if (!parsed) {
        return null;
    }
    const id = asAppId(parsed.id as string);
    if (!id) {
        return null;
    }
    const rawArray = asArray(parsed.slides);
    if (!rawArray) {
        return null;
    }
    const currentSlideIndex = asNumberOrZero(parsed.currentSlideIndex);
    const countdownTarget = asDateTime(parsed.countdownTarget);
    const slides: Slide[] = [];
    for (const raw of rawArray) {
        const slide = typeof raw === 'string' ? importSlideJSON(raw) : importSlide(raw);
        if (slide) {
            slides.push(slide);
        }
    }
    return { id, slides, currentSlideIndex, countdownTarget };
}
