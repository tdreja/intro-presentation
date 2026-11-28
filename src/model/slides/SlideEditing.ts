import type { AppId } from '../identifier/AppId.ts';
import { newAppId } from '../identifier/AppId.ts';
import { PLACEHOLDER_IMAGE } from './Image.ts';
import { createSlideId, DEFAULT_SLIDE_HEIGHT, DEFAULT_SLIDE_WIDTH, type Slide } from './Slide.ts';
import type { Area, AreaType, Bounds } from './Area.ts';
import type { SlideShow } from './SlideShow.ts';

/**
 * Smallest width and height (in slide units) an area can be resized to in the editor.
 */
export const MIN_AREA_SIZE = 40;

/**
 * Starting text of a new text area, used when the caller passes no translated text.
 */
export const DEFAULT_NEW_TEXT = '# New text';

/**
 * Creates a new area of the given type with default content, centered on the slide with half its size.
 * A text area starts with the given text, e.g. translated to the language of the user.
 */
export function createArea(
    type: AreaType,
    slideWidth: number = DEFAULT_SLIDE_WIDTH,
    slideHeight: number = DEFAULT_SLIDE_HEIGHT,
    newText: string = DEFAULT_NEW_TEXT,
): Area {
    const bounds = { left: slideWidth / 4, top: slideHeight / 4, width: slideWidth / 2, height: slideHeight / 2 };
    switch (type) {
        case 'image':
            return { areaType: 'image', ...bounds, image: PLACEHOLDER_IMAGE };
        case 'text':
            return { areaType: 'text', ...bounds, text: newText };
        case 'qr-code':
            return { areaType: 'qr-code', ...bounds, data: 'https://example.com' };
    }
}

/**
 * Creates a new slide of the default size with a single text area, starting with the given text.
 */
export function createSlide(newText: string = DEFAULT_NEW_TEXT): Slide {
    return {
        slideId: createSlideId(),
        width: DEFAULT_SLIDE_WIDTH,
        height: DEFAULT_SLIDE_HEIGHT,
        areas: [createArea('text', DEFAULT_SLIDE_WIDTH, DEFAULT_SLIDE_HEIGHT, newText)],
    };
}

