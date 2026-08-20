import { type CSSProperties, type ReactElement } from 'react';
import type { Slide } from '../../model/slides/Slide.ts';

type Props = {
    slides: Slide[]
    currentSlideId: string | undefined
    timePerSlideMs: number
};

export const SlideShowProgress = ({ slides, currentSlideId, timePerSlideMs }: Props): ReactElement => {
    return (
        <div className="d-flex justify-content-center gap-2">
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
        </div>
    );
};
