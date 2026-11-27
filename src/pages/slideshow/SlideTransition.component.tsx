import { type ReactElement, useState } from 'react';
import type { Slide } from '../../model/slides/Slide.ts';
import { SlideComponent } from './Slide.component.tsx';

type Props = {
    slide: Slide
    darkMode?: boolean | null
};

/**
 * Shows the slide and moves it in from the right when another slide takes its place, while the previous one leaves to the left.
 * Changes to the content of the same slide are shown without animation.
 */
export const SlideTransition = ({ slide, darkMode }: Props): ReactElement => {
    const [shown, setShown] = useState(slide);
    const [leaving, setLeaving] = useState<Slide | null>(null);

    // Adjusting state while rendering, so the old slide never disappears for a frame
    if (slide !== shown) {
        if (slide.slideId !== shown.slideId) {
            setLeaving(shown);
        }
        setShown(slide);
    }

    const layers = leaving && leaving.slideId !== shown.slideId ? [leaving, shown] : [shown];
    return (
        <div className="position-relative w-100 h-100 overflow-hidden">
            {layers.map((layer) => {
                const animation = layers.length === 1 ? '' : (layer === leaving ? 'slide-leave' : 'slide-enter');
                return (
                    // Keyed by ID, so the current slide keeps its DOM node when it starts leaving
                    <div
                        key={layer.slideId}
                        className={`position-absolute top-0 start-0 w-100 h-100 bg-body ${animation}`}
                        onAnimationEnd={(event) => {
                            // Ignore animations bubbling up from inside the slide
                            if (layer === leaving && event.target === event.currentTarget) {
                                setLeaving(null);
                            }
                        }}
                    >
                        <SlideComponent slide={layer} darkMode={darkMode} />
                    </div>
                );
            })}
        </div>
    );
};
