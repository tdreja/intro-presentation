import type { ReactElement } from 'react';
import type { AppId } from '../../model/identifier/AppId.ts';
import type { Slide } from '../../model/slides/Slide.ts';
import { SlideComponent } from '../slideshow/Slide.component.tsx';

/**
 * Slides are rendered at this size and scaled down, so thumbnails look like the real slide.
 */
const RENDER_WIDTH = 1280;
const RENDER_HEIGHT = 720;
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
    onRemove: (slideId: AppId) => void
    onMove: (slideId: AppId, direction: -1 | 1) => void
};

/**
 * Vertical list of all slides as thumbnails, with controls to add, remove and reorder them.
 */
export const SlideOverview = ({ slides, selectedSlideId, darkMode, onSelect, onAdd, onRemove, onMove }: Props): ReactElement => (
    <div className="d-flex flex-column gap-3 p-3">
        {slides.map((slide, index) => {
            const selected = slide.slideId === selectedSlideId;
            return (
                <div key={slide.slideId} className="d-flex flex-column gap-1">
                    <div
                        role="button"
                        tabIndex={0}
                        aria-label={`Select slide ${index + 1}`}
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
                        <div className="slide-thumbnail position-relative" style={{ width: THUMBNAIL_WIDTH }}>
                            <div
                                className="position-absolute top-0 start-0"
                                style={{
                                    width: RENDER_WIDTH,
                                    height: RENDER_HEIGHT,
                                    transform: `scale(${THUMBNAIL_WIDTH / RENDER_WIDTH})`,
                                    transformOrigin: 'top left',
                                }}
                            >
                                <SlideComponent slide={slide} darkMode={darkMode} />
                            </div>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                        <span className="small text-body-secondary me-auto">{index + 1}</span>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-0"
                            disabled={index === 0}
                            onClick={() => onMove(slide.slideId, -1)}
                            aria-label="Move slide up"
                            title="Move up"
                        >
                            &#8593;
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-0"
                            disabled={index === slides.length - 1}
                            onClick={() => onMove(slide.slideId, 1)}
                            aria-label="Move slide down"
                            title="Move down"
                        >
                            &#8595;
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-0"
                            disabled={slides.length <= 1}
                            onClick={() => onRemove(slide.slideId)}
                            aria-label="Delete slide"
                            title="Delete slide"
                        >
                            &#128465;
                        </button>
                    </div>
                </div>
            );
        })}
        <button type="button" className="btn btn-outline-primary" onClick={onAdd}>
            + New slide
        </button>
    </div>
);
