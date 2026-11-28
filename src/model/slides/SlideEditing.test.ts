import { describe, test, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import type { AppId } from '../identifier/AppId';
import { PLACEHOLDER_IMAGE } from './Image';
import type { Area } from './Area';
import type { Slide } from './Slide';
import type { SlideShow } from './SlideShow';
import {
    addArea,
    addSlide,
    clampBounds,
    createArea,
    createSlide,
    duplicateSlide,
    MIN_AREA_SIZE,
    moveArea,
    moveSlide,
    removeArea,
    removeSlide,
    replaceSlide,
    setAreaBounds,
    setDarkMode,
    updateArea,
} from './SlideEditing';

const TEXT: Area = { areaType: 'text', left: 0, top: 0, width: 960, height: 1080, text: '# A' };
const IMAGE: Area = { areaType: 'image', left: 960, top: 0, width: 960, height: 540, image: PLACEHOLDER_IMAGE };
const QR: Area = { areaType: 'qr-code', left: 960, top: 540, width: 960, height: 540, data: 'https://example.com' };

const SIZE = { width: 1920, height: 1080 };
const SLIDE_A: Slide = { slideId: 'slide-2026-01-01-00-00-00-001_v2' as AppId, ...SIZE, areas: [TEXT, IMAGE, QR] };
const SLIDE_B: Slide = { slideId: 'slide-2026-01-01-00-00-00-002_v2' as AppId, ...SIZE, areas: [TEXT] };
const SLIDE_C: Slide = { slideId: 'slide-2026-01-01-00-00-00-003_v2' as AppId, ...SIZE, areas: [QR] };

const SHOW: SlideShow = {
    id: 'show-2020-01-01-00-00-00-000_v2' as AppId,
    slides: [SLIDE_A, SLIDE_B, SLIDE_C],
    timePerSlide: Temporal.Duration.from({ seconds: 10 }),
};

const ids = (show: SlideShow) => show.slides.map(slide => slide.slideId);
const types = (slide: Slide) => slide.areas.map(area => area.areaType);

describe('createArea / createSlide', () => {
    test.each(['text', 'image', 'qr-code'] as const)('creates a centered %s area with half the slide size', (type) => {
        const area = createArea(type, 1000, 600);
        expect(area.areaType).toBe(type);
        expect(area).toMatchObject({ left: 250, top: 150, width: 500, height: 300 });
    });

    test('defaults to the default slide size', () => {
        expect(createArea('text')).toMatchObject({ left: 320, top: 180, width: 640, height: 360 });
    });

    test('creates a 1280x720 slide with one text area', () => {
        const slide = createSlide();
        expect(slide.slideId).toMatch(/^slide-.*_v2$/);
        expect(slide).toMatchObject({ width: 1280, height: 720 });
        expect(types(slide)).toEqual(['text']);
    });
});

describe('clampBounds', () => {
    test('keeps bounds that fit', () => {
        const bounds = { left: 10, top: 20, width: 300, height: 200 };
        expect(clampBounds(bounds, 1920, 1080)).toEqual(bounds);
    });

    test('moves bounds back onto the slide', () => {
        expect(clampBounds({ left: -50, top: 1000, width: 300, height: 200 }, 1920, 1080))
            .toEqual({ left: 0, top: 880, width: 300, height: 200 });
        expect(clampBounds({ left: 1800, top: -1, width: 300, height: 200 }, 1920, 1080))
            .toEqual({ left: 1620, top: 0, width: 300, height: 200 });
    });

    test('enforces the minimum size', () => {
        expect(clampBounds({ left: 0, top: 0, width: 1, height: -5 }, 1920, 1080))
            .toEqual({ left: 0, top: 0, width: MIN_AREA_SIZE, height: MIN_AREA_SIZE });
    });

    test('never gets larger than the slide', () => {
        expect(clampBounds({ left: 100, top: 100, width: 5000, height: 5000 }, 1920, 1080))
            .toEqual({ left: 0, top: 0, width: 1920, height: 1080 });
    });
});

describe('area operations', () => {
    test('setAreaBounds moves and resizes one area, clamped to the slide', () => {
        const slide = setAreaBounds(SLIDE_A, 1, { left: 1800, top: 10, width: 400, height: 300 });
        expect(slide.areas[1]).toEqual({ ...IMAGE, left: 1520, top: 10, width: 400, height: 300 });
        expect(slide.areas[0]).toBe(TEXT);
        expect(slide.areas[2]).toBe(QR);
    });

    test('setAreaBounds ignores invalid indexes', () => {
        expect(setAreaBounds(SLIDE_A, 3, TEXT)).toBe(SLIDE_A);
        expect(setAreaBounds(SLIDE_A, -1, TEXT)).toBe(SLIDE_A);
    });

    test('addArea adds a centered area on top', () => {
        const slide = addArea(SLIDE_B, 'qr-code');
        expect(types(slide)).toEqual(['text', 'qr-code']);
        expect(slide.areas[1]).toMatchObject({ left: 480, top: 270, width: 960, height: 540 });
    });

    test('removeArea removes the area, also the last one', () => {
        expect(types(removeArea(SLIDE_A, 1))).toEqual(['text', 'qr-code']);
        expect(removeArea(SLIDE_B, 0).areas).toEqual([]);
        expect(removeArea(SLIDE_A, 5)).toBe(SLIDE_A);
    });

    test('moveArea changes the paint order', () => {
        expect(types(moveArea(SLIDE_A, 0, 1))).toEqual(['image', 'text', 'qr-code']);
        expect(types(moveArea(SLIDE_A, 2, -1))).toEqual(['text', 'qr-code', 'image']);
        expect(moveArea(SLIDE_A, 0, -1)).toBe(SLIDE_A);
        expect(moveArea(SLIDE_A, 2, 1)).toBe(SLIDE_A);
    });

    test('updateArea replaces the area at the index', () => {
        const changed: Area = { ...TEXT, text: '# B' };
        const slide = updateArea(SLIDE_A, 0, changed);
        expect(slide.areas[0]).toBe(changed);
        expect(updateArea(SLIDE_A, 7, changed)).toBe(SLIDE_A);
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

    test('duplicateSlide inserts a copy right after the original', () => {
        const copyId = 'slide-2026-01-01-00-00-00-009_v2' as AppId;
        const show = duplicateSlide(SHOW, SLIDE_B.slideId, copyId);
        expect(ids(show)).toEqual([SLIDE_A.slideId, SLIDE_B.slideId, copyId, SLIDE_C.slideId]);
        expect(show.slides[2].areas).toEqual(SLIDE_B.areas);
        expect(show.slides[2].areas).not.toBe(SLIDE_B.areas);
        expect(show.id > SHOW.id).toBe(true);
    });

    test('duplicateSlide gives the copy a new ID by default', () => {
        const show = duplicateSlide(SHOW, SLIDE_C.slideId);
        expect(show.slides).toHaveLength(4);
        expect(new Set(ids(show)).size).toBe(4);
    });

    test('duplicateSlide ignores unknown slides and taken IDs', () => {
        expect(duplicateSlide(SHOW, 'slide-2026-01-01-00-00-00-999_v2' as AppId)).toBe(SHOW);
        expect(duplicateSlide(SHOW, SLIDE_A.slideId, SLIDE_C.slideId)).toBe(SHOW);
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
        const changed = removeArea(SLIDE_A, 0);
        const show = replaceSlide(SHOW, changed);
        expect(show.slides[0]).toBe(changed);
        expect(show.id > SHOW.id).toBe(true);
    });

    test('setDarkMode switches the theme and bumps the ID', () => {
        const dark = setDarkMode(SHOW, true);
        expect(dark.darkMode).toBe(true);
        expect(dark.slides).toBe(SHOW.slides);
        expect(dark.id > SHOW.id).toBe(true);
        expect(setDarkMode(dark, false).darkMode).toBe(false);
    });

    test('setDarkMode keeps the slideshow when nothing changes', () => {
        expect(setDarkMode(SHOW, false)).toBe(SHOW);
        const dark = { ...SHOW, darkMode: true };
        expect(setDarkMode(dark, true)).toBe(dark);
    });

    test('never moves the ID backwards', () => {
        const future = { ...SHOW, id: 'show-2999-01-01-00-00-00-000_v2' as AppId };
        expect(addSlide(future, createSlide()).id).toBe(future.id);
    });
});