function swap<T>(items: T[], index: number, direction: -1 | 1): T[] {
    const target = index + direction;
    if (index < 0 || index >= items.length || target < 0 || target >= items.length) {
        return items;
    }
    const result = [...items];
    [result[index], result[target]] = [result[target], result[index]];
    return result;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

// ---------------------------------------------------------------------------
// Slide level
// ---------------------------------------------------------------------------

/**
 * Keeps bounds inside a slide of the given size: at least {@link MIN_AREA_SIZE} large (unless the slide is smaller),
 * at most as large as the slide, and moved back onto the slide if they stick out.
 */
export function clampBounds(bounds: Bounds, slideWidth: number, slideHeight: number): Bounds {
    const width = clamp(bounds.width, Math.min(MIN_AREA_SIZE, slideWidth), slideWidth);
    const height = clamp(bounds.height, Math.min(MIN_AREA_SIZE, slideHeight), slideHeight);
    return {
        left: clamp(bounds.left, 0, slideWidth - width),
        top: clamp(bounds.top, 0, slideHeight - height),
        width,
        height,
    };
}

/**
 * Moves and/or resizes one area, keeping it on the slide, see {@link clampBounds}.
 */
export function setAreaBounds(slide: Slide, index: number, bounds: Bounds): Slide {
    if (index < 0 || index >= slide.areas.length) {
        return slide;
    }
    const clamped = clampBounds(bounds, slide.width, slide.height);
    return { ...slide, areas: slide.areas.map((area, i) => (i === index ? { ...area, ...clamped } : area)) };
}

/**
 * Adds a new area of the given type on top of the other areas. A text area starts with the given text.
 */
export function addArea(slide: Slide, type: AreaType, newText: string = DEFAULT_NEW_TEXT): Slide {
    return { ...slide, areas: [...slide.areas, createArea(type, slide.width, slide.height, newText)] };
}

/**
 * Removes an area.
 */
export function removeArea(slide: Slide, index: number): Slide {
    if (index < 0 || index >= slide.areas.length) {
        return slide;
    }
    return { ...slide, areas: slide.areas.filter((_, i) => i !== index) };
}

/**
 * Moves an area one step back (-1, below the area before it) or forward (1, on top of the area after it).
 */
export function moveArea(slide: Slide, index: number, direction: -1 | 1): Slide {
    const areas = swap(slide.areas, index, direction);
    return areas === slide.areas ? slide : { ...slide, areas };
}

/**
 * Replaces the area at the given index.
 */
export function updateArea(slide: Slide, index: number, area: Area): Slide {
    if (index < 0 || index >= slide.areas.length) {
        return slide;
    }
    return { ...slide, areas: slide.areas.map((existing, i) => (i === index ? area : existing)) };
}

// ---------------------------------------------------------------------------
// Slideshow level
// ---------------------------------------------------------------------------

/**
 * Gives the slideshow a fresh ID, keeping its prefix, so the edited version is picked over older copies.
 */
export function touchSlideShow(slideShow: SlideShow, slides: Slide[]): SlideShow {
    const dash = slideShow.id.indexOf('-');
    const prefix = dash > 0 ? slideShow.id.substring(0, dash) : 'slideshow';
    const fresh = newAppId(prefix);
    // Never go backwards, e.g. for a slideshow ID from the future
    const id = fresh > slideShow.id ? fresh : slideShow.id;
    return { ...slideShow, id, slides };
}

/**
 * Switches the slideshow (and the editor) between the dark and the light theme.
 */
export function setDarkMode(slideShow: SlideShow, darkMode: boolean): SlideShow {
    if ((slideShow.darkMode === true) === darkMode) {
        return slideShow;
    }
    return touchSlideShow({ ...slideShow, darkMode }, slideShow.slides);
}

/**
 * Appends a slide at the end of the slideshow.
 */
export function addSlide(slideShow: SlideShow, slide: Slide): SlideShow {
    return touchSlideShow(slideShow, [...slideShow.slides, slide]);
}

/**
 * Inserts a copy of a slide right after it. Nothing changes if the slide doesn't exist or the copy's ID is already taken.
 */
export function duplicateSlide(slideShow: SlideShow, slideId: AppId, copyId: AppId = createSlideId()): SlideShow {
    const index = slideShow.slides.findIndex(slide => slide.slideId === slideId);
    if (index < 0 || slideShow.slides.some(slide => slide.slideId === copyId)) {
        return slideShow;
    }
    // Areas are never mutated, so the copy can share them
    const copy: Slide = { ...slideShow.slides[index], slideId: copyId, areas: [...slideShow.slides[index].areas] };
    return touchSlideShow(slideShow, [...slideShow.slides.slice(0, index + 1), copy, ...slideShow.slides.slice(index + 1)]);
}

/**
 * Removes a slide. The last slide of a slideshow can't be removed.
 */
export function removeSlide(slideShow: SlideShow, slideId: AppId): SlideShow {
    if (slideShow.slides.length <= 1 || !slideShow.slides.some(slide => slide.slideId === slideId)) {
        return slideShow;
    }
    return touchSlideShow(slideShow, slideShow.slides.filter(slide => slide.slideId !== slideId));
}

/**
 * Moves a slide one position up (-1) or down (1).
 */
export function moveSlide(slideShow: SlideShow, slideId: AppId, direction: -1 | 1): SlideShow {
    const index = slideShow.slides.findIndex(slide => slide.slideId === slideId);
    const slides = swap(slideShow.slides, index, direction);
    return slides === slideShow.slides ? slideShow : touchSlideShow(slideShow, slides);
}

/**
 * Replaces the slide with the same ID.
 */
export function replaceSlide(slideShow: SlideShow, slide: Slide): SlideShow {
    if (!slideShow.slides.some(existing => existing.slideId === slide.slideId)) {
        return slideShow;
    }
    return touchSlideShow(slideShow, slideShow.slides.map(existing => (existing.slideId === slide.slideId ? slide : existing)));
}
