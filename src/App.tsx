import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { AppEventBus, AppEventContext } from './communication/AppEventBus.ts';
import { findSlide, pickNewest, SLIDE_SHOW_CONVERTER, type SlideShow } from './model/slides/SlideShow.ts';
import { type AppId, newAppId } from './model/identifier/AppId.ts';
import {
    type Countdown,
    COUNTDOWN_CONVERTER,
    FALLBACK_COUNTDOWN,
    pickNewestAllowedCountdown,
} from './model/slides/Countdown.ts';
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
import { SlideShowPage } from './pages/slideshow/SlideShow.page.tsx';

export const App = (): ReactElement => {
    const [source] = useState<AppId>(() => newAppId('app'));

    // Set up the event bus — channel is created here so eventBus always owns it
    const [eventBus] = useState<AppEventBus>(() => {
        const channel = new BroadcastChannel('intro-presentation-channel');
        return new AppEventBus(channel);
    });

    // Prepare the local state for this app!
    const [localSlideShow, setLocalSlideShow] = useState<SlideShow>(() => {
        const fromHtml = SLIDE_SHOW_CONVERTER.fromJson(window.startupSlideShow);
        return pickNewest(slideShowFromStorage(), fromHtml) ?? FALLBACK_SLIDESHOW;
    });
    const [localCurrentSlide, setLocalCurrentSlide] = useState<AppId | null>(() => currentSlideIdFromStorage());
    const [localCountdown, setLocalCountdown] = useState<Countdown>(() => {
        const fromHtml = COUNTDOWN_CONVERTER.fromJson(window.startupCountdown);
        const fromStorage = countdownFromStorage();
        return pickNewestAllowedCountdown(fromHtml, fromStorage) ?? FALLBACK_COUNTDOWN;
    });

    // Add setters with attachment to the eventbus
    const setSlideShow = useCallback((slide: SlideShow) => {
        setLocalSlideShow(slide);
        slideShowToStorage(slide);
        eventBus.dispatchEvent(replaceSlideshowEvent(source, slide));
    }, [eventBus, source, setLocalSlideShow]);
    const setCurrentSlide = useCallback((slideId: AppId | null) => {
        console.log('Setting current slide to', slideId);
        setLocalCurrentSlide(slideId);
        currentSlideIdToStorage(slideId);
        eventBus.dispatchEvent(goToSlideEvent(source, slideId));
    }, [eventBus, source, setLocalCurrentSlide]);
    const setCountdown = useCallback((countdown: Countdown) => {
        setLocalCountdown(countdown);
        countdownToStorage(countdown);
        eventBus.dispatchEvent(updateCountdownEvent(source, countdown));
    }, [eventBus, source, setLocalCountdown]);

    // Attach listeners for the remote events!
    useEffect(() => {
        eventBus.registerListener('app-slide-show', 'replace-slideshow', (ev: AppEvent<SlideShow>) => {
            console.log('Received replace-slideshow event', source, ev);
            if (ev.source !== source) {
                setLocalSlideShow(ev.payload);
            }
        });
        eventBus.registerListener('app-count-down', 'update-countdown', (ev: AppEvent<Countdown>) => {
            console.log('Received update-countdown event', source, ev);
            if (ev.source !== source) {
                setLocalCountdown(ev.payload);
            }
        });
        eventBus.registerListener('app-current-slide', 'go-to-slide', (ev: AppEvent<AppId | null>) => {
            console.log('Received go-to-slide event', source, ev);
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
                        <SlideShowPage />
                    </CountdownContext.Provider>
                </CurrentSlideContext.Provider>
            </SlideShowContext.Provider>
        </AppEventContext.Provider>
    );
};
