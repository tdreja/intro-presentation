import type { ReactElement } from 'react';
import { useCurrentSlide } from '../../communication/context/CurrentSlide.context.ts';
import type { FullImageSlide, HalfTextHalfImageSlide } from '../../model/slides/Slide.ts';
import { FullImageSlideComponent } from './FullImageSlide.component.tsx';
import { HalfTextHalfImageSlideComponent } from './HalfTextHalfImageSlide.component.tsx';

export const SlideShowPage = (): ReactElement => {
    const [currentSlide] = useCurrentSlide();

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
            <nav
                className="navbar bg-body-secondary border-top flex-shrink-0"
                style={{ height: 'var(--navbar-height)' }}
            />
        </div>
    );
};
