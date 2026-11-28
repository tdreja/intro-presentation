import { type ReactElement, useId, useState } from 'react';
import Form from 'react-bootstrap/Form';
import { useSlideShow } from '../../communication/context/Slideshow.context.ts';
import { useCurrentSlide } from '../../communication/context/CurrentSlide.context.ts';
import { useCountdown } from '../../communication/context/Countdown.context.ts';
import { downloadPresentation } from '../../download/PresentationDownload.ts';
import type { AppId } from '../../model/identifier/AppId.ts';
import { findSlide, indexOfSlide } from '../../model/slides/SlideShow.ts';
import { createSlideId, type Slide } from '../../model/slides/Slide.ts';
import { addSlide, createSlide, duplicateSlide, moveSlide, removeSlide, replaceSlide, setDarkMode } from '../../model/slides/SlideEditing.ts';
import { SlideOverview } from './SlideOverview.component.tsx';
import { CountdownSettings } from './CountdownSettings.component.tsx';
import { SlideEditor } from './SlideEditor.component.tsx';
import { useI18n } from '../../i18n/I18N.ts';

type Props = {
    onClose: () => void
};

/**
 * Editor mode: slide overview on the left, the selected slide with its areas on the right.
 */
export const EditorPage = ({ onClose }: Props): ReactElement => {
    const [slideShow, setSlideShow] = useSlideShow();
    const [currentSlide] = useCurrentSlide();
    const [countdown] = useCountdown();
    const darkModeId = useId();
    const allLabels = useI18n();
    const labels = allLabels.editor;
    const [selectedSlideId, setSelectedSlideId] = useState<AppId | null>(
        () => currentSlide?.slideId ?? slideShow.slides[0]?.slideId ?? null,
    );
    const selectedSlide = findSlide(slideShow, selectedSlideId) ?? slideShow.slides[0] ?? null;

    const onAddSlide = () => {
        const slide = createSlide(allLabels.defaults.newText);
        setSlideShow(addSlide(slideShow, slide));
        setSelectedSlideId(slide.slideId);
    };
    const onDuplicateSlide = (slideId: AppId) => {
        const copyId = createSlideId();
        const updated = duplicateSlide(slideShow, slideId, copyId);
        if (updated !== slideShow) {
            setSlideShow(updated);
            setSelectedSlideId(copyId);
        }
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
                <span className="navbar-brand mb-0 h1 fs-5">{labels.title}</span>
                <div className="d-flex align-items-center gap-2">
                    <Form.Check
                        type="switch"
                        id={darkModeId}
                        className="mb-0 me-2"
                        label={labels.labelDarkMode}
                        checked={slideShow.darkMode === true}
                        onChange={event => setSlideShow(setDarkMode(slideShow, event.target.checked))}
                    />
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => downloadPresentation(slideShow, countdown)}
                        title={labels.tooltipDownload}
                    >
                        &#10515;
                        {' '}
                        {labels.actionDownload}
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
                        &#9654;
                        {' '}
                        {labels.actionBackToSlideshow}
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
                            onDuplicate={onDuplicateSlide}
                            onRemove={onRemoveSlide}
                            onMove={onMoveSlide}
                        />
                    </div>
                </aside>
                <main className="flex-grow-1 overflow-hidden">
                    {selectedSlide
                        ? (
                            <SlideEditor
                                key={selectedSlide.slideId}
                                slide={selectedSlide}
                                darkMode={slideShow.darkMode}
                                onChange={onChangeSlide}
                            />
                        )
                        : (
                            <div className="d-flex justify-content-center align-items-center h-100 text-muted fs-4">
                                {labels.noSlideSelected}
                            </div>
                        )}
                </main>
            </div>
        </div>
    );
};
