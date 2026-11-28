import type { ReactElement } from 'react';
import type { AppId } from '../../model/identifier/AppId.ts';
import type { Slide } from '../../model/slides/Slide.ts';
import { SlideComponent } from '../slideshow/Slide.component.tsx';
import { useI18n } from '../../i18n/I18N.ts';

/**
 * Must match the width of the thumbnail box: --overview-width minus the padding of the list.
 */
const THUMBNAIL_WIDTH = 224;

type Props = {
    slides: Slide[]
    selectedSlideId: AppId | null
    darkMode?: boolean | null
    onSelect: (slideId: AppId) => void
    onAdd: () => void
    onDuplicate: (slideId: AppId) => void
    onRemove: (slideId: AppId) => void
    onMove: (slideId: AppId, direction: -1 | 1) => void
};

/**
 * Vertical list of all slides as thumbnails, with controls to add, duplicate, remove and reorder them.
 */
export const SlideOverview = ({ slides, selectedSlideId, darkMode, onSelect, onAdd, onDuplicate, onRemove, onMove }: Props): ReactElement => {
    const labels = useI18n().slideOverview;
    return (
        <div className="d-flex flex-column gap-3 p-3">
            {slides.map((slide, index) => {
                const selected = slide.slideId === selectedSlideId;
                return (
                    <div key={slide.slideId} className="d-flex flex-column gap-1">
                        <div
                            role="button"
                            tabIndex={0}
                            aria-label={labels.ariaSelectSlide(index + 1)}
                            aria-current={selected ? 'true' : undefined}
                            className={`rounded overflow-hidden bg-body border border-3 ${selected ? 'border-primary' : 'border-secondary-subtle'}`}
                            style={{ width: THUMBNAIL_WIDTH + 6 }}
                            onClick={() => onSelect(slide.slideId)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    onSelect(slide.slideId);
                                }
                            }}
                        >
                            <div className="slide-thumbnail">
                                {/* Scaled like in the slideshow, so the thumbnail looks like the real slide */}
                                <SlideComponent slide={slide} scale={THUMBNAIL_WIDTH / slide.width} darkMode={darkMode} />
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                            <span className="small text-body-secondary me-auto">{index + 1}</span>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary py-0"
                                disabled={index === 0}
                                onClick={() => onMove(slide.slideId, -1)}
                                aria-label={labels.ariaMoveUp}
                                title={labels.tooltipMoveUp}
                            >
                                &#8593;
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary py-0"
                                disabled={index === slides.length - 1}
                                onClick={() => onMove(slide.slideId, 1)}
                                aria-label={labels.ariaMoveDown}
                                title={labels.tooltipMoveDown}
                            >
                                &#8595;
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary py-0"
                                onClick={() => onDuplicate(slide.slideId)}
                                aria-label={labels.tooltipDuplicate}
                                title={labels.tooltipDuplicate}
                            >
                                &#128203;
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-danger py-0"
                                disabled={slides.length <= 1}
                                onClick={() => onRemove(slide.slideId)}
                                aria-label={labels.tooltipDelete}
                                title={labels.tooltipDelete}
                            >
                                &#128465;
                            </button>
                        </div>
                    </div>
                );
            })}
            <button type="button" className="btn btn-outline-primary" onClick={onAdd}>
                +
                {' '}
                {labels.actionNewSlide}
            </button>
        </div>
    );
};
