import type { AppId } from '../identifier/AppId.ts';
import { newAppId } from '../identifier/AppId.ts';
import { PLACEHOLDER_IMAGE } from './Image.ts';
import { createSlideId, type Slide } from './Slide.ts';
import { scaleSliceWidths, type Slice, type SliceType } from './Slice.ts';
import type { SlideShow } from './SlideShow.ts';

/**
 * Smallest width (in percent) a slice can be resized to in the editor.
 */
export const MIN_SLICE_WIDTH = 5;

/**
 * Creates a new slice of the given type with default content and full width.
 */
export function createSlice(type: SliceType): Slice {
    switch (type) {
        case 'image':
            return { sliceType: 'image', width: 100, image: PLACEHOLDER_IMAGE };
        case 'text':
            return { sliceType: 'text', width: 100, text: '# New text' };
        case 'qr-code':
            return { sliceType: 'qr-code', width: 100, data: 'https://example.com' };
    }
}

/**
 * Creates a new slide with a single text slice.
 */
export function createSlide(): Slide {
    return { slideId: createSlideId(), slices: [createSlice('text')] };
}

/**
 * Gives all slices the same width, adding up to 100.
 */
export function equalizeWidths(slices: Slice[]): Slice[] {
    if (slices.length === 0) {
        return slices;
    }
    const width = 100 / slices.length;
    return slices.map(slice => ({ ...slice, width }));
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

// ---------------------------------------------------------------------------
// Slide level
// ---------------------------------------------------------------------------

/**
 * Sets the width of one slice. The other slices share the remaining width proportionally
 * to their current widths, so all slices still add up to 100. No slice gets smaller than {@link MIN_SLICE_WIDTH}.
 */
export function setSliceWidth(slide: Slide, index: number, width: number): Slide {
    const count = slide.slices.length;
    if (index < 0 || index >= count) {
        return slide;
    }
    if (count === 1) {
        return { ...slide, slices: [{ ...slide.slices[0], width: 100 }] };
    }
    const target = Math.min(Math.max(width, MIN_SLICE_WIDTH), 100 - MIN_SLICE_WIDTH * (count - 1));
    const widths = slide.slices.map(slice => slice.width);
    const others = widths.map((_, i) => i).filter(i => i !== index);
    const pinned = new Set<number>();
    const result = [...widths];
    result[index] = target;

    // Distribute proportionally; slices dropping below the minimum get pinned there and the rest is redistributed.
    for (;;) {
        const free = others.filter(i => !pinned.has(i));
        const budget = 100 - target - MIN_SLICE_WIDTH * pinned.size;
        const freeTotal = free.reduce((sum, i) => sum + widths[i], 0);
        free.forEach((i) => {
            result[i] = freeTotal > 0 ? budget * widths[i] / freeTotal : budget / free.length;
        });
        const tooSmall = free.filter(i => result[i] < MIN_SLICE_WIDTH);
        if (tooSmall.length === 0) {
            break;
        }
        tooSmall.forEach((i) => {
            pinned.add(i);
            result[i] = MIN_SLICE_WIDTH;
        });
    }
    return { ...slide, slices: slide.slices.map((slice, i) => ({ ...slice, width: result[i] })) };
}

/**
 * Appends a new slice of the given type; all slices get equal widths afterwards.
 */
export function addSlice(slide: Slide, type: SliceType): Slide {
    return { ...slide, slices: equalizeWidths([...slide.slices, createSlice(type)]) };
}

/**
 * Removes a slice and scales the remaining ones up to 100. The last slice of a slide can't be removed.
 */
export function removeSlice(slide: Slide, index: number): Slide {
    if (slide.slices.length <= 1 || index < 0 || index >= slide.slices.length) {
        return slide;
    }
    return { ...slide, slices: scaleSliceWidths(slide.slices.filter((_, i) => i !== index)) };
}

/**
 * Moves a slice one position to the left (-1) or right (1).
 */
export function moveSlice(slide: Slide, index: number, direction: -1 | 1): Slide {
    const slices = swap(slide.slices, index, direction);
    return slices === slide.slices ? slide : { ...slide, slices };
}

/**
 * Replaces the slice at the given index.
 */
export function updateSlice(slide: Slide, index: number, slice: Slice): Slide {
    if (index < 0 || index >= slide.slices.length) {
        return slide;
    }
    return { ...slide, slices: slide.slices.map((existing, i) => (i === index ? slice : existing)) };
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
 * Appends a slide at the end of the slideshow.
 */
export function addSlide(slideShow: SlideShow, slide: Slide): SlideShow {
    return touchSlideShow(slideShow, [...slideShow.slides, slide]);
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
