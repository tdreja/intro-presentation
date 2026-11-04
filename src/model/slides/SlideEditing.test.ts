import { describe, test, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import type { AppId } from '../identifier/AppId';
import { PLACEHOLDER_IMAGE } from './Image';
import type { Slice } from './Slice';
import type { Slide } from './Slide';
import type { SlideShow } from './SlideShow';
import {
    addSlice,
    addSlide,
    createSlice,
    createSlide,
    equalizeWidths,
    MIN_SLICE_WIDTH,
    moveSlice,
    moveSlide,
    removeSlice,
    removeSlide,
    replaceSlide,
    setSliceWidth,
    updateSlice,
} from './SlideEditing';

const TEXT: Slice = { sliceType: 'text', width: 50, text: '# A' };
const IMAGE: Slice = { sliceType: 'image', width: 30, image: PLACEHOLDER_IMAGE };
const QR: Slice = { sliceType: 'qr-code', width: 20, data: 'https://example.com' };

const SLIDE_A: Slide = { slideId: 'slide-2026-01-01-00-00-00-001' as AppId, slices: [TEXT, IMAGE, QR] };
const SLIDE_B: Slide = { slideId: 'slide-2026-01-01-00-00-00-002' as AppId, slices: [{ ...TEXT, width: 100 }] };
const SLIDE_C: Slide = { slideId: 'slide-2026-01-01-00-00-00-003' as AppId, slices: [{ ...QR, width: 100 }] };

const SHOW: SlideShow = {
    id: 'show-2020-01-01-00-00-00-000' as AppId,
    slides: [SLIDE_A, SLIDE_B, SLIDE_C],
    timePerSlide: Temporal.Duration.from({ seconds: 10 }),
};

const total = (slide: Slide) => slide.slices.reduce((sum, slice) => sum + slice.width, 0);
const ids = (show: SlideShow) => show.slides.map(slide => slide.slideId);

describe('createSlice / createSlide', () => {
    test.each(['text', 'image', 'qr-code'] as const)('creates a full-width %s slice', (type) => {
        const slice = createSlice(type);
        expect(slice.sliceType).toBe(type);
        expect(slice.width).toBe(100);
    });

    test('creates a slide with one text slice', () => {
        const slide = createSlide();
        expect(slide.slideId).toMatch(/^slide-/);
        expect(slide.slices).toHaveLength(1);
        expect(slide.slices[0].sliceType).toBe('text');
    });
});

describe('equalizeWidths', () => {
    test('gives all slices the same width', () => {
        expect(equalizeWidths([TEXT, IMAGE]).map(s => s.width)).toEqual([50, 50]);
    });

    test('keeps an empty list', () => {
        expect(equalizeWidths([])).toEqual([]);
    });
});

describe('setSliceWidth', () => {
    const twoSlices: Slide = { ...SLIDE_A, slices: [{ ...TEXT, width: 50 }, { ...IMAGE, width: 50 }] };

    test('51 on one slice makes the other 49', () => {
        expect(setSliceWidth(twoSlices, 0, 51).slices.map(s => s.width)).toEqual([51, 49]);
    });

    test('splits the reduction proportionally among several slices', () => {
        // Others are 30 and 20 (ratio 3:2), remaining 40 → 24 and 16
        const widths = setSliceWidth(SLIDE_A, 0, 60).slices.map(s => s.width);
        expect(widths[0]).toBe(60);
        expect(widths[1]).toBeCloseTo(24);
        expect(widths[2]).toBeCloseTo(16);
    });

    test('splits an increase of the others proportionally as well', () => {
        const widths = setSliceWidth(SLIDE_A, 0, 25).slices.map(s => s.width);
        expect(widths[1]).toBeCloseTo(45);
        expect(widths[2]).toBeCloseTo(30);
    });

    test('clamps to the minimum width', () => {
        expect(setSliceWidth(twoSlices, 0, 1).slices.map(s => s.width)).toEqual([MIN_SLICE_WIDTH, 100 - MIN_SLICE_WIDTH]);
        expect(setSliceWidth(SLIDE_A, 0, 100).slices[0].width).toBe(100 - 2 * MIN_SLICE_WIDTH);
    });

    test('pins small slices to the minimum and gives the rest to the others', () => {
        const slide: Slide = { ...SLIDE_A, slices: [{ ...TEXT, width: 40 }, { ...IMAGE, width: 54 }, { ...QR, width: 6 }] };
        const widths = setSliceWidth(slide, 0, 80).slices.map(s => s.width);
        expect(widths[0]).toBe(80);
        expect(widths[2]).toBe(MIN_SLICE_WIDTH);
        expect(widths[1]).toBeCloseTo(15);
    });

    test.each([7, 33.3, 50, 72, 90])('always adds up to 100 (width %s)', (width) => {
        expect(total(setSliceWidth(SLIDE_A, 1, width))).toBeCloseTo(100);
    });

    test('keeps a single slice at 100', () => {
        expect(setSliceWidth(SLIDE_B, 0, 40).slices[0].width).toBe(100);
    });

    test('ignores an invalid index', () => {
        expect(setSliceWidth(SLIDE_A, 5, 40)).toBe(SLIDE_A);
    });
});

describe('slice operations', () => {
    test('addSlice appends and equalizes', () => {
        const slide = addSlice(SLIDE_B, 'qr-code');
        expect(slide.slices.map(s => s.sliceType)).toEqual(['text', 'qr-code']);
        expect(slide.slices.map(s => s.width)).toEqual([50, 50]);
    });

    test('removeSlice rescales the rest to 100', () => {
        const slide = removeSlice(SLIDE_A, 0);
        expect(slide.slices.map(s => s.sliceType)).toEqual(['image', 'qr-code']);
        expect(total(slide)).toBeCloseTo(100);
    });

    test('removeSlice keeps the last slice', () => {
        expect(removeSlice(SLIDE_B, 0)).toBe(SLIDE_B);
    });

    test('moveSlice swaps neighbours', () => {
        expect(moveSlice(SLIDE_A, 0, 1).slices).toEqual([IMAGE, TEXT, QR]);
        expect(moveSlice(SLIDE_A, 2, -1).slices).toEqual([TEXT, QR, IMAGE]);
    });

    test('moveSlice ignores moves past the edges', () => {
        expect(moveSlice(SLIDE_A, 0, -1)).toBe(SLIDE_A);
        expect(moveSlice(SLIDE_A, 2, 1)).toBe(SLIDE_A);
    });

    test('updateSlice replaces one slice', () => {
        const updated: Slice = { ...TEXT, text: '# B' };
        expect(updateSlice(SLIDE_A, 0, updated).slices).toEqual([updated, IMAGE, QR]);
    });
});

describe('slide operations', () => {
    test('addSlide appends and bumps the ID', () => {
        const slide = createSlide();
        const show = addSlide(SHOW, slide);
        expect(ids(show)).toEqual([...ids(SHOW), slide.slideId]);
        expect(show.id > SHOW.id).toBe(true);
        expect(show.id).toMatch(/^show-/);
    });

    test('removeSlide removes the slide', () => {
        expect(ids(removeSlide(SHOW, SLIDE_B.slideId))).toEqual([SLIDE_A.slideId, SLIDE_C.slideId]);
    });

    test('removeSlide keeps the last slide', () => {
        const single = { ...SHOW, slides: [SLIDE_A] };
        expect(removeSlide(single, SLIDE_A.slideId)).toBe(single);
    });

    test('moveSlide moves up and down', () => {
        expect(ids(moveSlide(SHOW, SLIDE_B.slideId, -1))).toEqual([SLIDE_B.slideId, SLIDE_A.slideId, SLIDE_C.slideId]);
        expect(ids(moveSlide(SHOW, SLIDE_B.slideId, 1))).toEqual([SLIDE_A.slideId, SLIDE_C.slideId, SLIDE_B.slideId]);
        expect(moveSlide(SHOW, SLIDE_A.slideId, -1)).toBe(SHOW);
    });

    test('replaceSlide swaps the slide with the same ID', () => {
        const changed = removeSlice(SLIDE_A, 0);
        const show = replaceSlide(SHOW, changed);
        expect(show.slides[0]).toBe(changed);
        expect(show.id > SHOW.id).toBe(true);
    });

    test('never moves the ID backwards', () => {
        const future = { ...SHOW, id: 'show-2999-01-01-00-00-00-000' as AppId };
        expect(addSlide(future, createSlide()).id).toBe(future.id);
    });
});
