import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useAppEventBus } from './AppEventBus.ts';
import type { SlideShow } from '../model/slides/SlideShow.ts';
import type { AppId } from '../model/identifier/AppId.ts';
import { Temporal } from '@js-temporal/polyfill';
import { countdownTimeFromStorage, currentSlideIdFromStorage, slideShowFromStorage } from './LocalStorage.ts';
import { FALLBACK_SLIDESHOW, SlideShowContext, type SlideShowState } from './context/Slideshow.context.ts';
import { CurrentSlideContext, type CurrentSlideState } from './context/CurrentSlide.context.ts';
import { CountdownContext, type CountdownState } from './context/Countdown.context.ts';

type Props = {
    children?: ReactElement | ReactElement[]
};

export const AppState = ({ children }: Props): ReactElement => {
    const eventBus = useAppEventBus();

    // Prepare the local state for this app!
    const [localSlideShow, setLocalSlideShow] = useState<SlideShow>(() => slideShowFromStorage() || FALLBACK_SLIDESHOW);
    const [localCurrentSlide, setLocalCurrentSlide] = useState<AppId | null>(() => currentSlideIdFromStorage());
    const [localCountdown, setLocalCountdown] = useState<Temporal.PlainDateTime | null>(() => countdownTimeFromStorage());

    // Add setters with attachment to the eventbus
    const setSlideShow = useCallback((slide: SlideShow) => {
        setLocalSlideShow(slide);
        // TODO send event
    }, [setLocalSlideShow]);
    const setCurrentSlide = useCallback((slideId: AppId | null) => {
        setLocalCurrentSlide(slideId);
        // TODO send event
    }, [setLocalCurrentSlide]);
    const setCountdown = useCallback((countdown: Temporal.PlainDateTime | null) => {
        setLocalCountdown(countdown);
        // TODO send event
    }, [setLocalCountdown]);

    // Attach listeners for the remote events!
    useEffect(() => {
        // TODO register listeners!
        eventBus.registerListener('app-slide-show', 'replace-slideshow', () => {});
    }, [setLocalSlideShow, setLocalCurrentSlide, setLocalCountdown, eventBus]);

    // Memoize the state tuples for the rest of the app
    const slideShowState: SlideShowState = useMemo(() => [localSlideShow, setSlideShow],
        [localSlideShow, setSlideShow]);
    const currentSlideState: CurrentSlideState = useMemo(() => [localCurrentSlide, setCurrentSlide],
        [localCurrentSlide, setCurrentSlide]);
    const countdownState: CountdownState = useMemo(() => [localCountdown, setCountdown],
        [localCountdown, setCountdown]);

    return (
        <SlideShowContext.Provider value={slideShowState}>
            <CurrentSlideContext.Provider value={currentSlideState}>
                <CountdownContext.Provider value={countdownState}>
                    {children}
                </CountdownContext.Provider>
            </CurrentSlideContext.Provider>
        </SlideShowContext.Provider>
    );
};
