import { useEffect, type ReactElement } from 'react';
import { useCurrentSlide } from '../../communication/context/CurrentSlide.context.ts';
import { useSlideShow } from '../../communication/context/Slideshow.context.ts';
import { useCountdown } from '../../communication/context/Countdown.context.ts';
import type { FullImageSlide, HalfTextHalfImageSlide } from '../../model/slides/Slide.ts';
import { findNextSlideId } from '../../model/slides/SlideShow.ts';
import { FullImageSlideComponent } from './FullImageSlide.component.tsx';
import { HalfTextHalfImageSlideComponent } from './HalfTextHalfImageSlide.component.tsx';
import { SlideShowBottomNav } from './SlideShowBottomNav.tsx';

export const SlideShowPage = (): ReactElement => {
    const [currentSlide, setCurrentSlideId] = useCurrentSlide();
    const [slideshow] = useSlideShow();
    const [countdown] = useCountdown();

    useEffect(() => {
        const ms = slideshow.timePerSlide.total('milliseconds');
        const timer = setTimeout(() => {
            console.log('Switching to next slide');
            setCurrentSlideId(findNextSlideId(slideshow, currentSlide?.slideId));
        }, ms);
        return () => clearTimeout(timer);
    }, [slideshow, currentSlide, setCurrentSlideId]);

    const renderSlide = (): ReactElement => {
        if (!currentSlide) {
            return (
                <div className="d-flex justify-content-center align-items-center w-100 h-100 text-muted fs-4">
                    No slide selected
                </div>
            );
        }
        switch (currentSlide.slideType) {
            case 'full-image':
                return <FullImageSlideComponent slide={currentSlide as FullImageSlide} />;
            case 'half-text-half-image':
                return <HalfTextHalfImageSlideComponent slide={currentSlide as HalfTextHalfImageSlide} />;
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex-grow-1 overflow-hidden position-relative">
                {renderSlide()}
            </div>
            <SlideShowBottomNav
                slideShow={slideshow}
                currentSlideId={currentSlide?.slideId}
                countdown={countdown}
            />
        </div>
    );
};
