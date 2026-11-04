import { type ReactElement, useState } from 'react';
import { useSlideShow } from '../../communication/context/Slideshow.context.ts';
import { useCurrentSlide } from '../../communication/context/CurrentSlide.context.ts';
import { useCountdown } from '../../communication/context/Countdown.context.ts';
import { downloadPresentation } from '../../download/PresentationDownload.ts';
import type { AppId } from '../../model/identifier/AppId.ts';
import { findSlide, indexOfSlide } from '../../model/slides/SlideShow.ts';
import type { Slide } from '../../model/slides/Slide.ts';
import { addSlide, createSlide, moveSlide, removeSlide, replaceSlide } from '../../model/slides/SlideEditing.ts';
import { SlideOverview } from './SlideOverview.component.tsx';
import { CountdownSettings } from './CountdownSettings.component.tsx';
import { SliceRow } from './SliceRow.component.tsx';

type Props = {
    onClose: () => void
};

/**
 * Editor mode: slide overview on the left, slices of the selected slide on the right.
 */
export const EditorPage = ({ onClose }: Props): ReactElement => {
    const [slideShow, setSlideShow] = useSlideShow();
    const [currentSlide] = useCurrentSlide();
    const [countdown] = useCountdown();
    const [selectedSlideId, setSelectedSlideId] = useState<AppId | null>(
        () => currentSlide?.slideId ?? slideShow.slides[0]?.slideId ?? null,
    );
    const selectedSlide = findSlide(slideShow, selectedSlideId) ?? slideShow.slides[0] ?? null;

    const onAddSlide = () => {
        const slide = createSlide();
        setSlideShow(addSlide(slideShow, slide));
        setSelectedSlideId(slide.slideId);
    };
    const onRemoveSlide = (slideId: AppId) => {
        const updated = removeSlide(slideShow, slideId);
        if (updated === slideShow) {
            return;
        }
        if (slideId === selectedSlide?.slideId) {
            // Select the neighbour that takes the removed slide's place
            const index = Math.min(indexOfSlide(slideShow, slideId), updated.slides.length - 1);
            setSelectedSlideId(updated.slides[index].slideId);
        }
        setSlideShow(updated);
    };
    const onMoveSlide = (slideId: AppId, direction: -1 | 1) => setSlideShow(moveSlide(slideShow, slideId, direction));
    const onChangeSlide = (slide: Slide) => setSlideShow(replaceSlide(slideShow, slide));

    return (
        <div className="d-flex flex-column" style={{ height: '100vh' }}>
            <nav
                className="navbar bg-body-secondary border-bottom flex-shrink-0 px-3"
                style={{ height: 'var(--navbar-height)' }}
            >
                <span className="navbar-brand mb-0 h1 fs-5">Slideshow editor</span>
                <div className="d-flex gap-2">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => downloadPresentation(slideShow, countdown)}
                        title="Download this page with the current slideshow and countdown"
                    >
                        &#10515; Download
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
                        &#9654; Back to slideshow
                    </button>
                </div>
            </nav>
            <div className="d-flex flex-grow-1 overflow-hidden">
                <aside className="flex-shrink-0 d-flex flex-column border-end bg-body-tertiary" style={{ width: 'var(--overview-width)' }}>
                    <CountdownSettings />
                    <div className="flex-grow-1 overflow-auto">
                        <SlideOverview
                            slides={slideShow.slides}
                            selectedSlideId={selectedSlide?.slideId ?? null}
                            darkMode={slideShow.darkMode}
                            onSelect={setSelectedSlideId}
                            onAdd={onAddSlide}
                            onRemove={onRemoveSlide}
                            onMove={onMoveSlide}
                        />
                    </div>
                </aside>
                <main className="flex-grow-1 overflow-hidden">
                    {selectedSlide
                        ? (
                            <SliceRow
                                key={selectedSlide.slideId}
                                slide={selectedSlide}
                                darkMode={slideShow.darkMode}
                                onChange={onChangeSlide}
                            />
                        )
                        : (
                            <div className="d-flex justify-content-center align-items-center h-100 text-muted fs-4">
                                No slide selected
                            </div>
                        )}
                </main>
            </div>
        </div>
    );
};
