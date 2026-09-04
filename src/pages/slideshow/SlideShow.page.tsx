import { useEffect, type ReactElement } from 'react';
import { useCurrentSlide } from '../../communication/context/CurrentSlide.context.ts';
import { useSlideShow } from '../../communication/context/Slideshow.context.ts';
import { useCountdown } from '../../communication/context/Countdown.context.ts';
import { findNextSlideId } from '../../model/slides/SlideShow.ts';
import { SlideSectionComponent } from './SlideSection.component.tsx';
import { SlideShowBottomNav } from './SlideShowBottomNav.tsx';
import { QrCodeOverlay } from './QrCodeOverlay.component.tsx';

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

    useEffect(() => {
        document.documentElement.setAttribute('data-bs-theme', slideshow.darkMode === true ? 'dark' : 'light');
        return () => document.documentElement.removeAttribute('data-bs-theme');
    }, [slideshow.darkMode]);

    const renderSlide = (): ReactElement => {
        if (!currentSlide) {
            return (
                <div className="d-flex justify-content-center align-items-center w-100 h-100 text-muted fs-4">
                    No slide selected
                </div>
            );
        }
        return (
            <div className="d-flex flex-column w-100 h-100 overflow-hidden position-relative">
                {currentSlide.headline && (
                    <div
                        className="flex-shrink-0 m-3 px-3 py-2 rounded fs-3 text-white bg-dark bg-opacity-50 text-center"
                    >
                        {currentSlide.headline}
                    </div>
                )}
                <div className="d-flex flex-grow-1 overflow-hidden">
                    {currentSlide.sections.map((section, index) => (
                        <SlideSectionComponent key={index} section={section} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex-grow-1 overflow-hidden position-relative">
                {renderSlide()}
                {currentSlide?.qrCode && <QrCodeOverlay qrCode={currentSlide.qrCode} darkMode={slideshow.darkMode} />}
            </div>
            <SlideShowBottomNav
                slideShow={slideshow}
                currentSlideId={currentSlide?.slideId}
                countdown={countdown}
                onNextSlide={() => setCurrentSlideId(findNextSlideId(slideshow, currentSlide?.slideId))}
            />
        </div>
    );
};
