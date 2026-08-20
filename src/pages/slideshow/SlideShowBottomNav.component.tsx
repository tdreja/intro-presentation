import { type CSSProperties, type ReactElement } from 'react';
import type { Slide } from '../../model/slides/Slide.ts';

type Props = {
    slides: Slide[]
    currentSlideId: string | undefined
    timePerSlideMs: number
};

export const SlideShowBottomNav = ({ slides, currentSlideId, timePerSlideMs }: Props): ReactElement => {
    return (
        <nav
            className="navbar bg-body-secondary border-top flex-shrink-0 justify-content-center gap-2"
            style={{ height: 'var(--navbar-height)' }}
        >
            {slides.map((slide) => {
                const isActive = slide.slideId === currentSlideId;
                return (
                    <span
                        key={slide.slideId}
                        className={`slide-dot${isActive ? ' slide-dot--active' : ''}`}
                        style={isActive ? { '--time-per-slide': `${timePerSlideMs}ms` } as CSSProperties : undefined}
                    >
                        {isActive && <span className="slide-dot-fill" />}
                    </span>
                );
            })}
        </nav>
    );
};
