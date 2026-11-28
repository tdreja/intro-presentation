import { describe, test, expect } from 'vitest';
import { fitScale, scaleBounds, unscaleBounds } from './SlideScale';

describe('fitScale', () => {
    test('is limited by the width in a tall space', () => {
        expect(fitScale(1920, 1080, 960, 2000)).toBe(0.5);
    });

    test('is limited by the height in a wide space', () => {
        expect(fitScale(1920, 1080, 5000, 540)).toBe(0.5);
    });

    test('scales up into a larger space', () => {
        expect(fitScale(1920, 1080, 3840, 2160)).toBe(2);
    });

    test.each([[0, 1080, 100, 100], [1920, 1080, 0, 100], [1920, 1080, 100, -1]])(
        'is 0 without space or size (%s, %s, %s, %s)',
        (slideWidth, slideHeight, availableWidth, availableHeight) => {
            expect(fitScale(slideWidth, slideHeight, availableWidth, availableHeight)).toBe(0);
        },
    );
});

describe('scaleBounds / unscaleBounds', () => {
    const bounds = { left: 100, top: 50, width: 400, height: 200 };

    test('scales position and size', () => {
        expect(scaleBounds(bounds, 0.5)).toEqual({ left: 50, top: 25, width: 200, height: 100 });
    });

    test('unscaling reverts the scaling', () => {
        expect(unscaleBounds(scaleBounds(bounds, 0.25), 0.25)).toEqual(bounds);
    });

    test('unscaling with 0 keeps the bounds', () => {
        expect(unscaleBounds(bounds, 0)).toBe(bounds);
    });
});
