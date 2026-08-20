import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { AppEventBus, AppEventContext, type ChannelListener } from './communication/AppEventBus.ts';
import { PLACEHOLDER_IMAGE } from './model/slides/Image.ts';
import type { SlideShow } from './model/slides/SlideShow.ts';
import type { AppId } from './model/identifier/AppId.ts';
import { Temporal } from '@js-temporal/polyfill';
import { countdownTimeFromStorage, currentSlideIdFromStorage, slideShowFromStorage } from './communication/LocalStorage.ts';
import { FALLBACK_SLIDESHOW, SlideShowContext, type SlideShowState } from './communication/context/Slideshow.context.ts';
import { CurrentSlideContext, type CurrentSlideState } from './communication/context/CurrentSlide.context.ts';
import { CountdownContext, type CountdownState } from './communication/context/Countdown.context.ts';

const channel: BroadcastChannel = new BroadcastChannel('intro-presentation-channel');
let lastListener: ChannelListener = () => {
};

export const App = (): ReactElement => {
    // Set up the event bus
    const [eventBus] = useState<AppEventBus>(() => {
        const bus = new AppEventBus(channel, lastListener);
        lastListener = bus.channelListener;
        return bus;
    });

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
        <AppEventContext.Provider value={eventBus}>
            <SlideShowContext.Provider value={slideShowState}>
                <CurrentSlideContext.Provider value={currentSlideState}>
                    <CountdownContext.Provider value={countdownState}>
                        <p>Test</p>
                        <img src={PLACEHOLDER_IMAGE} alt="Placeholder" />
                    </CountdownContext.Provider>
                </CurrentSlideContext.Provider>
            </SlideShowContext.Provider>
        </AppEventContext.Provider>
    );
};
