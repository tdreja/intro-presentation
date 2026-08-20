import { type ReactElement } from 'react';
import { SlideShowProgress } from './SlideShowProgress.component.tsx';
import type { SlideShow } from '../../model/slides/SlideShow.ts';

type Props = {
    slideShow: SlideShow
    currentSlideId: string | undefined
};

export const SlideShowBottomNav = ({ slideShow, currentSlideId }: Props): ReactElement => {
    const timePerSlideMs = slideShow.timePerSlide.total('milliseconds');
    return (
        <nav
            className="navbar bg-body-secondary border-top flex-shrink-0 justify-content-center gap-2"
            style={{ height: 'var(--navbar-height)' }}
        >
            <SlideShowProgress
                slides={slideShow.slides}
                currentSlideId={currentSlideId}
                timePerSlideMs={timePerSlideMs}
            />
        </nav>
    );
};
