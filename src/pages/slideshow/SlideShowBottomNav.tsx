import { type ReactElement } from 'react';
import { SlideShowProgress } from './SlideShowProgress.component.tsx';
import type { SlideShow } from '../../model/slides/SlideShow.ts';
import type { Countdown } from '../../model/slides/Countdown.ts';
import { CountdownComponent } from './Countdown.component.tsx';

type Props = {
    slideShow: SlideShow
    currentSlideId: string | undefined
    countdown: Countdown
};

export const SlideShowBottomNav = ({ slideShow, currentSlideId, countdown }: Props): ReactElement => {
    const timePerSlideMs = slideShow.timePerSlide.total('milliseconds');
    return (
        <nav
            className="navbar bg-body-secondary border-top flex-shrink-0 justify-content-center gap-2 position-relative"
            style={{ height: 'var(--navbar-height)' }}
        >
            <SlideShowProgress
                slides={slideShow.slides}
                currentSlideId={currentSlideId}
                timePerSlideMs={timePerSlideMs}
            />
            <CountdownComponent countdown={countdown} />
        </nav>
    );
};
