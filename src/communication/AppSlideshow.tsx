import { type ReactElement, useCallback, useEffect, useState } from 'react';
import { useAppEventBus } from './AppEventBus.ts';
import type { SlideShow } from '../model/slides/SlideShow.ts';
import { AppSlideshowContext, FALLBACK_SLIDESHOW, type SlideshowSetter } from './SlideshowContext.ts';
import { loadSlideshowFromStorage, storeSlideshowToStorage } from './SlideshowLoader.ts';
import { type AppEvent, replaceSlideshowEvent } from '../model/event/Event.ts';

type Props = {
    children?: ReactElement | ReactElement[]
};

/**
 * Provides access to the current slideshow for all child components
 * @constructor
 */
export const AppSlideshow = ({ children }: Props): ReactElement => {
    // Attach to the eventbus
    const eventBus = useAppEventBus();

    // Keep the slideshow in a local state, initalized from storage or fallback
    const [slideshow, setLocalSlideshow] = useState<SlideShow>(
        () => loadSlideshowFromStorage() ?? FALLBACK_SLIDESHOW,
    );

    // When updated the local slideshow, also store it and notify the event bus
    const setSlideshow: SlideshowSetter = useCallback((newSlideshow: SlideShow) => {
        setLocalSlideshow(newSlideshow);
        storeSlideshowToStorage(newSlideshow);
        eventBus.dispatchEvent(replaceSlideshowEvent(newSlideshow, true));
    }, [eventBus, setLocalSlideshow]);

    // Build the listener to update the slideshow based on remote data
    const remoteEventListener = useCallback((event: AppEvent<SlideShow>) => {
        if (event.remoteOnly) {
            setLocalSlideshow(event.payload);
        }
    }, [setLocalSlideshow]);

    // Auto-Attach the listener to the event bus!
    useEffect(() => {
        eventBus.registerListener('global-slideshow-listener', 'replace-slideshow', remoteEventListener);
    }, [remoteEventListener, eventBus]);

    return (
        <AppSlideshowContext.Provider value={[slideshow, setSlideshow]}>
            {children}
        </AppSlideshowContext.Provider>
    );
};
