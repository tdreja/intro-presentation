import { type ReactElement, useCallback, useEffect, useState } from 'react';
import { importSlideShow, type JsonSlideShow, type SlideShow } from '../model/slides/SlideShow.ts';
import { loadSlideshowFromStorage, storeSlideshowToStorage } from './SlideshowLoader.ts';
import { AppSlideshowContext, FALLBACK_SLIDESHOW, type SlideshowSetter } from './SlideshowContext.ts';
import { useAppEventBus } from './AppEventBus.ts';
import type { AppEvent } from '../model/event/Event.ts';

type Props = {
    children?: ReactElement | ReactElement[]
};

const GLOBAL_SLIDE_SHOW_LISTENER = 'global-slideshow-listener';

/**
 * Provides access to the current slideshow for all child components
 * @constructor
 */
export const AppSlideshow = ({ children }: Props): ReactElement => {
    const eventBus = useAppEventBus();
    const [slideshow, setLocalSlideshow] = useState<SlideShow>(
        () => loadSlideshowFromStorage() ?? FALLBACK_SLIDESHOW,
    );
    const setSlideshow: SlideshowSetter = useCallback((newSlideshow: SlideShow) => {
        setLocalSlideshow(newSlideshow);
        storeSlideshowToStorage(newSlideshow);
        // TODO send event!
        // eventBus.dispatchEvent({});
    }, [setLocalSlideshow]);
    const listener = useCallback((event: AppEvent<JsonSlideShow>) => {
        const parsed = importSlideShow(event.payload);
        if (parsed) {
            setLocalSlideshow(parsed);
        }
    }, [setLocalSlideshow]);
    useEffect(() => {
        eventBus.registerListener(GLOBAL_SLIDE_SHOW_LISTENER, listener);
    }, [listener, eventBus]);
    return (
        <AppSlideshowContext.Provider value={[slideshow, setSlideshow]}>
            {children}
        </AppSlideshowContext.Provider>
    );
};
