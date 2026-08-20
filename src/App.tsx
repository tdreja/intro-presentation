import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { AppEventBus, AppEventContext, type ChannelListener } from './communication/AppEventBus.ts';
import { PLACEHOLDER_IMAGE } from './model/slides/Image.ts';
import { findSlide, type SlideShow } from './model/slides/SlideShow.ts';
import { type AppId, newAppId } from './model/identifier/AppId.ts';
import type { Countdown } from './model/slides/Countdown.ts';
import {
    countdownFromStorage,
    countdownToStorage,
    currentSlideIdFromStorage,
    currentSlideIdToStorage,
    slideShowFromStorage,
    slideShowToStorage,
} from './communication/LocalStorage.ts';
import { FALLBACK_SLIDESHOW, SlideShowContext, type SlideShowState } from './communication/context/Slideshow.context.ts';
import { CurrentSlideContext, type CurrentSlideState } from './communication/context/CurrentSlide.context.ts';
import { CountdownContext, type CountdownState } from './communication/context/Countdown.context.ts';
import { type AppEvent, goToSlideEvent, replaceSlideshowEvent, updateCountdownEvent } from './model/event/Event.ts';

const channel: BroadcastChannel = new BroadcastChannel('intro-presentation-channel');
let lastListener: ChannelListener = () => {
};

export const App = (): ReactElement => {
    const [source] = useState<AppId>(() => newAppId('app'));

    // Set up the event bus
    const [eventBus] = useState<AppEventBus>(() => {
        const bus = new AppEventBus(channel, lastListener);
        lastListener = bus.channelListener;
        return bus;
    });

    // Prepare the local state for this app!
    const [localSlideShow, setLocalSlideShow] = useState<SlideShow>(() => slideShowFromStorage() || FALLBACK_SLIDESHOW);
    const [localCurrentSlide, setLocalCurrentSlide] = useState<AppId | null>(() => currentSlideIdFromStorage());
    const [localCountdown, setLocalCountdown] = useState<Countdown | null>(() => countdownFromStorage());

    // Add setters with attachment to the eventbus
    const setSlideShow = useCallback((slide: SlideShow) => {
        setLocalSlideShow(slide);
        slideShowToStorage(slide);
        eventBus.dispatchEvent(replaceSlideshowEvent(source, slide));
    }, [eventBus, source, setLocalSlideShow]);
    const setCurrentSlide = useCallback((slideId: AppId | null) => {
        setLocalCurrentSlide(slideId);
        if (slideId) {
            currentSlideIdToStorage(slideId);
        }
        eventBus.dispatchEvent(goToSlideEvent(source, slideId));
    }, [eventBus, source, setLocalCurrentSlide]);
    const setCountdown = useCallback((countdown: Countdown | null) => {
        setLocalCountdown(countdown);
        if (countdown) {
            countdownToStorage(countdown);
        }
        eventBus.dispatchEvent(updateCountdownEvent(source, countdown));
    }, [eventBus, source, setLocalCountdown]);

    // Attach listeners for the remote events!
    useEffect(() => {
        eventBus.registerListener('app-slide-show', 'replace-slideshow', (ev: AppEvent<SlideShow>) => {
            if (ev.source !== source) {
                setLocalSlideShow(ev.payload);
            }
        });
        eventBus.registerListener('app-count-down', 'update-countdown', (ev: AppEvent<Countdown | null>) => {
            if (ev.source !== source) {
                setLocalCountdown(ev.payload);
            }
        });
        eventBus.registerListener('app-current-slide', 'go-to-slide', (ev: AppEvent<AppId | null>) => {
            if (ev.source !== source) {
                setLocalCurrentSlide(ev.payload);
            }
        });
    }, [source, setLocalSlideShow, setLocalCurrentSlide, setLocalCountdown, eventBus]);

    // Memoize the state tuples for the rest of the app
    const slideShowState: SlideShowState = useMemo(() => [localSlideShow, setSlideShow],
        [localSlideShow, setSlideShow]);
    const currentSlideState: CurrentSlideState = useMemo(() => [findSlide(localSlideShow, localCurrentSlide), setCurrentSlide],
        [localSlideShow, localCurrentSlide, setCurrentSlide]);
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
