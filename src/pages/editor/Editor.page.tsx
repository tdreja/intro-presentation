import { type ChangeEvent, type ReactElement, useId, useRef, useState } from 'react';
import Form from 'react-bootstrap/Form';
import { useSlideShow } from '../../communication/context/Slideshow.context.ts';
import { useCurrentSlide } from '../../communication/context/CurrentSlide.context.ts';
import { useCountdown } from '../../communication/context/Countdown.context.ts';
import { downloadPresentation, downloadPresentationJson, parsePresentationJson } from '../../download/PresentationDownload.ts';
import { type AppId, newAppId } from '../../model/identifier/AppId.ts';
import { findSlide, indexOfSlide } from '../../model/slides/SlideShow.ts';
import { createSlideId, type Slide } from '../../model/slides/Slide.ts';
import {
    addSlide,
    createSlide,
    duplicateSlide,
    moveSlide,
    removeSlide,
    replaceSlide,
    setDarkMode,
    touchSlideShow,
} from '../../model/slides/SlideEditing.ts';
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
    const [countdown, setCountdown] = useCountdown();
    const darkModeId = useId();
    const importInputRef = useRef<HTMLInputElement>(null);
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
    const onImportJson = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Allow picking the same file again
        event.target.value = '';
        if (!file) {
            return;
        }
        file.text().then((text) => {
            const imported = parsePresentationJson(text);
            if (!imported) {
                window.alert(labels.errorImportJson);
                return;
            }
            // Fresh IDs, so the import wins over the current data in all tabs, even if the file is older
            const importedSlideShow = touchSlideShow(imported.slideShow, imported.slideShow.slides);
            setSlideShow(importedSlideShow);
            setSelectedSlideId(importedSlideShow.slides[0]?.slideId ?? null);
            if (imported.countdown) {
                setCountdown({ ...imported.countdown, countdownId: newAppId('countdown') });
            }
        }).catch(() => window.alert(labels.errorImportJson));
    };

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
                    <div className="btn-group">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-primary py-0 px-2"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => downloadPresentationJson(slideShow, countdown)}
                            title={labels.tooltipDownloadJson}
                        >
                            &#10515;
                            {' '}
                            {labels.actionDownloadJson}
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-primary py-0 px-2"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => importInputRef.current?.click()}
                            title={labels.tooltipImportJson}
                        >
                            &#10514;
                            {' '}
                            {labels.actionImportJson}
                        </button>
                    </div>
                    <input
                        ref={importInputRef}
                        type="file"
                        accept=".json,application/json"
                        className="d-none"
                        onChange={onImportJson}
                    />
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
