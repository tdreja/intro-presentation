// @vitest-environment jsdom
import { describe, test, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SlideShowProgress } from './SlideShowProgress.component';
import type { Slide } from '../../model/slides/Slide';
import type { AppId } from '../../model/identifier/AppId';

afterEach(cleanup);

const SLIDE_A: Slide = {
    slideId: 'slide-2026-01-01-00-00-00-001' as AppId,
    sections: [],
};

const SLIDE_B: Slide = {
    slideId: 'slide-2026-01-01-00-00-00-002' as AppId,
    sections: [],
};

const SLIDES = [SLIDE_A, SLIDE_B];
const TIME_PER_SLIDE_MS = 5000;

describe('SlideShowProgress', () => {
    test('renders one dot per slide', () => {
        const { container } = render(
            <SlideShowProgress
                slides={SLIDES}
                currentSlideId={undefined}
                timePerSlideMs={TIME_PER_SLIDE_MS}
            />,
        );

        expect(container.querySelectorAll('.slide-dot')).toHaveLength(SLIDES.length);
    });

    test('no dot is active when currentSlideId is undefined', () => {
        const { container } = render(
            <SlideShowProgress
                slides={SLIDES}
                currentSlideId={undefined}
                timePerSlideMs={TIME_PER_SLIDE_MS}
            />,
        );

        expect(container.querySelectorAll('.slide-dot--active')).toHaveLength(0);
    });

    test('the matching dot gets slide-dot--active when currentSlideId matches', () => {
        const { container } = render(
            <SlideShowProgress
                slides={SLIDES}
                currentSlideId={SLIDE_A.slideId}
                timePerSlideMs={TIME_PER_SLIDE_MS}
            />,
        );

        const activeDots = container.querySelectorAll('.slide-dot--active');
        expect(activeDots).toHaveLength(1);
        expect(activeDots[0]).toHaveClass('slide-dot');
    });

    test('active dot contains an inner slide-dot-fill span', () => {
        const { container } = render(
            <SlideShowProgress
                slides={SLIDES}
                currentSlideId={SLIDE_A.slideId}
                timePerSlideMs={TIME_PER_SLIDE_MS}
            />,
        );

        const activeDot = container.querySelector('.slide-dot--active');
        expect(activeDot?.querySelector('.slide-dot-fill')).toBeInTheDocument();
    });

    test('non-active dots do not contain a slide-dot-fill span', () => {
        const { container } = render(
            <SlideShowProgress
                slides={SLIDES}
                currentSlideId={SLIDE_A.slideId}
                timePerSlideMs={TIME_PER_SLIDE_MS}
            />,
        );

        const inactiveDots = container.querySelectorAll('.slide-dot:not(.slide-dot--active)');
        inactiveDots.forEach((dot) => {
            expect(dot.querySelector('.slide-dot-fill')).not.toBeInTheDocument();
        });
    });

    test('active dot has --time-per-slide CSS variable set to timePerSlideMs', () => {
        const { container } = render(
            <SlideShowProgress
                slides={SLIDES}
                currentSlideId={SLIDE_A.slideId}
                timePerSlideMs={TIME_PER_SLIDE_MS}
            />,
        );

        const activeDot = container.querySelector<HTMLElement>('.slide-dot--active');
        expect(activeDot).not.toBeNull();
        expect(activeDot!.style.getPropertyValue('--time-per-slide')).toBe(`${TIME_PER_SLIDE_MS}ms`);
    });
});
