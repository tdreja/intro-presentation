import { type ReactElement, useState } from 'react';
import type { SlideShow } from '../model/slides/SlideShow.ts';
import { loadSlideshowFromStorage } from './SlideshowLoader.ts';
import { AppSlideshowContext, FALLBACK_SLIDESHOW } from './SlideshowContext.ts';

type Props = {
    children?: ReactElement | ReactElement[]
};

/**
 * Provides access to the current slideshow for all child components
 * @constructor
 */
export const AppSlideshow = ({ children }: Props): ReactElement => {
    const state = useState<SlideShow>(
        () => loadSlideshowFromStorage() ?? FALLBACK_SLIDESHOW,
    );
    return (
        <AppSlideshowContext.Provider value={state}>
            {children}
        </AppSlideshowContext.Provider>
    );
};
